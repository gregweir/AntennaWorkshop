/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type FccExemptionStatus = 'exempt-from-routine-evaluation' | 'routine-evaluation-required';
export type FccExemptionCriterionId = 'one-milliwatt' | 'close-proximity' | 'distance-erp';

export interface FccExemptionInput {
  frequencyMHz: number;
  availableMaximumTimeAveragedPowerWatts: number;
  maximumTimeAveragedErpWatts: number;
  separationDistanceMetres: number;
}

export interface FccExemptionCriterionResult {
  id: FccExemptionCriterionId;
  label: string;
  applicable: boolean;
  passes: boolean;
  evaluatedPowerWatts: number;
  thresholdWatts: number | null;
  detail: string;
}

export interface FccExemptionResult {
  status: FccExemptionStatus;
  governingCriterionId: FccExemptionCriterionId | null;
  wavelengthMetres: number;
  minimumDistanceForTableMethodMetres: number;
  criteria: FccExemptionCriterionResult[];
}

export const FCC_EXEMPTION_MODEL = {
  id: 'fcc-47-cfr-1.1307-single-source-exemption',
  version: '1.0.0',
  sourceRevision: 'eCFR Title 47 § 1.1307(b)(3), current through 2026-11-10',
  reviewedOn: '2026-11-13',
  source: {
    title: '47 CFR § 1.1307(b)(3) — determination of exemption',
    url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1307'
  }
} as const;

function requireFinite(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function getCloseProximityThresholdWatts(frequencyMHz: number, separationDistanceMetres: number) {
  if (!Number.isFinite(frequencyMHz) || !Number.isFinite(separationDistanceMetres)
    || frequencyMHz < 300 || frequencyMHz > 6000 || separationDistanceMetres < 0.005 || separationDistanceMetres > 0.4) {
    return null;
  }
  const frequencyGHz = frequencyMHz / 1000;
  const distanceCentimetres = separationDistanceMetres * 100;
  const erpAtTwentyCentimetresMilliwatts = frequencyGHz < 1.5 ? 2040 * frequencyGHz : 3060;
  if (distanceCentimetres > 20) return erpAtTwentyCentimetresMilliwatts / 1000;
  const exponent = -Math.log10(60 / (erpAtTwentyCentimetresMilliwatts * Math.sqrt(frequencyGHz)));
  return erpAtTwentyCentimetresMilliwatts * (distanceCentimetres / 20) ** exponent / 1000;
}

export function getDistanceErpThresholdWatts(frequencyMHz: number, separationDistanceMetres: number) {
  if (!Number.isFinite(frequencyMHz) || !Number.isFinite(separationDistanceMetres)
    || separationDistanceMetres <= 0 || frequencyMHz < 0.3 || frequencyMHz > 100_000) return null;
  const distanceSquared = separationDistanceMetres ** 2;
  if (frequencyMHz <= 1.34) return 1920 * distanceSquared;
  if (frequencyMHz < 30) return 3450 * distanceSquared / frequencyMHz ** 2;
  if (frequencyMHz <= 300) return 3.83 * distanceSquared;
  if (frequencyMHz < 1500) return 0.0128 * distanceSquared * frequencyMHz;
  return 19.2 * distanceSquared;
}

export function calculateFccSingleSourceExemption(input: FccExemptionInput): FccExemptionResult {
  requireFinite(input.frequencyMHz, 'Frequency', 0.001, 300_000);
  requireFinite(input.availableMaximumTimeAveragedPowerWatts, 'Available maximum time-averaged power', 0, 1_000_000);
  requireFinite(input.maximumTimeAveragedErpWatts, 'Maximum time-averaged ERP', 0, 1_000_000);
  requireFinite(input.separationDistanceMetres, 'Separation distance', 0.001, 1_000_000);

  const wavelengthMetres = 299_792_458 / (input.frequencyMHz * 1_000_000);
  const minimumDistanceForTableMethodMetres = wavelengthMetres / (2 * Math.PI);
  const oneMilliwattThresholdWatts = 0.001;
  const closeProximityThresholdWatts = getCloseProximityThresholdWatts(input.frequencyMHz, input.separationDistanceMetres);
  const closeProximityEvaluatedPowerWatts = Math.max(
    input.availableMaximumTimeAveragedPowerWatts,
    input.maximumTimeAveragedErpWatts
  );
  const distanceThreshold = getDistanceErpThresholdWatts(input.frequencyMHz, input.separationDistanceMetres);
  const distanceMethodApplicable = distanceThreshold !== null
    && input.separationDistanceMetres >= minimumDistanceForTableMethodMetres;

  const criteria: FccExemptionCriterionResult[] = [
    {
      id: 'one-milliwatt',
      label: 'One-milliwatt criterion',
      applicable: true,
      passes: input.availableMaximumTimeAveragedPowerWatts <= oneMilliwattThresholdWatts,
      evaluatedPowerWatts: input.availableMaximumTimeAveragedPowerWatts,
      thresholdWatts: oneMilliwattThresholdWatts,
      detail: 'Uses available maximum time-averaged power and applies regardless of separation distance.'
    },
    {
      id: 'close-proximity',
      label: '0.5–40 cm close-proximity criterion',
      applicable: closeProximityThresholdWatts !== null,
      passes: closeProximityThresholdWatts !== null && closeProximityEvaluatedPowerWatts <= closeProximityThresholdWatts,
      evaluatedPowerWatts: closeProximityEvaluatedPowerWatts,
      thresholdWatts: closeProximityThresholdWatts,
      detail: closeProximityThresholdWatts === null
        ? 'Applies only from 300 to 6000 MHz and from 0.5 to 40 centimetres.'
        : 'Compares the greater of available maximum time-averaged power or maximum time-averaged ERP with Pth.'
    },
    {
      id: 'distance-erp',
      label: 'Distance-based ERP criterion',
      applicable: distanceMethodApplicable,
      passes: distanceMethodApplicable && input.maximumTimeAveragedErpWatts <= distanceThreshold,
      evaluatedPowerWatts: input.maximumTimeAveragedErpWatts,
      thresholdWatts: distanceMethodApplicable ? distanceThreshold : null,
      detail: distanceThreshold === null
        ? 'The Table 1 frequency range is 0.3 to 100,000 MHz.'
        : input.separationDistanceMetres < minimumDistanceForTableMethodMetres
          ? 'The separation distance is less than the required λ/(2π) minimum for this criterion.'
          : 'Compares maximum time-averaged ERP with the frequency- and distance-specific Table 1 threshold.'
    }
  ];

  const governingCriterion = criteria.find((criterion) => criterion.applicable && criterion.passes) ?? null;
  return {
    status: governingCriterion ? 'exempt-from-routine-evaluation' : 'routine-evaluation-required',
    governingCriterionId: governingCriterion?.id ?? null,
    wavelengthMetres,
    minimumDistanceForTableMethodMetres,
    criteria
  };
}
