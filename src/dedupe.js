// Merges records that describe the same company.
//
// Two records are the same company when they share a website domain, a phone
// number, or the same cleaned-up name in the same ZIP code (or, failing a ZIP,
// the same city and state). Merged rows keep every source URL and the union
// of trades, company types and certifications.

import { websiteDomain, nameKey } from './normalize.js';

function keysFor(rec) {
    const keys = [];
    const domain = websiteDomain(rec.website);
    if (domain) keys.push(`d:${domain}`);
    if (rec._phoneDigits) keys.push(`p:${rec._phoneDigits}`);
    const n = nameKey(rec.company_name);
    if (n && rec.zip) keys.push(`n:${n}|${rec.zip}`);
    if (n && rec.city && rec.state) keys.push(`c:${n}|${rec.city.toLowerCase()}|${rec.state}`);
    return keys;
}

const UNION_FIELDS = ['company_types', 'trades', 'trade_details', 'service_areas', 'construction_sectors', 'certifications'];
const union = (a = [], b = []) => [...new Set([...a, ...b])];

function merge(into, from) {
    for (const [k, v] of Object.entries(from)) {
        if (into[k] == null || into[k] === '' || (Array.isArray(into[k]) && !into[k].length)) into[k] = v;
    }
    for (const f of UNION_FIELDS) into[f] = union(into[f], from[f]);
    const seen = new Set(into.sources.map((s) => s.url));
    for (const s of from.sources) if (!seen.has(s.url)) into.sources.push(s);
}

export class Deduper {
    constructor() {
        this.rows = [];
        this.index = new Map();
    }

    /** Adds a record. Returns true when it was new, false when merged. */
    add(rec) {
        const keys = keysFor(rec);
        const hit = keys.map((k) => this.index.get(k)).find((i) => i !== undefined);
        if (hit === undefined) {
            const copy = { ...rec, sources: [...rec.sources] };
            for (const f of UNION_FIELDS) copy[f] = [...(rec[f] ?? [])];
            this.rows.push(copy);
            for (const k of keys) this.index.set(k, this.rows.length - 1);
            return true;
        }
        merge(this.rows[hit], rec);
        for (const k of keysFor(this.rows[hit])) if (!this.index.has(k)) this.index.set(k, hit);
        return false;
    }

    get size() {
        return this.rows.length;
    }
}
