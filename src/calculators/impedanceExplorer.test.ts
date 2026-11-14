/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateImpedanceExplorer } from './impedanceExplorer';

describe('complex impedance explorer', () => {
  it('places a matched load at chart centre', () => {
    const result = calculateImpedanceExplorer({ frequencyMHz: 14.2, referenceResistanceOhms: 50, loadResistanceOhms: 50, loadReactanceOhms: 0 });
    expect(result.normalizedResistance).toBe(1);
    expect(result.reflectionReal).toBe(0);
    expect(result.reflectionImaginary).toBe(0);
    expect(result.reflectionMagnitude).toBe(0);
    expect(result.swr).toBe(1);
    expect(result.returnLossDb).toBe(Number.POSITIVE_INFINITY);
    expect(result.mismatchLossDb).toBe(0);
  });

  it('converts an inductive load to reflection and scalar mismatch quantities', () => {
    const result = calculateImpedanceExplorer({ frequencyMHz: 14.2, referenceResistanceOhms: 50, loadResistanceOhms: 100, loadReactanceOhms: 50 });
    expect(result.normalizedResistance).toBe(2);
    expect(result.normalizedReactance).toBe(1);
    expect(result.reflectionReal).toBeCloseTo(0.4, 12);
    expect(result.reflectionImaginary).toBeCloseTo(0.2, 12);
    expect(result.reflectionMagnitude).toBeCloseTo(Math.sqrt(0.2), 12);
    expect(result.reflectionPhaseDegrees).toBeCloseTo(26.565051, 6);
    expect(result.swr).toBeCloseTo(2.618034, 6);
    expect(result.returnLossDb).toBeCloseTo(6.9897, 4);
    expect(result.reflectedPowerPercent).toBeCloseTo(20, 12);
    expect(result.equivalentSeriesInductanceHenries).toBeCloseTo(5.604047e-7, 12);
  });

  it('places a capacitive load below the chart axis and computes admittance', () => {
    const result = calculateImpedanceExplorer({ frequencyMHz: 7.1, referenceResistanceOhms: 50, loadResistanceOhms: 25, loadReactanceOhms: -25 });
    expect(result.reflectionReal).toBeCloseTo(-0.2, 12);
    expect(result.reflectionImaginary).toBeCloseTo(-0.4, 12);
    expect(result.conductanceSiemens).toBeCloseTo(0.02, 12);
    expect(result.susceptanceSiemens).toBeCloseTo(0.02, 12);
    expect(result.equivalentSeriesCapacitanceFarads).toBeCloseTo(8.966475667e-10, 15);
  });

  it('rejects unsupported inputs', () => {
    const valid = { frequencyMHz: 14.2, referenceResistanceOhms: 50, loadResistanceOhms: 100, loadReactanceOhms: 0 };
    expect(() => calculateImpedanceExplorer({ ...valid, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateImpedanceExplorer({ ...valid, referenceResistanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateImpedanceExplorer({ ...valid, loadResistanceOhms: -1 })).toThrow(RangeError);
    expect(() => calculateImpedanceExplorer({ ...valid, loadReactanceOhms: Number.NaN })).toThrow(RangeError);
  });
});
