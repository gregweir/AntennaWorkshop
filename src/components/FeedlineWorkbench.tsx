/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { calculateCoaxialStub, calculateFeedlineBudget, calculateRadiatedPower, COAXIAL_STUB_MODEL, FEEDLINE_MODEL, RADIATED_POWER_MODEL, type GainReference, type StubFraction, type StubTermination } from '../calculators/feedline';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import { BandIndicator } from './BandIndicator';
import { FeedlineDiagram } from './FeedlineDiagram';
import { CoaxialStubDiagram } from './CoaxialStubDiagram';
import { RadiatedPowerDiagram } from './RadiatedPowerDiagram';

interface Props {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
}

export function FeedlineWorkbench({ jurisdiction, unitSystem }: Props) {
  const [mode, setMode] = useState<'power' | 'stub' | 'radiated'>('power');
  const [frequencyText, setFrequencyText] = useState('146.520');
  const [transmitterPowerWatts, setTransmitterPowerWatts] = useState(100);
  const [cableLengthMetres, setCableLengthMetres] = useState(30);
  const [lossDbPer100Metres, setLossDbPer100Metres] = useState(6);
  const [accessoryLossDb, setAccessoryLossDb] = useState(0.2);
  const [swr, setSwr] = useState(1.5);
  const [velocityFactor, setVelocityFactor] = useState(0.66);
  const [stubFraction, setStubFraction] = useState<StubFraction>(0.25);
  const [stubTermination, setStubTermination] = useState<StubTermination>('short');
  const [stubTrimAllowancePercent, setStubTrimAllowancePercent] = useState(5);
  const [feedSystemLossDb, setFeedSystemLossDb] = useState(1.8);
  const [antennaGainDb, setAntennaGainDb] = useState(2.15);
  const [gainReference, setGainReference] = useState<GainReference>('dBi');
  const frequencyMHz = Number(frequencyText);
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';
  const cableLengthDisplay = unitSystem === 'metric' ? cableLengthMetres : metresToFeet(cableLengthMetres);
  const lossRateDisplay = unitSystem === 'metric' ? lossDbPer100Metres : lossDbPer100Metres * 0.3048;

  const powerResult = useMemo(() => {
    try {
      return calculateFeedlineBudget({ transmitterPowerWatts, cableLengthMetres, matchedLossDbPer100Metres: lossDbPer100Metres, accessoryLossDb, swr });
    } catch {
      return null;
    }
  }, [accessoryLossDb, cableLengthMetres, lossDbPer100Metres, swr, transmitterPowerWatts]);

  const stubResult = useMemo(() => {
    try {
      return calculateCoaxialStub({ frequencyMHz, velocityFactor, fraction: stubFraction, termination: stubTermination, trimAllowancePercent: stubTrimAllowancePercent });
    } catch {
      return null;
    }
  }, [frequencyMHz, stubFraction, stubTermination, stubTrimAllowancePercent, velocityFactor]);

  const radiatedResult = useMemo(() => {
    try {
      return calculateRadiatedPower({ transmitterPowerWatts, feedSystemLossDb, antennaGainDb, gainReference });
    } catch {
      return null;
    }
  }, [antennaGainDb, feedSystemLossDb, gainReference, transmitterPowerWatts]);

  const result = mode === 'power' ? powerResult : mode === 'stub' ? stubResult : radiatedResult;
  const model = mode === 'power' ? FEEDLINE_MODEL : mode === 'stub' ? COAXIAL_STUB_MODEL : RADIATED_POWER_MODEL;

  return <section className="workspace shell feedline-workspace" id="calculator" aria-labelledby="calculator-title">
    <div className="workspace-heading">
      <div><p className="eyebrow">Feedline and matching</p><h2 id="calculator-title">{mode === 'power' ? 'Feedline power budget' : mode === 'stub' ? 'Coaxial stub length' : 'ERP and EIRP'}</h2></div>
      <span className="model-badge">Model {model.version}</span>
    </div>
    <div className="feedline-mode-picker" aria-label="Feedline calculator">
      <button type="button" aria-pressed={mode === 'power'} onClick={() => setMode('power')}><strong>Power budget</strong><small>Loss, SWR, and accepted power</small></button>
      <button type="button" aria-pressed={mode === 'stub'} onClick={() => setMode('stub')}><strong>Coaxial stub</strong><small>Velocity factor and electrical length</small></button>
      <button type="button" aria-pressed={mode === 'radiated'} onClick={() => setMode('radiated')}><strong>ERP / EIRP</strong><small>Loss, gain, and reference power</small></button>
    </div>
    <div className="calculator-layout">
      <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
        <label className="field">
          <span>Amateur band</span>
          <select className="band-select" value={activeBand?.id ?? 'custom'} onChange={(event) => {
            const band = availableBands.find((candidate) => candidate.id === event.target.value);
            if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1));
          }}>
            <option value="custom">Custom frequency</option>
            {availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}
          </select>
          <small>Use a cable loss specification measured at, or near, this operating frequency.</small>
        </label>
        <PowerField label="Operating frequency" value={frequencyText} unit="MHz" min={0.001} step={0.001} onChange={setFrequencyText} help="Frequency records which manufacturer attenuation value applies; it does not rescale that value automatically." />
        {mode === 'power' ? <>
          <PowerField label="Transmitter power" value={transmitterPowerWatts} unit="W" min={0.001} step={1} onChange={(value) => setTransmitterPowerWatts(Number(value))} help="Use the forward power entering the accessories and feedline." />
          <PowerField label="Cable length" value={Number(cableLengthDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'm' : 'ft'} min={0} step={0.1} onChange={(value) => setCableLengthMetres(unitSystem === 'metric' ? Number(value) : feetToMetres(Number(value)))} help="Include the complete cable path, including indoor and mast runs." />
          <PowerField label="Published matched cable loss" value={Number(lossRateDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'dB/100 m' : 'dB/100 ft'} min={0} step={0.01} onChange={(value) => setLossDbPer100Metres(unitSystem === 'metric' ? Number(value) : Number(value) / 0.3048)} help="Copy the loss from the cable manufacturer's data at the selected frequency and temperature." />
          <PowerField label="Accessory insertion loss" value={accessoryLossDb} unit="dB" min={0} step={0.1} onChange={(value) => setAccessoryLossDb(Number(value))} help="Combine known losses from switches, meters, filters, connectors, and external tuners." />
          <PowerField label="SWR at the antenna" value={swr} unit=": 1" min={1} step={0.01} onChange={(value) => setSwr(Number(value))} help="SWR alone does not reveal whether the impedance is high, low, inductive, or capacitive." />
        </> : mode === 'stub' ? <>
          <label className="field"><span>Common dielectric preset</span><select value={velocityFactor} onChange={(event) => setVelocityFactor(Number(event.target.value))}><option value={0.66}>Solid polyethylene · 0.66</option><option value={0.7}>PTFE · 0.70</option><option value={0.8}>Foam polyethylene · 0.80</option><option value={0.85}>Low-density foam · 0.85</option></select><small>Use the cable manufacturer's measured value when available; cable construction varies.</small></label>
          <PowerField label="Velocity factor" value={velocityFactor} unit="ratio" min={0.01} max={1} step={0.01} onChange={(value) => setVelocityFactor(Number(value))} help="Propagation speed in the cable divided by the speed of light in vacuum." />
          <label className="field"><span>Electrical length</span><select value={stubFraction} onChange={(event) => setStubFraction(Number(event.target.value) as StubFraction)}><option value={0.25}>Quarter wavelength · 90°</option><option value={0.5}>Half wavelength · 180°</option></select><small>Electrical length is specified at the selected design frequency.</small></label>
          <label className="field"><span>Far-end termination</span><select value={stubTermination} onChange={(event) => setStubTermination(event.target.value as StubTermination)}><option value="short">Shorted</option><option value="open">Open</option></select><small>The ideal input behaviour reverses at a quarter wavelength and repeats at a half wavelength.</small></label>
          <PowerField label="Extra length for trimming" value={stubTrimAllowancePercent} unit="%" min={0} max={25} step={0.5} onChange={(value) => setStubTrimAllowancePercent(Number(value))} help="Added to the ideal physical length; connectors are part of the electrical length." />
        </> : <>
          <PowerField label="Transmitter power" value={transmitterPowerWatts} unit="W" min={0.001} step={1} onChange={(value) => setTransmitterPowerWatts(Number(value))} help="Use power before the feedline and accessories. For time-averaged exposure work, use the power definition required by the applicable method." />
          <PowerField label="Total feed-system loss" value={feedSystemLossDb} unit="dB" min={0} max={100} step={0.1} onChange={(value) => setFeedSystemLossDb(Number(value))} help="Combine feeder, connector, switch, filter, duplexer, and other insertion losses before the antenna." />
          <PowerField label="Antenna gain" value={antennaGainDb} unit={gainReference} min={-100} max={100} step={0.1} onChange={(value) => setAntennaGainDb(Number(value))} help="Use gain in the direction being evaluated, including antenna efficiency, and select its stated reference." />
          <label className="field"><span>Gain reference</span><select value={gainReference} onChange={(event) => setGainReference(event.target.value as GainReference)}><option value="dBi">dBi · isotropic reference</option><option value="dBd">dBd · half-wave dipole reference</option></select><small>Changing the reference reinterprets the entered gain; it does not silently convert the numeric field.</small></label>
        </>}
        {!result && <p className="validation-message" role="alert">Enter values within the displayed limits to calculate the {mode === 'power' ? 'budget' : mode === 'stub' ? 'stub' : 'radiated power'}.</p>}
        {mode === 'power' && powerResult && <div className="result-summary" aria-live="polite">
          <p>Forward power at antenna feedpoint</p><strong>{powerResult.forwardPowerAtAntennaWatts.toFixed(2)} W</strong>
          <dl>
            <div><dt>Accepted by load</dt><dd>{powerResult.acceptedPowerWatts.toFixed(2)} W</dd></div>
            <div><dt>Cable loss</dt><dd>{powerResult.cableLossDb.toFixed(2)} dB</dd></div>
            <div><dt>Return loss</dt><dd>{Number.isFinite(powerResult.returnLossDb) ? `${powerResult.returnLossDb.toFixed(2)} dB` : '∞ dB'}</dd></div>
            <div><dt>Reflected power</dt><dd>{powerResult.reflectedPowerPercent.toFixed(1)}%</dd></div>
          </dl>
        </div>}
        {mode === 'stub' && stubResult && <div className="result-summary" aria-live="polite"><p>Start with this cut length</p><strong>{formatLength(stubResult.cutLengthMetres, unitSystem)}</strong><dl><div><dt>Ideal physical length</dt><dd>{formatLength(stubResult.physicalLengthMetres, unitSystem)}</dd></div><div><dt>Guided wavelength</dt><dd>{formatLength(stubResult.guidedWavelengthMetres, unitSystem)}</dd></div><div><dt>Electrical length</dt><dd>{stubResult.electricalLengthDegrees}°</dd></div><div><dt>One-way delay</dt><dd>{stubResult.oneWayDelayNanoseconds.toFixed(3)} ns</dd></div><div><dt>Ideal input behaviour</dt><dd>{stubResult.inputImpedanceBehavior === 'high' ? 'High impedance' : 'Low impedance'}</dd></div></dl></div>}
        {mode === 'radiated' && radiatedResult && <div className="result-summary" aria-live="polite"><p>Equivalent isotropically radiated power</p><strong>{formatWatts(radiatedResult.eirpWatts)}</strong><dl><div><dt>Effective radiated power</dt><dd>{formatWatts(radiatedResult.erpWatts)}</dd></div><div><dt>Power supplied to antenna</dt><dd>{formatWatts(radiatedResult.antennaInputPowerWatts)}</dd></div><div><dt>Converted antenna gain</dt><dd>{radiatedResult.antennaGainDbi.toFixed(2)} dBi · {radiatedResult.antennaGainDbd.toFixed(2)} dBd</dd></div><div><dt>EIRP</dt><dd>{radiatedResult.eirpDbw.toFixed(2)} dBW · {radiatedResult.eirpDbm.toFixed(2)} dBm</dd></div><div><dt>Feed-system efficiency</dt><dd>{radiatedResult.feedSystemEfficiencyPercent.toFixed(1)}%</dd></div></dl></div>}
      </form>
      <div className="visual-panel">{mode === 'power' ? powerResult ? <FeedlineDiagram result={powerResult} transmitterPowerWatts={transmitterPowerWatts} cableLengthLabel={formatLength(cableLengthMetres, unitSystem)} /> : <div className="diagram-placeholder">The power-flow diagram will appear when the inputs are valid.</div> : mode === 'stub' ? stubResult ? <CoaxialStubDiagram result={stubResult} termination={stubTermination} unitSystem={unitSystem} /> : <div className="diagram-placeholder">The coaxial-stub diagram will appear when the inputs are valid.</div> : radiatedResult ? <RadiatedPowerDiagram result={radiatedResult} transmitterPowerWatts={transmitterPowerWatts} feedSystemLossDb={feedSystemLossDb} antennaGainDb={antennaGainDb} gainReference={gainReference} /> : <div className="diagram-placeholder">The ERP/EIRP diagram will appear when the inputs are valid.</div>}</div>
    </div>

    <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
    <p className="allocation-note">Band context for {jurisdictionName}. {mode === 'power' ? 'The calculator does not select a cable specification for you; use current manufacturer data.' : mode === 'stub' ? 'Velocity factor and physical length depend on the actual cable and connectors; confirm the finished stub by measurement.' : 'ERP and EIRP use maximum directional antenna gain and are not a substitute for jurisdiction-specific exposure evaluation.'}{bandSource && <> Allocation source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>

    {mode === 'power' && powerResult && <div className="explanation-grid">
      <article><p className="eyebrow">Power accounting</p><h3>Where the watts go</h3><p>The matched cable and accessory losses dissipate about {powerResult.pathDissipationWatts.toFixed(2)} W before the antenna. At the load, the selected SWR corresponds to {powerResult.reflectedPowerWatts.toFixed(2)} W reflected and {powerResult.acceptedPowerWatts.toFixed(2)} W accepted in this first-order budget.</p></article>
      <article><p className="eyebrow">Matching quantities</p><h3>One mismatch, several views</h3><p className="formula">|Γ| = (SWR − 1) ÷ (SWR + 1)</p><p>|Γ| is {powerResult.reflectionCoefficient.toFixed(3)}, mismatch loss is {powerResult.mismatchLossDb.toFixed(2)} dB, and return loss is {Number.isFinite(powerResult.returnLossDb) ? `${powerResult.returnLossDb.toFixed(2)} dB` : 'infinite for a perfect match'}.</p></article>
      <article className="caution-card"><p className="eyebrow">Applicability</p><h3>Not a transmission-line simulation</h3><p>Published loss is normally a matched-line value. High SWR increases real cable loss, while re-reflections mean transmitter-end reverse power is not simply the load reflection shown here. For conservative RF-exposure screening, use the forward power at the antenna feedpoint and do not claim the mismatch reduction unless the selected method permits it.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {FEEDLINE_MODEL.version}</h3><p>Losses in decibels are added, then converted to a power ratio. Reflection quantities use the standard scalar relationships among SWR, reflection coefficient, return loss, and mismatch loss.</p><ul>{FEEDLINE_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {FEEDLINE_MODEL.id} · Reviewed {FEEDLINE_MODEL.reviewedOn}</small></article>
    </div>}
    {mode === 'stub' && stubResult && <div className="explanation-grid">
      <article><p className="eyebrow">Electrical and physical length</p><h3>Velocity factor shortens the cable</h3><p className="formula">L = (c ÷ f) × VF × wavelength fraction</p><p>The free-space wavelength is {formatLength(stubResult.freeSpaceWavelengthMetres, unitSystem)}; velocity factor {velocityFactor.toFixed(2)} reduces the wavelength inside this cable to {formatLength(stubResult.guidedWavelengthMetres, unitSystem)}.</p></article>
      <article><p className="eyebrow">Termination transformation</p><h3>{stubResult.electricalLengthDegrees}° changes what the input sees</h3><p>At the design frequency, an ideal quarter-wave line reverses an open and a short; a half-wave line repeats its termination. This {stubTermination} stub therefore appears as an ideal {stubResult.inputImpedanceBehavior}-impedance point at its input.</p></article>
      <article className="caution-card"><p className="eyebrow">Cutting and verification</p><h3>Include connectors, then trim by measurement</h3><p>Connector bodies, adapters, cable tolerances, bends, termination construction, and nearby conductors shift the electrical length. Start with the displayed allowance, terminate the cable as it will be used, and trim while watching the target response with a calibrated analyser. An open stub can carry high RF voltage.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {COAXIAL_STUB_MODEL.version}</h3><p>This is an ideal lossless-line length and termination transformation at one frequency. It does not calculate characteristic impedance, loss, power rating, bandwidth, or a complete matching network.</p><ul>{COAXIAL_STUB_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {COAXIAL_STUB_MODEL.id} · Reviewed {COAXIAL_STUB_MODEL.reviewedOn}</small></article>
    </div>}
    {mode === 'radiated' && radiatedResult && <div className="explanation-grid">
      <article><p className="eyebrow">Antenna-system budget</p><h3>Loss before gain</h3><p className="formula">EIRP(dBW) = P(dBW) − L(dB) + G(dBi)</p><p>{formatWatts(transmitterPowerWatts)} becomes {formatWatts(radiatedResult.antennaInputPowerWatts)} at the antenna after {feedSystemLossDb.toFixed(2)} dB of feed-system loss. The directional antenna gain is then applied.</p></article>
      <article><p className="eyebrow">Reference conversion</p><h3>Isotropic and dipole references differ</h3><p className="formula">G(dBi) = G(dBd) + 2.15 dB</p><p>EIRP is {formatWatts(radiatedResult.eirpWatts)} relative to isotropic; ERP is {formatWatts(radiatedResult.erpWatts)} relative to a half-wave dipole. EIRP is approximately 1.64 times ERP for the same system.</p></article>
      <article className="caution-card"><p className="eyebrow">Interpretation</p><h3>Not total power radiated in every direction</h3><p>ERP and EIRP describe equivalent power in a specified direction, normally the direction of maximum gain. Confirm whether a gain figure is dBi or dBd and whether it includes antenna losses. Do not mix peak-envelope, average, or duty-cycle-adjusted power unless the governing method explicitly calls for that quantity.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {RADIATED_POWER_MODEL.version}</h3><p>The calculation subtracts transmission losses in decibels, converts the stated antenna gain reference, and reports both equivalent powers. It does not calculate radiation patterns, near-field behaviour, or regulatory compliance.</p><ul>{RADIATED_POWER_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {RADIATED_POWER_MODEL.id} · Reviewed {RADIATED_POWER_MODEL.reviewedOn}</small></article>
    </div>}
  </section>;
}

function formatWatts(watts: number) {
  return watts >= 1000 ? `${(watts / 1000).toFixed(3)} kW` : `${watts.toFixed(2)} W`;
}

function PowerField({ label, value, unit, min, max, step, help, onChange }: { label: string; value: string | number; unit: string; min: number; max?: number; step: number; help: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><span className="input-with-unit"><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} /><span>{unit}</span></span><small>{help}</small></label>;
}
