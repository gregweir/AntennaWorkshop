/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { AIR_CORE_COIL_MODEL, calculateAirCoreCoil } from '../calculators/airCoreCoil';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';

interface Props {
  targetInductanceMicrohenries: number;
  coilLabel: string;
  unitSystem: UnitSystem;
}

function millimetresToDisplay(value: number, unitSystem: UnitSystem) {
  return unitSystem === 'metric' ? value : value / 25.4;
}

function displayToMillimetres(value: number, unitSystem: UnitSystem) {
  return unitSystem === 'metric' ? value : value * 25.4;
}

function CoilField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field">
    <span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span>
    <span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span>
    <small>{help}</small>
  </div>;
}

function CoilDiagram({ turns, meanDiameterMillimetres, windingLengthMillimetres, unitSystem }: { turns: number; meanDiameterMillimetres: number; windingLengthMillimetres: number; unitSystem: UnitSystem }) {
  const drawnTurns = Math.min(turns, 24);
  return <figure className="coil-construction-figure">
    <svg viewBox="0 0 760 270" role="img" aria-labelledby="coil-diagram-title coil-diagram-desc">
      <title id="coil-diagram-title">Single-layer air-core coil construction diagram</title>
      <desc id="coil-diagram-desc">A cylindrical coil form with {turns} evenly spaced turns over a winding length of {formatLength(windingLengthMillimetres / 1_000, unitSystem)} and a mean coil diameter of {formatLength(meanDiameterMillimetres / 1_000, unitSystem)}.</desc>
      <defs><marker id="coil-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
      <rect className="coil-form" x="140" y="72" width="480" height="110" rx="55" />
      <g className="coil-winding">{Array.from({ length: drawnTurns }, (_, index) => {
        const x = drawnTurns === 1 ? 380 : 158 + index * (444 / (drawnTurns - 1));
        return <ellipse key={index} cx={x} cy="127" rx="13" ry="63" />;
      })}</g>
      <g className="coil-dimensions">
        <line x1="140" y1="222" x2="620" y2="222" />
        <text x="380" y="247" textAnchor="middle">Winding length · {formatLength(windingLengthMillimetres / 1_000, unitSystem)}</text>
        <line x1="680" y1="72" x2="680" y2="182" />
        <text x="695" y="131" transform="rotate(90 695 131)" textAnchor="middle">Mean diameter · {formatLength(meanDiameterMillimetres / 1_000, unitSystem)}</text>
      </g>
      <text className="coil-turn-label" x="380" y="32" textAnchor="middle">{turns} turns · {drawnTurns < turns ? `${drawnTurns} shown schematically` : 'shown to count'}</text>
    </svg>
    <figcaption>Construction view · Turns are distributed uniformly over the entered winding length; lead length and mounting hardware are not included.</figcaption>
  </figure>;
}

export function AirCoreCoilPanel({ targetInductanceMicrohenries, coilLabel, unitSystem }: Props) {
  const headingId = useId();
  const [formDiameterMillimetres, setFormDiameterMillimetres] = useState(50);
  const [windingLengthMillimetres, setWindingLengthMillimetres] = useState(75);
  const [wireDiameterMillimetres, setWireDiameterMillimetres] = useState(2);
  const displayUnit = unitSystem === 'metric' ? 'mm' : 'in';
  const displayPrecision = unitSystem === 'metric' ? 2 : 4;
  const result = useMemo(() => {
    try {
      return { value: calculateAirCoreCoil({ targetInductanceMicrohenries, formOutsideDiameterMillimetres: formDiameterMillimetres, windingLengthMillimetres, wireOutsideDiameterMillimetres: wireDiameterMillimetres }), error: null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : 'The selected coil geometry is outside the model.' };
    }
  }, [formDiameterMillimetres, targetInductanceMicrohenries, windingLengthMillimetres, wireDiameterMillimetres]);

  return <section className="coil-construction-panel" aria-labelledby={headingId}>
    <div className="coil-construction-heading"><div><p className="eyebrow">Physical coil starting point</p><h3 id={headingId}>{coilLabel}: single-layer air-core geometry</h3></div><strong>{targetInductanceMicrohenries.toFixed(2)} µH target</strong></div>
    <p>Choose a form, winding length, and actual insulated-wire diameter. The ARRL approximation converts the target into a turn count; build with adjustment room and measure the finished coil at the operating frequency.</p>
    <div className="coil-construction-layout">
      <div className="coil-construction-inputs">
        <CoilField label="Coil form outside diameter" tooltip="Measure the outside diameter of the insulating form. The calculation adds one wire diameter to use the required turn-centre to turn-centre coil diameter." value={Number(millimetresToDisplay(formDiameterMillimetres, unitSystem).toFixed(displayPrecision))} min={unitSystem === 'metric' ? 1 : 0.04} max={unitSystem === 'metric' ? 10_000 : 394} step={unitSystem === 'metric' ? 1 : 0.01} unit={displayUnit} help="Outside diameter of the non-conductive form, before winding." onChange={(value) => setFormDiameterMillimetres(displayToMillimetres(value, unitSystem))} />
        <CoilField label="Coil winding length" tooltip="This is the axial distance occupied by the uniformly spaced turns. For this approximation it must be at least 0.4 times the mean coil diameter." value={Number(millimetresToDisplay(windingLengthMillimetres, unitSystem).toFixed(displayPrecision))} min={unitSystem === 'metric' ? 1 : 0.04} max={unitSystem === 'metric' ? 100_000 : 3_937} step={unitSystem === 'metric' ? 1 : 0.01} unit={displayUnit} help="Finished axial length occupied by the uniformly spaced turns." onChange={(value) => setWindingLengthMillimetres(displayToMillimetres(value, unitSystem))} />
        <CoilField label="Insulated wire outside diameter" tooltip="Measure the complete outside diameter, including enamel or other insulation. The value controls mean coil diameter, required pitch, and whether the turns physically fit in one layer." value={Number(millimetresToDisplay(wireDiameterMillimetres, unitSystem).toFixed(displayPrecision))} min={unitSystem === 'metric' ? 0.01 : 0.0004} max={unitSystem === 'metric' ? 1_000 : 39.37} step={unitSystem === 'metric' ? 0.1 : 0.001} unit={displayUnit} help="Use measured outside diameter rather than nominal bare-conductor gauge." onChange={(value) => setWireDiameterMillimetres(displayToMillimetres(value, unitSystem))} />
      </div>
      {result.value ? <div className="coil-construction-results">
        <div className="coil-turn-result"><span>Wind</span><strong>{result.value.roundedTurns} turns</strong><small>Ideal calculation: {result.value.idealTurns.toFixed(2)} turns</small></div>
        <dl>
          <div><dt>Estimated rounded-turn inductance</dt><dd>{result.value.estimatedInductanceMicrohenries.toFixed(2)} µH</dd></div>
          <div><dt>Difference from target</dt><dd>{result.value.targetDifferencePercent >= 0 ? '+' : ''}{result.value.targetDifferencePercent.toFixed(1)}%</dd></div>
          <div><dt>Turn-centre pitch</dt><dd>{formatLength(result.value.turnPitchMillimetres / 1_000, unitSystem)}</dd></div>
          <div><dt>Clear space between turns</dt><dd>{result.value.fitsSingleLayer ? formatLength(result.value.clearSpacingMillimetres / 1_000, unitSystem) : 'Does not fit'}</dd></div>
          <div><dt>Turns per inch</dt><dd>{result.value.turnsPerInch.toFixed(1)}</dd></div>
          <div><dt>Approximate winding wire</dt><dd>{formatLength(result.value.approximateWindingWireLengthMetres, unitSystem)}</dd></div>
        </dl>
        {!result.value.fitsSingleLayer && <p className="validation-message" role="alert">The selected wire needs at least {formatLength(result.value.closeWoundLengthMillimetres / 1_000, unitSystem)} for {result.value.roundedTurns} close-wound turns. Increase winding length, increase form diameter, reduce wire diameter, or revise the target.</p>}
      </div> : <p className="validation-message coil-construction-error" role="alert">{result.error}</p>}
    </div>
    {result.value && <CoilDiagram turns={result.value.roundedTurns} meanDiameterMillimetres={result.value.meanCoilDiameterMillimetres} windingLengthMillimetres={result.value.windingLengthMillimetres} unitSystem={unitSystem} />}
    <article className="caution-card coil-applicability"><p className="eyebrow">Applicability</p><h4>Geometry is not RF performance</h4><p>The approximation is intended for single-layer air-core coils whose winding length is at least 0.4 times the mean diameter. It does not predict Q, RF resistance, self-capacitance, self-resonant frequency, current, voltage, heating, corona, form loss, weather effects, or coupling to nearby objects. Measure the finished coil and verify it under the intended frequency, power, duty cycle, and enclosure conditions.</p></article>
    <footer className="coil-model-source"><span>Model {AIR_CORE_COIL_MODEL.version} · {AIR_CORE_COIL_MODEL.id}</span>{AIR_CORE_COIL_MODEL.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</footer>
  </section>;
}
