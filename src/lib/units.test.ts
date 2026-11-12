/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { formatLength, metresToFeet } from './units';

describe('length units', () => {
  it('converts metres to feet', () => {
    expect(metresToFeet(1)).toBeCloseTo(3.28084, 5);
  });

  it('formats metric lengths at a useful scale', () => {
    expect(formatLength(0.5, 'metric')).toBe('50.0 cm');
    expect(formatLength(10.1234, 'metric')).toBe('10.123 m');
  });

  it('carries rounded inches into the foot value', () => {
    expect(formatLength(0.3047, 'imperial')).toBe('1 ft 0 in');
  });
});
