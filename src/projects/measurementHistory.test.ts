/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { AntennaPlanMeasurementRecord } from './antennaPlans';
import { buildMeasurementHistoryComparison } from './measurementHistory';

function record(id: string, recordedAt: string, minimumFrequencyHz: number, resonanceFrequencyHz: number, minimumSwr = 1.5): AntennaPlanMeasurementRecord {
  return {
    id, recordedAt, label: id, sweep: null,
    calibrationContext: 'SOL at feedpoint', referencePlane: 'Feedpoint', installedGeometry: 'Final height', adjustment: '', observations: '',
    analysis: {
      analyzedAt: recordedAt, pointCount: 3, referenceImpedanceOhms: 50,
      lowerFrequencyHz: 14_000_000, upperFrequencyHz: 14_400_000,
      minimumSwr, minimumSwrFrequencyHz: minimumFrequencyHz,
      resonanceFrequencyHz, resonanceResistanceOhms: 50, resonanceReactanceOhms: 0,
      threshold: 2, thresholdWindowCount: 1, thresholdSpans: []
    }
  };
}

describe('measurement history comparison', () => {
  it('sorts analyzed entries chronologically and calculates observation deltas', () => {
    const result = buildMeasurementHistoryComparison([
      record('after', '2026-11-15T12:00:00.000Z', 14_250_000, 14_240_000, 1.2),
      record('before', '2026-11-14T12:00:00.000Z', 14_100_000, 14_090_000, 1.5)
    ]);
    expect(result.map((point) => point.record.id)).toEqual(['before', 'after']);
    expect(result[1].delta?.minimumSwr).toBeCloseTo(-0.3);
    expect(result[1].delta?.minimumSwrFrequencyHz).toBe(150_000);
    expect(result[1].delta?.resonanceFrequencyHz).toBe(150_000);
  });

  it('flags differing recorded context without inferring a cause', () => {
    const before = record('before', '2026-11-14T12:00:00.000Z', 14_100_000, 14_090_000);
    const after = { ...record('after', '2026-11-15T12:00:00.000Z', 14_200_000, 14_190_000), referencePlane: 'Station end', installedGeometry: 'Lowered support' };
    expect(buildMeasurementHistoryComparison([before, after])[1].contextChanges).toEqual(['recorded reference plane differs', 'recorded geometry or conditions differ']);
  });

  it('ignores entries that do not contain a saved analysis summary', () => {
    const withoutAnalysis = { ...record('draft', '2026-11-16T12:00:00.000Z', 14_200_000, 14_190_000), analysis: null };
    expect(buildMeasurementHistoryComparison([withoutAnalysis])).toEqual([]);
  });
});
