/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTrapDipole, TRAP_DIPOLE_MODEL } from './trapDipole';

const arrlExample = {
  lowerFrequencyMHz: 10.1,
  upperFrequencyMHz: 14.05,
  lengthCorrectionFactor: 0.95,
  totalSpanMetres: 12.192,
  trapPositionFromCentreMetres: 4.2672,
  heightAboveGroundMetres: 6.096,
  conductorDiameterMillimetres: 3.175
};

describe('two-band parallel-LC trap dipole', () => {
  it('reproduces the ARRL worked component values', () => {
    const result = calculateTrapDipole(arrlExample);

    expect(result.characteristicImpedanceOhms).toBeCloseTo(536, 0);
    expect(result.lowerRequiredReactanceOhms).toBeCloseTo(496, -1);
    expect(result.upperRequiredReactanceOhms).toBeCloseTo(-1249, -2);
    expect(result.inductanceMicrohenries).toBeCloseTo(2.94, 1);
    expect(result.capacitancePicofarads).toBeCloseTo(52.7, 0);
    expect(result.trapResonanceMHz).toBeGreaterThan(10.1);
    expect(result.trapResonanceMHz).toBeLessThan(14.05);
    expect(result.trapCount).toBe(2);
  });

  it('rejects reversed frequencies and geometry outside the method', () => {
    expect(() => calculateTrapDipole({ ...arrlExample, upperFrequencyMHz: 7.1 })).toThrow(RangeError);
    expect(() => calculateTrapDipole({ ...arrlExample, trapPositionFromCentreMetres: 0 })).toThrow(RangeError);
    expect(() => calculateTrapDipole({ ...arrlExample, trapPositionFromCentreMetres: 6.096 })).toThrow(RangeError);
    expect(() => calculateTrapDipole({ ...arrlExample, upperFrequencyMHz: 28.4 })).toThrow(RangeError);
  });

  it('rejects non-finite inputs', () => {
    expect(() => calculateTrapDipole({ ...arrlExample, lowerFrequencyMHz: Number.NaN })).toThrow(RangeError);
    expect(() => calculateTrapDipole({ ...arrlExample, conductorDiameterMillimetres: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  });

  it('keeps source provenance and a review date', () => {
    expect(TRAP_DIPOLE_MODEL.id).toBe('birnbaum-two-band-parallel-lc-trap-dipole');
    expect(TRAP_DIPOLE_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TRAP_DIPOLE_MODEL.sources).toHaveLength(2);
  });
});
