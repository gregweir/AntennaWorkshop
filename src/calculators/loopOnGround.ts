/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface LoopOnGroundInput {
  frequencyMHz: number;
  sideLengthMetres: number;
  receiveAxisBearingDegrees: number;
  antennaWindingTurns: number;
  coaxWindingTurns: number;
  feedlineImpedanceOhms: number;
  wireCutAllowancePercent: number;
}

export const LOOP_ON_GROUND_MODEL = {
  id: 'loop-on-ground-receive-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'Roberts — The Loop on Ground Antenna',
      url: 'https://www.kk5jy.net/LoG/'
    },
    {
      title: 'Roberts — Beverage transformer construction and isolation notes',
      url: 'https://www.kk5jy.net/beverage/'
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

export function calculateLoopOnGround(input: LoopOnGroundInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.sideLengthMetres, 0.1, 1_000, 'Side length');
  if (!Number.isFinite(input.receiveAxisBearingDegrees) || input.receiveAxisBearingDegrees < 0 || input.receiveAxisBearingDegrees >= 360) {
    throw new RangeError('Receive-axis bearing must be at least 0 and less than 360.');
  }
  if (!Number.isInteger(input.antennaWindingTurns)) throw new RangeError('Antenna winding turns must be a whole number.');
  if (!Number.isInteger(input.coaxWindingTurns)) throw new RangeError('Coax winding turns must be a whole number.');
  finiteRange(input.antennaWindingTurns, 1, 100, 'Antenna winding turns');
  finiteRange(input.coaxWindingTurns, 1, 100, 'Coax winding turns');
  finiteRange(input.feedlineImpedanceOhms, 1, 1_000, 'Feedline impedance');
  finiteRange(input.wireCutAllowancePercent, 0, 25, 'Wire cut allowance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const designPerimeterMetres = input.sideLengthMetres * 4;
  const cutWireLengthMetres = designPerimeterMetres * (1 + input.wireCutAllowancePercent / 100);
  const diagonalMetres = input.sideLengthMetres * Math.SQRT2;
  const enclosedAreaSquareMetres = input.sideLengthMetres ** 2;
  const reverseReceiveBearingDegrees = (input.receiveAxisBearingDegrees + 180) % 360;
  const feedpointBearingDegrees = (input.receiveAxisBearingDegrees + 270) % 360;
  const oppositeCornerBearingDegrees = (feedpointBearingDegrees + 180) % 360;
  const transformerTurnsRatio = input.antennaWindingTurns / input.coaxWindingTurns;
  const transformerImpedanceRatio = transformerTurnsRatio ** 2;
  const nominalReferredAntennaImpedanceOhms = input.feedlineImpedanceOhms * transformerImpedanceRatio;
  const circumferenceWavelengths = designPerimeterMetres / wavelengthMetres;
  const warnings: string[] = [];

  if (circumferenceWavelengths >= 1) warnings.push('The loop circumference is at least one wavelength at the reference frequency; the source warns that pattern symmetry can deteriorate as circumference approaches one wavelength.');
  if (input.wireCutAllowancePercent === 0) warnings.push('No allowance is included for the feed enclosure, corner anchoring, routing, or trimming.');
  if (input.antennaWindingTurns === input.coaxWindingTurns) warnings.push('A 1:1 turns ratio does not reproduce the source 5:2 receive-transformer starting point.');

  return {
    ...input,
    wavelengthMetres,
    designPerimeterMetres,
    cutWireLengthMetres,
    diagonalMetres,
    enclosedAreaSquareMetres,
    circumferenceWavelengths,
    reverseReceiveBearingDegrees,
    receiveCompassPoint: compassPoint(input.receiveAxisBearingDegrees),
    reverseReceiveCompassPoint: compassPoint(reverseReceiveBearingDegrees),
    feedpointBearingDegrees,
    feedpointCompassPoint: compassPoint(feedpointBearingDegrees),
    oppositeCornerBearingDegrees,
    oppositeCornerCompassPoint: compassPoint(oppositeCornerBearingDegrees),
    transformerTurnsRatio,
    transformerImpedanceRatio,
    nominalReferredAntennaImpedanceOhms,
    directionDescription: `Bidirectional low-angle axis at ${input.receiveAxisBearingDegrees.toFixed(0)}° ${compassPoint(input.receiveAxisBearingDegrees)} and ${reverseReceiveBearingDegrees.toFixed(0)}° ${compassPoint(reverseReceiveBearingDegrees)}; feedpoint corner at ${feedpointBearingDegrees.toFixed(0)}° ${compassPoint(feedpointBearingDegrees)}`,
    warnings
  };
}
