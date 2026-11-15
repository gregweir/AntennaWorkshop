/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { evaluateSwrEvidenceLesson } from './swrEvidenceLesson';

describe('SWR evidence lesson', () => {
  it('preserves a 2:1 SWR through the lossless line', () => {
    const result = evaluateSwrEvidenceLesson(14.2, '0', 'bypass');
    expect(result.antennaSwr).toBeCloseTo(2, 12);
    expect(result.lineInputSwr).toBeCloseTo(2, 10);
    expect(result.sourceSwr).toBeCloseTo(2, 10);
  });

  it('shows that line attenuation lowers source-end SWR while losing matched power', () => {
    const result = evaluateSwrEvidenceLesson(14.2, '3', 'bypass');
    expect(result.antennaSwr).toBeCloseTo(2, 12);
    expect(result.lineInputSwr).toBeCloseTo(1.40114, 5);
    expect(result.matchedOneWayPowerRemainingPercent).toBeCloseTo(50.1187, 4);
    expect(result.roundTripReflectionAttenuationDb).toBe(6);
  });

  it('keeps the load and line-input results visible behind an ideal source match', () => {
    const result = evaluateSwrEvidenceLesson(14.2, '1', 'ideal-match');
    expect(result.antennaSwr).toBeCloseTo(2, 12);
    expect(result.lineInputSwr).toBeGreaterThan(1);
    expect(result.sourceSwr).toBe(1);
  });

  it('rejects unsupported selections', () => {
    expect(() => evaluateSwrEvidenceLesson(14.2, '2' as never, 'bypass')).toThrow(TypeError);
  });
});
