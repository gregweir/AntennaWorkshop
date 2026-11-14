/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateRhombic } from './rhombic';

const base = { frequencyMHz: 14.2, sideWavelengths: 2, includedAngleDegrees: 60, forwardBearingDegrees: 0, mode: 'open' as const, terminationResistanceOhms: 600, trimAllowancePercent: 2.5 };

describe('four-support rhombic site planner', () => {
  it('applies the long-wire correction and rhombus geometry', () => {
    const result = calculateRhombic(base);
    expect(result.designSideMetres).toBeCloseTo(41.72535, 5);
    expect(result.cutSideMetres).toBeCloseTo(42.76849, 5);
    expect(result.forwardDepthMetres).toBeCloseTo(72.27043, 5);
    expect(result.crossSpanMetres).toBeCloseTo(41.72535, 5);
    expect(result.totalCutWireMetres).toBeCloseTo(171.07394, 5);
  });

  it('rotates all four survey points around the feed apex', () => {
    const result = calculateRhombic({ ...base, forwardBearingDegrees: 90 });
    const [, left, far, right] = result.surveyPoints;
    expect(far.bearingDegrees).toBeCloseTo(90, 8);
    expect(far.eastMetres).toBeCloseTo(result.forwardDepthMetres, 8);
    expect(left.eastMetres).toBeCloseTo(right.eastMetres, 8);
    expect(left.northMetres).toBeCloseTo(-right.northMetres, 8);
  });

  it('keeps an entered termination explicitly outside the calculation', () => {
    const result = calculateRhombic({ ...base, mode: 'terminated', terminationResistanceOhms: 750 });
    expect(result.terminationDescription).toContain('750 Ω entered');
    expect(result.directionDescription).toContain('terminated far apex');
    expect(result.warnings[0]).toContain('planning assumption');
  });

  it('rejects unsupported or degenerate geometry', () => {
    expect(() => calculateRhombic({ ...base, sideWavelengths: 1.5 })).toThrow(RangeError);
    expect(() => calculateRhombic({ ...base, includedAngleDegrees: 10 })).toThrow(RangeError);
    expect(() => calculateRhombic({ ...base, forwardBearingDegrees: 360 })).toThrow(RangeError);
    expect(() => calculateRhombic({ ...base, terminationResistanceOhms: 0 })).toThrow(RangeError);
  });
});
