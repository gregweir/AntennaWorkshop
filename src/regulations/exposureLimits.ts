/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type ExposureEnvironment = 'uncontrolled' | 'controlled';
export type ExposureJurisdiction = 'CA' | 'US';

export interface ExposureReferenceLevel {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  frequencyMHz: number;
  powerDensityWattsPerSquareMetre: number;
  averagingMinutes: number;
  quantity: 'power-density-reference-level';
  sourceRevision: string;
  reviewedOn: string;
}

export const EXPOSURE_LIMIT_MODELS = {
  US: {
    id: 'fcc-47-cfr-1.1310-table-1-mpe',
    version: '1.0.0',
    sourceRevision: 'eCFR Title 47 § 1.1310, current through 2026-11-09',
    reviewedOn: '2026-11-11',
    applicabilityMHz: [0.3, 100_000] as const,
    source: {
      title: '47 CFR § 1.1310(e)(1) — Limits for Maximum Permissible Exposure',
      url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-1/subpart-I/section-1.1310'
    }
  },
  CA: {
    id: 'health-canada-safety-code-6-tables-5-6-power-density',
    version: '1.0.0',
    sourceRevision: 'Safety Code 6 (2015), Tables 5 and 6',
    reviewedOn: '2026-11-11',
    applicabilityMHz: [10, 300_000] as const,
    source: {
      title: 'Health Canada Safety Code 6 — power-density reference levels',
      url: 'https://www.canada.ca/en/health-canada/services/publications/health-risks-safety/limits-human-exposure-radiofrequency-electromagnetic-energy-range-3-300.html'
    }
  }
} as const;

function validateFrequency(frequencyMHz: number) {
  if (!Number.isFinite(frequencyMHz) || frequencyMHz <= 0) throw new RangeError('Frequency must be greater than zero.');
}

export function getUsMpeReferenceLevel(frequencyMHz: number, environment: ExposureEnvironment): ExposureReferenceLevel {
  validateFrequency(frequencyMHz);
  if (frequencyMHz < 0.3 || frequencyMHz > 100_000) throw new RangeError('FCC MPE table applicability is 0.3 to 100,000 MHz.');
  let milliwattsPerSquareCentimetre: number;
  if (environment === 'controlled') {
    if (frequencyMHz <= 3) milliwattsPerSquareCentimetre = 100;
    else if (frequencyMHz <= 30) milliwattsPerSquareCentimetre = 900 / frequencyMHz ** 2;
    else if (frequencyMHz <= 300) milliwattsPerSquareCentimetre = 1;
    else if (frequencyMHz <= 1500) milliwattsPerSquareCentimetre = frequencyMHz / 300;
    else milliwattsPerSquareCentimetre = 5;
  } else if (environment === 'uncontrolled') {
    if (frequencyMHz <= 1.34) milliwattsPerSquareCentimetre = 100;
    else if (frequencyMHz <= 30) milliwattsPerSquareCentimetre = 180 / frequencyMHz ** 2;
    else if (frequencyMHz <= 300) milliwattsPerSquareCentimetre = 0.2;
    else if (frequencyMHz <= 1500) milliwattsPerSquareCentimetre = frequencyMHz / 1500;
    else milliwattsPerSquareCentimetre = 1;
  } else throw new RangeError('Exposure environment must be controlled or uncontrolled.');
  return {
    jurisdiction: 'US', environment, frequencyMHz,
    powerDensityWattsPerSquareMetre: milliwattsPerSquareCentimetre * 10,
    averagingMinutes: environment === 'controlled' ? 6 : 30,
    quantity: 'power-density-reference-level',
    sourceRevision: EXPOSURE_LIMIT_MODELS.US.sourceRevision,
    reviewedOn: EXPOSURE_LIMIT_MODELS.US.reviewedOn
  };
}

export function getCanadianReferenceLevel(frequencyMHz: number, environment: ExposureEnvironment): ExposureReferenceLevel {
  validateFrequency(frequencyMHz);
  if (frequencyMHz < 10 || frequencyMHz > 300_000) throw new RangeError('Safety Code 6 power-density applicability is 10 to 300,000 MHz.');
  let powerDensityWattsPerSquareMetre: number;
  if (environment === 'uncontrolled') {
    if (frequencyMHz <= 20) powerDensityWattsPerSquareMetre = 2;
    else if (frequencyMHz <= 48) powerDensityWattsPerSquareMetre = 8.944 / Math.sqrt(frequencyMHz);
    else if (frequencyMHz <= 300) powerDensityWattsPerSquareMetre = 1.291;
    else if (frequencyMHz <= 6000) powerDensityWattsPerSquareMetre = 0.02619 * frequencyMHz ** 0.6834;
    else if (frequencyMHz <= 150_000) powerDensityWattsPerSquareMetre = 10;
    else powerDensityWattsPerSquareMetre = 6.67e-5 * frequencyMHz;
  } else if (environment === 'controlled') {
    if (frequencyMHz <= 20) powerDensityWattsPerSquareMetre = 10;
    else if (frequencyMHz <= 48) powerDensityWattsPerSquareMetre = 44.72 / Math.sqrt(frequencyMHz);
    else if (frequencyMHz <= 100) powerDensityWattsPerSquareMetre = 6.455;
    else if (frequencyMHz <= 6000) powerDensityWattsPerSquareMetre = 0.6455 * Math.sqrt(frequencyMHz);
    else if (frequencyMHz <= 150_000) powerDensityWattsPerSquareMetre = 50;
    else powerDensityWattsPerSquareMetre = 3.33e-4 * frequencyMHz;
  } else throw new RangeError('Exposure environment must be controlled or uncontrolled.');
  return {
    jurisdiction: 'CA', environment, frequencyMHz, powerDensityWattsPerSquareMetre,
    averagingMinutes: frequencyMHz <= 15_000 ? 6 : 616_000 / frequencyMHz ** 1.2,
    quantity: 'power-density-reference-level',
    sourceRevision: EXPOSURE_LIMIT_MODELS.CA.sourceRevision,
    reviewedOn: EXPOSURE_LIMIT_MODELS.CA.reviewedOn
  };
}

export function getExposureReferenceLevel(jurisdiction: ExposureJurisdiction, frequencyMHz: number, environment: ExposureEnvironment) {
  return jurisdiction === 'CA' ? getCanadianReferenceLevel(frequencyMHz, environment) : getUsMpeReferenceLevel(frequencyMHz, environment);
}
