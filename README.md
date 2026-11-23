# US Construction Contractor & Subcontractor Finder

Find commercial contractors and subcontractors in any US state or around any ZIP code, by trade. Pick "structural steel in Ohio" or "electrical, HVAC and plumbing within 40 miles of 44114" and get one clean list with phone, website, address, trades and certifications. No login, no API key.

## Who uses it

- **Building product and equipment sales reps** building a territory list: every concrete, roofing or drywall contractor in your states, with phone numbers.
- **General contractors and estimators** looking for subcontractors to invite to bid, including minority, woman, veteran owned or union firms for diversity goals.
- **Subcontractors** looking for general contractors to pre-qualify with.
- **Staffing agencies, insurers, sureties and lead-gen agencies** that sell to the construction trades.

## What you get

The input form comes pre-filled with **structural steel, Ohio, 100 results**. Click Start and you get this kind of list in about 30 seconds, for about $0.41. These rows are from a test run on November 23, 2026:

| Company | Phone | Website | City | State | Trades | Certifications |
|---|---|---|---|---|---|---|
| Arcline Services LLC | (740) 509-3566 | arclineservices.com | Caldwell | OH | structural_steel, miscellaneous_metals, concrete, fencing | small_business |
| Benco Construction Services LLC | (513) 228-0222 | buildbenco.com | Lebanon | OH | structural_steel, doors_hardware, drywall_ceilings, waterproofing | small_business |
| Fiedeldey Steel Fabricators, Inc. | (513) 353-3300 | fiedeldeysteel.com | Cincinnati | OH | structural_steel | |
| Concept Industries | (701) 312-1134 | conceptbins.com | Akron | OH | structural_steel | |

Each row also has street address, ZIP, latitude/longitude, distance from your ZIP, all trades the company lists, service areas, market sectors (commercial, healthcare, industrial...), federal bonding capacity, year founded, NAICS code, SAM.gov UEI and CAGE code where published, and links to every listing the company was found in.

Typical results: structural steel in Ohio returns about 330 companies, general contractors within 40 miles of Cleveland about 400, electrical + HVAC + plumbing in Ohio and Indiana about 3,400. Nearly every row has a phone number.

## Trades

General contractors and construction managers, concrete, masonry, structural steel, miscellaneous metals, welding, carpentry and millwork, roofing, sheet metal, waterproofing, insulation and EIFS, fireproofing, siding and cladding, glass and glazing, doors and hardware, drywall and ceilings, painting, flooring and tile, fire protection, plumbing, HVAC, process piping, electrical, low voltage and security, elevators, excavation and site work, underground utilities, paving, demolition, landscaping, fencing, abatement, scaffolding.

## How it works

1. It searches two public contractor directories for the trades and area you picked: **Procore Network** (hundreds of thousands of construction company profiles) and the **US Small Business Administration's small business search** (SAM.gov-registered firms, with bonding capacity and federal certifications).
2. It tags every company with standard trade names, so "Structural Steel Framing Erection" and NAICS 238120 both become `structural_steel`.
3. It merges companies listed in both directories (same website, phone, or name and ZIP) into one row.
4. It looks up phone numbers that the directory search pages leave out.

## Input

- **Trades**: one or more from the list above.
- **States**, or a **ZIP code and radius** in miles.
- Optional filters: **company type** (general contractor, specialty contractor, supplier...), **certifications** (MBE, WBE, DBE, SDVOSB, HUBZone, 8(a), union, prevailing wage...), only companies with a phone number, and whether to include out-of-state companies that serve your area.
- **Maximum results**.

## Data and privacy

Only business information that companies publish about themselves in public directories. No personal names, no personal email addresses (only role mailboxes such as bids@ or info@), nothing behind a login.

## Tips

- A whole state for a big trade (electrical in California) can take 10 minutes or more; a ZIP radius is faster.
- Run it on a schedule (weekly or monthly) to catch newly listed companies.

## How much does it cost?

**$4 per 1,000 companies** ($0.004 each), plus $0.005 per run. You pay only for companies returned.

| You get | You pay |
|---|---|
| 100 companies | about $0.41 |
| 1,000 companies | about $4.01 |
| 5,000 companies | about $20.01 |

Apify's free plan includes $5 of credit every month, which covers about 1,200 companies, so you can try it without paying anything. Set **Maximum results** or a spending limit and the run stops there.

## FAQ

**Is this a Procore Network scraper?** It reads the public Procore Network directory and the SBA small business search, then merges both into one list. You don't need a Procore account.

**Can I find minority, woman or veteran owned subcontractors?** Yes. Use the Certifications filter (MBE, WBE, DBE, SDVOSB, HUBZone, 8(a)) to build a diversity bid list.

**Can I get a list of general contractors in my state?** Yes. Pick the General contractors trade and your state. Ohio returns several hundred GCs with phone numbers.

**Can I export contractor leads to Excel or a CRM?** Download as CSV, Excel or JSON, or send results to Google Sheets, HubSpot, Zapier or Make with Apify integrations.

**How is this different from BuildingConnected, The Blue Book or ConstructConnect?** Those are subscriptions you search by hand. This gives you a downloadable list for your trades and area, and you pay only for the companies you get.

## Use it from your own tools

Run it from the Apify API (see the API tab), on a schedule, or from Zapier, Make, n8n, Google Sheets and Slack integrations. Each run's results stay in a dataset you can download as CSV, Excel, JSON or XML.

## More B2B lead lists from the same developer

Same pricing, same clean one-row-per-company format:

- [US Manufacturer & Machine Shop Leads](https://apify.com/habes22/fabricator-finder): metal fabricators and machine shops by capability (laser, CNC, welding)
- [Trucking Company & Carrier Leads (FMCSA)](https://apify.com/habes22/trucking-carrier-finder): trucking companies by cargo, fleet size and area, with safety data
- [Medical Practice & Clinic Leads (NPI)](https://apify.com/habes22/medical-practice-leads): dental, medical and therapy practices by specialty
- [Government Bids & RFPs (SAM.gov + State)](https://apify.com/habes22/gov-bids-finder): open federal, state and local bids for what you sell
- [Commercial Property Owner Leads](https://apify.com/habes22/commercial-property-owner-leads): who owns offices, warehouses and other commercial buildings
- [Solar & Battery Installer Leads](https://apify.com/habes22/solar-installer-leads): US solar installers ranked by how many systems they really installed
