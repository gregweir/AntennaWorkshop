/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { ACMA_ASSESSMENT_MODEL } from '../calculators/acmaAssessment';
import { acmaRecordRequiredGaps, createAcmaAssessmentRecord, deleteAcmaAssessmentRecord, loadAcmaAssessmentRecords, saveAcmaAssessmentRecord, serializeAcmaAssessmentRecord, type AcmaAssessmentRecord } from '../projects/acmaAssessmentRecords';
import { StepByStepHelp } from './ContextHelp';

function newRecord() {
  return createAcmaAssessmentRecord(crypto.randomUUID(), new Date().toISOString());
}

function filename(title: string) {
  const safe = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'acma-assessment-record';
  return `${safe}.acma-eme-record.json`;
}

export function AcmaAssessmentRecordPanel() {
  const initialRecords = useMemo(() => loadAcmaAssessmentRecords(window.localStorage), []);
  const [records, setRecords] = useState(initialRecords);
  const [record, setRecord] = useState<AcmaAssessmentRecord>(() => initialRecords[0] ?? newRecord());
  const [message, setMessage] = useState('');
  const gaps = acmaRecordRequiredGaps(record);
  const update = <K extends keyof AcmaAssessmentRecord>(field: K, value: AcmaAssessmentRecord[K]) => {
    setRecord((current) => ({ ...current, [field]: value }));
    setMessage('Unsaved changes');
  };
  const save = () => {
    const next = { ...record, updatedAt: new Date().toISOString() };
    try {
      setRecords(saveAcmaAssessmentRecord(next, window.localStorage));
      setRecord(next);
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

  return <section className="acma-record-section exposure-screen-section" aria-labelledby="acma-record-heading">
    <div className="section-heading"><div><p className="eyebrow">Australia · clause 6 documentation</p><h3 id="acma-record-heading">Assessment record worksheet</h3></div><span className="model-badge">Local record v1</span></div>
    <p className="screen-intro">Prepare and retain the declaration, assessment evidence, assessor details, and station configuration required for a higher-risk amateur station.</p>
    <div className="acma-record-privacy" role="note"><strong>Personal information stays in this browser unless you print or download it.</strong><span>Browser storage can be cleared or lost. Keep a separate protected copy of any operational record.</span></div>
    <StepByStepHelp title="Prepare the clause 6 record package" intro="Complete the worksheet from the actual assessment and station documentation; do not estimate missing legal or technical facts." steps={[
      { title: 'Identify the responsible person', detail: 'Record the operator or corporate name, address, optional ABN, and corporate registration details when applicable.' },
      { title: 'Describe the installed station', detail: 'Record location, antenna type and height, power, gain, size, tilt, manufacturer, model, and emission mode.' },
      { title: 'Attach the assessment basis', detail: 'Identify the assessor, qualification, date, applicable standard or transitional basis, and the actual measurements or calculations.' },
      { title: 'Document any agent arrangement', detail: 'Where an agent is used, keep the written agreement and enter a reference that connects this worksheet to it.' },
      { title: 'Make the declaration deliberately', detail: 'Only the responsible person can make the required compliance statement. The application never checks it automatically.' },
      { title: 'Save, export, and revisit', detail: 'Keep the record accessible in English and create a new declaration when its information changes. Reassess after relevant station changes.' }
    ]} limit="This worksheet checks whether named fields contain text. It does not verify measurements, calculations, qualifications, signatures, station facts, standard applicability, or compliance." />

    <div className="acma-record-library">
      <label className="field"><span>Saved records on this device</span><select aria-label="Saved ACMA assessment records" value={records.some((candidate) => candidate.id === record.id) ? record.id : ''} onChange={(event) => selectRecord(event.target.value)}><option value="">Unsaved draft</option>{records.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title || 'Untitled record'} · {new Date(candidate.updatedAt).toLocaleDateString()}</option>)}</select></label>
      <div className="acma-record-actions"><button type="button" onClick={startNew}>New draft</button><button type="button" onClick={save}>Save draft</button><button type="button" onClick={download}>Download JSON</button><button type="button" onClick={() => window.print()}>Print record</button><button type="button" className="danger-button" onClick={remove}>Delete saved record</button></div>
      <p role="status" aria-live="polite">{message}</p>
    </div>

    <div className="acma-record-readiness" role="status"><div><p className="eyebrow">Documentation check</p><h4>{gaps.length ? `${gaps.length} required ${gaps.length === 1 ? 'item' : 'items'} not documented` : 'All named fields contain an entry'}</h4><p>{gaps.length ? gaps.join(' · ') : 'Content still requires responsible technical and legal review.'}</p></div><div className="acma-readiness-mark" aria-hidden="true">{gaps.length ? '!' : '✓'}</div></div>

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

      <fieldset><legend>Assessment and retained evidence</legend><div className="acma-record-grid">
        <label className="field"><span>Assessor name</span><input value={record.assessorName} onChange={(event) => update('assessorName', event.target.value)} /></label>
        <label className="field"><span>Assessor qualification</span><input value={record.assessorQualification} onChange={(event) => update('assessorQualification', event.target.value)} /></label>
        <label className="field"><span>Assessment date</span><input type="date" value={record.assessmentDate} onChange={(event) => update('assessmentDate', event.target.value)} /></label>
        <label className="field"><span>Assessment method or standard</span><input value={record.assessmentMethod} onChange={(event) => update('assessmentMethod', event.target.value)} placeholder="Applicable standard and edition" /></label>
        <label className="field acma-record-wide"><span>Measurements or calculations</span><textarea value={record.measurementsAndCalculations} onChange={(event) => update('measurementsAndCalculations', event.target.value)} placeholder="Record or reference the actual method, inputs, results, uncertainty, and conclusion" /></label>
        <label className="acma-record-check acma-record-wide"><input type="checkbox" checked={record.agentUsed} onChange={(event) => update('agentUsed', event.target.checked)} /> An agent is used to manage compliance or possess records</label>
        {record.agentUsed && <label className="field acma-record-wide"><span>Written agent-agreement reference</span><input value={record.agentAgreementReference} onChange={(event) => update('agentAgreementReference', event.target.value)} /></label>}
        <label className="field acma-record-wide"><span>Additional notes and linked evidence</span><textarea value={record.additionalNotes} onChange={(event) => update('additionalNotes', event.target.value)} /></label>
      </div></fieldset>

      <fieldset className="acma-declaration"><legend>Responsible-person declaration</legend><p>The required declaration states that operation of the station complies with Schedule 1 clause 2(1). Select this only when the responsible person has actually made and retained that declaration.</p><label className="acma-record-check"><input type="checkbox" checked={record.declarationMade} onChange={(event) => update('declarationMade', event.target.checked)} /> A declaration containing the required compliance statement has been made and retained</label></fieldset>
    </div>

    <div className="acma-record-footer"><p><strong>Worksheet status:</strong> {gaps.length ? 'Draft with documentation gaps' : 'Named fields completed; technical and legal review still required'}.</p><p>Source: <a href={ACMA_ASSESSMENT_MODEL.source.url} target="_blank" rel="noreferrer">{ACMA_ASSESSMENT_MODEL.sourceRevision}</a>. Last saved: {records.some((candidate) => candidate.id === record.id) ? new Date(record.updatedAt).toLocaleString() : 'not saved'}.</p></div>
  </section>;
}
