/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { BEVERAGE_MODEL, calculateBeverage } from './beverage';

const referenceInput = {
  frequencyMHz: 1.8,
  wireLengthWavelengths: 1,
  wireHeightMetres: 2,
  targetBearingDegrees: 45,
  receptionMode: 'terminated' as const,
  terminationResistanceOhms: 470,
  assumedAntennaImpedanceOhms: 450,
  feedlineImpedanceOhms: 50,
  wireCutAllowancePercent: 2.5
};

describe('calculateBeverage', () => {
  it('plans a one-wavelength terminated northeast Beverage', () => {
    const result = calculateBeverage(referenceInput);

    expect(result.wavelengthMetres).toBeCloseTo(166.551366, 6);
    expect(result.designWireLengthMetres).toBeCloseTo(166.551366, 6);
    expect(result.cutWireLengthMetres).toBeCloseTo(170.71515, 5);
    expect(result.eastOffsetMetres).toBeCloseTo(117.7696, 4);
    expect(result.northOffsetMetres).toBeCloseTo(117.7696, 4);
    expect(result.electricalLengthDegrees).toBe(360);
    expect(result.impedanceTransformationRatio).toBe(9);
    expect(result.transformerTurnsRatio).toBe(3);
    expect(result.targetCompassPoint).toBe('NE');
    expect(result.primaryResponseDescription).toContain('terminated end at 45° NE');
    expect(result.warnings).toEqual([]);
  });

  it('describes an unterminated wire as a non-predicted bidirectional tendency', () => {
    const result = calculateBeverage({ ...referenceInput, targetBearingDegrees: 225, receptionMode: 'unterminated' });

    expect(result.eastOffsetMetres).toBeLessThan(0);
    expect(result.northOffsetMetres).toBeLessThan(0);
    expect(result.reverseBearingDegrees).toBe(45);
    expect(result.primaryResponseDescription).toContain('225° SW and 45° NE');
    expect(result.warnings).toContainEqual(expect.stringContaining('bidirectional tendency'));
  });

  it('warns about short, relatively high, mismatched, and allowance-free plans', () => {
    const result = calculateBeverage({
      ...referenceInput,
      frequencyMHz: 30,
      wireLengthWavelengths: 0.25,
      wireHeightMetres: 2,
      terminationResistanceOhms: 100,
      wireCutAllowancePercent: 0
    });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('one-half wavelength or more'),
      expect.stringContaining('relatively high'),
      expect.stringContaining('more than 25%'),
      expect.stringContaining('No wire routing')
    ]));
  });

  it('accepts supported boundaries and rejects invalid inputs', () => {
    const minimums = calculateBeverage({ ...referenceInput, frequencyMHz: 0.001, wireLengthWavelengths: 0.25, wireHeightMetres: 0.1, targetBearingDegrees: 0, terminationResistanceOhms: 1, assumedAntennaImpedanceOhms: 1, feedlineImpedanceOhms: 1, wireCutAllowancePercent: 0 });
    const maximums = calculateBeverage({ ...referenceInput, frequencyMHz: 300_000, wireLengthWavelengths: 5, wireHeightMetres: 30, targetBearingDegrees: 359.999, terminationResistanceOhms: 10_000, assumedAntennaImpedanceOhms: 10_000, feedlineImpedanceOhms: 1_000, wireCutAllowancePercent: 25 });

    expect(minimums.targetCompassPoint).toBe('N');
    expect(maximums.cutWireLengthMetres).toBeCloseTo(maximums.designWireLengthMetres * 1.25, 12);
    expect(() => calculateBeverage({ ...referenceInput, frequencyMHz: 0 })).toThrow(/Frequency/);
    expect(() => calculateBeverage({ ...referenceInput, targetBearingDegrees: 360 })).toThrow(/less than 360/);
    expect(() => calculateBeverage({ ...referenceInput, feedlineImpedanceOhms: 0 })).toThrow(/Feedline/);
    expect(() => calculateBeverage({ ...referenceInput, receptionMode: 'invalid' as never })).toThrow(/mode/);
  });

  it('carries versioned source provenance', () => {
    expect(BEVERAGE_MODEL).toMatchObject({ id: 'beverage-wave-antenna-planner', version: '1.0.0', reviewedOn: '2026-11-13' });
    expect(BEVERAGE_MODEL.sources).toHaveLength(2);
  });
});
