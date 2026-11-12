/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { EXPOSURE_LIMIT_MODELS, getExposureReferenceLevel, type ExposureEnvironment, type ExposureJurisdiction } from '../regulations/exposureLimits';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import type { UnitSystem } from '../lib/units';
import { BandIndicator } from './BandIndicator';
import { ExposureLimitDiagram } from './ExposureLimitDiagram';
import { ExposureAggregationPanel } from './ExposureAggregationPanel';
import { ExposureScreenPanel } from './ExposureScreenPanel';

interface Props {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
}

export function ExposureReferenceWorkbench({ jurisdiction, unitSystem }: Props) {
  const [frequencyText, setFrequencyText] = useState('14.200');
  const [environment, setEnvironment] = useState<ExposureEnvironment>('uncontrolled');
  const frequencyMHz = Number(frequencyText);
  const exposureJurisdiction = jurisdiction as ExposureJurisdiction;
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const profile = jurisdictionProfiles.find((item) => item.code === jurisdiction);

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
    <div className="workspace-heading"><div><p className="eyebrow">RF exposure · regulatory foundation</p><h2 id="calculator-title">Official reference limits</h2></div><span className="model-badge">Model {model.version}</span></div>
    <div className="exposure-status" role="note"><strong>Preliminary tools only</strong><span>The reference lookup and conservative far-field estimate do not determine compliance.</span></div>
    <div className="calculator-layout">
      <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
        <label className="field"><span>Active station jurisdiction</span><input value={profile?.name ?? jurisdiction} readOnly /><small>Change jurisdiction using the persistent selector at the top of the application.</small></label>
        <label className="field"><span>Amateur band</span><select className="band-select" value={activeBand?.id ?? 'custom'} onChange={(event) => { const band = availableBands.find((candidate) => candidate.id === event.target.value); if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1)); }}><option value="custom">Custom frequency</option>{availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}</select><small>Loads a design frequency for reviewing the applicable official limit.</small></label>
        <label className="field"><span>Evaluation frequency</span><span className="input-with-unit"><input aria-label="Evaluation frequency" type="number" min="0.001" step="0.001" value={frequencyText} onChange={(event) => setFrequencyText(event.target.value)} /><span>MHz</span></span><small>Canadian power-density reference levels begin at 10 MHz; lower frequencies require electric- and magnetic-field treatment.</small></label>
        <label className="field"><span>Exposure environment</span><select value={environment} onChange={(event) => setEnvironment(event.target.value as ExposureEnvironment)}><option value="uncontrolled">General public / uncontrolled</option><option value="controlled">Occupational / controlled</option></select><small>Controlled limits apply only when the jurisdiction’s awareness, training, characterization, and exposure-control conditions are satisfied.</small></label>
        {!selected && <p className="validation-message" role="alert">This power-density reference model is not applicable at the selected frequency or jurisdiction. No result is produced.</p>}
        {selected && <div className="result-summary" aria-live="polite"><p>{environment} power-density reference level</p><strong>{selected.powerDensityWattsPerSquareMetre.toFixed(3)} W/m²</strong><dl><div><dt>Equivalent units</dt><dd>{(selected.powerDensityWattsPerSquareMetre / 10).toFixed(4)} mW/cm²</dd></div><div><dt>Averaging period</dt><dd>{selected.averagingMinutes.toFixed(selected.averagingMinutes < 10 ? 2 : 0)} min</dd></div><div><dt>Jurisdiction</dt><dd>{profile?.name}</dd></div><div><dt>Quantity</dt><dd>Reference level</dd></div></dl></div>}
      </form>
      <div className="visual-panel">{levels ? <ExposureLimitDiagram levels={levels} selected={environment} /> : <div className="diagram-placeholder">No power-density comparison is available for this frequency.</div>}</div>
    </div>
    <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
    <p className="allocation-note">Band allocation and exposure limits are separate rule sets.{bandSource && <> Allocation source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>
    <div className="explanation-grid">
      <article><p className="eyebrow">What this screen answers</p><h3>The applicable reference number</h3><p>It looks up the official power-density reference level and averaging period for one frequency and environment. Piecewise boundaries are tested directly against the source tables.</p></article>
      <article><p className="eyebrow">What remains</p><h3>No complete site evaluation</h3><p>The preliminary tools below do not discover local transmitters or model antenna patterns, reactive or radiating near fields, terrain, buildings, body coupling, or measurement uncertainty.</p></article>
      <article className="caution-card"><p className="eyebrow">Result vocabulary</p><h3>No pass/fail inference is permitted</h3><p>A reference limit by itself cannot demonstrate compliance or non-compliance. The station’s calculated or measured exposure must be obtained using an applicable method and compared with all relevant limits and aggregation rules.</p></article>
      <article className="provenance-card"><p className="eyebrow">Method and source</p><h3>{model.sourceRevision}</h3><p>The selected value is evaluated directly from the official piecewise power-density table. No interpolation is used beyond the formulas stated by the authority.</p><ul><li><a href={model.source.url} target="_blank" rel="noreferrer">{model.source.title}</a></li></ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
    </div>
    <ExposureScreenPanel jurisdiction={exposureJurisdiction} environment={environment} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
    <ExposureAggregationPanel jurisdiction={exposureJurisdiction} environment={environment} />
  </section>;
}
