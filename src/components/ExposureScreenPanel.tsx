/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import {
  calculateExposureScreen,
  EXPOSURE_SCREEN_MODEL,
  type ExposureScreenResult
} from '../calculators/exposureScreen';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';
import { ExposureScreenDiagram } from './ExposureScreenDiagram';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { ValidatedNumberField } from './ValidatedNumberField';

interface Props {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  frequencyMHz: number;
  unitSystem: UnitSystem;
}

const statusContent = {
  'below-screening-trigger': {
    title: 'Below the preliminary screening trigger',
    detail: 'The modelled single-source far-field level is below the selected review trigger. This is not a compliance determination.'
  },
  'further-analysis-required': {
    title: 'Further analysis is required',
    detail: 'The modelled level reaches the screening trigger. Use a detailed calculation, measurement, or appropriate mitigation.'
  },
  'screening-inconclusive': {
    title: 'Screening is inconclusive',
    detail: 'Nearby and co-located RF sources have not been assessed, so the total exposure ratio is unknown.'
  },
  'method-inapplicable': {
    title: 'Far-field method is inapplicable here',
    detail: 'The person is inside the application’s stricter far-field guard. A suitable near-field method or measurement is required.'
  }
} as const;

function formatPower(watts: number) {
  return watts >= 1000 ? `${(watts / 1000).toFixed(2)} kW` : `${watts.toFixed(watts < 10 ? 2 : 1)} W`;
}

export function ExposureScreenPanel({ jurisdiction, environment, frequencyMHz, unitSystem }: Props) {
  const [transmitterPowerWatts, setTransmitterPowerWatts] = useState(100);
  const [dutyCyclePercent, setDutyCyclePercent] = useState(50);
  const [feedSystemLossDb, setFeedSystemLossDb] = useState(1);
  const [antennaGainDbi, setAntennaGainDbi] = useState(2.15);
  const [antennaDimensionMetres, setAntennaDimensionMetres] = useState(10.56);
  const [separationMetres, setSeparationMetres] = useState(20);
  const [nearbySourcesAssessed, setNearbySourcesAssessed] = useState(false);

  const result = useMemo<ExposureScreenResult | null>(() => {
    try {
      return calculateExposureScreen({
        jurisdiction,
        environment,
        frequencyMHz,
        transmitterPowerWatts,
        dutyCyclePercent,
        feedSystemLossDb,
        antennaGainDbi,
        antennaLargestDimensionMetres: antennaDimensionMetres,
        separationDistanceMetres: separationMetres,
        nearbySourcesAssessed
      });
    } catch {
      return null;
    }
  }, [jurisdiction, environment, frequencyMHz, transmitterPowerWatts, dutyCyclePercent, feedSystemLossDb, antennaGainDbi, antennaDimensionMetres, separationMetres, nearbySourcesAssessed]);

  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const displayLength = (metres: number) => unitSystem === 'metric' ? metres : metresToFeet(metres);
  const readLength = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const status = result ? statusContent[result.status] : null;

  return <section className="exposure-screen-section" aria-labelledby="screen-heading">
    <div className="section-heading"><div><p className="eyebrow">Modified-free-space screen · advanced</p><h3 id="screen-heading">Single-source far-field estimate</h3></div><span className="model-badge">Model {EXPOSURE_SCREEN_MODEL.version}</span></div>
    <p className="screen-intro">Estimate average power density at one accessible point using a documented ISED propagation assumption and a stricter far-field guard. Every input and limitation remains visible.</p>
    <StepByStepHelp title="Run a preliminary single-source screen" intro="Use this sequence to test one transmitter-to-person path while keeping applicability and omitted sources visible." steps={[
      { title: 'Define the accessible point', detail: 'Choose the closest location a person can occupy and measure straight-line three-dimensional separation from the radiating antenna.' },
      { title: 'Set power and averaging duty cycle', detail: 'Use the applicable transmitter-power definition and a documented transmit percentage over the displayed regulatory averaging period.' },
      { title: 'Account for loss and maximum gain', detail: 'Enter supported feed-system loss and maximum antenna gain in dBi toward the evaluated person unless an applicable method supports a less conservative value.' },
      { title: 'Check far-field applicability', detail: 'Enter the largest antenna dimension and stop using this method when the point lies inside the displayed application guard. For electrically large antennas, the result also exposes the smaller TN-261 boundary separately.' },
      { title: 'Assess every other RF source', detail: 'Include or separately evaluate relevant co-located and nearby transmitters before treating the single-source value as more than a subtotal.' },
      { title: 'Interpret the status and escalate', detail: 'Treat below-trigger as a preliminary screen only; use detailed analysis, measurement, or mitigation for a reached trigger or inapplicable method.' }
    ]} limit="This screen uses maximum gain, a reflected-field multiplier, and an idealized far-field expression. It does not discover sources, model patterns or near fields, validate input evidence, quantify uncertainty, or certify compliance." />
    <div className="screen-input-grid">
      <ValidatedNumberField label="Transmitter output" ariaLabel="Transmitter output" value={transmitterPowerWatts} min={0.001} max={1_000_000} unit="W" help="Maximum RF output before feed-system loss." onChange={setTransmitterPowerWatts} />
      <ValidatedNumberField id="screen-duty-cycle" label="Transmit duty cycle" ariaLabel="Transmit duty cycle" value={dutyCyclePercent} min={0.01} max={100} unit="%" help="Average over the displayed regulatory averaging period." tooltip="Enter the documented transmit-time percentage over the applicable regulatory averaging period, not a casual estimate based only on mode. The averaging period is not the maximum time a person may be exposed." onChange={setDutyCyclePercent} />
      <ValidatedNumberField label="Feed-system loss" ariaLabel="Feed-system loss" value={feedSystemLossDb} min={0} max={100} step={0.1} unit="dB" help="Coax, connectors, tuner, and other loss before the antenna." onChange={setFeedSystemLossDb} />
      <ValidatedNumberField label="Maximum antenna gain" ariaLabel="Maximum antenna gain" value={antennaGainDbi} min={-100} max={100} step={0.1} unit="dBi" help="Use gain toward the evaluated point; maximum gain is conservative." onChange={setAntennaGainDbi} />
      <ValidatedNumberField id="screen-antenna-dimension" label="Largest antenna dimension" ariaLabel="Largest antenna dimension" value={Number(displayLength(antennaDimensionMetres).toFixed(3))} min={unitSystem === 'metric' ? 0.001 : 0.003} max={unitSystem === 'metric' ? 100_000 : 328_084} step={0.01} unit={lengthUnit} help="Used only for the transparent far-field applicability checks." tooltip="Enter the greatest physical antenna dimension used by the applicability check. For antennas larger than one wavelength, TN-261 Table 1 uses 0.5D²/λ; this application deliberately stops at the stricter 2D²/λ guard. This value is not antenna height, occupied footprint, or gain." onChange={(value) => setAntennaDimensionMetres(readLength(value))} />
      <ValidatedNumberField id="screen-separation" label="Straight-line separation" ariaLabel="Straight-line separation" value={Number(displayLength(separationMetres).toFixed(3))} min={unitSystem === 'metric' ? 0.001 : 0.003} max={unitSystem === 'metric' ? 1_000_000 : 3_280_840} step={0.1} unit={lengthUnit} help="From the radiating antenna to the closest accessible person." tooltip="Measure the shortest three-dimensional distance from the radiating antenna to the accessible person location. Horizontal map distance alone is insufficient when antenna and person heights differ." onChange={(value) => setSeparationMetres(readLength(value))} />
      <div className="field screen-source-field"><span className="field-label-with-help"><label htmlFor="screen-other-sources">Other RF sources</label><HelpTip label="Other RF sources">Select assessed only after considering every relevant co-located and nearby transmitter that contributes at this same evaluation point. The application cannot discover omitted station or off-site sources.</HelpTip></span><select id="screen-other-sources" value={nearbySourcesAssessed ? 'assessed' : 'unknown'} onChange={(event) => setNearbySourcesAssessed(event.target.value === 'assessed')}><option value="unknown">Present, absent, or not yet assessed</option><option value="assessed">Assessed; this source can be screened alone</option></select><small>Do not select “assessed” unless nearby and co-located sources were considered.</small></div>
    </div>
    {!result && <p className="validation-message">These inputs are outside the applicable reference-limit or calculation range. No screening result is produced.</p>}
    {result && status && <>
      <div className={`screen-outcome screen-outcome-${result.status}`} role="status"><p className="eyebrow">Screening outcome</p><h4>{status.title}</h4><p>{status.detail}</p></div>
      <div className="screen-results-layout">
        <div className="screen-result-card"><p>Estimated power density</p><strong>{result.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m²</strong><dl><div><dt>Reference-level fraction</dt><dd>{(result.fractionOfReferenceLevel * 100).toFixed(2)}%</dd></div><div><dt>Screening trigger</dt><dd>{(result.screeningTriggerFraction * 100).toFixed(0)}%</dd></div><div><dt>Average transmitter power</dt><dd>{formatPower(result.averageTransmitterPowerWatts)}</dd></div><div><dt>Average antenna input</dt><dd>{formatPower(result.averagePowerAtAntennaWatts)}</dd></div><div><dt>Average EIRP</dt><dd>{formatPower(result.averageEirpWatts)}</dd></div><div><dt>TN-261 boundary</dt><dd>{formatLength(result.tn261BoundaryMetres, unitSystem)}</dd></div><div><dt>Application guard</dt><dd>{formatLength(result.farFieldBoundaryMetres, unitSystem)}</dd></div></dl></div>
        <ExposureScreenDiagram result={result} separationDistanceMetres={separationMetres} unitSystem={unitSystem} />
      </div>
      <div className="screen-limitations"><p className="eyebrow">Assumptions and limits</p><ul>{result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul><p><strong>Result vocabulary:</strong> “Below trigger” means only that this simplified model produced a value below its review threshold. It does not mean safe, compliant, certified, or exempt.</p></div>
      <div className="screen-sources"><p className="eyebrow">Method sources</p><ul>{EXPOSURE_SCREEN_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {EXPOSURE_SCREEN_MODEL.id} · Reviewed {EXPOSURE_SCREEN_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
