/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { ACMA_ASSESSMENT_MODEL, assessAcmaStation, type AcmaStationType } from '../calculators/acmaAssessment';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { AcmaGatewayDiagram } from './AcmaGatewayDiagram';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface Props { unitSystem: UnitSystem; }

export function AcmaAssessmentPanel({ unitSystem }: Props) {
  const [stationType, setStationType] = useState<AcmaStationType>('fixed');
  const [averagePower, setAveragePower] = useState(100);
  const [antennasInaccessible, setAntennasInaccessible] = useState(true);
  const [lowestBaseHeightMetres, setLowestBaseHeightMetres] = useState(8);
  const [averageEirp, setAverageEirp] = useState(100);
  const [simultaneousFrequencies, setSimultaneousFrequencies] = useState(false);
  const [multipleStations, setMultipleStations] = useState(false);
  const displayedHeight = unitSystem === 'metric' ? lowestBaseHeightMetres : metresToFeet(lowestBaseHeightMetres);
  const result = useMemo(() => {
    try {
      return assessAcmaStation({ stationType, averageTotalPowerWatts: averagePower, everyAntennaInaccessibleToPublic: antennasInaccessible, lowestAntennaBaseHeightMetres: lowestBaseHeightMetres, averageTotalEirpWatts: averageEirp, simultaneousMultipleFrequencies: simultaneousFrequencies, multipleStationsAtSite: multipleStations });
    } catch { return null; }
  }, [antennasInaccessible, averageEirp, averagePower, lowestBaseHeightMetres, multipleStations, simultaneousFrequencies, stationType]);

  return <section className="acma-assessment-section exposure-screen-section" aria-labelledby="acma-assessment-heading">
    <div className="section-heading"><div><p className="eyebrow">Australia · class-licence gateway</p><h3 id="acma-assessment-heading">Amateur station EME assessment path</h3></div><span className="model-badge">Model {ACMA_ASSESSMENT_MODEL.version}</span></div>
    <p className="screen-intro">Use Schedule 1 to identify whether a station is within a low-risk category or must follow the higher-risk measurement, calculation, declaration, and record requirements.</p>
    <StepByStepHelp title="Classify an Australian amateur station" intro="Use average totals across the complete station, not one transmitter or antenna in isolation." steps={[
      { title: 'Choose fixed or mobile', detail: 'Mobile stations have a separate 100 W average-total-power path. Fixed stations have two alternative low-risk paths.' },
      { title: 'Total the power to every antenna', detail: 'Use average total power supplied by the station to all antennas fed by it.' },
      { title: 'Confirm public accessibility', detail: 'For the fixed 100 W path, every antenna fed by the station must be inaccessible to a member of the general public.' },
      { title: 'Check height and EIRP together', detail: 'The alternative fixed path requires the base of the lowest antenna to be at least 10 m above ground and average total EIRP no more than 3200 W in any direction.' },
      { title: 'Account for simultaneous frequencies and other stations', detail: 'Simultaneous multi-frequency exposure must meet RPS S-1 section 3. A documented whole-site assessment may be relevant where several stations share one site.' },
      { title: 'Retain and revisit the evidence', detail: 'Higher-risk stations need an applicable assessment and record package before operation. Recheck after changes to location, power, gain, antenna size, height, tilt, or emission mode.' }
    ]} limit="A low-risk classification is not an exemption from the public-exposure condition and does not prove compliance. Transitional assessments, agent agreements, standard selection, and detailed field calculations remain outside this gateway." />

    <div className="acma-input-grid">
      <div className="field"><span>Station type</span><select aria-label="Station type" value={stationType} onChange={(event) => setStationType(event.target.value as AcmaStationType)}><option value="fixed">Fixed / non-mobile station</option><option value="mobile">Mobile station</option></select></div>
      <label className="field"><span className="field-label-with-help"><span>Average total power to all antennas</span><HelpTip label="Average total station power">Add the average power supplied by the station to every antenna it feeds. This is not EIRP and is not the peak output of only one transmitter.</HelpTip></span><span className="input-with-unit"><input aria-label="Average total power to all antennas" type="number" min="0" step="0.1" value={averagePower} onChange={(event) => setAveragePower(Number(event.target.value))} /><span>W</span></span></label>
      <label className="field"><span>Base height of lowest antenna</span><span className="input-with-unit"><input aria-label="Base height of lowest antenna" type="number" min="0" step="0.1" value={Number(displayedHeight.toFixed(3))} onChange={(event) => setLowestBaseHeightMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>Threshold: 10 m / 32.808 ft above ground level.</small></label>
      <label className="field"><span className="field-label-with-help"><span>Average total EIRP in any direction</span><HelpTip label="Average total EIRP">Add average EIRP from all antennas in the direction producing the greatest combined value. Do not use transmitter output without feed loss and antenna gain.</HelpTip></span><span className="input-with-unit"><input aria-label="Average total EIRP in any direction" type="number" min="0" step="1" value={averageEirp} onChange={(event) => setAverageEirp(Number(event.target.value))} /><span>W EIRP</span></span></label>
      <label className="acma-check"><input type="checkbox" checked={antennasInaccessible} onChange={(event) => setAntennasInaccessible(event.target.checked)} disabled={stationType === 'mobile'} /> Every antenna is inaccessible to the general public</label>
      <label className="acma-check"><input type="checkbox" checked={simultaneousFrequencies} onChange={(event) => setSimultaneousFrequencies(event.target.checked)} /> Station can transmit simultaneously on multiple frequencies</label>
      <label className="acma-check"><input type="checkbox" checked={multipleStations} onChange={(event) => setMultipleStations(event.target.checked)} /> Site contains more than one station</label>
    </div>

    {!result && <p className="validation-message" role="alert">Enter finite values of zero or more for power, height, and EIRP.</p>}
    {result && <>
      <div className={`screen-outcome ${result.higherRiskMeasurementRequired ? 'screen-outcome-further-analysis-required' : ''}`} role="status"><p className="eyebrow">Class-licence gateway outcome</p><h4>{result.higherRiskMeasurementRequired ? 'Higher-risk measurement, calculation, and records are required' : 'Station is within a Schedule 1 low-risk category'}</h4><p>{result.higherRiskMeasurementRequired ? 'No low-risk clause 3 path is satisfied. Complete an applicable clause 4 assessment and possess the clause 6 record package before operation.' : 'Clauses 4 and 6 do not impose their mandatory higher-risk assessment and record package on this station. The general public exposure condition still applies.'}</p></div>
      <div className="acma-result-layout">
        <AcmaGatewayDiagram result={result} />
        <div className="acma-path-summary"><p className="eyebrow">Threshold audit</p><dl><div><dt>Fixed ≤100 W + inaccessible antennas</dt><dd>{result.fixedPowerAccessPathSatisfied ? 'Satisfied' : 'Not satisfied'}</dd></div><div><dt>Fixed ≥10 m + ≤3200 W EIRP</dt><dd>{result.fixedHeightEirpPathSatisfied ? 'Satisfied' : 'Not satisfied'}</dd></div><div><dt>Mobile ≤100 W</dt><dd>{result.mobilePowerPathSatisfied ? 'Satisfied' : 'Not satisfied'}</dd></div></dl></div>
      </div>
      {(result.simultaneousFrequencyAssessmentRequired || result.wholeSiteAssessmentRelevant) && <div className="screen-limitations"><p className="eyebrow">Additional applicable conditions</p>{result.simultaneousFrequencyAssessmentRequired && <p><strong>Simultaneous frequencies:</strong> operation must meet the multiple-frequency requirements in RPS S-1 section 3.</p>}{result.wholeSiteAssessmentRelevant && <p><strong>Shared site:</strong> the licence provides a documented whole-site measurement or calculation route, but this gateway does not perform or validate it.</p>}</div>}
      <div className="screen-limitations"><p className="eyebrow">Meaning and records</p><p><strong>The public exposure condition applies on both branches.</strong> A low-risk station may use a qualifying measurement or calculation document for the clause 3 rebuttable presumption; this gateway does not create that evidence. Higher-risk records include a current declaration, assessor name and qualification, assessment date, measurements or calculations, and station power, gain, size, tilt, manufacturer, model, emission mode, location, antenna type, and height. Changed declaration information requires a new declaration.</p></div>
      <div className="screen-sources"><p className="eyebrow">Official source</p><h4>{ACMA_ASSESSMENT_MODEL.sourceRevision}</h4><ul><li><a href={ACMA_ASSESSMENT_MODEL.source.url} target="_blank" rel="noreferrer">{ACMA_ASSESSMENT_MODEL.source.title}</a></li><li><a href="https://www.arpansa.gov.au/regulation-and-licensing/regulatory-publications/radiation-protection-series/codes-and-standards/rpss-1" target="_blank" rel="noreferrer">ARPANSA RPS S-1 (Rev. 1)</a></li></ul><small>Model ID: {ACMA_ASSESSMENT_MODEL.id} · Reviewed {ACMA_ASSESSMENT_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
