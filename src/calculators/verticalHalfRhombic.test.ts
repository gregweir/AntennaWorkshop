/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateVerticalHalfRhombic } from './verticalHalfRhombic';

const base = { frequencyMHz: 7.1, totalWireWavelengths: 2, apexHeightMetres: 6, forwardBearingDegrees: 0, mode: 'terminated' as const, terminationResistanceOhms: 550, attachmentAllowancePercent: 2.5 };

describe('vertical half-rhombic site planner', () => {
  it('applies the long-wire correction and resolves the elevation geometry', () => {
    const result = calculateVerticalHalfRhombic(base);
    expect(result.designRadiatorMetres).toBeCloseTo(83.4507, 4);
    expect(result.designLegMetres).toBeCloseTo(41.72535, 5);
    expect(result.baseSpanMetres).toBeCloseTo(82.583, 3);
    expect(result.cutRadiatorMetres).toBeCloseTo(85.53697, 5);
    expect(result.designCounterpoiseMetres).toBe(result.baseSpanMetres);
  });

  it('rotates the apex and far-end survey points to the true bearing', () => {
    const result = calculateVerticalHalfRhombic({ ...base, forwardBearingDegrees: 90 });
    expect(result.surveyPoints[1].eastMetres).toBeCloseTo(result.horizontalLegRunMetres, 8);
    expect(result.surveyPoints[1].northMetres).toBeCloseTo(0, 8);
    expect(result.surveyPoints[2].bearingDegrees).toBe(90);
  });

  it('preserves sourced termination and height warnings', () => {
    const result = calculateVerticalHalfRhombic({ ...base, apexHeightMetres: 2, terminationResistanceOhms: 750 });
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain('3–7 m');
    expect(result.warnings[1]).toContain('500–600 Ω');
  });

  it('rejects impossible or unsupported inputs', () => {
    expect(() => calculateVerticalHalfRhombic({ ...base, frequencyMHz: 31 })).toThrow(RangeError);
    expect(() => calculateVerticalHalfRhombic({ ...base, totalWireWavelengths: 1 })).toThrow(RangeError);
    expect(() => calculateVerticalHalfRhombic({ ...base, apexHeightMetres: 50 })).toThrow(RangeError);
    expect(() => calculateVerticalHalfRhombic({ ...base, forwardBearingDegrees: 360 })).toThrow(RangeError);
  });
});
