/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface LogPeriodicInput {
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  tau: number;
  sigma: number;
  activeRegionBandwidthFactor: number;
  elementCutAllowancePercent: number;
  elementConductorDiameterMillimetres: number;
  elementLengthToleranceMillimetres: number;
  boomPositionToleranceMillimetres: number;
  boomConductorSpacingMillimetres: number;
}

export const LOG_PERIODIC_MODEL = {
  id: 'carrel-log-periodic-geometry',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'Carrel — The Design of Log-Periodic Dipole Antennas',
      url: 'https://hamwaves.com/lpda/doc/carrel.1961.pdf'
    },
    {
      title: 'NASA — Large Orbiting Radio Telescope study',
      url: 'https://ntrs.nasa.gov/api/citations/19710001796/downloads/19710001796.pdf'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculateLogPeriodic(input: LogPeriodicInput) {
  finiteRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower frequency');
  finiteRange(input.upperFrequencyMHz, 0.001, 300_000, 'Upper frequency');
  if (input.upperFrequencyMHz <= input.lowerFrequencyMHz) throw new RangeError('Upper frequency must be greater than lower frequency.');
  finiteRange(input.tau, 0.5, 0.99, 'Tau');
  finiteRange(input.sigma, 0.01, 0.5, 'Sigma');
  finiteRange(input.activeRegionBandwidthFactor, 1, 5, 'Active-region bandwidth factor');
  finiteRange(input.elementCutAllowancePercent, 0, 25, 'Element cut allowance');
  finiteRange(input.elementConductorDiameterMillimetres, 0.01, 1000, 'Element conductor diameter');
  finiteRange(input.elementLengthToleranceMillimetres, 0, 1000, 'Element length tolerance');
  finiteRange(input.boomPositionToleranceMillimetres, 0, 1000, 'Boom position tolerance');
  finiteRange(input.boomConductorSpacingMillimetres, 0.01, 5000, 'Boom conductor spacing');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowerFrequencyMHz * 1_000_000);
  const operatingBandwidthRatio = input.upperFrequencyMHz / input.lowerFrequencyMHz;
  const requestedStructureBandwidthRatio = operatingBandwidthRatio * input.activeRegionBandwidthFactor;
  const calculatedElementCount = Math.ceil(1 + Math.log(requestedStructureBandwidthRatio) / Math.log(1 / input.tau));
  const elementCount = Math.max(2, calculatedElementCount);
  if (elementCount > 96) throw new RangeError('This geometry requires more than 96 elements; reduce tau or the requested bandwidth.');

  const longestElementMetres = wavelengthMetres / 2;
  const elementConductorDiameterMetres = input.elementConductorDiameterMillimetres / 1000;
  const elementLengthToleranceMetres = input.elementLengthToleranceMillimetres / 1000;
  const boomPositionToleranceMetres = input.boomPositionToleranceMillimetres / 1000;
  const boomConductorSpacingMetres = input.boomConductorSpacingMillimetres / 1000;
  const allowanceMultiplier = 1 + input.elementCutAllowancePercent / 100;
  let boomPositionMetres = 0;
  let totalElementConductorMetres = 0;
  const elements = Array.from({ length: elementCount }, (_, index) => {
    const designLengthMetres = longestElementMetres * input.tau ** index;
    const cutLengthMetres = designLengthMetres * allowanceMultiplier;
    const spacingToNextMetres = index < elementCount - 1 ? 2 * input.sigma * designLengthMetres : 0;
    const element = {
      number: index + 1,
      designLengthMetres,
      cutLengthMetres,
      halfElementMetres: cutLengthMetres / 2,
      spacingToNextMetres,
      boomPositionMetres,
      halfWaveFrequencyMHz: SPEED_OF_LIGHT_METRES_PER_SECOND / (2 * designLengthMetres * 1_000_000),
      connection: index % 2 === 0 ? 'A-left / B-right' : 'B-left / A-right'
    } as const;
    totalElementConductorMetres += cutLengthMetres;
    boomPositionMetres += spacingToNextMetres;
    return element;
  });

  const shortestElementMetres = elements.at(-1)!.designLengthMetres;
  const minimumElementSpacingMetres = Math.min(...elements.slice(0, -1).map((element) => element.spacingToNextMetres));
  const actualStructureBandwidthRatio = longestElementMetres / shortestElementMetres;
  const shortestElementHalfWaveFrequencyMHz = elements.at(-1)!.halfWaveFrequencyMHz;
  const apexHalfAngleDegrees = Math.atan((1 - input.tau) / (4 * input.sigma)) * 180 / Math.PI;
  const warnings: string[] = [];
  if (input.sigma < 0.05) warnings.push('Carrel reports rapidly falling directivity and frequency-varying input impedance below σ = 0.05.');
  if (input.activeRegionBandwidthFactor === 1) warnings.push('No structural bandwidth reserve is included for the finite active region.');
  if (elementCount < 4) warnings.push('This produces fewer than four elements; extend the structure or model the truncation carefully.');
  if (input.elementCutAllowancePercent === 0) warnings.push('No element trimming or connection allowance is included.');
  if (elementLengthToleranceMetres >= shortestElementMetres / 2) warnings.push('The element-length tolerance equals or exceeds one half of the shortest element; use a smaller inspection tolerance.');
  if (boomPositionToleranceMetres * 2 >= minimumElementSpacingMetres) warnings.push('Adjacent boom-position tolerance zones overlap at the smallest centre spacing; use a smaller position tolerance.');
  if (boomConductorSpacingMetres <= elementConductorDiameterMetres) warnings.push('Boom-conductor centre spacing must exceed the entered element conductor diameter for this physical layout.');

  return {
    ...input,
    wavelengthMetres,
    operatingBandwidthRatio,
    requestedStructureBandwidthRatio,
    actualStructureBandwidthRatio,
    elementCount,
    apexHalfAngleDegrees,
    apexIncludedAngleDegrees: apexHalfAngleDegrees * 2,
    longestElementMetres,
    shortestElementMetres,
    shortestElementHalfWaveFrequencyMHz,
    elementConductorDiameterMetres,
    elementConductorDiameterWavelengthsAtUpperEdge: elementConductorDiameterMetres / (SPEED_OF_LIGHT_METRES_PER_SECOND / (input.upperFrequencyMHz * 1_000_000)),
    elementLengthToleranceMetres,
    longestElementLengthTolerancePercent: elementLengthToleranceMetres / longestElementMetres * 100,
    shortestElementLengthTolerancePercent: elementLengthToleranceMetres / shortestElementMetres * 100,
    boomPositionToleranceMetres,
    minimumElementSpacingMetres,
    boomPositionTolerancePercentOfMinimumSpacing: boomPositionToleranceMetres / minimumElementSpacingMetres * 100,
    boomConductorSpacingMetres,
    boomSpacingToElementDiameterRatio: boomConductorSpacingMetres / elementConductorDiameterMetres,
    upperFrequencyStructuralMargin: shortestElementHalfWaveFrequencyMHz / input.upperFrequencyMHz,
    boomSpanMetres: boomPositionMetres,
    maximumTerminationExtensionMetres: wavelengthMetres / 8,
    totalElementConductorMetres,
    elements,
    warnings
  };
}
