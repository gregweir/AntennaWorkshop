/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateElectricalLengthComparison } from './electricalLengthLesson';

describe('electrical-length lesson', () => {
  it('shows that doubling frequency halves free-space wavelength and half-wave length', () => {
    const result = calculateElectricalLengthComparison(14.2, 2);
    expect(result.base.wavelengthMetres).toBeCloseTo(21.11214493, 7);
    expect(result.comparison.frequencyMHz).toBe(28.4);
    expect(result.halfWaveLengthRatio).toBeCloseTo(0.5, 12);
    expect(result.halfWaveChangePercent).toBeCloseTo(-50, 12);
  });

  it('shows that halving frequency doubles the half-wave length', () => {
    const result = calculateElectricalLengthComparison(14.2, 0.5);
    expect(result.comparison.frequencyMHz).toBe(7.1);
    expect(result.halfWaveLengthRatio).toBeCloseTo(2, 12);
    expect(result.halfWaveChangePercent).toBeCloseTo(100, 12);
  });

  it('rejects invalid frequencies and comparison multipliers', () => {
    expect(() => calculateElectricalLengthComparison(0, 1)).toThrow(RangeError);
    expect(() => calculateElectricalLengthComparison(14.2, 0.49)).toThrow(RangeError);
    expect(() => calculateElectricalLengthComparison(14.2, Number.NaN)).toThrow(RangeError);
  });
});
