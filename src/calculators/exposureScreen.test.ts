/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateExposureScreen, type ExposureScreenInput } from './exposureScreen';

const baseInput: ExposureScreenInput = {
  jurisdiction: 'CA',
  environment: 'uncontrolled',
  frequencyMHz: 146,
  transmitterPowerWatts: 50,
  dutyCyclePercent: 50,
  feedSystemLossDb: 1,
  antennaGainDbi: 2.15,
  antennaLargestDimensionMetres: 1,
  separationDistanceMetres: 10,
  nearbySourcesAssessed: true
};

describe('conservative far-field exposure screen', () => {
  it('calculates the complete average-power path and Canadian 50% trigger', () => {
    const result = calculateExposureScreen(baseInput);
    expect(result.averageTransmitterPowerWatts).toBeCloseTo(25, 10);
    expect(result.averagePowerAtAntennaWatts).toBeCloseTo(19.858, 3);
    expect(result.averageEirpWatts).toBeCloseTo(32.579, 3);
    expect(result.estimatedPowerDensityWattsPerSquareMetre).toBeCloseTo(0.06637, 5);
    expect(result.referenceLevelWattsPerSquareMetre).toBe(1.291);
    expect(result.fractionOfReferenceLevel).toBeCloseTo(0.0514, 4);
    expect(result.screeningTriggerFraction).toBe(0.5);
    expect(result.status).toBe('below-screening-trigger');
  });

  it('uses the full reference level as the US screening trigger', () => {
    const result = calculateExposureScreen({ ...baseInput, jurisdiction: 'US' });
    expect(result.referenceLevelWattsPerSquareMetre).toBe(2);
    expect(result.screeningTriggerFraction).toBe(1);
  });

  it('escalates a result at or above its screening trigger', () => {
    const threshold = calculateExposureScreen(baseInput).distanceToScreeningTriggerMetres;
    const result = calculateExposureScreen({ ...baseInput, separationDistanceMetres: threshold });
    expect(result.fractionOfReferenceLevel).toBeCloseTo(0.5, 10);
    expect(result.status).toBe('further-analysis-required');
  });

  it('refuses to interpret a point inside the conservative far-field boundary', () => {
    const result = calculateExposureScreen({
      ...baseInput,
      antennaLargestDimensionMetres: 10,
      separationDistanceMetres: 10
    });
    expect(result.farFieldBoundaryMetres).toBeGreaterThan(10);
    expect(result.status).toBe('method-inapplicable');
  });

  it('marks unassessed nearby sources as inconclusive', () => {
    const result = calculateExposureScreen({ ...baseInput, nearbySourcesAssessed: false });
    expect(result.status).toBe('screening-inconclusive');
  });

  it('rejects inputs outside every declared boundary', () => {
    const cases: Array<[keyof ExposureScreenInput, number]> = [
      ['frequencyMHz', 0],
      ['transmitterPowerWatts', 0],
      ['dutyCyclePercent', 0],
      ['dutyCyclePercent', 101],
      ['feedSystemLossDb', -1],
      ['antennaGainDbi', 101],
      ['antennaLargestDimensionMetres', 0],
      ['separationDistanceMetres', 0]
    ];
    for (const [key, value] of cases) {
      expect(() => calculateExposureScreen({ ...baseInput, [key]: value })).toThrow(RangeError);
    }
  });

  it('rejects Canadian frequencies outside the encoded power-density method', () => {
    expect(() => calculateExposureScreen({ ...baseInput, frequencyMHz: 7.1 })).toThrow(/10 to 300,000/);
  });
});
