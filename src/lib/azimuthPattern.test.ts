/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { analyzeAzimuthRelationship, azimuthPatternSectors, azimuthSectorPath, bearingFromOffsets, normalizeBearing, pointOnBearing, smallestBearingDifference } from './azimuthPattern';

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

  it('derives true bearings from east and north offsets', () => {
    expect(bearingFromOffsets(0, 10)).toBe(0);
    expect(bearingFromOffsets(10, 0)).toBe(90);
    expect(bearingFromOffsets(0, -10)).toBe(180);
    expect(bearingFromOffsets(-10, 0)).toBe(270);
    expect(bearingFromOffsets(0, 0)).toBeNull();
    expect(smallestBearingDifference(350, 10)).toBe(20);
  });

  it('classifies directional and bidirectional illustrative envelopes', () => {
    expect(analyzeAzimuthRelationship({ patternType: 'directional', bearingDegrees: 90, beamwidthDegrees: 60 }, 110)).toMatchObject({ offAxisDegrees: 20, envelopeRelation: 'inside-entered-envelope' });
    expect(analyzeAzimuthRelationship({ patternType: 'directional', bearingDegrees: 90, beamwidthDegrees: 60 }, 130)).toMatchObject({ offAxisDegrees: 40, envelopeRelation: 'outside-entered-envelope' });
    expect(analyzeAzimuthRelationship({ patternType: 'bidirectional', bearingDegrees: 0, beamwidthDegrees: 40 }, 175)).toMatchObject({ closestLobeBearingDegrees: 180, offAxisDegrees: 5, envelopeRelation: 'inside-entered-envelope' });
    expect(analyzeAzimuthRelationship({ patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }, 245).envelopeRelation).toBe('all-azimuths');
    expect(analyzeAzimuthRelationship({ patternType: 'unknown', bearingDegrees: 0, beamwidthDegrees: 90 }, 245).envelopeRelation).toBe('unknown');
    expect(analyzeAzimuthRelationship({ patternType: 'directional', bearingDegrees: 0, beamwidthDegrees: 90 }, null).envelopeRelation).toBe('same-plan-position');
  });

  it('creates one directional sector and two opposite bidirectional sectors', () => {
    expect(azimuthPatternSectors({ patternType: 'directional', bearingDegrees: 45, beamwidthDegrees: 60 }, 30)).toHaveLength(1);
    expect(azimuthPatternSectors({ patternType: 'bidirectional', bearingDegrees: 45, beamwidthDegrees: 60 }, 30)).toHaveLength(2);
    expect(azimuthPatternSectors({ patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }, 30)).toEqual([]);
  });

  it('rejects invalid bearings, beamwidths, and radii', () => {
    expect(() => normalizeBearing(Number.NaN)).toThrow(/bearing/i);
    expect(() => bearingFromOffsets(Number.NaN, 0)).toThrow(/offset/i);
    expect(() => azimuthSectorPath(0, 0, 10)).toThrow(/beamwidth/i);
    expect(() => azimuthSectorPath(0, 360, 10)).toThrow(/beamwidth/i);
    expect(() => azimuthSectorPath(0, 90, 0)).toThrow(/radius/i);
  });
});
