/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { createAcmaStationChange, isAcmaStationChange, reviewAcmaStationChange } from './acmaStationChanges';

describe('ACMA station-change review', () => {
  it('starts with explicit documentation and review gaps', () => {
    const review = reviewAcmaStationChange(createAcmaStationChange('change-1'));
    expect(review.documentationGaps).toEqual(['change date', 'change category', 'change description', 'post-change clause 3 review', 'reviewer or responsible person']);
    expect(review.followUp).toContain('complete the post-change clause 3 review');
  });

  it('keeps clause 5 and declaration-review categories distinct', () => {
    const location = reviewAcmaStationChange({ ...createAcmaStationChange('change-1'), categories: ['location'] });
    expect(location.clause5CategorySelected).toBe(true);
    expect(location.declarationReviewRelevant).toBe(true);
    const power = reviewAcmaStationChange({ ...createAcmaStationChange('change-2'), categories: ['power'] });
    expect(power.clause5CategorySelected).toBe(true);
    expect(power.declarationReviewRelevant).toBe(false);
  });

  it('requires a supporting record when clause 4 action is documented', () => {
    const change = { ...createAcmaStationChange('change-1'), lowRiskReview: 'clause-4-applies' as const, assessmentAction: 'new-assessment-completed' as const };
    expect(reviewAcmaStationChange(change).followUp).toContain('identify the supporting assessment record');
  });

  it('requires a reference for a newly made declaration', () => {
    const change = { ...createAcmaStationChange('change-1'), categories: ['antenna-height' as const], declarationAction: 'new-declaration-made' as const };
    expect(reviewAcmaStationChange(change).followUp).toContain('identify the new declaration');
  });

  it('validates portable change entries and rejects duplicate categories', () => {
    expect(isAcmaStationChange(createAcmaStationChange('change-1'))).toBe(true);
    expect(isAcmaStationChange({ ...createAcmaStationChange('change-1'), categories: ['power', 'power'] })).toBe(false);
    expect(isAcmaStationChange({ ...createAcmaStationChange('change-1'), changeDate: 'not-a-date' })).toBe(false);
  });
});
