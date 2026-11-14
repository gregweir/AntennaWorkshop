/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

const METRES_PER_FOOT = 0.3048;

export interface TwoElementCubicalQuadInput {
  frequencyMHz: number;
  elementSpacingWavelengths: number;
  trimAllowancePercent: number;
  forwardBearingDegrees: number;
  boomCentreHeightMetres: number;
  mastReference: QuadMastReference;
}

export type QuadMastReference = 'boom-midpoint' | 'driven-centre';

export const TWO_ELEMENT_CUBICAL_QUAD_MODEL = {
  id: 'arrl-two-element-cubical-quad',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — Radio Antennas and How They Operate',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
    },
    {
      title: 'QST, July 1991 — A Light and Sturdy Quad for 10 and 15 Meters',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/9107030.pdf'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function normalizedBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function compassPoint(bearing: number) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(normalizedBearing(bearing) / 45) % 8];
}

function pointOnBearing(distanceMetres: number, bearingDegrees: number) {
  const radians = bearingDegrees * Math.PI / 180;
  return { eastMetres: distanceMetres * Math.sin(radians), northMetres: distanceMetres * Math.cos(radians) };
}

function addPoints(first: { eastMetres: number; northMetres: number }, second: { eastMetres: number; northMetres: number }) {
  return { eastMetres: first.eastMetres + second.eastMetres, northMetres: first.northMetres + second.northMetres };
}

export function calculateTwoElementCubicalQuad(input: TwoElementCubicalQuadInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.elementSpacingWavelengths, 0.1, 0.25, 'Element spacing');
  finiteRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');
  finiteRange(input.forwardBearingDegrees, 0, 359.999_999, 'Forward bearing');
  finiteRange(input.boomCentreHeightMetres, 0.1, 10_000, 'Boom centre height');
  if (input.mastReference !== 'boom-midpoint' && input.mastReference !== 'driven-centre') throw new RangeError('Mast reference must be the boom midpoint or driven-element centre.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const drivenDesignPerimeterMetres = 1005 / input.frequencyMHz * METRES_PER_FOOT;
  const reflectorDesignPerimeterMetres = drivenDesignPerimeterMetres * 1.05;
  const trimMultiplier = 1 + input.trimAllowancePercent / 100;
  const drivenCutPerimeterMetres = drivenDesignPerimeterMetres * trimMultiplier;
  const reflectorCutPerimeterMetres = reflectorDesignPerimeterMetres * trimMultiplier;
  const drivenSideMetres = drivenDesignPerimeterMetres / 4;
  const reflectorSideMetres = reflectorDesignPerimeterMetres / 4;
  const drivenCutSideMetres = drivenCutPerimeterMetres / 4;
  const reflectorCutSideMetres = reflectorCutPerimeterMetres / 4;
  const drivenDiagonalMetres = drivenSideMetres * Math.SQRT2;
  const reflectorDiagonalMetres = reflectorSideMetres * Math.SQRT2;
  const drivenSpreaderArmMetres = drivenDiagonalMetres / 2;
  const reflectorSpreaderArmMetres = reflectorDiagonalMetres / 2;
  const elementSpacingMetres = wavelengthMetres * input.elementSpacingWavelengths;
  const totalLoopWireMetres = drivenCutPerimeterMetres + reflectorCutPerimeterMetres;
  const forwardBearingDegrees = normalizedBearing(input.forwardBearingDegrees);
  const reverseBearingDegrees = normalizedBearing(forwardBearingDegrees + 180);
  const crossAxisBearingDegrees = normalizedBearing(forwardBearingDegrees + 90);
  const drivenCentreDistanceMetres = input.mastReference === 'boom-midpoint' ? elementSpacingMetres / 2 : 0;
  const reflectorCentreDistanceMetres = input.mastReference === 'boom-midpoint' ? -elementSpacingMetres / 2 : -elementSpacingMetres;
  const drivenCentre = pointOnBearing(drivenCentreDistanceMetres, forwardBearingDegrees);
  const reflectorCentre = pointOnBearing(reflectorCentreDistanceMetres, forwardBearingDegrees);
  const drivenCrossOffset = pointOnBearing(drivenSpreaderArmMetres, crossAxisBearingDegrees);
  const reflectorCrossOffset = pointOnBearing(reflectorSpreaderArmMetres, crossAxisBearingDegrees);
  const drivenLeftCorner = addPoints(drivenCentre, { eastMetres: -drivenCrossOffset.eastMetres, northMetres: -drivenCrossOffset.northMetres });
  const drivenRightCorner = addPoints(drivenCentre, drivenCrossOffset);
  const reflectorLeftCorner = addPoints(reflectorCentre, { eastMetres: -reflectorCrossOffset.eastMetres, northMetres: -reflectorCrossOffset.northMetres });
  const reflectorRightCorner = addPoints(reflectorCentre, reflectorCrossOffset);
  const lowestWireHeightMetres = input.boomCentreHeightMetres - reflectorSpreaderArmMetres;
  const highestWireHeightMetres = input.boomCentreHeightMetres + reflectorSpreaderArmMetres;
  const surveyPoints = [
    { label: 'Mast reference', eastMetres: 0, northMetres: 0, heightMetres: input.boomCentreHeightMetres },
    { label: 'Driven centre', ...drivenCentre, heightMetres: input.boomCentreHeightMetres },
    { label: 'Driven left corner', ...drivenLeftCorner, heightMetres: input.boomCentreHeightMetres },
    { label: 'Driven right corner', ...drivenRightCorner, heightMetres: input.boomCentreHeightMetres },
    { label: 'Driven top corner', ...drivenCentre, heightMetres: input.boomCentreHeightMetres + drivenSpreaderArmMetres },
    { label: 'Driven bottom corner', ...drivenCentre, heightMetres: input.boomCentreHeightMetres - drivenSpreaderArmMetres },
    { label: 'Reflector centre', ...reflectorCentre, heightMetres: input.boomCentreHeightMetres },
    { label: 'Reflector left corner', ...reflectorLeftCorner, heightMetres: input.boomCentreHeightMetres },
    { label: 'Reflector right corner', ...reflectorRightCorner, heightMetres: input.boomCentreHeightMetres },
    { label: 'Reflector top corner', ...reflectorCentre, heightMetres: highestWireHeightMetres },
    { label: 'Reflector bottom corner', ...reflectorCentre, heightMetres: lowestWireHeightMetres }
  ];
  const warnings: string[] = [];

  if (input.trimAllowancePercent === 0) warnings.push('No loop-wire trimming allowance is included.');
  if (input.elementSpacingWavelengths === 0.1 || input.elementSpacingWavelengths === 0.25) warnings.push('The selected spacing is at the edge of this planner’s supported range and requires electromagnetic modelling.');
  if (lowestWireHeightMetres <= 0) warnings.push('The entered boom-centre height places the lower reflector corner at or below ground level.');
  else if (lowestWireHeightMetres < 2.5) warnings.push('The lower reflector corner is below 2.5 metres; provide controlled access and suitable electrical and mechanical clearance.');

  return {
    ...input,
    wavelengthMetres,
    drivenDesignPerimeterMetres,
    reflectorDesignPerimeterMetres,
    drivenCutPerimeterMetres,
    reflectorCutPerimeterMetres,
    drivenSideMetres,
    reflectorSideMetres,
    drivenCutSideMetres,
    reflectorCutSideMetres,
    drivenDiagonalMetres,
    reflectorDiagonalMetres,
    drivenSpreaderArmMetres,
    reflectorSpreaderArmMetres,
    elementSpacingMetres,
    totalLoopWireMetres,
    forwardBearingDegrees,
    forwardCompassPoint: compassPoint(forwardBearingDegrees),
    reverseBearingDegrees,
    reverseCompassPoint: compassPoint(reverseBearingDegrees),
    crossAxisBearingDegrees,
    crossAxisCompassPoint: compassPoint(crossAxisBearingDegrees),
    drivenCentre,
    reflectorCentre,
    drivenLeftCorner,
    drivenRightCorner,
    reflectorLeftCorner,
    reflectorRightCorner,
    lowestWireHeightMetres,
    highestWireHeightMetres,
    surveyPoints,
    reflectorPerimeterRatio: reflectorDesignPerimeterMetres / drivenDesignPerimeterMetres,
    warnings
  };
}
