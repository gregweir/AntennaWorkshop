/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { evaluateMatchingTuningLesson } from './matchingTuningLesson';

describe('matching and tuning lesson', () => {
  it('shows that a resonant 100 ohm load is not a 50 ohm match', () => {
    const result = evaluateMatchingTuningLesson(14.2, 'resonant-mismatch', 'bypass');
    expect(result.loadIsResonant).toBe(true);
    expect(result.loadSwr).toBeCloseTo(2, 12);
    expect(result.inputSwr).toBeCloseTo(2, 12);
  });

  it('preserves the antenna-terminal load when an ideal network matches the source plane', () => {
    const result = evaluateMatchingTuningLesson(14.2, 'complex-load', 'ideal-l-match');
    expect(result.loadResistanceOhms).toBe(25);
    expect(result.loadReactanceOhms).toBe(50);
    expect(result.loadIsResonant).toBe(false);
    expect(result.inputResistanceOhms).toBeCloseTo(50, 9);
    expect(result.inputReactanceOhms).toBeCloseTo(0, 9);
    expect(result.inputSwr).toBeCloseTo(1, 9);
  });

  it('rejects unsupported selections and invalid frequencies', () => {
    expect(() => evaluateMatchingTuningLesson(14.2, 'unknown' as never, 'bypass')).toThrow(TypeError);
    expect(() => evaluateMatchingTuningLesson(0, 'complex-load', 'bypass')).toThrow(RangeError);
  });
});
