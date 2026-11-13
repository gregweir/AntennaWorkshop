/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTrapCommissioning, TRAP_COMMISSIONING_MODEL } from './trapCommissioning';

const example = {
  targetInductanceMicrohenries: 2.94,
  targetCapacitancePicofarads: 52.7,
  targetResonanceMHz: 12.785,
  inductanceTolerancePercent: 5,
  capacitanceTolerancePercent: 5,
  pairMatchingThresholdPercent: 3,
  trapA: { inductanceMicrohenries: 2.94, capacitancePicofarads: 52.7, measuredResonanceMHz: 12.78 },
  trapB: { inductanceMicrohenries: 3, capacitancePicofarads: 53, measuredResonanceMHz: 12.65 }
};

describe('trap commissioning worksheet', () => {
  it('compares two measured traps with targets and each other', () => {
    const result = calculateTrapCommissioning(example);

    expect(result.trapA.calculatedResonanceMHz).toBeCloseTo(12.785, 2);
    expect(result.trapB.calculatedResonanceMHz).toBeCloseTo(12.622, 2);
    expect(result.inductancePairSpreadPercent).toBeCloseTo(2.02, 2);
    expect(result.capacitancePairSpreadPercent).toBeCloseTo(0.568, 2);
    expect(result.measuredResonancePairSpreadPercent).toBeCloseTo(1.02, 2);
    expect(result.inductancePairWithinThreshold).toBe(true);
    expect(result.capacitancePairWithinThreshold).toBe(true);
    expect(result.measuredResonancePairWithinThreshold).toBe(true);
  });

  it('keeps target-component windows separate from pair sorting', () => {
    const result = calculateTrapCommissioning({
      ...example,
      pairMatchingThresholdPercent: 1,
      trapB: { inductanceMicrohenries: 3.1, capacitancePicofarads: 55.5, measuredResonanceMHz: 12.2 }
    });

    expect(result.trapA.inductanceWithinSelectedTolerance).toBe(true);
    expect(result.trapB.inductanceWithinSelectedTolerance).toBe(false);
    expect(result.inductancePairWithinThreshold).toBe(false);
    expect(result.measuredResonancePairWithinThreshold).toBe(false);
    expect(result.idealToleranceResonanceMinimumMHz).toBeLessThan(example.targetResonanceMHz);
    expect(result.idealToleranceResonanceMaximumMHz).toBeGreaterThan(example.targetResonanceMHz);
  });

  it('rejects invalid measurements and thresholds', () => {
    expect(() => calculateTrapCommissioning({ ...example, targetInductanceMicrohenries: 0 })).toThrow(RangeError);
    expect(() => calculateTrapCommissioning({ ...example, pairMatchingThresholdPercent: 0 })).toThrow(RangeError);
    expect(() => calculateTrapCommissioning({ ...example, trapA: { ...example.trapA, measuredResonanceMHz: Number.NaN } })).toThrow(RangeError);
    expect(() => calculateTrapCommissioning({ ...example, capacitanceTolerancePercent: 51 })).toThrow(RangeError);
  });

  it('keeps source provenance and a review date', () => {
    expect(TRAP_COMMISSIONING_MODEL.id).toBe('parallel-lc-trap-commissioning-record');
    expect(TRAP_COMMISSIONING_MODEL.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TRAP_COMMISSIONING_MODEL.sources).toHaveLength(2);
  });
});
