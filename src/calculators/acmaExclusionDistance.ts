/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AcmaGainBasis = 'dBi' | 'dBd';
export type AcmaExclusionStatus = 'far-field-result-available' | 'far-field-method-inapplicable';

export interface AcmaExclusionDistanceInput {
  frequencyMHz: number;
  transmitterOutputPowerWatts: number;
  antennaGain: number;
  gainBasis: AcmaGainBasis;
  antennaLargestDimensionMetres: number;
}

export interface AcmaExclusionDistanceResult {
  status: AcmaExclusionStatus;
  referenceLevelWattsPerSquareMetre: number;
  antennaGainDbi: number;
  antennaGainLinear: number;
  exclusionDistanceMetres: number;
  wavelengthMetres: number;
  farFieldBoundaryMetres: number;
  exclusionDistanceIsFarField: boolean;
}

export const ACMA_EXCLUSION_DISTANCE_MODEL = {
  id: 'acma-simple-rf-exclusion-distance-arpansa-2021',
  version: '1.0.0',
  sourceRevision: 'ACMA Simple RF exclusion distance calculator for antenna (ARPANSA 2021)',
  reviewedOn: '2026-11-13',
  source: {
    title: 'ACMA rules for EME and official calculator',
    url: 'https://www.acma.gov.au/our-rules-eme'
  },
  workbook: {
    title: 'Simple RF exclusion distance calculator for antenna (ARPANSA 2021)',
    url: 'https://www.acma.gov.au/sites/default/files/2021-11/Simple%20RF%20exclusion%20distance%20calculator%20for%20antenna%20%28ARPANSA%202021%29.xlsx'
  },
  licence: {
    title: 'Radiocommunications (Amateur Stations) Class Licence 2023',
    url: 'https://www.legislation.gov.au/F2023L01648/latest/text'
  }
} as const;

function requireFinite(value: number, label: string, minimumExclusive: number, maximumInclusive: number) {
  if (!Number.isFinite(value) || value <= minimumExclusive || value > maximumInclusive) {
    throw new RangeError(`${label} must be greater than ${minimumExclusive} and no more than ${maximumInclusive}.`);
  }
}

export function getAcmaPublicPowerDensityLimit(frequencyMHz: number): number {
  requireFinite(frequencyMHz, 'Frequency', 30, 300_000);
  if (frequencyMHz <= 400) return 2;
  if (frequencyMHz <= 2_000) return frequencyMHz / 200;
  return 10;
}

export function calculateAcmaExclusionDistance(input: AcmaExclusionDistanceInput): AcmaExclusionDistanceResult {
  requireFinite(input.frequencyMHz, 'Frequency', 30, 300_000);
  requireFinite(input.transmitterOutputPowerWatts, 'Transmitter output power', 0, 1_000_000);
  requireFinite(input.antennaLargestDimensionMetres, 'Largest antenna dimension', 0, 100_000);
  if (!Number.isFinite(input.antennaGain) || input.antennaGain < -100 || input.antennaGain > 100) {
    throw new RangeError('Antenna gain must be between -100 and 100 dB.');
  }
  if (input.gainBasis !== 'dBi' && input.gainBasis !== 'dBd') throw new RangeError('Gain basis must be dBi or dBd.');

  const referenceLevelWattsPerSquareMetre = getAcmaPublicPowerDensityLimit(input.frequencyMHz);
  const antennaGainDbi = input.gainBasis === 'dBd' ? input.antennaGain + 2.15 : input.antennaGain;
  const antennaGainLinear = 10 ** (antennaGainDbi / 10);
  // The official workbook uses 3.14 explicitly rather than a higher-precision value of pi.
  const exclusionDistanceMetres = Math.sqrt(
    input.transmitterOutputPowerWatts * antennaGainLinear / (4 * 3.14 * referenceLevelWattsPerSquareMetre)
  );
  const wavelengthMetres = 299_792_458 / (input.frequencyMHz * 1_000_000);
  const farFieldBoundaryMetres = Math.max(
    2 * input.antennaLargestDimensionMetres ** 2 / wavelengthMetres,
    0.5 * wavelengthMetres
  );
  const exclusionDistanceIsFarField = exclusionDistanceMetres >= farFieldBoundaryMetres;

  return {
    status: exclusionDistanceIsFarField ? 'far-field-result-available' : 'far-field-method-inapplicable',
    referenceLevelWattsPerSquareMetre,
    antennaGainDbi,
    antennaGainLinear,
    exclusionDistanceMetres,
    wavelengthMetres,
    farFieldBoundaryMetres,
    exclusionDistanceIsFarField
  };
}
