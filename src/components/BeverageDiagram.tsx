/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import { formatLength, feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import type { BeverageReceptionMode, calculateBeverage } from '../calculators/beverage';
import { HelpTip } from './ContextHelp';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  designWireLengthMetres: number;
  wireHeightMetres: number;
  targetBearingDegrees: number;
  targetCompassPoint: string;
  reverseBearingDegrees: number;
  reverseCompassPoint: string;
  receptionMode: BeverageReceptionMode;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

type BeverageResult = ReturnType<typeof calculateBeverage>;

interface ControlsProps {
  unitSystem: UnitSystem;
  feedDropMetres: number;
  setFeedDropMetres: (value: number) => void;
  farEndDropMetres: number;
  setFarEndDropMetres: (value: number) => void;
  maximumSupportSpanMetres: number;
  setMaximumSupportSpanMetres: (value: number) => void;
  antennaWindingTurns: number;
  setAntennaWindingTurns: (value: number) => void;
  feedlineWindingTurns: number;
  setFeedlineWindingTurns: (value: number) => void;
}

function BeverageNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function BeverageConstructionControls(props: ControlsProps) {
  const imperial = props.unitSystem === 'imperial';
  const shownLength = (metres: number) => Number((imperial ? metresToFeet(metres) : metres).toFixed(3));
  const setLength = (setter: (value: number) => void) => (value: number) => setter(imperial ? feetToMetres(value) : value);
  return <>
    <BeverageNumberField label="Feed-end vertical drop" tooltip="Record the conductor path from the horizontal wire to the feed transformer or ground-return junction. This is real wire to purchase and model; it is not part of the selected horizontal electrical length." value={shownLength(props.feedDropMetres)} min={0} max={imperial ? 98.425 : 30} step={imperial ? 0.25 : 0.1} unit={imperial ? 'ft' : 'm'} help="Added to the complete conductor schedule without changing the surveyed horizontal endpoint distance." onChange={setLength(props.setFeedDropMetres)} />
    <BeverageNumberField label="Far-end vertical drop" tooltip="For a terminated Beverage, record the conductor path from the horizontal wire through the non-inductive termination to the far-end ground return. For an open comparison, record only any physical descent before the insulated end." value={shownLength(props.farEndDropMetres)} min={0} max={imperial ? 98.425 : 30} step={imperial ? 0.25 : 0.1} unit={imperial ? 'ft' : 'm'} help="Include the exact far-end hardware and conductor route in modelling and inspection." onChange={setLength(props.setFarEndDropMetres)} />
    <BeverageNumberField label="Maximum planned support span" tooltip="Sets a structural layout interval only. The worksheet rounds up to enough equal horizontal spans and reports the resulting intermediate support count. Sag, loading, terrain, conductor strength, and local rules still require engineering." value={shownLength(props.maximumSupportSpanMetres)} min={imperial ? 0.328 : 0.1} max={imperial ? 1640.42 : 500} step={imperial ? 1 : 0.5} unit={imperial ? 'ft' : 'm'} help="A layout aid, not a safe-span rating or structural approval." onChange={setLength(props.setMaximumSupportSpanMetres)} />
    <BeverageNumberField label="Antenna-side transformer turns" tooltip="Enter the actual whole-number turns planned on the antenna-side winding. The ratio check is ideal only and does not predict core permeability, bandwidth, loss, isolation, saturation, or winding capacitance." value={props.antennaWindingTurns} min={1} max={100} step={1} unit="turns" help="Default 9 turns with 3 feedline turns reproduces the 3:1 turns-ratio planning target." onChange={props.setAntennaWindingTurns} />
    <BeverageNumberField label="Feedline-side transformer turns" tooltip="Enter the actual whole-number turns planned on the receiver-feedline winding. Keep winding isolation and common-mode control explicit in the complete receive-system design." value={props.feedlineWindingTurns} min={1} max={100} step={1} unit="turns" help="The squared turns ratio supplies impedance context only." onChange={props.setFeedlineWindingTurns} />
  </>;
}

export function BeverageDiagram({ designWireLengthMetres, wireHeightMetres, targetBearingDegrees, targetCompassPoint, reverseBearingDegrees, reverseCompassPoint, receptionMode, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const centreX = 220;
  const centreY = 165;
  const radius = 118;
  const radians = targetBearingDegrees * Math.PI / 180;
  const endX = centreX + Math.sin(radians) * radius;
  const endY = centreY - Math.cos(radians) * radius;
  const reverseX = centreX - Math.sin(radians) * radius;
  const reverseY = centreY + Math.cos(radians) * radius;

  return <figure className="antenna-figure">
    <svg className="dipole-diagram beverage-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="beverage-title beverage-description">
      <title id="beverage-title">Beverage receiving-antenna route and elevation</title>
      <desc id="beverage-description">Plan view shows the wire axis from its feed end toward a target bearing of {targetBearingDegrees.toFixed(0)} degrees {targetCompassPoint}. Elevation view shows a low horizontal wire, ground returns, feed transformer, and {receptionMode === 'terminated' ? 'far-end terminating resistor' : 'insulated open far end'}.</desc>
      <DiagramDefinitions prefix="beverage" />
      <DiagramGrid />
      <g className="beverage-plan">
        <circle cx={centreX} cy={centreY} r={radius + 12} />
        <line x1={centreX} y1={centreY - radius - 12} x2={centreX} y2={centreY + radius + 12} />
        <line x1={centreX - radius - 12} y1={centreY} x2={centreX + radius + 12} y2={centreY} />
        <text x={centreX} y={centreY - radius - 20} textAnchor="middle">N</text><text x={centreX + radius + 22} y={centreY + 4} textAnchor="middle">E</text><text x={centreX} y={centreY + radius + 28} textAnchor="middle">S</text><text x={centreX - radius - 22} y={centreY + 4} textAnchor="middle">W</text>
        <line className="beverage-route" x1={centreX} y1={centreY} x2={endX} y2={endY} />
        <circle className="beverage-feed-point" cx={centreX} cy={centreY} r="8" />
        <circle className="beverage-far-point" cx={endX} cy={endY} r="8" />
        {receptionMode === 'unterminated' && <line className="beverage-reverse-axis" x1={centreX} y1={centreY} x2={reverseX} y2={reverseY} />}
        <text x={centreX} y={centreY + 22} textAnchor="middle">Feed</text>
        <text x={endX} y={endY - 14} textAnchor="middle">{receptionMode === 'terminated' ? 'Termination' : 'Open end'}</text>
        <path className="beverage-response-arrow" d={`M ${centreX + (endX - centreX) * 0.45} ${centreY + (endY - centreY) * 0.45} L ${endX} ${endY}`} />
        <text className="beverage-bearing-label" x="420" y="80">Target axis · {targetBearingDegrees.toFixed(0)}° {targetCompassPoint}</text>
        {receptionMode === 'unterminated' && <text className="beverage-bearing-label" x="420" y="101">Reverse axis · {reverseBearingDegrees.toFixed(0)}° {reverseCompassPoint}</text>}
      </g>
      <g className="beverage-elevation">
        <line className="beverage-ground" x1="92" y1="440" x2="684" y2="440" />
        <line className="beverage-wire" x1="145" y1="345" x2="620" y2="345" />
        <line className="beverage-drop" x1="145" y1="345" x2="145" y2="427" />
        <line className="beverage-drop" x1="620" y1="345" x2="620" y2="427" />
        <rect className="beverage-component" x="108" y="375" width="74" height="31" rx="7" /><text x="145" y="395" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
        {receptionMode === 'terminated' ? <><rect className="beverage-component" x="578" y="375" width="84" height="31" rx="7" /><text x="620" y="395" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text></> : <text x="620" y="383" textAnchor="middle">Insulated open end</text>}
        <path className="beverage-ground-symbol" d="M 130 427 h 30 M 134 434 h 22 M 139 441 h 12 M 605 427 h 30 M 609 434 h 22 M 614 441 h 12" />
        <text x="145" y="465" textAnchor="middle">Feed ground</text><text x="620" y="465" textAnchor="middle">{receptionMode === 'terminated' ? 'Termination ground' : 'No far-end ground'}</text>
      </g>
      <SvgDimension prefix="beverage-length" x1={145} y1={322} x2={620} y2={322} label={`Horizontal wire · ${formatLength(designWireLengthMetres, unitSystem)}`} labelX={382} labelY={307} />
      <SvgDimension prefix="beverage-height" x1={700} y1={345} x2={700} y2={440} label={`Height · ${formatLength(wireHeightMetres, unitSystem)}`} labelX={700} labelY={330} />
    </svg>
    <figcaption>Plan and elevation views, not to scale · The target bearing runs from the feed end toward the far end. A terminated Beverage’s primary response is expected toward the termination; the actual pattern depends on the complete wire, ground, feed, terrain, and surroundings.</figcaption>
  </figure>;
}

export function BeverageConstructionPanel({ result, unitSystem }: { result: BeverageResult; unitSystem: UnitSystem }) {
  return <section className="beverage-construction-panel" aria-labelledby="beverage-construction-title">
    <div className="beverage-construction-heading"><div><p className="eyebrow">Construction and field worksheet</p><h3 id="beverage-construction-title">Build the route, ground returns, and transformer as one receive system</h3><p>The horizontal wavelength length remains the surveyed endpoint distance. Vertical drops, supports, winding choices, grounds, termination, feedline isolation, and receiver protection are recorded separately so they cannot disappear inside one number.</p></div><dl><div><dt>Complete design wire path</dt><dd>{formatLength(result.totalDesignWirePathMetres, unitSystem)}</dd></div><div><dt>Complete wire to cut</dt><dd>{formatLength(result.totalCutWireLengthMetres, unitSystem)}</dd></div><div><dt>Support layout</dt><dd>{result.supportSpanCount} spans · {result.intermediateSupportCount} intermediate supports</dd></div><div><dt>Equal-span reference</dt><dd>{formatLength(result.nominalSupportSpanMetres, unitSystem)}</dd></div></dl></div>
    <div className="beverage-construction-grid">
      <article className="beverage-system-check"><h4>End-to-end construction record</h4><table><tbody><tr><th scope="row">Horizontal conductor</th><td>{formatLength(result.designWireLengthMetres, unitSystem)}</td></tr><tr><th scope="row">Feed-end drop</th><td>{formatLength(result.feedDropMetres, unitSystem)}</td></tr><tr><th scope="row">Far-end drop</th><td>{formatLength(result.farEndDropMetres, unitSystem)}</td></tr><tr><th scope="row">Cut allowance</th><td>{result.wireCutAllowancePercent.toFixed(1)}%</td></tr><tr><th scope="row">Far-end state</th><td>{result.receptionMode === 'terminated' ? `${result.terminationResistanceOhms.toFixed(0)} Ω planning value plus ground return` : 'Insulated open end · no far-end ground'}</td></tr></tbody></table><ol><li>Survey support coordinates, heights, access, visibility, and power-line clearance before installing conductor.</li><li>Document feed and far-end electrode construction, soil condition, moisture, bonding, and seasonal changes; the planner does not calculate ground impedance.</li><li>Provide static and lightning protection, receiver overload protection, disconnect procedures, and suitable physical marking.</li><li>Keep feedline routing and common-mode isolation in the receive-system model rather than treating coax as electrically invisible.</li></ol></article>
      <article className="beverage-transformer-check"><p className="eyebrow">Ideal winding-ratio check</p><h4>Compare the planned winding with the impedance assumption</h4><dl><div><dt>Calculated ideal turns ratio</dt><dd>{result.transformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered winding</dt><dd>{result.antennaWindingTurns}:{result.feedlineWindingTurns} turns · {result.enteredTransformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered impedance ratio</dt><dd>{result.enteredTransformerImpedanceRatio.toFixed(2)} : 1</dd></div><div><dt>Ideal referred impedance</dt><dd>{result.enteredReferredAntennaImpedanceOhms.toFixed(1)} Ω · {result.enteredReferredImpedanceDifferencePercent.toFixed(1)}% from assumption</dd></div></dl><ol><li>Measure winding continuity and isolation before connection.</li><li>Sweep transformer insertion loss and impedance transformation across every intended receive band with representative terminations.</li><li>Install the complete antenna, then compare signal-to-noise and directionality toward the target, reverse, and side bearings.</li><li>Adjust termination only from repeatable measurements; record frequency, soil and weather conditions, receiver settings, and comparison antenna.</li></ol><p className="beverage-transformer-limit"><strong>The ratio is not a transformer design.</strong> Core material, winding layout, leakage, capacitance, loss, common-mode isolation, electrostatic discharge, and receiver protection remain outside this arithmetic.</p></article>
    </div>
  </section>;
}
