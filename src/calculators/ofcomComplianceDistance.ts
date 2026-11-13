/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { OfcomPowerBasis } from './ofcomAssessment';

export type OfcomDistanceStatus = 'no-further-assessment-required' | 'compliance-distance-calculated' | 'method-limitation';

export interface OfcomComplianceDistanceInput {
  maximumRadiatedPowerWatts: number;
  powerBasis: OfcomPowerBasis;
  maximumTransmitSecondsInSixMinutes: number;
  frequencyMHz: number;
  antennaLargestDimensionMetres: number;
  highReflectionSurface: boolean;
}

export interface OfcomComplianceDistanceResult {
  status: OfcomDistanceStatus;
  eirpWatts: number;
  averageEirpWatts: number;
  dutyCyclePercent: number;
  complianceDistanceMetres: number;
  wavelengthMetres: number;
  reactiveNearFieldBoundaryMetres: number;
  reflectionCoefficient: number;
  electricFieldReferenceVoltsPerMetre: number;
  magneticFieldReferenceAmpsPerMetre: number;
  powerDensityReferenceWattsPerSquareMetre: number | null;
  distanceFromElectricFieldMetres: number | null;
  distanceFromMagneticFieldMetres: number | null;
  electricallyShortAntenna: boolean;
  limitations: string[];
}

export const OFCOM_COMPLIANCE_DISTANCE_MODEL = {
  id: 'ofcom-emf-calculator-v1.1-compliance-distance',
  version: '1.0.0',
  sourceRevision: 'Ofcom EMF Calculator v1.1 and Guidance V1.1',
  reviewedOn: '2026-11-13',
  source: {
    title: 'Ofcom EMF Calculator v1.1',
    url: 'https://static.ofcom.org.uk/static/emf/index.html'
  },
  guidance: {
    title: 'Ofcom Guidance on EMF Compliance and Enforcement',
    url: 'https://www.ofcom.org.uk/spectrum/electromagnetic-fields/compliance-and-enforcement-guidance'
  }
} as const;

function finiteBetween(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
}

export function calculateOfcomComplianceDistance(input: OfcomComplianceDistanceInput): OfcomComplianceDistanceResult {
  if (input.powerBasis !== 'EIRP' && input.powerBasis !== 'ERP') throw new RangeError('Power basis must be EIRP or ERP.');
  finiteBetween(input.maximumRadiatedPowerWatts, 'Maximum radiated power', 0.000_001, 1_000_000);
  finiteBetween(input.maximumTransmitSecondsInSixMinutes, 'Maximum transmission time', 0, 360);
  finiteBetween(input.frequencyMHz, 'Frequency', 1, 300_000);
  finiteBetween(input.antennaLargestDimensionMetres, 'Largest antenna dimension', 0.001, 1_000_000);

  const eirpWatts = input.powerBasis === 'ERP' ? input.maximumRadiatedPowerWatts * 1.64 : input.maximumRadiatedPowerWatts;
  const dutyCyclePercent = input.maximumTransmitSecondsInSixMinutes / 3.6;
  const averageEirpWatts = eirpWatts * dutyCyclePercent / 100;
  const wavelengthMetres = 300 / input.frequencyMHz;
  const reflectionCoefficient = input.frequencyMHz <= 12 ? 1 : 0.6;
  const reactiveNearFieldBoundaryMetres = wavelengthMetres / (2 * Math.PI);

  let electricFieldReferenceVoltsPerMetre: number;
  let magneticFieldReferenceAmpsPerMetre: number;
  let powerDensityReferenceWattsPerSquareMetre: number | null;
  if (input.frequencyMHz < 10) {
    electricFieldReferenceVoltsPerMetre = 87 / Math.sqrt(input.frequencyMHz);
    magneticFieldReferenceAmpsPerMetre = 0.73 / input.frequencyMHz;
    powerDensityReferenceWattsPerSquareMetre = null;
  } else if (input.frequencyMHz <= 400) {
    electricFieldReferenceVoltsPerMetre = 28;
    magneticFieldReferenceAmpsPerMetre = 0.073;
    powerDensityReferenceWattsPerSquareMetre = 2;
  } else if (input.frequencyMHz <= 2000) {
    electricFieldReferenceVoltsPerMetre = 1.375 * Math.sqrt(input.frequencyMHz);
    magneticFieldReferenceAmpsPerMetre = 0.0037 * Math.sqrt(input.frequencyMHz);
    powerDensityReferenceWattsPerSquareMetre = input.frequencyMHz / 200;
  } else {
    electricFieldReferenceVoltsPerMetre = 61;
    magneticFieldReferenceAmpsPerMetre = 0.16;
    powerDensityReferenceWattsPerSquareMetre = 10;
  }

  const reflectionMultiplier = (1 + reflectionCoefficient) ** 2;
  const distanceFromElectricFieldMetres = powerDensityReferenceWattsPerSquareMetre === null
    ? Math.sqrt(377 * averageEirpWatts * reflectionMultiplier / (4 * Math.PI * electricFieldReferenceVoltsPerMetre ** 2))
    : null;
  const distanceFromMagneticFieldMetres = powerDensityReferenceWattsPerSquareMetre === null
    ? Math.sqrt(averageEirpWatts * reflectionMultiplier / (4 * Math.PI * 377 * magneticFieldReferenceAmpsPerMetre ** 2))
    : null;
  const complianceDistanceMetres = powerDensityReferenceWattsPerSquareMetre === null
    ? Math.max(distanceFromElectricFieldMetres!, distanceFromMagneticFieldMetres!)
    : Math.sqrt(averageEirpWatts * reflectionMultiplier / (4 * Math.PI * powerDensityReferenceWattsPerSquareMetre));
  const electricallyShortAntenna = input.antennaLargestDimensionMetres <= wavelengthMetres / 2;
  const limitations: string[] = [];
  if (!electricallyShortAntenna) limitations.push('The antenna’s largest dimension exceeds half a wavelength; Ofcom states that more advanced tools may be needed.');
  if (input.highReflectionSurface) limitations.push('A nearby highly reflective surface such as seawater or metal can make the standard reflection coefficient underestimate distance.');

  const lowPower = eirpWatts <= 100 && averageEirpWatts <= 10;
  return {
    status: lowPower ? 'no-further-assessment-required' : limitations.length ? 'method-limitation' : 'compliance-distance-calculated',
    eirpWatts, averageEirpWatts, dutyCyclePercent, complianceDistanceMetres, wavelengthMetres,
    reactiveNearFieldBoundaryMetres, reflectionCoefficient, electricFieldReferenceVoltsPerMetre,
    magneticFieldReferenceAmpsPerMetre, powerDensityReferenceWattsPerSquareMetre,
    distanceFromElectricFieldMetres, distanceFromMagneticFieldMetres, electricallyShortAntenna, limitations
  };
}
