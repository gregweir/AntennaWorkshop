# RadioBook Antenna Workshop

[![Validate](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml/badge.svg)](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml)

RadioBook Antenna Workshop is an offline-first browser application for designing, understanding, building, tuning, and evaluating amateur-radio antennas. The working product direction combines construction calculators, live diagrams, educational guidance, feedline tools, and jurisdiction-specific RF exposure screening.

The current workshop includes dimensioned half-wave dipole, fan dipole, balanced-line multiband doublet, inverted-V, EFHW, off-centre-fed dipole, J-pole, Slim Jim, Moxon rectangle, three-element Yagi, ground-mounted quarter-wave vertical, elevated quarter-wave ground plane, and full-wave-loop designs. General wire-antenna guides cover support planning, equal-leg or perimeter construction, balanced feeding, common-mode control, installed measurement, and symmetrical tuning. The fan-dipole workflow calculates two to six independent resonant wire pairs, total material, and longest span while guiding stable spacing and interactive highest-frequency-first tuning without predicting mutual coupling or the combined feedpoint impedance. The doublet workflow sizes equal legs from the lowest intended frequency, shows balanced-line physical and electrical length plus an eighth-wave adjustment increment, and guides balanced tuner or external-balun commissioning without inventing the tuner-side impedance or loss. The other multiband wire workflows include transformer assumptions, harmonic-use context, RF return-path or common-mode guidance, and applicable safety cautions. The EFHW workflow adds optional build-and-tune guidance and contextual explanations for impedance ratio, assumed end impedance, wire correction, and trim allowance without treating the calculator as a transformer design tool. The OCFD workflow likewise guides feedpoint selection, current-balun and choking decisions, unequal-leg trimming, installed measurement, and per-band verification without predicting the finished impedance or pattern. Vertical workflows distinguish a ground-level RF radial field from elevated sloping counterpoise wires and guide site planning, symmetrical construction, feed routing, installed tuning, and separate lightning and electrical-safety grounding. J-pole and Slim Jim guides explain construction-medium assumptions, parallel matching geometry, adjustable coax taps, choking, and controlled tuning; the Slim Jim workflow also covers its interrupted folded side and gap. Directional workflows guide constant-diameter Moxon construction, critical gap control, scale-faithful National Bureau of Standards Yagi geometry, feed and boom choices, and installed match and pattern verification without predicting finished performance. Feedline tools include guided first-order power budgeting for matched cable and accessory loss, SWR, return loss, mismatch loss, and accepted power; a velocity-factor-aware coaxial stub workflow with termination and calibrated trimming guidance; and guided directional ERP/EIRP accounting with explicit power reference planes, documented loss, dBi or dBd gain references, and separate exposure duty-cycle transfer. Band selectors connect conventional metre names to their actual frequency allocations and wavelengths for Canada, the United States, the United Kingdom, and Australia.

The application is being developed locally before deployment at [radiobook.ca/antennas](https://www.radiobook.ca/antennas/). RadioBook Antenna Workshop is developed by Greg Weir, VA1GW, for [Tartanleaf.com Inc.](https://www.tartanleaf.com/).

The RF exposure workspace provides boundary-tested official power-density reference levels for Canada and the United States, a conservative single-source far-field estimate, frequency-normalized multiple-source aggregation, and a printable station project spanning independently positioned transmitting antennas and accessible evaluation points. Its interactive site plan supports drag, touch, and keyboard positioning while keeping the numeric coordinate fields synchronized for precise entry. Station sources can also record and visualize an unknown, omnidirectional, bidirectional, or directional azimuth envelope with true bearing and approximate beamwidth. Source-to-point analysis derives the true bearing, nearest entered lobe, off-axis angle, and illustrative envelope relationship for every path. These graphics and classifications are orientation aids only; the screen continues to apply maximum gain toward every point. Antenna geometry can be carried through ERP/EIRP system calculations into a station-project source without re-entering frequency, dimensions, power, loss, or gain. Station projects are saved only in the browser and can be exported as validated, versioned JSON files for backup or transfer. A structured evidence log preserves assumptions, measurements, source references, review dates, and reviewer notes in the portable and printable record. Each entry can be scoped to the project, a transmitter, an evaluation point, or a specific input. A derived review checklist distinguishes calculation blockers, category-level and field-level documentation gaps, recorded prerequisites, and independent technical review without assigning a compliance score. A project can be duplicated into an independent what-if scenario and compared with its saved baseline across every stable evaluation-point and evidence-entry identity. The comparison includes an input audit covering project state, source settings, point geometry, evidence, and added or removed entities. A read-only sensitivity explorer charts the complete multi-source total while varying transmitter output, duty cycle, antenna height, or one point’s radial plan distance. Users can set the displayed range, inspect every plotted sample in an accessible table, download the samples as CSV, and review interpolated crossings of the preliminary screening trigger. Separate United States workflows evaluate the FCC single-source and collective-source exemptions in 47 CFR § 1.1307(b)(3), while keeping exemption from routine evaluation distinct from compliance with RF exposure limits. United Kingdom workflows apply Ofcom's current assessment and record thresholds and reproduce the conservative v1.1 compliance-distance method with explicit antenna-size and reflection limitations. Australian workflows provide the ACMA class-licence gateway, ARPANSA RPS S-1 reference tables, and a versioned clauses 4–6 record worksheet. The worksheet distinguishes current named-standard and transitional assessment routes, captures reproducibility evidence, and includes a station-change log that keeps post-change clause 3 review, clause 4 assessment action, and declaration replacement separate. Its dedicated archival print report expands complete multiline content, change entries and documentation summaries without relying on form-control rendering. It never treats completed fields as a compliance determination. The tools expose average power, feed loss, antenna gain, antenna height, three-dimensional separation geometry, source inventory, and applicability assumptions. They do not determine compliance. Pattern-based attenuation, near-field evaluation, measurement uncertainty calculations, off-site source discovery, and automatic terrain or building modelling remain future work.

From the review checklist, a user can select a missing critical value and open an evidence draft already scoped to the matching project, source, evaluation point, and input. Reusable source-reference, measurement, conservative-assumption, and technical-review templates suggest record structure without supplying evidence values. Category-specific quality prompts record which reproducibility elements the author says are addressed and identify documentation follow-up without verifying the evidence. Evidence can be searched, filtered, sorted, summarized, and assigned an optional author-selected review reminder. Optional step-by-step guidance and touch-, keyboard-, and pointer-accessible contextual help explain unfamiliar workflow terms without hiding advanced controls. The station-project guide covers assessment context, a shared site origin, source inventory, accessible locations, evidence, applicability, and interpretation; field help clarifies duty cycle, maximum gain, antenna dimensions, and height references.
Reference-limit, single-source, and normalized multi-source guides now cover environment classification, regulatory averaging, accessible-point geometry, far-field applicability, source inventory, frequency-specific normalization, and escalation without turning a preliminary screen into a compliance result.

For the Australian workflow, gateway facts and model provenance can be carried into a new unsaved worksheet without filling assessment judgments, evidence, or the declaration. A separate ACMA simple RF exclusion-distance workflow reproduces the official public-exposure workbook above 30 MHz and adds the Amateur Class Licence far-field applicability check. Its maximum-gain, continuous-power result does not account for losses, environment, antenna pattern, multiple sources, or near fields.

The persistent header preferences include System, Light, and Dark display modes. System follows live operating-system colour-scheme changes.

The [RF exposure independent review package](docs/RF_EXPOSURE_REVIEW.md) identifies the exact implementation, governing sources, reproducible vectors, open technical decisions, and sign-off record required before public beta release.

## Local development

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

The development server listens on all local interfaces. Open `http://localhost:5174/antennas/` on this computer or `http://192.168.8.x:5174/antennas/` from another device on the LAN, replacing `x` with the development computer's address.

LAN access over plain HTTP is suitable for browser testing, but service workers and installation require HTTPS or the device's own `localhost`.

## Verification

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

- `npm test` runs calculation and data-contract tests.
- `npm run test:e2e` runs persistent-preference, interaction, update-notice, and responsive browser tests. Install Playwright's Chromium browser first, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a local Chromium-compatible executable.
- `npm run build` performs strict type checking and creates the production PWA.
- `npm run preview` serves the production build on the LAN at port 4174.

## Project layout

- `src/calculators/` contains pure, testable calculation functions.
- `src/components/` contains accessible interface and SVG visualization components.
- `src/regulations/` contains versioned jurisdiction metadata and source references.
- `src/styles/` contains RadioBook design tokens.
- `docs/` contains product, architecture, and regulatory-source documentation.
- `public/` contains installable-app assets.

Calculation results are planning and construction aids. RF exposure screening must identify its jurisdiction, assumptions, source revision, and limitations; it is not a substitute for measurements or professional assessment when a simplified method is inconclusive.

## Licence and attribution

Source code is available under the [Mozilla Public License 2.0](LICENSE). Copyright 2026 Tartanleaf.com Inc. See [ATTRIBUTION.md](ATTRIBUTION.md) for project credit and [TRADEMARKS.md](TRADEMARKS.md) for the treatment of RadioBook and Tartanleaf branding.

Project contact: [gweir@tartanleaf.com](mailto:gweir@tartanleaf.com).
