/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useRef, useState } from 'react';
import {
  calculateExposureProject,
  EXPOSURE_PROJECT_MODEL,
  type ExposureEvaluationPointInput,
  type ExposureProjectSourceInput
} from '../calculators/exposureProject';
import { EXPOSURE_AGGREGATION_MODEL } from '../calculators/exposureAggregation';
import { EXPOSURE_SCREEN_MODEL } from '../calculators/exposureScreen';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';
import { ExposureProjectDiagram } from './ExposureProjectDiagram';

interface Props {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  unitSystem: UnitSystem;
}

const initialSources: ExposureProjectSourceInput[] = [
  {
    id: 'project-source-1', label: '2 m vertical', frequencyMHz: 146,
    transmitterPowerWatts: 50, dutyCyclePercent: 50, feedSystemLossDb: 1,
    antennaGainDbi: 2.15, antennaLargestDimensionMetres: 1,
    antennaCentreHeightMetres: 10
  },
  {
    id: 'project-source-2', label: '70 cm vertical', frequencyMHz: 446,
    transmitterPowerWatts: 25, dutyCyclePercent: 25, feedSystemLossDb: 1.5,
    antennaGainDbi: 5, antennaLargestDimensionMetres: 0.5,
    antennaCentreHeightMetres: 12
  }
];

const initialPoints: ExposureEvaluationPointInput[] = [
  { id: 'project-point-1', label: 'Yard access', horizontalDistanceMetres: 15, heightMetres: 1.5 },
  { id: 'project-point-2', label: 'Property line', horizontalDistanceMetres: 30, heightMetres: 1.5 }
];

const statusCopy = {
  'below-screening-trigger': ['All modelled points are below the screening trigger', 'Every listed location is beyond the conservative far-field boundary and its normalized source total is below the selected review trigger. This is not a compliance determination.'],
  'further-analysis-required': ['Further analysis is required at one or more points', 'At least one location reaches the selected screening trigger. Refine the model, measure the site, or apply appropriate mitigation.'],
  'screening-inconclusive': ['The station source inventory is incomplete', 'Calculated values are displayed as subtotals, but the project cannot be interpreted until all relevant station and co-located sources are included.'],
  'method-inapplicable': ['Far-field screening is inapplicable at one or more points', 'At least one source–location path lies inside its conservative far-field boundary. That location requires a suitable near-field method or measurement.']
} as const;

export function ExposureProjectPanel({ jurisdiction, environment, unitSystem }: Props) {
  const [projectTitle, setProjectTitle] = useState('Home station RF assessment');
  const [sources, setSources] = useState(initialSources);
  const [points, setPoints] = useState(initialPoints);
  const [sourceInventoryComplete, setSourceInventoryComplete] = useState(false);
  const nextSourceId = useRef(3);
  const nextPointId = useRef(3);
  const result = useMemo(() => {
    try {
      return calculateExposureProject({ jurisdiction, environment, sourceInventoryComplete, sources, evaluationPoints: points });
    } catch {
      return null;
    }
  }, [jurisdiction, environment, sourceInventoryComplete, sources, points]);

  const lengthUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const displayLength = (metres: number) => unitSystem === 'metric' ? metres : metresToFeet(metres);
  const readLength = (value: number) => unitSystem === 'metric' ? value : feetToMetres(value);
  const updateSource = (id: string, patch: Partial<ExposureProjectSourceInput>) => {
    setSources((current) => current.map((source) => source.id === id ? { ...source, ...patch } : source));
    setSourceInventoryComplete(false);
  };
  const updatePoint = (id: string, patch: Partial<ExposureEvaluationPointInput>) => {
    setPoints((current) => current.map((point) => point.id === id ? { ...point, ...patch } : point));
  };
  const addSource = () => {
    const id = `project-source-${nextSourceId.current++}`;
    setSources((current) => [...current, {
      ...initialSources[0], id, label: `Station source ${current.length + 1}`
    }]);
    setSourceInventoryComplete(false);
  };
  const addPoint = () => {
    const id = `project-point-${nextPointId.current++}`;
    setPoints((current) => [...current, { id, label: `Evaluation point ${current.length + 1}`, horizontalDistanceMetres: 20, heightMetres: 1.5 }]);
  };
  const status = result ? statusCopy[result.status] : null;
  const worst = result?.pointResults.find((point) => point.point.id === result.worstPointId);

  return <section className="project-section" aria-labelledby="project-heading">
    <div className="section-heading"><div><p className="eyebrow">Integrated station model · printable record</p><h3 id="project-heading">Station assessment project</h3></div><span className="model-badge">Model {EXPOSURE_PROJECT_MODEL.version}</span></div>
    <p className="screen-intro">Model several transmitters on one common antenna support across several accessible locations. Calculated source contributions flow directly into the normalized total for each location.</p>

    <div className="project-editor">
      <label className="field project-title-field"><span>Project title</span><input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} /></label>
      <div className="project-editor-heading"><div><p className="eyebrow">Station sources</p><h4>Transmitters and antennas</h4></div><button type="button" className="add-source" disabled={sources.length >= 8} onClick={addSource}>+ Add station source</button></div>
      <div className="project-source-list">{sources.map((source, index) => <details key={source.id} className="project-source-editor">
        <summary><span><strong>{source.label || `Source ${index + 1}`}</strong><small>{source.frequencyMHz || 0} MHz · {source.transmitterPowerWatts || 0} W</small></span><b>Source {index + 1}</b></summary>
        <div className="project-field-grid">
          <label className="field"><span>Source label</span><input aria-label={`Project source ${index + 1} label`} value={source.label} onChange={(event) => updateSource(source.id, { label: event.target.value })} /></label>
          <label className="field"><span>Frequency</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} frequency`} type="number" min="0.001" step="0.001" value={source.frequencyMHz} onChange={(event) => updateSource(source.id, { frequencyMHz: Number(event.target.value) })} /><span>MHz</span></span></label>
          <label className="field"><span>Transmitter output</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} transmitter output`} type="number" min="0.001" value={source.transmitterPowerWatts} onChange={(event) => updateSource(source.id, { transmitterPowerWatts: Number(event.target.value) })} /><span>W</span></span></label>
          <label className="field"><span>Duty cycle</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} duty cycle`} type="number" min="0.01" max="100" value={source.dutyCyclePercent} onChange={(event) => updateSource(source.id, { dutyCyclePercent: Number(event.target.value) })} /><span>%</span></span></label>
          <label className="field"><span>Feed-system loss</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} feed loss`} type="number" min="0" step="0.1" value={source.feedSystemLossDb} onChange={(event) => updateSource(source.id, { feedSystemLossDb: Number(event.target.value) })} /><span>dB</span></span></label>
          <label className="field"><span>Maximum antenna gain</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} antenna gain`} type="number" step="0.1" value={source.antennaGainDbi} onChange={(event) => updateSource(source.id, { antennaGainDbi: Number(event.target.value) })} /><span>dBi</span></span></label>
          <label className="field"><span>Largest antenna dimension</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} antenna dimension`} type="number" min="0.001" step="0.01" value={Number(displayLength(source.antennaLargestDimensionMetres).toFixed(3))} onChange={(event) => updateSource(source.id, { antennaLargestDimensionMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
          <label className="field"><span>Antenna centre height</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} antenna height`} type="number" min="0" step="0.1" value={Number(displayLength(source.antennaCentreHeightMetres).toFixed(3))} onChange={(event) => updateSource(source.id, { antennaCentreHeightMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        </div>
        <button type="button" className="remove-source" disabled={sources.length === 1} onClick={() => { setSources((current) => current.filter((candidate) => candidate.id !== source.id)); setSourceInventoryComplete(false); }}>Remove source</button>
      </details>)}</div>

      <div className="project-editor-heading"><div><p className="eyebrow">Accessible locations</p><h4>Evaluation points</h4></div><button type="button" className="add-source" disabled={points.length >= 12} onClick={addPoint}>+ Add evaluation point</button></div>
      <div className="project-point-list">{points.map((point, index) => <fieldset key={point.id} className="project-point-editor"><legend>Point {index + 1}</legend>
        <label className="field"><span>Location label</span><input aria-label={`Project point ${index + 1} label`} value={point.label} onChange={(event) => updatePoint(point.id, { label: event.target.value })} /></label>
        <label className="field"><span>Horizontal distance</span><span className="input-with-unit"><input aria-label={`Project point ${index + 1} horizontal distance`} type="number" min="0" step="0.1" value={Number(displayLength(point.horizontalDistanceMetres).toFixed(3))} onChange={(event) => updatePoint(point.id, { horizontalDistanceMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        <label className="field"><span>Point height</span><span className="input-with-unit"><input aria-label={`Project point ${index + 1} height`} type="number" min="0" step="0.1" value={Number(displayLength(point.heightMetres).toFixed(3))} onChange={(event) => updatePoint(point.id, { heightMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        <button type="button" className="remove-source" disabled={points.length === 1} onClick={() => setPoints((current) => current.filter((candidate) => candidate.id !== point.id))}>Remove point</button>
      </fieldset>)}</div>
      <label className="inventory-confirmation"><input type="checkbox" checked={sourceInventoryComplete} onChange={(event) => setSourceInventoryComplete(event.target.checked)} /><span><strong>Common-site source inventory assessed</strong><small>I have included all relevant transmitters and antennas on this common support or station site. Nearby sources at other sites still require separate assessment.</small></span></label>
    </div>

    {!result && <p className="validation-message" role="alert">One or more project inputs are invalid or outside the selected jurisdiction’s power-density model. No project result is produced.</p>}
    {result && status && <div className="project-report" aria-label="Printable exposure assessment record">
      <div className="project-report-heading"><div><p className="eyebrow">Assessment record</p><h4>{projectTitle || 'Untitled station assessment'}</h4><p>{jurisdiction === 'CA' ? 'Canada' : 'United States'} · {environment === 'uncontrolled' ? 'General public / uncontrolled' : 'Occupational / controlled'} · {sources.length} sources · {points.length} locations</p></div><div className="project-actions"><button type="button" onClick={() => window.print()}>Print assessment</button></div></div>
      <div className={`screen-outcome screen-outcome-${result.status}`} role="status"><p className="eyebrow">Project outcome</p><h4>{status[0]}</h4><p>{status[1]}</p></div>
      <ExposureProjectDiagram result={result} unitSystem={unitSystem} />
      <div className="project-point-results">{result.pointResults.map((pointResult) => <article className={pointResult.point.id === result.worstPointId ? 'project-worst-point' : ''} key={pointResult.point.id}>
        <div><p className="eyebrow">{pointResult.point.id === result.worstPointId ? 'Greatest modelled total' : 'Evaluation point'}</p><h5>{pointResult.point.label}</h5><small>{formatLength(pointResult.point.horizontalDistanceMetres, unitSystem)} horizontal · {formatLength(pointResult.point.heightMetres, unitSystem)} high</small></div>
        <strong>{(pointResult.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}%</strong>
        <span>{statusCopy[pointResult.status][0]}</span>
        <details><summary>Source contributions</summary><ul>{pointResult.sourceResults.map(({ source, screen, separationDistanceMetres }) => <li key={source.id}><b>{source.label}</b><span>{(screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(separationDistanceMetres, unitSystem)} separation · far-field check {formatLength(screen.farFieldBoundaryMetres, unitSystem)}</span></li>)}</ul></details>
        <ul className="project-print-contributions">{pointResult.sourceResults.map(({ source, screen, separationDistanceMetres }) => <li key={source.id}><b>{source.label}</b><span>{(screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(separationDistanceMetres, unitSystem)} separation · far-field check {formatLength(screen.farFieldBoundaryMetres, unitSystem)}</span></li>)}</ul>
      </article>)}</div>
      <div className="project-record-grid"><article><p className="eyebrow">Station sources</p><ul>{sources.map((source) => <li key={source.id}><b>{source.label}</b> · {source.frequencyMHz.toFixed(3)} MHz · {source.transmitterPowerWatts.toFixed(1)} W · {source.dutyCyclePercent.toFixed(1)}% duty · {source.feedSystemLossDb.toFixed(2)} dB loss · {source.antennaGainDbi.toFixed(2)} dBi · {formatLength(source.antennaCentreHeightMetres, unitSystem)} high</li>)}</ul></article><article><p className="eyebrow">Record limits</p><p>Maximum stated gain is applied toward every point. The model uses modified free-space propagation with the 2.56 reflected-field multiplier and does not model antenna patterns, terrain, buildings, body coupling, measurement uncertainty, non-co-located sources, or near fields.</p></article></div>
      <div className="project-provenance"><p><strong>Models:</strong> {EXPOSURE_PROJECT_MODEL.id} {EXPOSURE_PROJECT_MODEL.version} · {EXPOSURE_SCREEN_MODEL.id} {EXPOSURE_SCREEN_MODEL.version} · {EXPOSURE_AGGREGATION_MODEL.id} {EXPOSURE_AGGREGATION_MODEL.version}</p><p><strong>Reviewed:</strong> {EXPOSURE_PROJECT_MODEL.reviewedOn}. This record is a preliminary engineering screen, not certification or a complete compliance determination.</p>{worst && <p><strong>Greatest modelled total:</strong> {worst.point.label}, {(worst.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}% of frequency-normalized reference levels.</p>}</div>
    </div>}
  </section>;
}
