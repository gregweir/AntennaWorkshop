/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { ExposureProjectResult } from './exposureProject';
import { compareExposureScenarios } from './exposureScenarioComparison';

function result(jurisdiction: 'CA' | 'US', values: Array<[string, string, number]>): ExposureProjectResult {
  return {
    jurisdiction,
    environment: 'uncontrolled',
    sourceInventoryComplete: true,
    status: 'below-screening-trigger',
    worstPointId: values[0][0],
    pointResults: values.map(([id, label, fraction]) => ({
      point: { id, label, eastOffsetMetres: 0, northOffsetMetres: 0, heightMetres: 1.5 },
      status: 'below-screening-trigger',
      sourceResults: [],
      aggregate: {
        jurisdiction,
        environment: 'uncontrolled',
        sourceInventoryComplete: true,
        screeningTriggerFraction: jurisdiction === 'CA' ? 0.5 : 1,
        totalFractionOfReferenceLevel: fraction,
        remainingFractionToReferenceLevel: Math.max(0, 1 - fraction),
        remainingFractionToScreeningTrigger: Math.max(0, (jurisdiction === 'CA' ? 0.5 : 1) - fraction),
        status: 'below-screening-trigger',
        contributions: [],
        dominantSourceId: 'none'
      }
    }))
  };
}

describe('exposure scenario comparison', () => {
  it('compares matching points by stable identity and finds the greatest delta', () => {
    const comparison = compareExposureScenarios(
      result('CA', [['yard', 'Yard', 0.1], ['line', 'Property line', 0.2]]),
      result('CA', [['yard', 'Renamed yard', 0.15], ['line', 'Property line', 0.1]])
    );
    expect(comparison.points[0]).toMatchObject({ pointId: 'yard', label: 'Renamed yard', change: 'higher' });
    expect(comparison.points[0].deltaFraction).toBeCloseTo(0.05, 12);
    expect(comparison.points[1]).toMatchObject({ change: 'lower' });
    expect(comparison.points[1].deltaFraction).toBeCloseTo(-0.1, 12);
    expect(comparison.greatestAbsoluteDeltaPointId).toBe('line');
  });

  it('marks added, removed, and unchanged points explicitly', () => {
    const comparison = compareExposureScenarios(
      result('CA', [['same', 'Same', 0.1], ['removed', 'Removed', 0.2]]),
      result('CA', [['same', 'Same', 0.1], ['added', 'Added', 0.3]])
    );
    expect(comparison.points.map((point) => point.change)).toEqual(['unchanged', 'removed', 'added']);
    expect(comparison.points.find((point) => point.pointId === 'added')?.baselineFraction).toBeNull();
  });

  it('rejects comparisons across different regulatory contexts', () => {
    expect(() => compareExposureScenarios(result('CA', [['yard', 'Yard', 0.1]]), result('US', [['yard', 'Yard', 0.1]]))).toThrow(/same jurisdiction/i);
  });
});
