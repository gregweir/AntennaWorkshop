# Next Revision Plan

## Product Goal

Make Antenna Workshop the clearest connected path from antenna choice to a measured, documented build. General electromagnetic simulation remains complementary: the application must not present construction equations as installed pattern or performance predictions.

## Milestone 1 — Connected Build Journey

- Preserve project progress through **Choose → Plan → Build → Measure → Tune → Verify → Document**.
- Preserve as-built dimensions, deviations, construction notes, and commissioning evidence in saved plans.
- Print the selected plan's calculated build sheet, drawing, build record, measurement history, saved summaries, and progression as one project record.
- Continue linking each stage to the relevant planner, measurement, feed-system, exposure, print, or export action.
- Keep checked workflow steps distinct from technical acceptance or compliance.

## Milestone 2 — Measurement and Tuning

- Attach multiple dated `.s1p` references to a plan without embedding unbounded files in browser storage. Bounded context, file fingerprints, direct in-memory analysis handoff, and structured summaries returned to plan history are implemented.
- Guide calibration, sweep range, reference plane, and final installed geometry.
- Compare calculated targets, sampled resonance observations, threshold spans, and dimensional changes.
- Show chronological deltas across saved summaries while surfacing changed measurement context and avoiding causal claims.
- Retain adjustment history without claiming that an observed change proves its cause.

## Milestone 3 — Layered Learning

- Offer persistent Quick, Builder, and Technical explanation levels without hiding controls or required checks. The first antenna-workspace layer is implemented.
- Add interactive lessons for electrical length, impedance, balance, common mode, matching, ground effects, and the limits of SWR. The initial lesson suite now covers each of these concepts with retained measurement and interpretation boundaries.
- Place explanations beside the decision or measurement where they are needed.

## Milestone 4 — Modelling Interoperability

- Export bounded, validated NEC2 models for suitable antenna families. The first centre-fed dipole deck export is implemented with explicit segmentation, source, conductor, height, and ground assumptions.
- State conductor, segmentation, source, height, and ground assumptions in both the interface and file.
- Validate reference cases across independent NEC tools before release. The free-space and perfect-ground dipole references now pass optional checks with both `nec2c` 1.3.1 and PyNEC/NEC2++ 2.4.0, within 0.1 Ω cross-engine tolerance.
- Evaluate an embedded solver only after export interoperability and reference validation are established. A browser proof now reproduces the native dipole result, but production embedding remains deferred pending an explicit GPL distribution decision and the safeguards in the [embedded-solver decision record](EMBEDDED_SOLVER_DECISION.md).

## Milestone 5 — Evidence-Based Expansion

Use documented user needs and task-based usability testing to prioritize catalogue additions. Candidate gaps include end-fed random-wire systems, sleeve and coaxial verticals, coaxial collinears, expanded Yagi configurations, and further portable designs. Every addition requires construction guidance, measurement steps, sources, limitations, tests, and accessible graphics.

## Release Gates

- Representative novice, intermediate, and experienced operators can complete the core tasks.
- Chromium, Firefox, WebKit, desktop, mobile, keyboard, print, install, update, and offline checks pass.
- Existing RF-exposure tests and source-review requirements remain green.
- Bundle budgets, schema migration, import/export validation, and preservation of saved user data pass.
