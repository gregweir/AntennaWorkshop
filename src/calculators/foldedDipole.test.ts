/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateFoldedDipole } from './foldedDipole';

const valid = { frequencyMHz: 14.2, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, conductorSpacingMetres: 0.15, assumedSingleDipoleResistanceOhms: 73, plannedFeedlineImpedanceOhms: 50 };

describe('equal-conductor folded dipole', () => {
  it('sizes two equal half-wave conductors and their end joins', () => {
    const result = calculateFoldedDipole(valid);
    expect(result.wavelengthMetres).toBeCloseTo(21.11214493, 7);
    expect(result.cutSpanMetres).toBeCloseTo(10.279, 3);
    expect(result.eachParallelConductorMetres).toBe(result.cutSpanMetres);
    expect(result.approximateTotalConductorMetres).toBeCloseTo(2 * result.cutSpanMetres + 0.3, 12);
    expect(result.nominalImpedanceMultiplier).toBe(4);
    expect(result.nominalFoldedResistanceOhms).toBe(292);
    expect(result.assumedImpedanceRatioToFeedline).toBeCloseTo(5.84, 12);
    expect(result.assumedTurnsRatioToFeedline).toBeCloseTo(Math.sqrt(5.84), 12);
  });

  it('shows an ideal direct match only when the entered assumptions agree', () => {
    const result = calculateFoldedDipole({ ...valid, plannedFeedlineImpedanceOhms: 292 });
    expect(result.assumedDirectSWR).toBe(1);
  });

  it('warns when the conductor spacing is no longer electrically small', () => {
    const result = calculateFoldedDipole({ ...valid, conductorSpacingMetres: 2 });
    expect(result.conductorSpacingWavelengths).toBeGreaterThan(0.05);
    expect(result.warnings).toContain('The entered parallel spacing exceeds 0.05 wavelength; use a full antenna model rather than the thin folded-dipole approximation.');
  });

  it('rejects invalid construction and impedance assumptions', () => {
    expect(() => calculateFoldedDipole({ ...valid, conductorSpacingMetres: 0 })).toThrow(RangeError);
    expect(() => calculateFoldedDipole({ ...valid, assumedSingleDipoleResistanceOhms: Number.NaN })).toThrow(RangeError);
    expect(() => calculateFoldedDipole({ ...valid, plannedFeedlineImpedanceOhms: -50 })).toThrow(RangeError);
  });
});
