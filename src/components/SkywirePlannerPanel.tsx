/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import type { SkywireFeedSide } from '../calculators/skywire';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

export function SkywireGuide() {
  return <StepByStepHelp title="Plan and commission a loop skywire" intro="Use this sequence to turn one full-wave perimeter into a four-support site plan without confusing wire-purchase allowance with the final tuned radiator. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose the design frequency', detail: 'Select the frequency where the installed loop should be tuned. Higher-band operation is possible but requires separate impedance, tuner, loss, current, and pattern evaluation.' },
    { title: 'Survey four supports', detail: 'Record safe plan locations and attachment heights for Supports A through D. Confirm ownership, structural condition, climbing method, tree movement, power-line clearance, and the complete feedline route.' },
    { title: 'Choose the rectangular footprint', detail: 'Set the long-to-short ratio. The planner preserves the corrected straight-line perimeter while converting it into two long and two short plan segments.' },
    { title: 'Separate active wire from rigging reserve', detail: 'The trimming allowance belongs to the initial radiator. The rigging reserve is procurement material for sag, attachment, service loops, and field handling; unused reserve must not silently remain in the active perimeter.' },
    { title: 'Place the feedpoint deliberately', detail: 'Choose a side and position that permits a safe balanced transition, strain relief, weather protection, common-mode control, and a feedline drop that does not become an unintended radiator.' },
    { title: 'Raise, measure, and document', detail: 'Install the complete loop, measure at low analyser power, reconcile the actual conductor path, tune symmetrically, and verify every intended band plus feedline current, component stress, RF exposure, and clearances.' }
  ]} limit="This planner calculates support geometry, taut straight-segment distances, and a material reserve. It does not calculate catenary sag, tree motion, structural loads, installed resonance, impedance, matching, loss, common-mode current, multiband pattern, exposure, or safe power." />;
}

function LengthField({ label, valueMetres, unitSystem, help, tooltip, onChange }: { label: string; valueMetres: number; unitSystem: UnitSystem; help: string; tooltip: string; onChange: (metres: number) => void }) {
  const id = useId();
  const shown = unitSystem === 'metric' ? valueMetres : metresToFeet(valueMetres);
  return <div className="field"><span className="field-label-with-help"><label htmlFor={id}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={id} aria-label={label} type="number" min="0" max={unitSystem === 'metric' ? 1000 : 3280.84} step={unitSystem === 'metric' ? 0.1 : 0.25} value={Number(shown.toFixed(3))} onChange={(event) => onChange(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>{help}</small></div>;
}

export function SkywireControls({ aspectRatio, setAspectRatio, supportHeightsMetres, setSupportHeight, riggingReservePercent, setRiggingReservePercent, feedSide, setFeedSide, feedPositionPercent, setFeedPositionPercent, unitSystem }: { aspectRatio: number; setAspectRatio: (value: number) => void; supportHeightsMetres: [number, number, number, number]; setSupportHeight: (index: number, value: number) => void; riggingReservePercent: number; setRiggingReservePercent: (value: number) => void; feedSide: SkywireFeedSide; setFeedSide: (side: SkywireFeedSide) => void; feedPositionPercent: number; setFeedPositionPercent: (value: number) => void; unitSystem: UnitSystem }) {
  return <fieldset className="skywire-editor">
    <legend>Four-support skywire site plan</legend>
    <div className="field"><span className="field-label-with-help"><label htmlFor="skywire-aspect">Long-to-short aspect ratio</label><HelpTip label="Skywire aspect ratio">The straight plan perimeter remains fixed. Increasing the ratio makes two sides longer and the other two shorter; it also changes the installed current distribution, impedance, and pattern.</HelpTip></span><span className="input-with-unit"><input id="skywire-aspect" aria-label="Long-to-short aspect ratio" type="number" min="1" max="10" step="0.1" value={aspectRatio} onChange={(event) => setAspectRatio(Number(event.target.value))} /><span>ratio</span></span><small>1.0 is square; the drawing preserves dimensions but caps extreme visual elongation.</small></div>
    <div className="skywire-height-grid">{supportHeightsMetres.map((height, index) => <LengthField key={index} label={`Support ${String.fromCharCode(65 + index)} height`} valueMetres={height} unitSystem={unitSystem} tooltip="Attachment height above the same local datum. The planner calculates straight three-dimensional distances between adjacent supports but does not model sag or terrain." help="Use one consistent datum for all four attachment points." onChange={(value) => setSupportHeight(index, value)} />)}</div>
    <div className="field"><span className="field-label-with-help"><label htmlFor="skywire-reserve">Rigging and sag material reserve</label><HelpTip label="Skywire rigging reserve">A procurement allowance applied after the taut three-dimensional segment total. It is not a catenary calculation and is not automatically part of the tuned active radiator.</HelpTip></span><span className="input-with-unit"><input id="skywire-reserve" aria-label="Rigging and sag material reserve" type="number" min="0" max="25" step="0.5" value={riggingReservePercent} onChange={(event) => setRiggingReservePercent(Number(event.target.value))} /><span>%</span></span><small>Budget for attachment, service loops, field handling, and unknown sag; reconcile the active path during tuning.</small></div>
    <label className="field"><span>Feedpoint side</span><select aria-label="Skywire feedpoint side" value={feedSide} onChange={(event) => setFeedSide(event.target.value as SkywireFeedSide)}><option value="north">North · A to B</option><option value="east">East · B to C</option><option value="south">South · C to D</option><option value="west">West · D to A</option></select><small>The compass labels describe the drawing, not a predicted radiation heading.</small></label>
    <div className="field"><span className="field-label-with-help"><label htmlFor="skywire-feed-position">Feedpoint position from side start</label><HelpTip label="Skywire feedpoint position">Measured along the selected three-dimensional support-to-support segment from its first labelled corner. Feed placement changes the current and voltage location and can change impedance and pattern.</HelpTip></span><span className="input-with-unit"><input id="skywire-feed-position" aria-label="Feedpoint position from side start" type="number" min="0" max="100" step="1" value={feedPositionPercent} onChange={(event) => setFeedPositionPercent(Number(event.target.value))} /><span>%</span></span><small>50% places the feed at the selected side midpoint.</small></div>
  </fieldset>;
}

export function SkywireEducation() {
  return <>
    <article><p className="eyebrow">Three-dimensional site geometry</p><h3>Plan coordinates are not the same as wire-path length</h3><p className="formula">segment = √(horizontal² + height difference²)</p><p>The four support coordinates define the horizontal footprint. Each taut segment also includes the height change to the next support. The displayed extra length isolates that geometric effect before any separate material reserve.</p></article>
    <article className="caution-card"><p className="eyebrow">Rigging, tuning, and safety</p><h3>A percentage reserve is not a sag or structural model</h3><p>Actual sag depends on span, tension, conductor, temperature, ice, wind, attachment hardware, and moving supports. Keep strain relief and unused reserve outside the active radiator, use safe installation methods, and obtain qualified structural or arborist advice where required. Model and measure the completed antenna before assigning impedance, matching, gain, pattern, or safe power.</p></article>
  </>;
}
