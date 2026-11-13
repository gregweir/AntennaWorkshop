/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from './catalog';

describe('amateur band catalog', () => {
  it('maps common design frequencies to conventional bands', () => {
    expect(findBandForFrequency(14.2, 'CA')?.label).toBe('20 m');
    expect(findBandForFrequency(146.52, 'US')?.label).toBe('2 m');
    expect(findBandForFrequency(70.25, 'GB')?.label).toBe('4 m');
    expect(findBandForFrequency(440, 'AU')?.label).toBe('70 cm');
  });

  it('uses jurisdiction-specific 70 cm allocations', () => {
    expect(findBandForFrequency(425, 'CA')).toBeUndefined();
    expect(findBandForFrequency(425, 'US')?.label).toBe('70 cm');
  });

  it('provides a design frequency within every listed range', () => {
    for (const jurisdiction of ['CA', 'US', 'GB', 'AU'] as const) {
      for (const band of getBandsForJurisdiction(jurisdiction)) {
        expect(band.designMHz).toBeGreaterThanOrEqual(band.lowerMHz);
        expect(band.designMHz).toBeLessThanOrEqual(band.upperMHz);
      }
    }
  });

  it('formats HF ranges with enough precision', () => {
    const band = findBandForFrequency(14.2, 'CA');
    expect(band && formatFrequencyRange(band)).toBe('14.000–14.350 MHz');
  });

  it('labels discontinuous allocations without implying a continuous range', () => {
    const band = findBandForFrequency(5.359, 'CA');
    expect(band && formatFrequencyRange(band)).toBe('Channelized / special allocation');
    expect(band?.continuous).toBe(false);
    expect(formatFrequencyRange(getBandsForJurisdiction('GB').find((candidate) => candidate.id === '60m')!)).toBe('Eleven Full-licence segments');
    expect(findBandForFrequency(3.75, 'AU')).toBeUndefined();
    expect(findBandForFrequency(3.79, 'AU')?.label).toBe('80 m');
  });

  it('links each initial jurisdiction to its governing allocation source', () => {
    for (const jurisdiction of ['CA', 'US', 'GB', 'AU'] as const) {
      expect(getBandSource(jurisdiction)?.url.startsWith('https://')).toBe(true);
      expect(getBandSource(jurisdiction)?.reviewedOn).toMatch(/^2026-11-1[13]$/);
    }
  });
});
