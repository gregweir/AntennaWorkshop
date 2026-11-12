/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useState, type FormEvent } from 'react';
import type { ExposureEvidenceCategory, ExposureEvidenceEntry } from '../projects/exposureProjectFiles';

interface Props {
  entries: ExposureEvidenceEntry[];
  onChange: (entries: ExposureEvidenceEntry[]) => void;
}

export const evidenceCategoryLabels: Record<ExposureEvidenceCategory, string> = {
  assumption: 'Assumption',
  measurement: 'Measurement',
  'source-reference': 'Source reference',
  'review-note': 'Review note'
};

type EvidenceDraft = Omit<ExposureEvidenceEntry, 'id' | 'referenceUrl'> & { referenceUrl: string };

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): EvidenceDraft {
  return { category: 'assumption', title: '', detail: '', recordedOn: localDate(), reviewer: '', referenceUrl: '' };
}

function evidenceId() {
  return globalThis.crypto?.randomUUID?.() ?? `evidence-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateDraft(draft: EvidenceDraft) {
  if (!draft.title.trim() || !draft.detail.trim() || !draft.recordedOn || !draft.reviewer.trim()) return 'Enter a title, detail, review date, and reviewer.';
  if (draft.title.length > 160 || draft.detail.length > 4000 || draft.reviewer.length > 160) return 'The evidence entry exceeds a permitted text length.';
  const date = new Date(`${draft.recordedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.recordedOn) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== draft.recordedOn) return 'Enter a valid review date.';
  if (draft.referenceUrl) {
    try {
      const url = new URL(draft.referenceUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'Reference links must use HTTP or HTTPS.';
    } catch {
      return 'Enter a valid reference URL or leave it blank.';
    }
  }
  return '';
}

export function ExposureEvidenceLog({ entries, onChange }: Props) {
  const [draft, setDraft] = useState<EvidenceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');

  const updateDraft = <K extends keyof EvidenceDraft>(key: K, value: EvidenceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
  };
  const cancel = () => {
    setDraft(emptyDraft());
    setEditingId('');
    setError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    const entry: ExposureEvidenceEntry = {
      id: editingId || evidenceId(),
      category: draft.category,
      title: draft.title.trim(),
      detail: draft.detail.trim(),
      recordedOn: draft.recordedOn,
      reviewer: draft.reviewer.trim(),
      ...(draft.referenceUrl.trim() ? { referenceUrl: new URL(draft.referenceUrl.trim()).toString() } : {})
    };
    onChange(editingId ? entries.map((candidate) => candidate.id === editingId ? entry : candidate) : [...entries, entry]);
    cancel();
  };
  const edit = (entry: ExposureEvidenceEntry) => {
    setEditingId(entry.id);
    setDraft({ category: entry.category, title: entry.title, detail: entry.detail, recordedOn: entry.recordedOn, reviewer: entry.reviewer, referenceUrl: entry.referenceUrl ?? '' });
    setError('');
  };

  return <section className="evidence-log" aria-labelledby="evidence-log-heading">
    <div className="project-editor-heading"><div><p className="eyebrow">Assessment documentation</p><h4 id="evidence-log-heading">Evidence and review log</h4><p>Record the basis for entered values and later review. Notes support traceability but do not validate an assumption or establish compliance.</p></div><span className="evidence-count">{entries.length} / 40 entries</span></div>
    <form className="evidence-form" onSubmit={submit}>
      <div className="evidence-form-heading"><strong>{editingId ? 'Edit evidence entry' : 'Add evidence entry'}</strong><small>Required fields are marked.</small></div>
      <label className="field"><span>Category *</span><select aria-label="Evidence category" value={draft.category} onChange={(event) => updateDraft('category', event.target.value as ExposureEvidenceCategory)}>{Object.entries(evidenceCategoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="field"><span>Title *</span><input aria-label="Evidence title" maxLength={160} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label>
      <label className="field"><span>Review date *</span><input aria-label="Evidence review date" type="date" value={draft.recordedOn} onChange={(event) => updateDraft('recordedOn', event.target.value)} /></label>
      <label className="field"><span>Reviewer *</span><input aria-label="Evidence reviewer" maxLength={160} placeholder="Name or call sign" value={draft.reviewer} onChange={(event) => updateDraft('reviewer', event.target.value)} /></label>
      <label className="field evidence-detail-field"><span>Detail *</span><textarea aria-label="Evidence detail" maxLength={4000} rows={4} placeholder="State the assumption, measurement method and value, source citation, or review conclusion." value={draft.detail} onChange={(event) => updateDraft('detail', event.target.value)} /></label>
      <label className="field evidence-reference-field"><span>Reference link</span><input aria-label="Evidence reference link" type="url" maxLength={1000} placeholder="https://…" value={draft.referenceUrl} onChange={(event) => updateDraft('referenceUrl', event.target.value)} /><small>Optional. Link to a regulation, manual, calibration record, or other supporting source.</small></label>
      {error && <p className="validation-message evidence-form-error" role="alert">{error}</p>}
      <div className="evidence-form-actions"><button type="submit" disabled={!editingId && entries.length >= 40}>{editingId ? 'Save evidence changes' : 'Add to evidence log'}</button>{editingId && <button type="button" className="secondary-button" onClick={cancel}>Cancel edit</button>}</div>
    </form>
    {entries.length ? <ol className="evidence-entry-list">{entries.map((entry) => <li key={entry.id}>
      <div className="evidence-entry-heading"><span className={`evidence-category evidence-category-${entry.category}`}>{evidenceCategoryLabels[entry.category]}</span><div><button type="button" className="text-button" onClick={() => edit(entry)}>Edit</button><button type="button" className="text-button evidence-remove" onClick={() => { onChange(entries.filter((candidate) => candidate.id !== entry.id)); if (editingId === entry.id) cancel(); }}>Remove</button></div></div>
      <h5>{entry.title}</h5><p>{entry.detail}</p><small>Reviewed <time dateTime={entry.recordedOn}>{entry.recordedOn}</time> by {entry.reviewer}</small>{entry.referenceUrl && <a href={entry.referenceUrl} target="_blank" rel="noreferrer">Open supporting reference</a>}
    </li>)}</ol> : <p className="evidence-empty">No evidence entries recorded yet. Add assumptions, measurements, references, or review notes that another reviewer would need to reproduce the assessment.</p>}
  </section>;
}
