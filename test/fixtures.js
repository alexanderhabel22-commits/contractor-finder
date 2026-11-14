// Invented records in the shape the sources return. No real companies or people.

export const procoreCompany = (over = {}) => ({
    about: 'Acme Steel Erectors LLC is a Specialty Contractor, Supplier that serves the Columbus, OH area and specializes in Structural Steel.',
    primaryAddress: {
        address1: '100 Main St', address2: '', city: 'Columbus', province: 'OH', postalCode1: '43215', latitude: 39.96, longitude: -83.0,
    },
    claimed: true,
    classifications: [{ name: 'Union Member', abbreviation: '', key: 'UM' }, { name: 'Small Business', abbreviation: 'SBE', key: 'SBE' }],
    constructionSectors: ['Commercial', 'Industrial and Energy'],
    coverageAreas: [{ admin1: 'OH', locality: 'Columbus', selectedLevel: 'LOCALITY' }, { admin1: 'in', selectedLevel: 'ADMIN1' }],
    id: 'test-1',
    latLng: { lat: 39.96, lng: -83.0 },
    name: 'ACME STEEL ERECTORS LLC',
    phone: null,
    primarySlug: 'acme-steel-erectors-llc-columbus',
    providedServices: [
        { key: 'structural_steel', name: 'Structural Steel', type: 'trade' },
        { key: 'metal_fabrications', name: 'Metal Fabrications', type: 'specialty' },
        { key: 'project_management_and_coordination', name: 'Project Management and Coordination', type: 'trade' },
    ],
    website: 'www.acmesteel.example',
    businessTypes: ['Specialty Contractor', 'Supplier'],
    companySize: null,
    avgContractSize: null,
    ...over,
});

export const procorePage = (companies, count = companies.length) => `<!DOCTYPE html><html><body>
<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { initialResults: { results: companies, count, finalRadius: 25 } } } })}</script>
</body></html>`;

export const sbaRecord = (over = {}) => ({
    uei: 'TESTUEI00001',
    cage_code: '1ABC2',
    legal_business_name: 'ACME STEEL ERECTORS LLC',
    dba_name: '',
    contact_person: 'JANE EXAMPLE',
    current_principals: 'JANE EXAMPLE - PRESIDENT',
    email: 'jane.example@acmesteel.example',
    phone: '6145550100',
    address_1: '100 MAIN ST',
    address_2: '',
    city: 'COLUMBUS',
    state: 'Ohio',
    zipcode: '43215',
    website: 'http://acmesteel.example',
    additional_website: null,
    capabilities_narrative: 'Structural steel erection and miscellaneous metals: stairs and handrails. AWS D1.1 certified welding.',
    keywords: ['steel erection', 'ironwork'],
    naics_primary: '238120',
    naics_all_codes: ['238120', '332312'],
    construction_bonding_per_contract: '2000000',
    construction_bonding_aggregate: '5000000',
    year_established: '1987',
    business_size: null,
    active_sdvosb_boolean: true,
    self_small_boolean: true,
    display_address: true,
    display_phone: true,
    display_email: true,
    ...over,
});
