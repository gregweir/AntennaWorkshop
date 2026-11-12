/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { azimuthPatternSectors, azimuthSectorPath, normalizeBearing, pointOnBearing } from './azimuthPattern';

describe('azimuth pattern geometry', () => {
  it('normalizes signed and wrapped compass bearings', () => {
    expect(normalizeBearing(-10)).toBe(350);
    expect(normalizeBearing(725)).toBe(5);
  });

  it('maps compass bearings into SVG coordinates', () => {
    expect(pointOnBearing(0, 10)).toEqual({ x: 0, y: -10 });
    expect(pointOnBearing(90, 10).x).toBeCloseTo(10, 10);
    expect(pointOnBearing(180, 10).y).toBeCloseTo(10, 10);
  });

  it('creates one directional sector and two opposite bidirectional sectors', () => {
    expect(azimuthPatternSectors({ patternType: 'directional', bearingDegrees: 45, beamwidthDegrees: 60 }, 30)).toHaveLength(1);
    expect(azimuthPatternSectors({ patternType: 'bidirectional', bearingDegrees: 45, beamwidthDegrees: 60 }, 30)).toHaveLength(2);
    expect(azimuthPatternSectors({ patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }, 30)).toEqual([]);
  });

  it('rejects invalid bearings, beamwidths, and radii', () => {
    expect(() => normalizeBearing(Number.NaN)).toThrow(/bearing/i);
    expect(() => azimuthSectorPath(0, 0, 10)).toThrow(/beamwidth/i);
    expect(() => azimuthSectorPath(0, 360, 10)).toThrow(/beamwidth/i);
    expect(() => azimuthSectorPath(0, 90, 0)).toThrow(/radius/i);
  });
});
