/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ANTENNA_DESIGNS } from './antennaDesignCatalog';
import { ANTENNA_COMPARISON } from './antennaDesignComparison';

describe('antenna comparison profiles', () => {
  it('covers every antenna design with actionable comparison fields', () => {
    expect(Object.keys(ANTENNA_COMPARISON)).toEqual(Object.keys(ANTENNA_DESIGNS));
    for (const profile of Object.values(ANTENNA_COMPARISON)) {
      expect(Object.values(profile).every((value) => value.length >= 20)).toBe(true);
    }
  });

  it('keeps verification distinct from performance promises', () => {
    expect(ANTENNA_COMPARISON.g5rv.verify).toContain('Per-band impedance');
    expect(ANTENNA_COMPARISON['small-loop'].verify).toContain('safe power');
    expect(ANTENNA_COMPARISON.beverage.bandIntent).toContain('receive');
  });
});
