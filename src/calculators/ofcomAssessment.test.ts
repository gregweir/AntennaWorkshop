/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateOfcomAssessmentRequirement, type OfcomAssessmentInput } from './ofcomAssessment';

const input = (overrides: Partial<OfcomAssessmentInput> = {}): OfcomAssessmentInput => ({
  authorisedAboveThreshold: true,
  currentlyTransmitting: true,
  emergencyOnly: false,
  powerBasis: 'EIRP',
  maximumRadiatedPowerWatts: 50,
  maximumTransmitSecondsInSixMinutes: 60,
  ...overrides
});

describe('Ofcom assessment requirement', () => {
  it.each([
    [{ authorisedAboveThreshold: false }, 'authorisation'],
    [{ currentlyTransmitting: false }, 'not-transmitting'],
    [{ emergencyOnly: true }, 'emergency-only']
  ] as const)('returns no-action for an excluded scenario', (overrides, reason) => {
    expect(calculateOfcomAssessmentRequirement(input(overrides))).toMatchObject({ status: 'no-action-no-record', reason, recordRequired: false });
  });

  it('uses inclusive maximum-power thresholds for EIRP and ERP', () => {
    expect(calculateOfcomAssessmentRequirement(input({ maximumRadiatedPowerWatts: 10 }))).toMatchObject({ status: 'no-action-no-record', reason: 'maximum-power' });
    expect(calculateOfcomAssessmentRequirement(input({ powerBasis: 'ERP', maximumRadiatedPowerWatts: 6.1 }))).toMatchObject({ status: 'no-action-no-record', reason: 'maximum-power' });
  });

  it('requires an average-power record when both averaged and peak caps are met', () => {
    expect(calculateOfcomAssessmentRequirement(input({ maximumRadiatedPowerWatts: 100, maximumTransmitSecondsInSixMinutes: 36 }))).toMatchObject({
      status: 'no-assessment-record-required', averageRadiatedPowerWatts: 10, dutyCyclePercent: 10, recordRequired: true
    });
    expect(calculateOfcomAssessmentRequirement(input({ powerBasis: 'ERP', maximumRadiatedPowerWatts: 61, maximumTransmitSecondsInSixMinutes: 36 }))).toMatchObject({
      status: 'no-assessment-record-required', averageRadiatedPowerWatts: 6.1
    });
  });

  it('requires assessment when either the average or peak cap is exceeded', () => {
    expect(calculateOfcomAssessmentRequirement(input({ maximumRadiatedPowerWatts: 100, maximumTransmitSecondsInSixMinutes: 36.01 })).status).toBe('assessment-required');
    expect(calculateOfcomAssessmentRequirement(input({ maximumRadiatedPowerWatts: 100.01, maximumTransmitSecondsInSixMinutes: 1 })).status).toBe('assessment-required');
    expect(calculateOfcomAssessmentRequirement(input({ powerBasis: 'ERP', maximumRadiatedPowerWatts: 61.01, maximumTransmitSecondsInSixMinutes: 1 })).status).toBe('assessment-required');
  });

  it('rejects invalid power bases, power, and six-minute transmission times', () => {
    expect(() => calculateOfcomAssessmentRequirement(input({ powerBasis: 'watts' as 'EIRP' }))).toThrow(RangeError);
    expect(() => calculateOfcomAssessmentRequirement(input({ maximumRadiatedPowerWatts: -1 }))).toThrow(RangeError);
    expect(() => calculateOfcomAssessmentRequirement(input({ maximumTransmitSecondsInSixMinutes: 360.1 }))).toThrow(RangeError);
  });
});
