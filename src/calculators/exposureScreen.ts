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

export type ExposureScreenStatus =
  | 'below-screening-trigger'
  | 'further-analysis-required'
  | 'screening-inconclusive'
  | 'method-inapplicable';

export interface ExposureScreenInput {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  frequencyMHz: number;
  transmitterPowerWatts: number;
  dutyCyclePercent: number;
  feedSystemLossDb: number;
  antennaGainDbi: number;
  antennaLargestDimensionMetres: number;
  separationDistanceMetres: number;
  nearbySourcesAssessed: boolean;
}

export interface ExposureScreenResult {
  status: ExposureScreenStatus;
  wavelengthMetres: number;
  tn261BoundaryMetres: number;
  farFieldBoundaryMetres: number;
  averageTransmitterPowerWatts: number;
  averagePowerAtAntennaWatts: number;
  averageEirpWatts: number;
  reflectionMultiplier: number;
  estimatedPowerDensityWattsPerSquareMetre: number;
  referenceLevelWattsPerSquareMetre: number;
  fractionOfReferenceLevel: number;
  screeningTriggerFraction: number;
  distanceToReferenceLevelMetres: number;
  distanceToScreeningTriggerMetres: number;
  limitations: string[];
}

export const EXPOSURE_SCREEN_MODEL = {
  id: 'conservative-single-source-far-field-screen',
  version: '1.1.0',
  reviewedOn: '2026-11-14',
  reflectionMultiplier: 2.56,
  sources: [
    {
      title: 'ISED TN-261 — modified free-space power-density method',
      url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/tn-261-safety-code-6-sc6-radio-frequency-exposure-compliance-evaluation-template-uncontrolled'
    },
    {
      title: 'FCC OET Bulletin 65 — evaluating compliance with RF exposure guidelines',
      url: 'https://www.fcc.gov/sites/default/files/oet65.pdf'
    }
  ]
} as const;

function requireFinite(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculateExposureScreen(input: ExposureScreenInput): ExposureScreenResult {
  requireFinite(input.frequencyMHz, 'Frequency', 0.001, 300_000);
  requireFinite(input.transmitterPowerWatts, 'Transmitter power', 0.001, 1_000_000);
  requireFinite(input.dutyCyclePercent, 'Duty cycle', 0.01, 100);
  requireFinite(input.feedSystemLossDb, 'Feed-system loss', 0, 100);
  requireFinite(input.antennaGainDbi, 'Antenna gain', -100, 100);
  requireFinite(input.antennaLargestDimensionMetres, 'Largest antenna dimension', 0.001, 100_000);
  requireFinite(input.separationDistanceMetres, 'Separation distance', 0.001, 1_000_000);

  const reference = getExposureReferenceLevel(input.jurisdiction, input.frequencyMHz, input.environment);
  const wavelengthMetres = 299_792_458 / (input.frequencyMHz * 1_000_000);
  const electricallySmall = input.antennaLargestDimensionMetres <= wavelengthMetres;
  const tn261BoundaryMetres = electricallySmall
    ? wavelengthMetres / (2 * Math.PI)
    : 0.5 * input.antennaLargestDimensionMetres ** 2 / wavelengthMetres;
  const farFieldBoundaryMetres = electricallySmall
    ? tn261BoundaryMetres
    : 2 * input.antennaLargestDimensionMetres ** 2 / wavelengthMetres;
  const averageTransmitterPowerWatts = input.transmitterPowerWatts * input.dutyCyclePercent / 100;
  const averagePowerAtAntennaWatts = averageTransmitterPowerWatts * 10 ** (-input.feedSystemLossDb / 10);
  const averageEirpWatts = averagePowerAtAntennaWatts * 10 ** (input.antennaGainDbi / 10);
  const reflectionMultiplier = EXPOSURE_SCREEN_MODEL.reflectionMultiplier;
  const estimatedPowerDensityWattsPerSquareMetre = reflectionMultiplier * averageEirpWatts
    / (4 * Math.PI * input.separationDistanceMetres ** 2);
  const referenceLevelWattsPerSquareMetre = reference.powerDensityWattsPerSquareMetre;
  const fractionOfReferenceLevel = estimatedPowerDensityWattsPerSquareMetre / referenceLevelWattsPerSquareMetre;
  const screeningTriggerFraction = input.jurisdiction === 'CA' && input.environment === 'uncontrolled' ? 0.5 : 1;
  const distanceToReferenceLevelMetres = Math.sqrt(
    reflectionMultiplier * averageEirpWatts / (4 * Math.PI * referenceLevelWattsPerSquareMetre)
  );
  const distanceToScreeningTriggerMetres = distanceToReferenceLevelMetres / Math.sqrt(screeningTriggerFraction);
  const limitations = [
    'Uses maximum stated antenna gain in the direction of the person; no antenna pattern is modelled.',
    'Uses the ISED TN-261 2.56 power-density multiplier for a reflected electric field 60% of the direct field. TN-261 applies this assumption to calculations at 2 m above ground or rooftop level.',
    electricallySmall
      ? 'Uses the TN-261 λ/(2π) boundary for an electrically small antenna.'
      : 'Uses 2D²/λ as a stricter application guard for an electrically large antenna; TN-261 Table 1 uses 0.5D²/λ for its simplified transition/far-field boundary.',
    'Duty cycle must represent the applicable regulatory averaging period.',
    'Does not model reactive or radiating near fields, body coupling, terrain, buildings, or measurements.'
  ];
  if (input.jurisdiction === 'US') {
    limitations.push('The 2.56 reflected-field multiplier is an ISED screening assumption, not an FCC-prescribed multiplier. FCC evaluation must use an applicable supported method.');
  } else if (input.environment === 'controlled') {
    limitations.push('TN-261 is an uncontrolled-environment template. Pairing its propagation assumption with controlled reference levels is a preliminary comparison, not the TN-261 procedure.');
  }

  let status: ExposureScreenStatus;
  if (input.separationDistanceMetres < farFieldBoundaryMetres) {
    status = 'method-inapplicable';
  } else if (!input.nearbySourcesAssessed) {
    status = 'screening-inconclusive';
  } else if (fractionOfReferenceLevel >= screeningTriggerFraction) {
    status = 'further-analysis-required';
  } else {
    status = 'below-screening-trigger';
  }

  return {
    status,
    wavelengthMetres,
    tn261BoundaryMetres,
    farFieldBoundaryMetres,
    averageTransmitterPowerWatts,
    averagePowerAtAntennaWatts,
    averageEirpWatts,
    reflectionMultiplier,
    estimatedPowerDensityWattsPerSquareMetre,
    referenceLevelWattsPerSquareMetre,
    fractionOfReferenceLevel,
    screeningTriggerFraction,
    distanceToReferenceLevelMetres,
    distanceToScreeningTriggerMetres,
    limitations
  };
}
