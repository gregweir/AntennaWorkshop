/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateT2fd } from './t2fd';

const input = {
  lowestFrequencyMHz: 7,
  tiltDegrees: 30,
  lowAttachmentHeightMetres: 1.8288,
  terminationResistanceOhms: 600,
  feedSystemImpedanceOhms: 600,
  transmitterPowerWatts: 100,
  wireAllowancePercent: 2.5
};

describe('Countryman T2FD starting geometry', () => {
  it('reproduces the published 7 to 35 MHz dimensions', () => {
    const result = calculateT2fd(input);
    expect(result.conductorSpacingMetres).toBeCloseTo(0.428571, 6);
    expect(result.eachHalfSpanMetres).toBeCloseTo(7.142857, 6);
    expect(result.designSpanMetres).toBeCloseTo(14.285714, 6);
    expect(result.historicalUpperFrequencyMHz).toBe(35);
    expect(result.historicalMinimumResistorRatingWatts).toBe(35);
  });

  it('derives support geometry and material without treating allowance as span', () => {
    const result = calculateT2fd(input);
    expect(result.horizontalProjectionMetres).toBeCloseTo(result.designSpanMetres * Math.cos(Math.PI / 6), 12);
    expect(result.highAttachmentHeightMetres).toBeCloseTo(1.8288 + result.designSpanMetres * 0.5, 12);
    expect(result.eachLongConductorCutMetres).toBeCloseTo(result.designSpanMetres * 1.025, 12);
    expect(result.totalConductorPurchaseMetres).toBeCloseTo(2 * (result.designSpanMetres + result.conductorSpacingMetres) * 1.025, 12);
  });

  it('reports the ideal impedance and voltage ratios as planning values', () => {
    const result = calculateT2fd({ ...input, terminationResistanceOhms: 800, feedSystemImpedanceOhms: 50 });
    expect(result.impedanceRatio).toBe(16);
    expect(result.idealVoltageTurnsRatio).toBe(4);
    expect(result.warnings.join(' ')).toContain('not a transformer design');
  });

  it('rejects invalid and unsupported inputs', () => {
    expect(() => calculateT2fd({ ...input, lowestFrequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateT2fd({ ...input, tiltDegrees: 46 })).toThrow(RangeError);
    expect(() => calculateT2fd({ ...input, terminationResistanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateT2fd({ ...input, feedSystemImpedanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateT2fd({ ...input, transmitterPowerWatts: 0 })).toThrow(RangeError);
    expect(() => calculateT2fd({ ...input, wireAllowancePercent: 26 })).toThrow(RangeError);
  });
});
