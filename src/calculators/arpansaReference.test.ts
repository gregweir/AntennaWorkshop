/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { getArpansaReferenceLevels } from './arpansaReference';

describe('ARPANSA RPS S-1 reference levels', () => {
  it('matches the general-public amateur VHF table values', () => {
    const result = getArpansaReferenceLevels(146, 'general-public');
    expect(result.wholeBody).toMatchObject({ electricFieldVoltsPerMetre: 27.7, magneticFieldAmpsPerMetre: 0.073, incidentPowerDensityWattsPerSquareMetre: 2, averagingMinutes: 30 });
    expect(result.local).toMatchObject({ electricFieldVoltsPerMetre: 62, magneticFieldAmpsPerMetre: 0.163, incidentPowerDensityWattsPerSquareMetre: 10, averagingMinutes: 6 });
    expect(result.limbCurrentMilliamps).toBeNull();
  });

  it('evaluates the frequency-dependent UHF values', () => {
    const result = getArpansaReferenceLevels(1_000, 'occupational');
    expect(result.wholeBody.electricFieldVoltsPerMetre).toBeCloseTo(3 * Math.sqrt(1_000), 10);
    expect(result.wholeBody.incidentPowerDensityWattsPerSquareMetre).toBe(25);
    expect(result.local.incidentPowerDensityWattsPerSquareMetre).toBeCloseTo(0.29 * 1_000 ** 0.86, 10);
  });

  it('preserves ES and not-applicable quantities at HF', () => {
    const result = getArpansaReferenceLevels(3.5, 'general-public');
    expect(result.wholeBody.electricFieldVoltsPerMetre).toBe('ES');
    expect(result.wholeBody.magneticFieldAmpsPerMetre).toBeCloseTo(2.2 / 3.5, 10);
    expect(result.wholeBody.incidentPowerDensityWattsPerSquareMetre).toBeNull();
    expect(result.peakField).toEqual({ electricFieldVoltsPerMetre: 83, magneticFieldAmpsPerMetre: 21 });
    expect(result.limbCurrentMilliamps).toBe(45);
  });

  it('matches the upper local power-density boundary', () => {
    expect(getArpansaReferenceLevels(300_000, 'general-public').local.incidentPowerDensityWattsPerSquareMetre).toBe(20);
    expect(getArpansaReferenceLevels(300_000, 'occupational').local.incidentPowerDensityWattsPerSquareMetre).toBe(100);
  });

  it('rejects frequencies outside the standard', () => {
    expect(() => getArpansaReferenceLevels(0.099, 'general-public')).toThrow(RangeError);
    expect(() => getArpansaReferenceLevels(300_001, 'occupational')).toThrow(RangeError);
    expect(() => getArpansaReferenceLevels(Number.NaN, 'general-public')).toThrow(RangeError);
  });
});
