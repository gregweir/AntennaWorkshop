/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateExposureAggregation, type ExposureContributionInput } from './exposureAggregation';

const sources: ExposureContributionInput[] = [
  { id: 'vhf', label: 'VHF antenna', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0.1291 },
  { id: 'uhf', label: 'UHF antenna', frequencyMHz: 446, powerDensityWattsPerSquareMetre: 0.06455 }
];

describe('multiple-source exposure aggregation', () => {
  it('sums each Canadian source as a fraction of its own frequency-specific limit', () => {
    const result = calculateExposureAggregation('CA', 'uncontrolled', sources, true);
    expect(result.contributions[0].fractionOfReferenceLevel).toBeCloseTo(0.1, 10);
    expect(result.contributions[1].referenceLevelWattsPerSquareMetre).toBeCloseTo(1.6931, 3);
    expect(result.totalFractionOfReferenceLevel).toBeCloseTo(0.13813, 4);
    expect(result.screeningTriggerFraction).toBe(0.5);
    expect(result.remainingFractionToScreeningTrigger).toBeCloseTo(0.36187, 4);
    expect(result.status).toBe('below-screening-trigger');
    expect(result.dominantSourceId).toBe('vhf');
  });

  it('uses each FCC frequency-specific MPE limit', () => {
    const result = calculateExposureAggregation('US', 'uncontrolled', [
      { id: 'two-metres', label: '2 m', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0.2 },
      { id: 'seventy-centimetres', label: '70 cm', frequencyMHz: 446, powerDensityWattsPerSquareMetre: 0.446 }
    ], true);
    expect(result.contributions.map((source) => source.fractionOfReferenceLevel)).toEqual([0.1, 0.15]);
    expect(result.totalFractionOfReferenceLevel).toBeCloseTo(0.25, 10);
    expect(result.screeningTriggerFraction).toBe(1);
  });

  it('escalates at the applicable aggregate screening trigger', () => {
    const result = calculateExposureAggregation('CA', 'uncontrolled', [
      { id: 'a', label: 'A', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0.4 },
      { id: 'b', label: 'B', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0.2455 }
    ], true);
    expect(result.totalFractionOfReferenceLevel).toBeCloseTo(0.5, 10);
    expect(result.status).toBe('further-analysis-required');
  });

  it('remains inconclusive until the source inventory is confirmed complete', () => {
    const result = calculateExposureAggregation('CA', 'uncontrolled', sources, false);
    expect(result.status).toBe('screening-inconclusive');
  });

  it('allows a zero contribution but rejects malformed sources', () => {
    const zero = calculateExposureAggregation('CA', 'uncontrolled', [
      { id: 'zero', label: 'Off-air source', frequencyMHz: 146, powerDensityWattsPerSquareMetre: 0 }
    ], true);
    expect(zero.totalFractionOfReferenceLevel).toBe(0);
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [], true)).toThrow(/one and 20/);
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [sources[0], sources[0]], true)).toThrow(/unique/);
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [{ ...sources[0], label: ' ' }], true)).toThrow(/label/);
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [{ ...sources[0], frequencyMHz: 0 }], true)).toThrow(/frequency/);
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [{ ...sources[0], powerDensityWattsPerSquareMetre: -1 }], true)).toThrow(/power density/);
  });

  it('rejects sources outside the selected jurisdiction power-density model', () => {
    expect(() => calculateExposureAggregation('CA', 'uncontrolled', [
      { id: 'hf', label: 'HF antenna', frequencyMHz: 7.1, powerDensityWattsPerSquareMetre: 0.1 }
    ], true)).toThrow(/10 to 300,000/);
  });
});
