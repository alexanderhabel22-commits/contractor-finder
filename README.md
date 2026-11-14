# US Construction Contractor & Subcontractor Finder

Find commercial contractors and subcontractors in any US state or around any ZIP code, by trade. Pick "structural steel in Ohio" or "electrical, HVAC and plumbing within 40 miles of 44114" and get one clean list with phone, website, address, trades and certifications. No login, no API key.

## Who uses it

- **Building product and equipment sales reps** building a territory list: every concrete, roofing or drywall contractor in your states, with phone numbers.
- **General contractors and estimators** looking for subcontractors to invite to bid, including minority, woman, veteran owned or union firms for diversity goals.
- **Subcontractors** looking for general contractors to pre-qualify with.
- **Staffing agencies, insurers, sureties and lead-gen agencies** that sell to the construction trades.

## What you get

| company_name | company_types | matched_trades | phone | website | city | state | certifications |
|---|---|---|---|---|---|---|---|
| Example Steel Erectors LLC | specialty_contractor | structural_steel | (614) 555-0100 | examplesteel.com | Columbus | OH | union, small_business |
| Example Builders Inc | general_contractor | general_contractor | (216) 555-0142 | examplebuilders.com | Cleveland | OH | sdvosb |

*(Illustrative rows.)* Each row also has street address, ZIP, latitude/longitude, distance from your ZIP, all trades the company lists, service areas, market sectors (commercial, healthcare, industrial...), federal bonding capacity, year founded, NAICS code, SAM.gov UEI and CAGE code where published, and links to every listing the company was found in.

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

## Pricing

You pay per company returned, plus a small fee per run. Set a maximum results number or a spending limit and the run stops there.

## Data and privacy

Only business information that companies publish about themselves in public directories. No personal names, no personal email addresses (only role mailboxes such as bids@ or info@), nothing behind a login.

## Tips

- A whole state for a big trade (electrical in California) can take 10 minutes or more; a ZIP radius is faster.
- Run it on a schedule (weekly or monthly) to catch newly listed companies.
