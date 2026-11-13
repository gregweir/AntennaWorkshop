/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type OfcomPowerBasis = 'EIRP' | 'ERP';
export type OfcomAssessmentStatus = 'no-action-no-record' | 'no-assessment-record-required' | 'assessment-required';

export interface OfcomAssessmentInput {
  authorisedAboveThreshold: boolean;
  currentlyTransmitting: boolean;
  emergencyOnly: boolean;
  powerBasis: OfcomPowerBasis;
  maximumRadiatedPowerWatts: number;
  maximumTransmitSecondsInSixMinutes: number;
}

export interface OfcomAssessmentResult {
  status: OfcomAssessmentStatus;
  reason: 'authorisation' | 'not-transmitting' | 'emergency-only' | 'maximum-power' | 'average-and-peak' | 'assessment-trigger';
  averageRadiatedPowerWatts: number;
  averagePowerThresholdWatts: number;
  peakPowerThresholdWatts: number;
  dutyCyclePercent: number;
  recordRequired: boolean;
}

export const OFCOM_ASSESSMENT_MODEL = {
  id: 'ofcom-emf-assessment-requirement',
  version: '1.0.0',
  sourceRevision: 'Ofcom Guidance on EMF Compliance and Enforcement V1.1, 9 February 2026',
  reviewedOn: '2026-11-13',
  source: {
    title: 'Ofcom Guidance on EMF Compliance and Enforcement',
    url: 'https://www.ofcom.org.uk/spectrum/electromagnetic-fields/compliance-and-enforcement-guidance'
  },
  amateurGuide: {
    title: 'Ofcom EMF licence condition: amateur radio user V2.1',
    url: 'https://www.ofcom.org.uk/siteassets/resources/documents/spectrum/emf/emf-licence-condition-what-you-need-to-know-amateur-radio.pdf'
  }
} as const;

export function calculateOfcomAssessmentRequirement(input: OfcomAssessmentInput): OfcomAssessmentResult {
  if (input.powerBasis !== 'EIRP' && input.powerBasis !== 'ERP') throw new RangeError('Power basis must be EIRP or ERP.');
  if (!Number.isFinite(input.maximumRadiatedPowerWatts) || input.maximumRadiatedPowerWatts < 0 || input.maximumRadiatedPowerWatts > 1_000_000) {
    throw new RangeError('Maximum radiated power must be between 0 and 1,000,000 watts.');
  }
  if (!Number.isFinite(input.maximumTransmitSecondsInSixMinutes) || input.maximumTransmitSecondsInSixMinutes < 0 || input.maximumTransmitSecondsInSixMinutes > 360) {
    throw new RangeError('Maximum transmission time must be between 0 and 360 seconds.');
  }

  const averagePowerThresholdWatts = input.powerBasis === 'EIRP' ? 10 : 6.1;
  const peakPowerThresholdWatts = input.powerBasis === 'EIRP' ? 100 : 61;
  const dutyCyclePercent = input.maximumTransmitSecondsInSixMinutes / 3.6;
  const averageRadiatedPowerWatts = input.maximumRadiatedPowerWatts * input.maximumTransmitSecondsInSixMinutes / 360;
  const base = { averageRadiatedPowerWatts, averagePowerThresholdWatts, peakPowerThresholdWatts, dutyCyclePercent };

  if (!input.authorisedAboveThreshold) return { ...base, status: 'no-action-no-record', reason: 'authorisation', recordRequired: false };
  if (!input.currentlyTransmitting) return { ...base, status: 'no-action-no-record', reason: 'not-transmitting', recordRequired: false };
  if (input.emergencyOnly) return { ...base, status: 'no-action-no-record', reason: 'emergency-only', recordRequired: false };
  if (input.maximumRadiatedPowerWatts <= averagePowerThresholdWatts) {
    return { ...base, status: 'no-action-no-record', reason: 'maximum-power', recordRequired: false };
  }
  if (averageRadiatedPowerWatts <= averagePowerThresholdWatts && input.maximumRadiatedPowerWatts <= peakPowerThresholdWatts) {
    return { ...base, status: 'no-assessment-record-required', reason: 'average-and-peak', recordRequired: true };
  }
  return { ...base, status: 'assessment-required', reason: 'assessment-trigger', recordRequired: true };
}
