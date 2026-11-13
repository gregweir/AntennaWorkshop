/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLoadedDipole, calculateLoadedVertical, LOADED_ANTENNA_MODEL } from './loadedAntennas';

describe('loaded antenna model', () => {
  it('reproduces the ARRL 10.1 MHz loaded-dipole reactance example', () => {
    const result = calculateLoadedDipole({
      frequencyMHz: 10.1,
      lengthCorrectionFactor: 0.95,
      totalSpanMetres: 12.192,
      loadingPointFromCentreMetres: 4.2672,
      heightAboveGroundMetres: 6.096,
      conductorDiameterMillimetres: 3.175
    });

    expect(result.characteristicImpedanceOhms).toBeCloseTo(536, 0);
    expect(result.requiredReactanceOhms).toBeCloseTo(496, -1);
    expect(result.inductanceMicrohenries).toBeCloseTo(7.8, 0);
    expect(result.coilCount).toBe(2);
  });

  it('calculates base and centre loading for the same shortened vertical', () => {
    const base = calculateLoadedVertical({
      frequencyMHz: 7.1,
      lengthCorrectionFactor: 0.95,
      radiatorHeightMetres: 6,
      loadingPointFromBaseMetres: 0,
      conductorDiameterMillimetres: 25
    });
    const centre = calculateLoadedVertical({
      frequencyMHz: 7.1,
      lengthCorrectionFactor: 0.95,
      radiatorHeightMetres: 6,
      loadingPointFromBaseMetres: 3,
      conductorDiameterMillimetres: 25
    });

    expect(base.inductanceMicrohenries).toBeGreaterThan(0);
    expect(centre.inductanceMicrohenries).toBeGreaterThan(base.inductanceMicrohenries);
    expect(centre.outerSectionMetres).toBe(3);
  });

  it('rejects full-length, out-of-position, and non-finite inputs', () => {
    expect(() => calculateLoadedDipole({ frequencyMHz: 14.2, lengthCorrectionFactor: 0.95, totalSpanMetres: 20, loadingPointFromCentreMetres: 2, heightAboveGroundMetres: 8, conductorDiameterMillimetres: 2 })).toThrow(RangeError);
    expect(() => calculateLoadedVertical({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, radiatorHeightMetres: 6, loadingPointFromBaseMetres: 6, conductorDiameterMillimetres: 25 })).toThrow(RangeError);
    expect(() => calculateLoadedVertical({ frequencyMHz: Number.NaN, lengthCorrectionFactor: 0.95, radiatorHeightMetres: 6, loadingPointFromBaseMetres: 0, conductorDiameterMillimetres: 25 })).toThrow(RangeError);
  });

  it('keeps source provenance and a review date', () => {
    expect(LOADED_ANTENNA_MODEL.id).toBe('single-band-inductively-loaded-wire');
    expect(LOADED_ANTENNA_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LOADED_ANTENNA_MODEL.sources).toHaveLength(2);
  });
});
