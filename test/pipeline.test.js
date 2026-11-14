import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapProcoreCompany, nextData, searchUrl } from '../src/sources/procore.js';
import { mapSbaRecord, buildSbaQuery, companyTypeFromNaics } from '../src/sources/sba.js';
import { tradesFromProcore, tradesFromSba, TRADES, TRADE_IDS, CERTIFICATION_IDS } from '../src/trades.js';
import { Deduper } from '../src/dedupe.js';
import { parseInput, locationFilter, settleGeneralContractor, qualifies, toOutputRow, rank } from '../src/main.js';
import { procoreCompany, procorePage, sbaRecord } from './fixtures.js';

test('every trade has a label, keywords, and at least one way to be found', () => {
    for (const id of TRADE_IDS) {
        const t = TRADES[id];
        assert.ok(t.label, id);
        assert.ok(t.keywords instanceof RegExp, id);
        assert.ok(t.procore.length || t.naics.length || t.keywords, id);
    }
});

test('Procore page data is read from __NEXT_DATA__', () => {
    const pp = nextData(procorePage([procoreCompany()], 1096));
    assert.equal(pp.initialResults.count, 1096);
    assert.equal(nextData('<html>no data</html>'), null);
    assert.equal(searchUrl('OH', 'structural-steel', 3), 'https://network.procore.com/us/oh/structural-steel?page=3');
    assert.equal(searchUrl('OH', '?types=general-contractors', 2), 'https://network.procore.com/us/oh?types=general-contractors&page=2');
});

test('Procore company maps to the output shape', () => {
    const rec = mapProcoreCompany(procoreCompany());
    assert.equal(rec.company_name, 'Acme Steel Erectors LLC');
    assert.deepEqual(rec.company_types, ['specialty_contractor', 'supplier']);
    assert.ok(rec.trades.includes('structural_steel'));
    assert.ok(rec.trades.includes('miscellaneous_metals'), 'specialty maps to its parent trade');
    assert.equal(rec.state, 'OH');
    assert.equal(rec.zip, '43215');
    assert.equal(rec.website, 'http://www.acmesteel.example/');
    assert.deepEqual(rec.certifications.sort(), ['small_business', 'union']);
    assert.deepEqual(rec.service_areas, ['Columbus, OH', 'IN']);
    assert.equal(rec.description, null, 'Procore boilerplate summary is dropped');
    assert.equal(rec.sources[0].url, 'https://network.procore.com/p/acme-steel-erectors-llc-columbus');
});

test('Procore HVAC and life-safety trades map despite odd data keys', () => {
    assert.deepEqual(tradesFromProcore([{ type: 'trade', key: 'heating_ventilating_and_air_conditioning_hvac' }]), ['hvac']);
    assert.deepEqual(tradesFromProcore([{ type: 'trade', key: 'electronic_life_safety_' }]), ['low_voltage']);
});

test('only real general contractors keep the general_contractor trade', () => {
    const sub = settleGeneralContractor(mapProcoreCompany(procoreCompany()));
    assert.ok(!sub.trades.includes('general_contractor'), 'project management alone is not a GC');
    const gc = settleGeneralContractor(mapProcoreCompany(procoreCompany({ businessTypes: ['General Contractor'] })));
    assert.ok(gc.trades.includes('general_contractor'));
    const gc2 = settleGeneralContractor(mapProcoreCompany(procoreCompany({ businessTypes: ['General Contractor'], providedServices: [{ key: 'concrete', type: 'trade' }] })));
    assert.equal(gc2.trades[0], 'general_contractor', 'a GC listed under a trade is still a GC');
});

test('SBA record maps without personal data and keeps bonding and certifications', () => {
    const rec = mapSbaRecord(sbaRecord());
    assert.equal(rec.company_name, 'Acme Steel Erectors LLC');
    assert.deepEqual(rec.company_types, ['specialty_contractor']);
    for (const t of ['structural_steel', 'miscellaneous_metals', 'welding']) assert.ok(rec.trades.includes(t), t);
    assert.equal(rec.phone, '(614) 555-0100');
    assert.equal(rec.email, null, 'personal email must be dropped');
    assert.equal(rec.bonding_per_contract, 2000000);
    assert.deepEqual(rec.certifications.sort(), ['sdvosb', 'small_business']);
    assert.ok(!JSON.stringify(rec).toLowerCase().includes('jane'), 'contact names must never be copied');
});

test('SBA hidden fields stay hidden; role mailboxes are kept', () => {
    const rec = mapSbaRecord(sbaRecord({ display_phone: false, display_address: false, email: 'bids@acmesteel.example' }));
    assert.equal(rec.phone, null);
    assert.equal(rec.street, null);
    assert.equal(rec.email, 'bids@acmesteel.example');
});

test('SBA query carries the state and NAICS codes in the site format', () => {
    const q = buildSbaQuery(['OH'], ['238120']);
    assert.deepEqual(q.location.states, [{ label: 'OH - Ohio', value: 'OH - Ohio' }]);
    assert.deepEqual(q.naics.codes, [{ label: '238120', value: '238120' }]);
    assert.equal(companyTypeFromNaics('236220'), 'general_contractor');
    assert.equal(companyTypeFromNaics('238210'), 'specialty_contractor');
});

test('SBA trades come from the primary code or the company description', () => {
    assert.deepEqual(tradesFromSba('238220', '').sort(), ['hvac', 'plumbing']);
    assert.ok(tradesFromSba('238990', 'We install fire sprinkler systems').includes('fire_protection'));
    assert.deepEqual(tradesFromSba('541330', 'civil engineering design'), []);
});

test('duplicates across sources merge into one row with both sources', () => {
    const d = new Deduper();
    d.add(mapProcoreCompany(procoreCompany()));
    d.add(mapSbaRecord(sbaRecord()));
    assert.equal(d.size, 1);
    const row = d.rows[0];
    assert.equal(row.sources.length, 2);
    assert.equal(row.phone, '(614) 555-0100');
    assert.ok(row.certifications.includes('sdvosb') && row.certifications.includes('union'));
});

test('input validation gives plain-language errors', () => {
    assert.throws(() => parseInput({ trades: ['plumbing'] }), /Pick at least one state/);
    assert.throws(() => parseInput({ trades: ['knitting'], states: ['OH'] }), /Unknown trade/);
    assert.throws(() => parseInput({ trades: ['plumbing'], states: ['XX'] }), /Unknown state/);
    assert.throws(() => parseInput({ trades: ['plumbing'], zipCode: '00000' }), /ZIP code/);
    const ok = parseInput({ states: ['oh'] });
    assert.deepEqual(ok.trades, ['structural_steel']);
    assert.deepEqual(ok.states, ['OH']);
    assert.equal(ok.maxResults, 1000);
    for (const c of CERTIFICATION_IDS) assert.ok(parseInput({ states: ['OH'], certifications: [c] }));
});

test('state filter keeps in-state companies, and serving companies only when asked', () => {
    const rec = mapProcoreCompany(procoreCompany({ primaryAddress: { ...procoreCompany().primaryAddress, province: 'PA' } }));
    assert.equal(locationFilter(parseInput({ states: ['IN'] })).test(rec), false);
    assert.equal(locationFilter(parseInput({ states: ['IN'], includeOutOfState: true })).test(rec), true);
    assert.equal(locationFilter(parseInput({ states: ['PA'] })).test(rec), true);
});

test('ZIP radius filter uses the company location', () => {
    const where = locationFilter(parseInput({ zipCode: '43215', radiusMiles: 10 }));
    const rec = mapProcoreCompany(procoreCompany());
    assert.equal(where.test(rec), true);
    assert.ok(rec._distance < 10);
    assert.equal(where.test(mapSbaRecord(sbaRecord({ zipcode: '44114' }))), false);
});

test('filters, output row and ranking', () => {
    const input = parseInput({ states: ['OH'], trades: ['structural_steel'], certifications: ['union'] });
    const p = settleGeneralContractor(mapProcoreCompany(procoreCompany({ phone: '+16145550123' })));
    const s = settleGeneralContractor(mapSbaRecord(sbaRecord({ uei: 'X2', phone: '6145550199', website: null, legal_business_name: 'Other Steel Co' })));
    assert.equal(qualifies(p, input), true);
    assert.equal(qualifies(s, input), false, 'no union certification');
    const row = toOutputRow(p, input);
    assert.deepEqual(row.matched_trades, ['structural_steel']);
    assert.ok(!Object.keys(row).some((k) => k.startsWith('_')), 'no internal fields in output');
    const ranked = rank([toOutputRow(s, input), row]);
    assert.equal(ranked[0].company_name, 'Acme Steel Erectors LLC');
});
