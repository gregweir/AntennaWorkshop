/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateOfcomComplianceDistance, type OfcomComplianceDistanceResult } from './ofcomComplianceDistance';
import type { OfcomPowerBasis } from './ofcomAssessment';

export interface OfcomMultipleSourceInput {
  id: string;
  label: string;
  maximumRadiatedPowerWatts: number;
  powerBasis: OfcomPowerBasis;
  maximumTransmitSecondsInSixMinutes: number;
  frequencyMHz: number;
  antennaLargestDimensionMetres: number;
}

export interface OfcomMultipleDistanceInput {
  sources: OfcomMultipleSourceInput[];
  highReflectionSurface: boolean;
}

export interface OfcomFrequencyEvaluation {
  frequencyMHz: number;
  sourceIdsAtFrequency: string[];
  result: OfcomComplianceDistanceResult;
}

export interface OfcomMultipleDistanceResult {
  status: 'no-further-assessment-required' | 'compliance-distance-calculated' | 'method-limitation';
  totalEirpWatts: number;
  uncappedCombinedTransmitSeconds: number;
  combinedTransmitSeconds: number;
  transmissionTimeCapped: boolean;
  evaluations: OfcomFrequencyEvaluation[];
  governingFrequencyMHz: number;
  complianceDistanceMetres: number;
  limitations: string[];
}

export const OFCOM_MULTIPLE_DISTANCE_MODEL = {
  id: 'ofcom-emf-calculator-v1.1-conservative-multiple-transmitter',
  version: '1.0.0',
  sourceRevision: 'Ofcom EMF Calculator v1.1, Guidance on Multiple Transmitters',
  reviewedOn: '2026-11-13',
  source: {
    title: 'Ofcom EMF Calculator v1.1 — Guidance on Multiple Transmitters',
    url: 'https://static.ofcom.org.uk/static/emf/index.html#/multiple-transmitters'
  }
} as const;

export function calculateOfcomMultipleDistance(input: OfcomMultipleDistanceInput): OfcomMultipleDistanceResult {
  if (input.sources.length < 2 || input.sources.length > 20) throw new RangeError('Provide between two and 20 transmitters.');
  const ids = new Set<string>();
  let totalEirpWatts = 0;
  let uncappedCombinedTransmitSeconds = 0;
  for (const source of input.sources) {
    if (!source.id || ids.has(source.id)) throw new RangeError('Every transmitter must have a unique identifier.');
    ids.add(source.id);
    if (!source.label.trim()) throw new RangeError('Every transmitter must have a label.');
    if (source.powerBasis !== 'EIRP' && source.powerBasis !== 'ERP') throw new RangeError('Power basis must be EIRP or ERP.');
    if (!Number.isFinite(source.maximumRadiatedPowerWatts) || source.maximumRadiatedPowerWatts <= 0 || source.maximumRadiatedPowerWatts > 1_000_000) throw new RangeError('Radiated power must be positive.');
    if (!Number.isFinite(source.maximumTransmitSecondsInSixMinutes) || source.maximumTransmitSecondsInSixMinutes <= 0 || source.maximumTransmitSecondsInSixMinutes > 360) throw new RangeError('Transmission time must be greater than zero and no more than 360 seconds.');
    if (!Number.isFinite(source.frequencyMHz) || source.frequencyMHz < 1 || source.frequencyMHz > 300_000) throw new RangeError('Frequency must be from 1 to 300,000 MHz.');
    if (!Number.isFinite(source.antennaLargestDimensionMetres) || source.antennaLargestDimensionMetres < 0.001) throw new RangeError('Antenna dimension must be positive.');
    totalEirpWatts += source.powerBasis === 'ERP' ? source.maximumRadiatedPowerWatts * 1.64 : source.maximumRadiatedPowerWatts;
    uncappedCombinedTransmitSeconds += source.maximumTransmitSecondsInSixMinutes;
  }

  const combinedTransmitSeconds = Math.min(360, uncappedCombinedTransmitSeconds);
  const frequencies = [...new Set(input.sources.map((source) => source.frequencyMHz))].sort((a, b) => a - b);
  const evaluations = frequencies.map((frequencyMHz): OfcomFrequencyEvaluation => {
    const atFrequency = input.sources.filter((source) => source.frequencyMHz === frequencyMHz);
    const antennaLargestDimensionMetres = Math.max(...atFrequency.map((source) => source.antennaLargestDimensionMetres));
    return {
      frequencyMHz,
      sourceIdsAtFrequency: atFrequency.map((source) => source.id),
      result: calculateOfcomComplianceDistance({
        maximumRadiatedPowerWatts: totalEirpWatts,
        powerBasis: 'EIRP',
        maximumTransmitSecondsInSixMinutes: combinedTransmitSeconds,
        frequencyMHz,
        antennaLargestDimensionMetres,
        highReflectionSurface: input.highReflectionSurface
      })
    };
  });
  const governing = evaluations.reduce((largest, evaluation) => evaluation.result.complianceDistanceMetres > largest.result.complianceDistanceMetres ? evaluation : largest);
  const limitations = [...new Set(evaluations.flatMap((evaluation) => evaluation.result.limitations))];
  const everyLowPower = evaluations.every((evaluation) => evaluation.result.status === 'no-further-assessment-required');
  return {
    status: everyLowPower ? 'no-further-assessment-required' : limitations.length ? 'method-limitation' : 'compliance-distance-calculated',
    totalEirpWatts,
    uncappedCombinedTransmitSeconds,
    combinedTransmitSeconds,
    transmissionTimeCapped: uncappedCombinedTransmitSeconds > 360,
    evaluations,
    governingFrequencyMHz: governing.frequencyMHz,
    complianceDistanceMetres: governing.result.complianceDistanceMetres,
    limitations
  };
}
