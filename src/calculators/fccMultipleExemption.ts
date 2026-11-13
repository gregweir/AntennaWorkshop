/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { getCloseProximityThresholdWatts, getDistanceErpThresholdWatts } from './fccExemption';

export type FccMultipleExemptionMethod = 'close-proximity' | 'distance-erp' | 'evaluated';
export type FccMultipleExemptionStatus =
  | 'exempt-from-routine-evaluation'
  | 'routine-evaluation-required'
  | 'conditions-not-confirmed'
  | 'selected-method-inapplicable';

export interface FccMultipleExemptionSourceInput {
  id: string;
  label: string;
  method: FccMultipleExemptionMethod;
  frequencyMHz: number;
  availableMaximumTimeAveragedPowerWatts: number;
  maximumTimeAveragedErpWatts: number;
  separationDistanceMetres: number;
  evaluatedExposure: number;
  exposureLimit: number;
}

export interface FccMultipleExemptionInput {
  sourceSetCompleteConfirmed: boolean;
  fixedPositionalRelationshipConfirmed: boolean;
  sameTimeAveragingBasisConfirmed: boolean;
  minimumInterSourceSeparationMetres: number;
  sources: FccMultipleExemptionSourceInput[];
}

export interface FccMultipleExemptionContribution {
  sourceId: string;
  label: string;
  method: FccMultipleExemptionMethod;
  applicable: boolean;
  numerator: number;
  denominator: number | null;
  fraction: number | null;
  detail: string;
}

export interface FccMultipleExemptionResult {
  status: FccMultipleExemptionStatus;
  governingPath: 'one-milliwatt' | 'fractional-sum' | null;
  lowPowerPath: {
    everySourceAtOrBelowOneMilliwatt: boolean;
    totalAvailablePowerWatts: number;
    totalBelowOneMilliwatt: boolean;
    twoCentimetreSeparationSatisfied: boolean;
    passes: boolean;
  };
  totalFraction: number | null;
  remainingFraction: number | null;
  contributions: FccMultipleExemptionContribution[];
}

export const FCC_MULTIPLE_EXEMPTION_MODEL = {
  id: 'fcc-47-cfr-1.1307-multiple-source-exemption',
  version: '1.0.0',
  sourceRevision: 'eCFR Title 47 § 1.1307(b)(3)(ii), current through 2026-11-10',
  reviewedOn: '2026-11-13',
  source: {
    title: '47 CFR § 1.1307(b)(3)(ii) — multiple RF source exemptions',
    url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1307'
  }
} as const;

function requireFinite(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function contributionFor(source: FccMultipleExemptionSourceInput): FccMultipleExemptionContribution {
  if (source.method === 'evaluated') {
    requireFinite(source.evaluatedExposure, `${source.label} evaluated exposure`, 0, 1_000_000_000);
    requireFinite(source.exposureLimit, `${source.label} exposure limit`, 0.000_000_001, 1_000_000_000);
    return {
      sourceId: source.id,
      label: source.label,
      method: source.method,
      applicable: true,
      numerator: source.evaluatedExposure,
      denominator: source.exposureLimit,
      fraction: source.evaluatedExposure / source.exposureLimit,
      detail: 'Uses an existing evaluated exposure divided by its applicable exposure limit at the specified minimum distance.'
    };
  }

  requireFinite(source.frequencyMHz, `${source.label} frequency`, 0.001, 300_000);
  requireFinite(source.maximumTimeAveragedErpWatts, `${source.label} ERP`, 0, 1_000_000);
  requireFinite(source.separationDistanceMetres, `${source.label} separation distance`, 0.001, 1_000_000);

  if (source.method === 'close-proximity') {
    const threshold = getCloseProximityThresholdWatts(source.frequencyMHz, source.separationDistanceMetres);
    const numerator = Math.max(source.availableMaximumTimeAveragedPowerWatts, source.maximumTimeAveragedErpWatts);
    return {
      sourceId: source.id,
      label: source.label,
      method: source.method,
      applicable: threshold !== null,
      numerator,
      denominator: threshold,
      fraction: threshold === null ? null : numerator / threshold,
      detail: threshold === null
        ? 'The selected close-proximity path requires 300–6000 MHz and 0.5–40 cm separation.'
        : 'Uses the greater of available maximum time-averaged power or ERP divided by Pth.'
    };
  }

  const wavelengthMetres = 299_792_458 / (source.frequencyMHz * 1_000_000);
  const minimumDistanceMetres = wavelengthMetres / (2 * Math.PI);
  const threshold = getDistanceErpThresholdWatts(source.frequencyMHz, source.separationDistanceMetres);
  const applicable = threshold !== null && source.separationDistanceMetres >= minimumDistanceMetres;
  return {
    sourceId: source.id,
    label: source.label,
    method: source.method,
    applicable,
    numerator: source.maximumTimeAveragedErpWatts,
    denominator: applicable ? threshold : null,
    fraction: applicable ? source.maximumTimeAveragedErpWatts / threshold : null,
    detail: threshold === null
      ? 'The distance-based ERP path requires 0.3–100,000 MHz.'
      : !applicable
        ? 'The entered body separation is less than λ/(2π) for this source.'
        : 'Uses maximum time-averaged ERP divided by the frequency- and distance-specific Table 1 threshold.'
  };
}

export function calculateFccMultipleSourceExemption(input: FccMultipleExemptionInput): FccMultipleExemptionResult {
  if (input.sources.length < 2 || input.sources.length > 20) {
    throw new RangeError('Provide between two and 20 RF sources.');
  }
  requireFinite(input.minimumInterSourceSeparationMetres, 'Minimum inter-source separation', 0, 1_000_000);

  const ids = new Set<string>();
  for (const source of input.sources) {
    if (!source.id || ids.has(source.id)) throw new RangeError('Every RF source must have a unique identifier.');
    ids.add(source.id);
    if (!source.label.trim()) throw new RangeError('Every RF source must have a label.');
    if (!['close-proximity', 'distance-erp', 'evaluated'].includes(source.method)) {
      throw new RangeError('Every RF source must use a supported exemption contribution method.');
    }
    requireFinite(source.availableMaximumTimeAveragedPowerWatts, `${source.label} available power`, 0, 1_000_000);
  }

  const totalAvailablePowerWatts = input.sources.reduce(
    (total, source) => total + source.availableMaximumTimeAveragedPowerWatts,
    0
  );
  const everySourceAtOrBelowOneMilliwatt = input.sources.every(
    (source) => source.availableMaximumTimeAveragedPowerWatts <= 0.001
  );
  const totalBelowOneMilliwatt = totalAvailablePowerWatts < 0.001;
  const twoCentimetreSeparationSatisfied = input.minimumInterSourceSeparationMetres >= 0.02;
  const lowPowerPasses = everySourceAtOrBelowOneMilliwatt
    && (totalBelowOneMilliwatt || twoCentimetreSeparationSatisfied);
  const contributions = input.sources.map(contributionFor);
  const everyContributionApplicable = contributions.every((contribution) => contribution.applicable);
  const totalFraction = everyContributionApplicable
    ? contributions.reduce((total, contribution) => total + contribution.fraction!, 0)
    : null;
  const fractionalPathPasses = totalFraction !== null && totalFraction <= 1;
  const conditionsConfirmed = input.sourceSetCompleteConfirmed
    && input.fixedPositionalRelationshipConfirmed
    && input.sameTimeAveragingBasisConfirmed;

  let status: FccMultipleExemptionStatus;
  let governingPath: FccMultipleExemptionResult['governingPath'] = null;
  if (!conditionsConfirmed) {
    status = 'conditions-not-confirmed';
  } else if (lowPowerPasses) {
    status = 'exempt-from-routine-evaluation';
    governingPath = 'one-milliwatt';
  } else if (!everyContributionApplicable) {
    status = 'selected-method-inapplicable';
  } else if (fractionalPathPasses) {
    status = 'exempt-from-routine-evaluation';
    governingPath = 'fractional-sum';
  } else {
    status = 'routine-evaluation-required';
  }

  return {
    status,
    governingPath,
    lowPowerPath: {
      everySourceAtOrBelowOneMilliwatt,
      totalAvailablePowerWatts,
      totalBelowOneMilliwatt,
      twoCentimetreSeparationSatisfied,
      passes: lowPowerPasses
    },
    totalFraction,
    remainingFraction: totalFraction === null ? null : Math.max(0, 1 - totalFraction),
    contributions
  };
}
