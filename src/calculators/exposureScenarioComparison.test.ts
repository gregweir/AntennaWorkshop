/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { ExposureProjectResult } from './exposureProject';
import { compareExposureScenarioInputs, compareExposureScenarios, type ExposureScenarioInput } from './exposureScenarioComparison';

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

  it('audits changed source inputs and project confirmation by stable identity', () => {
    const baseline: ExposureScenarioInput = {
      title: 'Baseline', jurisdiction: 'CA', environment: 'uncontrolled', sourceInventoryComplete: true,
      sources: [{ id: 'source', label: 'Vertical', frequencyMHz: 146, transmitterPowerWatts: 50, dutyCyclePercent: 50, feedSystemLossDb: 1, antennaGainDbi: 2.15, antennaLargestDimensionMetres: 1, antennaCentreHeightMetres: 10, eastOffsetMetres: 0, northOffsetMetres: 0, patternType: 'omnidirectional', bearingDegrees: 0, beamwidthDegrees: 90 }],
      evaluationPoints: [{ id: 'yard', label: 'Yard', eastOffsetMetres: 15, northOffsetMetres: 0, heightMetres: 1.5 }]
    };
    const current: ExposureScenarioInput = {
      ...baseline,
      title: 'Power scenario',
      sourceInventoryComplete: false,
      sources: [{ ...baseline.sources[0], transmitterPowerWatts: 100, antennaCentreHeightMetres: 12 }]
    };
    expect(compareExposureScenarioInputs(baseline, current)).toMatchObject([
      { entityKind: 'project', fieldKey: 'title', baselineValue: 'Baseline', currentValue: 'Power scenario' },
      { entityKind: 'project', fieldKey: 'sourceInventoryComplete', baselineValue: true, currentValue: false },
      { entityKind: 'source', entityId: 'source', fieldKey: 'transmitterPowerWatts', baselineValue: 50, currentValue: 100 },
      { entityKind: 'source', entityId: 'source', fieldKey: 'antennaCentreHeightMetres', baselineValue: 10, currentValue: 12 }
    ]);
  });

  it('audits added and removed entities without pairing by label', () => {
    const baseline: ExposureScenarioInput = { title: 'One', jurisdiction: 'CA', environment: 'uncontrolled', sourceInventoryComplete: false, sources: [], evaluationPoints: [{ id: 'old', label: 'Same label', eastOffsetMetres: 1, northOffsetMetres: 0, heightMetres: 1.5 }] };
    const current: ExposureScenarioInput = { ...baseline, evaluationPoints: [{ id: 'new', label: 'Same label', eastOffsetMetres: 1, northOffsetMetres: 0, heightMetres: 1.5 }] };
    expect(compareExposureScenarioInputs(baseline, current).map((change) => change.changeKind)).toEqual(['removed', 'added']);
  });

  it('audits evidence by stable identity', () => {
    const baseline: ExposureScenarioInput = { title: 'One', jurisdiction: 'CA', environment: 'uncontrolled', sourceInventoryComplete: false, sources: [], evaluationPoints: [], evidenceEntries: [{ id: 'entry', category: 'assumption', title: 'Cable loss', detail: 'Manufacturer specification.', recordedOn: '2026-11-10', reviewer: 'VA1GW', scopeType: 'project', relatedField: 'general', qualityChecks: ['assumption-subject'] }] };
    const current: ExposureScenarioInput = { ...baseline, evidenceEntries: [{ ...baseline.evidenceEntries![0], detail: 'Measured cable loss.', recordedOn: '2026-11-11', qualityChecks: ['assumption-subject', 'assumption-basis'] }, { id: 'new-entry', category: 'measurement', title: 'Mast height', detail: 'Measured on site.', recordedOn: '2026-11-11', reviewer: 'VA1GW', scopeType: 'project', relatedField: 'general', qualityChecks: [] }] };
    expect(compareExposureScenarioInputs(baseline, current)).toMatchObject([
      { entityKind: 'evidence', entityId: 'entry', fieldKey: 'detail', changeKind: 'changed' },
      { entityKind: 'evidence', entityId: 'entry', fieldKey: 'recordedOn', changeKind: 'changed' },
      { entityKind: 'evidence', entityId: 'entry', fieldKey: 'qualityChecks', changeKind: 'changed' },
      { entityKind: 'evidence', entityId: 'new-entry', changeKind: 'added' }
    ]);
  });
});
