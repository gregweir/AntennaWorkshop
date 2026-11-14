/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateHalo } from './halo';

const valid = { frequencyMHz: 144.2, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, shape: 'circular' as const, farEndGapMetres: 0.05, feedpointGapMetres: 0.025 };

describe('halo antenna', () => {
  it('bends one corrected half-wave dipole around a two-gap circular reference', () => {
    const result = calculateHalo(valid);
    expect(result.cutRadiatorMetres).toBeCloseTo(1.012, 3);
    expect(result.eachArmMetres).toBeCloseTo(result.cutRadiatorMetres / 2, 12);
    expect(result.referencePerimeterMetres).toBeCloseTo(result.cutRadiatorMetres + 0.075, 12);
    expect(result.circularCentrelineDiameterMetres).toBeCloseTo(result.referencePerimeterMetres / Math.PI, 12);
    expect(result.plannedWidthMetres).toBe(result.circularCentrelineDiameterMetres);
  });

  it('provides square squalo geometry from the same radiator and openings', () => {
    const result = calculateHalo({ ...valid, shape: 'square' });
    expect(result.shapeLabel).toBe('Square halo (squalo)');
    expect(result.squareCentrelineSideMetres).toBeCloseTo(result.referencePerimeterMetres / 4, 12);
    expect(result.plannedWidthMetres).toBe(result.squareCentrelineSideMetres);
  });

  it('reports the straight chord between circular opening endpoints', () => {
    const result = calculateHalo(valid);
    expect(result.circularFarEndGapChordMetres).toBeLessThan(valid.farEndGapMetres);
    expect(result.circularFeedpointGapChordMetres).toBeLessThan(valid.feedpointGapMetres);
  });

  it('warns about large openings and rejects invalid layouts', () => {
    expect(calculateHalo({ ...valid, farEndGapMetres: 0.12 }).warnings).toContain('The two openings exceed 10% of the reference perimeter; this simple bent-dipole layout needs full modelling before construction.');
    expect(() => calculateHalo({ ...valid, farEndGapMetres: 0 })).toThrow(RangeError);
    expect(() => calculateHalo({ ...valid, feedpointGapMetres: Number.NaN })).toThrow(RangeError);
    expect(() => calculateHalo({ ...valid, shape: 'triangle' as 'circular' })).toThrow(RangeError);
  });
});
