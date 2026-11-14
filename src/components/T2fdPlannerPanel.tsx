/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateT2fd } from '../calculators/t2fd';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

type Result = ReturnType<typeof calculateT2fd>;

function shownLength(metres: number, unitSystem: UnitSystem) {
  return unitSystem === 'metric' ? metres : metres * 3.280839895;
}

function readLength(value: number, unitSystem: UnitSystem) {
  return unitSystem === 'metric' ? value : value / 3.280839895;
}

export function T2fdGuide() {
  return <StepByStepHelp title="Plan a Countryman T2FD starting geometry" intro="Reproduce the published 1949 wire dimensions, then keep the modern feed, resistor, supports, efficiency, and installed performance visible as separate engineering work." steps={[
    { title: 'Choose the lowest design frequency', detail: 'The historical equations size each half-span and conductor spacing from the lowest frequency. The cited experimental coverage extended to about five times that frequency, not to an assured SWR or efficiency.' },
    { title: 'Lay out two parallel conductors', detail: 'Cut two equal long conductors, hold their separation with stable insulating spreaders, and join the conductors at both ends.' },
    { title: 'Place feed and termination at opposite centres', detail: 'Feed the centre of one long conductor and bridge the non-inductive terminating resistor across the centre of the other. Preserve electrical and mechanical symmetry.' },
    { title: 'Survey the tilt and supports', detail: 'The original installation used about 30° tilt and a low end about 6 ft above ground. The planner converts the entered tilt into horizontal projection and attachment-height difference.' },
    { title: 'Engineer the feed and resistor', detail: 'Treat the displayed impedance and turns ratios as starting assumptions only. Select a balanced transformer, choke, resistor network, insulation, cooling, enclosure, feedline, and connectors for measured conditions.' },
    { title: 'Measure before normal-power use', detail: 'Sweep every intended band at low power, then verify feedline current, transformer and resistor heating, voltage clearance, radiation performance, RF exposure, and structural safety.' }
  ]} limit="This planner reproduces historical geometry and a source minimum resistor-wattage rule. It does not predict SWR, impedance, efficiency, loss, gain, pattern, takeoff angle, transformer performance, resistor temperature, bandwidth, exposure, or safe power." />;
}

interface ControlsProps {
  tiltDegrees: number;
  setTiltDegrees: (value: number) => void;
  lowAttachmentHeightMetres: number;
  setLowAttachmentHeightMetres: (value: number) => void;
  terminationResistanceOhms: number;
  setTerminationResistanceOhms: (value: number) => void;
  feedSystemImpedanceOhms: number;
  setFeedSystemImpedanceOhms: (value: number) => void;
  transmitterPowerWatts: number;
  setTransmitterPowerWatts: (value: number) => void;
  wireAllowancePercent: number;
  setWireAllowancePercent: (value: number) => void;
  unitSystem: UnitSystem;
}

export function T2fdControls(props: ControlsProps) {
  const lengthUnit = props.unitSystem === 'metric' ? 'm' : 'ft';
  return <fieldset className="v-beam-editor t2fd-editor"><legend>Historical geometry and explicit component assumptions</legend>
    <label className="field"><span className="field-label-with-help"><span>Tilt from horizontal</span><HelpTip label="T2FD tilt">Countryman reported that tilting the antenna about 30° made its practical pattern substantially less directional. This control changes support geometry only; the application does not calculate a pattern.</HelpTip></span><span className="input-with-unit"><input aria-label="T2FD tilt" type="number" min="0" max="45" step="1" value={props.tiltDegrees} onChange={(event) => props.setTiltDegrees(Number(event.target.value))} /><span>°</span></span><small>Historical reference: approximately 30°.</small></label>
    <label className="field"><span>Low-end attachment height</span><span className="input-with-unit"><input aria-label="T2FD low attachment height" type="number" min={props.unitSystem === 'metric' ? 0.5 : 1.64} max={props.unitSystem === 'metric' ? 100 : 328.08} step={props.unitSystem === 'metric' ? 0.1 : 0.5} value={Number(shownLength(props.lowAttachmentHeightMetres, props.unitSystem).toFixed(2))} onChange={(event) => props.setLowAttachmentHeightMetres(readLength(Number(event.target.value), props.unitSystem))} /><span>{lengthUnit}</span></span><small>Historical examples used a low support about 6 ft high.</small></label>
    <label className="field"><span className="field-label-with-help"><span>Non-inductive termination</span><HelpTip label="T2FD termination">The 1949 system used a 600 Ω non-inductive termination. Modern variants differ. The value entered here is recorded as an assumption; it does not establish the antenna input impedance.</HelpTip></span><span className="input-with-unit"><input aria-label="T2FD termination" type="number" min="1" max="10000" step="10" value={props.terminationResistanceOhms} onChange={(event) => props.setTerminationResistanceOhms(Number(event.target.value))} /><span>Ω</span></span><small>Use a genuinely non-inductive RF resistor network with suitable voltage, heat, and weather margins.</small></label>
    <label className="field"><span>Planned feed-system impedance</span><span className="input-with-unit"><input aria-label="T2FD feed-system impedance" type="number" min="1" max="10000" step="10" value={props.feedSystemImpedanceOhms} onChange={(event) => props.setFeedSystemImpedanceOhms(Number(event.target.value))} /><span>Ω</span></span><small>Used only to show an ideal impedance and voltage ratio.</small></label>
    <label className="field"><span>Planned transmitter output</span><span className="input-with-unit"><input aria-label="T2FD transmitter output" type="number" min="0.1" max="100000" step="1" value={props.transmitterPowerWatts} onChange={(event) => props.setTransmitterPowerWatts(Number(event.target.value))} /><span>W</span></span><small>Used only for the historical 35% minimum termination-rating comparison.</small></label>
    <label className="field"><span>Wire and attachment allowance</span><span className="input-with-unit"><input aria-label="T2FD wire allowance" type="number" min="0" max="25" step="0.5" value={props.wireAllowancePercent} onChange={(event) => props.setWireAllowancePercent(Number(event.target.value))} /><span>%</span></span><small>Added to cut material, not the dimensioned support geometry.</small></label>
  </fieldset>;
}

export function T2fdDiagram({ result, unitSystem }: { result: Result; unitSystem: UnitSystem }) {
  const highY = 92;
  const lowY = 328;
  return <figure className="antenna-figure t2fd-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 470" role="img" aria-labelledby="t2fd-title t2fd-desc">
      <title id="t2fd-title">Dimensioned tilted terminated folded dipole</title>
      <desc id="t2fd-desc">Two parallel conductors, each {formatLength(result.designSpanMetres, unitSystem)} long, spaced {formatLength(result.conductorSpacingMetres, unitSystem)}, tilted {result.tiltDegrees.toFixed(0)} degrees between attachment heights of {formatLength(result.lowAttachmentHeightMetres, unitSystem)} and {formatLength(result.highAttachmentHeightMetres, unitSystem)}.</desc>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="430" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <g className="t2fd-wire"><path d={`M105 ${highY} L655 ${lowY}`} /><path d={`M96 ${highY + 22} L646 ${lowY + 22}`} /><path d={`M105 ${highY} L96 ${highY + 22}`} /><path d={`M655 ${lowY} L646 ${lowY + 22}`} /></g>
      <g className="t2fd-components"><circle cx="371" cy="221" r="8" /><path d="M371 229 V400" /><text x="386" y="250">BALANCED FEED</text><rect x="350" y="194" width="42" height="20" rx="3" /><text x="371" y="209" textAnchor="middle">R</text><text x="405" y="197">{result.terminationResistanceOhms.toFixed(0)} Ω TERMINATION</text></g>
      <g className="t2fd-supports"><path d={`M105 ${highY} V400`} /><path d={`M655 ${lowY} V400`} /><text x="78" y="420">HIGH ATTACHMENT · {formatLength(result.highAttachmentHeightMetres, unitSystem)}</text><text x="530" y="420">LOW ATTACHMENT · {formatLength(result.lowAttachmentHeightMetres, unitSystem)}</text></g>
      <g className="t2fd-labels"><text x="380" y="115" transform="rotate(23 380 115)" textAnchor="middle">EACH LONG CONDUCTOR · {formatLength(result.designSpanMetres, unitSystem)}</text><text x="188" y="180">SPACING · {formatLength(result.conductorSpacingMetres, unitSystem)}</text><text x="380" y="452" textAnchor="middle">HORIZONTAL PROJECTION · {formatLength(result.horizontalProjectionMetres, unitSystem)} · TILT {result.tiltDegrees.toFixed(0)}°</text></g>
    </svg>
    <figcaption>Historical starting dimensions · Feed and termination are at opposite conductor centres; drawing exaggerates conductor spacing for clarity.</figcaption>
  </figure>;
}

export function T2fdEducation() {
  return <><article><p className="eyebrow">Broad match is not broad efficiency</p><h3>The resistor can flatten impedance by turning RF power into heat</h3><p>A usable feedline match does not establish strong radiation. The proportion dissipated in the termination changes with frequency and installation, so compare field performance and resistor temperature rather than judging the antenna from SWR alone.</p></article><article className="caution-card"><p className="eyebrow">Historical rating rule</p><h3>Thirty-five percent is a source minimum, not a finished thermal design</h3><p>Countryman specified a non-inductive termination rated for at least 35% of final-stage input power. Modern transmitter output, duty cycle, enclosure temperature, airflow, voltage distribution, component tolerances, water ingress, and fault conditions require separate engineering margin.</p></article></>;
}
