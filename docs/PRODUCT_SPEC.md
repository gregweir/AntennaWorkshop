# Product Specification

## Product vision

RadioBook Antenna Workshop will be an approachable, comprehensive workbench for people who build their own antennas. It should help a newcomer succeed without concealing the assumptions, controls, and source material an experienced builder needs.

The application will run in a desktop or mobile browser, install as an offline-capable PWA, and ultimately be hosted below `radiobook.ca/antennas`.

## Confirmed decisions

- Canada is the default jurisdiction, with a prominent persistent selector.
- United States support is required for the first release. United Kingdom support follows; Australia requires further scoping.
- Station location, not browsing location, determines the applicable jurisdiction. Network-derived location may suggest a first-visit default but never overrides an explicit selection.
- Metric is the default unit system. Imperial conversion is available everywhere through a single toggle.
- Design frequency inputs include jurisdiction-aware amateur-band selectors. The interface distinguishes conventional band names from the actual wavelength at the selected frequency.
- The standard experience is beginner-friendly; Advanced controls remain available from day one.
- The visual system follows RadioBook and Tartanleaf branding.
- The application remains useful offline and does not require an account.
- Source code is published under MPL-2.0. Tartanleaf and RadioBook brand identifiers remain separately protected.

## Current implementation

The public repository currently includes:

- Eleven graphical antenna starting designs covering wire, vertical, loop, folded, and directional families.
- Canada- and United States-aware amateur-band selection with metric and imperial presentation.
- Feedline loss, mismatch, coaxial stub, ERP, and EIRP tools.
- Official Canadian and United States RF power-density reference levels.
- Conservative single-source far-field screening, frequency-normalized multiple-source aggregation, and printable multi-point station projects with independent source coordinates, accessible drag/touch/keyboard layout, illustrative azimuth envelopes, and descriptive source-to-point bearing analysis.
- An on-device station-project library with validated, versioned JSON import/export, a searchable and filterable evidence log scoped to projects, sources, points, and individual inputs, reusable templates, self-declared quality prompts, documentation summaries, and optional author-set review reminders. A derived assessment checklist keeps blockers, category and field-level documentation gaps, and external review distinct, and a guided action prepares the evidence form for a selected missing critical value. An optional station-assessment guide and contextual help explain shared coordinates, duty cycle, gain, antenna dimensions, height references, and inventory confirmation without hiding the complete controls. The workspace also supports non-destructive baseline-versus-scenario comparison, a typed audit of changed inputs, and read-only sensitivity curves with custom ranges, screening-trigger annotations, accessible data tables, and CSV export.
- A connected antenna-to-system-to-exposure workflow that preserves typed inputs and calculator-model provenance.
- An installable PWA shell, persistent preferences, explicit update prompts, and automated unit and browser tests.

Near-field exposure methods, independent RF review, and production deployment remain release blockers.

## Core experience

Users can begin either by choosing an antenna family or by describing a goal such as portable HF, a fixed VHF antenna, or an RF exposure check. Each calculator provides:

1. Clear inputs with units, defaults, and contextual help.
2. A live, dimensioned construction diagram.
3. A cut list and practical build notes.
4. Formula, source, assumptions, applicability, and intermediate values.
5. A tuning procedure that distinguishes the calculated starting point from the finished antenna.
6. Saved projects, comparison, print, and export capabilities.

Contextual help must work with touch, keyboard, and pointer input. Complex sections may also provide an optional, collapsible step-by-step guide. Guidance should explain the existing workflow rather than create a separate simplified mode or conceal advanced controls.

The EFHW guide must distinguish impedance ratio from winding turns ratio, treat end impedance and multiband resonances as installation-dependent assumptions, and lead the builder through return-path planning, documented transformer selection, build-long construction, installed measurement, and per-band verification. It must not imply that the calculator designs or power-rates a transformer or prescribes one universal counterpoise.

The OCFD guide must explain how the selected split changes both leg lengths and likely feedpoint impedance, distinguish a nominal current-balun ratio from a complete balun and choking design, and preserve the selected split while trimming. It must require installed measurement on each intended band and avoid promising a match, pattern, or tuner-correctable common-mode system.

J-pole and Slim Jim guides must explain the construction-medium correction factor, parallel matching geometry, paired coax-tap adjustment, feedline choking, and installed vertical measurement. Slim Jim guidance must additionally preserve the interrupted folded side and gap. Neither guide may promise feedpoint impedance, bandwidth, pattern, or a universal tap or gap position from a low-SWR result.

Quarter-wave vertical guidance must distinguish a ground-mounted RF radial field from equal elevated counterpoise radials. The ground-mounted workflow must cover radial count and length, the radiator-only trim allowance, base and feed connections, and separate lightning and electrical-safety grounding. The elevated ground-plane workflow must cover equal radial count, symmetrical slope, shared cut allowance, coax routing, and common-mode control. Neither may promise impedance, efficiency, matching, or installed pattern.

Centre-fed dipole and inverted-V guidance must preserve equal legs, balanced feeding, common-mode control, endpoint safety, final support geometry, and symmetrical trimming. Inverted-V guidance must explain that the apex angle changes span and drop without prescribing support height. Full-wave-loop guidance must preserve total perimeter while distinguishing the selected idealized shape from the installed plane, feedpoint, matching, and distorted geometry. These guides may not promise impedance, bandwidth, multiband response, or pattern.

Directional-antenna guidance must preserve the Moxon rectangle's constant-diameter assumption, symmetrical A–E geometry, critical gaps, balanced feeding, and installed pattern verification. The basic Yagi guide must treat the element lengths, 0.0085λ diameter, centre-to-centre spacing, folded driven element, matching arrangement, and non-conductive boom as one NBS reference system. Material, boom, mounting, or feed substitutions require separate modelling and measurement; neither guide may promise SWR, gain, bandwidth, front-to-back ratio, or installed pattern.

Feedline guidance must distinguish manufacturer matched-loss data from installed loss under mismatch, use the complete cable and accessory path, identify the measurement reference plane, and explain that SWR does not reveal complex impedance. Coaxial-stub guidance must distinguish electrical from physical length, use the actual cable velocity factor, include connectors and termination geometry, and require calibrated measurement and trimming at the design frequency. Neither guide may imply a transmission-line simulation, power rating, complete matching-network design, or guaranteed bandwidth.

## Visual language

Visuals are functional rather than decorative:

- **Construction drawing:** dimensioned and intended for building.
- **Conceptual illustration:** educational and explicitly not to scale.
- **Calculated estimate:** derived from a documented formula.
- **Simulated result:** produced by an identified model and configuration.

Initial visuals cover a dipole or inverted-V, vertical with radials, loop, Moxon or Yagi, feedline path, tuning plot, and RF exposure side view. Colour reinforces meaning but never carries it alone.

## Initial calculator roadmap

The first useful release includes wavelength, dipole, inverted-V, quarter-wave vertical, ground plane, full-wave loop, EFHW, off-centre-fed dipole, J-pole, Slim Jim, Moxon, basic Yagi, feedline loss, velocity factor, coaxial stubs, SWR, return loss, mismatch loss, ERP/EIRP, and unit conversion.

Advanced families later include loaded and trap antennas, fan dipoles, doublets, multiband designs, magnetic loops, loaded verticals, collinears, cubical quads, helices, discones, log-periodics, receive antennas, coils, traps, and matching networks.

## RF exposure

Exposure tools are jurisdiction-specific and versioned. The first release includes separate Canadian and United States workflows, multiple transmitters, controlled and uncontrolled environments, duty cycle, feedline loss, antenna gain, ground reflection, accessible locations, and printable records.

The result vocabulary must distinguish:

- a screen that demonstrates compliance under its stated conservative assumptions;
- a screen that is inconclusive and requires detailed calculation, measurement, or mitigation;
- an invalid scenario outside the method's applicability.

The application must not turn an inconclusive simplified screen into a claim of non-compliance or certification.

## Acceptance criteria for the first public beta

- Responsive operation on current Android, iOS, and desktop browsers.
- Keyboard and screen-reader operability, visible focus, and 44-pixel minimum targets.
- Cold offline return after one complete online visit.
- Persistent projects survive reload, browser restart, and application upgrade.
- Every shipped calculator has traceable sources and automated reference tests.
- Exposure calculations pass independent review and official-example cross-checks.
- Production output works correctly from the `/antennas/` subpath.
