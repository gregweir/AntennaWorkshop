/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { ACMA_CHANGE_CATEGORIES, createAcmaStationChange, reviewAcmaStationChange, type AcmaChangeCategory, type AcmaStationChange } from '../projects/acmaStationChanges';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface Props {
  changes: AcmaStationChange[];
  onChange: (changes: AcmaStationChange[]) => void;
}

function newChange() {
  return createAcmaStationChange(crypto.randomUUID());
}

export function AcmaStationChangePanel({ changes, onChange }: Props) {
  const [draft, setDraft] = useState(newChange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const review = useMemo(() => reviewAcmaStationChange(draft), [draft]);
  const update = <K extends keyof AcmaStationChange>(field: K, value: AcmaStationChange[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const toggleCategory = (category: AcmaChangeCategory, checked: boolean) => {
    update('categories', checked ? [...draft.categories, category] : draft.categories.filter((candidate) => candidate !== category));
  };
  const reset = () => { setDraft(newChange()); setEditingId(null); setMessage(''); };
  const store = () => {
    const next = editingId
      ? changes.map((change) => change.id === editingId ? draft : change)
      : [draft, ...changes];
    onChange(next);
    setMessage(editingId ? 'Change entry updated in the unsaved record' : 'Change entry added to the unsaved record');
    setDraft(newChange());
    setEditingId(null);
  };
  const edit = (change: AcmaStationChange) => { setDraft(change); setEditingId(change.id); setMessage('Editing change entry'); };
  const remove = (change: AcmaStationChange) => {
    if (!window.confirm('Remove this station-change entry from the unsaved record?')) return;
    onChange(changes.filter((candidate) => candidate.id !== change.id));
    if (editingId === change.id) reset();
    setMessage('Change entry removed from the unsaved record');
  };

  return <fieldset className="acma-change-workflow"><legend>Station change and reassessment log</legend>
    <p className="acma-fieldset-intro">Record relevant changes, review the post-change clause 3 position, and track clause 4 assessment and clause 6 declaration actions separately. This log does not decide whether operation is permitted.</p>
    <StepByStepHelp title="Review a changed Australian amateur station" intro="Use the installed post-change station facts and retained evidence, not the previous configuration alone." steps={[
      { title: 'Describe the change', detail: 'Choose every applicable category and record the effective date and enough detail to identify the before-and-after configuration.' },
      { title: 'Repeat the clause 3 gateway review', detail: 'For a station previously relying on clause 3, determine whether a low-risk path still applies after the change.' },
      { title: 'Resolve the assessment action', detail: 'If clause 4 applies, identify the applicable retained assessment record or a newly completed assessment. The application does not decide whether earlier evidence covers the change.' },
      { title: 'Review the declaration', detail: 'If information included in the declaration changed or became incorrect, make and retain a new declaration and identify it here.' },
      { title: 'Save the parent record', detail: 'Adding or updating a log entry changes only the unsaved worksheet. Use Save draft to preserve it and create a record revision.' }
    ]} limit="Clause 5 does not say every change automatically requires a clause 4 assessment. It applies clause 4 when a changed clause 3 station no longer falls within clause 3. Independent technical and legal judgment remains necessary." />

    <div className="acma-change-category-grid" role="group" aria-label="Station change categories">
      {ACMA_CHANGE_CATEGORIES.map((category) => <label key={category.id}><input type="checkbox" checked={draft.categories.includes(category.id)} onChange={(event) => toggleCategory(category.id, event.target.checked)} /><span>{category.label}</span>{category.clause5 && <small>Clause 5 named</small>}{category.declarationMatter && <small>Declaration review</small>}</label>)}
    </div>

    <div className="acma-record-grid acma-change-form">
      <label className="field"><span>Change effective date</span><input type="date" value={draft.changeDate} onChange={(event) => update('changeDate', event.target.value)} /></label>
      <label className="field acma-record-wide"><span>What changed?</span><textarea value={draft.summary} onChange={(event) => update('summary', event.target.value)} placeholder="Describe the previous and new configuration, values, units, and affected antennas or modes" /></label>
      <label className="field"><span className="field-label-with-help"><span>Post-change clause 3 review</span><HelpTip label="Post-change clause 3 review">Repeat the gateway using the changed station. Do not assume that a prior low-risk category continues to apply.</HelpTip></span><select aria-label="Post-change clause 3 review result" value={draft.lowRiskReview} onChange={(event) => update('lowRiskReview', event.target.value as AcmaStationChange['lowRiskReview'])}><option value="">Select review result</option><option value="remains-clause-3">A clause 3 low-risk path still applies</option><option value="clause-4-applies">No clause 3 path applies; clause 4 applies</option><option value="already-higher-risk">Station was already subject to clause 4</option><option value="review-pending">Review not completed</option></select></label>
      <label className="field"><span>Clause 4 assessment action</span><select value={draft.assessmentAction} onChange={(event) => update('assessmentAction', event.target.value as AcmaStationChange['assessmentAction'])}><option value="">Select action</option><option value="not-required-clause-3">No clause 4 action recorded because clause 3 still applies</option><option value="existing-record-reviewed">Existing assessment record reviewed for changed configuration</option><option value="new-assessment-completed">New measurement or calculation completed</option><option value="pending">Assessment action pending</option></select></label>
      {(draft.assessmentAction === 'existing-record-reviewed' || draft.assessmentAction === 'new-assessment-completed') && <label className="field acma-record-wide"><span>Assessment record reference</span><textarea value={draft.assessmentReference} onChange={(event) => update('assessmentReference', event.target.value)} placeholder="Identify the applicable report, calculation, measurement record, date, and custodian" /></label>}
      <label className="field"><span>Clause 6 declaration action</span><select value={draft.declarationAction} onChange={(event) => update('declarationAction', event.target.value as AcmaStationChange['declarationAction'])}><option value="">Select action</option><option value="not-required">Reviewed; no declaration information changed or became incorrect</option><option value="new-declaration-made">New declaration made and retained</option><option value="pending">Declaration review pending</option></select></label>
      {draft.declarationAction === 'new-declaration-made' && <label className="field"><span>New declaration reference</span><input value={draft.declarationReference} onChange={(event) => update('declarationReference', event.target.value)} /></label>}
      <label className="field"><span>Reviewed by</span><input value={draft.reviewedBy} onChange={(event) => update('reviewedBy', event.target.value)} /></label>
      <label className="field acma-record-wide"><span>Notes and supporting references</span><textarea value={draft.notes} onChange={(event) => update('notes', event.target.value)} /></label>
    </div>

    <div className={`acma-change-review ${review.followUp.length ? 'acma-change-review-open' : ''}`} role="status">
      <div><strong>{review.documentationGaps.length ? `${review.documentationGaps.length} documentation gaps` : 'Core change details documented'}</strong><span>{review.documentationGaps.join(' · ') || 'Entries still require responsible review.'}</span></div>
      <div><strong>{review.followUp.length ? `${review.followUp.length} follow-up actions unresolved` : 'No derived follow-up shown'}</strong><span>{review.followUp.join(' · ') || 'This does not validate the decisions or authorize operation.'}</span></div>
    </div>
    <div className="acma-change-editor-actions"><button type="button" onClick={store}>{editingId ? 'Update change entry' : 'Add change entry'}</button>{editingId && <button type="button" onClick={reset}>Cancel editing</button>}<span aria-live="polite">{message}</span></div>

    {changes.length > 0 && <div className="acma-change-log"><h4>Recorded station changes</h4><ol>{changes.map((change) => {
      const entryReview = reviewAcmaStationChange(change);
      return <li key={change.id}><div><strong>{change.changeDate || 'Date not entered'} · {change.summary || 'Description not entered'}</strong><span>{change.categories.map((id) => ACMA_CHANGE_CATEGORIES.find((category) => category.id === id)?.label ?? id).join(' · ') || 'No categories selected'}</span><small>{entryReview.documentationGaps.length} documentation gaps · {entryReview.followUp.length} follow-up actions</small></div><div><button type="button" onClick={() => edit(change)}>Edit</button><button type="button" className="danger-button" onClick={() => remove(change)}>Remove</button></div></li>;
    })}</ol></div>}
  </fieldset>;
}
