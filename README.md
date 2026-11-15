# RadioBook Antenna Workshop

[![Validate](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml/badge.svg?branch=main&event=push)](https://github.com/gregweir/AntennaWorkshop/actions/workflows/validate.yml)
[![License: MPL-2.0](https://img.shields.io/github/license/gregweir/AntennaWorkshop)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

RadioBook Antenna Workshop is an offline-capable web application for designing, building, tuning, and understanding amateur-radio antennas. It combines construction calculators, dimensioned drawings, feedline and matching tools, measured-sweep analysis, and jurisdiction-specific RF-exposure workflows in one accessible interface.

Developed by [Greg Weir, VA1GW](CONTRIBUTORS.md) for [Tartanleaf.com Inc.](https://www.tartanleaf.com/).

Deployment target: [radiobook.ca/antennas](https://www.radiobook.ca/antennas/).

## What it includes

- Graphical planners for wire, vertical, loop, directional, broadband, and receive-only antennas.
- Guided selection for newer builders and direct workbench access for experienced users.
- Metric and imperial units with band-aware frequency selection for Canada, the United States, the United Kingdom, and Australia.
- Feedline loss, complex impedance, Smith chart, transmission-line, stub, matching-network, transformer, balun/unun, ERP, and EIRP tools.
- Local Touchstone `.s1p` analysis without uploading measurement files.
- Sourced RF-exposure reference, screening, exemption, assessment, distance, and record workflows for supported jurisdictions.
- Printable build sheets, saved plans and projects, JSON and CSV transfer, contextual help, and optional step-by-step guidance.
- Installable PWA operation with offline return after the application has been loaded online.

See [Current Capabilities](docs/CAPABILITIES.md) for the detailed feature inventory and modelling boundaries.

## Local development

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5174/antennas/` on the development computer. The server listens on all local interfaces, so another device on the LAN can use `http://192.168.8.x:5174/antennas/`, replacing `x` with the development computer’s address.

The application is mounted below `/antennas/`; use that subpath during development and deployment testing.

## Verification

```bash
npm test
npm run build
npm run test:e2e
npm run test:browser-matrix
npm run test:pwa
```

- `npm test` runs calculation and data-contract tests.
- `npm run build` type-checks the project, builds the PWA, and checks bundle budgets.
- `npm run test:e2e` runs the complete Chromium interaction suite.
- `npm run test:browser-matrix` checks desktop Chromium, Firefox, and WebKit plus representative Android and iPhone profiles.
- `npm run test:pwa` verifies the production manifest, service worker, saved-data return, and offline workspaces.
- `npm run preview` serves the production build on port 4174.

See [Browser Test Matrix](docs/BROWSER_TEST_MATRIX.md) for automated coverage and physical-device release checks.

## Project structure

- `src/calculators/` — pure calculation models and unit tests.
- `src/components/` — accessible React controls, diagrams, and workbenches.
- `src/regulations/` — versioned jurisdiction data and source references.
- `src/styles/` — RadioBook design tokens and responsive presentation.
- `public/` — manifest icons, branding, and installable-app assets.
- `docs/` — product, architecture, capability, regulatory, and review documentation.

## Documentation

- [Current Capabilities](docs/CAPABILITIES.md)
- [Next Revision Plan](docs/NEXT_REVISION.md)
- [Product Specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Browser Test Matrix](docs/BROWSER_TEST_MATRIX.md)
- [Production Deployment](docs/DEPLOYMENT.md)
- [Regulatory Source Registry](docs/REGULATORY_SOURCES.md)
- [RF Exposure Review Package](docs/RF_EXPOSURE_REVIEW.md)
- [Contributing Guide](CONTRIBUTING.md)

## Safety and scope

Calculated antenna dimensions are construction starting points. Installed resonance, impedance, feedline current, component stress, pattern, structural safety, and clearances still require appropriate measurement or engineering review.

RF-exposure results retain their jurisdiction, method, assumptions, source revision, and applicability limits. A reference lookup, preliminary screen, completed worksheet, or below-trigger estimate is not by itself a compliance determination or professional certification.

## Licence and attribution

Source code is available under the [Mozilla Public License 2.0](LICENSE). Copyright 2026 Tartanleaf.com Inc. See [ATTRIBUTION.md](ATTRIBUTION.md) for project credit and [TRADEMARKS.md](TRADEMARKS.md) for the treatment of RadioBook and Tartanleaf branding.

Project contact: [gweir@tartanleaf.com](mailto:gweir@tartanleaf.com).
