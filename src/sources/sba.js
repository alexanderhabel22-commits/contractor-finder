// SBA Dynamic Small Business Search (DSBS): the US Small Business
// Administration's public search of small businesses registered in SAM.gov.
// Construction firms list their industry codes, a capabilities narrative,
// bonding capacity and federal certifications (8(a), HUBZone, WOSB, SDVOSB).
// Public, no login: https://search.certifications.sba.gov/
//
// The site's search page calls a JSON endpoint that returns every match in
// one response, so one request per state is enough.
//
// Profiles also hold a contact person and principals; those are never copied.

import { fetchJson } from '../http.js';
import { tradesFromSba, SBA_CERT_FLAGS } from '../trades.js';
import { US_STATES, stateAbbr, formatPhone, phoneDigits, cleanWebsite, prettyName, companyEmail, zip5 } from '../normalize.js';

export const SBA_SOURCE = 'sba_dsbs';
const ENDPOINT = 'https://search.certifications.sba.gov/_api/v2/search';
const PROFILE_URL = 'https://search.certifications.sba.gov/profile';

// "Other specialty trade" codes: searched for every run and tagged from the
// company's own description, since several trades (fencing, waterproofing,
// fire protection...) have no industry code of their own.
export const OTHER_SPECIALTY_NAICS = ['238190', '238290', '238390', '238990'];

/** The filter body the DSBS search page sends, with only states and NAICS codes set. */
export function buildSbaQuery(states = [], naicsCodes = [], term = '') {
    return {
        searchProfiles: { searchTerm: term },
        location: {
            states: states.map((abbr) => {
                const label = `${abbr} - ${US_STATES[abbr]}`;
                return { label, value: label };
            }),
            zipCodes: [], counties: [], districts: [], msas: [],
        },
        sbaCertifications: { activeCerts: [], isPreviousCert: false, operatorType: 'Or' },
        naics: { codes: naicsCodes.map((c) => ({ label: c, value: c })), isPrimary: false, operatorType: 'Or' },
        selfCertifications: { certifications: [], operatorType: 'Or' },
        keywords: { list: [], operatorType: 'Or' },
        lastUpdated: { date: { label: 'Anytime', value: 'anytime' } },
        samStatus: { isActiveSAM: false },
        qualityAssuranceStandards: { qas: [] },
        bondingLevels: { constructionIndividual: '', constructionAggregate: '', serviceIndividual: '', serviceAggregate: '' },
        businessSize: { relationOperator: 'at-least', numberOfEmployees: '' },
        annualRevenue: { relationOperator: 'at-least', annualGrossRevenue: '' },
        entityDetailId: '',
    };
}

/** Every DSBS profile in one state that lists any of the NAICS codes. */
export async function searchSba(state, naicsCodes, { log } = {}) {
    const data = await fetchJson(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSbaQuery([state], naicsCodes)),
        timeoutMs: 120_000,
        log,
    });
    return Array.isArray(data?.results) ? data.results : [];
}

/** Company type from the primary industry code. */
export function companyTypeFromNaics(code) {
    const c = String(code ?? '');
    if (/^236/.test(c)) return 'general_contractor';
    if (/^23[78]/.test(c) || c === '561730' || c === '562910') return 'specialty_contractor';
    if (/^5413[1-4]/.test(c)) return 'engineer';
    if (/^423/.test(c)) return 'supplier';
    if (/^3[1-3]/.test(c)) return 'manufacturer';
    return null;
}

const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
};

/** Turns one DSBS profile into our record shape. Personal names are never copied. */
export function mapSbaRecord(r, scrapedAt = new Date().toISOString()) {
    const name = prettyName(r?.dba_name || r?.legal_business_name);
    if (!name) return null;
    const text = [r.capabilities_narrative, (r.keywords ?? []).join(', ')].filter(Boolean).join('\n');
    const showAddress = r.display_address !== false;
    const showPhone = r.display_phone !== false;
    const showEmail = r.display_email !== false;
    const street = showAddress ? [r.address_1, r.address_2].filter(Boolean).join(', ') : null;
    const type = companyTypeFromNaics(r.naics_primary);
    const certifications = [...new Set(Object.entries(SBA_CERT_FLAGS).filter(([flag]) => r[flag] === true).map(([, id]) => id))];
    return {
        company_name: name,
        company_types: type ? [type] : [],
        trades: tradesFromSba(r.naics_primary, text),
        trade_details: [],
        phone: showPhone ? formatPhone(r.phone) : null,
        _phoneDigits: showPhone ? phoneDigits(r.phone) : null,
        email: showEmail ? companyEmail(r.email) : null,
        website: cleanWebsite(r.website) ?? cleanWebsite(r.additional_website),
        street: street ? prettyName(street) : null,
        city: prettyName(r.city),
        state: stateAbbr(r.state),
        zip: zip5(r.zipcode),
        _point: null,
        service_areas: [],
        construction_sectors: [],
        certifications,
        company_size: r.business_size || null,
        avg_contract_size: null,
        bonding_per_contract: money(r.construction_bonding_per_contract),
        bonding_aggregate: money(r.construction_bonding_aggregate),
        year_founded: /^\d{4}$/.test(String(r.year_established ?? '')) ? Number(r.year_established) : null,
        naics_primary: r.naics_primary || null,
        uei: r.uei || null,
        cage_code: r.cage_code || null,
        description: (r.capabilities_narrative || '').trim().slice(0, 1500) || null,
        sources: [{
            source: SBA_SOURCE,
            url: r.uei ? `${PROFILE_URL}/${r.uei}/${r.cage_code ?? ''}` : 'https://search.certifications.sba.gov/',
        }],
        scraped_at: scrapedAt,
    };
}
