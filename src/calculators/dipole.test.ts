/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateHalfWaveDipole } from './dipole';

describe('half-wave dipole calculator', () => {
  it('calculates a 14.2 MHz starting length with a 0.95 factor', () => {
    const result = calculateHalfWaveDipole({
      frequencyMHz: 14.2,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 0
    });

    expect(result.wavelengthMetres).toBeCloseTo(21.1121, 4);
    expect(result.resonantTotalMetres).toBeCloseTo(10.0283, 4);
    expect(result.resonantLegMetres).toBeCloseTo(5.0141, 4);
  });

  it('adds trim allowance after calculating the resonant estimate', () => {
    const result = calculateHalfWaveDipole({
      frequencyMHz: 14.2,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 2.5
    });

    expect(result.cutTotalMetres).toBeCloseTo(result.resonantTotalMetres * 1.025, 10);
  });

  it('rejects invalid parameters', () => {
    expect(() =>
      calculateHalfWaveDipole({ frequencyMHz: 0, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5 })
    ).toThrow(RangeError);
    expect(() =>
      calculateHalfWaveDipole({ frequencyMHz: 7.1, lengthCorrectionFactor: 1.2, trimAllowancePercent: 2.5 })
    ).toThrow(RangeError);
  });
});
