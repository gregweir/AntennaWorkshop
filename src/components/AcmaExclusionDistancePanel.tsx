/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { ACMA_EXCLUSION_DISTANCE_MODEL, calculateAcmaExclusionDistance, type AcmaGainBasis } from '../calculators/acmaExclusionDistance';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { AcmaExclusionDiagram } from './AcmaExclusionDiagram';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface Props { frequencyMHz: number; unitSystem: UnitSystem; }

export function AcmaExclusionDistancePanel({ frequencyMHz, unitSystem }: Props) {
  const [transmitterPower, setTransmitterPower] = useState(400);
  const [antennaGain, setAntennaGain] = useState(5);
  const [gainBasis, setGainBasis] = useState<AcmaGainBasis>('dBi');
  const [antennaDimensionMetres, setAntennaDimensionMetres] = useState(0.2);
  const shownDimension = unitSystem === 'metric' ? antennaDimensionMetres : metresToFeet(antennaDimensionMetres);
  const result = useMemo(() => {
    try {
      return calculateAcmaExclusionDistance({ frequencyMHz, transmitterOutputPowerWatts: transmitterPower, antennaGain, gainBasis, antennaLargestDimensionMetres: antennaDimensionMetres });
    } catch { return null; }
  }, [antennaDimensionMetres, antennaGain, frequencyMHz, gainBasis, transmitterPower]);

  return <section className="acma-exclusion-section exposure-screen-section" aria-labelledby="acma-exclusion-heading">
    <div className="section-heading"><div><p className="eyebrow">Australia · official simple method</p><h3 id="acma-exclusion-heading">ACMA RF exclusion distance</h3></div><span className="model-badge">Model {ACMA_EXCLUSION_DISTANCE_MODEL.version}</span></div>
    <p className="screen-intro">Reproduce ACMA’s public-exposure workbook for one transmitting antenna while separately checking whether its result lies in the far field defined by the Amateur Class Licence.</p>
    <StepByStepHelp title="Use the ACMA simple exclusion-distance method" intro="This is the official workbook’s deliberately simple, maximum-gain calculation for frequencies above 30 MHz." steps={[
      { title: 'Enter transmitter output power', detail: 'Use the transmitter output in watts. The official workbook assumes continuous operation and does not subtract feedline or system loss.' },
      { title: 'Enter maximum antenna gain', detail: 'Use the greatest stated gain, in dBi or dBd. The workbook applies maximum gain in every direction and does not use an antenna pattern.' },
      { title: 'Confirm the frequency range', detail: 'The workbook covers frequencies above 30 MHz through 300 GHz and uses the general-public whole-body power-density reference level.' },
      { title: 'Enter the largest antenna dimension', detail: 'This application adds the Class Licence far-field check. Use the largest physical dimension D, not antenna height or gain.' },
      { title: 'Check every publicly accessible direction', detail: 'Treat the output as a circular maximum-gain distance from the antenna phase centre. Confirm the actual antenna location and public access.' },
      { title: 'Use a suitable advanced assessment when needed', detail: 'A result inside the far-field boundary, an antenna-pattern-specific assessment, environmental effects, multiple sources, or lower frequencies require another applicable method.' }
    ]} limit="The official workbook does not factor environmental effects or losses, assumes 100% transmitter power, and has no antenna-pattern input. This reproduction does not verify standard applicability or demonstrate compliance." />

    <div className="acma-exclusion-inputs">
      <label className="field"><span>Transmitter output power</span><span className="input-with-unit"><input aria-label="ACMA transmitter output power" type="number" min="0.001" step="0.1" value={transmitterPower} onChange={(event) => setTransmitterPower(Number(event.target.value))} /><span>W</span></span><small>Official workbook input P; no duty-cycle or feed-loss reduction.</small></label>
      <div className="field"><span className="field-label-with-help"><label htmlFor="acma-gain-basis">Antenna gain basis</label><HelpTip label="ACMA antenna gain basis">Choose dBi for isotropic-reference gain or dBd for half-wave-dipole-reference gain. The official workbook adds 2.15 dB to dBd.</HelpTip></span><select id="acma-gain-basis" value={gainBasis} onChange={(event) => setGainBasis(event.target.value as AcmaGainBasis)}><option value="dBi">dBi · isotropic</option><option value="dBd">dBd · half-wave dipole</option></select></div>
      <label className="field"><span>Maximum antenna gain</span><span className="input-with-unit"><input aria-label="ACMA maximum antenna gain" type="number" min="-100" max="100" step="0.1" value={antennaGain} onChange={(event) => setAntennaGain(Number(event.target.value))} /><span>{gainBasis}</span></span></label>
      <label className="field"><span>Largest antenna dimension</span><span className="input-with-unit"><input aria-label="ACMA largest antenna dimension" type="number" min="0.001" step="0.01" value={Number(shownDimension.toFixed(3))} onChange={(event) => setAntennaDimensionMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>Used only for the separate far-field applicability check.</small></label>
    </div>

    {!result && <p className="validation-message" role="alert">Use a frequency above 30 MHz through 300,000 MHz, positive power and antenna size, and gain from −100 to 100 dB.</p>}
    {result && <>
      <div className={`screen-outcome ${result.exclusionDistanceIsFarField ? '' : 'screen-outcome-further-analysis-required'}`} role="status"><p className="eyebrow">Simple exclusion-distance outcome</p><h4>{result.exclusionDistanceIsFarField ? 'Official simple far-field distance available' : 'The calculated distance is inside the far-field boundary'}</h4><p>{result.exclusionDistanceIsFarField ? `The workbook reproduction gives ${formatLength(result.exclusionDistanceMetres, unitSystem)} from the antenna phase centre. Apply its maximum-gain assumptions in every direction.` : `The workbook number is ${formatLength(result.exclusionDistanceMetres, unitSystem)}, but the Class Licence far-field boundary is ${formatLength(result.farFieldBoundaryMetres, unitSystem)}. Use an applicable near-field assessment or measurement.`}</p></div>
      <div className="screen-results-layout"><div className="result-summary"><p>Simple exclusion distance</p><strong>{formatLength(result.exclusionDistanceMetres, unitSystem)}</strong><dl><div><dt>Public power-density level</dt><dd>{result.referenceLevelWattsPerSquareMetre.toFixed(3)} W/m²</dd></div><div><dt>Gain used</dt><dd>{result.antennaGainDbi.toFixed(2)} dBi</dd></div><div><dt>Linear gain</dt><dd>{result.antennaGainLinear.toFixed(4)}</dd></div><div><dt>Wavelength</dt><dd>{formatLength(result.wavelengthMetres, unitSystem)}</dd></div><div><dt>Far-field boundary</dt><dd>{formatLength(result.farFieldBoundaryMetres, unitSystem)}</dd></div><div><dt>Far-field check</dt><dd>{result.exclusionDistanceIsFarField ? 'Reached' : 'Not reached'}</dd></div></dl></div><AcmaExclusionDiagram result={result} unitSystem={unitSystem} /></div>
      <div className="screen-limitations"><p className="eyebrow">Meaning and limits</p><p><strong>This is a maximum-gain simple exclusion-zone calculation, not a declaration of compliance.</strong> It does not include duty-cycle reduction, system loss, environmental effects, antenna pattern, multiple transmitters, simultaneous frequencies, other site sources, uncertainty, terrain, buildings, or access-control validation.</p></div>
      <div className="screen-sources"><p className="eyebrow">Official implementation and licence boundary</p><h4>{ACMA_EXCLUSION_DISTANCE_MODEL.sourceRevision}</h4><ul><li><a href={ACMA_EXCLUSION_DISTANCE_MODEL.source.url} target="_blank" rel="noreferrer">{ACMA_EXCLUSION_DISTANCE_MODEL.source.title}</a></li><li><a href={ACMA_EXCLUSION_DISTANCE_MODEL.workbook.url} target="_blank" rel="noreferrer">{ACMA_EXCLUSION_DISTANCE_MODEL.workbook.title}</a></li><li><a href={ACMA_EXCLUSION_DISTANCE_MODEL.licence.url} target="_blank" rel="noreferrer">{ACMA_EXCLUSION_DISTANCE_MODEL.licence.title}</a></li></ul><small>Model ID: {ACMA_EXCLUSION_DISTANCE_MODEL.id} · Reviewed {ACMA_EXCLUSION_DISTANCE_MODEL.reviewedOn}</small></div>
    </>}
  </section>;
}
