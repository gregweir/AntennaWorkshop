/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateCoaxialCollinear, COAXIAL_COLLINEAR_MODEL } from './coaxialCollinear';

const arrl = { frequencyMHz: 1_090, mode: 'end-fed-receive' as const, sectionCount: 8, coaxVelocityFactor: 0.83, cutAllowancePercent: 2.5, junctionGapMillimetres: 3.175, finishedSectionToleranceMillimetres: 1 };

describe('coaxial collinear construction planner', () => {
  it('reproduces the documented 1090 MHz RG-6 section length', () => {
    const result = calculateCoaxialCollinear(arrl);
    expect(result.wavelengthMetres).toBeCloseTo(0.275039, 6);
    expect(result.finishedHalfWaveSectionMetres).toBeCloseTo(0.114141, 6);
    expect(result.finishedHalfWaveSectionMetres / 0.0254).toBeCloseTo(4.4937, 3);
    expect(result.terminalWhipMetres).toBe(result.finishedHalfWaveSectionMetres);
    expect(result.isPublishedArrlReference).toBe(true);
    expect(result.sectionSchedule).toHaveLength(8);
  });

  it('sizes balanced COCO half-wave sections and two shorted quarter-wave ends', () => {
    const result = calculateCoaxialCollinear({ ...arrl, frequencyMHz: 146, mode: 'balanced-coco', coaxVelocityFactor: 0.844 });
    expect(result.finishedHalfWaveSectionMetres).toBeCloseTo(result.wavelengthMetres * 0.844 / 2, 12);
    expect(result.finishedQuarterWaveTerminationMetres).toBeCloseTo(result.wavelengthMetres * 0.844 / 4, 12);
    expect(result.terminationCount).toBe(2);
    expect(result.terminalWhipMetres).toBeNull();
  });

  it('keeps junction gaps and electrical-length tolerance explicit', () => {
    const result = calculateCoaxialCollinear(arrl);
    expect(result.junctionCount).toBe(7);
    expect(result.totalJunctionGapMetres).toBeCloseTo(7 * 0.003175, 12);
    expect(result.possibleSectionPhaseErrorDegrees).toBeCloseTo(360 * 0.001 / result.coaxWavelengthMetres, 12);
    expect(result.systematicChainPhaseErrorDegrees).toBeCloseTo(result.possibleSectionPhaseErrorDegrees * 8, 12);
  });

  it('marks custom end-fed scaling as unvalidated source adaptation', () => {
    const result = calculateCoaxialCollinear({ ...arrl, frequencyMHz: 915 });
    expect(result.isPublishedArrlReference).toBe(false);
    expect(result.warnings.join(' ')).toContain('scaled adaptation');
  });

  it('enforces topology-specific section counts and input ranges', () => {
    expect(() => calculateCoaxialCollinear({ ...arrl, sectionCount: 1 })).toThrow(RangeError);
    expect(() => calculateCoaxialCollinear({ ...arrl, sectionCount: 17 })).toThrow(RangeError);
    expect(() => calculateCoaxialCollinear({ ...arrl, mode: 'balanced-coco', sectionCount: 7 })).toThrow(RangeError);
    expect(() => calculateCoaxialCollinear({ ...arrl, coaxVelocityFactor: 0.49 })).toThrow(RangeError);
    expect(() => calculateCoaxialCollinear({ ...arrl, junctionGapMillimetres: -1 })).toThrow(RangeError);
  });

  it('retains primary-source provenance', () => {
    expect(COAXIAL_COLLINEAR_MODEL.id).toBe('coaxial-collinear-coco');
    expect(COAXIAL_COLLINEAR_MODEL.sources).toHaveLength(3);
    expect(COAXIAL_COLLINEAR_MODEL.reviewedOn).toBe('2026-11-16');
  });
});
