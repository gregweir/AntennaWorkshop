/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateQuarterWaveTransformer } from './quarterWaveTransformer';

describe('single-section quarter-wave transformer', () => {
  it('matches a 100 ohm real load to a 50 ohm source', () => {
    const result = calculateQuarterWaveTransformer({ frequencyMHz: 14.2, sourceResistanceOhms: 50, loadResistanceOhms: 100, velocityFactor: 0.66, trimAllowancePercent: 5 });
    expect(result.requiredCharacteristicImpedanceOhms).toBeCloseTo(70.710678, 6);
    expect(result.physicalQuarterWaveMetres).toBeCloseTo(3.4835039, 6);
    expect(result.cutLengthMetres).toBeCloseTo(3.6576791, 6);
    expect(result.idealInputResistanceOhms).toBeCloseTo(50, 12);
    expect(result.electricalLengthDegrees).toBe(90);
    expect(result.oneWayDelayNanoseconds).toBeCloseTo(17.6056338, 6);
  });

  it('uses the same line impedance in the reciprocal direction', () => {
    const result = calculateQuarterWaveTransformer({ frequencyMHz: 14.2, sourceResistanceOhms: 100, loadResistanceOhms: 50, velocityFactor: 1, trimAllowancePercent: 0 });
    expect(result.requiredCharacteristicImpedanceOhms).toBeCloseTo(70.710678, 6);
    expect(result.idealInputResistanceOhms).toBeCloseTo(100, 12);
    expect(result.resistanceRatio).toBe(0.5);
  });

  it('applies velocity factor and trim allowance only to physical length', () => {
    const airLine = calculateQuarterWaveTransformer({ frequencyMHz: 100, sourceResistanceOhms: 50, loadResistanceOhms: 200, velocityFactor: 1, trimAllowancePercent: 0 });
    const cable = calculateQuarterWaveTransformer({ frequencyMHz: 100, sourceResistanceOhms: 50, loadResistanceOhms: 200, velocityFactor: 0.8, trimAllowancePercent: 10 });
    expect(cable.physicalQuarterWaveMetres).toBeCloseTo(airLine.physicalQuarterWaveMetres * 0.8, 12);
    expect(cable.cutLengthMetres).toBeCloseTo(cable.physicalQuarterWaveMetres * 1.1, 12);
    expect(cable.requiredCharacteristicImpedanceOhms).toBe(100);
  });

  it('rejects nonphysical and unsupported inputs', () => {
    const valid = { frequencyMHz: 14.2, sourceResistanceOhms: 50, loadResistanceOhms: 100, velocityFactor: 0.66, trimAllowancePercent: 5 };
    expect(() => calculateQuarterWaveTransformer({ ...valid, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateQuarterWaveTransformer({ ...valid, sourceResistanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateQuarterWaveTransformer({ ...valid, loadResistanceOhms: Number.NaN })).toThrow(RangeError);
    expect(() => calculateQuarterWaveTransformer({ ...valid, velocityFactor: 1.01 })).toThrow(RangeError);
    expect(() => calculateQuarterWaveTransformer({ ...valid, trimAllowancePercent: 26 })).toThrow(RangeError);
  });
});
