/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateSmallTransmittingLoop, SMALL_TRANSMITTING_LOOP_MODEL } from './smallTransmittingLoop';

const example = {
  lowerFrequencyMHz: 14,
  upperFrequencyMHz: 14.35,
  circumferenceMetres: 3,
  measuredInductanceMicrohenries: 2.5,
  strayCapacitancePicofarads: 10,
  capacitorMinimumPicofarads: 5,
  capacitorMaximumPicofarads: 100
};

describe('small transmitting loop planner', () => {
  it('calculates circular geometry and measured-L tuning capacitance', () => {
    const result = calculateSmallTransmittingLoop(example);

    expect(result.diameterMetres).toBeCloseTo(0.95493, 5);
    expect(result.areaSquareMetres).toBeCloseTo(0.7162, 4);
    expect(result.lowerTotalCapacitancePicofarads).toBeCloseTo(51.69, 2);
    expect(result.upperTotalCapacitancePicofarads).toBeCloseTo(49.20, 2);
    expect(result.maximumRequiredVariableCapacitancePicofarads).toBeCloseTo(41.69, 2);
    expect(result.minimumRequiredVariableCapacitancePicofarads).toBeCloseTo(39.20, 2);
    expect(result.capacitorCoversRange).toBe(true);
    expect(result.isUnderArrlSmallLoopBoundary).toBe(true);
  });

  it('uses a strict under-one-sixteenth-wavelength diameter boundary', () => {
    const upperWavelength = 299_792_458 / (example.upperFrequencyMHz * 1_000_000);
    const boundary = calculateSmallTransmittingLoop({ ...example, circumferenceMetres: Math.PI * upperWavelength / 16 });
    const inside = calculateSmallTransmittingLoop({ ...example, circumferenceMetres: Math.PI * upperWavelength / 16 * 0.999 });

    expect(boundary.isUnderArrlSmallLoopBoundary).toBe(false);
    expect(boundary.warnings).toContain('The loop is not under the ARRL one-sixteenth-wavelength diameter boundary at the upper frequency.');
    expect(inside.isUnderArrlSmallLoopBoundary).toBe(true);
  });

  it('distinguishes excessive stray capacitance from insufficient capacitor range', () => {
    const excessiveStray = calculateSmallTransmittingLoop({ ...example, strayCapacitancePicofarads: 50 });
    const insufficientRange = calculateSmallTransmittingLoop({ ...example, capacitorMaximumPicofarads: 40 });

    expect(excessiveStray.tuningCapacitancePositive).toBe(false);
    expect(excessiveStray.capacitorCoversRange).toBe(false);
    expect(insufficientRange.tuningCapacitancePositive).toBe(true);
    expect(insufficientRange.capacitorCoversRange).toBe(false);
  });

  it('rejects invalid frequency, geometry, inductance, and capacitor inputs', () => {
    expect(() => calculateSmallTransmittingLoop({ ...example, lowerFrequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateSmallTransmittingLoop({ ...example, upperFrequencyMHz: 13.9 })).toThrow('Upper frequency');
    expect(() => calculateSmallTransmittingLoop({ ...example, circumferenceMetres: Number.NaN })).toThrow(RangeError);
    expect(() => calculateSmallTransmittingLoop({ ...example, measuredInductanceMicrohenries: 0 })).toThrow(RangeError);
    expect(() => calculateSmallTransmittingLoop({ ...example, capacitorMinimumPicofarads: 101 })).toThrow('Capacitor maximum');
  });

  it('retains source provenance and a review date', () => {
    expect(SMALL_TRANSMITTING_LOOP_MODEL.id).toBe('small-transmitting-loop-measured-inductance');
    expect(SMALL_TRANSMITTING_LOOP_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(SMALL_TRANSMITTING_LOOP_MODEL.sources).toHaveLength(2);
  });
});
