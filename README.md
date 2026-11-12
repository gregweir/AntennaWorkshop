# RadioBook Antenna Workshop

[![Validate](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml/badge.svg)](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml)

RadioBook Antenna Workshop is an offline-first browser application for designing, understanding, building, tuning, and evaluating amateur-radio antennas. The working product direction combines construction calculators, live diagrams, educational guidance, feedline tools, and jurisdiction-specific RF exposure screening.

The current workshop includes dimensioned half-wave dipole, inverted-V, EFHW, off-centre-fed dipole, J-pole, Slim Jim, Moxon rectangle, three-element Yagi, ground-mounted quarter-wave vertical, elevated quarter-wave ground plane, and full-wave-loop designs. The multiband wire workflows include transformer assumptions, harmonic-use context, RF return-path or common-mode guidance, and applicable safety cautions. Vertical workflows distinguish a ground-level radial field from elevated sloping counterpoise wires, and the parallel J-pole designs distinguish radiator sections, matching stubs, adjustable coax taps, and the Slim Jim’s interrupted folded side. The directional workflows include the diameter-aware Moxon geometry and a scale-faithful National Bureau of Standards Yagi reference, with prominent matching and pattern limitations. Feedline tools include a first-order power budget for loss, SWR, return loss, mismatch loss, and accepted power; a velocity-factor-aware coaxial stub calculator; and directional ERP/EIRP accounting with explicit dBi or dBd gain references. Band selectors connect conventional metre names to their actual frequency allocations and wavelengths for Canada and the United States.

The application is being developed locally before deployment at [radiobook.ca/antennas](https://www.radiobook.ca/antennas/). RadioBook Antenna Workshop is developed by Greg Weir, VA1GW, for [Tartanleaf.com Inc.](https://www.tartanleaf.com/).

The RF exposure workspace provides boundary-tested official power-density reference levels for Canada and the United States, a conservative single-source far-field estimate, frequency-normalized multiple-source aggregation, and a printable station project spanning independently positioned transmitting antennas and accessible evaluation points. Its interactive site plan supports drag, touch, and keyboard positioning while keeping the numeric coordinate fields synchronized for precise entry. Station sources can also record and visualize an unknown, omnidirectional, bidirectional, or directional azimuth envelope with true bearing and approximate beamwidth. Source-to-point analysis derives the true bearing, nearest entered lobe, off-axis angle, and illustrative envelope relationship for every path. These graphics and classifications are orientation aids only; the screen continues to apply maximum gain toward every point. Antenna geometry can be carried through ERP/EIRP system calculations into a station-project source without re-entering frequency, dimensions, power, loss, or gain. Station projects are saved only in the browser and can be exported as validated, versioned JSON files for backup or transfer. A structured evidence log preserves assumptions, measurements, source references, review dates, and reviewer notes in the portable and printable record. Each entry can be scoped to the project, a transmitter, an evaluation point, or a specific input. A derived review checklist distinguishes calculation blockers, category-level and field-level documentation gaps, recorded prerequisites, and independent technical review without assigning a compliance score. A project can be duplicated into an independent what-if scenario and compared with its saved baseline across every stable evaluation-point and evidence-entry identity. The comparison includes an input audit covering project state, source settings, point geometry, evidence, and added or removed entities. A read-only sensitivity explorer charts the complete multi-source total while varying transmitter output, duty cycle, antenna height, or one point’s radial plan distance. Users can set the displayed range, inspect every plotted sample in an accessible table, download the samples as CSV, and review interpolated crossings of the preliminary screening trigger. The tools expose average power, feed loss, antenna gain, antenna height, three-dimensional separation geometry, source inventory, and applicability assumptions. They do not determine compliance. Exemption analysis, pattern-based attenuation, near-field evaluation, measurement uncertainty, off-site source discovery, and automatic terrain or building modelling remain future work.

From the review checklist, a user can select a missing critical value and open an evidence draft already scoped to the matching project, source, evaluation point, and input. Reusable source-reference, measurement, conservative-assumption, and technical-review templates suggest record structure without supplying evidence values. Category-specific quality prompts record which reproducibility elements the author says are addressed and identify documentation follow-up without verifying the evidence. Evidence can be searched, filtered, sorted, summarized, and assigned an optional author-selected review reminder. Optional step-by-step guidance and touch-, keyboard-, and pointer-accessible contextual help explain unfamiliar workflow terms without hiding advanced controls. The station-project guide covers assessment context, a shared site origin, source inventory, accessible locations, evidence, applicability, and interpretation; field help clarifies duty cycle, maximum gain, antenna dimensions, and height references.

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
