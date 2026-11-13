/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AcmaStationType = 'fixed' | 'mobile';
export type AcmaAssessmentStatus = 'low-risk-station' | 'higher-risk-assessment-required';

export interface AcmaAssessmentInput {
  stationType: AcmaStationType;
  averageTotalPowerWatts: number;
  everyAntennaInaccessibleToPublic: boolean;
  lowestAntennaBaseHeightMetres: number;
  averageTotalEirpWatts: number;
  simultaneousMultipleFrequencies: boolean;
  multipleStationsAtSite: boolean;
}

export interface AcmaAssessmentResult {
  status: AcmaAssessmentStatus;
  lowRiskPath: 'fixed-power-access' | 'fixed-height-eirp' | 'mobile-power' | null;
  fixedPowerAccessPathSatisfied: boolean;
  fixedHeightEirpPathSatisfied: boolean;
  mobilePowerPathSatisfied: boolean;
  higherRiskMeasurementRequired: boolean;
  higherRiskRecordPackageRequired: boolean;
  simultaneousFrequencyAssessmentRequired: boolean;
  wholeSiteAssessmentRelevant: boolean;
  modelId: string;
  modelVersion: string;
}

export interface AcmaAssessmentHandoff {
  input: AcmaAssessmentInput;
  result: AcmaAssessmentResult;
  transferredAt: string;
}

export const ACMA_ASSESSMENT_MODEL = {
  id: 'acma-amateur-class-licence-schedule-1-gateway',
  version: '1.0.0',
  sourceRevision: 'Radiocommunications (Amateur Stations) Class Licence 2023, Schedule 1, clauses 2–7',
  reviewedOn: '2026-11-13',
  source: {
    title: 'Radiocommunications (Amateur Stations) Class Licence 2023',
    url: 'https://www.legislation.gov.au/F2023L01648/latest/text'
  }
} as const;

function requireNonNegativeFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be zero or greater.`);
}

export function assessAcmaStation(input: AcmaAssessmentInput): AcmaAssessmentResult {
  if (input.stationType !== 'fixed' && input.stationType !== 'mobile') throw new RangeError('Station type must be fixed or mobile.');
  requireNonNegativeFinite(input.averageTotalPowerWatts, 'Average total station power');
  requireNonNegativeFinite(input.lowestAntennaBaseHeightMetres, 'Lowest antenna base height');
  requireNonNegativeFinite(input.averageTotalEirpWatts, 'Average total EIRP');

  const fixedPowerAccessPathSatisfied = input.stationType === 'fixed'
    && input.averageTotalPowerWatts <= 100
    && input.everyAntennaInaccessibleToPublic;
  const fixedHeightEirpPathSatisfied = input.stationType === 'fixed'
    && input.lowestAntennaBaseHeightMetres >= 10
    && input.averageTotalEirpWatts <= 3_200;
  const mobilePowerPathSatisfied = input.stationType === 'mobile'
    && input.averageTotalPowerWatts <= 100;
  const lowRiskPath = fixedPowerAccessPathSatisfied
    ? 'fixed-power-access'
    : fixedHeightEirpPathSatisfied
      ? 'fixed-height-eirp'
      : mobilePowerPathSatisfied
        ? 'mobile-power'
        : null;
  const higherRiskMeasurementRequired = lowRiskPath === null;

  return {
    status: higherRiskMeasurementRequired ? 'higher-risk-assessment-required' : 'low-risk-station',
    lowRiskPath,
    fixedPowerAccessPathSatisfied,
    fixedHeightEirpPathSatisfied,
    mobilePowerPathSatisfied,
    higherRiskMeasurementRequired,
    higherRiskRecordPackageRequired: higherRiskMeasurementRequired,
    simultaneousFrequencyAssessmentRequired: input.simultaneousMultipleFrequencies,
    wholeSiteAssessmentRelevant: input.multipleStationsAtSite,
    modelId: ACMA_ASSESSMENT_MODEL.id,
    modelVersion: ACMA_ASSESSMENT_MODEL.version
  };
}
