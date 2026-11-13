/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useRef, useState } from 'react';
import { ACMA_ASSESSMENT_MODEL } from '../calculators/acmaAssessment';
import { ACMA_ASSESSMENT_ROUTES, ACMA_ASSESSMENT_STANDARDS, evaluateAcmaEvidence } from '../calculators/acmaEvidence';
import { acmaRecordRequiredGaps, createAcmaAssessmentRecord, deleteAcmaAssessmentRecord, loadAcmaAssessmentRecords, parseAcmaAssessmentRecord, restoreAcmaAssessmentRevision, saveAcmaAssessmentRecord, serializeAcmaAssessmentRecord, type AcmaAssessmentRecord } from '../projects/acmaAssessmentRecords';
import { HelpTip, StepByStepHelp } from './ContextHelp';

function newRecord() {
  return createAcmaAssessmentRecord(crypto.randomUUID(), new Date().toISOString());
}

function filename(title: string) {
  const safe = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'acma-assessment-record';
  return `${safe}.acma-eme-record.json`;
}

function fieldLabel(field: string) {
  return field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

export function AcmaAssessmentRecordPanel() {
  const initialRecords = useMemo(() => loadAcmaAssessmentRecords(window.localStorage), []);
  const [records, setRecords] = useState(initialRecords);
  const [record, setRecord] = useState<AcmaAssessmentRecord>(() => initialRecords[0] ?? newRecord());
  const [message, setMessage] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const gaps = acmaRecordRequiredGaps(record);
  const evidenceReadiness = evaluateAcmaEvidence(record);
  const selectedRoute = ACMA_ASSESSMENT_ROUTES.find((route) => route.id === record.assessmentRoute);
  const update = <K extends keyof AcmaAssessmentRecord>(field: K, value: AcmaAssessmentRecord[K]) => {
    setRecord((current) => ({ ...current, [field]: value }));
    setMessage('Unsaved changes');
  };
  const save = () => {
    const next = { ...record, updatedAt: new Date().toISOString() };
    try {
      const savedRecords = saveAcmaAssessmentRecord(next, window.localStorage);
      const saved = savedRecords.find((candidate) => candidate.id === next.id) ?? next;
      setRecords(savedRecords);
      setRecord(saved);
      setMessage('Draft saved on this device');
    } catch {
      setMessage('This browser could not save the draft. Download or print a copy before leaving.');
    }
  };
  const selectRecord = (id: string) => {
    const selected = records.find((candidate) => candidate.id === id);
    if (selected) { setRecord(selected); setMessage('Saved record opened'); }
  };
  const startNew = () => { setRecord(newRecord()); setMessage('New unsaved draft'); };
  const remove = () => {
    if (!records.some((candidate) => candidate.id === record.id)) { startNew(); return; }
    if (!window.confirm('Delete this saved ACMA assessment record from this browser?')) return;
    const next = deleteAcmaAssessmentRecord(record.id, window.localStorage);
    setRecords(next);
    setRecord(next[0] ?? newRecord());
    setMessage('Saved record deleted from this device');
  };
  const download = () => {
    const blob = new Blob([serializeAcmaAssessmentRecord(record)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename(record.title);
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('JSON record copy downloaded');
  };
  const importRecord = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseAcmaAssessmentRecord(await file.text(), crypto.randomUUID(), new Date().toISOString());
      const savedRecords = saveAcmaAssessmentRecord(imported, window.localStorage);
      const saved = savedRecords.find((candidate) => candidate.id === imported.id) ?? imported;
      setRecords(savedRecords);
      setRecord(saved);
      setMessage('JSON record imported as a new local copy');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The selected record could not be imported.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };
  const restoreRevision = (index: number) => {
    try {
      setRecord(restoreAcmaAssessmentRevision(record, record.revisions[index], new Date().toISOString()));
      setMessage('Revision restored as an unsaved draft');
    } catch {
      setMessage('The selected record revision could not be restored.');
    }
  };

  return <section className="acma-record-section exposure-screen-section" aria-labelledby="acma-record-heading">
    <div className="section-heading"><div><p className="eyebrow">Australia · clauses 4 and 6 documentation</p><h3 id="acma-record-heading">Assessment record worksheet</h3></div><span className="model-badge">Local record v3</span></div>
    <p className="screen-intro">Prepare and retain the declaration, assessment evidence, assessor details, and station configuration required for a higher-risk amateur station.</p>
    <div className="acma-record-privacy" role="note"><strong>Personal information stays in this browser unless you print or download it.</strong><span>Browser storage can be cleared or lost. Keep a separate protected copy of any operational record.</span></div>
    <StepByStepHelp title="Prepare the clauses 4 and 6 record package" intro="Complete the worksheet from the actual assessment and station documentation; do not estimate missing legal or technical facts." steps={[
      { title: 'Identify the responsible person', detail: 'Record the operator or corporate name, address, optional ABN, and corporate registration details when applicable.' },
      { title: 'Describe the installed station', detail: 'Record location, antenna type and height, power, gain, size, tilt, manufacturer, model, and emission mode.' },
      { title: 'Choose the assessment route', detail: 'Identify a current named-standard assessment or the precise transitional provision supported by the retained record.' },
      { title: 'Attach the assessment basis', detail: 'Identify the assessor, qualification, date, applicable standard and edition, and the actual measurements or calculations.' },
      { title: 'Document any agent arrangement', detail: 'Where an agent is used, keep the written agreement and enter a reference that connects this worksheet to it.' },
      { title: 'Make the declaration deliberately', detail: 'Only the responsible person can make the required compliance statement. The application never checks it automatically.' },
      { title: 'Save, export, and revisit', detail: 'Keep the record accessible in English, retain protected JSON copies, and create a new declaration when its information changes. Saved edits preserve earlier local revisions.' }
    ]} limit="This worksheet checks whether named fields contain text. It does not verify measurements, calculations, qualifications, signatures, station facts, standard applicability, or compliance." />

    <div className="acma-record-library">
      <label className="field"><span>Saved records on this device</span><select aria-label="Saved ACMA assessment records" value={records.some((candidate) => candidate.id === record.id) ? record.id : ''} onChange={(event) => selectRecord(event.target.value)}><option value="">Unsaved draft</option>{records.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title || 'Untitled record'} · {new Date(candidate.updatedAt).toLocaleDateString()}</option>)}</select></label>
      <div className="acma-record-actions"><button type="button" onClick={startNew}>New draft</button><button type="button" onClick={save}>Save draft</button><button type="button" onClick={download}>Download JSON</button><label className="acma-record-import"><span>Import JSON</span><input ref={importInput} type="file" accept=".json,application/json" aria-label="Import ACMA assessment record JSON" onChange={(event) => void importRecord(event.target.files?.[0])} /></label><button type="button" onClick={() => window.print()}>Print record</button><button type="button" className="danger-button" onClick={remove}>Delete saved record</button></div>
      <p role="status" aria-live="polite">{message}</p>
    </div>

    {record.revisions.length > 0 && <section className="acma-record-history" aria-labelledby="acma-record-history-heading">
      <div><p className="eyebrow">Non-destructive history</p><h4 id="acma-record-history-heading">Earlier saved revisions</h4><p>Restoring a revision opens it as an unsaved draft. Your current saved record remains unchanged until you choose Save draft.</p></div>
      <ol>{record.revisions.map((revision, index) => <li key={`${revision.replacedAt}-${revision.previousUpdatedAt}`}><div><strong>Saved {new Date(revision.previousUpdatedAt).toLocaleString()}</strong><span>Replaced {new Date(revision.replacedAt).toLocaleString()} · Changed: {revision.changedFields.map(fieldLabel).join(', ')}</span></div><button type="button" onClick={() => restoreRevision(index)}>Restore revision {index + 1}</button></li>)}</ol>
    </section>}

    <div className="acma-record-readiness" role="status"><div><p className="eyebrow">Documentation check</p><h4>{gaps.length ? `${gaps.length} required ${gaps.length === 1 ? 'item' : 'items'} not documented` : 'All named fields contain an entry'}</h4><p>{gaps.length ? gaps.join(' · ') : 'Content still requires responsible technical and legal review.'}</p></div><div className="acma-readiness-mark" aria-hidden="true">{gaps.length ? '!' : '✓'}</div></div>

    <section className="acma-evidence-status" aria-labelledby="acma-evidence-status-heading">
      <div><p className="eyebrow">Clause 4 evidence map</p><h4 id="acma-evidence-status-heading">{evidenceReadiness.recordAnchorGaps.length ? `${evidenceReadiness.recordAnchorGaps.length} record ${evidenceReadiness.recordAnchorGaps.length === 1 ? 'anchor' : 'anchors'} not documented` : 'Named record anchors are documented'}</h4><p>{evidenceReadiness.recordAnchorGaps.length ? evidenceReadiness.recordAnchorGaps.join(' · ') : 'This is a documentation result, not a finding that the assessment method, record, or station complies.'}</p></div>
      <div><p className="eyebrow">Supporting review</p><strong>{evidenceReadiness.supportingEvidenceGaps.length} quality {evidenceReadiness.supportingEvidenceGaps.length === 1 ? 'prompt' : 'prompts'} remain</strong><span>{evidenceReadiness.supportingEvidenceGaps.length ? evidenceReadiness.supportingEvidenceGaps.join(' · ') : 'All supporting prompts contain an entry; independent review is still required.'}</span></div>
    </section>

    <div className="acma-record-form">
      <fieldset><legend>Record identity and responsible person</legend><div className="acma-record-grid">
        <label className="field acma-record-wide"><span>Record title</span><input value={record.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label className="field"><span>Operator type</span><select value={record.operatorType} onChange={(event) => update('operatorType', event.target.value as AcmaAssessmentRecord['operatorType'])}><option value="individual">Individual</option><option value="body-corporate">Body corporate</option></select></label>
        <label className="field"><span>Operator or corporate name</span><input value={record.operatorName} onChange={(event) => update('operatorName', event.target.value)} /></label>
        <label className="field acma-record-wide"><span>Address</span><textarea value={record.operatorAddress} onChange={(event) => update('operatorAddress', event.target.value)} /></label>
        <label className="field"><span>ABN, if any</span><input value={record.abn} onChange={(event) => update('abn', event.target.value)} /></label>
        {record.operatorType === 'body-corporate' && <><label className="field"><span>ACN, ARBN, or registration number</span><input value={record.corporateRegistration} onChange={(event) => update('corporateRegistration', event.target.value)} /></label><label className="field"><span>Declarant name</span><input value={record.declarantName} onChange={(event) => update('declarantName', event.target.value)} /></label><label className="field"><span>Declarant position</span><input value={record.declarantPosition} onChange={(event) => update('declarantPosition', event.target.value)} /></label></>}
      </div></fieldset>

      <fieldset><legend>Installed station details</legend><div className="acma-record-grid">
        <label className="field acma-record-wide"><span>Station location</span><textarea value={record.stationLocation} onChange={(event) => update('stationLocation', event.target.value)} /></label>
        <label className="field"><span>Antenna type</span><input value={record.antennaType} onChange={(event) => update('antennaType', event.target.value)} /></label>
        <label className="field"><span>Height above ground or accessible surface</span><input value={record.antennaHeight} onChange={(event) => update('antennaHeight', event.target.value)} placeholder="Include value, unit, and reference" /></label>
        <label className="field"><span>Power level</span><input value={record.powerLevel} onChange={(event) => update('powerLevel', event.target.value)} placeholder="Include value, units, and reference plane" /></label>
        <label className="field"><span>Antenna gain</span><input value={record.antennaGain} onChange={(event) => update('antennaGain', event.target.value)} placeholder="Include dBi or dBd reference" /></label>
        <label className="field"><span>Antenna size</span><input value={record.antennaSize} onChange={(event) => update('antennaSize', event.target.value)} /></label>
        <label className="field"><span>Antenna tilt</span><input value={record.antennaTilt} onChange={(event) => update('antennaTilt', event.target.value)} /></label>
        <label className="field"><span>Manufacturer</span><input value={record.manufacturer} onChange={(event) => update('manufacturer', event.target.value)} /></label>
        <label className="field"><span>Model number</span><input value={record.modelNumber} onChange={(event) => update('modelNumber', event.target.value)} /></label>
        <label className="field"><span>Emission mode</span><input value={record.emissionMode} onChange={(event) => update('emissionMode', event.target.value)} /></label>
      </div></fieldset>

      <fieldset className="acma-evidence-route"><legend>Clause 4 assessment route</legend><p className="acma-fieldset-intro">Select the route demonstrated by the actual retained record. The application does not determine whether a standard applies or whether a transitional provision is satisfied.</p><div className="acma-record-grid">
        <label className="field acma-record-wide"><span>Assessment or transitional route</span><select value={record.assessmentRoute} onChange={(event) => update('assessmentRoute', event.target.value as AcmaAssessmentRecord['assessmentRoute'])}><option value="">Select the supported route</option>{ACMA_ASSESSMENT_ROUTES.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}</select><small>{selectedRoute?.detail ?? 'Choose only after reviewing the retained assessment record and the current instrument.'}</small></label>
        <label className="field"><span>Named assessment standard</span><select value={record.assessmentStandard} onChange={(event) => update('assessmentStandard', event.target.value as AcmaAssessmentRecord['assessmentStandard'])}><option value="">Select or identify below</option>{ACMA_ASSESSMENT_STANDARDS.map((standard) => <option key={standard.id} value={standard.id}>{standard.label}</option>)}</select></label>
        <label className="field"><span>Standard title, edition, or publication date</span><input value={record.standardEdition} onChange={(event) => update('standardEdition', event.target.value)} placeholder="Record the exact document used" /></label>
        <label className="field"><span>Method type</span><select value={record.assessmentMethodType} onChange={(event) => update('assessmentMethodType', event.target.value as AcmaAssessmentRecord['assessmentMethodType'])}><option value="">Select method</option><option value="measurement">Measurement</option><option value="calculation">Calculation / computation</option><option value="measurement-and-calculation">Measurement and calculation</option></select></label>
        <label className="field"><span>Assessment scope</span><select value={record.assessmentScope} onChange={(event) => update('assessmentScope', event.target.value as AcmaAssessmentRecord['assessmentScope'])}><option value="">Select scope</option><option value="single-station">This station</option><option value="whole-site">All stations at the shared site</option></select></label>
        {record.assessmentRoute && record.assessmentRoute !== 'current' && <label className="field acma-record-wide"><span>Transitional record reference</span><textarea value={record.transitionRecordReference} onChange={(event) => update('transitionRecordReference', event.target.value)} placeholder="Identify the retained document, date, custodian, and applicable clause 4 route" /></label>}
      </div><div className="acma-route-note" role="note"><strong>Route review</strong><span>{evidenceReadiness.routeNote}</span><a href={ACMA_ASSESSMENT_MODEL.source.url} target="_blank" rel="noreferrer">Open the current instrument</a></div></fieldset>

      <fieldset><legend>Clause 6 assessment record</legend><div className="acma-record-grid">
        <label className="field"><span>Assessor name</span><input value={record.assessorName} onChange={(event) => update('assessorName', event.target.value)} /></label>
        <label className="field"><span>Assessor qualification</span><input value={record.assessorQualification} onChange={(event) => update('assessorQualification', event.target.value)} /></label>
        <label className="field"><span>Assessment date</span><input type="date" value={record.assessmentDate} onChange={(event) => update('assessmentDate', event.target.value)} /></label>
        <label className="field"><span>Assessment method summary</span><input value={record.assessmentMethod} onChange={(event) => update('assessmentMethod', event.target.value)} placeholder="Short description linking to the retained evidence" /></label>
        <label className="field acma-record-wide"><span>Measurements or calculations</span><textarea value={record.measurementsAndCalculations} onChange={(event) => update('measurementsAndCalculations', event.target.value)} placeholder="Record or reference the actual method, inputs, results, uncertainty, and conclusion" /></label>
        <label className="acma-record-check acma-record-wide"><input type="checkbox" checked={record.agentUsed} onChange={(event) => update('agentUsed', event.target.checked)} /> An agent is used to manage compliance or possess records</label>
        {record.agentUsed && <label className="field acma-record-wide"><span>Written agent-agreement reference</span><input value={record.agentAgreementReference} onChange={(event) => update('agentAgreementReference', event.target.value)} /></label>}
        <label className="field acma-record-wide"><span>Additional notes and linked evidence</span><textarea value={record.additionalNotes} onChange={(event) => update('additionalNotes', event.target.value)} /></label>
      </div></fieldset>

      <fieldset><legend>Assessment evidence quality</legend><p className="acma-fieldset-intro">These prompts make the retained work easier to reproduce and review. Completing them does not validate the method or create a compliance finding.</p><div className="acma-record-grid">
        <label className="field acma-record-wide"><span>Highest normal operating conditions assessed</span><textarea value={record.operatingConditions} onChange={(event) => update('operatingConditions', event.target.value)} placeholder="Frequencies, power, duty cycle, modes, antenna selection, simultaneous operation, and other worst-case normal conditions" /></label>
        <label className="field acma-record-wide"><span>Publicly accessible locations assessed</span><textarea value={record.accessibleLocations} onChange={(event) => update('accessibleLocations', event.target.value)} placeholder="Locations, distances, heights, access assumptions, and spatial sampling or calculation points" /></label>
        <label className="field"><span className="field-label-with-help"><span>Equipment, software, or computation model</span><HelpTip label="Equipment or model">Identify instruments, probes, software, model versions, antenna models, and key configuration needed to reproduce the work.</HelpTip></span><textarea value={record.equipmentOrModel} onChange={(event) => update('equipmentOrModel', event.target.value)} /></label>
        <label className="field"><span>Calibration or model validation</span><textarea value={record.calibrationOrValidation} onChange={(event) => update('calibrationOrValidation', event.target.value)} placeholder="Calibration certificate, date, traceability, validation case, or comparison" /></label>
        <label className="field"><span className="field-label-with-help"><span>Uncertainty and conservatism</span><HelpTip label="Uncertainty and conservatism">Record measurement uncertainty, modelling limitations, conservative assumptions, and how they affect interpretation near a reference level.</HelpTip></span><textarea value={record.uncertainty} onChange={(event) => update('uncertainty', event.target.value)} /></label>
        <label className="field"><span>Simultaneous-frequency treatment</span><textarea value={record.simultaneousFrequencyMethod} onChange={(event) => update('simultaneousFrequencyMethod', event.target.value)} placeholder="If applicable, document the RPS S-1 section 3 method; otherwise state why it is not applicable" /></label>
        <label className="field acma-record-wide"><span>Results summary with quantities and units</span><textarea value={record.resultsSummary} onChange={(event) => update('resultsSummary', event.target.value)} placeholder="Preserve the measured or computed values, applicable reference levels, averaging basis, locations, and comparison" /></label>
        <label className="field acma-record-wide"><span>Assessor conclusion and limitations</span><textarea value={record.assessmentConclusion} onChange={(event) => update('assessmentConclusion', event.target.value)} placeholder="Record the assessor's conclusion, limitations, exclusions, and any required controls" /></label>
        <label className="field acma-record-wide"><span>Supporting file and document references</span><textarea value={record.evidenceReferences} onChange={(event) => update('evidenceReferences', event.target.value)} placeholder="Protected filenames, report identifiers, diagrams, photographs, raw data, calibration records, or hashes" /></label>
        <label className="field acma-record-wide"><span>Station-change review basis</span><textarea value={record.changeReview} onChange={(event) => update('changeReview', event.target.value)} placeholder="State the assessed configuration and what changes trigger reassessment or a new declaration" /></label>
      </div></fieldset>

      <fieldset className="acma-declaration"><legend>Responsible-person declaration</legend><p>The required declaration states that operation of the station complies with Schedule 1 clause 2(1). Select this only when the responsible person has actually made and retained that declaration.</p><label className="acma-record-check"><input type="checkbox" checked={record.declarationMade} onChange={(event) => update('declarationMade', event.target.checked)} /> A declaration containing the required compliance statement has been made and retained</label></fieldset>
    </div>

    <div className="acma-record-footer"><p><strong>Worksheet status:</strong> {gaps.length ? 'Draft with documentation gaps' : 'Named fields completed; technical and legal review still required'}.</p><p>Source: <a href={ACMA_ASSESSMENT_MODEL.source.url} target="_blank" rel="noreferrer">{ACMA_ASSESSMENT_MODEL.sourceRevision}</a>. Last saved: {records.some((candidate) => candidate.id === record.id) ? new Date(record.updatedAt).toLocaleString() : 'not saved'}.</p></div>
  </section>;
}
