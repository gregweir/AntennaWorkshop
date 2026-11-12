# Architecture

## Design goals

The application is static-hostable, offline-first, responsive, and deterministic. Calculations must remain independent of interface state so they can be tested, reviewed, reused in reports, and eventually executed in workers or exported tools.

## Layers

1. **Domain calculations** — pure TypeScript functions with typed inputs, results, warnings, and intermediate values.
2. **Regulatory rules** — jurisdiction-specific modules with effective dates, source revisions, applicability checks, and conservative screening logic.
3. **Visualization geometry** — pure transformations from calculation results to labelled points, paths, dimensions, and chart series.
4. **Interface components** — accessible React controls, reusable contextual and step-by-step help primitives, and native SVG renderers.
5. **Project storage** — versioned IndexedDB records with JSON import/export and forward migrations.
6. **PWA shell** — application manifest, conservative caching, explicit update prompts, offline help, and safe rollback support.

No regulatory formula should be embedded directly in a component. No diagram should recalculate an antenna independently of the domain result it illustrates.

## Calculation contract

Each calculator exposes:

- stable identifier and semantic model version;
- typed input and output units;
- input constraints and applicability checks;
- intermediate values suitable for explanation and review;
- warnings and confidence classification;
- citations and last-reviewed date;
- reference vectors and boundary tests.

## Graphics

Native SVG is the default renderer because it is responsive, accessible, printable, and lightweight. Numeric inputs are authoritative; optional direct manipulation writes through the same validation layer. Canvas or WebGL is reserved for dense plots and later three-dimensional simulation.

Diagrams provide textual titles and descriptions, visible labels, high-contrast print styling, and non-colour encodings. Exported construction drawings must retain units, model version, frequency, assumptions, and an explicit scale statement.

## Deployment shape

Vite builds hashed application assets below `/antennas/`. The service worker is updated after application resources and the HTML shell are available. Releases retain the prior and current hashed assets during the transition and verify the served service-worker bytes.

Local development listens on `0.0.0.0` for LAN access. Mobile installation testing requires trusted HTTPS; plain LAN HTTP is not treated as an installable secure origin.
