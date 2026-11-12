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
import { compareExposureScenarioInputs, compareExposureScenarios } from '../calculators/exposureScenarioComparison';
import { calculateAssessmentChecklist, type AssessmentEvidenceTarget } from '../calculators/exposureAssessmentChecklist';
import { feetToMetres, formatCoordinate, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import {
  createExposureProjectFile,
  deleteExposureProjectFile,
  exposureProjectFilename,
  getCurrentExposureProjectId,
  loadExposureProjectLibrary,
  parseExposureProjectFile,
  saveExposureProjectFile,
  serializeExposureProjectFile,
  type ExposureEvidenceEntry,
  type ExposureProjectData,
  type ExposureProjectFile
} from '../projects/exposureProjectFiles';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';
import type { StationSourceTransfer } from '../workflows/stationSourceWorkflow';
import { ExposureProjectDiagram } from './ExposureProjectDiagram';
import { SiteLayoutEditor } from './SiteLayoutEditor';
import { AntennaAzimuthDiagram } from './AntennaAzimuthDiagram';
import { AzimuthRouteOverview, AzimuthRouteSummary } from './SourcePointAzimuth';
import { ExposureScenarioComparisonPanel } from './ExposureScenarioComparison';
import { ExposureSensitivityExplorer } from './ExposureSensitivityExplorer';
import { evidenceCategoryLabels, evidenceQualitySummary, evidenceScopeDescription, ExposureEvidenceLog, type EvidenceCaptureRequest } from './ExposureEvidenceLog';
import { AssessmentReadinessPanel } from './AssessmentReadinessPanel';

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
    antennaCentreHeightMetres: 10, eastOffsetMetres: 0, northOffsetMetres: 0,
    patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90
  },
  {
    id: 'project-source-2', label: '70 cm vertical', frequencyMHz: 446,
    transmitterPowerWatts: 25, dutyCyclePercent: 25, feedSystemLossDb: 1.5,
    antennaGainDbi: 5, antennaLargestDimensionMetres: 0.5,
    antennaCentreHeightMetres: 12, eastOffsetMetres: 4, northOffsetMetres: 2,
    patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90
  }
];

const initialPoints: ExposureEvaluationPointInput[] = [
  { id: 'project-point-1', label: 'Yard access', eastOffsetMetres: 15, northOffsetMetres: 0, heightMetres: 1.5 },
  { id: 'project-point-2', label: 'Property line', eastOffsetMetres: 30, northOffsetMetres: 5, heightMetres: 1.5 }
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
    evidenceEntries: [],
    sources: initialSources.map((source) => ({ ...source })),
    evaluationPoints: initialPoints.map((point) => ({ ...point }))
  };
}

const statusCopy = {
  'below-screening-trigger': ['All modelled points are below the screening trigger', 'Every listed location is beyond the conservative far-field boundary and its normalized source total is below the selected review trigger. This is not a compliance determination.'],
  'further-analysis-required': ['Further analysis is required at one or more points', 'At least one location reaches the selected screening trigger. Refine the model, measure the site, or apply appropriate mitigation.'],
  'screening-inconclusive': ['The station source inventory is incomplete', 'Calculated values are displayed as subtotals, but the project cannot be interpreted until all relevant station-site and nearby sources are included.'],
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
  const [evidenceEntries, setEvidenceEntries] = useState<ExposureEvidenceEntry[]>(initialState.file.project.evidenceEntries);
  const [savedProjects, setSavedProjects] = useState(initialState.library);
  const [storageMessage, setStorageMessage] = useState('Changes are saved automatically on this device.');
  const [workflowMessage, setWorkflowMessage] = useState('');
  const [comparisonProjectId, setComparisonProjectId] = useState('');
  const [evidenceCaptureRequest, setEvidenceCaptureRequest] = useState<EvidenceCaptureRequest | null>(null);
  const nextSourceId = useRef(3);
  const nextPointId = useRef(3);
  const evidenceCaptureSequence = useRef(0);
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
    evaluationPoints: points,
    evidenceEntries
  }), [projectTitle, projectJurisdiction, projectEnvironment, sourceInventoryComplete, sources, points, evidenceEntries]);

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
    setEvidenceCaptureRequest(null);
    setCurrentProjectId(file.projectId);
    setProjectTitle(file.project.title);
    setProjectJurisdiction(file.project.jurisdiction);
    setProjectEnvironment(file.project.environment);
    setSources(file.project.sources);
    setPoints(file.project.evaluationPoints);
    setSourceInventoryComplete(file.project.sourceInventoryComplete);
    setEvidenceEntries(file.project.evidenceEntries);
    onJurisdictionChange(file.project.jurisdiction);
    onEnvironmentChange(file.project.environment);
    nextSourceId.current = file.project.sources.length + 1;
    nextPointId.current = file.project.evaluationPoints.length + 1;
  };

  const newProject = () => {
    const file = createExposureProjectFile(starterProject(projectJurisdiction, projectEnvironment), projectId());
    applyProject(file);
    setComparisonProjectId('');
    setStorageMessage('New project started. Changes are saved automatically.');
  };

  const deleteProject = () => {
    if (!window.confirm(`Delete “${projectTitle || 'Untitled station assessment'}” from this device? Export it first if you need a portable copy.`)) return;
    const remaining = deleteExposureProjectFile(currentProjectId, window.localStorage);
    setSavedProjects(remaining);
    if (remaining.length) applyProject(remaining[0]);
    else newProject();
    setComparisonProjectId('');
    setStorageMessage('Project deleted from this device.');
  };

  const duplicateProject = () => {
    const baseline = createExposureProjectFile(projectData, currentProjectId);
    const projects = saveExposureProjectFile(baseline, window.localStorage);
    setSavedProjects(projects);
    const duplicate = createExposureProjectFile({
      ...baseline.project,
      title: `${baseline.project.title} — scenario`,
      sources: baseline.project.sources.map((source) => ({ ...source })),
      evaluationPoints: baseline.project.evaluationPoints.map((point) => ({ ...point })),
      evidenceEntries: baseline.project.evidenceEntries.map((entry) => ({ ...entry, qualityChecks: [...entry.qualityChecks] }))
    }, projectId());
    applyProject(duplicate);
    setComparisonProjectId(baseline.projectId);
    setStorageMessage(`Created “${duplicate.project.title}” as an independent scenario. The original is selected as its comparison baseline.`);
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
      setComparisonProjectId('');
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
  const assessmentChecklist = useMemo(() => calculateAssessmentChecklist(projectData), [projectData]);
  const baselineFile = savedProjects.find((project) => project.projectId === comparisonProjectId) ?? null;
  const scenarioInputChanges = useMemo(() => baselineFile ? compareExposureScenarioInputs(baselineFile.project, projectData) : [], [baselineFile, projectData]);
  const scenarioComparison = useMemo(() => {
    if (!baselineFile || !result) return { comparison: null, error: '' };
    try {
      const baselineResult = calculateExposureProject(baselineFile.project);
      return { comparison: compareExposureScenarios(baselineResult, result), error: '' };
    } catch (error) {
      return { comparison: null, error: error instanceof Error ? error.message : 'The selected scenarios cannot be compared.' };
    }
  }, [baselineFile, result]);

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
    setPoints((current) => [...current, { id, label: `Evaluation point ${current.length + 1}`, eastOffsetMetres: 20, northOffsetMetres: 0, heightMetres: 1.5 }]);
  };
  const preserveRemovedScope = (scopeType: 'source' | 'point', scopeId: string) => {
    setEvidenceEntries((current) => current.map((entry) => entry.scopeType === scopeType && entry.scopeId === scopeId
      ? { ...entry, scopeType: 'project', scopeId: undefined, relatedField: 'general' }
      : entry));
  };
  const documentEvidenceTarget = (target: AssessmentEvidenceTarget) => {
    setEvidenceCaptureRequest({ requestId: ++evidenceCaptureSequence.current, target });
  };
  const status = result ? statusCopy[result.status] : null;
  const worst = result?.pointResults.find((point) => point.point.id === result.worstPointId);

  return <section className="project-section" aria-labelledby="project-heading">
    <div className="section-heading"><div><p className="eyebrow">Integrated station model · printable record</p><h3 id="project-heading">Station assessment project</h3></div><span className="model-badge">Model {EXPOSURE_PROJECT_MODEL.version}</span></div>
    <p className="screen-intro">Position several transmitting antennas and accessible evaluation points across one station site. Three-dimensional source separations flow directly into the normalized total for each location.</p>
    {workflowMessage && <div className="workflow-message" role="status"><strong>Connected source update</strong><span>{workflowMessage}</span></div>}

    <div className="project-editor">
      <section className="project-library" aria-labelledby="project-library-heading">
        <div><p className="eyebrow">On-device project library</p><h4 id="project-library-heading">Saved station projects</h4><p>Your station data stays in this browser unless you export a copy.</p></div>
        <label className="field"><span>Open project</span><select aria-label="Open saved station project" value={currentProjectId} onChange={(event) => { const file = savedProjects.find((project) => project.projectId === event.target.value); if (file) { setComparisonProjectId(''); applyProject(file); } }}>{savedProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.project.title}</option>)}</select></label>
        <div className="project-library-actions">
          <button type="button" onClick={newProject}>New project</button>
          <button type="button" onClick={duplicateProject}>Duplicate as scenario</button>
          <button type="button" onClick={exportProject}>Export JSON</button>
          <label className="project-import-button">Import JSON<input ref={importInput} aria-label="Import project JSON" type="file" accept="application/json,.json" onChange={importProject} /></label>
          <button type="button" className="project-delete-button" onClick={deleteProject}>Delete project</button>
        </div>
        <p className="project-storage-message" aria-live="polite">{storageMessage}</p>
      </section>
      <label className="field project-title-field"><span>Project title</span><input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} /></label>
      <div className="project-coordinate-guide" role="note"><strong>Choose one site origin</strong><span>Enter every antenna and evaluation point using east-positive and north-positive offsets from the same convenient reference, such as a mast base or building corner. Negative coordinates are valid.</span></div>
      <SiteLayoutEditor sources={sources} points={points} unitSystem={unitSystem} onSourcePositionChange={(id, eastOffsetMetres, northOffsetMetres) => updateSource(id, { eastOffsetMetres, northOffsetMetres })} onPointPositionChange={(id, eastOffsetMetres, northOffsetMetres) => updatePoint(id, { eastOffsetMetres, northOffsetMetres })} />
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
          <label className="field"><span>East position</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} east position`} type="number" step="0.1" value={Number(displayLength(source.eastOffsetMetres).toFixed(3))} onChange={(event) => updateSource(source.id, { eastOffsetMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
          <label className="field"><span>North position</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} north position`} type="number" step="0.1" value={Number(displayLength(source.northOffsetMetres).toFixed(3))} onChange={(event) => updateSource(source.id, { northOffsetMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        </div>
        <div className="azimuth-source-editor">
          <div className="azimuth-source-controls">
            <p className="eyebrow">Plan-view orientation</p>
            <label className="field"><span>Azimuth pattern</span><select aria-label={`Project source ${index + 1} azimuth pattern`} value={source.patternType} onChange={(event) => updateSource(source.id, { patternType: event.target.value as ExposureProjectSourceInput['patternType'] })}><option value="unknown">Unknown / conservative</option><option value="omnidirectional">Omnidirectional</option><option value="bidirectional">Bidirectional</option><option value="directional">Directional</option></select></label>
            <label className="field"><span>Maximum-response bearing</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} bearing`} type="number" min="0" max="359.9" step="1" disabled={source.patternType === 'unknown' || source.patternType === 'omnidirectional'} value={source.bearingDegrees} onChange={(event) => updateSource(source.id, { bearingDegrees: Number(event.target.value) })} /><span>° true</span></span></label>
            <label className="bearing-slider"><span>Rotate pattern</span><input aria-label={`Project source ${index + 1} bearing control`} type="range" min="0" max="359" step="1" disabled={source.patternType === 'unknown' || source.patternType === 'omnidirectional'} value={source.bearingDegrees} onChange={(event) => updateSource(source.id, { bearingDegrees: Number(event.target.value) })} /></label>
            <label className="field"><span>Approximate horizontal beamwidth</span><span className="input-with-unit"><input aria-label={`Project source ${index + 1} beamwidth`} type="number" min="1" max="359.9" step="1" disabled={source.patternType === 'unknown' || source.patternType === 'omnidirectional'} value={source.beamwidthDegrees} onChange={(event) => updateSource(source.id, { beamwidthDegrees: Number(event.target.value) })} /><span>°</span></span><small>Enter the manufacturer’s horizontal half-power beamwidth when known.</small></label>
          </div>
          <AntennaAzimuthDiagram source={source} />
        </div>
        <button type="button" className="remove-source" disabled={sources.length === 1} onClick={() => { setSources((current) => current.filter((candidate) => candidate.id !== source.id)); preserveRemovedScope('source', source.id); setSourceInventoryComplete(false); }}>Remove source</button>
      </details>)}</div>

      <div className="project-editor-heading"><div><p className="eyebrow">Accessible locations</p><h4>Evaluation points</h4></div><button type="button" className="add-source" disabled={points.length >= 12} onClick={addPoint}>+ Add evaluation point</button></div>
      <div className="project-point-list">{points.map((point, index) => <fieldset key={point.id} className="project-point-editor"><legend>Point {index + 1}</legend>
        <label className="field"><span>Location label</span><input aria-label={`Project point ${index + 1} label`} value={point.label} onChange={(event) => updatePoint(point.id, { label: event.target.value })} /></label>
        <label className="field"><span>East position</span><span className="input-with-unit"><input aria-label={`Project point ${index + 1} east position`} type="number" step="0.1" value={Number(displayLength(point.eastOffsetMetres).toFixed(3))} onChange={(event) => updatePoint(point.id, { eastOffsetMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        <label className="field"><span>North position</span><span className="input-with-unit"><input aria-label={`Project point ${index + 1} north position`} type="number" step="0.1" value={Number(displayLength(point.northOffsetMetres).toFixed(3))} onChange={(event) => updatePoint(point.id, { northOffsetMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        <label className="field"><span>Point height</span><span className="input-with-unit"><input aria-label={`Project point ${index + 1} height`} type="number" min="0" step="0.1" value={Number(displayLength(point.heightMetres).toFixed(3))} onChange={(event) => updatePoint(point.id, { heightMetres: readLength(Number(event.target.value)) })} /><span>{lengthUnit}</span></span></label>
        <button type="button" className="remove-source" disabled={points.length === 1} onClick={() => { setPoints((current) => current.filter((candidate) => candidate.id !== point.id)); preserveRemovedScope('point', point.id); }}>Remove point</button>
      </fieldset>)}</div>
      <ExposureEvidenceLog key={currentProjectId} entries={evidenceEntries} sources={sources} points={points} onChange={setEvidenceEntries} captureRequest={evidenceCaptureRequest} />
      <label className="inventory-confirmation"><input type="checkbox" checked={sourceInventoryComplete} onChange={(event) => setSourceInventoryComplete(event.target.checked)} /><span><strong>Station-site source inventory assessed</strong><small>I have included all relevant transmitters and antennas at this station site. Nearby sources outside the modelled site still require separate assessment.</small></span></label>
    </div>

    {!result && <p className="validation-message" role="alert">One or more project inputs are invalid or outside the selected jurisdiction’s power-density model. No project result is produced.</p>}
    <AssessmentReadinessPanel checklist={assessmentChecklist} onDocumentTarget={documentEvidenceTarget} />
    {result && status && <div className="project-report" aria-label="Printable exposure assessment record">
      <div className="project-report-heading"><div><p className="eyebrow">Assessment record</p><h4>{projectTitle || 'Untitled station assessment'}</h4><p>{projectJurisdiction === 'CA' ? 'Canada' : 'United States'} · {projectEnvironment === 'uncontrolled' ? 'General public / uncontrolled' : 'Occupational / controlled'} · {sources.length} sources · {points.length} locations</p></div><div className="project-actions"><button type="button" onClick={() => window.print()}>Print assessment</button></div></div>
      <div className={`screen-outcome screen-outcome-${result.status}`} role="status"><p className="eyebrow">Project outcome</p><h4>{status[0]}</h4><p>{status[1]}</p></div>
      <ExposureProjectDiagram result={result} unitSystem={unitSystem} />
      {worst && <AzimuthRouteOverview pointLabel={worst.point.label} sourceResults={worst.sourceResults} />}
      <ExposureSensitivityExplorer project={projectData} unitSystem={unitSystem} />
      <div className="project-point-results">{result.pointResults.map((pointResult) => <article className={pointResult.point.id === result.worstPointId ? 'project-worst-point' : ''} key={pointResult.point.id}>
        <div><p className="eyebrow">{pointResult.point.id === result.worstPointId ? 'Greatest modelled total' : 'Evaluation point'}</p><h5>{pointResult.point.label}</h5><small>E {formatCoordinate(pointResult.point.eastOffsetMetres, unitSystem)} · N {formatCoordinate(pointResult.point.northOffsetMetres, unitSystem)} · {formatLength(pointResult.point.heightMetres, unitSystem)} high</small></div>
        <strong>{(pointResult.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}%</strong>
        <span>{statusCopy[pointResult.status][0]}</span>
        <details><summary>Source contributions</summary><ul>{pointResult.sourceResults.map((sourceResult) => <li key={sourceResult.source.id}><b>{sourceResult.source.label}</b><span>{(sourceResult.screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {sourceResult.screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(sourceResult.horizontalSeparationMetres, unitSystem)} plan / {formatLength(sourceResult.separationDistanceMetres, unitSystem)} 3D separation · far-field check {formatLength(sourceResult.screen.farFieldBoundaryMetres, unitSystem)}</span><AzimuthRouteSummary result={sourceResult} /></li>)}</ul></details>
        <ul className="project-print-contributions">{pointResult.sourceResults.map((sourceResult) => <li key={sourceResult.source.id}><b>{sourceResult.source.label}</b><span>{(sourceResult.screen.fractionOfReferenceLevel * 100).toFixed(2)}% · {sourceResult.screen.estimatedPowerDensityWattsPerSquareMetre.toPrecision(4)} W/m² · {formatLength(sourceResult.horizontalSeparationMetres, unitSystem)} plan / {formatLength(sourceResult.separationDistanceMetres, unitSystem)} 3D separation · far-field check {formatLength(sourceResult.screen.farFieldBoundaryMetres, unitSystem)}</span><AzimuthRouteSummary result={sourceResult} /></li>)}</ul>
      </article>)}</div>
      <ExposureScenarioComparisonPanel currentTitle={projectTitle || 'Untitled station assessment'} baselineTitle={baselineFile?.project.title ?? null} baselineOptions={savedProjects.filter((project) => project.projectId !== currentProjectId).map((project) => ({ id: project.projectId, title: project.project.title }))} selectedBaselineId={comparisonProjectId} comparison={scenarioComparison.comparison} comparisonError={scenarioComparison.error} inputChanges={scenarioInputChanges} unitSystem={unitSystem} onBaselineChange={setComparisonProjectId} />
      <section className="evidence-record" aria-labelledby="evidence-record-heading"><div><p className="eyebrow">Assessment basis</p><h5 id="evidence-record-heading">Evidence and review log</h5><p>{evidenceEntries.length ? `${evidenceEntries.length} documented ${evidenceEntries.length === 1 ? 'entry' : 'entries'}.` : 'No supporting evidence or review notes have been recorded.'}</p></div>{evidenceEntries.length > 0 && <ol>{evidenceEntries.map((entry) => { const quality = evidenceQualitySummary(entry); return <li key={entry.id}><span>{evidenceCategoryLabels[entry.category]}</span><b>{evidenceScopeDescription(entry, sources, points)}</b><h6>{entry.title}</h6><p>{entry.detail}</p><p><strong>Self-declared record quality:</strong> {quality.recordedCount} of {quality.totalCount} prompts recorded{quality.complete ? '.' : `. Follow-up: ${quality.missing.map((prompt) => prompt.label).join('; ')}.`}</p><small>Reviewed <time dateTime={entry.recordedOn}>{entry.recordedOn}</time> by {entry.reviewer}</small>{entry.referenceUrl && <a href={entry.referenceUrl} target="_blank" rel="noreferrer">{entry.referenceUrl}</a>}</li>; })}</ol>}<small>Recorded evidence and self-declared quality prompts improve traceability but do not by themselves validate assumptions, measurements, or compliance.</small></section>
      <div className="project-record-grid"><article><p className="eyebrow">Station sources</p><ul>{sources.map((source) => <li key={source.id}><b>{source.label}</b> · {source.frequencyMHz.toFixed(3)} MHz · {source.transmitterPowerWatts.toFixed(1)} W · {source.dutyCyclePercent.toFixed(1)}% duty · {source.feedSystemLossDb.toFixed(2)} dB loss · {source.antennaGainDbi.toFixed(2)} dBi · E {formatCoordinate(source.eastOffsetMetres, unitSystem)} · N {formatCoordinate(source.northOffsetMetres, unitSystem)} · {formatLength(source.antennaCentreHeightMetres, unitSystem)} high · {source.patternType}{source.patternType === 'directional' || source.patternType === 'bidirectional' ? `, ${source.bearingDegrees.toFixed(0)}° true / ${source.beamwidthDegrees.toFixed(0)}° beamwidth` : ''}{source.linkedModels && <> · linked models: {source.linkedModels.antennaDesignId} {source.linkedModels.antennaDesignVersion}, {source.linkedModels.feedSystemId} {source.linkedModels.feedSystemVersion}</>}</li>)}</ul></article><article><p className="eyebrow">Record limits</p><p>Pattern graphics are orientation aids only; maximum stated gain is still applied toward every point. Antennas are treated as point sources at the entered coordinates. The model uses modified free-space propagation with the 2.56 reflected-field multiplier and does not apply pattern attenuation or model terrain, buildings, body coupling, measurement uncertainty, off-site sources, or near fields.</p></article></div>
      <div className="project-provenance"><p><strong>Models:</strong> {EXPOSURE_PROJECT_MODEL.id} {EXPOSURE_PROJECT_MODEL.version} · {EXPOSURE_SCREEN_MODEL.id} {EXPOSURE_SCREEN_MODEL.version} · {EXPOSURE_AGGREGATION_MODEL.id} {EXPOSURE_AGGREGATION_MODEL.version}</p><p><strong>Reviewed:</strong> {EXPOSURE_PROJECT_MODEL.reviewedOn}. This record is a preliminary engineering screen, not certification or a complete compliance determination.</p>{worst && <p><strong>Greatest modelled total:</strong> {worst.point.label}, {(worst.aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}% of frequency-normalized reference levels.</p>}</div>
    </div>}
  </section>;
}
