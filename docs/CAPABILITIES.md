# Current Capabilities

This document summarizes the implemented scope of RadioBook Antenna Workshop. The [Product Specification](PRODUCT_SPEC.md) contains the detailed behavioural requirements, while the [Regulatory Source Registry](REGULATORY_SOURCES.md) records the governing RF-exposure material.

## Antenna design workbench

The antenna workbench offers guided selection and a searchable, category-filtered catalogue. Calculators provide editable construction assumptions, prioritized results, dimensioned drawings, cut or material schedules, explanatory notes, source provenance, and installed-verification guidance. Every valid antenna plan can be printed as a focused build sheet.

Implemented families include:

- **Everyday wire antennas:** centre-fed and folded dipoles, inverted-V, fan dipole, off-centre-fed dipole, EFHW, multiband doublet, G5RV-family systems, full-wave loop and delta loop, halo and squalo, loop skywire, and turnstile.
- **Loaded and trapped antennas:** loaded dipole, loaded vertical, two-band trap dipole, air-core coil construction, and as-built trap commissioning records.
- **Vertical antennas:** J-pole, Slim Jim, ground-mounted quarter-wave vertical, and elevated ground plane.
- **Directional and broadband antennas:** Moxon rectangle, three-element Yagi, cubical quad, hex beam, axial-mode helix, discone, log-periodic dipole array, T2FD, phased wire collinear, V-beam, rhombic, and vertical half-rhombic.
- **Receive-only antennas:** Beverage, Flag, Pennant, EWE, K9AY, Loop-on-Ground, and untuned active receiving loop, supported by a constraint-based receive-antenna selector.
- **Small transmitting loop:** measured-inductance tuning, capacitor-range checks, and clearly labelled centre-frequency estimates for loss, efficiency, Q, bandwidth, current, and capacitor voltage.

The planners intentionally distinguish calculated starting geometry from installed performance. They do not turn nominal impedance relationships, classical estimates, or published starting dimensions into guarantees of match, gain, efficiency, pattern, bandwidth, power handling, or structural adequacy.

An optional three-design comparison focuses on space, supports, intended bands, feed and tuning systems, directional context, construction complexity, and measurements still required. It does not rank unmodelled performance.

## Feedline and matching workbench

Feedline tools are grouped by user intent:

- **Inspect and understand:** a complex-impedance explorer with reflection quantities and Smith chart, local measured-sweep analysis, and one- or two-section transmission-line transformation.
- **Build and match:** velocity-factor-aware coaxial stubs, lossless two-element L-network synthesis, quarter-wave transformation between real resistances, and ideal balun or unun ratio comparison with adjacent integer winding options.
- **Plan station power:** matched cable and accessory loss, SWR and accepted-power budgeting, plus ERP and EIRP accounting with explicit gain references and power planes.

These tools require the user to supply appropriate measured values or manufacturer data. They do not infer cable specifications, component Q and parasitics, common-mode behaviour, heating, voltage or current ratings, or safe operating power.

## Measured sweep analysis

The measured-sweep workspace opens a local Touchstone 1.x one-port `.s1p` file without uploading it. It supports RI, magnitude-angle, and dB-angle data and provides:

- SWR and Smith-chart traces with jurisdiction-aware amateur-band context.
- Minimum-SWR, closest sampled resonance, inspection-point impedance, and return-loss reporting.
- Adjustable threshold analysis with interpolated crossings, separate response windows, and explicit sweep-edge or sampled-point boundaries.
- Per-band review that distinguishes full-allocation coverage from partial sweeps.
- Optional before-and-after comparison without inferring the cause of a change.
- Calibration and reference-plane notes, print output, and aligned CSV export.

Fixture removal, calibration quality, uncertainty, efficiency, common mode, and safe power remain measurement responsibilities.

## RF exposure workbench

RF-exposure workflows are jurisdiction-specific, source-linked, and explicit about what the selected method can establish.

### Canada and United States

The application includes official power-density reference levels, a modified-free-space single-source estimate with a conservative applicability guard, frequency-normalized multiple-source aggregation, and a multi-source station project with independently positioned antennas and accessible points.

United States tools separately evaluate the FCC single-source and collective-source routine-evaluation exemption criteria. An exemption result is kept distinct from compliance with the exposure limits.

### United Kingdom

Ofcom workflows cover the assessment and record gateway plus conservative single- and multiple-transmitter compliance-distance calculations. Antenna-size, reflection, frequency, averaging, and public-access limitations remain visible with the result.

### Australia

Australian tools include the ACMA class-licence gateway, the official simple exclusion-distance method above 30 MHz, ARPANSA RPS S-1 reference levels, and a versioned clauses 4–6 assessment-record worksheet. The worksheet supports station-change review, saved revisions, archival print, and validated JSON transfer without treating completed fields as certification.

### Station projects and evidence

Station projects can be saved in the browser and transferred through validated JSON. The workspace supports source and evaluation-point coordinates, drag, touch, and keyboard layout editing, illustrative antenna orientation, evidence entries, review reminders, documentation-gap tracking, baseline-versus-scenario comparison, and read-only sensitivity analysis with CSV export.

Pattern-based exposure reduction, near-field calculation, off-site source discovery, terrain and building modelling, uncertainty analysis, and interpretation of field measurements are outside the implemented scope. The application directs unsupported cases to an applicable detailed assessment or measurement.

## Bands, units, help, and graphics

Canada, United States, United Kingdom, and Australia band selectors connect conventional metre-band names to the applicable allocation and the wavelength at the chosen frequency. Metric is the default, and the persistent unit switch converts displayed physical values without changing the underlying design.

Contextual help works with touch, keyboard, and pointer input. The antenna workspace offers persistent Quick, Builder, and Technical explanation depths without changing results or hiding controls and required checks. Its first interactive lesson graphs how free-space wavelength and half-wave size change inversely with frequency while retaining the installed-measurement boundary. Complex workflows may also provide an optional step-by-step guide while leaving advanced controls available. Result cards identify calculated values, published starting points, entered assumptions, and measurements still required.

Construction drawings are responsive SVG graphics intended to support fabrication. Conceptual graphics, sourced values, calculated estimates, and measurement requirements are labelled separately; colour is not the only carrier of meaning.

## Plans, portability, and offline operation

Antenna plans, station projects, commissioning records, and assessment worksheets are stored locally in the browser. Saved antenna plans carry a self-recorded Choose, Plan, Build, Measure, Tune, Verify, and Document journey plus portable as-built dimensions, construction departures, commissioning notes, and a bounded dated measurement history. The journey highlights the next unrecorded stage and opens its relevant build, measurement, tuning, verification, or documentation action. A measurement entry may fingerprint an `.s1p` file with SHA-256 while retaining only its identity and context, not the sweep contents. While the selected file remains in memory, the builder can save the entry and open that same sweep in the measured-sweep workbench with its plan, calibration, reference-plane, geometry, adjustment, and observation context carried forward. A bounded structured summary of sweep coverage, minimum SWR, closest sampled resonance, and the selected threshold spans can then be written back to the originating history entry. Two or more saved summaries produce a chronological progression showing observed frequency and SWR deltas plus cautions when recorded calibration, reference plane, geometry, impedance, coverage, or threshold context differs. A complete project-record print joins the restored plan's calculated build sheet and drawing to this retained history, without treating the record as technical acceptance. Supported records use versioned, validated JSON import and export; measured data and sensitivity results can also be exported as CSV. Browser storage is convenient working storage, not an archival substitute.

The PWA retains jurisdiction, units, theme, workspace, and selected calculator preferences while leaving unsaved calculator inputs transient. It provides an explicit update prompt and can return offline after a complete online visit. Installation guidance covers Chromium browsers, iPhone and iPad Safari, and browser-menu fallbacks.

Automated verification includes calculation and contract tests, complete Chromium interaction coverage, a focused Chromium/Firefox/WebKit and mobile-profile matrix, production manifest and service-worker checks, offline return, persistent-data checks, the `/antennas/` deployment path, and JavaScript bundle budgets.

## Modelling and safety boundaries

The workshop is an engineering and educational aid for amateur-radio builders. Antenna calculators require installed measurement and appropriate review of RF, electrical, mechanical, weather, access, and power-line hazards.

RF-exposure reference values, estimates, screening results, exemption checks, records, and documentation prompts must be interpreted within their cited method. They are not automatic findings of safety, compliance, non-compliance, or professional approval. See the [RF Exposure Review Package](RF_EXPOSURE_REVIEW.md) for the independent-review boundary.
