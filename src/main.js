// US Construction Contractor & Subcontractor Finder: Apify Actor entry point.
//
// 1. Read the input (trades, location, filters).
// 2. Search each directory (Procore Network, SBA small business search) for
//    the picked trades in the picked states.
// 3. Merge duplicates across directories, look up missing phone numbers, and
//    push one row per company, charging the "company" pay-per-event event.

import { pathToFileURL } from 'node:url';
import { Actor, log } from 'apify';
import { TRADES, TRADE_IDS, COMPANY_TYPES, CERTIFICATION_IDS, naicsFor } from './trades.js';
import { US_STATES, looksLikePersonName, formatPhone, phoneDigits } from './normalize.js';
import { zipCentroid, isKnownZip, distanceMiles, statesWithinRadius } from './geo.js';
import { Deduper } from './dedupe.js';
import { mapPool } from './http.js';
import { searchProcore, mapProcoreCompany, fetchProcorePhone, PROCORE_SOURCE } from './sources/procore.js';
import { searchSba, mapSbaRecord, OTHER_SPECIALTY_NAICS, SBA_SOURCE } from './sources/sba.js';

export const CHARGE_EVENT = 'company';

/** When Apify will stop the run, minus a margin for saving. Null locally. */
export function runDeadline(env = process.env, marginMs = 60_000) {
    const at = Date.parse(env.ACTOR_TIMEOUT_AT ?? env.APIFY_TIMEOUT_AT ?? '');
    return Number.isFinite(at) ? at - marginMs : null;
}

const clampInt = (v, def, lo, hi) => {
    const n = Number(v ?? def);
    return Number.isFinite(n) ? Math.max(lo, Math.min(Math.round(n), hi)) : def;
};

/** Validates and fills defaults. Throws a plain-language message on bad input. */
export function parseInput(raw = {}) {
    const trades = [...new Set((raw.trades ?? ['structural_steel']).filter(Boolean))];
    if (!trades.length) throw new Error('Pick at least one trade.');
    const badTrades = trades.filter((t) => !TRADES[t]);
    if (badTrades.length) throw new Error(`Unknown trade: ${badTrades.join(', ')}. Use one of ${TRADE_IDS.join(', ')}.`);

    const states = [...new Set((raw.states ?? []).map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
    const badStates = states.filter((s) => !US_STATES[s]);
    if (badStates.length) throw new Error(`Unknown state code: ${badStates.join(', ')}. Use two-letter codes such as OH.`);

    const zipCode = raw.zipCode ? String(raw.zipCode).trim().slice(0, 5) : null;
    if (zipCode && !isKnownZip(zipCode)) throw new Error(`ZIP code ${zipCode} was not found. Use a 5-digit US ZIP code.`);
    const radiusMiles = Number(raw.radiusMiles ?? 50);
    if (zipCode && !(radiusMiles > 0 && radiusMiles <= 300)) throw new Error('Radius must be between 1 and 300 miles.');
    if (!zipCode && !states.length) throw new Error('Pick at least one state, or a ZIP code and radius.');

    const companyTypes = (raw.companyTypes ?? []).filter(Boolean);
    const badTypes = companyTypes.filter((t) => !COMPANY_TYPES.includes(t));
    if (badTypes.length) throw new Error(`Unknown company type: ${badTypes.join(', ')}. Use one of ${COMPANY_TYPES.join(', ')}.`);

    const certifications = (raw.certifications ?? []).filter(Boolean);
    const badCerts = certifications.filter((c) => !CERTIFICATION_IDS.includes(c));
    if (badCerts.length) throw new Error(`Unknown certification: ${badCerts.join(', ')}. Use one of ${CERTIFICATION_IDS.join(', ')}.`);

    return {
        trades,
        states,
        zipCode,
        radiusMiles,
        companyTypes,
        certifications,
        requirePhone: raw.requirePhone === true,
        includeOutOfState: raw.includeOutOfState === true,
        includeProcore: raw.includeProcore !== false,
        includeSba: raw.includeSba !== false,
        lookUpPhones: raw.lookUpPhones !== false,
        maxPhoneLookups: clampInt(raw.maxPhoneLookups, 3000, 0, 50_000),
        maxResults: clampInt(raw.maxResults, 1000, 1, 100_000),
    };
}

/** Location test for an input: rec => boolean (and sets rec._distance for ZIP searches). */
export function locationFilter(input) {
    if (input.zipCode) {
        const centre = zipCentroid(input.zipCode);
        return {
            centre,
            test: (rec) => {
                const p = rec._point ?? zipCentroid(rec.zip);
                if (!p) return false;
                rec._distance = distanceMiles(centre, p);
                return rec._distance <= input.radiusMiles;
            },
        };
    }
    const set = new Set(input.states);
    return {
        centre: null,
        test: (rec) => set.has(rec.state) || (input.includeOutOfState && rec.service_areas.some((a) => set.has(a.slice(-2)))),
    };
}

/**
 * General contractors: a company counts as one only when the directory says
 * so (Procore business type, or the Blue Book general-contractor section).
 * Many trade firms also list "project management", which is not the same.
 */
export function settleGeneralContractor(rec) {
    const isGc = rec.company_types.includes('general_contractor');
    if (isGc && !rec.trades.includes('general_contractor')) rec.trades.unshift('general_contractor');
    if (!isGc) rec.trades = rec.trades.filter((t) => t !== 'general_contractor');
    return rec;
}

/** Trade, type and certification filters. */
export function qualifies(rec, input) {
    if (!rec.trades.some((t) => input.trades.includes(t))) return false;
    if (input.companyTypes.length && !rec.company_types.some((t) => input.companyTypes.includes(t))) return false;
    if (input.certifications.length && !rec.certifications.some((c) => input.certifications.includes(c))) return false;
    return true;
}

/** Final output row with a fixed field order and no internal fields. */
export function toOutputRow(rec, input) {
    return {
        company_name: rec.company_name,
        company_types: rec.company_types,
        matched_trades: rec.trades.filter((t) => input.trades.includes(t)),
        trades: rec.trades,
        trade_details: rec.trade_details,
        phone: rec.phone,
        email: rec.email ?? null,
        website: rec.website,
        street: rec.street,
        city: rec.city,
        state: rec.state,
        zip: rec.zip,
        latitude: rec._point?.[0] ?? null,
        longitude: rec._point?.[1] ?? null,
        distance_miles: input.zipCode && rec._distance != null ? Math.round(rec._distance * 10) / 10 : null,
        service_areas: rec.service_areas,
        construction_sectors: rec.construction_sectors,
        certifications: rec.certifications,
        company_size: rec.company_size,
        avg_contract_size: rec.avg_contract_size ?? null,
        bonding_per_contract: rec.bonding_per_contract ?? null,
        bonding_aggregate: rec.bonding_aggregate ?? null,
        year_founded: rec.year_founded ?? null,
        naics_primary: rec.naics_primary ?? null,
        uei: rec.uei ?? null,
        cage_code: rec.cage_code ?? null,
        description: rec.description,
        sources: rec.sources,
        scraped_at: rec.scraped_at,
    };
}

/** Best leads first: more matched trades, then a phone and website, then listed in both directories. */
export function rank(rows) {
    const score = (r) => r.matched_trades.length * 10 + (r.phone ? 3 : 0) + (r.website ? 2 : 0) + (r.sources.length > 1 ? 2 : 0);
    return rows.sort((a, b) => score(b) - score(a) || (a.distance_miles ?? 0) - (b.distance_miles ?? 0) || a.company_name.localeCompare(b.company_name));
}

export async function collect(input, { log: logger = log, deadline = runDeadline() } = {}) {
    const outOfTime = () => deadline != null && Date.now() > deadline;
    let warnedTime = false;
    const stopIfLate = (what) => () => {
        if (!outOfTime()) return false;
        if (!warnedTime) logger.warning(`Running out of time: skipping the rest of the ${what}. Raise the run timeout to get everything.`);
        warnedTime = true;
        return true;
    };
    const scrapedAt = new Date().toISOString();
    const where = locationFilter(input);
    const deduper = new Deduper();
    const stat = () => ({ pages: 0, companies_seen: 0, kept: 0, errors: 0, last_error: null });
    const stats = { [PROCORE_SOURCE]: stat(), [SBA_SOURCE]: stat(), phone_lookups: { tried: 0, found: 0 } };
    const fail = (source, err, what) => {
        stats[source].errors++;
        stats[source].last_error = err.message;
        logger.warning(`${what} failed: ${err.message}`);
    };

    const add = (source, rec) => {
        if (!rec?.company_name || looksLikePersonName(rec.company_name)) return;
        settleGeneralContractor(rec);
        if (!where.test(rec) || !qualifies(rec, input)) return;
        deduper.add(rec);
        stats[source].kept++;
    };

    // A ZIP radius can cross state lines, so search every state it touches.
    const searchStates = input.zipCode ? statesWithinRadius(where.centre, input.radiusMiles) : input.states;

    const runProcore = async () => {
        if (!input.includeProcore) return;
        const urlKeys = [...new Set(input.trades.flatMap((t) => TRADES[t].procore))];
        const jobs = urlKeys.flatMap((key) => searchStates.map((state) => ({ key, state })));
        logger.info(`Procore Network: ${jobs.length} trade/state searches`);
        await mapPool(jobs, 2, async ({ key, state }) => {
            try {
                const { results, pages } = await searchProcore(state, key, { log: logger, shouldStop: stopIfLate('directory searches') });
                stats[PROCORE_SOURCE].pages += pages;
                stats[PROCORE_SOURCE].companies_seen += results.length;
                for (const c of results) add(PROCORE_SOURCE, mapProcoreCompany(c, scrapedAt));
            } catch (err) {
                fail(PROCORE_SOURCE, err, `Procore ${key} in ${state}`);
            }
        });
    };

    const runSba = async () => {
        if (!input.includeSba) return;
        const codes = [...new Set([...naicsFor(input.trades), ...OTHER_SPECIALTY_NAICS])];
        logger.info(`SBA small business search: ${searchStates.length} state(s), ${codes.length} industry codes`);
        await mapPool(searchStates, 2, async (state) => {
            try {
                const results = await searchSba(state, codes, { log: logger });
                stats[SBA_SOURCE].pages++;
                stats[SBA_SOURCE].companies_seen += results.length;
                for (const r of results) add(SBA_SOURCE, mapSbaRecord(r, scrapedAt));
            } catch (err) {
                fail(SBA_SOURCE, err, `SBA search in ${state}`);
            }
        });
    };

    await Promise.all([runProcore(), runSba()]);

    // Procore shows phone numbers only on profile pages: open them for the
    // companies that still have no phone after merging.
    if (input.lookUpPhones && input.maxPhoneLookups > 0) {
        const todo = deduper.rows.filter((r) => !r.phone && r._procoreSlug).slice(0, input.maxPhoneLookups);
        if (todo.length) logger.info(`Looking up phone numbers for ${todo.length} companies`);
        const late = stopIfLate('phone lookups');
        await mapPool(todo, 8, async (rec) => {
            if (late()) return;
            stats.phone_lookups.tried++;
            try {
                const phone = await fetchProcorePhone(rec._procoreSlug, { log: logger });
                if (formatPhone(phone)) {
                    rec.phone = formatPhone(phone);
                    rec._phoneDigits = phoneDigits(phone);
                    stats.phone_lookups.found++;
                }
            } catch { /* a missing phone is not worth failing the run over */ }
        });
    }

    // Second pass: new phone numbers can reveal more duplicates.
    const final = new Deduper();
    for (const r of deduper.rows) final.add(r);
    for (const r of final.rows) where.test(r); // refresh distance on merged rows

    let rows = final.rows;
    if (input.requirePhone) rows = rows.filter((r) => r.phone);
    return { rows: rank(rows.map((r) => toOutputRow(r, input))), stats };
}

async function run() {
    await Actor.init();
    const input = parseInput((await Actor.getInput()) ?? {});
    log.info('Input', input);

    const { rows, stats } = await collect(input);
    const sourceStats = [stats[PROCORE_SOURCE], stats[SBA_SOURCE]];
    if (rows.length === 0 && sourceStats.every((s) => s.errors > 0 && s.kept === 0)) {
        throw new Error('Every directory failed. See the log for details.');
    }

    // Respect both maxResults and the spending limit the user set for the run.
    const charging = Actor.getChargingManager();
    const affordable = charging.calculateMaxEventChargeCountWithinLimit(CHARGE_EVENT);
    const limit = Math.min(input.maxResults, Number.isFinite(affordable) ? affordable : Infinity);
    const out = rows.slice(0, limit);
    for (let i = 0; i < out.length; i += 100) {
        const res = await Actor.pushData(out.slice(i, i + 100), CHARGE_EVENT);
        if (res?.eventChargeLimitReached) {
            log.info('Reached the spending limit for this run.');
            break;
        }
    }

    const summary = { found: rows.length, returned: out.length, with_phone: out.filter((r) => r.phone).length, with_website: out.filter((r) => r.website).length, sources: stats };
    await Actor.setValue('RUN_SUMMARY', summary);
    log.info('Done', summary);
    await Actor.setStatusMessage(`Found ${rows.length} matching companies, returned ${out.length}.`, { isStatusMessageTerminal: true });
    await Actor.exit();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().catch(async (err) => {
        log.error(err.message);
        await Actor.fail(err.message);
    });
}
