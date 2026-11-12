/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useState } from 'react';
import type { AssessmentCheckStatus, AssessmentChecklistResult, AssessmentEvidenceTarget } from '../calculators/exposureAssessmentChecklist';

interface Props {
  checklist: AssessmentChecklistResult;
  onDocumentTarget?: (target: AssessmentEvidenceTarget) => void;
}

const statusLabels: Record<AssessmentCheckStatus, string> = {
  recorded: 'Recorded',
  attention: 'Documentation gap',
  required: 'Action required',
  'external-review': 'External review'
};

function summary(checklist: AssessmentChecklistResult) {
  if (checklist.requiredCount) return ['Review blockers remain', `${checklist.requiredCount} ${checklist.requiredCount === 1 ? 'item requires' : 'items require'} action before this preliminary assessment can be interpreted.`];
  if (checklist.attentionCount) return ['Documentation gaps remain', `${checklist.attentionCount} supporting ${checklist.attentionCount === 1 ? 'category needs' : 'categories need'} attention.`];
  return ['Recorded checks are complete', 'The documented checks have no identified gaps, but independent technical review remains external to this application.'];
}

function targetKey(target: AssessmentEvidenceTarget) {
  return `${target.scopeType}:${target.scopeId ?? ''}:${target.relatedField}`;
}

export function AssessmentReadinessPanel({ checklist, onDocumentTarget }: Props) {
  const [heading, detail] = summary(checklist);
  const [selectedTargetKey, setSelectedTargetKey] = useState(() => checklist.missingEvidenceTargets[0] ? targetKey(checklist.missingEvidenceTargets[0]) : '');
  const selectedTarget = checklist.missingEvidenceTargets.find((target) => targetKey(target) === selectedTargetKey) ?? checklist.missingEvidenceTargets[0];

  return <section className="assessment-checklist" aria-labelledby="assessment-checklist-heading">
    <div className="assessment-checklist-heading"><div><p className="eyebrow">Review aid · not a certification</p><h4 id="assessment-checklist-heading">Assessment review checklist</h4><p>Tracks model prerequisites and documentation categories. It does not score compliance or verify the quality of recorded evidence.</p></div><div className="assessment-checklist-summary" aria-live="polite"><strong>{heading}</strong><span>{detail}</span></div></div>
    <div className="assessment-status-counts" aria-label="Checklist status summary"><span className="assessment-count-recorded"><b>{checklist.recordedCount}</b> recorded</span><span className="assessment-count-attention"><b>{checklist.attentionCount}</b> documentation gaps</span><span className="assessment-count-required"><b>{checklist.requiredCount}</b> action required</span><span className="assessment-count-external-review"><b>{checklist.externalReviewCount}</b> external review</span></div>
    <div className="assessment-status-strip" style={{ gridTemplateColumns: `repeat(${checklist.items.length}, 1fr)` }} aria-hidden="true">{checklist.items.map((item) => <span className={`assessment-strip-${item.status}`} key={item.id} />)}</div>
    <ul className="assessment-check-list">{checklist.items.map((item) => <li className={`assessment-check-${item.status}`} key={item.id}><span className="assessment-check-icon" aria-hidden="true">{item.status === 'recorded' ? '✓' : item.status === 'attention' ? '!' : item.status === 'required' ? '×' : '↗'}</span><div><div><h5>{item.label}</h5><span>{statusLabels[item.status]}</span></div><p>{item.detail}</p>{item.id === 'critical-input-evidence' && selectedTarget && onDocumentTarget && <div className="assessment-evidence-guide"><label><span>Missing critical value</span><select aria-label="Missing critical value" value={targetKey(selectedTarget)} onChange={(event) => setSelectedTargetKey(event.target.value)}>{checklist.missingEvidenceTargets.map((target) => <option value={targetKey(target)} key={targetKey(target)}>{target.label}</option>)}</select></label><button type="button" onClick={() => onDocumentTarget(selectedTarget)}>Document selected value</button></div>}</div></li>)}</ul>
    <p className="assessment-checklist-limit"><strong>Interpretation limit:</strong> A complete checklist is not a compliance result. Regulatory evaluation may require qualified engineering analysis, measurements, records, or authority-specific procedures outside this application.</p>
  </section>;
}
