/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateG5rv } from './g5rv';

const input = {
  preset: 'classic' as const,
  inspectionFrequencyMHz: 14.15,
  matchingSectionVelocityFactor: 0.95,
  matchingSectionImpedanceOhms: 450,
  customRadiatorLengthMetres: 31.1,
  customMatchingSectionElectricalLengthMetres: 10.36
};

describe('G5RV family system', () => {
  it('preserves the published classic radiator and scales the matching section by velocity factor', () => {
    const result = calculateG5rv(input);
    expect(result.radiatorLengthMetres).toBe(31.1);
    expect(result.legLengthMetres).toBe(15.55);
    expect(result.matchingSectionPhysicalLengthMetres).toBeCloseTo(9.842, 12);
    expect(result.radiatorWavelengths).toBeCloseTo(1.467899, 6);
    expect(result.matchingSectionElectricalWavelengths).toBeCloseTo(0.488985, 6);
  });

  it('provides the published ZS6BKW geometry as a distinct preset', () => {
    const result = calculateG5rv({ ...input, preset: 'zs6bkw' });
    expect(result.radiatorLengthMetres).toBe(28.5);
    expect(result.matchingSectionElectricalLengthMetres).toBe(13.3);
    expect(result.matchingSectionPhysicalLengthMetres).toBeCloseTo(12.635, 12);
    expect(result.bandContext).toContain('40, 20, 17, 12, and 10 m');
  });

  it('keeps custom geometry explicit', () => {
    const result = calculateG5rv({ ...input, preset: 'custom', customRadiatorLengthMetres: 26, customMatchingSectionElectricalLengthMetres: 11 });
    expect(result.presetLabel).toBe('Custom G5RV-derived system');
    expect(result.radiatorLengthMetres).toBe(26);
    expect(result.matchingSectionPhysicalLengthMetres).toBeCloseTo(10.45, 12);
  });

  it('rejects unsupported line and geometry inputs', () => {
    expect(() => calculateG5rv({ ...input, inspectionFrequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateG5rv({ ...input, matchingSectionVelocityFactor: 1.1 })).toThrow(RangeError);
    expect(() => calculateG5rv({ ...input, matchingSectionImpedanceOhms: 50 })).toThrow(RangeError);
    expect(() => calculateG5rv({ ...input, customRadiatorLengthMetres: 0 })).toThrow(RangeError);
  });
});
