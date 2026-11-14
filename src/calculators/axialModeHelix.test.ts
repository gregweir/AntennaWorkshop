/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { AXIAL_MODE_HELIX_MODEL, calculateAxialModeHelix } from './axialModeHelix';

const referenceInput = {
  frequencyMHz: 435,
  circumferenceWavelengths: 1,
  pitchAngleDegrees: 12.5,
  turnCount: 6,
  groundPlaneWavelengths: 0.8,
  trimAllowancePercent: 2.5,
  conductorWidthMillimetres: 6.35,
  diameterToleranceMillimetres: 2,
  turnSpacingToleranceMillimetres: 2,
  feedlineImpedanceOhms: 50
};

describe('calculateAxialModeHelix', () => {
  it('reproduces the classical axial-mode geometry and reference estimates', () => {
    const result = calculateAxialModeHelix(referenceInput);

    expect(result.wavelengthMetres).toBeCloseTo(0.689178064, 8);
    expect(result.circumferenceMetres).toBeCloseTo(result.wavelengthMetres, 12);
    expect(result.diameterMetres).toBeCloseTo(result.wavelengthMetres / Math.PI, 12);
    expect(result.turnSpacingWavelengths).toBeCloseTo(Math.tan(12.5 * Math.PI / 180), 12);
    expect(result.axialLengthMetres).toBeCloseTo(result.turnSpacingMetres * 6, 12);
    expect(result.cutConductorLengthMetres).toBeCloseTo(result.conductorPerTurnMetres * 6 * 1.025, 12);
    expect(result.groundPlaneDiameterMetres).toBeCloseTo(result.wavelengthMetres * 0.8, 12);
    expect(result.estimatedHalfPowerBeamwidthDegrees).toBeCloseTo(52 / Math.sqrt(6 * Math.tan(12.5 * Math.PI / 180)), 12);
    expect(result.estimatedTerminalResistanceOhms).toBe(140);
    expect(result.estimatedAxialRatio).toBeCloseTo(13 / 12, 12);
    expect(result.conductorWidthWavelengths).toBeCloseTo(0.00635 / result.wavelengthMetres, 12);
    expect(result.estimatedTerminalToFeedlineRatio).toBeCloseTo(2.8, 12);
    expect(result.estimatedResistiveOnlySwr).toBeCloseTo(2.8, 12);
    expect(result.warnings).toEqual([]);
  });

  it('creates a turn-by-turn fabrication schedule and tolerance worksheet', () => {
    const result = calculateAxialModeHelix(referenceInput);

    expect(result.turnSchedule).toHaveLength(6);
    expect(result.turnSchedule[0]).toEqual({
      turnNumber: 1,
      startAxialMetres: 0,
      endAxialMetres: result.turnSpacingMetres,
      startConductorMetres: 0,
      endConductorMetres: result.conductorPerTurnMetres
    });
    expect(result.turnSchedule.at(-1)?.endAxialMetres).toBeCloseTo(result.axialLengthMetres, 12);
    expect(result.turnSchedule.at(-1)?.endConductorMetres).toBeCloseTo(result.designConductorLengthMetres, 12);
    expect(result.diameterTolerancePercent).toBeCloseTo(0.002 / result.diameterMetres * 100, 12);
    expect(result.circumferenceChangeAtDiameterToleranceMetres).toBeCloseTo(Math.PI * 0.002, 12);
    expect(result.turnSpacingTolerancePercent).toBeCloseTo(0.002 / result.turnSpacingMetres * 100, 12);
    expect(result.worstCaseAxialStackErrorMetres).toBeCloseTo(0.012, 12);
  });

  it('keeps winding geometry coupled when circumference or pitch changes', () => {
    const wide = calculateAxialModeHelix({ ...referenceInput, circumferenceWavelengths: 1.1, pitchAngleDegrees: 14 });

    expect(wide.circumferenceMetres).toBeCloseTo(wide.wavelengthMetres * 1.1, 12);
    expect(wide.turnSpacingMetres).toBeCloseTo(wide.circumferenceMetres * Math.tan(14 * Math.PI / 180), 12);
    expect(wide.conductorPerTurnMetres).toBeCloseTo(Math.hypot(wide.circumferenceMetres, wide.turnSpacingMetres), 12);
  });

  it('accepts documented design boundaries and explains lower-confidence choices', () => {
    const boundary = calculateAxialModeHelix({ ...referenceInput, circumferenceWavelengths: 0.8, pitchAngleDegrees: 20, groundPlaneWavelengths: 0.5, trimAllowancePercent: 0 });

    expect(boundary.warnings).toHaveLength(4);
    expect(boundary.warnings.join(' ')).toContain('0.9–1.1');
    expect(boundary.warnings.join(' ')).toContain('12–14°');
    expect(boundary.warnings.join(' ')).toContain('0.8 λ');
    expect(boundary.warnings.join(' ')).toContain('No conductor');
  });

  it('rejects invalid and fractional construction inputs', () => {
    expect(() => calculateAxialModeHelix({ ...referenceInput, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, circumferenceWavelengths: 1.3 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, pitchAngleDegrees: 9 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, turnCount: 3 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, turnCount: 6.5 })).toThrow('whole number');
    expect(() => calculateAxialModeHelix({ ...referenceInput, groundPlaneWavelengths: 3.1 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, trimAllowancePercent: 26 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, conductorWidthMillimetres: 0 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, diameterToleranceMillimetres: -1 })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, turnSpacingToleranceMillimetres: Number.NaN })).toThrow(RangeError);
    expect(() => calculateAxialModeHelix({ ...referenceInput, feedlineImpedanceOhms: 0 })).toThrow(RangeError);
  });

  it('warns about physically conflicting fabrication entries', () => {
    const result = calculateAxialModeHelix({ ...referenceInput, conductorWidthMillimetres: 200, diameterToleranceMillimetres: 300, turnSpacingToleranceMillimetres: 200 });

    expect(result.warnings.join(' ')).toContain('equals or exceeds the centre-to-centre turn spacing');
    expect(result.warnings.join(' ')).toContain('equals or exceeds the helix diameter');
    expect(result.warnings.join(' ')).toContain('equals or exceeds the target spacing');
  });

  it('preserves source provenance', () => {
    expect(AXIAL_MODE_HELIX_MODEL.id).toBe('nasa-axial-mode-helix');
    expect(AXIAL_MODE_HELIX_MODEL.reviewedOn).toBe('2026-11-14');
    expect(AXIAL_MODE_HELIX_MODEL.sources).toHaveLength(3);
    expect(AXIAL_MODE_HELIX_MODEL.sources.every((source) => source.url.startsWith('https://ntrs.nasa.gov/'))).toBe(true);
  });
});
