/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useState, type FormEvent } from 'react';
import type { ExposureEvidenceCategory, ExposureEvidenceEntry, ExposureEvidenceRelatedField, ExposureEvidenceScopeType } from '../projects/exposureProjectFiles';

interface Props {
  entries: ExposureEvidenceEntry[];
  sources: Array<{ id: string; label: string }>;
  points: Array<{ id: string; label: string }>;
  onChange: (entries: ExposureEvidenceEntry[]) => void;
}

export const evidenceCategoryLabels: Record<ExposureEvidenceCategory, string> = {
  assumption: 'Assumption',
  measurement: 'Measurement',
  'source-reference': 'Source reference',
  'review-note': 'Review note'
};

const scopeTypeLabels: Record<ExposureEvidenceScopeType, string> = {
  project: 'Whole project',
  source: 'Station source',
  point: 'Evaluation point'
};

export const evidenceFieldLabels: Record<ExposureEvidenceRelatedField, string> = {
  general: 'General / multiple inputs',
  jurisdiction: 'Jurisdiction',
  environment: 'Exposure environment',
  sourceInventoryComplete: 'Source inventory confirmation',
  frequencyMHz: 'Frequency',
  transmitterPowerWatts: 'Transmitter output',
  dutyCyclePercent: 'Duty cycle',
  feedSystemLossDb: 'Feed-system loss',
  antennaGainDbi: 'Maximum antenna gain',
  antennaLargestDimensionMetres: 'Largest antenna dimension',
  antennaCentreHeightMetres: 'Antenna centre height',
  eastOffsetMetres: 'East position',
  northOffsetMetres: 'North position',
  patternType: 'Azimuth pattern',
  bearingDegrees: 'Maximum-response bearing',
  beamwidthDegrees: 'Horizontal beamwidth',
  heightMetres: 'Evaluation-point height'
};

const relatedFields: Record<ExposureEvidenceScopeType, ExposureEvidenceRelatedField[]> = {
  project: ['general', 'jurisdiction', 'environment', 'sourceInventoryComplete'],
  source: ['general', 'frequencyMHz', 'transmitterPowerWatts', 'dutyCyclePercent', 'feedSystemLossDb', 'antennaGainDbi', 'antennaLargestDimensionMetres', 'antennaCentreHeightMetres', 'eastOffsetMetres', 'northOffsetMetres', 'patternType', 'bearingDegrees', 'beamwidthDegrees'],
  point: ['general', 'eastOffsetMetres', 'northOffsetMetres', 'heightMetres']
};

export function evidenceScopeDescription(entry: ExposureEvidenceEntry, sources: Array<{ id: string; label: string }>, points: Array<{ id: string; label: string }>) {
  const entity = entry.scopeType === 'project'
    ? 'Whole project'
    : entry.scopeType === 'source'
      ? sources.find((source) => source.id === entry.scopeId)?.label ?? 'Missing station source'
      : points.find((point) => point.id === entry.scopeId)?.label ?? 'Missing evaluation point';
  return `${entity} · ${evidenceFieldLabels[entry.relatedField]}`;
}

type EvidenceDraft = Omit<ExposureEvidenceEntry, 'id' | 'referenceUrl'> & { referenceUrl: string };

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): EvidenceDraft {
  return { category: 'assumption', title: '', detail: '', recordedOn: localDate(), reviewer: '', referenceUrl: '', scopeType: 'project', relatedField: 'general' };
}

function evidenceId() {
  return globalThis.crypto?.randomUUID?.() ?? `evidence-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateDraft(draft: EvidenceDraft, sources: Props['sources'], points: Props['points']) {
  if (!draft.title.trim() || !draft.detail.trim() || !draft.recordedOn || !draft.reviewer.trim()) return 'Enter a title, detail, review date, and reviewer.';
  if (draft.title.length > 160 || draft.detail.length > 4000 || draft.reviewer.length > 160) return 'The evidence entry exceeds a permitted text length.';
  const date = new Date(`${draft.recordedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.recordedOn) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== draft.recordedOn) return 'Enter a valid review date.';
  if (draft.scopeType === 'source' && !sources.some((source) => source.id === draft.scopeId)) return 'Select an existing station source for this evidence.';
  if (draft.scopeType === 'point' && !points.some((point) => point.id === draft.scopeId)) return 'Select an existing evaluation point for this evidence.';
  if (!relatedFields[draft.scopeType].includes(draft.relatedField)) return 'Select a related input that belongs to the chosen scope.';
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

export function ExposureEvidenceLog({ entries, sources, points, onChange }: Props) {
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
    const validationError = validateDraft(draft, sources, points);
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
      scopeType: draft.scopeType,
      relatedField: draft.relatedField,
      ...(draft.scopeType !== 'project' ? { scopeId: draft.scopeId } : {}),
      ...(draft.referenceUrl.trim() ? { referenceUrl: new URL(draft.referenceUrl.trim()).toString() } : {})
    };
    onChange(editingId ? entries.map((candidate) => candidate.id === editingId ? entry : candidate) : [...entries, entry]);
    cancel();
  };
  const edit = (entry: ExposureEvidenceEntry) => {
    setEditingId(entry.id);
    setDraft({ category: entry.category, title: entry.title, detail: entry.detail, recordedOn: entry.recordedOn, reviewer: entry.reviewer, referenceUrl: entry.referenceUrl ?? '', scopeType: entry.scopeType, scopeId: entry.scopeId, relatedField: entry.relatedField });
    setError('');
  };

  return <section className="evidence-log" aria-labelledby="evidence-log-heading">
    <div className="project-editor-heading"><div><p className="eyebrow">Assessment documentation</p><h4 id="evidence-log-heading">Evidence and review log</h4><p>Link supporting records to the whole project, a transmitter, an evaluation point, or one specific input. Notes improve traceability but do not validate an assumption or establish compliance.</p></div><span className="evidence-count">{entries.length} / 120 entries</span></div>
    <form className="evidence-form" onSubmit={submit}>
      <div className="evidence-form-heading"><strong>{editingId ? 'Edit evidence entry' : 'Add evidence entry'}</strong><small>Required fields are marked.</small></div>
      <label className="field"><span>Category *</span><select aria-label="Evidence category" value={draft.category} onChange={(event) => updateDraft('category', event.target.value as ExposureEvidenceCategory)}>{Object.entries(evidenceCategoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="field"><span>Scope *</span><select aria-label="Evidence scope" value={draft.scopeType} onChange={(event) => { const scopeType = event.target.value as ExposureEvidenceScopeType; setDraft((current) => ({ ...current, scopeType, scopeId: scopeType === 'source' ? sources[0]?.id : scopeType === 'point' ? points[0]?.id : undefined, relatedField: 'general' })); setError(''); }}>{Object.entries(scopeTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      {draft.scopeType !== 'project' && <label className="field"><span>{draft.scopeType === 'source' ? 'Station source' : 'Evaluation point'} *</span><select aria-label="Evidence scope item" value={draft.scopeId ?? ''} onChange={(event) => updateDraft('scopeId', event.target.value)}>{(draft.scopeType === 'source' ? sources : points).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>}
      <label className="field"><span>Related input *</span><select aria-label="Evidence related input" value={draft.relatedField} onChange={(event) => updateDraft('relatedField', event.target.value as ExposureEvidenceRelatedField)}>{relatedFields[draft.scopeType].map((field) => <option value={field} key={field}>{evidenceFieldLabels[field]}</option>)}</select></label>
      <label className="field"><span>Title *</span><input aria-label="Evidence title" maxLength={160} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label>
      <label className="field"><span>Review date *</span><input aria-label="Evidence review date" type="date" value={draft.recordedOn} onChange={(event) => updateDraft('recordedOn', event.target.value)} /></label>
      <label className="field"><span>Reviewer *</span><input aria-label="Evidence reviewer" maxLength={160} placeholder="Name or call sign" value={draft.reviewer} onChange={(event) => updateDraft('reviewer', event.target.value)} /></label>
      <label className="field evidence-detail-field"><span>Detail *</span><textarea aria-label="Evidence detail" maxLength={4000} rows={4} placeholder="State the assumption, measurement method and value, source citation, or review conclusion." value={draft.detail} onChange={(event) => updateDraft('detail', event.target.value)} /></label>
      <label className="field evidence-reference-field"><span>Reference link</span><input aria-label="Evidence reference link" type="url" maxLength={1000} placeholder="https://…" value={draft.referenceUrl} onChange={(event) => updateDraft('referenceUrl', event.target.value)} /><small>Optional. Link to a regulation, manual, calibration record, or other supporting source.</small></label>
      {error && <p className="validation-message evidence-form-error" role="alert">{error}</p>}
      <div className="evidence-form-actions"><button type="submit" disabled={!editingId && entries.length >= 120}>{editingId ? 'Save evidence changes' : 'Add to evidence log'}</button>{editingId && <button type="button" className="secondary-button" onClick={cancel}>Cancel edit</button>}</div>
    </form>
    {entries.length ? <ol className="evidence-entry-list">{entries.map((entry) => <li key={entry.id}>
      <div className="evidence-entry-heading"><span className={`evidence-category evidence-category-${entry.category}`}>{evidenceCategoryLabels[entry.category]}</span><div><button type="button" className="text-button" onClick={() => edit(entry)}>Edit</button><button type="button" className="text-button evidence-remove" onClick={() => { onChange(entries.filter((candidate) => candidate.id !== entry.id)); if (editingId === entry.id) cancel(); }}>Remove</button></div></div>
      <span className="evidence-scope">{evidenceScopeDescription(entry, sources, points)}</span><h5>{entry.title}</h5><p>{entry.detail}</p><small>Reviewed <time dateTime={entry.recordedOn}>{entry.recordedOn}</time> by {entry.reviewer}</small>{entry.referenceUrl && <a href={entry.referenceUrl} target="_blank" rel="noreferrer">Open supporting reference</a>}
    </li>)}</ol> : <p className="evidence-empty">No evidence entries recorded yet. Add assumptions, measurements, references, or review notes that another reviewer would need to reproduce the assessment.</p>}
  </section>;
}
