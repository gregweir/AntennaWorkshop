/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ANTENNA_DESIGNS, type AntennaType } from '../lib/antennaDesignCatalog';
import type { UnitSystem } from '../lib/units';
import {
  ANTENNA_PLAN_KIND,
  ANTENNA_PLAN_MEASUREMENT_LIMIT,
  ANTENNA_PROJECT_STAGES,
  ANTENNA_PLAN_VERSION,
  antennaPlanFilename,
  deleteAntennaPlan,
  loadAntennaPlans,
  parseAntennaPlan,
  saveAntennaPlan,
  serializeAntennaPlan,
  type AntennaPlan,
  type AntennaPlanBuildRecord,
  type AntennaPlanMeasurementRecord,
  type AntennaPlanSweepReference,
  type AntennaProjectStage,
  type AntennaPlanWorkspace
} from '../projects/antennaPlans';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import type { MeasurementSweepHandoff } from '../workflows/measurementWorkflow';

interface Props {
  antennaType: AntennaType;
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  modelId: string;
  modelVersion: string;
  workspace: AntennaPlanWorkspace;
  onOpen: (plan: AntennaPlan) => void;
  onAnalyzeSweep: (handoff: MeasurementSweepHandoff) => void;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function localDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatRecordedFrequency(frequencyHz: number) {
  return frequencyHz >= 1e9 ? `${(frequencyHz / 1e9).toFixed(6)} GHz` : frequencyHz >= 1e6 ? `${(frequencyHz / 1e6).toFixed(3)} MHz` : `${(frequencyHz / 1e3).toFixed(3)} kHz`;
}

function localDateTimeInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyMeasurementDraft() {
  return { label: '', recordedAt: localDateTimeInput(), calibrationContext: '', referencePlane: '', installedGeometry: '', adjustment: '', observations: '' };
}

async function createSweepReference(file: File): Promise<AntennaPlanSweepReference> {
  if (!file.name.toLowerCase().endsWith('.s1p')) throw new TypeError('Choose a one-port Touchstone file with the .s1p extension.');
  if (file.size > 2_000_000) throw new RangeError('The file exceeds the 2 MB local reference limit.');
  const lastModifiedAt = file.lastModified > 0 ? new Date(file.lastModified).toISOString() : null;
  if (!globalThis.crypto?.subtle) return { name: file.name, sizeBytes: file.size, lastModifiedAt, sha256: null };
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { name: file.name, sizeBytes: file.size, lastModifiedAt, sha256 };
}

const projectStageDetails: Record<AntennaProjectStage, { label: string; detail: string }> = {
  choose: { label: 'Choose', detail: 'Antenna family and intended use selected.' },
  plan: { label: 'Plan', detail: 'Starting dimensions and construction assumptions saved.' },
  build: { label: 'Build', detail: 'As-built dimensions and departures recorded.' },
  measure: { label: 'Measure', detail: 'Installed response measured at a documented reference plane.' },
  tune: { label: 'Tune', detail: 'Adjustments and resulting measurements recorded.' },
  verify: { label: 'Verify', detail: 'Final bands, feed system, installation, and applicable safety work checked.' },
  document: { label: 'Document', detail: 'Portable records retained with the finished antenna.' }
};

export function AntennaPlanLibrary({ antennaType, jurisdiction, unitSystem, modelId, modelVersion, workspace, onOpen, onAnalyzeSweep }: Props) {
  const initialPlans = useMemo(() => loadAntennaPlans(window.localStorage), []);
  const [plans, setPlans] = useState(initialPlans);
  const [selectedId, setSelectedId] = useState(initialPlans[0]?.id ?? '');
  const [name, setName] = useState(`${ANTENNA_DESIGNS[antennaType].short} plan`);
  const [message, setMessage] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const selected = plans.find((plan) => plan.id === selectedId);
  const [buildRecordDraft, setBuildRecordDraft] = useState<AntennaPlanBuildRecord>(selected?.buildRecord ?? { asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' });
  const [measurementDraft, setMeasurementDraft] = useState(emptyMeasurementDraft);
  const [measurementSweep, setMeasurementSweep] = useState<AntennaPlanSweepReference | null>(null);
  const [measurementFile, setMeasurementFile] = useState<File | null>(null);
  const measurementFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBuildRecordDraft(selected?.buildRecord ?? { asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' });
    setMeasurementDraft(emptyMeasurementDraft());
    setMeasurementSweep(null);
    setMeasurementFile(null);
    if (measurementFileInput.current) measurementFileInput.current.value = '';
  }, [selected]);

  const storeNew = (planName: string, sourceWorkspace = workspace) => {
    const now = new Date().toISOString();
    const plan: AntennaPlan = {
      kind: ANTENNA_PLAN_KIND,
      schemaVersion: ANTENNA_PLAN_VERSION,
      id: newId(),
      name: planName.trim(),
      createdAt: now,
      updatedAt: now,
      antennaType,
      jurisdiction,
      unitSystem,
      modelId,
      modelVersion,
      progress: { completedStages: ['choose', 'plan'] },
      buildRecord: { asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' },
      measurements: [],
      workspace: sourceWorkspace
    };
    const next = saveAntennaPlan(plan, window.localStorage);
    setPlans(next);
    setSelectedId(plan.id);
    return plan;
  };

  const saveCurrent = () => {
    if (!name.trim()) {
      setMessage('Enter a plan name before saving.');
      return;
    }
    try {
      storeNew(name);
      setMessage('New plan saved in this browser');
    } catch {
      setMessage('The plan could not be saved. Download or print a copy before leaving this page.');
    }
  };

  const openSelected = () => {
    if (!selected) return;
    onOpen(selected);
    setName(selected.name);
    setMessage(`Opened ${selected.name}`);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    try {
      const now = new Date().toISOString();
      const copy = { ...selected, id: newId(), name: `${selected.name} (copy)`, createdAt: now, updatedAt: now };
      const next = saveAntennaPlan(copy, window.localStorage);
      setPlans(next);
      setSelectedId(copy.id);
      setMessage('Plan duplicated as a separate copy');
    } catch {
      setMessage('The selected plan could not be duplicated.');
    }
  };

  const removeSelected = () => {
    if (!selected || !window.confirm(`Delete “${selected.name}” from this browser?`)) return;
    const next = deleteAntennaPlan(selected.id, window.localStorage);
    setPlans(next);
    setSelectedId(next[0]?.id ?? '');
    setMessage('Saved plan deleted');
  };

  const toggleProjectStage = (stage: AntennaProjectStage) => {
    if (!selected || stage === 'choose' || stage === 'plan') return;
    try {
      const completed = selected.progress.completedStages.includes(stage)
        ? selected.progress.completedStages.filter((candidate) => candidate !== stage)
        : [...selected.progress.completedStages, stage];
      const updated: AntennaPlan = {
        ...selected,
        updatedAt: new Date().toISOString(),
        progress: { completedStages: ANTENNA_PROJECT_STAGES.filter((candidate) => completed.includes(candidate)) }
      };
      setPlans(saveAntennaPlan(updated, window.localStorage));
      setMessage(`${projectStageDetails[stage].label} progress updated`);
    } catch {
      setMessage('Project progress could not be saved. Download the plan before leaving this page.');
    }
  };

  const updateBuildRecordDraft = (field: keyof AntennaPlanBuildRecord, value: string) => {
    setBuildRecordDraft((current) => ({ ...current, [field]: value }));
  };

  const saveBuildRecord = () => {
    if (!selected) return;
    try {
      const updated: AntennaPlan = { ...selected, updatedAt: new Date().toISOString(), buildRecord: buildRecordDraft };
      setPlans(saveAntennaPlan(updated, window.localStorage));
      setMessage('Build and commissioning record saved');
    } catch {
      setMessage('The build record could not be saved. Download or copy important notes before leaving this page.');
    }
  };

  const updateMeasurementDraft = (field: keyof ReturnType<typeof emptyMeasurementDraft>, value: string) => {
    setMeasurementDraft((current) => ({ ...current, [field]: value }));
  };

  const selectMeasurementSweep = async (file?: File) => {
    if (!file) {
      setMeasurementSweep(null);
      setMeasurementFile(null);
      return;
    }
    try {
      const reference = await createSweepReference(file);
      setMeasurementSweep(reference);
      setMeasurementFile(file);
      setMessage(reference.sha256 ? 'Sweep fingerprint calculated; file contents were not stored' : 'Sweep filename and size recorded; SHA-256 is unavailable in this browser context');
    } catch (error) {
      setMeasurementSweep(null);
      setMeasurementFile(null);
      if (measurementFileInput.current) measurementFileInput.current.value = '';
      setMessage(error instanceof Error ? error.message : 'The sweep reference could not be created.');
    }
  };

  const saveMeasurementRecord = (analyzeAfterSave = false) => {
    if (!selected) return;
    if (!measurementDraft.label.trim()) {
      setMessage('Enter a measurement label before saving.');
      return;
    }
    const recordedAt = new Date(measurementDraft.recordedAt);
    if (!Number.isFinite(recordedAt.getTime())) {
      setMessage('Enter a valid measurement date and time.');
      return;
    }
    try {
      const record: AntennaPlanMeasurementRecord = {
        id: newId(),
        recordedAt: recordedAt.toISOString(),
        label: measurementDraft.label.trim(),
        sweep: measurementSweep,
        calibrationContext: measurementDraft.calibrationContext,
        referencePlane: measurementDraft.referencePlane,
        installedGeometry: measurementDraft.installedGeometry,
        adjustment: measurementDraft.adjustment,
        observations: measurementDraft.observations,
        analysis: null
      };
      const updated: AntennaPlan = {
        ...selected,
        updatedAt: new Date().toISOString(),
        measurements: [record, ...selected.measurements].slice(0, ANTENNA_PLAN_MEASUREMENT_LIMIT)
      };
      setPlans(saveAntennaPlan(updated, window.localStorage));
      setMessage('Measurement history entry saved; the sweep file itself was not stored');
      if (analyzeAfterSave && measurementFile) onAnalyzeSweep({
        file: measurementFile,
        planId: selected.id,
        measurementId: record.id,
        planName: selected.name,
        measurementLabel: record.label,
        calibrationContext: record.calibrationContext,
        referencePlane: record.referencePlane,
        installedGeometry: record.installedGeometry,
        adjustment: record.adjustment,
        observations: record.observations
      });
    } catch {
      setMessage('The measurement entry could not be saved. Copy important notes before leaving this page.');
    }
  };

  const removeMeasurementRecord = (record: AntennaPlanMeasurementRecord) => {
    if (!selected || !window.confirm(`Delete the measurement entry “${record.label}”?`)) return;
    try {
      const updated = { ...selected, updatedAt: new Date().toISOString(), measurements: selected.measurements.filter((candidate) => candidate.id !== record.id) };
      setPlans(saveAntennaPlan(updated, window.localStorage));
      setMessage('Measurement history entry deleted');
    } catch {
      setMessage('The measurement entry could not be deleted.');
    }
  };

  const downloadSelected = () => {
    if (!selected) return;
    const url = URL.createObjectURL(new Blob([serializeAntennaPlan(selected)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = antennaPlanFilename(selected.name);
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Portable JSON plan downloaded');
  };

  const importPlan = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseAntennaPlan(await file.text(), newId(), new Date().toISOString());
      const next = saveAntennaPlan(imported, window.localStorage);
      setPlans(next);
      setSelectedId(imported.id);
      setMessage('Plan imported as a new copy; existing plans were not changed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The selected plan could not be imported.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  const jurisdictionName = selected ? jurisdictionProfiles.find((profile) => profile.code === selected.jurisdiction)?.name : '';

  return <details className="antenna-plan-library">
    <summary><span><strong>Saved antenna plans</strong><small>Keep named designs on this device or move them as versioned JSON files.</small></span><span className="plan-count">{plans.length}</span></summary>
    <div className="antenna-plan-library-body">
      <div className="plan-privacy" role="note"><strong>Plans stay in this browser unless you download them.</strong><span>Browser storage can be cleared or lost. Export important plans and keep the file with your build notes.</span></div>
      <div className="plan-save-row">
        <label><span>New plan name</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></label>
        <button type="button" onClick={saveCurrent}>Save new plan</button>
      </div>
      {plans.length ? <>
        <label className="plan-picker"><span>Saved plan</span><select aria-label="Saved antenna plan" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {ANTENNA_DESIGNS[plan.antennaType].short}</option>)}</select></label>
        {selected && <div className="plan-summary">
          <strong>{selected.name}</strong>
          <span>{ANTENNA_DESIGNS[selected.antennaType].name}</span>
          <span>{jurisdictionName} · {selected.unitSystem === 'metric' ? 'Metric' : 'Imperial'} · saved {localDate(selected.updatedAt)}</span>
          <code>{selected.modelId} · model {selected.modelVersion} · file schema {selected.schemaVersion}</code>
        </div>}
        {selected && <section className="antenna-project-journey" aria-labelledby="antenna-project-journey-title">
          <div className="project-journey-heading">
            <div><p className="eyebrow">Build journey</p><h4 id="antenna-project-journey-title">From selected design to retained record</h4></div>
            <strong>{selected.progress.completedStages.length} of {ANTENNA_PROJECT_STAGES.length}</strong>
          </div>
          <ol>{ANTENNA_PROJECT_STAGES.map((stage) => {
            const complete = selected.progress.completedStages.includes(stage);
            const automatic = stage === 'choose' || stage === 'plan';
            return <li key={stage} className={complete ? 'project-stage-complete' : ''}>
              <label>
                <input type="checkbox" checked={complete} disabled={automatic} onChange={() => toggleProjectStage(stage)} />
                <span><strong>{projectStageDetails[stage].label}</strong><small>{projectStageDetails[stage].detail}</small></span>
              </label>
            </li>;
          })}</ol>
          <p className="project-journey-limit"><strong>Progress record only.</strong> A checked step records your workflow; it does not establish measurement quality, antenna performance, structural safety, or regulatory compliance.</p>
        </section>}
        {selected && <details className="antenna-build-record">
          <summary><span><strong>As-built and commissioning record</strong><small>Keep the finished dimensions and departures with this portable plan.</small></span></summary>
          <div className="antenna-build-record-body">
            <label><span>Final measured dimensions</span><textarea maxLength={6000} value={buildRecordDraft.asBuiltDimensions} onChange={(event) => updateBuildRecordDraft('asBuiltDimensions', event.target.value)} placeholder="Record finished radiator, element, spacing, height, support, and feed dimensions with units and measurement points." /></label>
            <label><span>Construction departures</span><textarea maxLength={6000} value={buildRecordDraft.constructionDeviations} onChange={(event) => updateBuildRecordDraft('constructionDeviations', event.target.value)} placeholder="Record material substitutions, changed geometry, unavoidable routing, support, feed, matching, or installation differences." /></label>
            <label><span>Commissioning notes</span><textarea maxLength={6000} value={buildRecordDraft.commissioningNotes} onChange={(event) => updateBuildRecordDraft('commissioningNotes', event.target.value)} placeholder="Record analyser and calibration context, reference plane, installed sweep conditions, adjustments, final observations, and follow-up work." /></label>
            <div className="build-record-actions"><button type="button" onClick={saveBuildRecord}>Save build record</button><small>Notes remain on this device unless the plan is downloaded. Do not store information here that should not be included in a transferred plan.</small></div>
          </div>
        </details>}
        {selected && <details className="antenna-measurement-history">
          <summary><span><strong>Measurement history</strong><small>Reference dated observations and optional `.s1p` files without storing the sweep contents.</small></span><span className="measurement-count">{selected.measurements.length}</span></summary>
          <div className="antenna-measurement-body">
            <div className="measurement-record-form">
              <label><span>Entry label</span><input maxLength={120} value={measurementDraft.label} onChange={(event) => updateMeasurementDraft('label', event.target.value)} placeholder="Initial installed sweep" /></label>
              <label><span>Measurement date and time</span><input type="datetime-local" value={measurementDraft.recordedAt} onChange={(event) => updateMeasurementDraft('recordedAt', event.target.value)} /></label>
              <label className="measurement-sweep-file"><span>Optional `.s1p` reference</span><input ref={measurementFileInput} type="file" accept=".s1p" aria-label="Choose measurement .s1p reference" onChange={(event) => void selectMeasurementSweep(event.target.files?.[0])} /></label>
              {measurementSweep && <div className="measurement-file-summary" role="note"><strong>{measurementSweep.name}</strong><span>{measurementSweep.sizeBytes.toLocaleString()} bytes</span><code>{measurementSweep.sha256 ? `SHA-256 ${measurementSweep.sha256}` : 'SHA-256 unavailable here · filename and size only'}</code></div>}
              <label><span>Calibration context</span><textarea maxLength={4000} value={measurementDraft.calibrationContext} onChange={(event) => updateMeasurementDraft('calibrationContext', event.target.value)} placeholder="Instrument, calibration type, fixture, cable, adapters, and calibration status." /></label>
              <label><span>Measurement reference plane</span><textarea maxLength={4000} value={measurementDraft.referencePlane} onChange={(event) => updateMeasurementDraft('referencePlane', event.target.value)} placeholder="State where the reported impedance or S11 applies." /></label>
              <label><span>Installed geometry and conditions</span><textarea maxLength={4000} value={measurementDraft.installedGeometry} onChange={(event) => updateMeasurementDraft('installedGeometry', event.target.value)} placeholder="Height, supports, orientation, feedline route, nearby objects, weather, and other relevant conditions." /></label>
              <label><span>Adjustment since previous entry</span><textarea maxLength={4000} value={measurementDraft.adjustment} onChange={(event) => updateMeasurementDraft('adjustment', event.target.value)} placeholder="Describe dimensional, matching, feedline, support, or installation changes without claiming they caused the result." /></label>
              <label className="measurement-observations"><span>Observed results and follow-up</span><textarea maxLength={4000} value={measurementDraft.observations} onChange={(event) => updateMeasurementDraft('observations', event.target.value)} placeholder="Record sampled resonance, SWR spans, impedance observations, comparison limits, and the next measurement or adjustment." /></label>
              <div className="measurement-record-actions"><button type="button" onClick={() => saveMeasurementRecord(false)}>Add measurement entry</button>{measurementFile && <button type="button" className="secondary-button" onClick={() => saveMeasurementRecord(true)}>Save and analyze sweep</button>}<small>Adding an entry does not mark the Measure stage complete. Review the context and check the stage when your intended work is finished.</small></div>
            </div>
            {selected.measurements.length ? <ol className="measurement-record-list">{selected.measurements.map((record) => <li key={record.id}>
              <div className="measurement-record-heading"><div><strong>{record.label}</strong><time dateTime={record.recordedAt}>{localDate(record.recordedAt)}</time></div><button type="button" className="danger-button" onClick={() => removeMeasurementRecord(record)}>Delete entry</button></div>
              {record.sweep && <p className="measurement-record-file"><strong>{record.sweep.name}</strong> · {record.sweep.sizeBytes.toLocaleString()} bytes<br /><code>{record.sweep.sha256 ? `SHA-256 ${record.sweep.sha256}` : 'No cryptographic fingerprint recorded'}</code></p>}
              <dl>{record.calibrationContext && <div><dt>Calibration</dt><dd>{record.calibrationContext}</dd></div>}{record.referencePlane && <div><dt>Reference plane</dt><dd>{record.referencePlane}</dd></div>}{record.installedGeometry && <div><dt>Geometry and conditions</dt><dd>{record.installedGeometry}</dd></div>}{record.adjustment && <div><dt>Adjustment</dt><dd>{record.adjustment}</dd></div>}{record.observations && <div><dt>Observations</dt><dd>{record.observations}</dd></div>}</dl>
              {record.analysis && <section className="measurement-analysis-summary" aria-label={`Saved analysis for ${record.label}`}><div><strong>Saved sweep summary</strong><time dateTime={record.analysis.analyzedAt}>Analyzed {localDate(record.analysis.analyzedAt)}</time></div><dl><div><dt>Coverage</dt><dd>{formatRecordedFrequency(record.analysis.lowerFrequencyHz)}–{formatRecordedFrequency(record.analysis.upperFrequencyHz)} · {record.analysis.pointCount.toLocaleString()} points · {record.analysis.referenceImpedanceOhms.toFixed(1)} Ω</dd></div><div><dt>Minimum SWR</dt><dd>{record.analysis.minimumSwr === null ? 'Not finite' : `${record.analysis.minimumSwr.toFixed(3)} : 1`} at {formatRecordedFrequency(record.analysis.minimumSwrFrequencyHz)}</dd></div><div><dt>Closest sampled resonance</dt><dd>{formatRecordedFrequency(record.analysis.resonanceFrequencyHz)} · {record.analysis.resonanceResistanceOhms === null ? 'R not finite' : `${record.analysis.resonanceResistanceOhms.toFixed(2)} Ω`} · {record.analysis.resonanceReactanceOhms === null ? 'X not finite' : `j${record.analysis.resonanceReactanceOhms.toFixed(2)} Ω`}</dd></div><div><dt>{record.analysis.threshold.toFixed(2)}:1 spans</dt><dd>{record.analysis.thresholdWindowCount ? `${record.analysis.thresholdWindowCount} recorded ${record.analysis.thresholdWindowCount === 1 ? 'window' : 'windows'}` : 'No measured samples at or below threshold'}{record.analysis.thresholdWindowCount > record.analysis.thresholdSpans.length ? ` · first ${record.analysis.thresholdSpans.length} retained` : ''}</dd></div></dl>{record.analysis.thresholdSpans.length > 0 && <ol>{record.analysis.thresholdSpans.map((span, index) => <li key={`${span.lowerFrequencyHz}-${span.upperFrequencyHz}-${index}`}>{formatRecordedFrequency(span.lowerFrequencyHz)}–{formatRecordedFrequency(span.upperFrequencyHz)} · {span.lowerBasis} / {span.upperBasis}</li>)}</ol>}<p>Stored summary only; reopen the original fingerprinted sweep for point-level review.</p></section>}
            </li>)}</ol> : <p className="measurement-history-empty">No measurement entries have been recorded for this plan.</p>}
            <p className="project-journey-limit"><strong>Interpretation limit.</strong> File identity, entered context, and observations do not establish calibration quality, measurement uncertainty, causation, efficiency, pattern, safe power, or compliance.</p>
          </div>
        </details>}
        <div className="plan-actions"><button type="button" onClick={openSelected}>Open plan</button><button type="button" className="secondary-button" onClick={duplicateSelected}>Duplicate</button><button type="button" className="secondary-button" onClick={downloadSelected}>Download JSON</button><button type="button" className="danger-button" onClick={removeSelected}>Delete</button></div>
      </> : <p className="plan-empty">No plans are saved in this browser yet.</p>}
      <label className="plan-import"><span>Import JSON plan</span><input ref={importInput} type="file" accept=".json,application/json" aria-label="Import antenna plan JSON" onChange={(event) => void importPlan(event.target.files?.[0])} /></label>
      <p className="plan-message" role="status" aria-live="polite">{message}</p>
    </div>
  </details>;
}
