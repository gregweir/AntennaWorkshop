/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateSameSwrComparison } from './swrImpedanceLesson';

describe('same-SWR impedance lesson', () => {
  it('constructs distinct 50-ohm loads with the same 2:1 SWR', () => {
    const result = calculateSameSwrComparison(2);
    expect(result.reflectionMagnitude).toBeCloseTo(1 / 3, 12);
    expect(result.reflectedPowerPercent).toBeCloseTo(100 / 9, 12);
    expect(result.examples.map((example) => example.resistanceOhms)).toEqual([100, 25, 50]);
    expect(result.examples[2].reactanceOhms).toBeCloseTo(35.355339, 6);
    result.examples.forEach((example) => expect(example.swr).toBeCloseTo(2, 12));
    expect(result.examples.map((example) => Math.round(example.reflectionPhaseDegrees))).toEqual([0, 180, 71]);
  });

  it('scales examples to a different reference resistance', () => {
    const result = calculateSameSwrComparison(3, 75);
    expect(result.examples[0].resistanceOhms).toBe(225);
    expect(result.examples[1].resistanceOhms).toBe(25);
    expect(result.examples[2].resistanceOhms).toBe(75);
    result.examples.forEach((example) => expect(example.swr).toBeCloseTo(3, 12));
  });

  it('rejects unsupported SWR and reference values', () => {
    expect(() => calculateSameSwrComparison(1)).toThrow(RangeError);
    expect(() => calculateSameSwrComparison(10.1)).toThrow(RangeError);
    expect(() => calculateSameSwrComparison(2, 0)).toThrow(RangeError);
  });
});
