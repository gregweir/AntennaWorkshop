/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import {
  getExposureReferenceLevel,
  type ExposureEnvironment,
  type ExposureJurisdiction
} from '../regulations/exposureLimits';

export type ExposureAggregationStatus =
  | 'below-screening-trigger'
  | 'further-analysis-required'
  | 'screening-inconclusive';

export interface ExposureContributionInput {
  id: string;
  label: string;
  frequencyMHz: number;
  powerDensityWattsPerSquareMetre: number;
}

export interface ExposureContributionResult extends ExposureContributionInput {
  referenceLevelWattsPerSquareMetre: number;
  averagingMinutes: number;
  fractionOfReferenceLevel: number;
}

export interface ExposureAggregationResult {
  status: ExposureAggregationStatus;
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  sourceInventoryComplete: boolean;
  screeningTriggerFraction: number;
  totalFractionOfReferenceLevel: number;
  remainingFractionToReferenceLevel: number;
  remainingFractionToScreeningTrigger: number;
  contributions: ExposureContributionResult[];
  dominantSourceId: string;
}

export const EXPOSURE_AGGREGATION_MODEL = {
  id: 'multiple-source-normalized-power-density-sum',
  version: '1.0.0',
  reviewedOn: '2026-11-11',
  sources: [
    {
      title: 'ISED BPR-1 §8.1 — multiple-source fractional contribution method',
      url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radio-authorizations/broadcasting-certification/broadcasting-procedures-and-rules-bpr/bpr-1-general-rules'
    },
    {
      title: 'FCC 47 CFR §1.1310 — frequency-specific MPE limits and averaging periods',
      url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1310'
    }
  ]
} as const;

export function calculateExposureAggregation(
  jurisdiction: ExposureJurisdiction,
  environment: ExposureEnvironment,
  sources: ExposureContributionInput[],
  sourceInventoryComplete: boolean
): ExposureAggregationResult {
  if (sources.length === 0 || sources.length > 20) {
    throw new RangeError('Provide between one and 20 RF sources.');
  }

  const ids = new Set<string>();
  const contributions = sources.map((source) => {
    if (!source.id || ids.has(source.id)) throw new RangeError('Every RF source must have a unique identifier.');
    ids.add(source.id);
    if (!source.label.trim()) throw new RangeError('Every RF source must have a label.');
    if (!Number.isFinite(source.frequencyMHz) || source.frequencyMHz <= 0) {
      throw new RangeError('Every source frequency must be greater than zero.');
    }
    if (!Number.isFinite(source.powerDensityWattsPerSquareMetre) || source.powerDensityWattsPerSquareMetre < 0) {
      throw new RangeError('Every source power density must be zero or greater.');
    }
    const reference = getExposureReferenceLevel(jurisdiction, source.frequencyMHz, environment);
    return {
      ...source,
      referenceLevelWattsPerSquareMetre: reference.powerDensityWattsPerSquareMetre,
      averagingMinutes: reference.averagingMinutes,
      fractionOfReferenceLevel: source.powerDensityWattsPerSquareMetre / reference.powerDensityWattsPerSquareMetre
    };
  });

  const totalFractionOfReferenceLevel = contributions.reduce((total, source) => total + source.fractionOfReferenceLevel, 0);
  const screeningTriggerFraction = jurisdiction === 'CA' && environment === 'uncontrolled' ? 0.5 : 1;
  const dominant = contributions.reduce((largest, source) => source.fractionOfReferenceLevel > largest.fractionOfReferenceLevel ? source : largest);
  const status: ExposureAggregationStatus = !sourceInventoryComplete
    ? 'screening-inconclusive'
    : totalFractionOfReferenceLevel >= screeningTriggerFraction
      ? 'further-analysis-required'
      : 'below-screening-trigger';

  return {
    status,
    jurisdiction,
    environment,
    sourceInventoryComplete,
    screeningTriggerFraction,
    totalFractionOfReferenceLevel,
    remainingFractionToReferenceLevel: Math.max(0, 1 - totalFractionOfReferenceLevel),
    remainingFractionToScreeningTrigger: Math.max(0, screeningTriggerFraction - totalFractionOfReferenceLevel),
    contributions,
    dominantSourceId: dominant.id
  };
}
