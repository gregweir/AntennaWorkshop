/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateSkywire } from './skywire';

const valid = { frequencyMHz: 7.1, lengthCorrectionFactor: 1.02, trimAllowancePercent: 2.5, longToShortAspectRatio: 1.5, supportHeightsMetres: [12, 12, 12, 12] as [number, number, number, number], riggingReservePercent: 3, feedSide: 'north' as const, feedPositionPercent: 50 };

describe('horizontal loop skywire', () => {
  it('turns one corrected perimeter into a rectangular support plan', () => {
    const result = calculateSkywire(valid);
    expect(result.wavelengthMetres).toBeCloseTo(42.22428986, 7);
    expect(result.resonantPerimeterMetres).toBeCloseTo(43.06877566, 7);
    expect(result.straightPlanPerimeterMetres).toBeCloseTo(44.14549505, 7);
    expect(2 * (result.longSideMetres + result.shortSideMetres)).toBeCloseTo(result.straightPlanPerimeterMetres, 12);
    expect(result.longSideMetres / result.shortSideMetres).toBeCloseTo(1.5, 12);
  });

  it('accounts for unequal support heights in the taut three-dimensional path', () => {
    const result = calculateSkywire({ ...valid, supportHeightsMetres: [12, 14, 11, 13] });
    expect(result.tautThreeDimensionalPerimeterMetres).toBeGreaterThan(result.straightPlanPerimeterMetres);
    expect(result.heightGeometryExtraMetres).toBeGreaterThan(0);
    expect(result.purchaseWireMetres).toBeCloseTo(result.tautThreeDimensionalPerimeterMetres * 1.03, 12);
  });

  it('interpolates feedpoint coordinates and height along the selected side', () => {
    const result = calculateSkywire({ ...valid, supportHeightsMetres: [10, 14, 12, 12], feedPositionPercent: 25 });
    expect(result.feedpoint.xMetres).toBeCloseTo(result.longSideMetres * 0.25, 12);
    expect(result.feedpoint.yMetres).toBe(0);
    expect(result.feedpoint.heightMetres).toBe(11);
  });

  it('warns about strongly non-planar layouts and rejects invalid inputs', () => {
    expect(calculateSkywire({ ...valid, supportHeightsMetres: [1, 20, 1, 20] }).warnings).toContain('Support-height spread exceeds 0.10 wavelength; use a three-dimensional antenna model rather than treating this as a nearly horizontal loop.');
    expect(() => calculateSkywire({ ...valid, longToShortAspectRatio: 0.5 })).toThrow(RangeError);
    expect(() => calculateSkywire({ ...valid, supportHeightsMetres: [12, -1, 12, 12] })).toThrow(RangeError);
    expect(() => calculateSkywire({ ...valid, feedSide: 'diagonal' as 'north' })).toThrow(RangeError);
  });
});
