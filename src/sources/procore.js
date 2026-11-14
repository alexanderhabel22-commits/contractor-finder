// Procore Network (network.procore.com): a public directory of about 650,000
// construction companies. Search pages are server-rendered by Next.js, so each
// page's company list sits in the __NEXT_DATA__ JSON: 40 companies per page,
// with address, website, trades, business types and certifications. Phone
// numbers are only on each company's own profile page (/p/<slug>).
//
// Results for a state also include out-of-state companies that serve it.

import { fetchText, mapPool } from '../http.js';
import { tradesFromProcore, companyTypeFromProcore, classificationsFromProcore } from '../trades.js';
import { cleanWebsite, formatPhone, phoneDigits, prettyName, stateAbbr, zip5 } from '../normalize.js';

export const PROCORE_SOURCE = 'procore_network';
const BASE = 'https://network.procore.com';
const PAGE_SIZE = 40;

/** Pulls the page props out of a Next.js page. Null when the page has none. */
export function nextData(html) {
    const m = String(html ?? '').match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    try {
        return JSON.parse(m[1])?.props?.pageProps ?? null;
    } catch {
        return null;
    }
}

export function searchUrl(state, tradeUrlKey, page = 1) {
    // A key may be a trade path ("structural-steel") or a query ("?types=general-contractors").
    const base = `${BASE}/us/${state.toLowerCase()}${tradeUrlKey.startsWith('?') ? tradeUrlKey : `/${tradeUrlKey}`}`;
    if (page <= 1) return base;
    return `${base}${base.includes('?') ? '&' : '?'}page=${page}`;
}

export const profileUrl = (slug) => `${BASE}/p/${slug}`;

/** One search page: { results, count }. Empty when the page does not exist. */
export async function fetchSearchPage(state, tradeUrlKey, page, { log } = {}) {
    const { status, text } = await fetchText(searchUrl(state, tradeUrlKey, page), { log });
    if (status !== 200) return { results: [], count: 0 };
    const pp = nextData(text);
    if (!pp) throw new Error('Procore page layout changed: no page data found');
    const r = pp.initialResults ?? {};
    return { results: r.results ?? [], count: r.count ?? 0 };
}

/**
 * Every company Procore lists for a trade in a state. The list mixes in
 * out-of-state companies that serve the state (they sit in the middle of the
 * ordering), so every page is read; callers filter by address.
 */
export async function searchProcore(state, tradeUrlKey, { log, maxPages = 250, concurrency = 4, shouldStop = () => false } = {}) {
    const first = await fetchSearchPage(state, tradeUrlKey, 1, { log });
    const all = [...first.results];
    const lastPage = Math.min(maxPages, Math.ceil(first.count / PAGE_SIZE));
    const rest = Array.from({ length: Math.max(0, lastPage - 1) }, (_, i) => i + 2);
    let pages = 1;
    await mapPool(rest, concurrency, async (page) => {
        if (shouldStop()) return;
        const { results } = await fetchSearchPage(state, tradeUrlKey, page, { log });
        pages++;
        all.push(...results);
    });
    return { results: all, pages, count: first.count };
}

/** Plain-text summary Procore writes for every company ("X is a Supplier that serves..."). Not useful as a description. */
const BOILERPLATE_ABOUT = /\bthat serves the .{1,120} area and specializes in /i;

/** Maps one Procore company to our record shape. */
export function mapProcoreCompany(c, scrapedAt = new Date().toISOString()) {
    if (!c?.name) return null;
    const a = c.primaryAddress ?? {};
    const street = [a.address1, a.address2].filter(Boolean).join(', ') || null;
    const types = [...new Set((c.businessTypes ?? []).map(companyTypeFromProcore).filter(Boolean))];
    const services = c.providedServices ?? [];
    const about = c.about && !BOILERPLATE_ABOUT.test(c.about) ? c.about : null;
    const lat = Number(c.latLng?.lat ?? a.latitude);
    const lon = Number(c.latLng?.lng ?? a.longitude);
    const url = c.primarySlug ? profileUrl(c.primarySlug) : null;
    return {
        company_name: prettyName(c.name),
        company_types: types,
        trades: tradesFromProcore(services),
        trade_details: [...new Set(services.map((s) => s?.name).filter(Boolean))],
        phone: formatPhone(c.phone),
        _phoneDigits: phoneDigits(c.phone),
        website: cleanWebsite(c.website),
        street,
        city: a.city || null,
        state: stateAbbr(a.province),
        zip: zip5(a.postalCode1),
        _point: Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) ? [lat, lon] : null,
        service_areas: [...new Set((c.coverageAreas ?? []).map(coverageLabel).filter(Boolean))],
        construction_sectors: c.constructionSectors ?? [],
        certifications: classificationsFromProcore(c.classifications ?? []),
        company_size: c.companySize ?? null,
        avg_contract_size: c.avgContractSize ?? null,
        description: about,
        _procoreSlug: c.primarySlug ?? null,
        sources: url ? [{ source: PROCORE_SOURCE, url }] : [],
        scraped_at: scrapedAt,
    };
}

function coverageLabel(area) {
    if (!area) return null;
    const st = area.admin1 ? String(area.admin1).toUpperCase() : null;
    if (area.locality) return st ? `${area.locality}, ${st}` : area.locality;
    if (area.admin2) return st ? `${area.admin2}, ${st}` : area.admin2;
    return st;
}

/** Phone number from a company's profile page, or null. */
export async function fetchProcorePhone(slug, { log } = {}) {
    const { status, text } = await fetchText(profileUrl(slug), { log, retries: 2 });
    if (status !== 200) return null;
    const b = nextData(text)?.business;
    return b?.phone ?? null;
}
