/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { AIR_CORE_COIL_MODEL, calculateAirCoreCoil } from './airCoreCoil';

describe('single-layer air-core coil', () => {
  it('reproduces the ARRL 10 microhenry turns example', () => {
    const result = calculateAirCoreCoil({
      targetInductanceMicrohenries: 10,
      formOutsideDiameterMillimetres: 24.4,
      windingLengthMillimetres: 31.75,
      wireOutsideDiameterMillimetres: 1
    });

    expect(result.meanCoilDiameterMillimetres).toBeCloseTo(25.4, 10);
    expect(result.idealTurns).toBeCloseTo(26.1, 1);
    expect(result.roundedTurns).toBe(26);
    expect(result.estimatedInductanceMicrohenries).toBeCloseTo(9.9, 1);
  });

  it('reports when the selected wire cannot fit in one layer', () => {
    const result = calculateAirCoreCoil({
      targetInductanceMicrohenries: 100,
      formOutsideDiameterMillimetres: 25,
      windingLengthMillimetres: 30,
      wireOutsideDiameterMillimetres: 3
    });

    expect(result.fitsSingleLayer).toBe(false);
    expect(result.clearSpacingMillimetres).toBeLessThan(0);
    expect(result.closeWoundLengthMillimetres).toBeGreaterThan(30);
  });

  it('rejects geometry outside the published approximation and invalid values', () => {
    expect(() => calculateAirCoreCoil({ targetInductanceMicrohenries: 10, formOutsideDiameterMillimetres: 100, windingLengthMillimetres: 40, wireOutsideDiameterMillimetres: 2 })).toThrow(RangeError);
    expect(() => calculateAirCoreCoil({ targetInductanceMicrohenries: Number.NaN, formOutsideDiameterMillimetres: 25, windingLengthMillimetres: 30, wireOutsideDiameterMillimetres: 1 })).toThrow(RangeError);
    expect(() => calculateAirCoreCoil({ targetInductanceMicrohenries: 10, formOutsideDiameterMillimetres: 0, windingLengthMillimetres: 30, wireOutsideDiameterMillimetres: 1 })).toThrow(RangeError);
  });

  it('keeps source provenance and a review date', () => {
    expect(AIR_CORE_COIL_MODEL.id).toBe('arrl-single-layer-air-core-coil');
    expect(AIR_CORE_COIL_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(AIR_CORE_COIL_MODEL.sources).toHaveLength(2);
  });
});
