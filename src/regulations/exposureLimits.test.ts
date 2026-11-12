/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { getCanadianReferenceLevel, getExposureReferenceLevel, getUsMpeReferenceLevel } from './exposureLimits';

describe('United States FCC MPE reference levels', () => {
  it.each([[0.3, 1000, 1000], [3, 1000, 200], [30, 10, 2], [300, 10, 2], [1500, 50, 10], [100_000, 50, 10]])('matches Table 1 at %s MHz', (frequencyMHz, controlled, uncontrolled) => {
    expect(getUsMpeReferenceLevel(frequencyMHz, 'controlled').powerDensityWattsPerSquareMetre).toBeCloseTo(controlled, 10);
    expect(getUsMpeReferenceLevel(frequencyMHz, 'uncontrolled').powerDensityWattsPerSquareMetre).toBeCloseTo(uncontrolled, 10);
  });
  it('applies the FCC averaging periods', () => {
    expect(getUsMpeReferenceLevel(146, 'controlled').averagingMinutes).toBe(6);
    expect(getUsMpeReferenceLevel(146, 'uncontrolled').averagingMinutes).toBe(30);
  });
  it('rejects frequencies outside the FCC MPE table', () => {
    expect(() => getUsMpeReferenceLevel(0.299, 'uncontrolled')).toThrow(RangeError);
    expect(() => getUsMpeReferenceLevel(100_001, 'controlled')).toThrow(RangeError);
  });
});

describe('Canadian Safety Code 6 reference levels', () => {
  it.each([[10, 10, 2], [20, 10, 2], [48, 44.72 / Math.sqrt(48), 8.944 / Math.sqrt(48)], [100, 6.455, 1.291], [300, 0.6455 * Math.sqrt(300), 1.291], [6000, 0.6455 * Math.sqrt(6000), 0.02619 * 6000 ** 0.6834], [15_000, 50, 10], [300_000, 3.33e-4 * 300_000, 6.67e-5 * 300_000]])('matches Tables 5 and 6 at %s MHz', (frequencyMHz, controlled, uncontrolled) => {
    expect(getCanadianReferenceLevel(frequencyMHz, 'controlled').powerDensityWattsPerSquareMetre).toBeCloseTo(controlled, 8);
    expect(getCanadianReferenceLevel(frequencyMHz, 'uncontrolled').powerDensityWattsPerSquareMetre).toBeCloseTo(uncontrolled, 8);
  });
  it('applies the frequency-dependent Canadian reference period above 15 GHz', () => {
    expect(getCanadianReferenceLevel(15_000, 'uncontrolled').averagingMinutes).toBe(6);
    expect(getCanadianReferenceLevel(150_000, 'controlled').averagingMinutes).toBeCloseTo(616_000 / 150_000 ** 1.2, 12);
  });
  it('rejects frequencies where Safety Code 6 requires other reference quantities', () => {
    expect(() => getCanadianReferenceLevel(9.999, 'uncontrolled')).toThrow(RangeError);
    expect(() => getCanadianReferenceLevel(300_001, 'controlled')).toThrow(RangeError);
  });
  it('routes jurisdictions without changing source identity', () => {
    expect(getExposureReferenceLevel('CA', 146, 'uncontrolled').jurisdiction).toBe('CA');
    expect(getExposureReferenceLevel('US', 146, 'uncontrolled').jurisdiction).toBe('US');
  });
});
