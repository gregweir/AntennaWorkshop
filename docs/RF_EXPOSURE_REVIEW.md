# RF Exposure Independent Review Package

## Purpose and review status

This package defines the RF-exposure implementation that requires independent technical review before public beta release. It is a reproducible map from governing sources to code, equations, test vectors, user-visible classifications, and unresolved decisions. It is not a compliance report or evidence that review has passed.

Review scope includes the Canadian, United States, United Kingdom, and Australian regulatory workflows; the FCC single- and multiple-source routine-evaluation exemptions; the modified-free-space preliminary screen; normalized multiple-source total; and multi-point station project. Near-field analysis, measurements, uncertainty analysis, pattern attenuation, and compliance certification are not implemented.

## Authoritative sources

- Health Canada, [Safety Code 6](https://www.canada.ca/en/health-canada/services/publications/health-risks-safety/limits-human-exposure-radiofrequency-electromagnetic-energy-range-3-300.html) and its [Technical Guide](https://www.canada.ca/en/health-canada/services/health-risks-safety/radiation/occupational-exposure-regulations/safety-code-6-radiofrequency-exposure-guidelines/technical-guide.html).
- ISED, [TN-261, Issue 3](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2022/tn-261-i3-mar15.pdf), [GL-01](https://www.ised-isde.canada.ca/site/spectrum-management-telecommunications/en/learn-more/key-documents/guidelines/gl-01-guidelines-measurement-radio-frequency-fields-frequencies-3-khz-300-ghz), and [BPR-1](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2022/BPR-P1i82021-01EN.pdf).
- FCC, [47 CFR § 1.1307](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1307), [47 CFR § 1.1310](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1310), and [OET Bulletin 65](https://www.fcc.gov/sites/default/files/oet65.pdf).
- Ofcom, [Guidance on EMF Compliance and Enforcement V1.1](https://www.ofcom.org.uk/spectrum/electromagnetic-fields/guidance-on-emf-compliance-and-enforcement), [amateur-radio EMF guidance V2.1](https://www.ofcom.org.uk/spectrum/electromagnetic-fields/emf-licence-condition-what-you-need-to-know-as-an-amateur-radio-user), and EMF Calculator v1.1.
- ARPANSA, [RPS S-1 (Rev. 1)](https://www.arpansa.gov.au/regulation-and-licensing/regulatory-publications/radiation-protection-series/codes-and-standards/rpss-1), and ACMA, [Radiocommunications (Amateur Stations) Class Licence 2023](https://www.legislation.gov.au/F2023L01648/latest/text).

Sources and links were rechecked on 2026-11-14. The eCFR text was current through 2026-11-12; Ofcom V1.1 dated 9 February 2026 remained current; and the Australian Class Licence 2023 and RPS S-1 Rev. 1 (2021) remained the latest applicable instruments identified. A reviewer should independently confirm and record the editions and effective text used for sign-off.

## Implementation map

| Review area | Implementation | Tests |
| --- | --- | --- |
| Canadian and US reference levels | `src/regulations/exposureLimits.ts` | `src/regulations/exposureLimits.test.ts` |
| Australian whole-body, local, peak, and limb-current reference levels | `src/calculators/arpansaReference.ts` | `src/calculators/arpansaReference.test.ts` |
| Australian Amateur Class Licence assessment gateway | `src/calculators/acmaAssessment.ts` | `src/calculators/acmaAssessment.test.ts` |
| Australian ACMA simple exclusion distance | `src/calculators/acmaExclusionDistance.ts` | `src/calculators/acmaExclusionDistance.test.ts` |
| Australian clause 4 route and evidence-readiness map | `src/calculators/acmaEvidence.ts` | `src/calculators/acmaEvidence.test.ts` |
| Australian clause 6 record schema and documentation gaps | `src/projects/acmaAssessmentRecords.ts` | `src/projects/acmaAssessmentRecords.test.ts` |
| Australian station-change and reassessment log | `src/projects/acmaStationChanges.ts` | `src/projects/acmaStationChanges.test.ts` |
| FCC single-source exemption | `src/calculators/fccExemption.ts` | `src/calculators/fccExemption.test.ts` |
| FCC multiple-source exemption | `src/calculators/fccMultipleExemption.ts` | `src/calculators/fccMultipleExemption.test.ts` |
| Ofcom assessment and record gateway | `src/calculators/ofcomAssessment.ts` | `src/calculators/ofcomAssessment.test.ts` |
| Ofcom single-transmitter compliance distance | `src/calculators/ofcomComplianceDistance.ts` | `src/calculators/ofcomComplianceDistance.test.ts` |
| Ofcom multiple-transmitter distance | `src/calculators/ofcomMultipleDistance.ts` | `src/calculators/ofcomMultipleDistance.test.ts` |
| Single-source estimate and applicability | `src/calculators/exposureScreen.ts` | `src/calculators/exposureScreen.test.ts` |
| Multiple-source normalization | `src/calculators/exposureAggregation.ts` | `src/calculators/exposureAggregation.test.ts` |
| Source-to-point geometry and project status | `src/calculators/exposureProject.ts` | `src/calculators/exposureProject.test.ts` |
| User wording and workflow | `src/components/Exposure*` | `tests/app.spec.ts` |

Every calculation model has a stable identifier and version. Regulatory source revisions and review dates are preserved in the result path or supporting documentation.

## Equations and classifications

For transmitter output `P`, duty cycle `d`, feed-system loss `L` in dB, gain `G` in dBi, and three-dimensional separation `r`:

```text
Pavg       = P × d / 100
Pantenna   = Pavg × 10^(-L/10)
EIRPavg    = Pantenna × 10^(G/10)
Sestimated = 2.56 × EIRPavg / (4πr²)
fraction   = Sestimated / Sreference(frequency, environment, jurisdiction)
```

The `2.56` multiplier is the squared effect of a reflected electric field taken as 60% of the direct field in the ISED modified-free-space method. TN-261 applies this reflection assumption to calculations at 2 m above ground or rooftop level. The application keeps it visible for every supported preliminary-screen scenario and does not present it as an FCC-prescribed method.

Wavelength uses `299,792,458 m/s`. TN-261 Table 1 uses `λ/(2π)` when the largest antenna dimension `D ≤ λ`, otherwise `0.5D²/λ`. The application uses the same small-antenna boundary but stops interpretation inside a stricter `2D²/λ` guard for electrically large antennas. It reports both values; a point inside the application guard is classified `method-inapplicable`.

Multiple power-density contributions at one physical point are normalized before addition:

```text
F = Σ(Si / Sreference,i)
```

The Australian ACMA workbook reproduction above 30 MHz uses transmitter output `P`, maximum antenna gain `G` converted to a linear isotropic ratio, and its general-public power-density level `S`:

```text
d = √(P × G / (4 × 3.14 × S))
```

The workbook does not reduce power for duty cycle or loss and does not use a radiation pattern. The separate Class Licence applicability boundary is `max(2D²/λ, 0.5λ)`; the numerical workbook distance is not interpreted when it lies inside that boundary.

Canadian uncontrolled scenarios escalate at `F ≥ 0.5`; other encoded scenarios escalate at `F ≥ 1`. An incomplete local-source inventory always produces `screening-inconclusive`. “Below screening trigger” is never presented as safe, exempt, certified, or compliant.

The FCC single-source exemption model evaluates § 1.1307(b)(3)(i)(A)–(C) independently. Criterion A compares available maximum time-averaged power with `1 mW`. Criterion B evaluates the official `Pth` equation only from 0.5 to 40 cm and 0.3 to 6 GHz, using the greater of available power or ERP. Criterion C compares entered ERP with the piecewise Table 1 threshold only from 0.3 to 100,000 MHz and at `R ≥ λ/(2π)`. Satisfying any path means exemption only from routine environmental evaluation.

The FCC multiple-source model keeps § 1.1307(b)(3)(ii)(A) separate from the fractional equation in paragraph (B). The low-power path requires every source at or below 1 mW plus either total available power strictly below 1 mW or at least 2 cm inter-source separation. The alternative equation sums `P/Pth`, `ERP/ERPth`, and `Evaluated/Exposure Limit` terms and qualifies at a total no greater than one. The user must confirm the complete source set, fixed positional relationship, and compatible time averaging.

## Reproducible vectors

The automated suite should reproduce these values within the precision asserted by its tests:

| Vector | Expected result |
| --- | --- |
| FCC uncontrolled, 146 MHz | `2.000 W/m²`, 30-minute averaging |
| FCC controlled, 146 MHz | `10.000 W/m²`, 6-minute averaging |
| SC6 uncontrolled, 146 MHz | `1.291 W/m²`, 6-minute reference period |
| SC6 controlled, 146 MHz | `0.6455 × √146 = 7.800 W/m²`, 6-minute reference period |
| Canadian screen: 146 MHz, 50 W, 50%, 1 dB loss, 2.15 dBi, 10 m | `Pavg = 25 W`; `Pantenna ≈ 19.858 W`; `EIRPavg ≈ 32.579 W`; `S ≈ 0.06637 W/m²`; `F ≈ 0.0514` |
| Canadian aggregate: 0.1291 W/m² at 146 MHz plus 0.06455 W/m² at 446 MHz | contributions `0.1000` and approximately `0.03813`; total approximately `0.13813` |
| FCC distance exemption: 146 MHz, 100 W ERP, 10 m | Table 1 threshold `3.83 × 10² = 383 W`; qualifies for exemption from routine evaluation |
| FCC mixed collective exemption | close-proximity `0.20` + distance ERP `0.30` + existing evaluation `0.50` = `1.00`; qualifies at the inclusive fractional threshold |
| Ofcom gateway: 100 W EIRP, 36 seconds in six minutes | average `10 W EIRP`; no assessment required, but the calculation record must be retained |
| Ofcom distance: 450 MHz, 200 W EIRP, 120 seconds | `2.46 m` |
| Ofcom multiple: 100 W at 450 MHz and 100 W at 1800 MHz, each 60 seconds | evaluate `200 W` and `120 seconds` at both frequencies; 450 MHz governs at `2.46 m` |
| ARPANSA general public, 146 MHz | whole body `27.7 V/m`, `0.073 A/m`, `2 W/m²` over 30 minutes; local `62 V/m`, `0.163 A/m`, `10 W/m²` over 6 minutes |
| ACMA fixed low-risk height/EIRP path | lowest antenna base `10 m` and average total EIRP `3200 W` satisfies the inclusive clause 3 threshold; `9.999 m` or `3200.001 W` does not |
| ACMA simple distance: 3000 MHz, 400 W, 5 dBi | `S = 10 W/m²`; `G = 3.1622776602`; `d = 3.1734756911 m`, displayed as `3.2 m` by the workbook |

Health Canada Technical Guide Example C-1 provides an official free-space cross-check: 50 W EIRP at 1200 MHz has a `3.33 W/m²` uncontrolled reference level and a minimum distance of approximately `1.09 m` using `EIRP/(4πr²)`. With the application’s explicit `2.56` reflected-field multiplier, the corresponding preliminary-screen distance is approximately `1.75 m`. This difference, and the multiplier’s TN-261 2 m context, must be approved or revised during review.

The Technical Guide’s mixed-source examples also demonstrate that power-density fractions add arithmetically while electric- and magnetic-field quantities use their applicable squared ratios. The application only aggregates power-density inputs within its supported frequency range; it does not implement the guide’s mixed-field comparison criteria.

## Required reviewer decisions

The reviewer should resolve each item explicitly:

1. Is the TN-261/BPR-1 `2.56` modified free-space model appropriate for this amateur-station preliminary screen, and should its use extend to controlled Canadian and both US environments?
2. Do the duty-cycle instructions correctly represent rolling or maximum time-averaged power under Safety Code 6 and FCC rules, including worst-case operating assumptions?
3. Are EIRP, ERP, gain-reference, feed-loss, and transmitter-power reference planes kept distinct between the dedicated FCC exemption workflow and the separate EIRP-based far-field screen?
4. Is the distinction between TN-261 Table 1’s `λ/(2π)` or `0.5D²/λ` boundary and the application’s stricter electrically large-antenna `2D²/λ` guard technically appropriate, or is a transition-region treatment required?
5. Is the Canadian `50%` escalation threshold applied to the correct scope of uncontrolled scenarios without implying that a lower value demonstrates compliance?
6. Does normalized multi-source addition preserve compatible physical locations, time averaging, exposure quantities, and simultaneous-operation assumptions?
7. Are all unsupported cases stopped or clearly escalated, including Canadian operation below 10 MHz, near-field points, incomplete source inventories, induced/contact currents, spatial averaging, uncertainty, and missing off-site sources?
8. Is the status precedence correct when a project contains both an inapplicable path and another path that reaches an escalation threshold?
9. Are the interface, printed record, and exported project vocabulary sufficiently clear that users cannot confuse screening, exemption, evaluation, mitigation, and demonstrated compliance?
10. Does the Australian lookup preserve the correct spatial and temporal basis, field-region requirements, `ES` treatment, additional peak-field and limb-current checks, and distinction between RPS S-1 tables and the Amateur Class Licence conditions?
11. Does the Australian gateway distinguish clause 3 application from a compliance presumption, preserve the continuing clause 2 condition, and correctly describe clauses 4 and 6 without overlooking station changes or transitional provisions?
12. Does the Australian record worksheet capture the required clause 6 information without turning field presence, local saving, printing, JSON import/export, or revision restoration into an approval or compliance claim, and are its validation, non-overwrite, privacy, and retention safeguards adequate?
13. Does the Australian clause 4 evidence map accurately distinguish the current named-standard route from subclauses 4(4), 4(6), 4(7), and 4(8), keep record anchors separate from optional reproducibility prompts, and avoid deciding standard applicability, transition eligibility, continuous possession, or compliance?
14. Does the Australian change log correctly distinguish clause 5's post-change clause 3 question, clause 4 assessment action, and clause 6(4) declaration replacement without implying that every change requires reassessment or that documented follow-up authorizes operation?
15. Does the Australian archival print report reproduce every current record field and change entry without clipping, preserve draft/saved and missing-information states, identify its source, and remain unmistakably a record copy rather than a compliance certificate?
16. Does the Australian gateway-to-record handoff preserve the exact canonical inputs and model provenance in a new unsaved draft while leaving route, standard, scope, method, assessor, evidence, conclusion, and declaration decisions blank?
17. Does the Australian simple exclusion-distance workflow exactly reproduce the official workbook, keep its continuous-power and maximum-gain assumptions visible, apply the Class Licence far-field boundary separately, and stop users from interpreting unsupported near-field or pattern-specific cases?
18. Does the Ofcom gateway reproduce the current maximum- and average-power thresholds, six-minute averaging treatment, record requirements, and public-access scope without treating “no assessment required” as demonstrated compliance?
19. Does the Ofcom single-transmitter distance workflow reproduce calculator v1.1 frequency boundaries, ERP conversion, reflection coefficients, E/H treatment below 10 MHz, antenna-size warnings, and distance reference point?
20. Does the Ofcom multiple-transmitter workflow correctly sum EIRP, combine maximum transmission times, saturate at 360 seconds, evaluate every entered frequency, and disclose the limitations of its deliberately conservative combined-source method?

## Reproduction procedure

Use a clean checkout at the reviewed commit and record the commit hash, runtime versions, and command output:

```bash
npm ci
npm test
npm run build
npm run test:e2e
npm run test:pwa
```

Inspect each source boundary immediately below, at, and above its breakpoint. Independently recompute at least one Canadian and one US single-source case, every quantity in one Australian HF and one Australian VHF lookup, one multiple-source case with unlike frequencies, one near-field rejection, and one incomplete-inventory case. Review the rendered desktop, narrow-mobile, print, and exported-project output.

## Review record

| Field | Reviewer entry |
| --- | --- |
| Reviewed commit | |
| Reviewer and qualifications | |
| Review date | |
| Source editions/effective dates | |
| Independent calculations attached | |
| Required corrections | |
| Accepted limitations | |
| Disposition: approve / approve with conditions / reject | |

Review completion must result in a dated record and any required corrections being independently retested. It must not be inferred from a completed checklist in the application.
