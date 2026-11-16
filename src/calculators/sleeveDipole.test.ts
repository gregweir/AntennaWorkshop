/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateSleeveDipole } from './sleeveDipole';

const base = { frequencyMHz: 146, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, construction: 'rigid-sleeve' as const, feedlineOutsideDiameterMillimetres: 10.3, sleeveInsideDiameterMillimetres: 18 };

describe('sleeve or coaxial vertical dipole', () => {
  it('calculates two equal corrected quarter-wave external elements', () => {
    const result = calculateSleeveDipole(base);
    expect(result.wavelengthMetres).toBeCloseTo(2.053373, 6);
    expect(result.freeSpaceQuarterWaveMetres).toBeCloseTo(0.513343, 6);
    expect(result.designUpperRadiatorMetres).toBeCloseTo(0.487676, 6);
    expect(result.designSleeveMetres).toBe(result.designUpperRadiatorMetres);
    expect(result.designOverallSpanMetres).toBeCloseTo(0.975352, 6);
    expect(result.cutUpperRadiatorMetres).toBeCloseTo(0.499868, 6);
  });

  it('reports rigid-sleeve clearance without treating coax velocity factor as a length input', () => {
    const result = calculateSleeveDipole(base);
    expect(result.radialClearanceMillimetres).toBeCloseTo(3.85, 6);
    expect(result.warnings.join(' ')).toContain('velocity factor does not set');
    expect(result.warnings.join(' ')).toContain('not proof that common-mode current is absent');
  });

  it('supports a fold-back braid construction without a rigid-sleeve clearance claim', () => {
    const result = calculateSleeveDipole({ ...base, construction: 'foldback-braid' });
    expect(result.radialClearanceMillimetres).toBeNull();
    expect(result.warnings.join(' ')).toContain('Braid stretch');
  });

  it('rejects impossible or unsupported construction inputs', () => {
    expect(() => calculateSleeveDipole({ ...base, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateSleeveDipole({ ...base, lengthCorrectionFactor: 1.3 })).toThrow(RangeError);
    expect(() => calculateSleeveDipole({ ...base, sleeveInsideDiameterMillimetres: 10.3 })).toThrow(RangeError);
  });
});
