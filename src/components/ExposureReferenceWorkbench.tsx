/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { EXPOSURE_LIMIT_MODELS, getExposureReferenceLevel, type ExposureEnvironment, type ExposureJurisdiction } from '../regulations/exposureLimits';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import type { UnitSystem } from '../lib/units';
import type { StationSourceTransfer } from '../workflows/stationSourceWorkflow';
import { BandIndicator } from './BandIndicator';
import { ExposureLimitDiagram } from './ExposureLimitDiagram';
import { ExposureAggregationPanel } from './ExposureAggregationPanel';
import { ExposureProjectPanel } from './ExposureProjectPanel';
import { ExposureScreenPanel } from './ExposureScreenPanel';
import { FccExemptionPanel } from './FccExemptionPanel';
import { FccMultipleExemptionPanel } from './FccMultipleExemptionPanel';
import { OfcomAssessmentPanel } from './OfcomAssessmentPanel';
import { OfcomComplianceDistancePanel } from './OfcomComplianceDistancePanel';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface Props {
  jurisdiction: JurisdictionCode;
  setJurisdiction: (jurisdiction: JurisdictionCode) => void;
  unitSystem: UnitSystem;
  incomingSource: StationSourceTransfer | null;
  onSourceConsumed: () => void;
}

type ExposureView = 'reference' | 'single' | 'project' | 'aggregate' | 'fcc-exemption' | 'fcc-multiple' | 'ofcom-assessment' | 'ofcom-distance';

const viewOptions: Array<{ id: ExposureView; title: string; description: string }> = [
  { id: 'reference', title: 'Reference limits', description: 'Official numbers and averaging periods' },
  { id: 'single', title: 'Single source', description: 'One transmitter and one accessible point' },
  { id: 'project', title: 'Station project', description: 'Several transmitters and locations' },
  { id: 'aggregate', title: 'Measured sources', description: 'Normalize predicted or measured fields' },
  { id: 'fcc-exemption', title: 'FCC single', description: 'One-source evaluation exemption' },
  { id: 'fcc-multiple', title: 'FCC multiple', description: 'Collective-source exemption sum' }
];

const ukViewOptions: Array<{ id: ExposureView; title: string; description: string }> = [
  { id: 'ofcom-assessment', title: 'Ofcom gateway', description: 'Assessment and record requirement' },
  { id: 'ofcom-distance', title: 'Compliance distance', description: 'Conservative public exclusion radius' }
];

export function ExposureReferenceWorkbench({ jurisdiction, setJurisdiction, unitSystem, incomingSource, onSourceConsumed }: Props) {
  const [frequencyText, setFrequencyText] = useState('14.200');
  const [environment, setEnvironment] = useState<ExposureEnvironment>('uncontrolled');
  const [view, setView] = useState<ExposureView>(incomingSource ? 'project' : 'reference');
  const frequencyMHz = Number(frequencyText);
  const exposureJurisdiction = jurisdiction as ExposureJurisdiction;
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const profile = jurisdictionProfiles.find((item) => item.code === jurisdiction);
  const isUk = jurisdiction === 'GB';
  const availableViews = isUk ? ukViewOptions : viewOptions;
  useEffect(() => {
    if (isUk && view !== 'ofcom-assessment' && view !== 'ofcom-distance') setView('ofcom-assessment');
    if (!isUk && (view === 'ofcom-assessment' || view === 'ofcom-distance')) setView('reference');
  }, [isUk, view]);
  const needsFrequency = (!isUk && (view === 'reference' || view === 'single' || view === 'fcc-exemption')) || (isUk && view === 'ofcom-distance');
  const needsEnvironment = !isUk && view !== 'fcc-exemption' && view !== 'fcc-multiple';
  const contextClass = view === 'fcc-multiple' || view === 'ofcom-assessment' ? 'exposure-context-panel-one' : needsEnvironment ? '' : 'exposure-context-panel-three';

  const levels = useMemo(() => {
    if (exposureJurisdiction !== 'CA' && exposureJurisdiction !== 'US') return null;
    try {
      return {
        uncontrolled: getExposureReferenceLevel(exposureJurisdiction, frequencyMHz, 'uncontrolled'),
        controlled: getExposureReferenceLevel(exposureJurisdiction, frequencyMHz, 'controlled')
      };
    } catch {
      return null;
    }
  }, [exposureJurisdiction, frequencyMHz]);

  const selected = levels?.[environment] ?? null;
  const model = exposureJurisdiction === 'US' ? EXPOSURE_LIMIT_MODELS.US : EXPOSURE_LIMIT_MODELS.CA;

  return <section className="workspace shell exposure-workspace" id="calculator" aria-labelledby="calculator-title">
    <div className="workspace-heading"><div><p className="eyebrow">RF exposure · sourced engineering tools</p><h2 id="calculator-title">RF exposure workbench</h2></div><span className="model-badge">Preliminary beta</span></div>
    <div className="exposure-status" role="note"><strong>Preliminary tools only</strong><span>Reference lookup, far-field estimates, and normalized totals do not by themselves determine compliance.</span></div>
    <div className={`exposure-mode-picker ${isUk ? 'exposure-mode-picker-uk' : ''}`} aria-label="RF exposure workflow">
      {availableViews.map((option, index) => <button key={option.id} type="button" aria-pressed={view === option.id} onClick={() => setView(option.id)}><span>0{index + 1}</span><strong>{option.title}</strong><small>{option.description}</small></button>)}
    </div>

    <form className={`exposure-context-panel ${contextClass}`} onSubmit={(event) => event.preventDefault()}>
      <label className="field"><span>Active station jurisdiction</span><input value={profile?.name ?? jurisdiction} readOnly /><small>Change jurisdiction using the persistent selector at the top of the application.</small></label>
      {needsEnvironment && <div className="field"><span className="field-label-with-help"><label htmlFor="exposure-environment">Exposure environment</label><HelpTip label="Exposure environment">Use uncontrolled limits wherever the general public may be exposed or whenever the jurisdiction's controlled-environment conditions are not met. Controlled limits require characterized fields, RF awareness, appropriate training or information, and the ability to control or mitigate exposure.</HelpTip></span><select id="exposure-environment" value={environment} onChange={(event) => setEnvironment(event.target.value as ExposureEnvironment)}><option value="uncontrolled">General public / uncontrolled</option><option value="controlled">Occupational / controlled</option></select><small>Controlled limits require the jurisdiction’s awareness, training, characterization, and exposure-control conditions.</small></div>}
      {needsFrequency && <>
        <label className="field"><span>Amateur band</span><select className="band-select" value={activeBand?.id ?? 'custom'} onChange={(event) => { const band = availableBands.find((candidate) => candidate.id === event.target.value); if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1)); }}><option value="custom">Custom frequency</option>{availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}</select><small>Loads a representative frequency for the selected workflow.</small></label>
        <label className="field"><span>Evaluation frequency</span><span className="input-with-unit"><input aria-label="Evaluation frequency" type="number" min="0.001" step="0.001" value={frequencyText} onChange={(event) => setFrequencyText(event.target.value)} /><span>MHz</span></span><small>Canadian power-density reference levels begin at 10 MHz; lower frequencies require electric- and magnetic-field treatment.</small></label>
      </>}
    </form>

    {!isUk && view === 'reference' && <section className="exposure-view" aria-labelledby="reference-view-heading">
      <div className="section-heading"><div><p className="eyebrow">Official lookup</p><h3 id="reference-view-heading">Official reference limits</h3></div><span className="model-badge">Model {model.version}</span></div>
      <StepByStepHelp title="Choose an exposure reference level" intro="Use this sequence to identify the applicable official number before attempting a calculation or measurement comparison." steps={[
        { title: 'Confirm the station jurisdiction', detail: 'Use the rules that govern the station location; browser location, citizenship, or a preferred unit system does not choose the authority.' },
        { title: 'Classify the exposure environment', detail: 'Use uncontrolled limits for public access or whenever every controlled-environment awareness, characterization, and exposure-control condition is not satisfied.' },
        { title: 'Enter the exact frequency', detail: 'Reference levels and averaging periods can change by frequency, including at piecewise table boundaries.' },
        { title: 'Read the level and averaging period', detail: 'Keep the exposure quantity, units, environment, jurisdiction, frequency, and averaging period together in the assessment record.' },
        { title: 'Separate the limit from the assessment', detail: 'A reference number is not a field prediction, measurement, site evaluation, exemption, or compliance result.' },
        { title: 'Record the source and revision', detail: 'Retain the displayed authority, source revision, model identifier, assumptions, and date used for later review.' }
      ]} limit="This lookup returns a power-density reference level only. Other quantities, localized exposure, near-field conditions, induced or contact currents, multiple sources, spatial averaging, and applicable regulatory procedures may still need assessment." />
      <div className="reference-results-layout">
        <div>{!selected && <p className="validation-message" role="alert">This power-density reference model is not applicable at the selected frequency or jurisdiction. No result is produced.</p>}{selected && <div className="result-summary" aria-live="polite"><p>{environment} power-density reference level</p><strong>{selected.powerDensityWattsPerSquareMetre.toFixed(3)} W/m²</strong><dl><div><dt>Equivalent units</dt><dd>{(selected.powerDensityWattsPerSquareMetre / 10).toFixed(4)} mW/cm²</dd></div><div><dt>Averaging period</dt><dd>{selected.averagingMinutes.toFixed(selected.averagingMinutes < 10 ? 2 : 0)} min</dd></div><div><dt>Jurisdiction</dt><dd>{profile?.name}</dd></div><div><dt>Quantity</dt><dd>Reference level</dd></div></dl></div>}</div>
        <div className="visual-panel">{levels ? <ExposureLimitDiagram levels={levels} selected={environment} /> : <div className="diagram-placeholder">No power-density comparison is available for this frequency.</div>}</div>
      </div>
      <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
      <p className="allocation-note">Band allocation and exposure limits are separate rule sets.{bandSource && <> Allocation source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>
      <div className="explanation-grid">
        <article><p className="eyebrow">What this screen answers</p><h3>The applicable reference number</h3><p>It looks up the official power-density reference level and averaging period for one frequency and environment. Piecewise boundaries are tested directly against the source tables.</p></article>
        <article><p className="eyebrow">What remains</p><h3>No complete site evaluation</h3><p>The other workflows add conservative estimates, but do not discover transmitters or model antenna patterns, reactive or radiating near fields, terrain, buildings, body coupling, or measurement uncertainty.</p></article>
        <article className="caution-card"><p className="eyebrow">Result vocabulary</p><h3>No pass/fail inference is permitted</h3><p>A reference limit by itself cannot demonstrate compliance or non-compliance. Calculated or measured exposure must be obtained using an applicable method and compared with all relevant limits and aggregation rules.</p></article>
        <article className="provenance-card"><p className="eyebrow">Method and source</p><h3>{model.sourceRevision}</h3><p>The selected value is evaluated directly from the official piecewise power-density table. No interpolation is used beyond the formulas stated by the authority.</p><ul><li><a href={model.source.url} target="_blank" rel="noreferrer">{model.source.title}</a></li></ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>
    </section>}
    {!isUk && view === 'single' && <ExposureScreenPanel jurisdiction={exposureJurisdiction} environment={environment} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
    {!isUk && view === 'project' && <ExposureProjectPanel jurisdiction={exposureJurisdiction} environment={environment} unitSystem={unitSystem} onJurisdictionChange={setJurisdiction} onEnvironmentChange={setEnvironment} incomingSource={incomingSource} onSourceConsumed={onSourceConsumed} />}
    {!isUk && view === 'aggregate' && <ExposureAggregationPanel jurisdiction={exposureJurisdiction} environment={environment} />}
    {!isUk && view === 'fcc-exemption' && <FccExemptionPanel jurisdiction={exposureJurisdiction} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
    {!isUk && view === 'fcc-multiple' && <FccMultipleExemptionPanel jurisdiction={exposureJurisdiction} unitSystem={unitSystem} />}
    {isUk && view !== 'ofcom-distance' && <OfcomAssessmentPanel />}
    {isUk && view === 'ofcom-distance' && <OfcomComplianceDistancePanel frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
  </section>;
}
