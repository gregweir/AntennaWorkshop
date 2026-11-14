/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import type { calculateLogPeriodic } from '../calculators/logPeriodic';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface ElementGeometry {
  number: number;
  cutLengthMetres: number;
  spacingToNextMetres: number;
  boomPositionMetres: number;
  halfWaveFrequencyMHz: number;
  connection: string;
}

interface Props {
  elements: ElementGeometry[];
  boomSpanMetres: number;
  apexIncludedAngleDegrees: number;
  unitSystem: UnitSystem;
}

type LogPeriodicResult = ReturnType<typeof calculateLogPeriodic>;

interface ControlsProps {
  elementConductorDiameterMillimetres: number;
  setElementConductorDiameterMillimetres: (value: number) => void;
  elementLengthToleranceMillimetres: number;
  setElementLengthToleranceMillimetres: (value: number) => void;
  boomPositionToleranceMillimetres: number;
  setBoomPositionToleranceMillimetres: (value: number) => void;
  boomConductorSpacingMillimetres: number;
  setBoomConductorSpacingMillimetres: (value: number) => void;
}

function LpdaNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function LogPeriodicConstructionControls(props: ControlsProps) {
  return <>
    <LpdaNumberField label="Element conductor diameter" tooltip="Record the outside diameter of the element rod or tube. Diameter affects element resonance, bandwidth, and the boom junction, so preserve the exact cross section in the complete electromagnetic model." value={props.elementConductorDiameterMillimetres} min={0.01} max={1000} step={0.01} unit="mm" help="Documentation and physical checks only; it does not change the Carrel length progression." onChange={props.setElementConductorDiameterMillimetres} />
    <LpdaNumberField label="Maximum element length error" tooltip="Enter the largest expected end-to-end difference between a finished element and its target design length. Extra cut allowance is separate material to trim away." value={props.elementLengthToleranceMillimetres} min={0} max={1000} step={0.1} unit="mm" help="Applied as an inspection tolerance to both the longest and shortest element targets." onChange={props.setElementLengthToleranceMillimetres} />
    <LpdaNumberField label="Maximum boom-position error" tooltip="Enter the largest expected displacement of one element centre from its scheduled boom position. The worksheet compares it with the smallest adjacent centre spacing." value={props.boomPositionToleranceMillimetres} min={0} max={1000} step={0.1} unit="mm" help="Measure every element centre from one fixed datum rather than accumulating spacing marks." onChange={props.setBoomPositionToleranceMillimetres} />
    <LpdaNumberField label="Boom-conductor centre spacing" tooltip="Record the centre-to-centre separation of the two balanced boom conductors at the element junctions. Along with conductor shape and size, this affects feeder impedance; the planner does not calculate that impedance." value={props.boomConductorSpacingMillimetres} min={0.01} max={5000} step={0.1} unit="mm" help="A model and build record, not a prescribed feed impedance or match." onChange={props.setBoomConductorSpacingMillimetres} />
  </>;
}

export function LogPeriodicDiagram({ elements, boomSpanMetres, apexIncludedAngleDegrees, unitSystem }: Props) {
  const xStart = 130;
  const xEnd = 625;
  const centreY = 220;
  const longest = elements[0]?.cutLengthMetres ?? 1;
  const xScale = boomSpanMetres > 0 ? (xEnd - xStart) / boomSpanMetres : 1;
  const displayed = elements.length <= 32 ? elements : elements.filter((_, index) => index % Math.ceil(elements.length / 32) === 0 || index === elements.length - 1);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram lpda-diagram" viewBox="0 0 760 440" role="img" aria-labelledby="lpda-title lpda-description">
      <title id="lpda-title">Dimensioned log-periodic dipole array</title>
      <desc id="lpda-description">An array of {elements.length} parallel dipoles decreases geometrically from the longest rear element to the shortest front element. Adjacent elements connect to the two boom conductors with alternating polarity. The beam points toward the shorter elements.</desc>
      <DiagramDefinitions prefix="lpda" />
      <DiagramGrid />
      <g className="lpda-envelope"><path d={`M 86 ${centreY - 168} L 684 ${centreY} L 86 ${centreY + 168}`} /><text x="280" y="42">Included apex · {apexIncludedAngleDegrees.toFixed(1)}°</text></g>
      <g className="lpda-boom"><line x1="104" y1={centreY - 6} x2="660" y2={centreY - 6} /><line x1="104" y1={centreY + 6} x2="660" y2={centreY + 6} /></g>
      <g className="lpda-elements">{displayed.map((element) => {
        const x = xStart + element.boomPositionMetres * xScale;
        const halfHeight = 150 * element.cutLengthMetres / longest;
        return <g key={element.number}><line x1={x} y1={centreY - halfHeight} x2={x} y2={centreY + halfHeight} /><circle cx={x} cy={centreY - 6} r="3.5" /><circle cx={x} cy={centreY + 6} r="3.5" /><text x={x} y={centreY + halfHeight + 17} textAnchor="middle">{element.number}</text></g>;
      })}</g>
      <g className="lpda-beam"><line x1="585" y1="72" x2="684" y2="72" /><path d="M 684 72 l -16 -9 v 18 z" /><text x="635" y="55" textAnchor="middle">Beam direction</text></g>
      <SvgDimension prefix="lpda-longest" x1={82} y1={70} x2={82} y2={370} label={`Longest · ${formatLength(elements[0]?.cutLengthMetres ?? 0, unitSystem)}`} labelX={145} labelY={48} />
      <SvgDimension prefix="lpda-boom-span" x1={xStart} y1={404} x2={xEnd} y2={404} label={`Element-centre span · ${formatLength(boomSpanMetres, unitSystem)}`} labelX={(xStart + xEnd) / 2} labelY={390} />
    </svg>
    <figcaption>Plan view, not to scale · Element 1 is the longest rear element; feed at the short-element end. The schedule gives every cut length, centre spacing, boom position, and alternating connection.</figcaption>
  </figure>;
}

export function LogPeriodicSchedule({ elements, unitSystem }: Pick<Props, 'elements' | 'unitSystem'>) {
  return <section className="lpda-schedule" aria-labelledby="lpda-schedule-title">
    <div><p className="eyebrow">Element schedule</p><h3 id="lpda-schedule-title">Cut, position, and alternate every dipole</h3></div>
    <div className="table-scroll"><table><thead><tr><th scope="col">Element</th><th scope="col">Full cut length</th><th scope="col">Each half</th><th scope="col">Next centre spacing</th><th scope="col">Boom position</th><th scope="col">Half-wave reference</th><th scope="col">Connection</th></tr></thead><tbody>{elements.map((element) => <tr key={element.number}><th scope="row">{element.number}</th><td>{formatLength(element.cutLengthMetres, unitSystem)}</td><td>{formatLength(element.cutLengthMetres / 2, unitSystem)}</td><td>{element.spacingToNextMetres > 0 ? formatLength(element.spacingToNextMetres, unitSystem) : '—'}</td><td>{formatLength(element.boomPositionMetres, unitSystem)}</td><td>{element.halfWaveFrequencyMHz.toFixed(3)} MHz</td><td>{element.connection}</td></tr>)}</tbody></table></div>
    <p>Connections name the two balanced boom conductors as viewed from the rear toward the shorter elements. Confirm the physical crossover and feed arrangement in the complete electromagnetic model.</p>
  </section>;
}

export function LogPeriodicConstructionPanel({ result, unitSystem }: { result: LogPeriodicResult; unitSystem: UnitSystem }) {
  return <section className="lpda-construction-panel" aria-labelledby="lpda-construction-title">
    <div className="lpda-construction-heading"><div><p className="eyebrow">Fabrication and commissioning worksheet</p><h3 id="lpda-construction-title">Hold the geometry, polarity, and feed system together</h3><p>Use one boom datum for every element centre, one master template for each full element, and a continuity record that proves the alternating connections before the feedline is attached.</p></div><dl>
      <div><dt>Element conductor</dt><dd>{formatLength(result.elementConductorDiameterMetres, unitSystem)} · {result.elementConductorDiameterWavelengthsAtUpperEdge.toFixed(4)} λ at upper edge</dd></div>
      <div><dt>Length tolerance</dt><dd>±{formatLength(result.elementLengthToleranceMetres, unitSystem)} · {result.longestElementLengthTolerancePercent.toFixed(2)}–{result.shortestElementLengthTolerancePercent.toFixed(2)}%</dd></div>
      <div><dt>Position tolerance</dt><dd>±{formatLength(result.boomPositionToleranceMetres, unitSystem)} · {result.boomPositionTolerancePercentOfMinimumSpacing.toFixed(2)}% of minimum spacing</dd></div>
      <div><dt>Boom pair record</dt><dd>{formatLength(result.boomConductorSpacingMetres, unitSystem)} centres · {result.boomSpacingToElementDiameterRatio.toFixed(2)}× element diameter</dd></div>
    </dl></div>
    <div className="lpda-construction-grid">
      <article className="lpda-polarity-check"><h4>Connection and symmetry inspection</h4><ol><li>Mark boom conductors A and B from the longest-element rear toward the short-element feed end.</li><li>Confirm every odd element is A-left / B-right and every even element is B-left / A-right from that same viewing direction.</li><li>Measure both element tips from the boom centreline; correct asymmetry rather than moving the whole element off its scheduled centre.</li><li>Verify no unintended continuity exists between boom conductors, and record intentional termination or support hardware.</li><li>Include element gaps, fasteners, conductor profiles, mast, feedline route, and supports in the complete model.</li></ol><p>The tolerance percentages describe fabrication repeatability only. They are not allowable RF-performance errors.</p></article>
      <article className="lpda-feed-check"><p className="eyebrow">Short-element feed end</p><h4>Choose and verify one balanced-feed implementation</h4><svg viewBox="0 0 520 245" role="img" aria-labelledby="lpda-feed-title lpda-feed-desc"><title id="lpda-feed-title">Log-periodic balanced boom feed concept</title><desc id="lpda-feed-desc">Two parallel boom conductors carry alternating dipole connections. The feed enters at the short-element end, and the beam points in that direction.</desc><line className="lpda-feed-boom-a" x1="55" y1="102" x2="455" y2="102" /><line className="lpda-feed-boom-b" x1="55" y1="142" x2="455" y2="142" /><g className="lpda-feed-elements"><line x1="100" y1="42" x2="100" y2="202" /><line x1="215" y1="58" x2="215" y2="186" /><line x1="310" y1="72" x2="310" y2="172" /><line x1="390" y1="82" x2="390" y2="162" /></g><path className="lpda-feed-arrow" d="M405 42 H480 M480 42 l-16 -9 v18 z" /><text x="440" y="27">Beam / feed end</text><text x="60" y="92">Boom A</text><text x="60" y="164">Boom B</text></svg><ol><li>Feed at the short-element end with a documented balanced line, or use Carrel’s coax-through-one-boom arrangement with the centre conductor connected to the other boom.</li><li>Do not infer feeder impedance from boom spacing alone; conductor size, shape, separation, junctions, and supports form the transmission line.</li><li>Treat any rear termination as an explicit modelled component. Carrel notes little effect within design limits, not universal irrelevance.</li><li>Sweep complex impedance and pattern across the complete requested range; verify forward direction toward the shorter elements.</li></ol><p className="lpda-feed-limit"><strong>No match, balun ratio, or termination is prescribed.</strong> Measure feedline current, loss, heating, polarization, beam direction, sidelobes, and structural stability with the finished antenna installed.</p></article>
    </div>
  </section>;
}
