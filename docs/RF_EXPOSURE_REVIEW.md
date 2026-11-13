# RF Exposure Independent Review Package

## Purpose and review status

This package defines the RF-exposure implementation that requires independent technical review before public beta release. It is a reproducible map from governing sources to code, equations, test vectors, user-visible classifications, and unresolved decisions. It is not a compliance report or evidence that review has passed.

Review scope includes the Canadian, United States, and Australian reference-limit lookups, FCC single- and multiple-source routine-evaluation exemptions, conservative far-field screen, normalized multiple-source total, and multi-point station project. Near-field analysis, measurements, uncertainty analysis, pattern attenuation, and compliance certification are not implemented.

## Authoritative sources

- Health Canada, [Safety Code 6](https://www.canada.ca/en/health-canada/services/publications/health-risks-safety/limits-human-exposure-radiofrequency-electromagnetic-energy-range-3-300.html) and its [Technical Guide](https://www.canada.ca/en/health-canada/services/health-risks-safety/radiation/occupational-exposure-regulations/safety-code-6-radiofrequency-exposure-guidelines/technical-guide.html).
- ISED, [TN-261, Issue 3](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2022/tn-261-i3-mar15.pdf), [GL-01](https://www.ised-isde.canada.ca/site/spectrum-management-telecommunications/en/learn-more/key-documents/guidelines/gl-01-guidelines-measurement-radio-frequency-fields-frequencies-3-khz-300-ghz), and [BPR-1](https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2022/BPR-P1i82021-01EN.pdf).
- FCC, [47 CFR § 1.1307](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1307), [47 CFR § 1.1310](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1310), and [OET Bulletin 65](https://www.fcc.gov/sites/default/files/oet65.pdf).
- ARPANSA, [RPS S-1 (Rev. 1)](https://www.arpansa.gov.au/regulation-and-licensing/regulatory-publications/radiation-protection-series/codes-and-standards/rpss-1), and ACMA, [Radiocommunications (Amateur Stations) Class Licence 2023](https://www.legislation.gov.au/F2023L01648/latest/text).

Sources and links were rechecked on 2026-11-13. A reviewer should record the editions and effective text used for sign-off.

## Implementation map

| Review area | Implementation | Tests |
| --- | --- | --- |
| Canadian and US reference levels | `src/regulations/exposureLimits.ts` | `src/regulations/exposureLimits.test.ts` |
| Australian whole-body, local, peak, and limb-current reference levels | `src/calculators/arpansaReference.ts` | `src/calculators/arpansaReference.test.ts` |
| Australian Amateur Class Licence assessment gateway | `src/calculators/acmaAssessment.ts` | `src/calculators/acmaAssessment.test.ts` |
| Australian clause 6 record schema and documentation gaps | `src/projects/acmaAssessmentRecords.ts` | `src/projects/acmaAssessmentRecords.test.ts` |
| FCC single-source exemption | `src/calculators/fccExemption.ts` | `src/calculators/fccExemption.test.ts` |
| FCC multiple-source exemption | `src/calculators/fccMultipleExemption.ts` | `src/calculators/fccMultipleExemption.test.ts` |
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

The `2.56` multiplier is the squared effect of a reflected electric field taken as 60% of the direct field in the ISED modified free-space method. It is deliberately conservative and is not silently removed for directional antennas.

Wavelength uses `299,792,458 m/s`. The far-field applicability boundary is `λ/(2π)` when the largest antenna dimension `D ≤ λ`, otherwise `2D²/λ`. A point inside that boundary is classified `method-inapplicable`; the result is not compared as a valid far-field screen.

Multiple power-density contributions at one physical point are normalized before addition:

```text
F = Σ(Si / Sreference,i)
```

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
| ARPANSA general public, 146 MHz | whole body `27.7 V/m`, `0.073 A/m`, `2 W/m²` over 30 minutes; local `62 V/m`, `0.163 A/m`, `10 W/m²` over 6 minutes |
| ACMA fixed low-risk height/EIRP path | lowest antenna base `10 m` and average total EIRP `3200 W` satisfies the inclusive clause 3 threshold; `9.999 m` or `3200.001 W` does not |

Health Canada Technical Guide Example C-1 provides an official free-space cross-check: 50 W EIRP at 1200 MHz has a `3.33 W/m²` uncontrolled reference level and a minimum distance of approximately `1.09 m` using `EIRP/(4πr²)`. With the application’s explicit `2.56` reflected-field multiplier, the corresponding conservative distance is approximately `1.75 m`. This difference is intentional and must be approved or revised during review.

The Technical Guide’s mixed-source examples also demonstrate that power-density fractions add arithmetically while electric- and magnetic-field quantities use their applicable squared ratios. The application only aggregates power-density inputs within its supported frequency range; it does not implement the guide’s mixed-field comparison criteria.

## Required reviewer decisions

The reviewer should resolve each item explicitly:

1. Is the TN-261/BPR-1 `2.56` modified free-space model appropriate for this amateur-station preliminary screen, and should its use extend to controlled Canadian and both US environments?
2. Do the duty-cycle instructions correctly represent rolling or maximum time-averaged power under Safety Code 6 and FCC rules, including worst-case operating assumptions?
3. Are EIRP, ERP, gain-reference, feed-loss, and transmitter-power reference planes kept distinct between the dedicated FCC exemption workflow and the separate EIRP-based far-field screen?
4. Are `λ/(2π)` and `2D²/λ` sufficiently conservative applicability boundaries for every supported antenna, or is a transition-region treatment required?
5. Is the Canadian `50%` escalation threshold applied to the correct scope of uncontrolled scenarios without implying that a lower value demonstrates compliance?
6. Does normalized multi-source addition preserve compatible physical locations, time averaging, exposure quantities, and simultaneous-operation assumptions?
7. Are all unsupported cases stopped or clearly escalated, including Canadian operation below 10 MHz, near-field points, incomplete source inventories, induced/contact currents, spatial averaging, uncertainty, and missing off-site sources?
8. Is the status precedence correct when a project contains both an inapplicable path and another path that reaches an escalation threshold?
9. Are the interface, printed record, and exported project vocabulary sufficiently clear that users cannot confuse screening, exemption, evaluation, mitigation, and demonstrated compliance?
10. Does the Australian lookup preserve the correct spatial and temporal basis, field-region requirements, `ES` treatment, additional peak-field and limb-current checks, and distinction between RPS S-1 tables and the Amateur Class Licence conditions?
11. Does the Australian gateway distinguish clause 3 application from a compliance presumption, preserve the continuing clause 2 condition, and correctly describe clauses 4 and 6 without overlooking station changes or transitional provisions?
12. Does the Australian record worksheet capture the required clause 6 information without turning field presence, local saving, printing, or export into an approval or compliance claim, and are its privacy and retention warnings adequate?

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
