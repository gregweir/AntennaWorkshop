/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AssessmentEvidenceTarget } from '../calculators/exposureAssessmentChecklist';
import { exposureEvidenceQualityPrompts, type ExposureEvidenceCategory, type ExposureEvidenceEntry, type ExposureEvidenceRelatedField, type ExposureEvidenceScopeType } from '../projects/exposureProjectFiles';
import { HelpTip, StepByStepHelp } from './ContextHelp';

export interface EvidenceCaptureRequest {
  requestId: number;
  target: AssessmentEvidenceTarget;
}

interface Props {
  entries: ExposureEvidenceEntry[];
  sources: Array<{ id: string; label: string }>;
  points: Array<{ id: string; label: string }>;
  onChange: (entries: ExposureEvidenceEntry[]) => void;
  captureRequest?: EvidenceCaptureRequest | null;
}

type EvidenceTemplateId = 'source-reference' | 'measurement' | 'assumption' | 'review-note';

interface EvidenceTemplate {
  id: EvidenceTemplateId;
  label: string;
  category: ExposureEvidenceCategory;
  titleSuffix: string;
  description: string;
  detailPlaceholder: string;
}

const evidenceTemplates: EvidenceTemplate[] = [
  { id: 'source-reference', label: 'Manufacturer or official source', category: 'source-reference', titleSuffix: 'source reference', description: 'For manuals, regulations, data sheets, and other authoritative published material.', detailPlaceholder: 'Identify the document, issuer, revision or date, page or section, and the value or statement it supports.' },
  { id: 'measurement', label: 'Field or bench measurement', category: 'measurement', titleSuffix: 'measurement record', description: 'For measured power, dimensions, loss, position, height, or field strength.', detailPlaceholder: 'Record the measured value and units, instrument and calibration status, method, conditions, repeatability, and uncertainty.' },
  { id: 'assumption', label: 'Conservative assumption', category: 'assumption', titleSuffix: 'assumption basis', description: 'For a documented conservative choice when a verified value is not available.', detailPlaceholder: 'State the assumed value and units, why it is conservative, its source or rationale, and what would require it to be revised.' },
  { id: 'review-note', label: 'Technical review note', category: 'review-note', titleSuffix: 'review note', description: 'For inventory checks, reviewer conclusions, open questions, and follow-up actions.', detailPlaceholder: 'State what was reviewed, the conclusion, unresolved limitations, required follow-up, and who remains responsible for it.' }
];

function recommendedTemplateId(relatedField: ExposureEvidenceRelatedField): EvidenceTemplateId {
  if (relatedField === 'sourceInventoryComplete') return 'review-note';
  if (['transmitterPowerWatts', 'feedSystemLossDb', 'antennaLargestDimensionMetres', 'antennaCentreHeightMetres', 'eastOffsetMetres', 'northOffsetMetres', 'heightMetres'].includes(relatedField)) return 'measurement';
  return 'source-reference';
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

export function evidenceQualitySummary(entry: Pick<ExposureEvidenceEntry, 'category' | 'qualityChecks'>) {
  const prompts = exposureEvidenceQualityPrompts[entry.category];
  const missing = prompts.filter((prompt) => !entry.qualityChecks.includes(prompt.id));
  return { recordedCount: prompts.length - missing.length, totalCount: prompts.length, missing, complete: missing.length === 0 };
}

type EvidenceDraft = Omit<ExposureEvidenceEntry, 'id' | 'referenceUrl'> & { referenceUrl: string };

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): EvidenceDraft {
  return { category: 'assumption', title: '', detail: '', recordedOn: localDate(), reviewer: '', referenceUrl: '', scopeType: 'project', relatedField: 'general', qualityChecks: [] };
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

export function ExposureEvidenceLog({ entries, sources, points, onChange, captureRequest }: Props) {
  const [draft, setDraft] = useState<EvidenceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<EvidenceTemplateId>('assumption');
  const [detailPlaceholder, setDetailPlaceholder] = useState('State the assumption, measurement method and value, source citation, or review conclusion.');
  const formRef = useRef<HTMLFormElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!captureRequest) return;
    const { target } = captureRequest;
    setDraft({ ...emptyDraft(), scopeType: target.scopeType, scopeId: target.scopeId, relatedField: target.relatedField as ExposureEvidenceRelatedField });
    setSelectedTemplateId(recommendedTemplateId(target.relatedField as ExposureEvidenceRelatedField));
    setDetailPlaceholder('State the assumption, measurement method and value, source citation, or review conclusion.');
    setEditingId('');
    setError('');
    setFormMessage(`Evidence form prepared for ${target.label}. Choose a template or category and add the supporting record.`);
    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      categoryRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [captureRequest]);

  const updateDraft = <K extends keyof EvidenceDraft>(key: K, value: EvidenceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
  };
  const applyTemplate = () => {
    const template = evidenceTemplates.find((candidate) => candidate.id === selectedTemplateId) ?? evidenceTemplates[0];
    setDraft((current) => ({
      ...current,
      category: template.category,
      qualityChecks: current.category === template.category ? current.qualityChecks : [],
      title: current.title.trim() || `${evidenceFieldLabels[current.relatedField]} ${template.titleSuffix}`
    }));
    setDetailPlaceholder(template.detailPlaceholder);
    setError('');
    setFormMessage(`${template.label} template applied. Scope and existing text were preserved; enter the actual supporting evidence.`);
  };
  const cancel = () => {
    setDraft(emptyDraft());
    setEditingId('');
    setError('');
    setFormMessage('');
    setSelectedTemplateId('assumption');
    setDetailPlaceholder('State the assumption, measurement method and value, source citation, or review conclusion.');
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
      qualityChecks: [...draft.qualityChecks],
      ...(draft.scopeType !== 'project' ? { scopeId: draft.scopeId } : {}),
      ...(draft.referenceUrl.trim() ? { referenceUrl: new URL(draft.referenceUrl.trim()).toString() } : {})
    };
    onChange(editingId ? entries.map((candidate) => candidate.id === editingId ? entry : candidate) : [...entries, entry]);
    cancel();
  };
  const edit = (entry: ExposureEvidenceEntry) => {
    setEditingId(entry.id);
    setDraft({ category: entry.category, title: entry.title, detail: entry.detail, recordedOn: entry.recordedOn, reviewer: entry.reviewer, referenceUrl: entry.referenceUrl ?? '', scopeType: entry.scopeType, scopeId: entry.scopeId, relatedField: entry.relatedField, qualityChecks: [...entry.qualityChecks] });
    setSelectedTemplateId(entry.category);
    setDetailPlaceholder('State the assumption, measurement method and value, source citation, or review conclusion.');
    setFormMessage('');
    setError('');
  };

  return <section className="evidence-log" aria-labelledby="evidence-log-heading">
    <div className="project-editor-heading"><div><p className="eyebrow">Assessment documentation</p><h4 id="evidence-log-heading">Evidence and review log</h4><p>Link supporting records to the whole project, a transmitter, an evaluation point, or one specific input. Notes improve traceability but do not validate an assumption or establish compliance.</p></div><span className="evidence-count">{entries.length} / 120 entries</span></div>
    <StepByStepHelp title="Build a reproducible evidence entry" intro="Use these steps when you are unsure how to document an assessment input. Experienced users can leave this guide closed." steps={[
      { title: 'Choose the target', detail: 'Select the whole project, one station source, or one evaluation point, then identify the exact related input.' },
      { title: 'Choose the record type', detail: 'Select a category directly or apply a reusable template for a source, measurement, assumption, or review.' },
      { title: 'Record traceable detail', detail: 'Enter the actual value or conclusion, method or source, review date, reviewer, and an optional supporting link.' },
      { title: 'Review record quality', detail: 'Check only the prompts the written record really addresses; leave unresolved elements visible for follow-up.' },
      { title: 'Save and inspect', detail: 'Add the entry, review any follow-up warning, and edit the record when better information becomes available.' }
    ]} limit="This guide organizes documentation. It does not verify evidence, reviewer qualifications, or regulatory compliance." />
    <form ref={formRef} className="evidence-form" onSubmit={submit}>
      <div className="evidence-form-heading"><strong>{editingId ? 'Edit evidence entry' : 'Add evidence entry'}</strong><small>Required fields are marked.</small></div>
      {formMessage && <p className="evidence-capture-message" role="status" aria-live="polite">{formMessage}</p>}
      <div className="evidence-template-picker"><div><span className="help-heading"><strong>Reusable starting point</strong><HelpTip label="Evidence templates">A template suggests structure for an unsaved entry. It never supplies a measurement, citation, conclusion, or verification.</HelpTip></span><p>Templates set a category, suggest a title, and provide a detail prompt. They never supply an evidence value.</p></div><label className="field"><span>Evidence template</span><select aria-label="Evidence template" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value as EvidenceTemplateId)}>{evidenceTemplates.map((template) => <option value={template.id} key={template.id}>{template.label}</option>)}</select><small>{evidenceTemplates.find((template) => template.id === selectedTemplateId)?.description}</small></label><button type="button" onClick={applyTemplate}>Apply template</button></div>
      <label className="field"><span>Category *</span><select ref={categoryRef} aria-label="Evidence category" value={draft.category} onChange={(event) => { const category = event.target.value as ExposureEvidenceCategory; setDraft((current) => ({ ...current, category, qualityChecks: current.category === category ? current.qualityChecks : [] })); setSelectedTemplateId(category); setError(''); }}>{Object.entries(evidenceCategoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <div className="field"><span className="field-label-with-help"><label htmlFor="evidence-scope">Scope *</label><HelpTip label="Evidence scope">Use whole-project scope for site-wide records. Choose a station source or evaluation point when the evidence belongs to one modelled entity.</HelpTip></span><select id="evidence-scope" aria-label="Evidence scope" value={draft.scopeType} onChange={(event) => { const scopeType = event.target.value as ExposureEvidenceScopeType; setDraft((current) => ({ ...current, scopeType, scopeId: scopeType === 'source' ? sources[0]?.id : scopeType === 'point' ? points[0]?.id : undefined, relatedField: 'general' })); setError(''); }}>{Object.entries(scopeTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      {draft.scopeType !== 'project' && <label className="field"><span>{draft.scopeType === 'source' ? 'Station source' : 'Evaluation point'} *</span><select aria-label="Evidence scope item" value={draft.scopeId ?? ''} onChange={(event) => updateDraft('scopeId', event.target.value)}>{(draft.scopeType === 'source' ? sources : points).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>}
      <div className="field"><span className="field-label-with-help"><label htmlFor="evidence-related-input">Related input *</label><HelpTip label="Related input">Link evidence to the exact calculated value it supports. General notes remain useful, but they do not count as field-specific critical-value coverage.</HelpTip></span><select id="evidence-related-input" aria-label="Evidence related input" value={draft.relatedField} onChange={(event) => updateDraft('relatedField', event.target.value as ExposureEvidenceRelatedField)}>{relatedFields[draft.scopeType].map((field) => <option value={field} key={field}>{evidenceFieldLabels[field]}</option>)}</select></div>
      <label className="field evidence-title-field"><span>Title *</span><input aria-label="Evidence title" maxLength={160} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label>
      <label className="field"><span>Review date *</span><input aria-label="Evidence review date" type="date" value={draft.recordedOn} onChange={(event) => updateDraft('recordedOn', event.target.value)} /></label>
      <label className="field"><span>Reviewer *</span><input aria-label="Evidence reviewer" maxLength={160} placeholder="Name or call sign" value={draft.reviewer} onChange={(event) => updateDraft('reviewer', event.target.value)} /></label>
      <label className="field evidence-detail-field"><span>Detail *</span><textarea aria-label="Evidence detail" maxLength={4000} rows={4} placeholder={detailPlaceholder} value={draft.detail} onChange={(event) => updateDraft('detail', event.target.value)} /></label>
      <fieldset className="evidence-quality-checks"><legend><span className="help-heading">Record-quality prompts <HelpTip label="Record-quality prompts">A checked prompt means the author says the written record addresses that element. It is not an independent check of accuracy or completeness.</HelpTip></span></legend><p>Check only the elements actually addressed by this record. These self-declared prompts guide follow-up; they do not verify content.</p><div>{exposureEvidenceQualityPrompts[draft.category].map((prompt) => <label key={prompt.id}><input type="checkbox" checked={draft.qualityChecks.includes(prompt.id)} onChange={(event) => updateDraft('qualityChecks', event.target.checked ? [...draft.qualityChecks, prompt.id] : draft.qualityChecks.filter((check) => check !== prompt.id))} /><span>{prompt.label}</span></label>)}</div><small>{draft.qualityChecks.length} of {exposureEvidenceQualityPrompts[draft.category].length} prompts recorded.</small></fieldset>
      <label className="field evidence-reference-field"><span>Reference link</span><input aria-label="Evidence reference link" type="url" maxLength={1000} placeholder="https://…" value={draft.referenceUrl} onChange={(event) => updateDraft('referenceUrl', event.target.value)} /><small>Optional. Link to a regulation, manual, calibration record, or other supporting source.</small></label>
      {error && <p className="validation-message evidence-form-error" role="alert">{error}</p>}
      <div className="evidence-form-actions"><button type="submit" disabled={!editingId && entries.length >= 120}>{editingId ? 'Save evidence changes' : 'Add to evidence log'}</button>{editingId && <button type="button" className="secondary-button" onClick={cancel}>Cancel edit</button>}</div>
    </form>
    {entries.length ? <ol className="evidence-entry-list">{entries.map((entry) => { const quality = evidenceQualitySummary(entry); return <li key={entry.id}>
      <div className="evidence-entry-heading"><span className={`evidence-category evidence-category-${entry.category}`}>{evidenceCategoryLabels[entry.category]}</span><div><button type="button" className="text-button" onClick={() => edit(entry)}>Edit</button><button type="button" className="text-button evidence-remove" onClick={() => { onChange(entries.filter((candidate) => candidate.id !== entry.id)); if (editingId === entry.id) cancel(); }}>Remove</button></div></div>
      <span className="evidence-scope">{evidenceScopeDescription(entry, sources, points)}</span><h5>{entry.title}</h5><p>{entry.detail}</p><span className={`evidence-quality-status ${quality.complete ? 'evidence-quality-complete' : 'evidence-quality-follow-up'}`}>{quality.complete ? 'All 4 quality prompts recorded' : `${quality.recordedCount} of ${quality.totalCount} quality prompts recorded`}</span>{!quality.complete && <p className="evidence-quality-missing"><strong>Documentation follow-up:</strong> {quality.missing.map((prompt) => prompt.label).join('; ')}.</p>}<small>Reviewed <time dateTime={entry.recordedOn}>{entry.recordedOn}</time> by {entry.reviewer}</small>{entry.referenceUrl && <a href={entry.referenceUrl} target="_blank" rel="noreferrer">Open supporting reference</a>}
    </li>; })}</ol> : <p className="evidence-empty">No evidence entries recorded yet. Add assumptions, measurements, references, or review notes that another reviewer would need to reproduce the assessment.</p>}
  </section>;
}
