/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import {
  calculateFccMultipleSourceExemption,
  FCC_MULTIPLE_EXEMPTION_MODEL,
  type FccMultipleExemptionMethod,
  type FccMultipleExemptionSourceInput
} from '../calculators/fccMultipleExemption';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import type { ExposureJurisdiction } from '../regulations/exposureLimits';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { FccMultipleExemptionDiagram } from './FccMultipleExemptionDiagram';

interface Props {
  jurisdiction: ExposureJurisdiction;
  unitSystem: UnitSystem;
}

const initialSources: FccMultipleExemptionSourceInput[] = [
  { id: 'fcc-multi-1', label: 'VHF source', method: 'distance-erp', frequencyMHz: 146, availableMaximumTimeAveragedPowerWatts: 50, maximumTimeAveragedErpWatts: 100, separationDistanceMetres: 10, evaluatedExposure: 0.2, exposureLimit: 1 },
  { id: 'fcc-multi-2', label: 'UHF source', method: 'distance-erp', frequencyMHz: 446, availableMaximumTimeAveragedPowerWatts: 25, maximumTimeAveragedErpWatts: 50, separationDistanceMetres: 10, evaluatedExposure: 0.1, exposureLimit: 1 }
];

const methodLabels: Record<FccMultipleExemptionMethod, string> = {
  'close-proximity': 'Close-proximity Pth',
  'distance-erp': 'Distance-based ERP',
  evaluated: 'Existing evaluated exposure'
};

function formatPower(watts: number) {
  if (watts < 0.001) return `${(watts * 1_000_000).toPrecision(4)} µW`;
  if (watts < 1) return `${(watts * 1000).toPrecision(4)} mW`;
  if (watts >= 1000) return `${(watts / 1000).toPrecision(4)} kW`;
  return `${watts.toPrecision(4)} W`;
}

export function FccMultipleExemptionPanel({ jurisdiction, unitSystem }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [sourceSetComplete, setSourceSetComplete] = useState(false);
  const [fixedRelationship, setFixedRelationship] = useState(false);
  const [sameAveragingBasis, setSameAveragingBasis] = useState(false);
  const [minimumInterSourceSeparationMetres, setMinimumInterSourceSeparationMetres] = useState(1);
  const result = useMemo(() => {
    if (jurisdiction !== 'US') return null;
    try {
      return calculateFccMultipleSourceExemption({
        sourceSetCompleteConfirmed: sourceSetComplete,
        fixedPositionalRelationshipConfirmed: fixedRelationship,
        sameTimeAveragingBasisConfirmed: sameAveragingBasis,
        minimumInterSourceSeparationMetres,
        sources
      });
    } catch {
      return null;
    }
  }, [jurisdiction, sourceSetComplete, fixedRelationship, sameAveragingBasis, minimumInterSourceSeparationMetres, sources]);

  const updateSource = <K extends keyof FccMultipleExemptionSourceInput>(id: string, key: K, value: FccMultipleExemptionSourceInput[K]) => {
    setSources((current) => current.map((source) => source.id === id ? { ...source, [key]: value } : source));
  };
  const addSource = () => setSources((current) => [...current, {
    ...initialSources[0], id: crypto.randomUUID(), label: `RF source ${current.length + 1}`
  }]);
  const separationUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const displayDistance = (metres: number) => unitSystem === 'metric' ? metres : metresToFeet(metres);
  const readDistance = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const interSourceUnit = unitSystem === 'metric' ? 'cm' : 'in';
  const displayedInterSourceSeparation = unitSystem === 'metric'
    ? minimumInterSourceSeparationMetres * 100
    : minimumInterSourceSeparationMetres * 39.37007874;
  const readInterSourceSeparation = (value: number) => unitSystem === 'metric' ? value / 100 : value / 39.37007874;

  const statusContent = result ? {
    'exempt-from-routine-evaluation': ['Collective sources are exempt from routine evaluation', result.governingPath === 'one-milliwatt' ? 'The special multiple-source 1 mW path is satisfied.' : 'The sum of all applicable fractional contributions is no greater than one.'],
    'routine-evaluation-required': ['Routine environmental evaluation is required', 'The applicable fractional contribution sum is greater than one and the special 1 mW path is not satisfied.'],
    'conditions-not-confirmed': ['Collective-source conditions are not confirmed', 'Confirm the complete source set, fixed positional relationship, and common time-averaging basis before interpreting the calculation.'],
    'selected-method-inapplicable': ['A selected contribution method is inapplicable', 'Correct the source method, frequency, or distance before interpreting the collective result.']
  }[result.status] : null;

  return <section className="fcc-multiple-section exposure-screen-section" aria-labelledby="fcc-multiple-heading">
    <div className="section-heading"><div><p className="eyebrow">United States · collective exemption</p><h3 id="fcc-multiple-heading">FCC multiple-source exemption</h3></div><span className="model-badge">Model {FCC_MULTIPLE_EXEMPTION_MODEL.version}</span></div>
    <p className="screen-intro">Combine fixed RF sources using the special 1 mW conditions or the FCC fractional exemption equation. Each source must use one applicable contribution method.</p>
    <StepByStepHelp title="Check multiple FCC RF sources" intro="Build a collective-source record before interpreting either exemption path." steps={[
      { title: 'Define the collective source set', detail: 'Include existing and proposed sources with a fixed positional relationship that belong in the same assessment.' },
      { title: 'Confirm the time-averaging basis', detail: 'The FCC fractional equation applies to fixed sources operating in the same time-averaging period.' },
      { title: 'Test the special 1 mW path', detail: 'Record available maximum time-averaged power for every source and the closest separation between simultaneously operating radiating structures.' },
      { title: 'Choose one fractional method per source', detail: 'Use close-proximity Pth, distance-based ERP, or a supported existing evaluation at the specified minimum body distance.' },
      { title: 'Add unlike terms only as fractions', detail: 'Each numerator is divided by its own applicable threshold or exposure limit before the dimensionless contributions are summed.' },
      { title: 'Continue when the sum exceeds one', detail: 'If neither collective path qualifies, perform the required RF exposure evaluation. Exemption is not compliance certification.' }
    ]} limit="This tool does not discover other emitters, verify an existing evaluation, establish compatible averaging assumptions, assess sources without fixed positional relationships, or determine compliance with § 1.1310." />

    {jurisdiction !== 'US' ? <div className="screen-outcome screen-outcome-screening-inconclusive" role="status"><p className="eyebrow">Jurisdiction required</p><h4>FCC multiple-source exemption is not evaluated</h4><p>Change the station jurisdiction to United States. This workflow does not apply to Canadian stations.</p></div> : <>
      <div className="fcc-multiple-conditions">
        <div><label><input type="checkbox" checked={sourceSetComplete} onChange={(event) => setSourceSetComplete(event.target.checked)} /> Collective source set complete</label><small>Existing and proposed sources required by the equation are included.</small></div>
        <div><label><input type="checkbox" checked={fixedRelationship} onChange={(event) => setFixedRelationship(event.target.checked)} /> Fixed positional relationship confirmed</label><small>All included sources belong in this collective assessment.</small></div>
        <div><label><input type="checkbox" checked={sameAveragingBasis} onChange={(event) => setSameAveragingBasis(event.target.checked)} /> Same time-averaging basis confirmed</label><small>Operating and duty-cycle assumptions use the same applicable period.</small></div>
        <div className="field"><span className="field-label-with-help"><label htmlFor="fcc-inter-source-separation">Minimum inter-source separation</label><HelpTip label="Minimum inter-source separation">For the special 1 mW path, enter the closest distance between any portion of simultaneously operating radiating structures. At least 2 cm is required unless their total available power is strictly below 1 mW.</HelpTip></span><span className="input-with-unit"><input id="fcc-inter-source-separation" type="number" min="0" step="0.01" value={Number(displayedInterSourceSeparation.toFixed(3))} onChange={(event) => setMinimumInterSourceSeparationMetres(readInterSourceSeparation(Number(event.target.value)))} /><span>{interSourceUnit}</span></span></div>
      </div>

      <div className="fcc-multiple-source-list">{sources.map((source, index) => <fieldset className="fcc-multiple-source" key={source.id}><legend>Source {index + 1}</legend>
        <label className="field"><span>Source label</span><input value={source.label} onChange={(event) => updateSource(source.id, 'label', event.target.value)} /></label>
        <label className="field"><span>Contribution method</span><select value={source.method} onChange={(event) => updateSource(source.id, 'method', event.target.value as FccMultipleExemptionMethod)}>{Object.entries(methodLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="field"><span>Available maximum time-averaged power</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} available maximum time-averaged power`} type="number" min="0" step="0.001" value={source.availableMaximumTimeAveragedPowerWatts} onChange={(event) => updateSource(source.id, 'availableMaximumTimeAveragedPowerWatts', Number(event.target.value))} /><span>W</span></span><small>Required for the special 1 mW path.</small></label>
        {source.method !== 'evaluated' ? <>
          <label className="field"><span>Frequency</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} frequency`} type="number" min="0.001" step="0.001" value={source.frequencyMHz} onChange={(event) => updateSource(source.id, 'frequencyMHz', Number(event.target.value))} /><span>MHz</span></span></label>
          <label className="field"><span>Maximum time-averaged ERP</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} maximum time-averaged ERP`} type="number" min="0" step="0.001" value={source.maximumTimeAveragedErpWatts} onChange={(event) => updateSource(source.id, 'maximumTimeAveragedErpWatts', Number(event.target.value))} /><span>W ERP</span></span></label>
          <label className="field"><span>Minimum body separation</span><span className="input-with-unit"><input aria-label={`Source ${index + 1} minimum body separation`} type="number" min="0.001" step="0.01" value={Number(displayDistance(source.separationDistanceMetres).toFixed(3))} onChange={(event) => updateSource(source.id, 'separationDistanceMetres', readDistance(Number(event.target.value)))} /><span>{separationUnit}</span></span></label>
        </> : <>
          <label className="field"><span>Evaluated exposure</span><input aria-label={`Source ${index + 1} evaluated exposure`} type="number" min="0" step="0.001" value={source.evaluatedExposure} onChange={(event) => updateSource(source.id, 'evaluatedExposure', Number(event.target.value))} /><small>Use the quantity from the existing evaluation.</small></label>
          <label className="field"><span>Applicable exposure limit</span><input aria-label={`Source ${index + 1} applicable exposure limit`} type="number" min="0.000001" step="0.001" value={source.exposureLimit} onChange={(event) => updateSource(source.id, 'exposureLimit', Number(event.target.value))} /><small>Use the same quantity and units as the evaluated value.</small></label>
        </>}
        <button className="secondary-button" type="button" disabled={sources.length <= 2} onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))}>Remove source {index + 1}</button>
      </fieldset>)}</div>
      <button className="secondary-button fcc-add-source" type="button" disabled={sources.length >= 20} onClick={addSource}>Add RF source</button>

      {!result && <p className="validation-message" role="alert">Correct the source identities and numeric inputs before interpreting the exemption paths.</p>}
      {result && statusContent && <>
        <div className={`screen-outcome ${result.status === 'exempt-from-routine-evaluation' ? '' : result.status === 'conditions-not-confirmed' ? 'screen-outcome-screening-inconclusive' : 'screen-outcome-further-analysis-required'}`} role="status"><p className="eyebrow">Collective exemption outcome</p><h4>{statusContent[0]}</h4><p>{statusContent[1]}</p></div>
        <div className="screen-results-layout">
          <div className="fcc-multiple-summary"><article><p className="eyebrow">Special 1 mW path</p><h4>{result.lowPowerPath.passes ? 'Qualifies' : 'Does not qualify'}</h4><dl><div><dt>Total available power</dt><dd>{formatPower(result.lowPowerPath.totalAvailablePowerWatts)}</dd></div><div><dt>Every source ≤ 1 mW</dt><dd>{result.lowPowerPath.everySourceAtOrBelowOneMilliwatt ? 'Yes' : 'No'}</dd></div><div><dt>Total &lt; 1 mW</dt><dd>{result.lowPowerPath.totalBelowOneMilliwatt ? 'Yes' : 'No'}</dd></div><div><dt>Minimum separation ≥ 2 cm</dt><dd>{result.lowPowerPath.twoCentimetreSeparationSatisfied ? 'Yes' : 'No'}</dd></div></dl></article><article><p className="eyebrow">Fractional path</p><h4>{result.totalFraction === null ? 'Incomplete' : `${(result.totalFraction * 100).toFixed(2)}% of threshold`}</h4><p>{result.totalFraction === null ? 'At least one selected contribution method is inapplicable.' : `${(result.remainingFraction! * 100).toFixed(2)} percentage points remain to the exemption threshold.`}</p></article></div>
          <FccMultipleExemptionDiagram result={result} />
        </div>
        <div className="fcc-contribution-grid" aria-label="FCC multiple-source contribution details">{result.contributions.map((contribution) => <article className={`fcc-criterion-card ${contribution.applicable && contribution.fraction! <= 1 ? 'fcc-criterion-card-pass' : ''}`} key={contribution.sourceId}><p className="eyebrow">{methodLabels[contribution.method]}</p><h4>{contribution.label}</h4><dl><div><dt>Numerator</dt><dd>{contribution.method === 'evaluated' ? contribution.numerator.toPrecision(4) : formatPower(contribution.numerator)}</dd></div><div><dt>Threshold or limit</dt><dd>{contribution.denominator === null ? 'Not applicable' : contribution.method === 'evaluated' ? contribution.denominator.toPrecision(4) : formatPower(contribution.denominator)}</dd></div><div><dt>Fraction</dt><dd>{contribution.fraction === null ? 'Not available' : `${(contribution.fraction * 100).toFixed(2)}%`}</dd></div></dl><p>{contribution.detail}</p></article>)}</div>
        <div className="screen-limitations"><p className="eyebrow">Meaning and limits</p><p><strong>A collective exemption is not a compliance determination.</strong> It relieves the obligation to perform routine environmental evaluation only when the entered source set and selected methods satisfy the rule. Existing evaluations, source inventory, distance, ERP, averaging, and positional assumptions remain the operator’s responsibility.</p></div>
        <div className="screen-sources"><p className="eyebrow">Rule source</p><h4>{FCC_MULTIPLE_EXEMPTION_MODEL.sourceRevision}</h4><ul><li><a href={FCC_MULTIPLE_EXEMPTION_MODEL.source.url} target="_blank" rel="noreferrer">{FCC_MULTIPLE_EXEMPTION_MODEL.source.title}</a></li></ul><small>Model ID: {FCC_MULTIPLE_EXEMPTION_MODEL.id} · Reviewed {FCC_MULTIPLE_EXEMPTION_MODEL.reviewedOn}</small></div>
      </>}
    </>}
  </section>;
}
