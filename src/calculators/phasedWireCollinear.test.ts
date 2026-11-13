/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculatePhasedWireCollinear, PHASED_WIRE_COLLINEAR_MODEL } from './phasedWireCollinear';

const example = {
  frequencyMHz: 14.2,
  elementCount: 4,
  radiatorCorrectionFactor: 0.95,
  radiatorTrimAllowancePercent: 2.5,
  phasingLineVelocityFactor: 0.95,
  phasingStubTrimAllowancePercent: 2.5
};

describe('phased wire collinear planner', () => {
  it('sizes equal half-wave radiator sections and quarter-wave phasing stubs', () => {
    const result = calculatePhasedWireCollinear(example);

    expect(result.wavelengthMetres).toBeCloseTo(21.112145, 6);
    expect(result.resonantRadiatorSectionMetres).toBeCloseTo(result.wavelengthMetres * 0.5 * 0.95, 12);
    expect(result.cutRadiatorSectionMetres).toBeCloseTo(result.resonantRadiatorSectionMetres * 1.025, 12);
    expect(result.resonantPhasingStubPhysicalLengthMetres).toBeCloseTo(result.wavelengthMetres * 0.25 * 0.95, 12);
    expect(result.cutPhasingStubPhysicalLengthMetres).toBeCloseTo(result.resonantPhasingStubPhysicalLengthMetres * 1.025, 12);
    expect(result.phasingStubCount).toBe(3);
    expect(result.radiatingSpanMetres).toBeCloseTo(result.cutRadiatorSectionMetres * 4, 12);
    expect(result.minimumConductorMetres).toBeCloseTo(result.radiatingSpanMetres + result.cutPhasingStubPhysicalLengthMetres * 6, 12);
    expect(result.feedModeReference).toBe('Balanced voltage feed');
    expect(result.feedImpedanceReference).toBe('QST reference: over 1000 Ω');
  });

  it('preserves the element and stub count boundaries', () => {
    expect(calculatePhasedWireCollinear({ ...example, elementCount: 2 }).phasingStubCount).toBe(1);
    expect(calculatePhasedWireCollinear({ ...example, elementCount: 3 }).feedModeReference).toBe('Balanced current feed');
    expect(calculatePhasedWireCollinear({ ...example, elementCount: 8 }).phasingStubCount).toBe(7);
    expect(() => calculatePhasedWireCollinear({ ...example, elementCount: 1 })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, elementCount: 9 })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, elementCount: 2.5 })).toThrow(RangeError);
  });

  it('applies phasing-line velocity factor independently from radiator correction', () => {
    const fastLine = calculatePhasedWireCollinear({ ...example, phasingLineVelocityFactor: 1 });
    const slowerLine = calculatePhasedWireCollinear({ ...example, phasingLineVelocityFactor: 0.8 });

    expect(fastLine.cutRadiatorSectionMetres).toBe(slowerLine.cutRadiatorSectionMetres);
    expect(slowerLine.resonantPhasingStubPhysicalLengthMetres).toBeCloseTo(fastLine.resonantPhasingStubPhysicalLengthMetres * 0.8, 12);
  });

  it('rejects invalid frequency, factors, and allowances', () => {
    expect(() => calculatePhasedWireCollinear({ ...example, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, radiatorCorrectionFactor: Number.NaN })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, radiatorCorrectionFactor: 1.01 })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, phasingLineVelocityFactor: 0.49 })).toThrow(RangeError);
    expect(() => calculatePhasedWireCollinear({ ...example, phasingStubTrimAllowancePercent: 26 })).toThrow(RangeError);
  });

  it('retains source provenance and a review date', () => {
    expect(PHASED_WIRE_COLLINEAR_MODEL.id).toBe('half-wave-phased-wire-collinear');
    expect(PHASED_WIRE_COLLINEAR_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PHASED_WIRE_COLLINEAR_MODEL.sources).toHaveLength(2);
  });
});
