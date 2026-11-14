/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { calculateCoaxialStub, calculateFeedlineBudget, calculateRadiatedPower, COAXIAL_STUB_MODEL, FEEDLINE_MODEL, RADIATED_POWER_MODEL, type GainReference, type StubFraction, type StubTermination } from '../calculators/feedline';
import { calculateLNetwork, L_NETWORK_MODEL } from '../calculators/lNetwork';
import { calculateQuarterWaveTransformer, QUARTER_WAVE_TRANSFORMER_MODEL } from '../calculators/quarterWaveTransformer';
import { calculateIdealTransformer, IDEAL_TRANSFORMER_MODEL, type ConnectionForm } from '../calculators/idealTransformer';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import { createStationSourceTransfer, type AntennaDesignHandoff, type StationSourceTransfer } from '../workflows/stationSourceWorkflow';
import { BandIndicator } from './BandIndicator';
import { FeedlineDiagram } from './FeedlineDiagram';
import { CoaxialStubDiagram } from './CoaxialStubDiagram';
import { RadiatedPowerDiagram } from './RadiatedPowerDiagram';
import { LNetworkDiagram } from './LNetworkDiagram';
import { QuarterWaveTransformerDiagram } from './QuarterWaveTransformerDiagram';
import { IdealTransformerDiagram } from './IdealTransformerDiagram';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { EvidenceResultSummary, ResultEvidenceKey } from './ResultEvidenceGuide';

interface Props {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  antennaHandoff: AntennaDesignHandoff | null;
  onAddToExposure: (transfer: StationSourceTransfer) => void;
}

export function FeedlineWorkbench({ jurisdiction, unitSystem, antennaHandoff, onAddToExposure }: Props) {
  const [mode, setMode] = useState<'power' | 'stub' | 'match' | 'transformer' | 'ratio' | 'radiated'>(antennaHandoff ? 'radiated' : 'power');
  const [frequencyText, setFrequencyText] = useState(antennaHandoff ? antennaHandoff.frequencyMHz.toString() : '146.520');
  const [transmitterPowerWatts, setTransmitterPowerWatts] = useState(100);
  const [cableLengthMetres, setCableLengthMetres] = useState(30);
  const [lossDbPer100Metres, setLossDbPer100Metres] = useState(6);
  const [accessoryLossDb, setAccessoryLossDb] = useState(0.2);
  const [swr, setSwr] = useState(1.5);
  const [velocityFactor, setVelocityFactor] = useState(0.66);
  const [stubFraction, setStubFraction] = useState<StubFraction>(0.25);
  const [stubTermination, setStubTermination] = useState<StubTermination>('short');
  const [stubTrimAllowancePercent, setStubTrimAllowancePercent] = useState(5);
  const [systemResistanceOhms, setSystemResistanceOhms] = useState(50);
  const [loadResistanceOhms, setLoadResistanceOhms] = useState(100);
  const [loadReactanceOhms, setLoadReactanceOhms] = useState(-50);
  const [transformerSourceResistanceOhms, setTransformerSourceResistanceOhms] = useState(50);
  const [transformerLoadResistanceOhms, setTransformerLoadResistanceOhms] = useState(100);
  const [transformerVelocityFactor, setTransformerVelocityFactor] = useState(0.66);
  const [transformerTrimAllowancePercent, setTransformerTrimAllowancePercent] = useState(5);
  const [ratioSourceResistanceOhms, setRatioSourceResistanceOhms] = useState(50);
  const [ratioLoadResistanceOhms, setRatioLoadResistanceOhms] = useState(200);
  const [ratioSourceTurns, setRatioSourceTurns] = useState(3);
  const [ratioSourceConnection, setRatioSourceConnection] = useState<ConnectionForm>('unbalanced');
  const [ratioLoadConnection, setRatioLoadConnection] = useState<ConnectionForm>('balanced');
  const [feedSystemLossDb, setFeedSystemLossDb] = useState(1.8);
  const [antennaGainDb, setAntennaGainDb] = useState(2.15);
  const [gainReference, setGainReference] = useState<GainReference>('dBi');
  const [dutyCyclePercent, setDutyCyclePercent] = useState(50);
  const [antennaCentreHeightMetres, setAntennaCentreHeightMetres] = useState(10);
  const [antennaEastMetres, setAntennaEastMetres] = useState(0);
  const [antennaNorthMetres, setAntennaNorthMetres] = useState(0);
  const frequencyMHz = Number(frequencyText);
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';
  const cableLengthDisplay = unitSystem === 'metric' ? cableLengthMetres : metresToFeet(cableLengthMetres);
  const lossRateDisplay = unitSystem === 'metric' ? lossDbPer100Metres : lossDbPer100Metres * 0.3048;
  const antennaHeightDisplay = unitSystem === 'metric' ? antennaCentreHeightMetres : metresToFeet(antennaCentreHeightMetres);
  const antennaEastDisplay = unitSystem === 'metric' ? antennaEastMetres : metresToFeet(antennaEastMetres);
  const antennaNorthDisplay = unitSystem === 'metric' ? antennaNorthMetres : metresToFeet(antennaNorthMetres);

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

  const matchResult = useMemo(() => {
    try {
      return calculateLNetwork({ frequencyMHz, systemResistanceOhms, loadResistanceOhms, loadReactanceOhms });
    } catch {
      return null;
    }
  }, [frequencyMHz, loadReactanceOhms, loadResistanceOhms, systemResistanceOhms]);

  const transformerResult = useMemo(() => {
    try {
      return calculateQuarterWaveTransformer({
        frequencyMHz,
        sourceResistanceOhms: transformerSourceResistanceOhms,
        loadResistanceOhms: transformerLoadResistanceOhms,
        velocityFactor: transformerVelocityFactor,
        trimAllowancePercent: transformerTrimAllowancePercent
      });
    } catch {
      return null;
    }
  }, [frequencyMHz, transformerLoadResistanceOhms, transformerSourceResistanceOhms, transformerTrimAllowancePercent, transformerVelocityFactor]);

  const ratioResult = useMemo(() => {
    try {
      return calculateIdealTransformer({
        sourceResistanceOhms: ratioSourceResistanceOhms,
        loadResistanceOhms: ratioLoadResistanceOhms,
        sourceTurns: ratioSourceTurns,
        sourceConnection: ratioSourceConnection,
        loadConnection: ratioLoadConnection
      });
    } catch {
      return null;
    }
  }, [ratioLoadConnection, ratioLoadResistanceOhms, ratioSourceConnection, ratioSourceResistanceOhms, ratioSourceTurns]);

  const radiatedResult = useMemo(() => {
    try {
      return calculateRadiatedPower({ transmitterPowerWatts, feedSystemLossDb, antennaGainDb, gainReference });
    } catch {
      return null;
    }
  }, [antennaGainDb, feedSystemLossDb, gainReference, transmitterPowerWatts]);

  const result = mode === 'power' ? powerResult : mode === 'stub' ? stubResult : mode === 'match' ? matchResult : mode === 'transformer' ? transformerResult : mode === 'ratio' ? ratioResult : radiatedResult;
  const model = mode === 'power' ? FEEDLINE_MODEL : mode === 'stub' ? COAXIAL_STUB_MODEL : mode === 'match' ? L_NETWORK_MODEL : mode === 'transformer' ? QUARTER_WAVE_TRANSFORMER_MODEL : mode === 'ratio' ? IDEAL_TRANSFORMER_MODEL : RADIATED_POWER_MODEL;

  return <section className="workspace shell feedline-workspace" id="calculator" aria-labelledby="calculator-title" tabIndex={-1}>
    <div className="workspace-heading">
      <div><p className="eyebrow">Feedline and matching</p><h2 id="calculator-title">{mode === 'power' ? 'Feedline power budget' : mode === 'stub' ? 'Coaxial stub length' : mode === 'match' ? 'L-network matching' : mode === 'transformer' ? 'Quarter-wave transformer' : mode === 'ratio' ? 'Balun and unun ratio' : 'ERP and EIRP'}</h2></div>
      <span className="model-badge">Model {model.version}</span>
    </div>
    {antennaHandoff && <section className="linked-workflow" aria-labelledby="linked-antenna-heading"><div><p className="eyebrow">Linked antenna design</p><h3 id="linked-antenna-heading">{antennaHandoff.label}</h3><p>Frequency and largest physical dimension came from the antenna calculator. Complete the system and exposure-specific inputs below.</p></div><dl><div><dt>Frequency</dt><dd>{antennaHandoff.frequencyMHz.toFixed(3)} MHz</dd></div><div><dt>Largest dimension</dt><dd>{formatLength(antennaHandoff.largestDimensionMetres, unitSystem)}</dd></div><div><dt>Design model</dt><dd>{antennaHandoff.antennaModelId} {antennaHandoff.antennaModelVersion}</dd></div></dl></section>}
    <div className="feedline-mode-picker" aria-label="Feedline calculator">
      <button type="button" aria-pressed={mode === 'power'} onClick={() => setMode('power')}><strong>Power budget</strong><small>Loss, SWR, and accepted power</small></button>
      <button type="button" aria-pressed={mode === 'stub'} onClick={() => setMode('stub')}><strong>Coaxial stub</strong><small>Velocity factor and electrical length</small></button>
      <button type="button" aria-pressed={mode === 'match'} onClick={() => setMode('match')}><strong>L-network</strong><small>Measured complex load to system resistance</small></button>
      <button type="button" aria-pressed={mode === 'transformer'} onClick={() => setMode('transformer')}><strong>Quarter-wave transformer</strong><small>Real resistances through a 90° line</small></button>
      <button type="button" aria-pressed={mode === 'ratio'} onClick={() => setMode('ratio')}><strong>Balun / unun ratio</strong><small>Ideal impedance and integer turns</small></button>
      <button type="button" aria-pressed={mode === 'radiated'} onClick={() => setMode('radiated')}><strong>ERP / EIRP</strong><small>Loss, gain, and reference power</small></button>
    </div>
    <ResultEvidenceKey />
    {mode === 'power' && <StepByStepHelp title="Plan and verify a feedline budget" intro="Use this sequence to turn cable and accessory specifications into a traceable first-order power estimate. Experienced operators can leave the guide closed." steps={[
      { title: 'Fix the operating frequency', detail: 'Choose the actual frequency because cable attenuation changes with frequency and the calculator does not interpolate a data sheet.' },
      { title: 'Trace the complete cable path', detail: 'Measure every indoor, outdoor, mast, jumper, and service-loop section that contributes to the feedline length.' },
      { title: 'Find matched cable loss', detail: 'Use current manufacturer attenuation data for the exact cable type at or near the operating frequency, noting the stated temperature and units.' },
      { title: 'Account for every accessory', detail: 'Add documented insertion loss for switches, meters, filters, duplexers, connectors, adapters, and external tuners in the path.' },
      { title: 'Measure at the antenna reference plane', detail: 'Use forward power and SWR referred to the antenna end when possible; a lossy cable can make transmitter-end SWR appear better.' },
      { title: 'Verify the installed system', detail: 'Inspect connections and weatherproofing, measure the finished path, and check cable and accessory heating at the intended power and duty cycle.' }
    ]} limit="This is a scalar first-order budget. It does not simulate impedance along a transmission line, additional loss under high SWR, re-reflections, voltage and current maxima, component heating, or power rating." />}
    {mode === 'stub' && <StepByStepHelp title="Build and verify a coaxial stub" intro="Use this sequence to turn the ideal electrical length into a measured stub at one design frequency. Experienced builders can leave the guide closed." steps={[
      { title: 'Choose the exact design frequency', detail: 'Set the frequency where the finished stub must provide its intended transformation; behaviour changes away from that frequency.' },
      { title: 'Identify the actual cable', detail: 'Use the manufacturer velocity factor for the specific cable construction and, when precision matters, verify the sample being cut.' },
      { title: 'Choose length and termination', detail: 'Select quarter-wave or half-wave behaviour and decide whether the far end will be a dependable short circuit or a protected open circuit.' },
      { title: 'Cut long with connectors included', detail: 'Retain the trimming allowance and count connector bodies, adapters, and termination hardware as part of the electrical path.' },
      { title: 'Build the final termination', detail: 'Make the short mechanically low-inductance or keep the open end insulated, dry, stable, and safely clear of high RF voltage.' },
      { title: 'Calibrate, measure, and trim', detail: 'Move the analyser reference plane to the stub input, measure at the design frequency, and shorten in small steps with the final hardware attached.' }
    ]} limit="The result is an ideal lossless-line length at one frequency. It does not design a complete matching network or predict characteristic impedance, loss, bandwidth, power handling, connector parasitics, or installed interaction." />}
    {mode === 'match' && <StepByStepHelp title="Synthesize and verify an L-network" intro="Use this sequence to turn one measured complex load into candidate two-element networks at one frequency. Experienced builders can leave the guide closed." steps={[
      { title: 'Measure at the intended reference plane', detail: 'Calibrate the analyser to the exact point where the network will connect, with the antenna, feedline, return path, and surroundings in their final configuration.' },
      { title: 'Record resistance and signed reactance', detail: 'Enter the measured series-form R + jX value. Positive X is inductive; negative X is capacitive. Do not enter SWR in place of complex impedance.' },
      { title: 'Choose the required system resistance', detail: 'Use the real resistance the transmitter or feed system must see, commonly but not universally 50 ohms.' },
      { title: 'Review every valid topology', detail: 'The same load may permit two or four mathematical solutions. Component availability, harmonic behaviour, DC continuity, filtering needs, and physical layout can make one preferable.' },
      { title: 'Build compactly with suitable components', detail: 'Keep leads and ground paths short. Select capacitors and inductors for measured Q, self-resonance, voltage, current, heating, tolerance, and environmental stability.' },
      { title: 'Measure and tune the completed network', detail: 'Start at low power, sweep around the design frequency, adjust the real components, then verify loss, bandwidth, heating, voltage clearance, and stability at intended operating conditions.' }
    ]} limit="This is an ideal lossless lumped-element synthesis at one frequency. It does not predict bandwidth, harmonic response, component Q or parasitics, loss, voltage, current, heating, safe power, balance, common mode, or the effect of connecting the physical network." />}
    {mode === 'transformer' && <StepByStepHelp title="Build and verify a quarter-wave transformer" intro="Use this sequence to connect two unequal real resistances with one 90° transmission-line section at a chosen frequency. Experienced builders can leave the guide closed." steps={[
      { title: 'Measure both terminal impedances', detail: 'Calibrate at the intended connection planes and confirm that source and load are effectively real at the design frequency. This model cannot absorb load reactance.' },
      { title: 'Choose the exact design frequency', detail: 'The section is one electrical quarter wavelength only at this frequency; its transformation changes on either side.' },
      { title: 'Calculate the required line impedance', detail: 'The geometric mean of the two real resistances is the required characteristic impedance. Check whether that line can actually be built or purchased.' },
      { title: 'Use the actual velocity factor', detail: 'Enter data for the specific cable or transmission-line construction. A material preset is only a starting point.' },
      { title: 'Cut long with final hardware included', detail: 'Keep the trimming allowance and include connectors, transitions, bends, and exposed conductors in the electrical path.' },
      { title: 'Measure, trim, and test at low power', detail: 'Move the analyser reference plane to the completed input, trim in small steps, sweep around the design frequency, and verify loss, heating, voltage, and useful bandwidth.' }
    ]} limit="This is an ideal lossless single-section model for real terminal impedances at one frequency. It does not select an available cable, remove reactance, or predict loss, bandwidth, mismatch away from design, connector effects, voltage, current, heating, or safe power." />}
    {mode === 'ratio' && <StepByStepHelp title="Plan and verify a balun or unun" intro="Use this sequence to turn two real impedance targets into an ideal ratio and nearby integer winding options. It is a planning aid, not a magnetic-component design." steps={[
      { title: 'Define both reference planes', detail: 'Enter the real source and load resistances at the points where the transformer will connect. Reactive or frequency-dependent impedances require measurement or a broader matching model.' },
      { title: 'Identify balanced and unbalanced sides', detail: 'Classify each connection by its conductors and return path. A balance conversion is a balun; two unbalanced sides describe an unun in this planner.' },
      { title: 'Read the ideal ratios first', detail: 'Impedance ratio is the square of turns ratio. Keep ratio direction attached to the source and load labels instead of quoting an ambiguous number alone.' },
      { title: 'Choose a source-side turn count deliberately', detail: 'The entered integer only generates nearby load-side integers. It does not establish enough inductance, an appropriate core, or a practical winding.' },
      { title: 'Select a documented topology and materials', detail: 'Choose current or voltage behaviour, autotransformer or isolated construction, core mix and size, wire, insulation, winding arrangement, enclosure, and grounding for the actual frequency, power, and environment.' },
      { title: 'Measure the completed device', detail: 'Use suitable fixtures to check transformation, insertion loss, return loss, balance or common-mode impedance, heating, and useful bandwidth before connecting the intended transmitter and antenna.' }
    ]} limit="The winding options are ideal two-winding arithmetic only. They do not design an autotransformer or transmission-line transformer, select a core, determine minimum turns, or predict inductance, flux density, loss, balance, isolation, common-mode impedance, bandwidth, voltage, current, heating, or safe power." />}
    {mode === 'radiated' && <StepByStepHelp title="Calculate and document ERP / EIRP" intro="Use this sequence to keep transmitter power, feed-system loss, antenna gain, and exposure assumptions traceable. Experienced operators can leave the guide closed." steps={[
      { title: 'Define the transmitter power', detail: 'Use power at the input to the documented feed system and identify whether the source value is peak-envelope, carrier, or another quantity required by the intended use.' },
      { title: 'Document feed-system loss', detail: 'Combine supported losses for cable, connectors, switches, filters, duplexers, and other components at the operating frequency and conditions.' },
      { title: 'Choose gain in the evaluated direction', detail: 'Use antenna gain, including efficiency, for the direction being assessed; conservative exposure work commonly requires maximum gain unless its method says otherwise.' },
      { title: 'Confirm the gain reference', detail: 'Identify whether the source states dBi or dBd before entering the number. Do not change the selector as though it converts an unchanged numeric value.' },
      { title: 'Review both equivalent powers', detail: 'Read EIRP relative to isotropic and ERP relative to a half-wave dipole, keeping the stated reference with every copied or exported value.' },
      { title: 'Transfer exposure assumptions separately', detail: 'For a linked station source, record duty cycle and installed geometry independently; duty cycle is not applied to the displayed ERP or EIRP.' }
    ]} limit="ERP and EIRP are directional equivalent-power quantities. This calculator does not determine total radiated power, antenna pattern, near-field behaviour, time averaging, measurement uncertainty, or regulatory compliance." />}
    <div className="calculator-layout">
      <form key={mode} className="input-panel" onSubmit={(event) => event.preventDefault()}>
        {mode !== 'ratio' && <><label className="field">
          <span>Amateur band</span>
          <select className="band-select" value={activeBand?.id ?? 'custom'} disabled={Boolean(antennaHandoff)} onChange={(event) => {
            const band = availableBands.find((candidate) => candidate.id === event.target.value);
            if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1));
          }}>
            <option value="custom">Custom frequency</option>
            {availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}
          </select>
          <small>{antennaHandoff ? 'Locked to the linked antenna geometry; return to the antenna calculator to change it.' : mode === 'match' ? 'The measured complex load and synthesized component values apply only at this frequency.' : mode === 'transformer' ? 'The line is exactly 90° and provides the ideal transformation only at this frequency.' : 'Use a cable loss specification measured at, or near, this operating frequency.'}</small>
        </label>
        <PowerField label="Operating frequency" value={frequencyText} unit="MHz" min={0.001} step={0.001} readOnly={Boolean(antennaHandoff)} onChange={setFrequencyText} help={antennaHandoff ? 'This frequency remains linked to the transferred construction geometry.' : mode === 'match' ? 'Component values are synthesized for this single frequency.' : mode === 'transformer' ? 'The transformer section is 90° at this single design frequency.' : 'Frequency records which manufacturer attenuation value applies; it does not rescale that value automatically.'} /></>}
        {mode === 'power' ? <>
          <PowerField label="Transmitter power" value={transmitterPowerWatts} unit="W" min={0.001} step={1} onChange={(value) => setTransmitterPowerWatts(Number(value))} help="Use the forward power entering the accessories and feedline." />
          <PowerField label="Cable length" value={Number(cableLengthDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'm' : 'ft'} min={0} step={0.1} onChange={(value) => setCableLengthMetres(unitSystem === 'metric' ? Number(value) : feetToMetres(Number(value)))} help="Include the complete cable path, including indoor and mast runs." />
          <PowerField label="Published matched cable loss" tooltip="Enter the manufacturer's matched-line attenuation for the exact cable type, stated per 100 metres or 100 feet at or near the operating frequency. The calculator does not select or interpolate a specification, and real loss changes with frequency, temperature, ageing, moisture, and mismatch." value={Number(lossRateDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'dB/100 m' : 'dB/100 ft'} min={0} step={0.01} onChange={(value) => setLossDbPer100Metres(unitSystem === 'metric' ? Number(value) : Number(value) / 0.3048)} help="Copy the loss from the cable manufacturer's data at the selected frequency and temperature." />
          <PowerField label="Accessory insertion loss" value={accessoryLossDb} unit="dB" min={0} step={0.1} onChange={(value) => setAccessoryLossDb(Number(value))} help="Combine known losses from switches, meters, filters, connectors, and external tuners." />
          <PowerField label="SWR at the antenna" tooltip="Use SWR referred to the antenna feedpoint when possible. Cable attenuation can make transmitter-end SWR look lower than the load-end value. SWR gives the magnitude of mismatch only; it does not identify resistance, reactance, or phase." value={swr} unit=": 1" min={1} step={0.01} onChange={(value) => setSwr(Number(value))} help="SWR alone does not reveal whether the impedance is high, low, inductive, or capacitive." />
        </> : mode === 'stub' ? <>
          <label className="field"><span>Common dielectric preset</span><select value={velocityFactor} onChange={(event) => setVelocityFactor(Number(event.target.value))}><option value={0.66}>Solid polyethylene · 0.66</option><option value={0.7}>PTFE · 0.70</option><option value={0.8}>Foam polyethylene · 0.80</option><option value={0.85}>Low-density foam · 0.85</option></select><small>Use the cable manufacturer's measured value when available; cable construction varies.</small></label>
          <PowerField label="Velocity factor" tooltip="Velocity factor is the propagation speed in this transmission line relative to free space. Use data for the specific cable construction rather than treating a dielectric preset as universal; manufacturing tolerance, ageing, and connectors can shift the measured electrical length." value={velocityFactor} unit="ratio" min={0.01} max={1} step={0.01} onChange={(value) => setVelocityFactor(Number(value))} help="Propagation speed in the cable divided by the speed of light in vacuum." />
          <div className="field"><span className="field-label-with-help"><label htmlFor="stub-electrical-length">Electrical length</label><HelpTip label="Electrical length">A quarter-wave line is 90° and reverses ideal open- and short-circuit behaviour at its design frequency. A half-wave line is 180° and repeats the far-end termination. Neither choice describes useful bandwidth away from that frequency.</HelpTip></span><select id="stub-electrical-length" value={stubFraction} onChange={(event) => setStubFraction(Number(event.target.value) as StubFraction)}><option value={0.25}>Quarter wavelength · 90°</option><option value={0.5}>Half wavelength · 180°</option></select><small>Electrical length is specified at the selected design frequency.</small></div>
          <div className="field"><span className="field-label-with-help"><label htmlFor="stub-termination">Far-end termination</label><HelpTip label="Far-end termination">The result assumes an ideal short or open. Real shorts have inductance, open ends have fringing capacitance, and connector or enclosure geometry shifts the response. Open stubs can develop high RF voltage.</HelpTip></span><select id="stub-termination" value={stubTermination} onChange={(event) => setStubTermination(event.target.value as StubTermination)}><option value="short">Shorted</option><option value="open">Open</option></select><small>The ideal input behaviour reverses at a quarter wavelength and repeats at a half wavelength.</small></div>
          <PowerField label="Extra length for trimming" tooltip="This allowance is added beyond the ideal calculated cable length. Keep the final connector and termination hardware attached while measuring because the analyser reference plane and every conductor in the path contribute to electrical length." value={stubTrimAllowancePercent} unit="%" min={0} max={25} step={0.5} onChange={(value) => setStubTrimAllowancePercent(Number(value))} help="Added to the ideal physical length; connectors are part of the electrical length." />
        </> : mode === 'match' ? <>
          <PowerField label="System resistance" tooltip="Enter the real impedance the network input should present at the design frequency. This is commonly 50 Ω in amateur systems but may differ. The model assumes no source reactance." value={systemResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setSystemResistanceOhms(Number(value))} help="Required real input impedance at the network source side." />
          <PowerField label="Measured load resistance" tooltip="Enter the real part R of the series-form load impedance measured at the intended network connection plane. Resistance must be positive." value={loadResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setLoadResistanceOhms(Number(value))} help="The R term in the measured R + jX load." />
          <PowerField label="Measured load reactance" tooltip="Enter the signed series reactance X from the analyser. Positive reactance is inductive (+jX); negative reactance is capacitive (−jX)." value={loadReactanceOhms} unit="Ω" min={-1_000_000} max={1_000_000} step={0.1} onChange={(value) => setLoadReactanceOhms(Number(value))} help="Use a positive value for inductive reactance and a negative value for capacitive reactance." />
        </> : mode === 'transformer' ? <>
          <PowerField label="Source resistance" tooltip="Enter the real resistance the transformer input must present at the design frequency. Any source reactance must be handled separately." value={transformerSourceResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setTransformerSourceResistanceOhms(Number(value))} help="Required real input resistance on the system side; j0 is assumed." />
          <PowerField label="Load resistance" tooltip="Enter the positive real load resistance measured at the transformer's load-side reference plane. If the measured impedance includes reactance, tune it out or use a method that accepts complex impedance." value={transformerLoadResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setTransformerLoadResistanceOhms(Number(value))} help="Measured real load resistance at the design frequency; j0 is required." />
          <label className="field"><span>Common dielectric preset</span><select value={transformerVelocityFactor} onChange={(event) => setTransformerVelocityFactor(Number(event.target.value))}><option value={0.66}>Solid polyethylene · 0.66</option><option value={0.7}>PTFE · 0.70</option><option value={0.8}>Foam polyethylene · 0.80</option><option value={0.85}>Low-density foam · 0.85</option><option value={1}>Air or ideal open line · 1.00</option></select><small>Use measured or manufacturer data for the line construction you will actually build.</small></label>
          <PowerField label="Transformer velocity factor" tooltip="Velocity factor sets the physical length of the 90° section, not its required characteristic impedance. Use data for the specific cable, parallel line, or fabricated line." value={transformerVelocityFactor} unit="ratio" min={0.01} max={1} step={0.01} onChange={(value) => setTransformerVelocityFactor(Number(value))} help="Propagation speed in the transformer section divided by the speed of light." />
          <PowerField label="Extra length for transformer trimming" tooltip="This allowance is added beyond the ideal physical quarter wavelength. Final connectors, transitions, exposed conductors, and analyser reference planes all contribute to electrical length." value={transformerTrimAllowancePercent} unit="%" min={0} max={25} step={0.5} onChange={(value) => setTransformerTrimAllowancePercent(Number(value))} help="Added to the ideal length so the completed section can be measured and shortened." />
        </> : mode === 'ratio' ? <>
          <PowerField label="Source resistance for ratio" tooltip="Enter the positive real resistance on the source side of the ideal transformer. The calculator does not accept or cancel source reactance." value={ratioSourceResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setRatioSourceResistanceOhms(Number(value))} help="Real source-side resistance at the intended connection plane." />
          <PowerField label="Load resistance for ratio" tooltip="Enter the positive real resistance connected to the load winding. Real antennas are often reactive and frequency-dependent, so use a deliberate measured or modelled value." value={ratioLoadResistanceOhms} unit="Ω" min={0.01} max={1_000_000} step={0.1} onChange={(value) => setRatioLoadResistanceOhms(Number(value))} help="Real load-side resistance used only for ideal ratio arithmetic." />
          <PowerField label="Chosen source-side turns" tooltip="This integer sets the scale for adjacent load-side integer options. It is not a calculated minimum and says nothing about magnetizing inductance, core flux, loss, heating, or bandwidth." value={ratioSourceTurns} unit="turns" min={1} max={100} step={1} onChange={(value) => setRatioSourceTurns(Number(value))} help="Choose only after selecting an appropriate topology and magnetic design method." />
          <div className="field"><span className="field-label-with-help"><label htmlFor="ratio-source-connection">Source-side connection</label><HelpTip label="Source-side connection">Balanced means neither conductor is intentionally the RF return or ground. Unbalanced means one conductor is associated with the shield, chassis, or return. The physical topology must enforce the intended behaviour.</HelpTip></span><select id="ratio-source-connection" value={ratioSourceConnection} onChange={(event) => setRatioSourceConnection(event.target.value as ConnectionForm)}><option value="unbalanced">Unbalanced</option><option value="balanced">Balanced</option></select><small>Describe the electrical connection at the source reference plane.</small></div>
          <div className="field"><span className="field-label-with-help"><label htmlFor="ratio-load-connection">Load-side connection</label><HelpTip label="Load-side connection">Changing balance class changes whether the conceptual device is labelled a balun, unun, or balanced transformer. It does not choose current versus voltage behaviour or prove balance.</HelpTip></span><select id="ratio-load-connection" value={ratioLoadConnection} onChange={(event) => setRatioLoadConnection(event.target.value as ConnectionForm)}><option value="balanced">Balanced</option><option value="unbalanced">Unbalanced</option></select><small>Describe the electrical connection at the load reference plane.</small></div>
        </> : <>
          <PowerField label="Transmitter power" tooltip="Enter power at the input to the feed system represented below. Record whether the value is peak-envelope, carrier, average, or another defined quantity; the calculator cannot infer or convert that definition." value={transmitterPowerWatts} unit="W" min={0.001} step={1} onChange={(value) => setTransmitterPowerWatts(Number(value))} help="Use power before the feedline and accessories. For time-averaged exposure work, use the power definition required by the applicable method." />
          <PowerField label="Total feed-system loss" tooltip="Combine documented insertion losses between the stated transmitter-power reference plane and the antenna input. Use values at the operating frequency and relevant conditions; do not include antenna inefficiency here when the stated antenna gain already includes it." value={feedSystemLossDb} unit="dB" min={0} max={100} step={0.1} onChange={(value) => setFeedSystemLossDb(Number(value))} help="Combine feeder, connector, switch, filter, duplexer, and other insertion losses before the antenna." />
          <PowerField label="Antenna gain" tooltip="Enter gain in the direction being evaluated, not directivity unless efficiency has been accounted for. For conservative exposure screening, use maximum directional gain unless the applicable method explicitly supports another value." value={antennaGainDb} unit={gainReference} min={-100} max={100} step={0.1} onChange={(value) => setAntennaGainDb(Number(value))} help="Use gain in the direction being evaluated, including antenna efficiency, and select its stated reference." />
          <div className="field"><span className="field-label-with-help"><label htmlFor="radiated-gain-reference">Gain reference</label><HelpTip label="Gain reference">dBi states gain relative to an isotropic radiator; dBd states gain relative to a half-wave dipole. For the same antenna, the dBi number is 2.15 dB greater. Changing this selector reinterprets the entered number rather than converting it.</HelpTip></span><select id="radiated-gain-reference" value={gainReference} onChange={(event) => setGainReference(event.target.value as GainReference)}><option value="dBi">dBi · isotropic reference</option><option value="dBd">dBd · half-wave dipole reference</option></select><small>Changing the reference reinterprets the entered gain; it does not silently convert the numeric field.</small></div>
          {antennaHandoff && <>
            <PowerField label="Exposure duty cycle" tooltip="Enter the transmit-time percentage required by the applicable exposure averaging method. It is transferred as a separate station-project input and is not applied to the displayed ERP or EIRP." value={dutyCyclePercent} unit="%" min={0.01} max={100} step={0.1} onChange={(value) => setDutyCyclePercent(Number(value))} help="Enter the applicable time-averaged transmit duty cycle; it is not inferred from mode or operating habits." />
            <PowerField label="Installed antenna centre height" tooltip="Measure to the radiation centre used by the station-project point-source geometry, using the same vertical datum as every accessible evaluation-point height. This is not automatically the mast or antenna-tip height." value={Number(antennaHeightDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'm' : 'ft'} min={0} step={0.1} onChange={(value) => setAntennaCentreHeightMetres(unitSystem === 'metric' ? Number(value) : feetToMetres(Number(value)))} help="Measure to the antenna radiation centre used for station-project geometry." />
            <PowerField label="Installed antenna east position" value={Number(antennaEastDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'm' : 'ft'} min={-1_000_000} max={1_000_000} step={0.1} onChange={(value) => setAntennaEastMetres(unitSystem === 'metric' ? Number(value) : feetToMetres(Number(value)))} help="Enter an east-positive coordinate relative to a convenient site origin." />
            <PowerField label="Installed antenna north position" value={Number(antennaNorthDisplay.toFixed(3))} unit={unitSystem === 'metric' ? 'm' : 'ft'} min={-1_000_000} max={1_000_000} step={0.1} onChange={(value) => setAntennaNorthMetres(unitSystem === 'metric' ? Number(value) : feetToMetres(Number(value)))} help="Enter a north-positive coordinate using the same site origin as evaluation points." />
          </>}
        </>}
        {!result && <p className="validation-message" role="alert">Enter values within the displayed limits to calculate the {mode === 'power' ? 'budget' : mode === 'stub' ? 'stub' : mode === 'match' ? 'matching network' : mode === 'transformer' ? 'quarter-wave transformer' : mode === 'ratio' ? 'ideal transformer ratio' : 'radiated power'}.</p>}
        {mode === 'power' && powerResult && <EvidenceResultSummary headline="Forward power at antenna feedpoint" primary={`${powerResult.forwardPowerAtAntennaWatts.toFixed(2)} W`} primaryKind="calculated" items={[
          { term: 'Accepted by load', value: `${powerResult.acceptedPowerWatts.toFixed(2)} W`, kind: 'calculated' },
          { term: 'Cable loss', value: `${powerResult.cableLossDb.toFixed(2)} dB`, kind: 'calculated' },
          { term: 'Return loss', value: Number.isFinite(powerResult.returnLossDb) ? `${powerResult.returnLossDb.toFixed(2)} dB` : '∞ dB', kind: 'calculated' },
          { term: 'Reflected power', value: `${powerResult.reflectedPowerPercent.toFixed(1)}%`, kind: 'calculated' }
        ]} />}
        {mode === 'stub' && stubResult && <EvidenceResultSummary headline="Start with this cut length" primary={formatLength(stubResult.cutLengthMetres, unitSystem)} primaryKind="calculated" items={[
          { term: 'Ideal physical length', value: formatLength(stubResult.physicalLengthMetres, unitSystem), kind: 'calculated' },
          { term: 'Guided wavelength', value: formatLength(stubResult.guidedWavelengthMetres, unitSystem), kind: 'calculated' },
          { term: 'Electrical length', value: `${stubResult.electricalLengthDegrees}°`, kind: 'calculated' },
          { term: 'One-way delay', value: `${stubResult.oneWayDelayNanoseconds.toFixed(3)} ns`, kind: 'calculated' },
          { term: 'Ideal input behaviour', value: stubResult.inputImpedanceBehavior === 'high' ? 'High impedance' : 'Low impedance', kind: 'calculated' },
          { term: 'Finished resonant length', value: 'Verify with final connectors and termination attached', kind: 'measure' }
        ]} />}
        {mode === 'match' && matchResult && <EvidenceResultSummary headline="Ideal L-network solutions" primary={`${matchResult.solutions.length} ${matchResult.solutions.length === 1 ? 'option' : 'options'}`} primaryKind="calculated" items={[
          { term: 'Measured load', value: `${loadResistanceOhms.toFixed(2)} ${loadReactanceOhms < 0 ? '−' : '+'} j${Math.abs(loadReactanceOhms).toFixed(2)} Ω`, kind: 'measure' },
          { term: 'Required ideal input', value: `${systemResistanceOhms.toFixed(2)} + j0 Ω`, kind: 'assumption' },
          { term: 'Finished network input', value: 'Measure after construction at the same reference plane', kind: 'measure' },
          { term: 'Loss, bandwidth, and safe power', value: 'Not inferred · verify the physical network', kind: 'measure' }
        ]} />}
        {mode === 'transformer' && transformerResult && <EvidenceResultSummary headline="Required line characteristic impedance" primary={`${transformerResult.requiredCharacteristicImpedanceOhms.toFixed(2)} Ω`} primaryKind="calculated" items={[
          { term: 'Start with this cut length', value: formatLength(transformerResult.cutLengthMetres, unitSystem), kind: 'calculated' },
          { term: 'Ideal physical quarter wavelength', value: formatLength(transformerResult.physicalQuarterWaveMetres, unitSystem), kind: 'calculated' },
          { term: 'Ideal input check', value: `${transformerResult.idealInputResistanceOhms.toFixed(3)} + j0 Ω`, kind: 'calculated' },
          { term: 'Terminal impedances', value: `${transformerSourceResistanceOhms.toFixed(2)} Ω source · ${transformerLoadResistanceOhms.toFixed(2)} Ω load · both real`, kind: 'assumption' },
          { term: 'Available line and finished response', value: 'Select or fabricate, then measure with final hardware', kind: 'measure' },
          { term: 'Loss, bandwidth, and safe power', value: 'Not inferred · verify the physical transformer', kind: 'measure' }
        ]} />}
        {mode === 'ratio' && ratioResult && <EvidenceResultSummary headline={`Ideal ${ratioResult.deviceClass} impedance ratio · source to load`} primary={`1 : ${ratioResult.idealImpedanceRatioLoadToSource.toFixed(3)}`} primaryKind="calculated" items={[
          { term: 'Ideal turns ratio · source to load', value: `1 : ${ratioResult.idealTurnsRatioLoadToSource.toFixed(3)}`, kind: 'calculated' },
          { term: 'Exact load-side turns at chosen scale', value: `${ratioResult.exactLoadTurns.toFixed(3)} turns for ${ratioSourceTurns} source turns`, kind: 'calculated' },
          { term: 'Closest integer winding pair', value: `${ratioSourceTurns}:${ratioResult.candidates[0].loadTurns} turns · ${ratioResult.candidates[0].reflectedInputResistanceOhms.toFixed(2)} Ω reflected input`, kind: 'calculated' },
          { term: 'Terminal resistances', value: `${ratioSourceResistanceOhms.toFixed(2)} Ω source · ${ratioLoadResistanceOhms.toFixed(2)} Ω load · both real`, kind: 'assumption' },
          { term: 'Finished transformation and balance', value: 'Measure with suitable fixtures across the intended band', kind: 'measure' },
          { term: 'Core, loss, bandwidth, and safe power', value: 'Not inferred · complete a physical transformer design', kind: 'measure' }
        ]} />}
        {mode === 'radiated' && radiatedResult && <EvidenceResultSummary headline="Equivalent isotropically radiated power" primary={formatWatts(radiatedResult.eirpWatts)} primaryKind="calculated" items={[
          { term: 'Effective radiated power', value: formatWatts(radiatedResult.erpWatts), kind: 'calculated' },
          { term: 'Power supplied to antenna', value: formatWatts(radiatedResult.antennaInputPowerWatts), kind: 'calculated' },
          { term: 'Converted antenna gain', value: `${radiatedResult.antennaGainDbi.toFixed(2)} dBi · ${radiatedResult.antennaGainDbd.toFixed(2)} dBd`, kind: 'calculated' },
          { term: 'EIRP', value: `${radiatedResult.eirpDbw.toFixed(2)} dBW · ${radiatedResult.eirpDbm.toFixed(2)} dBm`, kind: 'calculated' },
          { term: 'Feed-system efficiency', value: `${radiatedResult.feedSystemEfficiencyPercent.toFixed(1)}%`, kind: 'calculated' }
        ]} />}
        {mode === 'radiated' && radiatedResult && antennaHandoff && <div className="workflow-submit"><p><strong>Ready to add this source</strong><span>The station project receives the source power, loss, gain, duty cycle, and installed geometry as separate inputs and marks its source inventory incomplete.</span></p><button type="button" onClick={() => onAddToExposure(createStationSourceTransfer(
          globalThis.crypto?.randomUUID?.() ?? `source-transfer-${Date.now()}`,
          antennaHandoff,
          {
            transmitterPowerWatts,
            dutyCyclePercent,
            feedSystemLossDb,
            antennaGainDbi: radiatedResult.antennaGainDbi,
            antennaCentreHeightMetres,
            eastOffsetMetres: antennaEastMetres,
            northOffsetMetres: antennaNorthMetres,
            feedSystemModelId: RADIATED_POWER_MODEL.id,
            feedSystemModelVersion: RADIATED_POWER_MODEL.version
          }
        ))}>Add to station project</button></div>}
      </form>
      <div className="visual-panel">{mode === 'power' ? powerResult ? <FeedlineDiagram result={powerResult} transmitterPowerWatts={transmitterPowerWatts} cableLengthLabel={formatLength(cableLengthMetres, unitSystem)} /> : <div className="diagram-placeholder">The power-flow diagram will appear when the inputs are valid.</div> : mode === 'stub' ? stubResult ? <CoaxialStubDiagram result={stubResult} termination={stubTermination} unitSystem={unitSystem} /> : <div className="diagram-placeholder">The coaxial-stub diagram will appear when the inputs are valid.</div> : mode === 'match' ? matchResult ? <LNetworkDiagram solutions={matchResult.solutions} /> : <div className="diagram-placeholder">The L-network options will appear when the measured load is valid.</div> : mode === 'transformer' ? transformerResult ? <QuarterWaveTransformerDiagram result={transformerResult} unitSystem={unitSystem} /> : <div className="diagram-placeholder">The quarter-wave transformer will appear when the terminal resistances and line data are valid.</div> : mode === 'ratio' ? ratioResult ? <IdealTransformerDiagram result={ratioResult} /> : <div className="diagram-placeholder">The ideal transformer ratio will appear when the terminal resistances and turn count are valid.</div> : radiatedResult ? <RadiatedPowerDiagram result={radiatedResult} transmitterPowerWatts={transmitterPowerWatts} feedSystemLossDb={feedSystemLossDb} antennaGainDb={antennaGainDb} gainReference={gainReference} /> : <div className="diagram-placeholder">The ERP/EIRP diagram will appear when the inputs are valid.</div>}</div>
    </div>

    {mode !== 'ratio' && <><BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
    <p className="allocation-note">Band context for {jurisdictionName}. {mode === 'power' ? 'The calculator does not select a cable specification for you; use current manufacturer data.' : mode === 'stub' ? 'Velocity factor and physical length depend on the actual cable and connectors; confirm the finished stub by measurement.' : mode === 'match' ? 'The load must be measured at the design frequency and intended connection plane; remeasure the completed network.' : mode === 'transformer' ? 'Both terminal impedances must be real at the design frequency, and the required line impedance must be sourced or fabricated; verify the completed section by measurement.' : 'ERP and EIRP use maximum directional antenna gain and are not a substitute for jurisdiction-specific exposure evaluation.'}{bandSource && <> Allocation source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p></>}
    {mode === 'ratio' && <p className="allocation-note">Ideal ratio arithmetic has no frequency input. Every physical balun, unun, or transformer is frequency-dependent; choose its core, topology, winding, and test range for the intended bands before construction.</p>}

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
    {mode === 'match' && matchResult && <div className="explanation-grid">
      <article><p className="eyebrow">Complex load</p><h3>Resistance and reactance both matter</h3><p className="formula">Zload = R + jX</p><p>The entered load is {loadResistanceOhms.toFixed(2)} {loadReactanceOhms < 0 ? '−' : '+'} j{Math.abs(loadReactanceOhms).toFixed(2)} Ω at {frequencyMHz.toFixed(3)} MHz. The synthesis adds one ideal series reactance and one ideal shunt susceptance so the input resolves to {systemResistanceOhms.toFixed(2)} + j0 Ω.</p></article>
      <article><p className="eyebrow">Candidate networks</p><h3>Topology is part of the result</h3><p>The shunt element can be on the source side or load side when the impedance geometry permits it. Opposite-sign mathematical roots produce different L/C combinations, and some complex loads permit both placements. These options can behave differently away from the design frequency.</p></article>
      <article className="caution-card"><p className="eyebrow">Physical implementation</p><h3>Ideal values are not component ratings</h3><p>Real inductors and capacitors have tolerance, Q, loss, self-resonance, parasitic reactance, voltage and current limits, and temperature dependence. Leads, enclosure, ground path, connectors, balance, common-mode current, and the act of connecting the network can change the measured load. Build compactly, tune at low power, and verify heating and voltage clearance at intended power.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {L_NETWORK_MODEL.version}</h3><p>The calculator solves the standard lossless two-reactance L-network equations in both source-to-load orders, converts the resulting reactance or susceptance to an ideal L or C at the entered frequency, and independently recomputes each input impedance.</p><ul>{L_NETWORK_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {L_NETWORK_MODEL.id} · Reviewed {L_NETWORK_MODEL.reviewedOn}</small></article>
    </div>}
    {mode === 'transformer' && transformerResult && <div className="explanation-grid">
      <article><p className="eyebrow">Impedance transformation</p><h3>The line impedance is the geometric mean</h3><p className="formula">Z₀ = √(Rsource × Rload)</p><p>A {transformerResult.requiredCharacteristicImpedanceOhms.toFixed(2)} Ω lossless 90° section terminated in {transformerLoadResistanceOhms.toFixed(2)} Ω presents {transformerResult.idealInputResistanceOhms.toFixed(3)} Ω at its input. This equality applies to real terminal impedances at {frequencyMHz.toFixed(3)} MHz.</p></article>
      <article><p className="eyebrow">Electrical and physical length</p><h3>Velocity factor sets the cut length</h3><p className="formula">L = (c ÷ f) × VF ÷ 4</p><p>The free-space wavelength is {formatLength(transformerResult.freeSpaceWavelengthMetres, unitSystem)}. Velocity factor {transformerVelocityFactor.toFixed(2)} makes the ideal physical section {formatLength(transformerResult.physicalQuarterWaveMetres, unitSystem)}, before the {transformerTrimAllowancePercent.toFixed(1)}% trimming allowance.</p></article>
      <article className="caution-card"><p className="eyebrow">Real-world implementation</p><h3>A calculated Z₀ may not be available</h3><p>Commercial cable impedances are limited, while fabricated coaxial, parallel-wire, stripline, or microstrip sections need separate geometry and material design. Transitions, connectors, bends, conductor dimensions, dielectric tolerance, weather, nearby objects, and residual terminal reactance alter the result. Measure the actual line, trim at low power, then verify useful bandwidth, loss, heating, and voltage clearance.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {QUARTER_WAVE_TRANSFORMER_MODEL.version}</h3><p>The calculator uses the standard lossless quarter-wave relationship Zin = Z₀² ÷ Rload, selects Z₀ as the geometric mean of two positive real resistances, and applies velocity factor only to physical length. It does not synthesize a multisection transformer or a line geometry.</p><ul>{QUARTER_WAVE_TRANSFORMER_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {QUARTER_WAVE_TRANSFORMER_MODEL.id} · Reviewed {QUARTER_WAVE_TRANSFORMER_MODEL.reviewedOn}</small></article>
    </div>}
    {mode === 'ratio' && ratioResult && <div className="explanation-grid">
      <article><p className="eyebrow">Ideal transformer relationship</p><h3>Impedance ratio is turns ratio squared</h3><p className="formula">Zload ÷ Zsource = (Nload ÷ Nsource)²</p><p>The requested {ratioLoadResistanceOhms.toFixed(2)} Ω to {ratioSourceResistanceOhms.toFixed(2)} Ω relationship is an impedance ratio of 1:{ratioResult.idealImpedanceRatioLoadToSource.toFixed(3)} and therefore an ideal turns ratio of 1:{ratioResult.idealTurnsRatioLoadToSource.toFixed(3)}, stated from source to load.</p></article>
      <article><p className="eyebrow">Integer winding options</p><h3>Rounding changes the reflected resistance</h3><p>With {ratioSourceTurns} chosen source-side turns, the exact load-side target is {ratioResult.exactLoadTurns.toFixed(3)} turns. The diagram compares the adjacent usable integers and recomputes the ideal reflected input resistance and SWR for each; it does not decide how many turns the core requires.</p></article>
      <article className="caution-card"><p className="eyebrow">Physical design boundary</p><h3>A ratio is not a balun design</h3><p>Balance conversion, common-mode impedance, galvanic isolation, current or voltage behaviour, autotransformer connections, transmission-line effects, core mix and area, winding inductance, leakage, capacitance, flux density, wire insulation, loss, heating, and weatherproofing all depend on the selected physical design. Use a documented construction for the intended frequency and power, then verify it with suitable fixtures.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {IDEAL_TRANSFORMER_MODEL.version}</h3><p>The calculator applies ideal two-winding turns and impedance relationships, then independently reflects the load through each adjacent integer turns ratio. Balanced and unbalanced selectors classify the connection only; they do not prove electrical balance or prescribe a winding topology.</p><ul>{IDEAL_TRANSFORMER_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {IDEAL_TRANSFORMER_MODEL.id} · Reviewed {IDEAL_TRANSFORMER_MODEL.reviewedOn}</small></article>
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

function PowerField({ label, value, unit, min, max, step, help, tooltip, readOnly = false, onChange }: { label: string; value: string | number; unit: string; min: number; max?: number; step: number; help: string; tooltip?: ReactNode; readOnly?: boolean; onChange: (value: string) => void }) {
  const inputId = useId();
  return <div className="field"><span className={tooltip ? 'field-label-with-help' : undefined}><label htmlFor={inputId}>{label}</label>{tooltip && <HelpTip label={label}>{tooltip}</HelpTip>}</span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} /><span>{unit}</span></span><small>{help}</small></div>;
}
