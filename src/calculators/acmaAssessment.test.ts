/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { assessAcmaStation, type AcmaAssessmentInput } from './acmaAssessment';

const fixedStation: AcmaAssessmentInput = {
  stationType: 'fixed', averageTotalPowerWatts: 100, everyAntennaInaccessibleToPublic: true,
  lowestAntennaBaseHeightMetres: 5, averageTotalEirpWatts: 100,
  simultaneousMultipleFrequencies: false, multipleStationsAtSite: false
};

describe('ACMA Amateur Class Licence assessment gateway', () => {
  it('includes the inclusive 100 W fixed-station inaccessible-antenna path', () => {
    const result = assessAcmaStation(fixedStation);
    expect(result.status).toBe('low-risk-station');
    expect(result.lowRiskPath).toBe('fixed-power-access');
    expect(result.higherRiskMeasurementRequired).toBe(false);
    expect(result.higherRiskRecordPackageRequired).toBe(false);
  });

  it('includes the inclusive 10 m and 3200 W EIRP fixed-station path', () => {
    const result = assessAcmaStation({ ...fixedStation, averageTotalPowerWatts: 500, everyAntennaInaccessibleToPublic: false, lowestAntennaBaseHeightMetres: 10, averageTotalEirpWatts: 3_200 });
    expect(result.lowRiskPath).toBe('fixed-height-eirp');
  });

  it('uses the separate mobile-station 100 W path', () => {
    expect(assessAcmaStation({ ...fixedStation, stationType: 'mobile', everyAntennaInaccessibleToPublic: false }).lowRiskPath).toBe('mobile-power');
    expect(assessAcmaStation({ ...fixedStation, stationType: 'mobile', averageTotalPowerWatts: 100.001 }).status).toBe('higher-risk-assessment-required');
  });

  it('requires the higher-risk assessment and records when no path applies', () => {
    const result = assessAcmaStation({ ...fixedStation, averageTotalPowerWatts: 101, everyAntennaInaccessibleToPublic: false, lowestAntennaBaseHeightMetres: 9.999, averageTotalEirpWatts: 3_201, simultaneousMultipleFrequencies: true, multipleStationsAtSite: true });
    expect(result.status).toBe('higher-risk-assessment-required');
    expect(result.higherRiskMeasurementRequired).toBe(true);
    expect(result.higherRiskRecordPackageRequired).toBe(true);
    expect(result.simultaneousFrequencyAssessmentRequired).toBe(true);
    expect(result.wholeSiteAssessmentRelevant).toBe(true);
  });

  it('fails closed for invalid numeric inputs', () => {
    expect(() => assessAcmaStation({ ...fixedStation, averageTotalPowerWatts: -1 })).toThrow(RangeError);
    expect(() => assessAcmaStation({ ...fixedStation, averageTotalEirpWatts: Number.NaN })).toThrow(RangeError);
    expect(() => assessAcmaStation({ ...fixedStation, lowestAntennaBaseHeightMetres: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  });
});
