/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { calculateOfcomComplianceDistance, OFCOM_COMPLIANCE_DISTANCE_MODEL } from '../calculators/ofcomComplianceDistance';
import type { OfcomPowerBasis } from '../calculators/ofcomAssessment';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { OfcomDistanceDiagram } from './OfcomDistanceDiagram';
import { EvidenceResultSummary } from './ResultEvidenceGuide';

interface Props { frequencyMHz: number; unitSystem: UnitSystem }

export function OfcomComplianceDistancePanel({ frequencyMHz, unitSystem }: Props) {
  const [powerBasis, setPowerBasis] = useState<OfcomPowerBasis>('EIRP');
  const [maximumPower, setMaximumPower] = useState(200);
  const [transmitSeconds, setTransmitSeconds] = useState(120);
  const [antennaDimensionMetres, setAntennaDimensionMetres] = useState(0.2);
  const [highReflectionSurface, setHighReflectionSurface] = useState(false);
  const result = useMemo(() => {
    try {
      return calculateOfcomComplianceDistance({ maximumRadiatedPowerWatts: maximumPower, powerBasis, maximumTransmitSecondsInSixMinutes: transmitSeconds, frequencyMHz, antennaLargestDimensionMetres: antennaDimensionMetres, highReflectionSurface });
    } catch { return null; }
  }, [maximumPower, powerBasis, transmitSeconds, frequencyMHz, antennaDimensionMetres, highReflectionSurface]);
  const distanceUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const shownDimension = unitSystem === 'metric' ? antennaDimensionMetres : metresToFeet(antennaDimensionMetres);
  const readDimension = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const shownDistance = (metres: number) => unitSystem === 'metric' ? metres : metresToFeet(metres);

  const outcome = result ? {
    'no-further-assessment-required': ['No further assessment is required by the calculator’s low-power branch', 'Maximum and average EIRP are within the calculator’s low-power conditions. Retain the applicable record.'],
    'compliance-distance-calculated': ['Maintain the calculated distance from the general public', `The conservative compliance distance is ${shownDistance(result.complianceDistanceMetres).toFixed(2)} ${distanceUnit}.`],
    'method-limitation': ['The simple compliance-distance method has a material limitation', 'The numerical distance is shown for comparison, but use a more advanced assessment or qualified advice for this scenario.']
  }[result.status] : null;

  return <section className="ofcom-distance-section exposure-screen-section" aria-labelledby="ofcom-distance-heading">
    <div className="section-heading"><div><p className="eyebrow">United Kingdom · conservative distance</p><h3 id="ofcom-distance-heading">Ofcom compliance distance</h3></div><span className="model-badge">Model {OFCOM_COMPLIANCE_DISTANCE_MODEL.version}</span></div>
    <p className="screen-intro">Reproduce the current Ofcom calculator’s single-transmitter distance while exposing its intermediate values and antenna-applicability limitations.</p>
    <StepByStepHelp title="Calculate and apply an Ofcom compliance distance" intro="Use this only after the assessment gateway says an assessment is required." steps={[
      { title: 'Enter maximum radiated power', detail: 'Use EIRP or ERP in the strongest direction. The calculator converts ERP to EIRP using Ofcom’s factor of 1.64.' },
      { title: 'Use the busiest six minutes', detail: 'Enter the maximum combined transmitting seconds that can occur in any six-minute period.' },
      { title: 'Confirm frequency and antenna size', detail: 'The official method covers 1 MHz to 300 GHz and is strictly applicable to antennas no longer than half a wavelength.' },
      { title: 'Check the reflecting environment', detail: 'Seawater and metal can reflect more strongly than the calculator assumes and can make its distance too small.' },
      { title: 'Measure from the antenna', detail: 'Apply the distance from the closest part of the antenna to every place where a member of the general public may be present.' },
      { title: 'Keep the record and reassess changes', detail: 'Retain inputs, result, source version, and controls. Reassess changes that may increase exposure.' }
    ]} limit="This simple method does not model complex installations, mobile devices, antenna pattern, multiple simultaneous transmitters, reactive coupling, terrain, buildings, or actual access control." />

    <div className="ofcom-distance-inputs">
      <div className="field"><span className="field-label-with-help"><label htmlFor="ofcom-distance-basis">Radiated-power basis</label><HelpTip label="Compliance-distance power basis">EIRP is referenced to isotropic gain. ERP is referenced to a half-wave dipole and is multiplied by 1.64 to match Ofcom’s EIRP calculation.</HelpTip></span><select id="ofcom-distance-basis" value={powerBasis} onChange={(event) => setPowerBasis(event.target.value as OfcomPowerBasis)}><option value="EIRP">EIRP · isotropic reference</option><option value="ERP">ERP · half-wave dipole reference</option></select></div>
      <label className="field"><span>Maximum radiated power</span><span className="input-with-unit"><input type="number" min="0.000001" step="0.1" value={maximumPower} onChange={(event) => setMaximumPower(Number(event.target.value))} /><span>W {powerBasis}</span></span></label>
      <label className="field"><span>Maximum transmission time in any six minutes</span><span className="input-with-unit"><input type="number" min="0" max="360" step="1" value={transmitSeconds} onChange={(event) => setTransmitSeconds(Number(event.target.value))} /><span>s</span></span></label>
      <label className="field"><span>Largest antenna dimension</span><span className="input-with-unit"><input type="number" min="0.001" step="0.01" value={Number(shownDimension.toFixed(3))} onChange={(event) => setAntennaDimensionMetres(readDimension(Number(event.target.value)))} /><span>{distanceUnit}</span></span><small>Largest overall dimension or antenna diameter.</small></label>
      <label className="ofcom-reflection-check"><input type="checkbox" checked={highReflectionSurface} onChange={(event) => setHighReflectionSurface(event.target.checked)} /> Seawater, metal, or another highly reflective surface is close enough to affect the field</label>
    </div>

    {!result && <p className="validation-message" role="alert">Use 1–300,000 MHz, positive power and antenna size, and no more than 360 transmit seconds.</p>}
    {result && outcome && <>
      <div className={`screen-outcome ${result.status === 'method-limitation' ? 'screen-outcome-further-analysis-required' : result.status === 'no-further-assessment-required' ? 'screen-outcome-screening-inconclusive' : ''}`} role="status"><p className="eyebrow">Ofcom distance outcome</p><h4>{outcome[0]}</h4><p>{outcome[1]}</p></div>
      <div className="screen-results-layout"><EvidenceResultSummary headline="Compliance distance" primary={`${shownDistance(result.complianceDistanceMetres).toFixed(2)} ${distanceUnit}`} primaryKind="calculated" items={[
        { term: 'Average EIRP', value: `${result.averageEirpWatts.toFixed(2)} W`, kind: 'calculated' },
        { term: 'Six-minute duty cycle', value: `${result.dutyCyclePercent.toFixed(1)}%`, kind: 'calculated' },
        { term: 'Reflection coefficient', value: result.reflectionCoefficient.toFixed(1), kind: 'source' },
        { term: 'Half wavelength', value: `${shownDistance(result.wavelengthMetres / 2).toFixed(2)} ${distanceUnit}`, kind: 'calculated' },
        { term: 'Antenna short enough', value: result.electricallyShortAntenna ? 'Yes' : 'No', kind: 'calculated' },
        { term: 'Reactive boundary λ/(2π)', value: `${shownDistance(result.reactiveNearFieldBoundaryMetres).toFixed(2)} ${distanceUnit}`, kind: 'calculated' }
      ]} /><OfcomDistanceDiagram result={result} /></div>
      {result.limitations.length > 0 && <div className="screen-limitations"><p className="eyebrow">Method limitations triggered</p><ul>{result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div>}
      <div className="ofcom-intermediates"><article><span>E-field reference</span><strong>{result.electricFieldReferenceVoltsPerMetre.toFixed(3)} V/m</strong></article><article><span>H-field reference</span><strong>{result.magneticFieldReferenceAmpsPerMetre.toFixed(4)} A/m</strong></article><article><span>Power-density reference</span><strong>{result.powerDensityReferenceWattsPerSquareMetre === null ? 'Not used below 10 MHz' : `${result.powerDensityReferenceWattsPerSquareMetre.toFixed(3)} W/m²`}</strong></article></div>
      <div className="screen-limitations"><p className="eyebrow">Meaning and responsibility</p><p><strong>A calculated distance does not itself demonstrate compliance.</strong> Ensure no member of the general public is present within that distance while transmitting. A smaller separation does not necessarily prove non-compliance; a more detailed applicable assessment may produce a less conservative result.</p></div>
      <div className="screen-sources"><p className="eyebrow">Official implementation and guidance</p><h4>{OFCOM_COMPLIANCE_DISTANCE_MODEL.sourceRevision}</h4><ul><li><a href={OFCOM_COMPLIANCE_DISTANCE_MODEL.source.url} target="_blank" rel="noreferrer">{OFCOM_COMPLIANCE_DISTANCE_MODEL.source.title}</a></li><li><a href={OFCOM_COMPLIANCE_DISTANCE_MODEL.guidance.url} target="_blank" rel="noreferrer">{OFCOM_COMPLIANCE_DISTANCE_MODEL.guidance.title}</a></li></ul><small>Model ID: {OFCOM_COMPLIANCE_DISTANCE_MODEL.id} · Reviewed {OFCOM_COMPLIANCE_DISTANCE_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
