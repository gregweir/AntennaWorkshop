/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type BeverageReceptionMode = 'terminated' | 'unterminated';

export interface BeverageInput {
  frequencyMHz: number;
  wireLengthWavelengths: number;
  wireHeightMetres: number;
  targetBearingDegrees: number;
  receptionMode: BeverageReceptionMode;
  terminationResistanceOhms: number;
  assumedAntennaImpedanceOhms: number;
  feedlineImpedanceOhms: number;
  wireCutAllowancePercent: number;
}

export const BEVERAGE_MODEL = {
  id: 'beverage-wave-antenna-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'Beverage — Radio Receiving System, US Patent 1,487,308',
      url: 'https://patents.google.com/patent/US1487308'
    },
    {
      title: 'Beverage, Rice, and Kellogg — The Wave Antenna',
      url: 'https://doi.org/10.1109/T-AIEE.1923.5060870'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function compassPoint(bearingDegrees: number) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round(bearingDegrees / 22.5) % points.length];
}

export function calculateBeverage(input: BeverageInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.wireLengthWavelengths, 0.25, 5, 'Wire length');
  finiteRange(input.wireHeightMetres, 0.1, 30, 'Wire height');
  if (!Number.isFinite(input.targetBearingDegrees) || input.targetBearingDegrees < 0 || input.targetBearingDegrees >= 360) {
    throw new RangeError('Target bearing must be at least 0 and less than 360.');
  }
  if (input.receptionMode !== 'terminated' && input.receptionMode !== 'unterminated') throw new RangeError('Reception mode is invalid.');
  finiteRange(input.terminationResistanceOhms, 1, 10_000, 'Termination resistance');
  finiteRange(input.assumedAntennaImpedanceOhms, 1, 10_000, 'Assumed antenna impedance');
  finiteRange(input.feedlineImpedanceOhms, 1, 1_000, 'Feedline impedance');
  finiteRange(input.wireCutAllowancePercent, 0, 25, 'Wire cut allowance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const designWireLengthMetres = wavelengthMetres * input.wireLengthWavelengths;
  const cutWireLengthMetres = designWireLengthMetres * (1 + input.wireCutAllowancePercent / 100);
  const bearingRadians = input.targetBearingDegrees * Math.PI / 180;
  const eastOffsetMetres = designWireLengthMetres * Math.sin(bearingRadians);
  const northOffsetMetres = designWireLengthMetres * Math.cos(bearingRadians);
  const reverseBearingDegrees = (input.targetBearingDegrees + 180) % 360;
  const impedanceTransformationRatio = input.assumedAntennaImpedanceOhms / input.feedlineImpedanceOhms;
  const transformerTurnsRatio = Math.sqrt(impedanceTransformationRatio);
  const terminationDifferencePercent = Math.abs(input.terminationResistanceOhms - input.assumedAntennaImpedanceOhms) / input.assumedAntennaImpedanceOhms * 100;
  const warnings: string[] = [];

  if (input.wireLengthWavelengths < 0.5) warnings.push('The original wave-antenna work describes lengths of about one-half wavelength or more; model this shorter wire carefully.');
  if (input.wireHeightMetres / wavelengthMetres > 0.05) warnings.push('The wire is relatively high at the reference frequency; height, ground, and vertical end sections require complete modelling.');
  if (input.receptionMode === 'terminated' && terminationDifferencePercent > 25) warnings.push('The entered termination differs by more than 25% from the assumed antenna impedance; measure and adjust the complete ground-return system.');
  if (input.receptionMode === 'unterminated') warnings.push('An open far end permits reflections; a bidirectional tendency is not a predicted pattern or match.');
  if (input.wireCutAllowancePercent === 0) warnings.push('No wire routing, connection, or sag allowance is included.');

  return {
    ...input,
    wavelengthMetres,
    designWireLengthMetres,
    cutWireLengthMetres,
    wireHeightWavelengths: input.wireHeightMetres / wavelengthMetres,
    electricalLengthDegrees: input.wireLengthWavelengths * 360,
    eastOffsetMetres,
    northOffsetMetres,
    targetCompassPoint: compassPoint(input.targetBearingDegrees),
    reverseBearingDegrees,
    reverseCompassPoint: compassPoint(reverseBearingDegrees),
    impedanceTransformationRatio,
    transformerTurnsRatio,
    terminationDifferencePercent,
    primaryResponseDescription: input.receptionMode === 'terminated'
      ? `Toward the terminated end at ${input.targetBearingDegrees.toFixed(0)}° ${compassPoint(input.targetBearingDegrees)}`
      : `Along both wire-axis directions: ${input.targetBearingDegrees.toFixed(0)}° ${compassPoint(input.targetBearingDegrees)} and ${reverseBearingDegrees.toFixed(0)}° ${compassPoint(reverseBearingDegrees)}`,
    warnings
  };
}
