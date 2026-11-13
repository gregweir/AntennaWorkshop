# Product Specification

## Product vision

RadioBook Antenna Workshop will be an approachable, comprehensive workbench for people who build their own antennas. It should help a newcomer succeed without concealing the assumptions, controls, and source material an experienced builder needs.

The application will run in a desktop or mobile browser, install as an offline-capable PWA, and ultimately be hosted below `radiobook.ca/antennas`.

## Confirmed decisions

- Canada is the default jurisdiction, with a prominent persistent selector.
- Canada, United States, and United Kingdom assessment workflows are available. Australia includes an ACMA class-licence assessment gateway and ARPANSA reference-table workflow; station-field prediction and exclusion-distance methods require further scoping.
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
- Canada-, United States-, and United Kingdom-aware amateur-band selection with metric and imperial presentation.
- Feedline loss, mismatch, coaxial stub, ERP, and EIRP tools.
- Official Canadian and United States RF power-density reference levels.
- A United States single-source FCC routine-evaluation exemption workflow covering all three criteria in 47 CFR § 1.1307(b)(3)(i), with ERP/EIRP distinctions and explicit non-compliance vocabulary.
- A United States multiple-source FCC exemption workflow covering the special 1 mW conditions and mixed close-proximity, distance-ERP, and existing-evaluation fractions in § 1.1307(b)(3)(ii).
- United Kingdom Ofcom workflows covering the no-action, retained average-power record, and assessment-required branches plus conservative v1.1 single- and multiple-transmitter compliance-distance reproductions with explicit antenna and reflection limitations.
- An Australian ACMA class-licence gateway for fixed and mobile low-risk categories, higher-risk assessment and record requirements, simultaneous frequencies, and shared sites; a versioned on-device clauses 4 and 6 record worksheet with current and transitional route selection, reproducibility prompts, print, validated JSON import/export, and non-destructive saved revision history; and ARPANSA RPS S-1 reference levels.
- Conservative single-source far-field screening, frequency-normalized multiple-source aggregation, and printable multi-point station projects with independent source coordinates, accessible drag/touch/keyboard layout, illustrative azimuth envelopes, and descriptive source-to-point bearing analysis.
- An on-device station-project library with validated, versioned JSON import/export, a searchable and filterable evidence log scoped to projects, sources, points, and individual inputs, reusable templates, self-declared quality prompts, documentation summaries, and optional author-set review reminders. A derived assessment checklist keeps blockers, category and field-level documentation gaps, and external review distinct, and a guided action prepares the evidence form for a selected missing critical value. An optional station-assessment guide and contextual help explain shared coordinates, duty cycle, gain, antenna dimensions, height references, and inventory confirmation without hiding the complete controls. The workspace also supports non-destructive baseline-versus-scenario comparison, a typed audit of changed inputs, and read-only sensitivity curves with custom ranges, screening-trigger annotations, accessible data tables, and CSV export.
- A connected antenna-to-system-to-exposure workflow that preserves typed inputs and calculator-model provenance.
- An installable PWA shell, persistent preferences, explicit update prompts, and automated unit and browser tests.

Australian station-field prediction, near-field exposure methods, independent RF review, and production deployment remain release blockers.

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

Equivalent-radiated-power guidance must preserve the transmitter-power reference plane and definition, document feed-system loss, use antenna gain rather than uncorrected directivity, and keep the selected dBi or dBd reference attached to the entered value. Exposure duty cycle and installed geometry remain separate station-project inputs and must not silently reduce the displayed ERP or EIRP. The workflow may not represent a directional equivalent power as total radiated power, pattern prediction, time averaging, near-field analysis, or compliance.

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

Exposure guidance must require the station jurisdiction, a defensible controlled or uncontrolled environment classification, the exact evaluation frequency, and the authority's averaging treatment. The single-source workflow must identify one accessible point, use supported power, duty-cycle, loss, gain, antenna-dimension, and three-dimensional separation inputs, stop at the conservative far-field boundary, and remain inconclusive until other relevant sources are assessed. Multi-source guidance must normalize each contribution against its own frequency-specific reference level at the same point before summing. A reference lookup or below-trigger result must never be described as safe, exempt, certified, or compliant.

The FCC single-source exemption workflow must evaluate the 1 mW, 0.5–40 cm `Pth`, and distance-based ERP criteria independently. It must use the FCC definitions of available maximum time-averaged power, ERP, and minimum body separation; enforce each frequency and distance boundary; and state that exemption is solely from routine environmental evaluation. Unknown-ERP substitution, SAR, mitigation, and compliance evaluation remain outside this model.

The FCC multiple-source workflow must keep the special 1 mW path separate from the fractional equation, enforce the strict total-below-1-mW and 2 cm alternatives, and require a supported contribution method for each source. It must stop when a selected method is inapplicable or the complete source set, fixed positional relationship, and common time-averaging basis are not confirmed. Existing evaluated exposures and limits must use the same quantity and units.

The Ofcom gateway must distinguish EIRP from ERP, use maximum radiated power in the strongest direction, and average the conservative maximum transmission time over six minutes. It must treat 10 W EIRP and 6.1 W ERP as inclusive no-action maximum-power thresholds. The recorded-average branch additionally requires no more than 100 W EIRP or 61 W ERP peak. It must identify when a calculation record is required and must not imply that the gateway calculates an exclusion distance or demonstrates compliance.

The Ofcom compliance-distance workflow must reproduce calculator v1.1 frequency boundaries, EIRP conversion, six-minute averaging, reflection coefficients, ICNIRP 1998 reference levels, and E/H treatment below 10 MHz. It must disclose when an antenna exceeds half a wavelength or a highly reflective surface can invalidate the simplified assumptions. A distance result must be measured from the closest part of the antenna, retained with its inputs and source revision, and never presented as compliance without the required public-access controls.

The conservative Ofcom multiple-transmitter workflow must convert each source to EIRP, sum all source powers, combine each source’s maximum transmission time within six minutes, and cap that combined input at the calculator’s 360-second maximum. It must calculate the summed power and combined time at every distinct entered frequency and select the greatest distance. Duplicate frequency entries may share one evaluation but must remain individually visible in the source inventory. The workflow must state that this method is deliberately very conservative and does not model separate antenna positions, simultaneous field addition, patterns, or equipment belonging to other spectrum users.

The Australian reference workflow must reproduce RPS S-1 (Rev. 1) Tables 4, 5, 7, and 8 from 100 kHz to 300 GHz. It must keep general-public and occupational scenarios, whole-body and local spatial bases, 30- and 6-minute averaging periods, electric field, magnetic field, incident power density, peak fields, and limb current distinct. “ES” must be explained as an electrostimulation-limited case rather than no restriction. The workflow must not offer the existing Canadian/United States far-field screen under Australian jurisdiction until its method and regulatory applicability are separately reviewed.

The Australian class-licence gateway must evaluate the three Schedule 1 clause 3 low-risk paths independently: fixed stations at no more than 100 W average total power with every antenna inaccessible to the general public; fixed stations with the lowest antenna base at least 10 m above ground and no more than 3200 W average total EIRP in any direction; and mobile stations at no more than 100 W average total power. When none applies, it must direct the user to the clause 4 measurement or calculation and clause 6 record package without implying non-compliance. Low-risk status must not be described as an exemption from the public-exposure condition. Simultaneous frequencies, shared sites, changed stations, transitional assessments, and agent agreements must remain visible as separate considerations.

The Australian record worksheet must capture the clause 6 responsible-person identity and declaration, station location and antenna details, power, gain, size, tilt, manufacturer, model, emission mode, assessor identity and qualification, assessment date, measurements or calculations, and any agent-agreement reference. Corporate-only and agent-only fields must be conditional. Draft records must remain on-device, use a versioned validated schema, support print and validated JSON import/export, and show missing named fields without scoring compliance or verifying their contents. Imports must receive new local identities instead of overwriting records with matching source IDs. Substantive saved edits must preserve restorable earlier revisions, and restoration must first produce an unsaved draft. The interface must warn that browser storage is not an archival system and that changed declaration information requires a new declaration.

The worksheet must distinguish a new clause 4 assessment under an applicable AS/NZS 2772.2, IEEE C95.3, or IEC 62232 edition from each transitional route in subclauses 4(4), 4(6), 4(7), and 4(8). It must separately prompt for the retained record, method and scope, highest normal operating conditions, public-access locations, equipment or model, calibration or validation, uncertainty, simultaneous-frequency treatment, results, conclusion, supporting references, and station-change review. These supporting prompts improve reproducibility but must not be labelled as statutory fields, used to calculate compliance, or treated as validation that a standard or transition applies.

## Acceptance criteria for the first public beta

- Responsive operation on current Android, iOS, and desktop browsers.
- Keyboard and screen-reader operability, visible focus, and 44-pixel minimum targets.
- Cold offline return after one complete online visit.
- Persistent projects survive reload, browser restart, and application upgrade.
- Every shipped calculator has traceable sources and automated reference tests.
- Exposure calculations pass independent review and official-example cross-checks.
- Production output works correctly from the `/antennas/` subpath.
