/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { ExposureProjectInput } from './exposureProject';
import { calculateExposureSensitivity, defaultExposureSensitivityRange, interpolateSensitivityCrossings } from './exposureSensitivity';

const project: ExposureProjectInput = {
  jurisdiction: 'CA', environment: 'uncontrolled', sourceInventoryComplete: true,
  sources: [{ id: 'source', label: 'Vertical', frequencyMHz: 146, transmitterPowerWatts: 50, dutyCyclePercent: 50, feedSystemLossDb: 1, antennaGainDbi: 2.15, antennaLargestDimensionMetres: 1, antennaCentreHeightMetres: 10, eastOffsetMetres: 0, northOffsetMetres: 0, patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }],
  evaluationPoints: [{ id: 'yard', label: 'Yard', eastOffsetMetres: 15, northOffsetMetres: 0, heightMetres: 1.5 }]
};

describe('exposure sensitivity analysis', () => {
  it('samples transmitter power without mutating the project', () => {
    const before = structuredClone(project);
    const result = calculateExposureSensitivity(project, { sourceId: 'source', pointId: 'yard', variable: 'transmitter-power', minimumValue: 25, maximumValue: 100, sampleCount: 4 });
    expect(result.samples).toHaveLength(4);
    expect(result.samples[0].inputValue).toBe(25);
    expect(result.samples[3].inputValue).toBe(100);
    expect(result.samples[3].totalFractionOfReferenceLevel).toBeCloseTo((result.samples[0].totalFractionOfReferenceLevel ?? 0) * 4, 10);
    expect(project).toEqual(before);
  });

  it('moves only the selected point along its existing plan bearing for distance analysis', () => {
    const result = calculateExposureSensitivity(project, { sourceId: 'source', pointId: 'yard', variable: 'plan-distance', minimumValue: 10, maximumValue: 30, sampleCount: 3 });
    expect(result.currentInputValue).toBe(15);
    expect(result.samples[0].totalFractionOfReferenceLevel).toBeGreaterThan(result.samples[2].totalFractionOfReferenceLevel ?? 0);
  });

  it('provides bounded defaults and validates selections and sample ranges', () => {
    expect(defaultExposureSensitivityRange(project, 'source', 'yard', 'duty-cycle')).toEqual({ minimumValue: 12.5, maximumValue: 100, currentValue: 50 });
    expect(() => calculateExposureSensitivity(project, { sourceId: 'missing', pointId: 'yard', variable: 'transmitter-power', minimumValue: 1, maximumValue: 2 })).toThrow(/source/i);
    expect(() => calculateExposureSensitivity(project, { sourceId: 'source', pointId: 'yard', variable: 'transmitter-power', minimumValue: 2, maximumValue: 1 })).toThrow(/range/i);
    expect(() => calculateExposureSensitivity(project, { sourceId: 'source', pointId: 'yard', variable: 'transmitter-power', minimumValue: 1, maximumValue: 2, sampleCount: 1 })).toThrow(/sample count/i);
  });

  it('interpolates rising and falling trigger crossings without bridging invalid samples', () => {
    expect(interpolateSensitivityCrossings([
      { inputValue: 0, totalFractionOfReferenceLevel: 0.25, status: 'below-screening-trigger' },
      { inputValue: 10, totalFractionOfReferenceLevel: 0.75, status: 'further-analysis-required' },
      { inputValue: 20, totalFractionOfReferenceLevel: 0.25, status: 'below-screening-trigger' }
    ], 0.5)).toEqual([{ inputValue: 5, direction: 'rising' }, { inputValue: 15, direction: 'falling' }]);
    expect(interpolateSensitivityCrossings([
      { inputValue: 0, totalFractionOfReferenceLevel: 0.25, status: 'below-screening-trigger' },
      { inputValue: 10, totalFractionOfReferenceLevel: null, status: 'invalid' },
      { inputValue: 20, totalFractionOfReferenceLevel: 0.75, status: 'further-analysis-required' }
    ], 0.5)).toEqual([]);
    expect(() => interpolateSensitivityCrossings([], -1)).toThrow(/threshold/i);
  });
});
