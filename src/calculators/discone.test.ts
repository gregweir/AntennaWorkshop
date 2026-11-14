/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateDiscone, DISCONE_MODEL } from './discone';

const referenceInput = {
  lowerFrequencyMHz: 144,
  coneHalfAngleDegrees: 30,
  coneRadialCount: 8,
  discRadialCount: 8,
  connectionAllowancePercent: 2.5,
  radialConductorDiameterMillimetres: 6.35,
  feedGapMillimetres: 5,
  radialLengthToleranceMillimetres: 2
};

describe('calculateDiscone', () => {
  it('reproduces the sourced NTIA dimensions and derived cone geometry', () => {
    const result = calculateDiscone(referenceInput);

    expect(result.coneSlantLengthMetres).toBeCloseTo(2958 / 144 * 0.0254, 12);
    expect(result.discDiameterMetres).toBeCloseTo(2008 / 144 * 0.0254, 12);
    expect(result.coneHeightMetres).toBeCloseTo(result.coneSlantLengthMetres * Math.cos(Math.PI / 6), 12);
    expect(result.coneBaseDiameterMetres).toBeCloseTo(result.coneSlantLengthMetres, 12);
    expect(result.cutConeRadialMetres).toBeCloseTo(result.coneSlantLengthMetres * 1.025, 12);
    expect(result.cutDiscRadialMetres).toBeCloseTo(result.discRadiusMetres * 1.025, 12);
    expect(result.totalRadialWireMetres).toBeCloseTo((result.cutConeRadialMetres + result.cutDiscRadialMetres) * 8, 12);
    expect(result.coneRadialAngularSpacingDegrees).toBe(45);
    expect(result.discRadialAngularSpacingDegrees).toBe(45);
    expect(result.coneBaseArcSpacingMetres).toBeCloseTo(Math.PI * result.coneBaseDiameterMetres / 8, 12);
    expect(result.discRimArcSpacingMetres).toBeCloseTo(Math.PI * result.discDiameterMetres / 8, 12);
    expect(result.feedGapWavelengths).toBeCloseTo(0.005 / result.wavelengthMetres, 12);
    expect(result.coneRadialLengthTolerancePercent).toBeCloseTo(0.002 / result.coneSlantLengthMetres * 100, 12);
    expect(result.discRadialLengthTolerancePercent).toBeCloseTo(0.002 / result.discRadiusMetres * 100, 12);
    expect(result.warnings).toEqual([]);
  });

  it('preserves slant length while changing the supported cone angle', () => {
    const narrow = calculateDiscone({ ...referenceInput, coneHalfAngleDegrees: 25 });
    const wide = calculateDiscone({ ...referenceInput, coneHalfAngleDegrees: 40 });

    expect(narrow.coneSlantLengthMetres).toBeCloseTo(wide.coneSlantLengthMetres, 12);
    expect(narrow.coneHeightMetres).toBeGreaterThan(wide.coneHeightMetres);
    expect(narrow.coneBaseDiameterMetres).toBeLessThan(wide.coneBaseDiameterMetres);
    expect(narrow.coneIncludedAngleDegrees).toBe(50);
    expect(wide.coneIncludedAngleDegrees).toBe(80);
  });

  it('reports sparse radial and zero-allowance construction choices', () => {
    const result = calculateDiscone({ ...referenceInput, coneRadialCount: 6, discRadialCount: 4, connectionAllowancePercent: 0 });

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.join(' ')).toContain('No connection');
    expect(result.warnings.join(' ')).toContain('sparse radial approximation');
  });

  it('rejects invalid inputs and fractional element counts', () => {
    expect(() => calculateDiscone({ ...referenceInput, lowerFrequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, coneHalfAngleDegrees: 24 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, coneHalfAngleDegrees: 41 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, coneRadialCount: 5 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, coneRadialCount: 8.5 })).toThrow('whole number');
    expect(() => calculateDiscone({ ...referenceInput, discRadialCount: 3 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, connectionAllowancePercent: 26 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, radialConductorDiameterMillimetres: 0 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, feedGapMillimetres: 0 })).toThrow(RangeError);
    expect(() => calculateDiscone({ ...referenceInput, radialLengthToleranceMillimetres: -1 })).toThrow(RangeError);
  });

  it('warns about physically conflicting fabrication entries', () => {
    const result = calculateDiscone({ ...referenceInput, radialConductorDiameterMillimetres: 1000, feedGapMillimetres: 1000, radialLengthToleranceMillimetres: 1000 });

    expect(result.warnings.join(' ')).toContain('rim arc spacing');
    expect(result.warnings.join(' ')).toContain('disc radius');
    expect(result.warnings.join(' ')).toContain('shortest finished radial');
  });

  it('preserves source provenance', () => {
    expect(DISCONE_MODEL.id).toBe('ntia-nasa-discone');
    expect(DISCONE_MODEL.reviewedOn).toBe('2026-11-14');
    expect(DISCONE_MODEL.sources).toHaveLength(3);
    expect(DISCONE_MODEL.sources[0].url).toContain('its.ntia.gov');
    expect(DISCONE_MODEL.sources[1].url).toContain('ntrs.nasa.gov');
    expect(DISCONE_MODEL.sources[2].url).toContain('US5608416A');
  });
});
