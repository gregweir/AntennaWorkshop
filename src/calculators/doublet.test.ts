/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateDoublet } from './doublet';

const input = {
  lowestFrequencyMHz: 3.6,
  lengthCorrectionFactor: 0.95,
  trimAllowancePercent: 2.5,
  balancedLineLengthMetres: 12,
  balancedLineVelocityFactor: 0.95,
  balancedLineImpedanceOhms: 450,
  lineCheckFrequencyMHz: 14.2
};

describe('balanced-line multiband doublet', () => {
  it('calculates equal radiator legs and line electrical length independently', () => {
    const result = calculateDoublet(input);
    expect(result.cutTotalMetres).toBeCloseTo(40.544848, 6);
    expect(result.cutLegMetres).toBeCloseTo(result.cutTotalMetres / 2, 12);
    expect(result.wavelengthInLineMetres).toBeCloseTo(20.056538, 6);
    expect(result.feedlineElectricalWavelengths).toBeCloseTo(0.598309, 6);
    expect(result.feedlinePositionWithinHalfWave).toBeCloseTo(0.098309, 6);
    expect(result.eighthWaveAdjustmentMetres).toBeCloseTo(result.wavelengthInLineMetres / 8, 12);
    expect(result.totalConductorMetres).toBeCloseTo(result.cutTotalMetres + 24, 12);
  });

  it('changes line phase without changing radiator dimensions', () => {
    const lowerFrequency = calculateDoublet({ ...input, lineCheckFrequencyMHz: 7.1 });
    const higherFrequency = calculateDoublet({ ...input, lineCheckFrequencyMHz: 28.4 });
    expect(lowerFrequency.cutTotalMetres).toBe(higherFrequency.cutTotalMetres);
    expect(higherFrequency.feedlineElectricalWavelengths).toBeCloseTo(lowerFrequency.feedlineElectricalWavelengths * 4, 12);
  });

  it('rejects unsupported physical and planning inputs', () => {
    expect(() => calculateDoublet({ ...input, lowestFrequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateDoublet({ ...input, balancedLineLengthMetres: 0 })).toThrow(RangeError);
    expect(() => calculateDoublet({ ...input, balancedLineVelocityFactor: 1.1 })).toThrow(RangeError);
    expect(() => calculateDoublet({ ...input, balancedLineImpedanceOhms: 50 })).toThrow(RangeError);
    expect(() => calculateDoublet({ ...input, lineCheckFrequencyMHz: Number.NaN })).toThrow(RangeError);
  });
});
