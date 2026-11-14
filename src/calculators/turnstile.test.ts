/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTurnstile } from './turnstile';

const input = { frequencyMHz: 145.8, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, phasingLineVelocityFactor: 0.66, quadratureOrder: 'b-lags-a' as const };

describe('crossed-dipole turnstile', () => {
  it('sizes two equal orthogonal dipoles and a quarter-wave path difference', () => {
    const result = calculateTurnstile(input);
    expect(result.wavelengthMetres).toBeCloseTo(2.0561897, 7);
    expect(result.cutDipoleSpanMetres).toBeCloseTo(result.cutArmMetres * 2, 12);
    expect(result.totalRadiatorConductorMetres).toBeCloseTo(result.cutDipoleSpanMetres * 2, 12);
    expect(result.orthogonalAngleDegrees).toBe(90);
    expect(result.pathDifferenceElectricalWavelengths).toBe(0.25);
    expect(result.quarterWavePhaseLinePhysicalMetres).toBeCloseTo(result.wavelengthMetres * 0.66 / 4, 12);
    expect(result.targetRelativePhaseDegrees).toBe(-90);
  });

  it('reverses the target quadrature order without changing geometry', () => {
    const result = calculateTurnstile({ ...input, quadratureOrder: 'b-leads-a' });
    expect(result.targetRelativePhaseDegrees).toBe(90);
    expect(result.quadratureDescription).toContain('leads');
  });

  it('rejects invalid feed assumptions', () => {
    expect(() => calculateTurnstile({ ...input, phasingLineVelocityFactor: 0 })).toThrow(RangeError);
    expect(() => calculateTurnstile({ ...input, phasingLineVelocityFactor: 1.1 })).toThrow(RangeError);
    expect(() => calculateTurnstile({ ...input, quadratureOrder: 'in-phase' as never })).toThrow(RangeError);
  });
});
