/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTwoElementCubicalQuad, TWO_ELEMENT_CUBICAL_QUAD_MODEL } from './twoElementCubicalQuad';

const example = {
  frequencyMHz: 14.2,
  elementSpacingWavelengths: 0.2,
  trimAllowancePercent: 2.5
};

describe('two-element cubical quad planner', () => {
  it('reproduces the ARRL perimeter relationship and diamond geometry', () => {
    const result = calculateTwoElementCubicalQuad(example);

    expect(result.wavelengthMetres).toBeCloseTo(21.112145, 6);
    expect(result.drivenDesignPerimeterMetres).toBeCloseTo(1005 / 14.2 * 0.3048, 12);
    expect(result.reflectorPerimeterRatio).toBeCloseTo(1.05, 12);
    expect(result.drivenCutPerimeterMetres).toBeCloseTo(result.drivenDesignPerimeterMetres * 1.025, 12);
    expect(result.reflectorSideMetres).toBeCloseTo(result.reflectorCutPerimeterMetres / 4, 12);
    expect(result.reflectorDiagonalMetres).toBeCloseTo(result.reflectorSideMetres * Math.SQRT2, 12);
    expect(result.reflectorSpreaderArmMetres).toBeCloseTo(result.reflectorDiagonalMetres / 2, 12);
    expect(result.elementSpacingMetres).toBeCloseTo(result.wavelengthMetres * 0.2, 12);
    expect(result.totalLoopWireMetres).toBeCloseTo(result.drivenCutPerimeterMetres + result.reflectorCutPerimeterMetres, 12);
  });

  it('preserves both supported spacing boundaries', () => {
    const minimum = calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.1 });
    const maximum = calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.25 });

    expect(minimum.elementSpacingMetres).toBeCloseTo(minimum.wavelengthMetres * 0.1, 12);
    expect(maximum.elementSpacingMetres).toBeCloseTo(maximum.wavelengthMetres * 0.25, 12);
    expect(minimum.warnings).toHaveLength(1);
    expect(maximum.warnings).toHaveLength(1);
  });

  it('keeps spacing independent from loop dimensions', () => {
    const close = calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.15 });
    const wide = calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.25 });

    expect(close.drivenCutPerimeterMetres).toBe(wide.drivenCutPerimeterMetres);
    expect(close.reflectorCutPerimeterMetres).toBe(wide.reflectorCutPerimeterMetres);
    expect(wide.elementSpacingMetres).toBeCloseTo(close.elementSpacingMetres * 5 / 3, 12);
  });

  it('rejects invalid frequency, spacing, and trim allowance', () => {
    expect(() => calculateTwoElementCubicalQuad({ ...example, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: Number.NaN })).toThrow(RangeError);
    expect(() => calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.09 })).toThrow(RangeError);
    expect(() => calculateTwoElementCubicalQuad({ ...example, elementSpacingWavelengths: 0.26 })).toThrow(RangeError);
    expect(() => calculateTwoElementCubicalQuad({ ...example, trimAllowancePercent: 26 })).toThrow(RangeError);
  });

  it('retains source provenance and a review date', () => {
    expect(TWO_ELEMENT_CUBICAL_QUAD_MODEL.id).toBe('arrl-two-element-cubical-quad');
    expect(TWO_ELEMENT_CUBICAL_QUAD_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TWO_ELEMENT_CUBICAL_QUAD_MODEL.sources).toHaveLength(2);
  });
});
