/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateAcmaExclusionDistance, getAcmaPublicPowerDensityLimit } from './acmaExclusionDistance';

describe('ACMA simple RF exclusion distance', () => {
  it('reproduces the official workbook example and intermediate values', () => {
    const result = calculateAcmaExclusionDistance({ frequencyMHz: 3000, transmitterOutputPowerWatts: 400, antennaGain: 5, gainBasis: 'dBi', antennaLargestDimensionMetres: 0.2 });
    expect(result.referenceLevelWattsPerSquareMetre).toBe(10);
    expect(result.antennaGainLinear).toBeCloseTo(3.1622776601683795, 12);
    expect(result.exclusionDistanceMetres).toBeCloseTo(3.1734756911499544, 12);
    expect(result.status).toBe('far-field-result-available');
  });

  it('preserves every official power-density boundary', () => {
    expect(() => getAcmaPublicPowerDensityLimit(30)).toThrow();
    expect(getAcmaPublicPowerDensityLimit(30.000001)).toBe(2);
    expect(getAcmaPublicPowerDensityLimit(400)).toBe(2);
    expect(getAcmaPublicPowerDensityLimit(400.000001)).toBeCloseTo(2.000000005, 10);
    expect(getAcmaPublicPowerDensityLimit(2000)).toBe(10);
    expect(getAcmaPublicPowerDensityLimit(2000.000001)).toBe(10);
    expect(getAcmaPublicPowerDensityLimit(300_000)).toBe(10);
    expect(() => getAcmaPublicPowerDensityLimit(300_000.000001)).toThrow();
  });

  it('converts dBd to dBi and stops interpretation inside the licence far-field boundary', () => {
    const result = calculateAcmaExclusionDistance({ frequencyMHz: 50, transmitterOutputPowerWatts: 1, antennaGain: 0, gainBasis: 'dBd', antennaLargestDimensionMetres: 10 });
    expect(result.antennaGainDbi).toBe(2.15);
    expect(result.farFieldBoundaryMetres).toBeGreaterThan(result.exclusionDistanceMetres);
    expect(result.status).toBe('far-field-method-inapplicable');
  });

  it('rejects invalid power, gain, dimensions, and gain basis', () => {
    const input = { frequencyMHz: 146, transmitterOutputPowerWatts: 100, antennaGain: 2.15, gainBasis: 'dBi' as const, antennaLargestDimensionMetres: 1 };
    expect(() => calculateAcmaExclusionDistance({ ...input, transmitterOutputPowerWatts: 0 })).toThrow();
    expect(() => calculateAcmaExclusionDistance({ ...input, antennaGain: 101 })).toThrow();
    expect(() => calculateAcmaExclusionDistance({ ...input, antennaLargestDimensionMetres: 0 })).toThrow();
    expect(() => calculateAcmaExclusionDistance({ ...input, gainBasis: 'ERP' as never })).toThrow();
  });
});
