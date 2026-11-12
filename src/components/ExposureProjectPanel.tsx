/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  calculateExposureProject,
  EXPOSURE_PROJECT_MODEL,
  type ExposureEvaluationPointInput,
  type ExposureProjectSourceInput
} from '../calculators/exposureProject';
import { EXPOSURE_AGGREGATION_MODEL } from '../calculators/exposureAggregation';
import { EXPOSURE_SCREEN_MODEL } from '../calculators/exposureScreen';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import {
  createExposureProjectFile,
  deleteExposureProjectFile,
  exposureProjectFilename,
  getCurrentExposureProjectId,
  loadExposureProjectLibrary,
  parseExposureProjectFile,
  saveExposureProjectFile,
  serializeExposureProjectFile,
  type ExposureProjectData,
  type ExposureProjectFile
} from '../projects/exposureProjectFiles';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';
import type { StationSourceTransfer } from '../workflows/stationSourceWorkflow';
import { ExposureProjectDiagram } from './ExposureProjectDiagram';

interface Props {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  unitSystem: UnitSystem;
  onJurisdictionChange: (jurisdiction: ExposureJurisdiction) => void;
  onEnvironmentChange: (environment: ExposureEnvironment) => void;
  incomingSource: StationSourceTransfer | null;
  onSourceConsumed: () => void;
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

function projectId() {
  return globalThis.crypto?.randomUUID?.() ?? `station-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function starterProject(jurisdiction: ExposureJurisdiction, environment: ExposureEnvironment): ExposureProjectData {
  return {
    title: 'Home station RF assessment',
    jurisdiction,
    environment,
    sourceInventoryComplete: false,
    sources: initialSources.map((source) => ({ ...source })),
    evaluationPoints: initialPoints.map((point) => ({ ...point }))
  };
}

const statusCopy = {
  'below-screening-trigger': ['All modelled points are below the screening trigger', 'Every listed location is beyond the conservative far-field boundary and its normalized source total is below the selected review trigger. This is not a compliance determination.'],
  'further-analysis-required': ['Further analysis is required at one or more points', 'At least one location reaches the selected screening trigger. Refine the model, measure the site, or apply appropriate mitigation.'],
  'screening-inconclusive': ['The station source inventory is incomplete', 'Calculated values are displayed as subtotals, but the project cannot be interpreted until all relevant station and co-located sources are included.'],
  'method-inapplicable': ['Far-field screening is inapplicable at one or more points', 'At least one source–location path lies inside its conservative far-field boundary. That location requires a suitable near-field method or measurement.']
} as const;

export function ExposureProjectPanel({ jurisdiction, environment, unitSystem, onJurisdictionChange, onEnvironmentChange, incomingSource, onSourceConsumed }: Props) {
  const initialState = useMemo(() => {
    const library = loadExposureProjectLibrary(window.localStorage);
    const currentId = getCurrentExposureProjectId(window.localStorage);
    const file = library.find((project) => project.projectId === currentId) ?? library[0]
      ?? createExposureProjectFile(starterProject(jurisdiction, environment), projectId());
    return { library, file };
  }, []);
  const [currentProjectId, setCurrentProjectId] = useState(initialState.file.projectId);
  const [projectTitle, setProjectTitle] = useState(initialState.file.project.title);
  const [projectJurisdiction, setProjectJurisdiction] = useState(initialState.file.project.jurisdiction);
  const [projectEnvironment, setProjectEnvironment] = useState(initialState.file.project.environment);
  const [sources, setSources] = useState(initialState.file.project.sources);
  const [points, setPoints] = useState(initialState.file.project.evaluationPoints);
  const [sourceInventoryComplete, setSourceInventoryComplete] = useState(initialState.file.project.sourceInventoryComplete);
  const [savedProjects, setSavedProjects] = useState(initialState.library);
  const [storageMessage, setStorageMessage] = useState('Changes are saved automatically on this device.');
  const [workflowMessage, setWorkflowMessage] = useState('');
  const nextSourceId = useRef(3);
  const nextPointId = useRef(3);
  const importInput = useRef<HTMLInputElement>(null);
  const lastExternalJurisdiction = useRef(jurisdiction);
  const lastExternalEnvironment = useRef(environment);
  const lastTransferId = useRef<string | null>(null);
  const projectData = useMemo<ExposureProjectData>(() => ({
    title: projectTitle || 'Untitled station assessment',
    jurisdiction: projectJurisdiction,
    environment: projectEnvironment,
    sourceInventoryComplete,
    sources,
    evaluationPoints: points
  }), [projectTitle, projectJurisdiction, projectEnvironment, sourceInventoryComplete, sources, points]);

  useEffect(() => {
    if (jurisdiction === lastExternalJurisdiction.current) return;
    lastExternalJurisdiction.current = jurisdiction;
    setProjectJurisdiction(jurisdiction);
  }, [jurisdiction]);

  useEffect(() => {
    if (environment === lastExternalEnvironment.current) return;
    lastExternalEnvironment.current = environment;
    setProjectEnvironment(environment);
  }, [environment]);

  useEffect(() => {
    onJurisdictionChange(projectJurisdiction);
    onEnvironmentChange(projectEnvironment);
  }, []);

  useEffect(() => {
    if (!incomingSource || incomingSource.transferId === lastTransferId.current) return;
    lastTransferId.current = incomingSource.transferId;
    if (sources.length >= 8) {
      setWorkflowMessage('The linked source was not added because this project already has eight station sources.');
      onSourceConsumed();
      return;
    }
    let sequence = sources.length + 1;
    let id = `project-source-${sequence}`;
    while (sources.some((source) => source.id === id)) id = `project-source-${++sequence}`;
    setSources([...sources, { ...incomingSource.source, id }]);
    setSourceInventoryComplete(false);
    setWorkflowMessage(`Added “${incomingSource.source.label}” from the connected antenna and feed-system workflow. Review the source and complete station inventory before interpreting the result.`);
    onSourceConsumed();
  }, [incomingSource, onSourceConsumed, sources]);

  useEffect(() => {
    try {
      const file = createExposureProjectFile(projectData, currentProjectId);
      const projects = saveExposureProjectFile(file, window.localStorage);
      setSavedProjects(projects);
      const stored = loadExposureProjectLibrary(window.localStorage).some((project) =>
        project.projectId === file.projectId && project.savedAt === file.savedAt
      );
      setStorageMessage(stored
        ? `Saved locally at ${new Date(file.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        : 'Browser storage is unavailable. Export a JSON copy to preserve this project.');
    } catch {
      setStorageMessage('This project contains invalid inputs and has not been saved.');
    }
  }, [currentProjectId, projectData]);

  const applyProject = (file: ExposureProjectFile) => {
    setCurrentProjectId(file.projectId);
    setProjectTitle(file.project.title);
    setProjectJurisdiction(file.project.jurisdiction);
    setProjectEnvironment(file.project.environment);
    setSources(file.project.sources);
    setPoints(file.project.evaluationPoints);
    setSourceInventoryComplete(file.project.sourceInventoryComplete);
    onJurisdictionChange(file.project.jurisdiction);
    onEnvironmentChange(file.project.environment);
    nextSourceId.current = file.project.sources.length + 1;
    nextPointId.current = file.project.evaluationPoints.length + 1;
  };

  const newProject = () => {
    const file = createExposureProjectFile(starterProject(projectJurisdiction, projectEnvironment), projectId());
    applyProject(file);
    setStorageMessage('New project started. Changes are saved automatically.');
  };

  const deleteProject = () => {
    if (!window.confirm(`Delete “${projectTitle || 'Untitled station assessment'}” from this device? Export it first if you need a portable copy.`)) return;
    const remaining = deleteExposureProjectFile(currentProjectId, window.localStorage);
    setSavedProjects(remaining);
    if (remaining.length) applyProject(remaining[0]);
    else newProject();
    setStorageMessage('Project deleted from this device.');
  };

  const exportProject = () => {
    const file = createExposureProjectFile(projectData, currentProjectId);
    const url = URL.createObjectURL(new Blob([serializeExposureProjectFile(file)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exposureProjectFilename(file.project.title);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStorageMessage('Portable project copy exported.');
  };

  const importProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseExposureProjectFile(await file.text());
      const localCopy = createExposureProjectFile(imported.project, projectId());
      applyProject(localCopy);
      setStorageMessage(`Imported “${localCopy.project.title}” as a new local project.`);
    } catch (error) {
      setStorageMessage(error instanceof Error ? `Import failed: ${error.message}` : 'Import failed: invalid project file.');
    } finally {
      event.target.value = '';
    }
  };

  const result = useMemo(() => {
    try {
      return calculateExposureProject({ jurisdiction: projectJurisdiction, environment: projectEnvironment, sourceInventoryComplete, sources, evaluationPoints: points });
    } catch {
      return null;
    }
  }, [projectJurisdiction, projectEnvironment, sourceInventoryComplete, sources, points]);

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
    let id = `project-source-${nextSourceId.current++}`;
    while (sources.some((source) => source.id === id)) id = `project-source-${nextSourceId.current++}`;
    setSources((current) => [...current, {
      ...initialSources[0], id, label: `Station source ${current.length + 1}`
    }]);
    setSourceInventoryComplete(false);
  };
  const addPoint = () => {
    let id = `project-point-${nextPointId.current++}`;
    while (points.some((point) => point.id === id)) id = `project-point-${nextPointId.current++}`;
    setPoints((current) => [...current, { id, label: `Evaluation point ${current.length + 1}`, horizontalDistanceMetres: 20, heightMetres: 1.5 }]);
  };
  const status = result ? statusCopy[result.status] : null;
  const worst = result?.pointResults.find((point) => point.point.id === result.worstPointId);

  return <section className="project-section" aria-labelledby="project-heading">
    <div className="section-heading"><div><p className="eyebrow">Integrated station model · printable record</p><h3 id="project-heading">Station assessment project</h3></div><span className="model-badge">Model {EXPOSURE_PROJECT_MODEL.version}</span></div>
    <p className="screen-intro">Model several transmitters on one common antenna support across several accessible locations. Calculated source contributions flow directly into the normalized total for each location.</p>
    {workflowMessage && <div className="workflow-message" role="status"><strong>Connected source update</strong><span>{workflowMessage}</span></div>}

    <div className="project-editor">
      <section className="project-library" aria-labelledby="project-library-heading">
        <div><p className="eyebrow">On-device project library</p><h4 id="project-library-heading">Saved station projects</h4><p>Your station data stays in this browser unless you export a copy.</p></div>
        <label className="field"><span>Open project</span><select aria-label="Open saved station project" value={currentProjectId} onChange={(event) => { const file = savedProjects.find((project) => project.projectId === event.target.value); if (file) applyProject(file); }}>{savedProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.project.title}</option>)}</select></label>
        <div className="project-library-actions">
          <button type="button" onClick={newProject}>New project</button>
          <button type="button" onClick={exportProject}>Export JSON</button>
          <label className="project-import-button">Import JSON<input ref={importInput} aria-label="Import project JSON" type="file" accept="application/json,.json" onChange={importProject} /></label>
          <button type="button" className="project-delete-button" onClick={deleteProject}>Delete project</button>
        </div>
        <p className="project-storage-message" aria-live="polite">{storageMessage}</p>
      </section>
      <label className="field project-title-field"><span>Project title</span><input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} /></label>
      <div className="project-editor-heading"><div><p className="eyebrow">Station sources</p><h4>Transmitters and antennas</h4></div><button type="button" className="add-source" disabled={sources.length >= 8} onClick={addSource}>+ Add station source</button></div>
      <div className="project-source-list">{sources.map((source, index) => <details key={source.id} className="project-source-editor">
        <summary><span><strong>{source.label || `Source ${index + 1}`}</strong><small>{source.frequencyMHz || 0} MHz · {source.transmitterPowerWatts || 0} W{source.linkedModels ? ' · linked workflow' : ''}</small></span><b>Source {index + 1}</b></summary>
        {source.linkedModels && <p className="linked-source-note"><strong>Linked models:</strong> {source.linkedModels.antennaDesignId} {source.linkedModels.antennaDesignVersion} · {source.linkedModels.feedSystemId} {source.linkedModels.feedSystemVersion}. Review all transferred values against the installed system.</p>}
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
      <div className="project-report-heading"><div><p className="eyebrow">Assessment record</p><h4>{projectTitle || 'Untitled station assessment'}</h4><p>{projectJurisdiction === 'CA' ? 'Canada' : 'United States'} · {projectEnvironment === 'uncontrolled' ? 'General public / uncontrolled' : 'Occupational / controlled'} · {sources.length} sources · {points.length} locations</p></div><div className="project-actions"><button type="button" onClick={() => window.print()}>Print assessment</button></div></div>
      <div className={`screen-outcome screen-outcome-${result.status}`} role="status"><p className="eyebrow">Project outcome</p><h4>{status[0]}</h4><p>{status[1]}</p></div>
      <ExposureProjectDiagram result={result} unitSystem={unitSystem} />
      <div className="project-point-results">{result.pointResults.map((pointResult) => <article className={pointResult.point.id === result.worstPointId ? 'project-worst-point' : ''} key={pointResult.point.id}>
        <div><p className="eyebrow">{pointResult.point.id === result.worstPointId ? 'Greatest modelled total' : 'Evaluation point'}</p><h5>{pointResult.point.label}</h5><small>{formatLength(pointResult.point.horizontalDistanceMetres, unitSystem)} horizontal · {formatLength(pointResult.point.heightMetres, unitSystem)} high</small></div>
        <strong>{(pointResult.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}%</strong>
        <span>{statusCopy[pointResult.status][0]}</span>
        <details><summary>Source contributions</summary><ul>{pointResult.sourceResults.map(({ source, screen, separationDistanceMetres }) => <li key={source.id}><b>{source.label}</b><span>{(screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(separationDistanceMetres, unitSystem)} separation · far-field check {formatLength(screen.farFieldBoundaryMetres, unitSystem)}</span></li>)}</ul></details>
        <ul className="project-print-contributions">{pointResult.sourceResults.map(({ source, screen, separationDistanceMetres }) => <li key={source.id}><b>{source.label}</b><span>{(screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(separationDistanceMetres, unitSystem)} separation · far-field check {formatLength(screen.farFieldBoundaryMetres, unitSystem)}</span></li>)}</ul>
      </article>)}</div>
      <div className="project-record-grid"><article><p className="eyebrow">Station sources</p><ul>{sources.map((source) => <li key={source.id}><b>{source.label}</b> · {source.frequencyMHz.toFixed(3)} MHz · {source.transmitterPowerWatts.toFixed(1)} W · {source.dutyCyclePercent.toFixed(1)}% duty · {source.feedSystemLossDb.toFixed(2)} dB loss · {source.antennaGainDbi.toFixed(2)} dBi · {formatLength(source.antennaCentreHeightMetres, unitSystem)} high{source.linkedModels && <> · linked models: {source.linkedModels.antennaDesignId} {source.linkedModels.antennaDesignVersion}, {source.linkedModels.feedSystemId} {source.linkedModels.feedSystemVersion}</>}</li>)}</ul></article><article><p className="eyebrow">Record limits</p><p>Maximum stated gain is applied toward every point. The model uses modified free-space propagation with the 2.56 reflected-field multiplier and does not model antenna patterns, terrain, buildings, body coupling, measurement uncertainty, non-co-located sources, or near fields.</p></article></div>
      <div className="project-provenance"><p><strong>Models:</strong> {EXPOSURE_PROJECT_MODEL.id} {EXPOSURE_PROJECT_MODEL.version} · {EXPOSURE_SCREEN_MODEL.id} {EXPOSURE_SCREEN_MODEL.version} · {EXPOSURE_AGGREGATION_MODEL.id} {EXPOSURE_AGGREGATION_MODEL.version}</p><p><strong>Reviewed:</strong> {EXPOSURE_PROJECT_MODEL.reviewedOn}. This record is a preliminary engineering screen, not certification or a complete compliance determination.</p>{worst && <p><strong>Greatest modelled total:</strong> {worst.point.label}, {(worst.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}% of frequency-normalized reference levels.</p>}</div>
    </div>}
  </section>;
}
