/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import type { calculateK9ay } from '../calculators/k9ay';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Direction {
  bearingDegrees: number;
  compassPoint: string;
  loop: number;
  reversed: boolean;
  terminationBearingDegrees: number;
  terminationCompassPoint: string;
  feedTerminal: string;
  terminationTerminal: string;
}

type K9ayResult = ReturnType<typeof calculateK9ay>;

function K9ayNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function K9ayConstructionControls({ antennaWindingTurns, setAntennaWindingTurns, feedlineWindingTurns, setFeedlineWindingTurns }: { antennaWindingTurns: number; setAntennaWindingTurns: (value: number) => void; feedlineWindingTurns: number; setFeedlineWindingTurns: (value: number) => void }) {
  return <>
    <K9ayNumberField label="K9AY antenna winding" tooltip="Enter the actual whole-number turns planned on the winding connected through the switching network to the selected loop feed terminal. This ratio check does not select a core or predict bandwidth, loss, isolation, saturation, or winding capacitance." value={antennaWindingTurns} min={1} max={100} step={1} unit="turns" help="The 3:1 planning default reproduces the published 9:1 impedance-transformation context toward 50 Ω coax." onChange={setAntennaWindingTurns} />
    <K9ayNumberField label="K9AY feedline winding" tooltip="Enter the actual whole-number turns planned on the receiver-feedline winding. Switching, common-mode isolation, static protection, control-line decoupling, and receiver protection remain separate engineered functions." value={feedlineWindingTurns} min={1} max={100} step={1} unit="turns" help="The squared turns ratio supplies impedance context only; it is not a transformer or controller design." onChange={setFeedlineWindingTurns} />
  </>;
}

interface Props {
  apexHeightMetres: number;
  halfWidthMetres: number;
  lowerCornerHeightMetres: number;
  footprintDiameterMetres: number;
  directions: Direction[];
  selectedDirectionIndex: number;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

export function K9ayDiagram({ apexHeightMetres, halfWidthMetres, lowerCornerHeightMetres, footprintDiameterMetres, directions, selectedDirectionIndex, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const selected = directions[selectedDirectionIndex];
  const centreX = 205;
  const centreY = 170;
  const axisRadius = 112;
  const point = (bearingDegrees: number, radius = axisRadius) => {
    const radians = bearingDegrees * Math.PI / 180;
    return { x: centreX + Math.sin(radians) * radius, y: centreY - Math.cos(radians) * radius };
  };
  const selectedEnd = point(selected.bearingDegrees);
  const selectedStart = point(selected.terminationBearingDegrees, 34);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram k9ay-diagram" viewBox="0 0 760 540" role="img" aria-labelledby="k9ay-title k9ay-description">
      <title id="k9ay-title">K9AY crossed-loop geometry and four-direction switching</title>
      <desc id="k9ay-description">Plan view shows two loops at right angles with four selectable receive bearings. Direction {selectedDirectionIndex + 1} is selected, using loop {selected.loop} in its {selected.reversed ? 'reversed' : 'reference'} state to receive toward {selected.bearingDegrees.toFixed(0)} degrees {selected.compassPoint}. Elevation view shows one quasi-delta loop with a shared ground, matching transformer, and terminating resistor.</desc>
      <DiagramDefinitions prefix="k9ay" />
      <DiagramGrid />
      <g className="k9ay-plan">
        <circle cx={centreX} cy={centreY} r={axisRadius + 16} />
        <text x={centreX} y={centreY - axisRadius - 23} textAnchor="middle">N</text><text x={centreX + axisRadius + 24} y={centreY + 4} textAnchor="middle">E</text><text x={centreX} y={centreY + axisRadius + 30} textAnchor="middle">S</text><text x={centreX - axisRadius - 24} y={centreY + 4} textAnchor="middle">W</text>
        {[0, 1].map((loopIndex) => {
          const one = point(directions[loopIndex].bearingDegrees);
          const other = point(directions[loopIndex + 2].bearingDegrees);
          return <line key={loopIndex} className={`k9ay-loop-axis k9ay-loop-${loopIndex + 1}`} x1={one.x} y1={one.y} x2={other.x} y2={other.y} />;
        })}
        {directions.map((direction, index) => {
          const end = point(direction.bearingDegrees, axisRadius + 2);
          return <g key={direction.bearingDegrees} className={index === selectedDirectionIndex ? 'k9ay-direction selected' : 'k9ay-direction'}><circle cx={end.x} cy={end.y} r="14" /><text x={end.x} y={end.y + 4} textAnchor="middle">{direction.compassPoint}</text></g>;
        })}
        <path className="k9ay-response-arrow" d={`M ${selectedStart.x} ${selectedStart.y} L ${selectedEnd.x} ${selectedEnd.y}`} />
        <circle className="k9ay-ground-point" cx={centreX} cy={centreY} r="8" />
        <text className="k9ay-selected-label" x="390" y="98">Selected · {selected.bearingDegrees.toFixed(0)}° {selected.compassPoint}</text>
        <text className="k9ay-selected-label" x="390" y="120">Loop {selected.loop} · {selected.reversed ? 'feed/termination reversed' : 'reference connections'}</text>
        <text className="k9ay-selected-label" x="390" y="142">Null end · {selected.terminationBearingDegrees.toFixed(0)}° {selected.terminationCompassPoint}</text>
      </g>
      <g className="k9ay-elevation">
        <line className="k9ay-ground" x1="85" y1="500" x2="690" y2="500" />
        <path className="k9ay-wire" d="M 145 420 L 385 300 L 625 420 L 430 482 M 340 482 L 145 420" />
        <circle className="k9ay-apex-point" cx="385" cy="300" r="6" />
        <circle className="k9ay-feed-point" cx="340" cy="482" r="7" />
        <circle className="k9ay-termination-point" cx="430" cy="482" r="7" />
        <rect className="k9ay-component" x="288" y="438" width="92" height="28" rx="7" /><text x="334" y="457" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
        <rect className="k9ay-component" x="401" y="438" width="74" height="28" rx="7" /><text x="438" y="457" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
        <path className="k9ay-ground-symbol" d="M 370 482 h 30 M 374 489 h 22 M 379 496 h 12" />
        <text x="385" y="525" textAnchor="middle">Shared base ground and switching enclosure</text>
      </g>
      <SvgDimension prefix="k9ay-width" x1={145} y1={395} x2={625} y2={395} label={`Footprint diameter · ${formatLength(footprintDiameterMetres, unitSystem)}`} labelX={385} labelY={380} />
      <SvgDimension prefix="k9ay-height" x1={700} y1={300} x2={700} y2={500} label={`Apex height · ${formatLength(apexHeightMetres, unitSystem)}`} labelX={700} labelY={282} />
      <SvgDimension prefix="k9ay-half-width" x1={385} y1={355} x2={625} y2={355} label={`Half-width · ${formatLength(halfWidthMetres, unitSystem)}`} labelX={505} labelY={340} />
      <SvgDimension prefix="k9ay-corner" x1={105} y1={420} x2={105} y2={500} label={`Corner · ${formatLength(lowerCornerHeightMetres, unitSystem)}`} labelX={105} labelY={407} />
    </svg>
    <figcaption>Plan and elevation views, not to scale · Two loops share one support and ground. Selecting a loop and reversing its feed and termination provides four directions; actual response depends on the full installation.</figcaption>
  </figure>;
}

export function K9ayConstructionPanel({ result, unitSystem }: { result: K9ayResult; unitSystem: UnitSystem }) {
  return <section className="k9ay-construction-panel" aria-labelledby="k9ay-construction-title">
    <div className="k9ay-construction-heading"><div><p className="eyebrow">Construction and switching worksheet</p><h3 id="k9ay-construction-title">Label every loop terminal before designing the controller</h3><p>The table names the four required electrical states without prescribing relays, control voltage, fail-safe behaviour, or a controller circuit. Assign the physical base leads L1A, L1B, L2A, and L2B before installation, then prove every state with power removed.</p></div><dl><div><dt>Wire per loop</dt><dd>{formatLength(result.cutWireLengthPerLoopMetres, unitSystem)}</dd></div><div><dt>Two-loop wire total</dt><dd>{formatLength(result.totalWireForTwoLoopsMetres, unitSystem)}</dd></div><div><dt>Shared footprint</dt><dd>{formatLength(result.footprintDiameterMetres, unitSystem)} diameter</dd></div><div><dt>Selected state</dt><dd>{result.selectedDirection.feedTerminal} feed · {result.selectedDirection.terminationTerminal} termination</dd></div></dl></div>
    <div className="k9ay-construction-grid">
      <article className="k9ay-material-check"><h4>Per-loop material allocation</h4><div className="table-scroll"><table><thead><tr><th scope="col">Segment</th><th scope="col">Qty</th><th scope="col">Finished each</th><th scope="col">Allowance each</th><th scope="col">Allocated total</th></tr></thead><tbody>{result.segmentSchedulePerLoop.map((segment) => <tr key={segment.label}><th scope="row">{segment.label}</th><td>{segment.quantity}</td><td>{formatLength(segment.designLengthMetres, unitSystem)}</td><td>{formatLength(segment.allocatedLengthMetres, unitSystem)}</td><td>{formatLength(segment.totalAllocatedLengthMetres, unitSystem)}</td></tr>)}</tbody></table></div><ol><li>Build both loops from the same material and reproduce the same finished apex, corner, and base geometry.</li><li>Use the rows to allocate material, not to prescribe extra splices; preserve continuous wire wherever the physical terminal arrangement permits.</li><li>Label both ends of each loop before routing them into the weatherproof base enclosure.</li><li>Document the shared RF ground, soil, moisture, bonding, static protection, and seasonal condition.</li></ol></article>
      <article className="k9ay-switching-check"><p className="eyebrow">Four-state truth table</p><h4>Map direction to loop, feed terminal, and termination terminal</h4><div className="table-scroll"><table><thead><tr><th scope="col">Receive direction</th><th scope="col">Loop</th><th scope="col">Feed</th><th scope="col">Termination</th><th scope="col">State</th></tr></thead><tbody>{result.directions.map((direction) => <tr key={direction.index} className={direction.index === result.selectedDirectionIndex ? 'selected' : undefined}><th scope="row">{direction.bearingDegrees.toFixed(0)}° {direction.compassPoint}</th><td>{direction.loop}</td><td>{direction.feedTerminal}</td><td>{direction.terminationTerminal}</td><td>{direction.reversed ? 'Reversed' : 'Reference'}</td></tr>)}</tbody></table></div><ol><li>With control power removed, confirm inactive-loop isolation and continuity from the selected feed and termination ports to the labelled terminals.</li><li>Check that no relay state shorts the transformer, termination, loop, control wiring, or shared ground unintentionally.</li><li>Verify transformer insertion loss and transformation across every intended band with representative terminations.</li><li>Commission all four states by repeatable signal-to-noise comparisons toward the intended feed, reverse, and side bearings.</li></ol><p className="k9ay-controller-limit"><strong>This is a truth table, not a controller schematic.</strong> Relay topology, contact ratings, sequencing, control-line RF isolation, lightning and static protection, receiver protection, failure modes, and remote-control safety require separate design and verification.</p></article>
      <article className="k9ay-transformer-check"><p className="eyebrow">Ideal winding-ratio check</p><h4>Compare the planned winding with the impedance assumption</h4><dl><div><dt>Calculated ideal turns ratio</dt><dd>{result.transformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered winding</dt><dd>{result.antennaWindingTurns}:{result.feedlineWindingTurns} turns · {result.enteredTransformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered impedance ratio</dt><dd>{result.enteredTransformerImpedanceRatio.toFixed(2)} : 1</dd></div><div><dt>Ideal referred impedance</dt><dd>{result.enteredReferredAntennaImpedanceOhms.toFixed(1)} Ω · {result.enteredReferredImpedanceDifferencePercent.toFixed(1)}% from assumption</dd></div></dl><p>The winding comparison does not predict core behaviour, installed loop impedance, termination optimum, gain, front-to-back ratio, or null depth.</p></article>
    </div>
  </section>;
}
