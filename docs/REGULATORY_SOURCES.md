# Regulatory Source Registry

RF exposure methods must be implemented from primary sources, retain their revision identity, and be reviewed whenever a source changes. The FCC Table 1 MPE power-density limits and Safety Code 6 Tables 5–6 power-density reference levels are encoded and boundary-tested. A conservative single-source far-field estimate is available for education and preliminary screening. It uses average EIRP, a 2.56 reflected-field multiplier, and an explicit far-field applicability check. A separate tool sums multiple sources after normalizing every power density against the limit at its own frequency. Neither tool demonstrates compliance. Exemption analysis, antenna-pattern modelling, near-field evaluation, measurement uncertainty, and compliance classification remain disabled pending implementation and independent review.

## Canada

- ISED RBR-4, *Standards for the Operation of Radio Stations in the Amateur Radio Service* — connects amateur operation to antenna-system requirements.
- ISED RBR-4 Schedule I — source for Canadian amateur allocation ranges displayed by band selectors.
- ISED CPC-2-0-03, *Radiocommunication and Broadcasting Antenna Systems* — establishes ongoing Safety Code 6 responsibilities and consideration of the local radio environment.
- Health Canada, *Safety Code 6* and its technical guide — controlled and uncontrolled reference levels and assessment guidance.
- ISED TN-261, *Safety Code 6 Radio Frequency Exposure Compliance Evaluation Template* — simplified screening, near/far-field treatment, multiple sources, and escalation criteria.
- ISED GL-01 and GL-08 — measurement and compliance-report guidance.

## United States

- FCC 47 CFR sections 1.1307 and 1.1310 — evaluation criteria and exposure limits.
- FCC 47 CFR section 97.301 — source for United States amateur allocation ranges displayed by band selectors.
- FCC Report and Order 19-126 and Public Notice DA 21-363 — service-agnostic exemption framework and effective date.
- FCC OET Bulletin 65 and Supplement B — amateur-radio evaluation guidance, subject to confirmation against current FCC direction.
- ARRL RF Exposure Calculator and instructions — practical cross-check reference, not the governing rule text.

## United Kingdom

- Ofcom, *Guidance on EMF Compliance and Enforcement*.
- Ofcom, *EMF licence condition: what you need to know as an Amateur Radio user*.
- Ofcom EMF calculator methodology and recognised equipment standards.

## Australia

- ARPANSA RPS S-1, *Standard for Limiting Exposure to Radiofrequency Fields — 100 kHz to 300 GHz*.
- Applicable ACMA licence conditions and electromagnetic-energy compliance guidance, to be scoped before implementation.

## Implementation rule

Every regulatory result must display its jurisdiction, source revision, last-reviewed date, scenario classification, assumptions, units, and limitations. Source updates require reference-vector review before release.

The preliminary far-field screen uses the maximum stated antenna gain and the TN-261 modified free-space expression, including the 2.56 power-density multiplier arising from a reflected electric field 60% as strong as the direct field. Canadian uncontrolled scenarios escalate for detailed review at 50% of the applicable Safety Code 6 limit. For all jurisdictions, the result is inconclusive when other RF sources have not been assessed and inapplicable inside the conservative far-field boundary.

Multiple-source aggregation implements the normalized sum `F = Σ(Pᵢ/Sᵢ)` described by ISED BPR-1 section 8.1. Every entered power density must describe the same evaluation point and use an averaging treatment appropriate to that source. The result remains inconclusive until the user confirms the relevant local source inventory has been assessed. The tool does not infer missing emitters or validate the method used to obtain an entered power density.

The station-project workflow applies the same single-source far-field calculation and normalized aggregation to several transmitters at several accessible locations. Straight-line separation is derived independently for every source–point path from east, north, and height coordinates. Any path inside its conservative far-field boundary makes that project location inapplicable to this method. The interactive plan is an input convenience: it synchronizes with the numeric coordinates but adds no survey, property-boundary, terrain, or mapping accuracy. Users may record an azimuth pattern category, maximum-response bearing relative to true north, and approximate horizontal beamwidth. For each source–point path, the tool derives plan bearing clockwise from true north, angular distance from the nearest entered lobe, and whether that bearing lies inside the entered illustrative envelope. Coincident plan coordinates have no horizontal bearing. These classifications are descriptive only; no pattern attenuation is applied and maximum entered gain remains directed toward every evaluation point. Plan and elevation diagrams expose the entered geometry, and the printable record preserves inputs, results, model identities, and limitations, but it is not a compliance certificate.

Station-project records are stored locally in the browser. Portable `.antenna-project.json` files use a versioned schema and are revalidated against the calculation model during import. Schema version 3 adds azimuth metadata; versions 1 and 2 migrate to an explicitly unknown pattern. Importing a file does not establish that its source inventory is complete or that its assumptions remain current.

Scenario comparison duplicates a saved project before editing and matches sources and evaluation points by their stable project identifiers. It reports the change in normalized fraction of the applicable reference level, expressed as percentage points, alongside a typed audit of project state, source settings, and point geometry. Added or removed entities are identified rather than inferred to be equivalent. Comparisons require the same jurisdiction and exposure environment. A lower scenario value is not proof of compliance and does not validate the changed assumptions.

The connected workflow transfers an antenna design’s frequency and largest physical dimension into the ERP/EIRP calculator, then combines them with explicitly entered transmitter power, feed-system loss, directional gain, duty cycle, installed antenna-centre height, and east/north site position. The station project preserves the contributing calculator model identities and resets source-inventory confirmation whenever a source is added. Transferred values still require review against the installed system.
