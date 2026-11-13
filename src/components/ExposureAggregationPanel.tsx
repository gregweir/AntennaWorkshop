/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useRef, useState } from 'react';
import {
  calculateExposureAggregation,
  EXPOSURE_AGGREGATION_MODEL,
  type ExposureContributionInput
} from '../calculators/exposureAggregation';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';
import { ExposureAggregationDiagram } from './ExposureAggregationDiagram';
import { StepByStepHelp } from './ContextHelp';

interface Props {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
}

const initialSources: ExposureContributionInput[] = [
  { id: 'source-1', label: 'Primary amateur station', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0.1 },
  { id: 'source-2', label: 'Nearby RF source', frequencyMHz: 446, powerDensityWattsPerSquareMetre: 0.05 }
];

const outcomeContent = {
  'below-screening-trigger': ['Below the aggregate screening trigger', 'The complete source inventory sums below the selected review trigger. This is not a compliance determination.'],
  'further-analysis-required': ['Further analysis is required', 'The normalized sum reaches the screening trigger. Refine the analysis, measure the site, or apply appropriate mitigation.'],
  'screening-inconclusive': ['Source inventory is incomplete', 'The displayed sum is only a subtotal until all relevant nearby and co-located RF sources have been considered.']
} as const;

export function ExposureAggregationPanel({ jurisdiction, environment }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [sourceInventoryComplete, setSourceInventoryComplete] = useState(false);
  const nextId = useRef(3);
  const result = useMemo(() => {
    try {
      return calculateExposureAggregation(jurisdiction, environment, sources, sourceInventoryComplete);
    } catch {
      return null;
    }
  }, [jurisdiction, environment, sources, sourceInventoryComplete]);

  const updateSource = (id: string, patch: Partial<ExposureContributionInput>) => {
    setSources((current) => current.map((source) => source.id === id ? { ...source, ...patch } : source));
  };
  const addSource = () => {
    const id = `source-${nextId.current++}`;
    setSources((current) => [...current, { id, label: `RF source ${current.length + 1}`, frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0 }]);
    setSourceInventoryComplete(false);
  };
  const removeSource = (id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
    setSourceInventoryComplete(false);
  };
  const outcome = result ? outcomeContent[result.status] : null;

  return <section className="aggregation-section" aria-labelledby="aggregation-heading">
    <div className="section-heading"><div><p className="eyebrow">Multiple sources · normalized sum</p><h3 id="aggregation-heading">Local RF environment</h3></div><span className="model-badge">Model {EXPOSURE_AGGREGATION_MODEL.version}</span></div>
    <p className="screen-intro">Enter the predicted or measured time-averaged power density from every relevant source at the same evaluation point. Each value is divided by its own frequency-specific reference level before summing.</p>
    <StepByStepHelp title="Combine multiple RF sources" intro="Use this sequence to combine unlike frequencies without adding incompatible raw limits or measurements." steps={[
      { title: 'Fix one physical evaluation point', detail: 'Every entered power density must describe the same accessible location and the same exposure environment.' },
      { title: 'List every relevant source', detail: 'Include co-located and nearby transmitters that contribute at the point, including sources outside the amateur station when applicable.' },
      { title: 'Use supported time-averaged values', detail: 'Enter measured or predicted power density with an averaging treatment appropriate to each frequency and operating scenario.' },
      { title: 'Normalize before adding', detail: 'The tool divides each power density by its own frequency-specific reference level, then sums the dimensionless fractions.' },
      { title: 'Confirm inventory only after review', detail: 'Leave the result inconclusive until the relevant source inventory and simultaneous or worst-case operating assumptions have been assessed.' },
      { title: 'Escalate thresholds and invalid methods', detail: 'Use detailed analysis, suitable measurement, or mitigation when the sum reaches its trigger or an underlying prediction is not applicable.' }
    ]} limit="Normalization cannot validate the source predictions, reconcile incompatible locations or averaging assumptions, account for uncertainty, discover missing emitters, or establish compliance." />
    <div className="aggregation-editor">
      {sources.map((source, index) => <fieldset className="aggregation-source" key={source.id}>
        <legend>Source {index + 1}</legend>
        <label className="field"><span>Source label</span><input aria-label={`Source ${index + 1} label`} value={source.label} onChange={(event) => updateSource(source.id, { label: event.target.value })} /></label>
        <label className="field"><span>Frequency</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} frequency`} type="number" min="0.001" step="0.001" value={source.frequencyMHz} onChange={(event) => updateSource(source.id, { frequencyMHz: Number(event.target.value) })} /><span>MHz</span></span></label>
        <label className="field"><span>Power density at point</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} power density`} type="number" min="0" step="0.001" value={source.powerDensityWattsPerSquareMetre} onChange={(event) => updateSource(source.id, { powerDensityWattsPerSquareMetre: Number(event.target.value) })} /><span>W/m²</span></span></label>
        <button className="remove-source" type="button" disabled={sources.length === 1} onClick={() => removeSource(source.id)}>Remove source</button>
      </fieldset>)}
      <button className="add-source" type="button" disabled={sources.length >= 8} onClick={addSource}>+ Add RF source</button>
      <label className="inventory-confirmation"><input type="checkbox" checked={sourceInventoryComplete} onChange={(event) => setSourceInventoryComplete(event.target.checked)} /><span><strong>Local source inventory assessed</strong><small>I have considered relevant nearby and co-located transmitting sources at this evaluation point.</small></span></label>
    </div>
    {!result && <p className="validation-message" role="alert">One or more source entries are outside the selected jurisdiction’s power-density model. No aggregate result is produced.</p>}
    {result && outcome && <>
      <div className={`screen-outcome screen-outcome-${result.status}`} role="status"><p className="eyebrow">Aggregate outcome</p><h4>{outcome[0]}</h4><p>{outcome[1]}</p></div>
      <ExposureAggregationDiagram result={result} />
      <div className="aggregation-contributions" aria-label="Individual normalized contributions">{result.contributions.map((source, index) => <article key={source.id}>
        <span className={`source-swatch source-swatch-${index % 6}`} aria-hidden="true" />
        <div><strong>{source.label}</strong><small>{source.frequencyMHz.toFixed(3)} MHz · {source.powerDensityWattsPerSquareMetre.toPrecision(4)} W/m² of {source.referenceLevelWattsPerSquareMetre.toPrecision(4)} W/m² · {source.averagingMinutes.toFixed(source.averagingMinutes < 10 ? 2 : 0)} min average</small></div>
        <b>{(source.fractionOfReferenceLevel * 100).toFixed(2)}%</b>
      </article>)}</div>
      <div className="aggregation-summary"><div><span>Normalized total</span><strong>{(result.totalFractionOfReferenceLevel * 100).toFixed(2)}%</strong></div><div><span>Screening trigger</span><strong>{(result.screeningTriggerFraction * 100).toFixed(0)}%</strong></div><div><span>Margin to screening trigger</span><strong>{(result.remainingFractionToScreeningTrigger * 100).toFixed(2)}%</strong></div></div>
      <div className="screen-limitations"><p className="eyebrow">Aggregation boundaries</p><ul><li>All power densities must describe the same physical evaluation point and the appropriate time average.</li><li>Sources that can operate simultaneously must be represented by simultaneous or conservative worst-case values.</li><li>Predictions inside any antenna’s applicable far-field boundary require an appropriate near-field method.</li><li>The sum cannot repair missing sources, invalid predictions, measurement uncertainty, or incompatible averaging assumptions.</li></ul><p><strong>Result vocabulary:</strong> A subtotal or below-trigger result does not mean safe, compliant, certified, or exempt.</p></div>
      <div className="screen-sources"><p className="eyebrow">Method sources</p><ul>{EXPOSURE_AGGREGATION_MODEL.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {EXPOSURE_AGGREGATION_MODEL.id} · Reviewed {EXPOSURE_AGGREGATION_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
