/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AzimuthPatternType = 'unknown' | 'omnidirectional' | 'bidirectional' | 'directional';

export interface AzimuthPattern {
  patternType: AzimuthPatternType;
  bearingDegrees: number;
  beamwidthDegrees: number;
}

export const AZIMUTH_PATTERN_LABELS: Record<AzimuthPatternType, string> = {
  unknown: 'Unknown / use maximum gain in every direction',
  omnidirectional: 'Omnidirectional',
  bidirectional: 'Bidirectional',
  directional: 'Directional'
};

export function normalizeBearing(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new RangeError('Bearing must be a finite number.');
  return ((degrees % 360) + 360) % 360;
}

export function pointOnBearing(bearingDegrees: number, radius: number) {
  const radians = normalizeBearing(bearingDegrees) * Math.PI / 180;
  return { x: Math.sin(radians) * radius, y: -Math.cos(radians) * radius };
}

export function azimuthSectorPath(bearingDegrees: number, beamwidthDegrees: number, radius: number): string {
  if (!Number.isFinite(beamwidthDegrees) || beamwidthDegrees <= 0 || beamwidthDegrees >= 360) {
    throw new RangeError('Beamwidth must be greater than 0 and less than 360 degrees.');
  }
  if (!Number.isFinite(radius) || radius <= 0) throw new RangeError('Pattern radius must be positive.');
  const start = pointOnBearing(bearingDegrees - beamwidthDegrees / 2, radius);
  const end = pointOnBearing(bearingDegrees + beamwidthDegrees / 2, radius);
  const largeArc = beamwidthDegrees > 180 ? 1 : 0;
  return `M 0 0 L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
}

export function azimuthPatternSectors(pattern: AzimuthPattern, radius: number): string[] {
  if (pattern.patternType === 'unknown' || pattern.patternType === 'omnidirectional') return [];
  const primary = azimuthSectorPath(pattern.bearingDegrees, pattern.beamwidthDegrees, radius);
  return pattern.patternType === 'bidirectional'
    ? [primary, azimuthSectorPath(pattern.bearingDegrees + 180, pattern.beamwidthDegrees, radius)]
    : [primary];
}
