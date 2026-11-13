/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { calculateOfcomMultipleDistance, OFCOM_MULTIPLE_DISTANCE_MODEL, type OfcomMultipleSourceInput } from '../calculators/ofcomMultipleDistance';
import type { OfcomPowerBasis } from '../calculators/ofcomAssessment';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { OfcomDistanceDiagram } from './OfcomDistanceDiagram';

const initialSources: OfcomMultipleSourceInput[] = [
  { id: 'ofcom-multi-1', label: '450 MHz transmitter', maximumRadiatedPowerWatts: 100, powerBasis: 'EIRP', maximumTransmitSecondsInSixMinutes: 60, frequencyMHz: 450, antennaLargestDimensionMetres: 0.2 },
  { id: 'ofcom-multi-2', label: '1800 MHz transmitter', maximumRadiatedPowerWatts: 100, powerBasis: 'EIRP', maximumTransmitSecondsInSixMinutes: 60, frequencyMHz: 1800, antennaLargestDimensionMetres: 0.05 }
];

export function OfcomMultipleDistancePanel({ unitSystem }: { unitSystem: UnitSystem }) {
  const [sources, setSources] = useState(initialSources);
  const [highReflectionSurface, setHighReflectionSurface] = useState(false);
  const result = useMemo(() => {
    try { return calculateOfcomMultipleDistance({ sources, highReflectionSurface }); } catch { return null; }
  }, [sources, highReflectionSurface]);
  const distanceUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const showDistance = (metres: number) => unitSystem === 'metric' ? metres : metresToFeet(metres);
  const readDistance = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const update = <K extends keyof OfcomMultipleSourceInput>(id: string, key: K, value: OfcomMultipleSourceInput[K]) => setSources((current) => current.map((source) => source.id === id ? { ...source, [key]: value } : source));
  const addSource = () => setSources((current) => [...current, { ...initialSources[0], id: crypto.randomUUID(), label: `Transmitter ${current.length + 1}` }]);
  const governing = result?.evaluations.find((evaluation) => evaluation.frequencyMHz === result.governingFrequencyMHz);

  const outcome = result ? {
    'no-further-assessment-required': ['No further assessment is required by the calculator’s low-power branch', 'The summed EIRP and combined six-minute average remain within the calculator’s low-power conditions.'],
    'compliance-distance-calculated': ['Use the largest distance calculated across every frequency', `${result.governingFrequencyMHz.toLocaleString()} MHz governs at ${showDistance(result.complianceDistanceMetres).toFixed(2)} ${distanceUnit}.`],
    'method-limitation': ['The conservative multiple-transmitter method has a material limitation', 'The frequency results are shown for comparison, but this scenario needs a more advanced assessment or qualified advice.']
  }[result.status] : null;

  return <section className="ofcom-multiple-distance-section exposure-screen-section" aria-labelledby="ofcom-multiple-heading">
    <div className="section-heading"><div><p className="eyebrow">United Kingdom · conservative multi-source method</p><h3 id="ofcom-multiple-heading">Ofcom multiple-transmitter distance</h3></div><span className="model-badge">Model {OFCOM_MULTIPLE_DISTANCE_MODEL.version}</span></div>
    <p className="screen-intro">Apply Ofcom’s deliberately conservative method by summing all EIRP, combining source transmission times, calculating at every frequency, and retaining the largest distance.</p>
    <StepByStepHelp title="Combine several Ofcom transmitters" intro="Use this simple method only when the transmitters belong in the same conservative site assessment." steps={[
      { title: 'List every relevant transmitter', detail: 'Include each transmitter whose target area overlaps and which can contribute during the assessed six-minute period.' },
      { title: 'Normalize radiated power', detail: 'Enter EIRP or ERP for each source. ERP is converted to EIRP before all powers are summed.' },
      { title: 'Combine busy-period transmission time', detail: 'Add each source’s maximum transmission seconds. Totals above six minutes saturate at 100% duty cycle.' },
      { title: 'Calculate every frequency', detail: 'The same summed EIRP and combined time are evaluated independently at every distinct entered frequency.' },
      { title: 'Select the largest distance', detail: 'Use the greatest distance from all frequency calculations as the conservative site distance.' },
      { title: 'Escalate unsuitable scenarios', detail: 'Complex installations, electrically long antennas, reflective surfaces, or impractical results require a more advanced method.' }
    ]} limit="This approach intentionally overestimates many multi-transmitter distances. It does not model simultaneous field addition, separate antenna locations, patterns, access geometry, or shared-site equipment owned by other spectrum users." />

    <div className="ofcom-multiple-source-list">{sources.map((source, index) => <fieldset className="ofcom-multiple-source" key={source.id}><legend>Transmitter {index + 1}</legend>
      <label className="field"><span>Label</span><input value={source.label} onChange={(event) => update(source.id, 'label', event.target.value)} /></label>
      <label className="field"><span>Power basis</span><select value={source.powerBasis} onChange={(event) => update(source.id, 'powerBasis', event.target.value as OfcomPowerBasis)}><option value="EIRP">EIRP</option><option value="ERP">ERP</option></select></label>
      <label className="field"><span>Maximum radiated power</span><span className="input-with-unit"><input aria-label={`Transmitter ${index + 1} maximum radiated power`} type="number" min="0.000001" step="0.1" value={source.maximumRadiatedPowerWatts} onChange={(event) => update(source.id, 'maximumRadiatedPowerWatts', Number(event.target.value))} /><span>W</span></span></label>
      <label className="field"><span>Maximum time in six minutes</span><span className="input-with-unit"><input aria-label={`Transmitter ${index + 1} maximum time in six minutes`} type="number" min="1" max="360" step="1" value={source.maximumTransmitSecondsInSixMinutes} onChange={(event) => update(source.id, 'maximumTransmitSecondsInSixMinutes', Number(event.target.value))} /><span>s</span></span></label>
      <label className="field"><span>Frequency</span><span className="input-with-unit"><input aria-label={`Transmitter ${index + 1} frequency`} type="number" min="1" max="300000" step="0.001" value={source.frequencyMHz} onChange={(event) => update(source.id, 'frequencyMHz', Number(event.target.value))} /><span>MHz</span></span></label>
      <label className="field"><span>Largest antenna dimension</span><span className="input-with-unit"><input aria-label={`Transmitter ${index + 1} largest antenna dimension`} type="number" min="0.001" step="0.01" value={Number(showDistance(source.antennaLargestDimensionMetres).toFixed(3))} onChange={(event) => update(source.id, 'antennaLargestDimensionMetres', readDistance(Number(event.target.value)))} /><span>{distanceUnit}</span></span></label>
      <button className="secondary-button" type="button" disabled={sources.length <= 2} onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))}>Remove transmitter {index + 1}</button>
    </fieldset>)}</div>
    <div className="ofcom-multiple-actions"><button className="secondary-button" type="button" disabled={sources.length >= 20} onClick={addSource}>Add transmitter</button><label><input type="checkbox" checked={highReflectionSurface} onChange={(event) => setHighReflectionSurface(event.target.checked)} /> Highly reflective surface may affect the field <HelpTip label="Multiple-transmitter reflection environment">Seawater or nearby metal can reflect more strongly than Ofcom’s standard coefficient and may make the simple result too small.</HelpTip></label></div>

    {!result && <p className="validation-message" role="alert">Correct transmitter identities and numeric inputs before interpreting the collective result.</p>}
    {result && outcome && governing && <>
      <div className={`screen-outcome ${result.status === 'method-limitation' ? 'screen-outcome-further-analysis-required' : result.status === 'no-further-assessment-required' ? 'screen-outcome-screening-inconclusive' : ''}`} role="status"><p className="eyebrow">Collective distance outcome</p><h4>{outcome[0]}</h4><p>{outcome[1]}</p></div>
      <div className="ofcom-multiple-summary"><article><span>Total normalized power</span><strong>{result.totalEirpWatts.toFixed(2)} W EIRP</strong></article><article><span>Combined transmission time</span><strong>{result.combinedTransmitSeconds} s</strong><small>{result.transmissionTimeCapped ? `${result.uncappedCombinedTransmitSeconds} s summed; capped at six minutes` : 'Sum of entered source times'}</small></article><article><span>Governing distance</span><strong>{showDistance(result.complianceDistanceMetres).toFixed(2)} {distanceUnit}</strong><small>at {result.governingFrequencyMHz.toLocaleString()} MHz</small></article></div>
      <div className="screen-results-layout"><div className="ofcom-frequency-results" aria-label="Ofcom frequency comparison">{result.evaluations.map((evaluation) => <article className={evaluation.frequencyMHz === result.governingFrequencyMHz ? 'ofcom-frequency-governing' : ''} key={evaluation.frequencyMHz}><div><span>{evaluation.frequencyMHz.toLocaleString()} MHz</span><strong>{showDistance(evaluation.result.complianceDistanceMetres).toFixed(2)} {distanceUnit}</strong></div><div className="ofcom-frequency-bar"><i style={{ width: `${result.complianceDistanceMetres === 0 ? 0 : evaluation.result.complianceDistanceMetres / result.complianceDistanceMetres * 100}%` }} /></div><small>{evaluation.sourceIdsAtFrequency.length} source {evaluation.sourceIdsAtFrequency.length === 1 ? 'entry' : 'entries'} at this frequency</small></article>)}</div><OfcomDistanceDiagram result={governing.result} /></div>
      {result.limitations.length > 0 && <div className="screen-limitations"><p className="eyebrow">Method limitations triggered</p><ul>{result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div>}
      <div className="screen-limitations"><p className="eyebrow">Meaning and responsibility</p><p><strong>This method is intentionally very conservative.</strong> A smaller distance does not automatically mean non-compliance. A calculated distance also does not itself demonstrate compliance; the public must be kept outside the applicable distance while transmitting.</p></div>
      <div className="screen-sources"><p className="eyebrow">Official method</p><h4>{OFCOM_MULTIPLE_DISTANCE_MODEL.sourceRevision}</h4><ul><li><a href={OFCOM_MULTIPLE_DISTANCE_MODEL.source.url} target="_blank" rel="noreferrer">{OFCOM_MULTIPLE_DISTANCE_MODEL.source.title}</a></li></ul><small>Model ID: {OFCOM_MULTIPLE_DISTANCE_MODEL.id} · Reviewed {OFCOM_MULTIPLE_DISTANCE_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
