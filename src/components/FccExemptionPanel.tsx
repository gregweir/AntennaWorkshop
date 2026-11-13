/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import {
  calculateFccSingleSourceExemption,
  FCC_EXEMPTION_MODEL,
  type FccExemptionResult
} from '../calculators/fccExemption';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import type { ExposureJurisdiction } from '../regulations/exposureLimits';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { FccExemptionDiagram } from './FccExemptionDiagram';

interface Props {
  jurisdiction: ExposureJurisdiction;
  frequencyMHz: number;
  unitSystem: UnitSystem;
}

function formatPower(watts: number | null) {
  if (watts === null) return 'Not applicable';
  if (watts < 0.001) return `${(watts * 1_000_000).toPrecision(4)} µW`;
  if (watts < 1) return `${(watts * 1000).toPrecision(4)} mW`;
  if (watts >= 1000) return `${(watts / 1000).toPrecision(4)} kW`;
  return `${watts.toPrecision(4)} W`;
}

export function FccExemptionPanel({ jurisdiction, frequencyMHz, unitSystem }: Props) {
  const [availablePowerWatts, setAvailablePowerWatts] = useState(50);
  const [erpWatts, setErpWatts] = useState(100);
  const [separationMetres, setSeparationMetres] = useState(10);
  const result = useMemo<FccExemptionResult | null>(() => {
    if (jurisdiction !== 'US') return null;
    try {
      return calculateFccSingleSourceExemption({
        frequencyMHz,
        availableMaximumTimeAveragedPowerWatts: availablePowerWatts,
        maximumTimeAveragedErpWatts: erpWatts,
        separationDistanceMetres: separationMetres
      });
    } catch {
      return null;
    }
  }, [jurisdiction, frequencyMHz, availablePowerWatts, erpWatts, separationMetres]);

  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const displayedSeparation = unitSystem === 'metric' ? separationMetres : metresToFeet(separationMetres);
  const readSeparation = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const governingCriterion = result?.criteria.find((criterion) => criterion.id === result.governingCriterionId) ?? null;

  return <section className="fcc-exemption-section exposure-screen-section" aria-labelledby="fcc-exemption-heading">
    <div className="section-heading"><div><p className="eyebrow">United States · mandatory evaluation hook</p><h3 id="fcc-exemption-heading">FCC single-source exemption</h3></div><span className="model-badge">Model {FCC_EXEMPTION_MODEL.version}</span></div>
    <p className="screen-intro">Determine whether one RF source qualifies for an exemption from the obligation to perform a routine environmental evaluation under 47 CFR § 1.1307(b)(3)(i).</p>
    <StepByStepHelp title="Check a single FCC RF source" intro="Use the FCC definitions and test all three independent exemption paths without confusing exemption with compliance." steps={[
      { title: 'Confirm United States jurisdiction', detail: 'This workflow implements an FCC rule. It does not apply Safety Code 6 or infer jurisdiction from your network location.' },
      { title: 'Determine available time-averaged power', detail: 'Use the maximum available RF power into a matched load, averaged over the applicable time-averaging period.' },
      { title: 'Determine maximum time-averaged ERP', detail: 'Use maximum delivered time-averaged antenna power and maximum gain relative to a dipole. Keep ERP distinct from EIRP.' },
      { title: 'Measure minimum body separation', detail: 'Use the shortest distance in any direction from any part of the radiating structure to any part of a nearby person.' },
      { title: 'Read each independent criterion', detail: 'The 1 mW, close-proximity Pth, and distance-based ERP paths have different inputs and applicability boundaries.' },
      { title: 'Continue when no criterion qualifies', detail: 'If no path qualifies, perform an RF exposure evaluation under § 1.1310. An exemption never removes the obligation to comply with the exposure limits.' }
    ]} limit="This workflow covers one RF source only and requires an entered ERP. It does not implement the multiple-source fractional exemption equation, the conditional substitution of available power for unknown ERP, SAR evaluation, mitigation, or a compliance determination." />

    {jurisdiction !== 'US' ? <div className="screen-outcome screen-outcome-screening-inconclusive" role="status"><p className="eyebrow">Jurisdiction required</p><h4>FCC exemption is not evaluated</h4><p>Change the station jurisdiction to United States using the persistent selector at the top of the application. Canadian stations require the applicable ISED and Safety Code 6 process.</p></div> : <>
      <div className="screen-input-grid fcc-exemption-inputs">
        <div className="field"><span className="field-label-with-help"><label htmlFor="fcc-available-power">Available maximum time-averaged power</label><HelpTip label="Available maximum time-averaged power">Enter maximum available RF power into a matched load, averaged over the applicable time-averaging period. This is not automatically the transmitter nameplate or peak-envelope power.</HelpTip></span><span className="input-with-unit"><input id="fcc-available-power" type="number" min="0" step="0.001" value={availablePowerWatts} onChange={(event) => setAvailablePowerWatts(Number(event.target.value))} /><span>W</span></span><small>Defined by 47 CFR § 1.1307(b)(2).</small></div>
        <div className="field"><span className="field-label-with-help"><label htmlFor="fcc-erp">Maximum time-averaged ERP</label><HelpTip label="Maximum time-averaged ERP">Enter maximum delivered time-averaged power multiplied by the largest antenna power gain relative to a dipole, summed over two polarizations when present. Do not enter EIRP without converting it to ERP.</HelpTip></span><span className="input-with-unit"><input id="fcc-erp" type="number" min="0" step="0.001" value={erpWatts} onChange={(event) => setErpWatts(Number(event.target.value))} /><span>W ERP</span></span><small>Maximum gain is relative to a dipole, not isotropic.</small></div>
        <div className="field"><span className="field-label-with-help"><label htmlFor="fcc-separation">Minimum body separation</label><HelpTip label="Minimum body separation">Measure from the closest part of the radiating structure to the closest part of a nearby person's body. This differs from distance to an antenna centre or mast.</HelpTip></span><span className="input-with-unit"><input id="fcc-separation" type="number" min="0.001" step="0.01" value={Number(displayedSeparation.toFixed(3))} onChange={(event) => setSeparationMetres(readSeparation(Number(event.target.value)))} /><span>{lengthUnit}</span></span><small>Minimum distance in any direction.</small></div>
      </div>
      {!result && <p className="validation-message" role="alert">These inputs are outside the supported numeric range. No exemption result is produced.</p>}
      {result && <>
        <div className={`screen-outcome ${result.status === 'exempt-from-routine-evaluation' ? '' : 'screen-outcome-further-analysis-required'}`} role="status"><p className="eyebrow">Exemption outcome</p><h4>{result.status === 'exempt-from-routine-evaluation' ? 'Exempt from routine environmental evaluation' : 'Routine environmental evaluation is required'}</h4><p>{governingCriterion ? `${governingCriterion.label} is satisfied. This exemption applies only to the obligation to perform a routine evaluation.` : 'None of the encoded single-source criteria is satisfied. Continue with an applicable evaluation under 47 CFR § 1.1310.'}</p></div>
        <div className="screen-results-layout">
          <div className="screen-result-card"><p>Governing path</p><strong>{governingCriterion?.label ?? 'No exemption path'}</strong><dl><div><dt>Frequency</dt><dd>{frequencyMHz.toFixed(frequencyMHz < 30 ? 3 : 1)} MHz</dd></div><div><dt>Body separation</dt><dd>{formatLength(separationMetres, unitSystem)}</dd></div><div><dt>λ/(2π) boundary</dt><dd>{formatLength(result.minimumDistanceForTableMethodMetres, unitSystem)}</dd></div><div><dt>Available power</dt><dd>{formatPower(availablePowerWatts)}</dd></div><div><dt>Entered ERP</dt><dd>{formatPower(erpWatts)}</dd></div></dl></div>
          <FccExemptionDiagram result={result} />
        </div>
        <div className="fcc-criterion-grid" aria-label="FCC exemption criterion details">{result.criteria.map((criterion) => <article className={`fcc-criterion-card ${criterion.passes ? 'fcc-criterion-card-pass' : ''}`} key={criterion.id}><p className="eyebrow">{criterion.applicable ? criterion.passes ? 'Qualifies' : 'Does not qualify' : 'Not applicable'}</p><h4>{criterion.label}</h4><dl><div><dt>Evaluated power</dt><dd>{formatPower(criterion.evaluatedPowerWatts)}</dd></div><div><dt>Threshold</dt><dd>{formatPower(criterion.thresholdWatts)}</dd></div></dl><p>{criterion.detail}</p></article>)}</div>
        <div className="screen-limitations"><p className="eyebrow">Meaning of exemption</p><p><strong>This is not an exemption from RF exposure limits.</strong> The FCC defines exemption here solely as relief from the obligation to perform a routine environmental evaluation. It does not establish that an installation is safe, authorize excess exposure, or replace equipment-authorization and other applicable obligations.</p></div>
        <div className="screen-sources"><p className="eyebrow">Rule source</p><h4>{FCC_EXEMPTION_MODEL.sourceRevision}</h4><ul><li><a href={FCC_EXEMPTION_MODEL.source.url} target="_blank" rel="noreferrer">{FCC_EXEMPTION_MODEL.source.title}</a></li></ul><small>Model ID: {FCC_EXEMPTION_MODEL.id} · Reviewed {FCC_EXEMPTION_MODEL.reviewedOn}</small></div>
      </>}
    </>}
  </section>;
}
