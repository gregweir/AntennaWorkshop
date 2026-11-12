/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectResult } from './exposureProject';

export type ScenarioPointChange = 'higher' | 'lower' | 'unchanged' | 'added' | 'removed';

export interface ExposureScenarioPointComparison {
  pointId: string;
  label: string;
  baselineFraction: number | null;
  currentFraction: number | null;
  deltaFraction: number | null;
  change: ScenarioPointChange;
}

export interface ExposureScenarioComparison {
  jurisdiction: ExposureProjectResult['jurisdiction'];
  environment: ExposureProjectResult['environment'];
  points: ExposureScenarioPointComparison[];
  greatestAbsoluteDeltaPointId: string | null;
}

export function compareExposureScenarios(
  baseline: ExposureProjectResult,
  current: ExposureProjectResult
): ExposureScenarioComparison {
  if (baseline.jurisdiction !== current.jurisdiction || baseline.environment !== current.environment) {
    throw new RangeError('Scenario comparison requires the same jurisdiction and exposure environment.');
  }
  const baselineById = new Map(baseline.pointResults.map((point) => [point.point.id, point]));
  const currentById = new Map(current.pointResults.map((point) => [point.point.id, point]));
  const pointIds = [...new Set([...baselineById.keys(), ...currentById.keys()])];
  const points = pointIds.map((pointId): ExposureScenarioPointComparison => {
    const baselinePoint = baselineById.get(pointId);
    const currentPoint = currentById.get(pointId);
    const baselineFraction = baselinePoint?.aggregate.totalFractionOfReferenceLevel ?? null;
    const currentFraction = currentPoint?.aggregate.totalFractionOfReferenceLevel ?? null;
    const deltaFraction = baselineFraction === null || currentFraction === null ? null : currentFraction - baselineFraction;
    const change: ScenarioPointChange = baselinePoint === undefined
      ? 'added'
      : currentPoint === undefined
        ? 'removed'
        : Math.abs(deltaFraction ?? 0) < 1e-12
          ? 'unchanged'
          : (deltaFraction ?? 0) > 0 ? 'higher' : 'lower';
    return {
      pointId,
      label: currentPoint?.point.label ?? baselinePoint?.point.label ?? pointId,
      baselineFraction,
      currentFraction,
      deltaFraction,
      change
    };
  });
  const comparablePoints = points.filter((point) => point.deltaFraction !== null);
  const greatest = comparablePoints.length
    ? comparablePoints.reduce((largest, point) => Math.abs(point.deltaFraction ?? 0) > Math.abs(largest.deltaFraction ?? 0) ? point : largest)
    : null;
  return {
    jurisdiction: current.jurisdiction,
    environment: current.environment,
    points,
    greatestAbsoluteDeltaPointId: greatest?.pointId ?? null
  };
}
