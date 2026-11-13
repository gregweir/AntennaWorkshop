/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { ARPANSA_REFERENCE_MODEL, getArpansaReferenceLevels, type ArpansaReferenceValue } from '../calculators/arpansaReference';
import type { ExposureEnvironment } from '../regulations/exposureLimits';
import { StepByStepHelp } from './ContextHelp';

interface Props { frequencyMHz: number; environment: ExposureEnvironment; }

function formatValue(value: ArpansaReferenceValue, unit: string) {
  if (value === null) return 'Not applicable';
  if (value === 'ES') return 'ES — use peak-field level';
  return `${value < 1 ? value.toPrecision(4) : value.toFixed(3)} ${unit}`;
}

export function ArpansaReferencePanel({ frequencyMHz, environment }: Props) {
  let result = null;
  try { result = getArpansaReferenceLevels(frequencyMHz, environment === 'controlled' ? 'occupational' : 'general-public'); } catch { /* render validation */ }
  return <section className="exposure-view" aria-labelledby="arpansa-reference-heading">
    <div className="section-heading"><div><p className="eyebrow">Australian official lookup</p><h3 id="arpansa-reference-heading">ARPANSA RPS S-1 reference levels</h3></div><span className="model-badge">Model {ARPANSA_REFERENCE_MODEL.version}</span></div>
    <StepByStepHelp title="Use the Australian reference tables" intro="Keep the exposure scenario, spatial basis, averaging period, field region, and evaluated quantity together." steps={[
      { title: 'Classify the exposed person', detail: 'Use general-public levels unless the RPS S-1 occupational definition, risk analysis, training, controls, and responsible-person arrangements are all satisfied.' },
      { title: 'Enter the exact frequency', detail: 'The required field quantity and numeric reference level change at several frequency boundaries.' },
      { title: 'Choose whole-body or local exposure', detail: 'Whole-body values use a 30-minute average. Local values use a 6-minute average and additional spatial requirements.' },
      { title: 'Identify the field region', detail: 'The applicable quantity changes with frequency and field region. The Amateur Class Licence includes specific far-field measurement rules from 10 MHz upward.' },
      { title: 'Include every applicable check', detail: 'Peak fields apply through 10 MHz; limb current applies through 110 MHz when a person is not electrically isolated from a ground plane.' },
      { title: 'Retain an assessment record', detail: 'Record the source revision, frequency, scenario, averaging and spatial treatment, equipment state, method, uncertainty, and any access controls.' }
    ]} limit="This lookup does not predict a station field, establish an exclusion boundary, assess basic restrictions, or demonstrate compliance. It does not replace the applicable ACMA licence conditions or state and territory requirements." />
    {!result && <p className="validation-message" role="alert">Enter a frequency from 0.1 to 300,000 MHz. No reference result is produced outside RPS S-1.</p>}
    {result && <>
      <div className="arpansa-reference-grid" aria-live="polite">
        <article><p className="eyebrow">Whole-body exposure</p><h4>30-minute average</h4><dl><div><dt>Incident E-field</dt><dd>{formatValue(result.wholeBody.electricFieldVoltsPerMetre, 'V/m')}</dd></div><div><dt>Incident H-field</dt><dd>{formatValue(result.wholeBody.magneticFieldAmpsPerMetre, 'A/m')}</dd></div><div><dt>Incident power density</dt><dd>{formatValue(result.wholeBody.incidentPowerDensityWattsPerSquareMetre, 'W/m²')}</dd></div></dl></article>
        <article><p className="eyebrow">Local exposure</p><h4>6-minute average</h4><dl><div><dt>Incident E-field</dt><dd>{formatValue(result.local.electricFieldVoltsPerMetre, 'V/m')}</dd></div><div><dt>Incident H-field</dt><dd>{formatValue(result.local.magneticFieldAmpsPerMetre, 'A/m')}</dd></div><div><dt>Incident power density</dt><dd>{formatValue(result.local.incidentPowerDensityWattsPerSquareMetre, 'W/m²')}</dd></div></dl></article>
        <article className={result.peakField || result.limbCurrentMilliamps ? 'caution-card' : ''}><p className="eyebrow">Additional checks</p><h4>{result.peakField || result.limbCurrentMilliamps ? 'Applicable at this frequency' : 'No Table 7 or 8 value'}</h4><dl><div><dt>Peak E/H fields</dt><dd>{result.peakField ? `${result.peakField.electricFieldVoltsPerMetre} V/m · ${result.peakField.magneticFieldAmpsPerMetre} A/m` : 'Table 7 ends at 10 MHz'}</dd></div><div><dt>Limb current</dt><dd>{result.limbCurrentMilliamps ? `${result.limbCurrentMilliamps} mA when grounded` : 'Table 8 ends at 110 MHz'}</dd></div></dl></article>
      </div>
      <div className="explanation-grid arpansa-explanation-grid">
        <article><p className="eyebrow">What “ES” means</p><h3>No numeric table value</h3><p>RPS S-1 marks a value “ES” where it would exceed the spatial- and temporal-peak field-strength level. Use the displayed peak-field check; do not read ES as unrestricted.</p></article>
        <article><p className="eyebrow">Field-region rule</p><h3>Power density is not universal</h3><p>RPS S-1 provides E- and H-field levels below 30 MHz. The Amateur Class Licence has specific far-field rules from 10 MHz upward; reactive near-field cases can require both fields or a basic-restriction assessment.</p></article>
        <article className="caution-card"><p className="eyebrow">Occupational selection</p><h3>Not simply “the operator”</h3><p>RPS S-1 occupational exposure requires controlled conditions, risk analysis, information and training, and active management. Otherwise use the general-public scenario.</p></article>
        <article className="provenance-card"><p className="eyebrow">Method and source</p><h3>{ARPANSA_REFERENCE_MODEL.sourceRevision}</h3><p>Values reproduce Tables 4 and 5. Additional notices reproduce Tables 7 and 8.</p><ul><li><a href={ARPANSA_REFERENCE_MODEL.source.url} target="_blank" rel="noreferrer">{ARPANSA_REFERENCE_MODEL.source.title}</a></li><li><a href="https://www.acma.gov.au/our-rules-eme" target="_blank" rel="noreferrer">ACMA rules for electromagnetic energy</a></li></ul><small>Model ID: {ARPANSA_REFERENCE_MODEL.id} · Reviewed {ARPANSA_REFERENCE_MODEL.reviewedOn}</small></article>
      </div>
    </>}
  </section>;
}
