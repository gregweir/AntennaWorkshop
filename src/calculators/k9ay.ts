/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface K9ayInput {
  frequencyMHz: number;
  apexHeightMetres: number;
  halfWidthMetres: number;
  lowerCornerHeightMetres: number;
  firstReceiveBearingDegrees: number;
  selectedDirectionIndex: number;
  terminationResistanceOhms: number;
  assumedAntennaImpedanceOhms: number;
  feedlineImpedanceOhms: number;
  wireCutAllowancePercent: number;
  antennaWindingTurns: number;
  feedlineWindingTurns: number;
}

export const K9AY_MODEL = {
  id: 'k9ay-four-direction-loop-planner',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'Breed — The K9AY Terminated Loop: A Compact, Directional Receiving Antenna',
      url: 'https://www.arrl.org/files/file/Courses/EC-009/QST_Sep_1997_p43-46.pdf'
    },
    {
      title: 'K9AY Loop frequently asked questions',
      url: 'https://k9ay.com/TechData/LoopFAQ.htm'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function wholeNumber(value: number, minimum: number, maximum: number, label: string) {
  finiteRange(value, minimum, maximum, label);
  if (!Number.isInteger(value)) throw new RangeError(`${label} must be a whole number.`);
}

function compassPoint(bearingDegrees: number) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round(bearingDegrees / 22.5) % points.length];
}

export function calculateK9ay(input: K9ayInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.apexHeightMetres, 0.2, 100, 'Apex height');
  finiteRange(input.halfWidthMetres, 0.1, 100, 'Half width');
  finiteRange(input.lowerCornerHeightMetres, 0.1, 100, 'Lower corner height');
  if (input.lowerCornerHeightMetres >= input.apexHeightMetres) throw new RangeError('Lower corner height must be below apex height.');
  if (!Number.isFinite(input.firstReceiveBearingDegrees) || input.firstReceiveBearingDegrees < 0 || input.firstReceiveBearingDegrees >= 360) {
    throw new RangeError('First receive bearing must be at least 0 and less than 360.');
  }
  if (!Number.isInteger(input.selectedDirectionIndex) || input.selectedDirectionIndex < 0 || input.selectedDirectionIndex > 3) {
    throw new RangeError('Selected direction index must be a whole number from 0 to 3.');
  }
  finiteRange(input.terminationResistanceOhms, 1, 10_000, 'Termination resistance');
  finiteRange(input.assumedAntennaImpedanceOhms, 1, 10_000, 'Assumed antenna impedance');
  finiteRange(input.feedlineImpedanceOhms, 1, 1_000, 'Feedline impedance');
  finiteRange(input.wireCutAllowancePercent, 0, 25, 'Wire cut allowance');
  wholeNumber(input.antennaWindingTurns, 1, 100, 'Antenna winding turns');
  wholeNumber(input.feedlineWindingTurns, 1, 100, 'Feedline winding turns');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const upperSlopingSideMetres = Math.hypot(input.halfWidthMetres, input.apexHeightMetres - input.lowerCornerHeightMetres);
  const lowerSlopingSideMetres = Math.hypot(input.halfWidthMetres, input.lowerCornerHeightMetres);
  const designWireLengthPerLoopMetres = 2 * (upperSlopingSideMetres + lowerSlopingSideMetres);
  const cutWireLengthPerLoopMetres = designWireLengthPerLoopMetres * (1 + input.wireCutAllowancePercent / 100);
  const totalWireForTwoLoopsMetres = cutWireLengthPerLoopMetres * 2;
  const segmentSchedulePerLoop = [
    { label: 'Upper slopes', quantity: 2, designLengthMetres: upperSlopingSideMetres },
    { label: 'Lower slopes and base leads', quantity: 2, designLengthMetres: lowerSlopingSideMetres }
  ].map((segment) => ({ ...segment, allocatedLengthMetres: segment.designLengthMetres * (1 + input.wireCutAllowancePercent / 100), totalAllocatedLengthMetres: segment.quantity * segment.designLengthMetres * (1 + input.wireCutAllowancePercent / 100) }));
  const footprintDiameterMetres = input.halfWidthMetres * 2;
  const directions = Array.from({ length: 4 }, (_, index) => {
    const bearingDegrees = (input.firstReceiveBearingDegrees + index * 90) % 360;
    return {
      index,
      bearingDegrees,
      compassPoint: compassPoint(bearingDegrees),
      loop: index % 2 === 0 ? 1 : 2,
      reversed: index >= 2,
      feedEnd: index >= 2 ? 'opposite end' : 'reference end',
      feedTerminal: `L${index % 2 + 1}${index >= 2 ? 'B' : 'A'}`,
      terminationTerminal: `L${index % 2 + 1}${index >= 2 ? 'A' : 'B'}`,
      terminationBearingDegrees: (bearingDegrees + 180) % 360,
      terminationCompassPoint: compassPoint((bearingDegrees + 180) % 360)
    };
  });
  const selectedDirection = directions[input.selectedDirectionIndex];
  const impedanceTransformationRatio = input.assumedAntennaImpedanceOhms / input.feedlineImpedanceOhms;
  const transformerTurnsRatio = Math.sqrt(impedanceTransformationRatio);
  const enteredTransformerTurnsRatio = input.antennaWindingTurns / input.feedlineWindingTurns;
  const enteredTransformerImpedanceRatio = enteredTransformerTurnsRatio ** 2;
  const enteredReferredAntennaImpedanceOhms = input.feedlineImpedanceOhms * enteredTransformerImpedanceRatio;
  const enteredReferredImpedanceDifferencePercent = Math.abs(enteredReferredAntennaImpedanceOhms - input.assumedAntennaImpedanceOhms) / input.assumedAntennaImpedanceOhms * 100;
  const terminationDifferencePercent = Math.abs(input.terminationResistanceOhms - input.assumedAntennaImpedanceOhms) / input.assumedAntennaImpedanceOhms * 100;
  const wireLengthWavelengths = designWireLengthPerLoopMetres / wavelengthMetres;
  const warnings: string[] = [];

  if (wireLengthWavelengths >= 0.3) warnings.push('The loop wire is at least 0.30 wavelength at the reference frequency; the inventor cautions that an oversized loop can change operating mode and termination requirements.');
  if (terminationDifferencePercent > 25) warnings.push('The entered termination differs by more than 25% from the assumed antenna impedance; ground, frequency, geometry, and transformer loading require installed measurement.');
  if (input.wireCutAllowancePercent === 0) warnings.push('No allowance is included for corner attachment, base pigtails, routing, or trimming.');
  if (enteredReferredImpedanceDifferencePercent > 25) warnings.push('The entered transformer turns refer an impedance more than 25% from the antenna-side planning assumption; verify the winding choice and complete receive system.');

  return {
    ...input,
    wavelengthMetres,
    upperSlopingSideMetres,
    lowerSlopingSideMetres,
    designWireLengthPerLoopMetres,
    cutWireLengthPerLoopMetres,
    totalWireForTwoLoopsMetres,
    segmentSchedulePerLoop,
    footprintDiameterMetres,
    wireLengthWavelengths,
    longestDiagonalWavelengths: Math.hypot(footprintDiameterMetres, input.apexHeightMetres) / wavelengthMetres,
    directions,
    selectedDirection,
    impedanceTransformationRatio,
    transformerTurnsRatio,
    enteredTransformerTurnsRatio,
    enteredTransformerImpedanceRatio,
    enteredReferredAntennaImpedanceOhms,
    enteredReferredImpedanceDifferencePercent,
    terminationDifferencePercent,
    directionDescription: `Loop ${selectedDirection.loop}, ${selectedDirection.reversed ? 'reversed' : 'reference'} state: primary response toward the feed end at ${selectedDirection.bearingDegrees.toFixed(0)}° ${selectedDirection.compassPoint}; termination and principal-null direction at ${selectedDirection.terminationBearingDegrees.toFixed(0)}° ${selectedDirection.terminationCompassPoint}`,
    warnings
  };
}
