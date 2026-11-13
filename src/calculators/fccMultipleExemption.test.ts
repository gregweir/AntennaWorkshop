/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateFccMultipleSourceExemption,
  type FccMultipleExemptionInput,
  type FccMultipleExemptionSourceInput
} from './fccMultipleExemption';

function source(id: string, overrides: Partial<FccMultipleExemptionSourceInput> = {}): FccMultipleExemptionSourceInput {
  return {
    id,
    label: `Source ${id}`,
    method: 'distance-erp',
    frequencyMHz: 146,
    availableMaximumTimeAveragedPowerWatts: 50,
    maximumTimeAveragedErpWatts: 100,
    separationDistanceMetres: 10,
    evaluatedExposure: 0,
    exposureLimit: 1,
    ...overrides
  };
}

function project(sources: FccMultipleExemptionSourceInput[]): FccMultipleExemptionInput {
  return {
    sourceSetCompleteConfirmed: true,
    fixedPositionalRelationshipConfirmed: true,
    sameTimeAveragingBasisConfirmed: true,
    minimumInterSourceSeparationMetres: 0.02,
    sources
  };
}

describe('FCC multiple-source exemption', () => {
  it('qualifies the separated one-milliwatt path when every source is at or below 1 mW', () => {
    const result = calculateFccMultipleSourceExemption(project([
      source('a', { method: 'close-proximity', availableMaximumTimeAveragedPowerWatts: 0.0006, frequencyMHz: 146 }),
      source('b', { method: 'close-proximity', availableMaximumTimeAveragedPowerWatts: 0.0006, frequencyMHz: 146 })
    ]));
    expect(result.lowPowerPath).toMatchObject({
      everySourceAtOrBelowOneMilliwatt: true,
      totalBelowOneMilliwatt: false,
      twoCentimetreSeparationSatisfied: true,
      passes: true
    });
    expect(result.status).toBe('exempt-from-routine-evaluation');
    expect(result.governingPath).toBe('one-milliwatt');
  });

  it('requires no inter-source separation when total available power is strictly below 1 mW', () => {
    const result = calculateFccMultipleSourceExemption({
      ...project([
        source('a', { availableMaximumTimeAveragedPowerWatts: 0.0004 }),
        source('b', { availableMaximumTimeAveragedPowerWatts: 0.0005 })
      ]),
      minimumInterSourceSeparationMetres: 0
    });
    expect(result.lowPowerPath).toMatchObject({ totalBelowOneMilliwatt: true, passes: true });
  });

  it('treats exactly 1 mW total as requiring the two-centimetre separation condition', () => {
    const result = calculateFccMultipleSourceExemption({
      ...project([
        source('a', { method: 'close-proximity', frequencyMHz: 146, availableMaximumTimeAveragedPowerWatts: 0.0005 }),
        source('b', { method: 'close-proximity', frequencyMHz: 146, availableMaximumTimeAveragedPowerWatts: 0.0005 })
      ]),
      minimumInterSourceSeparationMetres: 0.019999
    });
    expect(result.lowPowerPath).toMatchObject({ totalBelowOneMilliwatt: false, passes: false });
    expect(result.status).toBe('selected-method-inapplicable');
  });

  it('adds close-proximity, distance-ERP, and existing-evaluation fractions', () => {
    const closeThresholdWatts = 3.06;
    const distanceThresholdWatts = 3.83 * 10 ** 2;
    const result = calculateFccMultipleSourceExemption(project([
      source('close', {
        method: 'close-proximity', frequencyMHz: 1500, separationDistanceMetres: 0.2,
        availableMaximumTimeAveragedPowerWatts: closeThresholdWatts * 0.2,
        maximumTimeAveragedErpWatts: closeThresholdWatts * 0.1
      }),
      source('distance', {
        method: 'distance-erp', frequencyMHz: 146, separationDistanceMetres: 10,
        maximumTimeAveragedErpWatts: distanceThresholdWatts * 0.3
      }),
      source('evaluated', {
        method: 'evaluated', evaluatedExposure: 5, exposureLimit: 10
      })
    ]));
    expect(result.contributions.map((contribution) => contribution.fraction)).toEqual([
      expect.closeTo(0.2, 12), expect.closeTo(0.3, 12), expect.closeTo(0.5, 12)
    ]);
    expect(result.totalFraction).toBeCloseTo(1, 12);
    expect(result.status).toBe('exempt-from-routine-evaluation');
    expect(result.governingPath).toBe('fractional-sum');
  });

  it('requires routine evaluation above a fractional sum of one', () => {
    const result = calculateFccMultipleSourceExemption(project([
      source('a', { method: 'evaluated', evaluatedExposure: 0.6, exposureLimit: 1 }),
      source('b', { method: 'evaluated', evaluatedExposure: 0.5, exposureLimit: 1 })
    ]));
    expect(result.totalFraction).toBeCloseTo(1.1, 12);
    expect(result.remainingFraction).toBe(0);
    expect(result.status).toBe('routine-evaluation-required');
  });

  it('stops when a selected contribution method is inapplicable', () => {
    const result = calculateFccMultipleSourceExemption(project([
      source('a', { method: 'close-proximity', frequencyMHz: 146, separationDistanceMetres: 1 }),
      source('b', { method: 'evaluated', evaluatedExposure: 0.1, exposureLimit: 1 })
    ]));
    expect(result.totalFraction).toBeNull();
    expect(result.contributions[0]).toMatchObject({ applicable: false, fraction: null });
    expect(result.status).toBe('selected-method-inapplicable');
  });

  it('remains inconclusive until positional and averaging conditions are confirmed', () => {
    const result = calculateFccMultipleSourceExemption({
      ...project([source('a'), source('b')]),
      fixedPositionalRelationshipConfirmed: false
    });
    expect(result.status).toBe('conditions-not-confirmed');
    expect(result.governingPath).toBeNull();
  });

  it('remains inconclusive until the collective source set is confirmed complete', () => {
    const result = calculateFccMultipleSourceExemption({
      ...project([source('a'), source('b')]),
      sourceSetCompleteConfirmed: false
    });
    expect(result.status).toBe('conditions-not-confirmed');
  });

  it('rejects malformed source collections and method inputs', () => {
    expect(() => calculateFccMultipleSourceExemption(project([source('a')]))).toThrow(/two and 20/);
    expect(() => calculateFccMultipleSourceExemption(project([source('a'), source('a')]))).toThrow(/unique/);
    expect(() => calculateFccMultipleSourceExemption(project([source('a', { label: ' ' }), source('b')]))).toThrow(/label/);
    expect(() => calculateFccMultipleSourceExemption(project([
      source('a', { method: 'evaluated', exposureLimit: 0 }), source('b')
    ]))).toThrow(/exposure limit/);
    expect(() => calculateFccMultipleSourceExemption({
      ...project([source('a'), source('b')]), minimumInterSourceSeparationMetres: -1
    })).toThrow(/inter-source/);
  });
});
