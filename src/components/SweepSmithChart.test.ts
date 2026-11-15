/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { nearestTouchstonePoint, parseTouchstoneS1p } from '../lib/touchstone';

describe('sweep comparison frequency alignment', () => {
  const points = parseTouchstoneS1p('# MHz S RI R 50\n10 0 0\n20 0 0\n30 0 0').points;

  it('selects the closest measured frequency', () => {
    expect(nearestTouchstonePoint(points, 24e6).frequencyHz).toBe(20e6);
    expect(nearestTouchstonePoint(points, 26e6).frequencyHz).toBe(30e6);
  });

  it('clamps frequencies outside the comparison range', () => {
    expect(nearestTouchstonePoint(points, 1e6).frequencyHz).toBe(10e6);
    expect(nearestTouchstonePoint(points, 100e6).frequencyHz).toBe(30e6);
  });
});
