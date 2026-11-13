/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { calculateOfcomAssessmentRequirement, OFCOM_ASSESSMENT_MODEL, type OfcomPowerBasis } from '../calculators/ofcomAssessment';
import { HelpTip, StepByStepHelp } from './ContextHelp';

export function OfcomAssessmentPanel() {
  const [authorisedAboveThreshold, setAuthorisedAboveThreshold] = useState(true);
  const [currentlyTransmitting, setCurrentlyTransmitting] = useState(true);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [powerBasis, setPowerBasis] = useState<OfcomPowerBasis>('EIRP');
  const [maximumPower, setMaximumPower] = useState(50);
  const [transmitSeconds, setTransmitSeconds] = useState(60);
  const result = useMemo(() => {
    try {
      return calculateOfcomAssessmentRequirement({ authorisedAboveThreshold, currentlyTransmitting, emergencyOnly, powerBasis, maximumRadiatedPowerWatts: maximumPower, maximumTransmitSecondsInSixMinutes: transmitSeconds });
    } catch {
      return null;
    }
  }, [authorisedAboveThreshold, currentlyTransmitting, emergencyOnly, powerBasis, maximumPower, transmitSeconds]);

  const outcome = result ? {
    'no-action-no-record': ['No EMF assessment or record is required by this gateway', 'One of Ofcom’s no-action circumstances applies to the entered equipment and operation.'],
    'no-assessment-record-required': ['No EMF assessment is required; retain the average-power record', 'Both the average radiated-power threshold and the applicable peak-power cap are satisfied.'],
    'assessment-required': ['An EMF assessment and record are required', 'The entered equipment exceeds the applicable averaged-power threshold or peak-power cap. Continue with an applicable compliance-distance or other accepted assessment method.']
  }[result.status] : null;

  return <section className="ofcom-assessment-section exposure-screen-section" aria-labelledby="ofcom-assessment-heading">
    <div className="section-heading"><div><p className="eyebrow">United Kingdom · assessment gateway</p><h3 id="ofcom-assessment-heading">Ofcom EMF assessment requirement</h3></div><span className="model-badge">Model {OFCOM_ASSESSMENT_MODEL.version}</span></div>
    <p className="screen-intro">Follow Ofcom’s current decision thresholds to determine whether the entered amateur-radio operation needs an EMF assessment and what record must be retained.</p>
    <StepByStepHelp title="Check whether an Ofcom assessment is required" intro="Use the strongest radiated power in any direction and the longest transmission time you may use in any six-minute period." steps={[
      { title: 'Confirm the licence scope', detail: 'Check whether the authorisation permits more than 10 W EIRP or 6.1 W ERP.' },
      { title: 'Describe current operation', detail: 'Equipment that is not used, or is used only in the defined emergency circumstances, follows a no-action branch.' },
      { title: 'Choose EIRP or ERP', detail: 'Keep the power value and reference together. Do not enter transmitter output power without antenna gain.' },
      { title: 'Enter the maximum radiated power', detail: 'Use the strongest power emitted in any direction, not an average over antenna directions.' },
      { title: 'Enter the six-minute transmit time', detail: 'Use the conservative maximum total transmission time in any six-minute period, not a daily average.' },
      { title: 'Keep the required record', detail: 'A below-threshold averaged-power result still requires a retained calculation when that branch is used.' }
    ]} limit="This gateway does not calculate a compliance distance, assess public access, combine transmitters, validate an antenna pattern, or demonstrate compliance with the general public EMF limits." />

    <div className="ofcom-input-grid">
      <label><input type="checkbox" checked={authorisedAboveThreshold} onChange={(event) => setAuthorisedAboveThreshold(event.target.checked)} /> Licence authorises more than 10 W EIRP or 6.1 W ERP</label>
      <label><input type="checkbox" checked={currentlyTransmitting} onChange={(event) => setCurrentlyTransmitting(event.target.checked)} /> Equipment is currently used to transmit</label>
      <label><input type="checkbox" checked={emergencyOnly} onChange={(event) => setEmergencyOnly(event.target.checked)} /> Equipment is used only in defined emergency situations</label>
      <div className="field"><span className="field-label-with-help"><label htmlFor="ofcom-power-basis">Radiated-power basis</label><HelpTip label="Radiated-power basis">EIRP uses gain relative to an isotropic antenna. ERP uses gain relative to a half-wave dipole. The Ofcom thresholds differ by the same reference conversion.</HelpTip></span><select id="ofcom-power-basis" value={powerBasis} onChange={(event) => setPowerBasis(event.target.value as OfcomPowerBasis)}><option value="EIRP">EIRP · isotropic reference</option><option value="ERP">ERP · half-wave dipole reference</option></select></div>
      <label className="field"><span>Maximum radiated power</span><span className="input-with-unit"><input type="number" min="0" step="0.1" value={maximumPower} onChange={(event) => setMaximumPower(Number(event.target.value))} /><span>W {powerBasis}</span></span><small>Strongest peak radiated power in any direction.</small></label>
      <label className="field"><span>Maximum transmission time in any six minutes</span><span className="input-with-unit"><input type="number" min="0" max="360" step="1" value={transmitSeconds} onChange={(event) => setTransmitSeconds(Number(event.target.value))} /><span>s</span></span><small>Enter 360 seconds if six continuous minutes are possible.</small></label>
    </div>

    {!result && <p className="validation-message" role="alert">Enter a radiated power of zero or more and a transmission time from zero to 360 seconds.</p>}
    {result && outcome && <>
      <div className={`screen-outcome ${result.status === 'assessment-required' ? 'screen-outcome-further-analysis-required' : result.status === 'no-assessment-record-required' ? 'screen-outcome-screening-inconclusive' : ''}`} role="status"><p className="eyebrow">Ofcom gateway outcome</p><h4>{outcome[0]}</h4><p>{outcome[1]}</p></div>
      <div className="ofcom-decision-graphic" role="img" aria-label={`Ofcom assessment gateway: average ${result.averageRadiatedPowerWatts.toFixed(2)} watts ${powerBasis}; ${outcome[0]}`}>
        <div><span>Peak radiated power</span><strong>{maximumPower.toFixed(2)} W {powerBasis}</strong><small>cap for averaging branch: {result.peakPowerThresholdWatts} W</small></div><i aria-hidden="true">→</i>
        <div><span>Six-minute duty cycle</span><strong>{result.dutyCyclePercent.toFixed(1)}%</strong><small>{transmitSeconds.toFixed(0)} of 360 seconds</small></div><i aria-hidden="true">→</i>
        <div><span>Average radiated power</span><strong>{result.averageRadiatedPowerWatts.toFixed(2)} W</strong><small>threshold: {result.averagePowerThresholdWatts} W {powerBasis}</small></div>
      </div>
      <div className="screen-limitations"><p className="eyebrow">Meaning and next action</p><p><strong>{result.recordRequired ? 'Keep a dated record of this result and its inputs.' : 'This branch does not require an EMF record.'}</strong> An assessment-required result is not a finding of non-compliance. It means an applicable assessment must establish the exclusion distance or otherwise demonstrate how the public limits are met.</p></div>
      <div className="screen-sources"><p className="eyebrow">Official sources</p><h4>{OFCOM_ASSESSMENT_MODEL.sourceRevision}</h4><ul><li><a href={OFCOM_ASSESSMENT_MODEL.source.url} target="_blank" rel="noreferrer">{OFCOM_ASSESSMENT_MODEL.source.title}</a></li><li><a href={OFCOM_ASSESSMENT_MODEL.amateurGuide.url} target="_blank" rel="noreferrer">{OFCOM_ASSESSMENT_MODEL.amateurGuide.title}</a></li></ul><small>Model ID: {OFCOM_ASSESSMENT_MODEL.id} · Reviewed {OFCOM_ASSESSMENT_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
