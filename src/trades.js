// The fixed list of construction trades a buyer can pick, and how each one
// maps onto every source:
//
// procore:  trade URL keys on network.procore.com (/us/<state>/<key>), or a
//           query such as ?types=general-contractors for a whole company type
// naics:    primary industry codes (NAICS) in the SBA small business search
// keywords: words in a company's own description that show the trade
//
// Company types come from the sources too: Procore lists business types per
// company; for SBA profiles they follow from the industry code.

import { readFileSync } from 'node:fs';

export const TRADES = {
    general_contractor: {
        label: 'General contractors & construction managers',
        procore: ['?types=general-contractors'],
        naics: ['236220', '236210'],
        keywords: /\b(general contract\w*|construction manag\w*|design[- ]build\w*|commercial construction|tenant improvements?)\b/i,
    },
    concrete: {
        label: 'Concrete',
        procore: ['concrete', 'reinforcement'],
        naics: ['238110'],
        keywords: /\b(concrete|tilt[- ]up|post[- ]tension\w*|rebar|reinforcing steel)\b/i,
    },
    masonry: {
        label: 'Masonry',
        procore: ['masonry'],
        naics: ['238140'],
        keywords: /\b(masonry|brick ?(work|laying|layers?)|block work|stone ?mason\w*|tuck ?pointing)\b/i,
    },
    structural_steel: {
        label: 'Structural steel (fabrication & erection)',
        procore: ['structural-steel'],
        naics: ['238120'],
        keywords: /\b(structural steel|steel erect\w*|steel fabricat\w*|iron ?work(ers?|ing)?|precast erect\w*|metal deck\w*|steel joists?)\b/i,
    },
    miscellaneous_metals: {
        label: 'Miscellaneous & ornamental metals, stairs, railings',
        procore: ['metals'],
        naics: [],
        keywords: /\b(misc(ellaneous|\.)? metals?|ornamental (iron|metals?)|metal stairs|hand ?rails?|guard ?rails?|architectural metals?)\b/i,
    },
    welding: {
        label: 'Welding contractors',
        procore: [],
        naics: [],
        keywords: /\b(welding|welders?|aws d1\.\d)\b/i,
    },
    carpentry: {
        label: 'Carpentry & millwork',
        procore: ['rough-carpentry', 'finish-carpentry'],
        naics: ['238130', '238350'],
        keywords: /\b(carpentry|carpenters?|framing|millwork|casework)\b/i,
    },
    roofing: {
        label: 'Roofing',
        procore: ['roofing', 'flashing-and-trim'],
        naics: ['238160'],
        keywords: /\b(roofing|roofers?|re-?roof\w*)\b/i,
    },
    sheet_metal: {
        label: 'Sheet metal & ductwork',
        procore: ['sheet-metal-wall-cladding'],
        naics: [],
        keywords: /\b(sheet metal|duct ?work)\b/i,
    },
    waterproofing: {
        label: 'Waterproofing, sealants & air barriers',
        procore: ['waterproofing', 'air-barriers', 'joint-protection'],
        naics: [],
        keywords: /\b(waterproofing|caulking|sealants?|air barriers?)\b/i,
    },
    insulation: {
        label: 'Insulation & EIFS',
        procore: ['thermal-insulation', 'exterior-insulation-and-finish-systems-eifs'],
        naics: [],
        keywords: /\b(insulation|insulators?|e\.?i\.?f\.?s|spray foam)\b/i,
    },
    fireproofing: {
        label: 'Fireproofing & firestopping',
        procore: ['fire-and-smoke-protection'],
        naics: [],
        keywords: /\b(fire ?proofing|fire ?stop\w*|intumescent)\b/i,
    },
    siding_cladding: {
        label: 'Siding, wall panels & cladding',
        procore: ['siding', 'wall-panels', 'faced-panels'],
        naics: ['238170'],
        keywords: /\b(siding|wall panels?|metal panels?|cladding)\b/i,
    },
    glass_glazing: {
        label: 'Glass, glazing, curtain wall & storefronts',
        procore: ['glass-and-glazing', 'curtain-wall-and-glazed-assemblies', 'entrances-and-storefronts', 'windows'],
        naics: ['238150'],
        keywords: /\b(glazing|glaziers?|curtain ?walls?|store ?fronts?|window walls?)\b/i,
    },
    doors_hardware: {
        label: 'Doors, frames & hardware',
        procore: ['doors-and-frames', 'door-and-window-hardware', 'specialty-doors-and-frames'],
        naics: [],
        keywords: /\b(doors?,? (and |& )?frames|hollow metal|door hardware|finish hardware|overhead doors?|automatic doors?)\b/i,
    },
    drywall_ceilings: {
        label: 'Drywall, plaster, stucco & ceilings',
        procore: ['plaster-and-gypsum-board', 'ceilings'],
        naics: ['238310'],
        keywords: /\b(drywall|gypsum|acoustical ceilings?|plaster\w*|stucco|metal stud\w*)\b/i,
    },
    painting: {
        label: 'Painting & coatings',
        procore: ['painting-and-coatings', 'wall-finishes'],
        naics: ['238320'],
        keywords: /\b(painting|painters?|wall ?covering\w*)\b/i,
    },
    flooring: {
        label: 'Flooring & tile',
        procore: ['flooring', 'tile'],
        naics: ['238330', '238340'],
        keywords: /\b(flooring|floor coverings?|carpet\w*|ceramic tile|tile (setting|contractors?|install\w*)|terrazzo|epoxy floor\w*)\b/i,
    },
    fire_protection: {
        label: 'Fire protection & sprinklers',
        procore: ['fire-suppression'],
        naics: [],
        keywords: /\b(fire sprinklers?|sprinkler systems?|fire protection|fire suppression)\b/i,
    },
    plumbing: {
        label: 'Plumbing',
        procore: ['plumbing'],
        naics: ['238220'],
        keywords: /\b(plumbing|plumbers?|medical gas)\b/i,
    },
    hvac: {
        label: 'HVAC & mechanical',
        procore: ['hvac'],
        naics: ['238220'],
        keywords: /\b(hvac|heating|air conditioning|mechanical contract\w*|refrigeration|boilers?|chillers?)\b/i,
    },
    process_piping: {
        label: 'Process & industrial piping',
        procore: ['process-piping'],
        naics: [],
        keywords: /\b(process piping|industrial piping|pipe ?fitt(ing|ers?)|steam ?fitt(ing|ers?))\b/i,
    },
    electrical: {
        label: 'Electrical',
        procore: ['electrical'],
        naics: ['238210'],
        keywords: /\b(electrical|electricians?)\b/i,
    },
    low_voltage: {
        label: 'Low voltage, data, security & fire alarm',
        procore: ['communications', 'electronic-security', 'electronic-safety'],
        naics: [],
        keywords: /\b(low[- ]voltage|structured cabling|data cabling|fiber optic\w*|security systems?|access control|fire alarms?|cctv|audio[- ]visual)\b/i,
    },
    elevators: {
        label: 'Elevators & lifts',
        procore: ['elevators', 'lifts', 'escalators-and-moving-walks'],
        naics: ['238290'],
        keywords: /\b(elevators?|escalators?|wheelchair lifts?)\b/i,
    },
    earthwork: {
        label: 'Excavation, earthwork & site work',
        procore: ['earthwork'],
        naics: ['238910'],
        keywords: /\b(excavat\w*|earth ?work|earth ?moving|grading|site ?work|site prep\w*)\b/i,
    },
    utilities: {
        label: 'Underground utilities, sewer & water',
        procore: [],
        naics: ['237110', '237130'],
        keywords: /\b(underground utilit\w*|water ?mains?|sanitary sewers?|storm ?sewers?|directional drilling|horizontal boring)\b/i,
    },
    paving: {
        label: 'Paving, asphalt & pavement markings',
        procore: ['paving-and-surfacing', 'curbs-gutters-sidewalks-and-driveways'],
        naics: ['237310'],
        keywords: /\b(paving|asphalt|pavement|striping|seal ?coat\w*)\b/i,
    },
    demolition: {
        label: 'Demolition',
        procore: ['demolition'],
        naics: [],
        keywords: /\b(demolition|selective demo)\b/i,
    },
    landscaping: {
        label: 'Landscaping & irrigation',
        procore: ['landscaping'],
        naics: ['561730'],
        keywords: /\b(landscap\w*|irrigation|hardscap\w*|hydro ?seed\w*)\b/i,
    },
    fencing: {
        label: 'Fencing & gates',
        procore: ['fences-and-gates'],
        naics: [],
        keywords: /\b(fenc(e|es|ing))\b/i,
    },
    abatement: {
        label: 'Abatement & environmental remediation',
        procore: ['abatement-and-remediation'],
        naics: ['562910'],
        keywords: /\b(abatement|asbestos|lead paint|mold remediation|environmental remediation)\b/i,
    },
    scaffolding: {
        label: 'Scaffolding',
        procore: ['scaffolding'],
        naics: [],
        keywords: /\b(scaffold\w*)\b/i,
    },
};

export const TRADE_IDS = Object.keys(TRADES);

// Procore's own trade list (src/data/procore-trades.json): data key ->
// { urlKey, label, specialties }. Specialties such as metal_fabrications
// belong to a parent trade (metals).
const PROCORE_TRADE_LIST = JSON.parse(readFileSync(new URL('./data/procore-trades.json', import.meta.url), 'utf8'));
const PROCORE_URLKEY_TO_KEY = new Map(Object.entries(PROCORE_TRADE_LIST).map(([key, t]) => [t.urlKey, key]));

// Procore trade data key -> our trade id.
const PROCORE_KEY_TO_TRADE = new Map();
for (const [id, t] of Object.entries(TRADES)) {
    for (const urlKey of t.procore.filter((k) => !k.startsWith('?'))) PROCORE_KEY_TO_TRADE.set(PROCORE_URLKEY_TO_KEY.get(urlKey) ?? urlKey.replace(/-/g, '_'), id);
}

const PROCORE_SPECIALTY_TO_TRADE = new Map();
for (const [tradeKey, t] of Object.entries(PROCORE_TRADE_LIST)) {
    for (const specialty of Object.keys(t.specialties)) {
        if (!PROCORE_SPECIALTY_TO_TRADE.has(specialty)) PROCORE_SPECIALTY_TO_TRADE.set(specialty, tradeKey);
    }
}

/** Our trade ids for a list of Procore providedServices entries (trades and specialties). */
export function tradesFromProcore(services = []) {
    const out = new Set();
    for (const s of services) {
        const key = s?.type === 'specialty' ? (s.tradeKey ?? PROCORE_SPECIALTY_TO_TRADE.get(s.key)) : s?.key;
        const id = PROCORE_KEY_TO_TRADE.get(key);
        if (id) out.add(id);
    }
    return [...out];
}

// SBA profiles: primary industry code -> trades it proves on its own. Codes
// shared by several trades (238220 is plumbing and HVAC) count for each.
const NAICS_TO_TRADES = new Map();
for (const [id, t] of Object.entries(TRADES)) {
    for (const code of t.naics) NAICS_TO_TRADES.set(code, [...(NAICS_TO_TRADES.get(code) ?? []), id]);
}

/** Trades shown by a primary NAICS code and by the company's own description. */
export function tradesFromSba(primaryNaics, text = '') {
    const out = new Set(NAICS_TO_TRADES.get(String(primaryNaics ?? '')) ?? []);
    for (const [id, t] of Object.entries(TRADES)) if (t.keywords.test(text)) out.add(id);
    return [...out];
}

/** Every NAICS code to search the SBA directory with for some trades. */
export function naicsFor(trades) {
    return [...new Set(trades.flatMap((t) => TRADES[t]?.naics ?? []))];
}

export const COMPANY_TYPES = ['general_contractor', 'specialty_contractor', 'supplier', 'manufacturer', 'engineer', 'architect', 'consultant', 'owner_developer'];

const PROCORE_TYPES = {
    'general contractor': 'general_contractor',
    'specialty contractor': 'specialty_contractor',
    supplier: 'supplier',
    engineer: 'engineer',
    architect: 'architect',
    consultant: 'consultant',
    'owner real estate developer': 'owner_developer',
    'owner/real estate developer': 'owner_developer',
};

/** "General Contractor" -> "general_contractor". */
export function companyTypeFromProcore(label) {
    return PROCORE_TYPES[String(label ?? '').toLowerCase().trim()] ?? null;
}

// Procore "classifications" are business certifications (MBE, WBE, union...).
const PROCORE_CLASSIFICATIONS = {
    EIGHTA: '8a', AABE: 'aabe', ABE: 'abe', BEPD: 'bepd', CAB: 'cab', BCORP: 'b_corp', CBE: 'cbe',
    LGBTBE: 'lgbtbe', DBE: 'dbe', EBE: 'ebe', HBE: 'hbe', HUB: 'hubzone', LBE: 'lbe', MBE: 'mbe',
    NABE: 'nabe', PW: 'prevailing_wage', SDVOSB: 'sdvosb', SBE: 'small_business', UM: 'union',
    VBE: 'veteran_owned', WBE: 'wbe',
};

// SBA certification flags -> the same certification ids.
export const SBA_CERT_FLAGS = {
    active_8a_boolean: '8a',
    active_hz_boolean: 'hubzone',
    active_wosb_boolean: 'wbe',
    active_edwosb_boolean: 'wbe',
    active_sdvosb_boolean: 'sdvosb',
    active_vosb_boolean: 'veteran_owned',
    self_vosb_boolean: 'veteran_owned',
    self_wosb_boolean: 'wbe',
    self_small_boolean: 'small_business',
};

/** ["MBE", "UM"] or [{key:"MBE"}] -> ["mbe", "union"]. */
export function classificationsFromProcore(list = []) {
    return [...new Set(list.map((c) => PROCORE_CLASSIFICATIONS[String(c?.key ?? c?.value ?? c ?? '').toUpperCase()]).filter(Boolean))];
}

export const CERTIFICATION_IDS = [...new Set([...Object.values(PROCORE_CLASSIFICATIONS), ...Object.values(SBA_CERT_FLAGS)])];
