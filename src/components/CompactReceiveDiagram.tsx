/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import type { CompactReceiveGeometry, calculateCompactReceive } from '../calculators/compactReceive';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  geometry: CompactReceiveGeometry;
  horizontalSpanMetres: number;
  verticalHeightMetres: number;
  bottomClearanceMetres: number;
  receiveBearingDegrees: number;
  receiveCompassPoint: string;
  nullBearingDegrees: number;
  nullCompassPoint: string;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

const geometryNames: Record<CompactReceiveGeometry, string> = {
  flag: 'Flag',
  pennant: 'point-fed Pennant',
  ewe: 'EWE'
};

type CompactReceiveResult = ReturnType<typeof calculateCompactReceive>;

function CompactReceiveNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function CompactReceiveConstructionControls({ antennaWindingTurns, setAntennaWindingTurns, feedlineWindingTurns, setFeedlineWindingTurns }: { antennaWindingTurns: number; setAntennaWindingTurns: (value: number) => void; feedlineWindingTurns: number; setFeedlineWindingTurns: (value: number) => void }) {
  return <>
    <CompactReceiveNumberField label="Compact-receive antenna winding" tooltip="Enter the actual whole-number turns planned on the winding connected to the antenna feedpoint. This ratio check does not select a core or predict bandwidth, loss, isolation, saturation, or winding capacitance." value={antennaWindingTurns} min={1} max={100} step={1} unit="turns" help="Use the loaded preset as a starting record, then verify the finished transformer across every intended receive band." onChange={setAntennaWindingTurns} />
    <CompactReceiveNumberField label="Compact-receive feedline winding" tooltip="Enter the actual whole-number turns planned on the receiver-feedline winding. Keep the antenna winding electrically isolated unless a documented transformer design explicitly requires otherwise." value={feedlineWindingTurns} min={1} max={100} step={1} unit="turns" help="The squared turns ratio supplies impedance context only; it is not a complete transformer design." onChange={setFeedlineWindingTurns} />
  </>;
}

export function CompactReceiveDiagram({ geometry, horizontalSpanMetres, verticalHeightMetres, bottomClearanceMetres, receiveBearingDegrees, receiveCompassPoint, nullBearingDegrees, nullCompassPoint, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const feedX = 620;
  const terminationX = 150;
  const topY = 315;
  const bottomY = 430;
  const middleY = (topY + bottomY) / 2;
  const wirePath = geometry === 'flag'
    ? `M ${terminationX} ${middleY} L ${terminationX} ${topY} L ${feedX} ${topY} L ${feedX} ${middleY} M ${feedX} ${middleY} L ${feedX} ${bottomY} L ${terminationX} ${bottomY} L ${terminationX} ${middleY}`
    : geometry === 'pennant'
      ? `M ${terminationX} ${middleY} L ${feedX} ${topY} L ${feedX} ${middleY} M ${feedX} ${middleY} L ${feedX} ${bottomY} L ${terminationX} ${middleY}`
      : `M ${terminationX} ${448} L ${terminationX} ${topY} L ${feedX} ${topY} L ${feedX} ${448}`;

  return <figure className="antenna-figure">
    <svg className="dipole-diagram compact-receive-diagram" viewBox="0 0 760 520" role="img" aria-labelledby="compact-receive-title compact-receive-description">
      <title id="compact-receive-title">{geometryNames[geometry]} receiving-antenna geometry and direction</title>
      <desc id="compact-receive-description">The antenna receives primarily toward its feed end at {receiveBearingDegrees.toFixed(0)} degrees {receiveCompassPoint}, with its principal null toward the terminating resistor at {nullBearingDegrees.toFixed(0)} degrees {nullCompassPoint}. The elevation view identifies the feedpoint, termination, dimensions, and {geometry === 'ewe' ? 'two ground returns' : 'elevated closed wire loop'}.</desc>
      <DiagramDefinitions prefix="compact-receive" />
      <DiagramGrid />
      <g className="compact-direction-panel">
        <line className="compact-direction-axis" x1="145" y1="115" x2="620" y2="115" />
        <path className="compact-response-arrow" d="M 375 115 L 620 115" />
        <circle className="compact-termination-point" cx="145" cy="115" r="8" />
        <circle className="compact-feed-point" cx="620" cy="115" r="8" />
        <text x="145" y="91" textAnchor="middle">Termination</text>
        <text x="620" y="91" textAnchor="middle">Feed</text>
        <text className="compact-receive-label" x="500" y="146" textAnchor="middle">Receive · {receiveBearingDegrees.toFixed(0)}° {receiveCompassPoint}</text>
        <text className="compact-null-label" x="260" y="146" textAnchor="middle">Principal null · {nullBearingDegrees.toFixed(0)}° {nullCompassPoint}</text>
      </g>
      <g className="compact-elevation">
        <path className="compact-wire" d={wirePath} />
        <circle className="compact-termination-point" cx={terminationX} cy={geometry === 'ewe' ? 448 : middleY} r="7" />
        <circle className="compact-feed-point" cx={feedX} cy={geometry === 'ewe' ? 448 : middleY} r="7" />
        {geometry === 'ewe' ? <>
          <rect className="compact-component" x="108" y="400" width="84" height="30" rx="7" /><text x="150" y="420" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
          <rect className="compact-component" x="575" y="400" width="90" height="30" rx="7" /><text x="620" y="420" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1</text>
          <path className="compact-ground-symbol" d="M 135 448 h 30 M 139 455 h 22 M 144 462 h 12 M 605 448 h 30 M 609 455 h 22 M 614 462 h 12" />
          <text x="150" y="488" textAnchor="middle">Termination ground</text><text x="620" y="488" textAnchor="middle">Feed ground</text>
        </> : <>
          <rect className="compact-component" x="103" y={middleY - 15} width="94" height="30" rx="7" /><text x="150" y={middleY + 5} textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
          <rect className="compact-component" x="570" y={middleY - 15} width="100" height="30" rx="7" /><text x="620" y={middleY + 5} textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
          <line className="compact-ground" x1="85" y1="485" x2="690" y2="485" />
          <SvgDimension prefix="compact-clearance" x1={90} y1={bottomY} x2={90} y2={485} label={`Clearance · ${formatLength(bottomClearanceMetres, unitSystem)}`} labelX={90} labelY={412} />
        </>}
        <text className="compact-geometry-label" x="385" y="268" textAnchor="middle">{geometryNames[geometry]}</text>
      </g>
      <SvgDimension prefix="compact-span" x1={terminationX} y1={285} x2={feedX} y2={285} label={`Horizontal span · ${formatLength(horizontalSpanMetres, unitSystem)}`} labelX={385} labelY={270} />
      <SvgDimension prefix="compact-height" x1={704} y1={topY} x2={704} y2={bottomY} label={`Height · ${formatLength(verticalHeightMetres, unitSystem)}`} labelX={704} labelY={300} />
    </svg>
    <figcaption>Direction and elevation views, not to scale · Primary response is toward the feed end; the principal null is toward the termination. These labels show the source convention, not a predicted installed pattern.</figcaption>
  </figure>;
}

export function CompactReceiveConstructionPanel({ result, unitSystem }: { result: CompactReceiveResult; unitSystem: UnitSystem }) {
  return <section className="compact-construction-panel" aria-labelledby="compact-construction-title">
    <div className="compact-construction-heading"><div><p className="eyebrow">Construction and commissioning worksheet</p><h3 id="compact-construction-title">Preserve the geometry, opposite endpoints, and receive system</h3><p>Cut allowance is allocated across the geometric segments without changing the finished span or height. Keep electrically continuous paths continuous except at the intended feed and termination, and treat the transformer, feedline, protection, supports, and any ground returns as parts of the installed antenna.</p></div><dl><div><dt>Geometry</dt><dd>{geometryNames[result.geometry]}</dd></div><div><dt>Finished wire path</dt><dd>{formatLength(result.designWireLengthMetres, unitSystem)}</dd></div><div><dt>Total wire to cut</dt><dd>{formatLength(result.cutWireLengthMetres, unitSystem)}</dd></div><div><dt>Direction convention</dt><dd>Feed {result.receiveBearingDegrees.toFixed(0)}° {result.receiveCompassPoint} · termination {result.nullBearingDegrees.toFixed(0)}° {result.nullCompassPoint}</dd></div></dl></div>
    <div className="compact-construction-grid">
      <article className="compact-segment-check"><h4>Segment material schedule</h4><div className="table-scroll"><table><thead><tr><th scope="col">Segment</th><th scope="col">Qty</th><th scope="col">Finished each</th><th scope="col">Allowance each</th><th scope="col">Allocated total</th></tr></thead><tbody>{result.segmentSchedule.map((segment) => <tr key={segment.label}><th scope="row">{segment.label}</th><td>{segment.quantity}</td><td>{formatLength(segment.designLengthMetres, unitSystem)}</td><td>{formatLength(segment.cutLengthMetres, unitSystem)}</td><td>{formatLength(segment.totalCutLengthMetres, unitSystem)}</td></tr>)}</tbody></table></div><ol><li>Establish the feed and termination locations before cutting or joining wire.</li><li>Use these rows to allocate material, not to prescribe separate splices; preserve continuous conductors wherever the selected topology permits.</li><li>Measure finished dimensions between electrical junctions; pigtails and attachment wraps come from the separate allowance.</li><li>{result.geometry === 'ewe' ? 'Build and document two separate ground returns; record electrodes, soil, moisture, bonding, and seasonal condition.' : 'Use non-conductive supports and maintain the entered lower-wire clearance along the complete elevated loop.'}</li><li>Keep the feedline route outside the antenna field where practical and verify common-mode isolation.</li></ol></article>
      <article className="compact-transformer-check"><p className="eyebrow">Ideal winding-ratio check</p><h4>Compare the planned winding with the impedance assumption</h4><dl><div><dt>Calculated ideal turns ratio</dt><dd>{result.transformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered winding</dt><dd>{result.antennaWindingTurns}:{result.feedlineWindingTurns} turns · {result.enteredTransformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Entered impedance ratio</dt><dd>{result.enteredTransformerImpedanceRatio.toFixed(2)} : 1</dd></div><div><dt>Ideal referred impedance</dt><dd>{result.enteredReferredAntennaImpedanceOhms.toFixed(1)} Ω · {result.enteredReferredImpedanceDifferencePercent.toFixed(1)}% from assumption</dd></div></dl><ol><li>Measure winding continuity and inter-winding isolation before connection.</li><li>Sweep insertion loss and transformation across every intended band using representative terminations.</li><li>Install the complete antenna, then compare signal-to-noise toward the feed, termination, and side bearings.</li><li>Adjust termination only from repeatable comparisons with receiver settings, frequency, soil, and weather recorded.</li></ol><p className="compact-transformer-limit"><strong>The ratio is not a transformer design or a pattern prediction.</strong> Core choice, winding layout, loss, isolation, feedline pickup, protection, installed impedance, gain, and null depth require separate design and measurement.</p></article>
    </div>
  </section>;
}
