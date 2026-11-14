/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateHexBeam, HexBeamBand, HexBeamWireGauge } from '../calculators/hexBeam';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

type HexBeamResult = ReturnType<typeof calculateHexBeam>;
const BANDS: HexBeamBand[] = ['20m', '17m', '15m', '12m', '10m', '6m'];

export function HexBeamGuide() {
  return <StepByStepHelp title="Build and commission a broadband hex beam" intro="Use this sequence to reproduce one documented G3TXQ/KIO wire schedule as a complete nested, two-element beam. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose the exact published design', detail: 'This schedule is for the documented six-spreader G3TXQ/KIO broadband form. Do not mix dimensions from classic hex beams, differently sized commercial antennas, or arbitrary frequency scaling.' },
    { title: 'Select bands and matching wire', detail: 'Choose any documented combination from 20 through 6 metres. Use the specified PVC-insulated 14 or 16 AWG wire, or apply only the published 12 or 18 AWG conductor-length adjustment.' },
    { title: 'Build the six-spreader framework', detail: 'Use structurally suitable UV-resistant spreaders, hub, centre post, cords, guides, fasteners, mast, and rotator. The displayed radius, diameter, and height are reference envelope dimensions, not engineering ratings.' },
    { title: 'Make and label every wire set', detail: 'Each band needs two equal half-driver wires, one reflector wire, and two equal nonconductive tip spacers. Measure the documented conductor path and preserve left-right symmetry.' },
    { title: 'Stack and connect the bands consistently', detail: 'Place the lowest-frequency selected band at the top. Preserve centre-post conductor polarity through short 50-ohm coax interconnects and perform open, short, and continuity tests before raising the antenna.' },
    { title: 'Install and verify the complete system', detail: 'Add documented common-mode control, weatherproofing, strain relief, safe mast and rotator capacity, and electrical clearances. Sweep every selected band at final height and verify heading, match, pattern, heating, and RF exposure.' }
  ]} limit="This planner reproduces published wire and envelope dimensions. It does not scale to arbitrary frequencies, design the spreaders, hub, mast, rotator, interconnects, choke, or matching system, and does not predict gain, front-to-back ratio, impedance, bandwidth, wind survival, exposure, or safe power." />;
}

export function HexBeamControls({ bands, setBands, wireGauge, setWireGauge }: { bands: HexBeamBand[]; setBands: (bands: HexBeamBand[]) => void; wireGauge: HexBeamWireGauge; setWireGauge: (gauge: HexBeamWireGauge) => void }) {
  return <fieldset className="hex-beam-editor"><legend>Published G3TXQ/KIO configuration</legend>
    <div className="field"><span className="field-label-with-help"><span>Included bands</span><HelpTip label="Hex-beam included bands">Every selected band adds a separate nested driver, reflector, two tip spacers, and centre-post connection. The lowest-frequency selected band belongs at the top of the feed stack.</HelpTip></span><div className="hex-band-grid">{BANDS.map((band) => <label key={band}><input type="checkbox" checked={bands.includes(band)} disabled={bands.length === 1 && bands.includes(band)} onChange={(event) => setBands(event.target.checked ? [...bands, band] : bands.filter((candidate) => candidate !== band))} /> <span>{band}</span></label>)}</div><small>Select one to six documented wire sets; at least one must remain selected.</small></div>
    <label className="field"><span className="field-label-with-help"><span>Wire gauge schedule</span><HelpTip label="Hex-beam wire gauge">The base schedule is for the documented PVC-insulated 14 or 16 AWG wire. K4KIO publishes conductor-length multipliers of 1.004 for 12 AWG and 0.998 for 18 AWG; tip spacers are unchanged. Other insulation requires modelling and measurement.</HelpTip></span><select aria-label="Hex-beam wire gauge schedule" value={wireGauge} onChange={(event) => setWireGauge(event.target.value as HexBeamWireGauge)}><option value="14-16">14 or 16 AWG PVC insulated · published base</option><option value="12">12 AWG · published 1.004 factor</option><option value="18">18 AWG · published 0.998 factor</option></select><small>Do not use the factor as a general correction for arbitrary wire or insulation.</small></label>
  </fieldset>;
}

export function HexBeamSchedule({ result, unitSystem }: { result: HexBeamResult; unitSystem: UnitSystem }) {
  return <section className="hex-beam-schedule" aria-labelledby="hex-schedule-heading"><p className="eyebrow">Cut and label before assembly</p><h3 id="hex-schedule-heading">Selected-band wire schedule</h3><div className="table-scroll"><table><thead><tr><th>Band</th><th>Half driver ×2</th><th>Reflector</th><th>Tip spacer ×2</th><th>Radiating wire</th></tr></thead><tbody>{result.elements.map((element) => <tr key={element.band}><th>{element.band}</th><td>{formatLength(element.halfDriverMetres, unitSystem)}</td><td>{formatLength(element.reflectorMetres, unitSystem)}</td><td>{formatLength(element.tipSpacerMetres, unitSystem)}</td><td>{formatLength(element.radiatingWireMetres, unitSystem)}</td></tr>)}</tbody></table></div><small>Each row is a documented wire set. Tip spacers are nonconductive and their lengths are not included in radiating-wire totals.</small></section>;
}

export function HexBeamEducation() {
  return <><article><p className="eyebrow">Two-element wire beam</p><h3>Nested M-shaped drivers and rear U-shaped reflectors</h3><p>Each band is a separately dimensioned driven element and parasitic reflector held in the same six-spreader frame. The open V side provides the documented forward reference; it is not interchangeable with a complete hexagonal loop.</p></article><article className="caution-card"><p className="eyebrow">Interaction, feeding, and structure</p><h3>Wire lengths are only one part of the finished antenna</h3><p>Band spacing, guide locations, spreader bow, wire insulation, sag, centre-post interconnect polarity, common-mode current, mast coupling, height, rain, and nearby objects affect the result. Follow the complete source construction, test continuity and isolation, sweep every band at final height, and obtain qualified structural guidance for the support and rotating system.</p></article></>;
}
