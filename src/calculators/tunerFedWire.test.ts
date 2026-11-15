/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTunerFedWire, W3EDP_PRESET } from './tunerFedWire';

describe('tuner-fed end-fed wire planning', () => {
  it('preserves the documented 85 ft radiator and 17 ft W3EDP counterpoise', () => {
    const result = calculateTunerFedWire({ referenceFrequencyMHz: 3.6, ...W3EDP_PRESET, wireAllowancePercent: 2.5, feedMode: 'tuner-at-wire', feedlineLengthMetres: 0 });
    expect(result.isW3edpPreset).toBe(true);
    expect(result.radiatorLengthMetres / 0.3048).toBeCloseTo(85, 10);
    expect(result.counterpoiseLengthMetres / 0.3048).toBeCloseTo(17, 10);
    expect(result.totalWireToCutMetres).toBeCloseTo((25.908 + 5.1816) * 1.025, 10);
    expect(result.warnings).toContainEqual(expect.stringMatching(/operating position/));
  });

  it('reports reference electrical lengths without claiming a match', () => {
    const result = calculateTunerFedWire({ referenceFrequencyMHz: 7.1, radiatorLengthMetres: 20, counterpoiseLengthMetres: 10.6, wireAllowancePercent: 0, feedMode: 'remote-matching-point', feedlineLengthMetres: 15 });
    expect(result.radiatorWavelengths).toBeCloseTo(20 / result.wavelengthMetres, 12);
    expect(result.counterpoiseWavelengths).toBeCloseTo(0.251, 2);
    expect(result.warnings).toContainEqual(expect.stringMatching(/mismatch/));
  });

  it('rejects invalid dimensions, allowances, arrangements, and missing remote feedline', () => {
    const valid = { referenceFrequencyMHz: 7.1, radiatorLengthMetres: 20, counterpoiseLengthMetres: 10, wireAllowancePercent: 2.5, feedMode: 'tuner-at-wire' as const, feedlineLengthMetres: 0 };
    expect(() => calculateTunerFedWire({ ...valid, radiatorLengthMetres: 0 })).toThrow(RangeError);
    expect(() => calculateTunerFedWire({ ...valid, counterpoiseLengthMetres: Number.NaN })).toThrow(RangeError);
    expect(() => calculateTunerFedWire({ ...valid, wireAllowancePercent: 30 })).toThrow(RangeError);
    expect(() => calculateTunerFedWire({ ...valid, feedMode: 'unsupported' as never })).toThrow(TypeError);
    expect(() => calculateTunerFedWire({ ...valid, feedMode: 'remote-matching-point', feedlineLengthMetres: 0 })).toThrow(/feedline/);
  });
});
