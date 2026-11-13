/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { createAcmaAssessmentRecord } from '../projects/acmaAssessmentRecords';
import { evaluateAcmaEvidence } from './acmaEvidence';

describe('ACMA clause 4 assessment evidence workflow', () => {
  it('keeps current named-standard anchors distinct from supporting quality prompts', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    const readiness = evaluateAcmaEvidence({ ...record, assessmentRoute: 'current' });
    expect(readiness.recordAnchorGaps).toContain('applicable named standard');
    expect(readiness.supportingEvidenceGaps).toContain('measurement or modelling uncertainty');
  });

  it('recognizes a documented current route without claiming compliance', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    const readiness = evaluateAcmaEvidence({
      ...record, assessmentRoute: 'current', assessmentStandard: 'as-nzs-2772-2',
      assessorName: 'Assessor', assessorQualification: 'Qualification', assessmentDate: '2026-11-13',
      measurementsAndCalculations: 'Protected attachment A'
    });
    expect(readiness.recordAnchorGaps).toEqual([]);
    expect(readiness.routeNote).toContain('actually applies');
  });

  it('requires retained-record references for every transitional route', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    for (const assessmentRoute of ['pre-2003', 'pre-class-licence', 'pre-amendment', 'post-amendment-grace'] as const) {
      expect(evaluateAcmaEvidence({ ...record, assessmentRoute }).recordAnchorGaps).toContain('transitional record reference');
    }
  });

  it('requires the associated named standard for amendment transition routes', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(evaluateAcmaEvidence({ ...record, assessmentRoute: 'post-amendment-grace', assessmentStandard: 'legacy-or-transitional' }).recordAnchorGaps).toContain('named standard associated with the amendment');
  });
});
