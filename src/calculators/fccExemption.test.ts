/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateFccSingleSourceExemption,
  getCloseProximityThresholdWatts,
  getDistanceErpThresholdWatts,
  type FccExemptionInput
} from './fccExemption';

const baseInput: FccExemptionInput = {
  frequencyMHz: 146,
  availableMaximumTimeAveragedPowerWatts: 50,
  maximumTimeAveragedErpWatts: 100,
  separationDistanceMetres: 10
};

describe('FCC single-source exemption', () => {
  it('applies the one-milliwatt criterion inclusively at any separation', () => {
    const result = calculateFccSingleSourceExemption({
      ...baseInput,
      frequencyMHz: 0.1,
      availableMaximumTimeAveragedPowerWatts: 0.001,
      maximumTimeAveragedErpWatts: 1,
      separationDistanceMetres: 0.001
    });
    expect(result.status).toBe('exempt-from-routine-evaluation');
    expect(result.governingCriterionId).toBe('one-milliwatt');
    expect(result.criteria[0]).toMatchObject({ applicable: true, passes: true, thresholdWatts: 0.001 });
  });

  it('implements the close-proximity Pth equation and uses the greater power value', () => {
    const threshold = getCloseProximityThresholdWatts(1000, 0.1);
    const expectedExponent = -Math.log10(60 / (2040 * Math.sqrt(1)));
    expect(threshold).toBeCloseTo(2.04 * 0.5 ** expectedExponent, 12);
    const result = calculateFccSingleSourceExemption({
      frequencyMHz: 1000,
      availableMaximumTimeAveragedPowerWatts: 0.5,
      maximumTimeAveragedErpWatts: threshold!,
      separationDistanceMetres: 0.1
    });
    expect(result.criteria[1]).toMatchObject({ applicable: true, passes: true });
    expect(result.governingCriterionId).toBe('close-proximity');
  });

  it('holds the close-proximity threshold constant from 20 through 40 centimetres', () => {
    expect(getCloseProximityThresholdWatts(300, 0.005)).not.toBeNull();
    expect(getCloseProximityThresholdWatts(300, 0.00499)).toBeNull();
    expect(getCloseProximityThresholdWatts(1500, 0.2)).toBeCloseTo(3.06, 12);
    expect(getCloseProximityThresholdWatts(1500, 0.4)).toBeCloseTo(3.06, 12);
    expect(getCloseProximityThresholdWatts(6000, 0.4)).toBeCloseTo(3.06, 12);
    expect(getCloseProximityThresholdWatts(1500, 0.40001)).toBeNull();
    expect(getCloseProximityThresholdWatts(299.999, 0.2)).toBeNull();
    expect(getCloseProximityThresholdWatts(6000.001, 0.2)).toBeNull();
    expect(getCloseProximityThresholdWatts(Number.NaN, 0.2)).toBeNull();
  });

  it.each([
    [0.3, 1920],
    [1.34, 1920],
    [30, 3.83],
    [300, 3.83],
    [1500, 19.2],
    [100_000, 19.2]
  ])('matches the distance-based Table 1 threshold at %s MHz', (frequencyMHz, multiplier) => {
    expect(getDistanceErpThresholdWatts(frequencyMHz, 2)).toBeCloseTo(multiplier * 4, 10);
  });

  it('uses the intervening frequency-dependent Table 1 formulas', () => {
    expect(getDistanceErpThresholdWatts(10, 2)).toBeCloseTo(3450 * 4 / 100, 12);
    expect(getDistanceErpThresholdWatts(1000, 2)).toBeCloseTo(0.0128 * 4 * 1000, 12);
    expect(getDistanceErpThresholdWatts(0.299, 2)).toBeNull();
    expect(getDistanceErpThresholdWatts(100_001, 2)).toBeNull();
    expect(getDistanceErpThresholdWatts(146, 0)).toBeNull();
  });

  it('switches conservatively across every distance-table breakpoint', () => {
    expect(getDistanceErpThresholdWatts(1.339999, 1)).toBeCloseTo(1920, 12);
    expect(getDistanceErpThresholdWatts(1.340001, 1)).toBeCloseTo(3450 / 1.340001 ** 2, 12);
    expect(getDistanceErpThresholdWatts(29.999999, 1)).toBeCloseTo(3450 / 29.999999 ** 2, 12);
    expect(getDistanceErpThresholdWatts(30, 1)).toBeCloseTo(3.83, 12);
    expect(getDistanceErpThresholdWatts(300, 1)).toBeCloseTo(3.83, 12);
    expect(getDistanceErpThresholdWatts(300.000001, 1)).toBeCloseTo(0.0128 * 300.000001, 12);
    expect(getDistanceErpThresholdWatts(1499.999999, 1)).toBeCloseTo(0.0128 * 1499.999999, 12);
    expect(getDistanceErpThresholdWatts(1500, 1)).toBeCloseTo(19.2, 12);
  });

  it('applies the Table 1 method at and beyond the λ/(2π) boundary', () => {
    const frequencyMHz = 146;
    const boundary = 299_792_458 / (frequencyMHz * 1_000_000) / (2 * Math.PI);
    const atBoundary = calculateFccSingleSourceExemption({
      frequencyMHz,
      availableMaximumTimeAveragedPowerWatts: 1,
      maximumTimeAveragedErpWatts: 0.01,
      separationDistanceMetres: boundary
    });
    expect(atBoundary.criteria[2]).toMatchObject({ applicable: true, passes: true });
    const inside = calculateFccSingleSourceExemption({
      frequencyMHz,
      availableMaximumTimeAveragedPowerWatts: 1,
      maximumTimeAveragedErpWatts: 0.01,
      separationDistanceMetres: boundary - 0.000001
    });
    expect(inside.criteria[2]).toMatchObject({ applicable: false, passes: false, thresholdWatts: null });
  });

  it('requires routine evaluation when no encoded criterion is satisfied', () => {
    const result = calculateFccSingleSourceExemption({ ...baseInput, separationDistanceMetres: 2 });
    expect(result.status).toBe('routine-evaluation-required');
    expect(result.governingCriterionId).toBeNull();
  });

  it('rejects malformed inputs', () => {
    expect(() => calculateFccSingleSourceExemption({ ...baseInput, frequencyMHz: 0 })).toThrow(/Frequency/);
    expect(() => calculateFccSingleSourceExemption({ ...baseInput, availableMaximumTimeAveragedPowerWatts: -1 })).toThrow(/power/);
    expect(() => calculateFccSingleSourceExemption({ ...baseInput, maximumTimeAveragedErpWatts: -1 })).toThrow(/ERP/);
    expect(() => calculateFccSingleSourceExemption({ ...baseInput, separationDistanceMetres: 0 })).toThrow(/distance/);
  });
});
