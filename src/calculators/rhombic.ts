/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type RhombicMode = 'open' | 'terminated';

export interface RhombicInput {
  frequencyMHz: number;
  sideWavelengths: number;
  includedAngleDegrees: number;
  forwardBearingDegrees: number;
  mode: RhombicMode;
  terminationResistanceOhms: number;
  trimAllowancePercent: number;
}

export const RHOMBIC_MODEL = {
  id: 'tc-9-64-four-support-rhombic-site-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'U.S. Army TC 9-64 — basic rhombic construction, direction, termination, and site context',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/8594DF18-D94D-432C-823B-7D40C4B4BE4A-1274317197310/tc_9-64.pdf'
    },
    {
      title: 'U.S. Army ATP 6-02.53 — corrected physical length for long-wire elements',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/0C45D378-25E0-438E-8881-749EF51DE080-1452191121290/atp6_02x53.pdf'
    }
  ]
} as const;

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function normalizedBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function compassPoint(bearing: number) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(normalizedBearing(bearing) / 45) % 8];
}

export function calculateRhombic(input: RhombicInput) {
  finite(input.frequencyMHz, 'Frequency');
  finite(input.sideWavelengths, 'Side electrical length');
  finite(input.includedAngleDegrees, 'Included angle');
  finite(input.forwardBearingDegrees, 'Forward bearing');
  finite(input.terminationResistanceOhms, 'Termination resistance');
  finite(input.trimAllowancePercent, 'Trim allowance');
  if (input.frequencyMHz <= 0 || input.frequencyMHz > 300) throw new RangeError('Frequency must be above zero and no greater than 300 MHz.');
  if (!Number.isInteger(input.sideWavelengths) || input.sideWavelengths < 1 || input.sideWavelengths > 10) throw new RangeError('Side electrical length must be a whole number from 1 through 10 wavelengths.');
  if (input.includedAngleDegrees < 20 || input.includedAngleDegrees > 100) throw new RangeError('Included angle must be from 20 through 100 degrees.');
  if (input.forwardBearingDegrees < 0 || input.forwardBearingDegrees >= 360) throw new RangeError('Forward bearing must be from 0 through 359.999 degrees.');
  if (input.mode !== 'open' && input.mode !== 'terminated') throw new RangeError('Rhombic mode is not supported.');
  if (input.terminationResistanceOhms <= 0 || input.terminationResistanceOhms > 10_000) throw new RangeError('Termination resistance must be above zero and no greater than 10,000 ohms.');
  if (input.trimAllowancePercent < 0 || input.trimAllowancePercent > 25) throw new RangeError('Trim allowance must be from 0 through 25 percent.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const designSideMetres = 150 * (2 * input.sideWavelengths - 0.05) / input.frequencyMHz;
  const cutSideMetres = designSideMetres * (1 + input.trimAllowancePercent / 100);
  const halfAngleRadians = input.includedAngleDegrees * Math.PI / 360;
  const forwardDepthMetres = 2 * designSideMetres * Math.cos(halfAngleRadians);
  const crossSpanMetres = 2 * designSideMetres * Math.sin(halfAngleRadians);
  const halfDepthMetres = forwardDepthMetres / 2;
  const halfSpanMetres = crossSpanMetres / 2;
  const forwardBearingDegrees = normalizedBearing(input.forwardBearingDegrees);
  const bearingRadians = forwardBearingDegrees * Math.PI / 180;
  const toCoordinate = (forwardMetres: number, rightMetres: number) => ({
    eastMetres: forwardMetres * Math.sin(bearingRadians) + rightMetres * Math.cos(bearingRadians),
    northMetres: forwardMetres * Math.cos(bearingRadians) - rightMetres * Math.sin(bearingRadians)
  });
  const point = (label: string, role: string, forwardMetres: number, rightMetres: number) => {
    const coordinate = toCoordinate(forwardMetres, rightMetres);
    const distanceMetres = Math.hypot(coordinate.eastMetres, coordinate.northMetres);
    return {
      label,
      role,
      ...coordinate,
      distanceMetres,
      bearingDegrees: distanceMetres === 0 ? null : normalizedBearing(Math.atan2(coordinate.eastMetres, coordinate.northMetres) * 180 / Math.PI)
    };
  };
  const surveyPoints = [
    point('A', 'Feed apex', 0, 0),
    point('B', 'Left side support', halfDepthMetres, -halfSpanMetres),
    point('C', 'Far apex', forwardDepthMetres, 0),
    point('D', 'Right side support', halfDepthMetres, halfSpanMetres)
  ];
  const reverseBearingDegrees = normalizedBearing(forwardBearingDegrees + 180);
  const warnings: string[] = [];
  if (input.mode === 'terminated') warnings.push('The entered far-apex resistance is a planning assumption, not a calculated match. Model and measure the antenna, feed, termination, ground system, frequency range, and installed environment.');
  if (input.frequencyMHz > 30) warnings.push('The cited rhombic guidance is presented in long-range HF context. Use above 30 MHz requires separate modelling of the exact conductors, height, feed, termination, supports, and surroundings.');

  return {
    ...input,
    wavelengthMetres,
    designSideMetres,
    cutSideMetres,
    totalDesignWireMetres: designSideMetres * 4,
    totalCutWireMetres: cutSideMetres * 4,
    forwardDepthMetres,
    crossSpanMetres,
    footprintAreaSquareMetres: designSideMetres ** 2 * Math.sin(input.includedAngleDegrees * Math.PI / 180),
    forwardBearingDegrees,
    forwardCompassPoint: compassPoint(forwardBearingDegrees),
    reverseBearingDegrees,
    reverseCompassPoint: compassPoint(reverseBearingDegrees),
    surveyPoints,
    directionDescription: input.mode === 'terminated' ? 'Forward from the feed apex toward and beyond the terminated far apex' : 'Bidirectional along the long diagonal through both open apexes',
    terminationDescription: input.mode === 'terminated' ? `${input.terminationResistanceOhms.toFixed(0)} Ω entered non-inductive far-apex termination and engineered ground system` : 'Far apex open; no terminating resistor',
    warnings
  };
}
