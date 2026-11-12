/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { AssessmentChecklistInput } from './exposureAssessmentChecklist';
import { calculateAssessmentChecklist } from './exposureAssessmentChecklist';

const project: AssessmentChecklistInput = {
  jurisdiction: 'CA', environment: 'uncontrolled', sourceInventoryComplete: true,
  sources: [{ id: 'source', label: 'Vertical', frequencyMHz: 146, transmitterPowerWatts: 50, dutyCyclePercent: 50, feedSystemLossDb: 1, antennaGainDbi: 2.15, antennaLargestDimensionMetres: 1, antennaCentreHeightMetres: 10, eastOffsetMetres: 0, northOffsetMetres: 0, patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }],
  evaluationPoints: [{ id: 'yard', label: 'Yard', eastOffsetMetres: 15, northOffsetMetres: 0, heightMetres: 1.5 }],
  evidenceEntries: [
    { category: 'assumption', scopeType: 'project', relatedField: 'sourceInventoryComplete' },
    { category: 'measurement', scopeType: 'source', scopeId: 'source', relatedField: 'antennaCentreHeightMetres' },
    { category: 'source-reference', scopeType: 'source', scopeId: 'source', relatedField: 'antennaGainDbi' },
    { category: 'review-note', scopeType: 'point', scopeId: 'yard', relatedField: 'heightMetres' }
  ]
};

describe('assessment review checklist', () => {
  it('records a valid below-trigger project without treating external review as complete', () => {
    const checklist = calculateAssessmentChecklist(project);
    expect(checklist.items).toHaveLength(10);
    expect(checklist.recordedCount).toBe(8);
    expect(checklist.requiredCount).toBe(0);
    expect(checklist.attentionCount).toBe(1);
    expect(checklist.externalReviewCount).toBe(1);
    expect(checklist.items.find((item) => item.id === 'screening-outcome')?.detail).toMatch(/not a compliance determination/i);
    expect(checklist.items.find((item) => item.id === 'independent-review')?.status).toBe('external-review');
  });

  it('identifies an incomplete inventory and missing evidence categories', () => {
    const checklist = calculateAssessmentChecklist({ ...project, sourceInventoryComplete: false, evidenceEntries: [] });
    expect(checklist.requiredCount).toBe(2);
    expect(checklist.attentionCount).toBe(5);
    expect(checklist.items.find((item) => item.id === 'source-inventory')?.status).toBe('required');
    expect(checklist.items.find((item) => item.id === 'screening-outcome')?.detail).toMatch(/inconclusive/i);
  });

  it('reports field-specific evidence coverage without counting general notes', () => {
    const checklist = calculateAssessmentChecklist(project);
    expect(checklist.items.find((item) => item.id === 'critical-input-evidence')).toMatchObject({ status: 'attention' });
    expect(checklist.items.find((item) => item.id === 'critical-input-evidence')?.detail).toContain('4 of 13 critical values');
    expect(checklist.missingEvidenceTargets).toHaveLength(9);
    expect(checklist.missingEvidenceTargets).toContainEqual({ scopeType: 'source', scopeId: 'source', relatedField: 'transmitterPowerWatts', label: 'Vertical · Transmitter output' });
    const generalOnly = calculateAssessmentChecklist({ ...project, evidenceEntries: project.evidenceEntries.map((entry) => ({ ...entry, scopeType: 'project', scopeId: undefined, relatedField: 'general' })) });
    expect(generalOnly.items.find((item) => item.id === 'critical-input-evidence')?.detail).toContain('0 of 13 critical values');
    expect(generalOnly.missingEvidenceTargets).toHaveLength(13);
  });

  it('identifies far-field inapplicability and calls for a suitable external method', () => {
    const checklist = calculateAssessmentChecklist({ ...project, evaluationPoints: [{ ...project.evaluationPoints[0], eastOffsetMetres: 0, heightMetres: 9.9 }] });
    expect(checklist.items.find((item) => item.id === 'far-field-applicability')).toMatchObject({ status: 'required' });
    expect(checklist.items.find((item) => item.id === 'screening-outcome')).toMatchObject({ status: 'required' });
    expect(checklist.items.find((item) => item.id === 'independent-review')?.detail).toMatch(/near-field method or measurement/i);
  });

  it('identifies trigger escalation and invalid inputs without throwing', () => {
    const escalation = calculateAssessmentChecklist({ ...project, sources: [{ ...project.sources[0], transmitterPowerWatts: 10_000 }] });
    expect(escalation.items.find((item) => item.id === 'screening-outcome')).toMatchObject({ status: 'required' });
    expect(escalation.items.find((item) => item.id === 'independent-review')?.detail).toMatch(/detailed calculations/i);

    const invalid = calculateAssessmentChecklist({ ...project, sources: [{ ...project.sources[0], frequencyMHz: -1 }] });
    expect(invalid.items.find((item) => item.id === 'input-validity')).toMatchObject({ status: 'required' });
    expect(invalid.items.find((item) => item.id === 'far-field-applicability')?.detail).toMatch(/until project inputs are valid/i);
  });
});
