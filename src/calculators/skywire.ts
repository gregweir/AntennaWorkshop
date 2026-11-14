/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type SkywireFeedSide = 'north' | 'east' | 'south' | 'west';

export interface SkywireInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  longToShortAspectRatio: number;
  supportHeightsMetres: [number, number, number, number];
  riggingReservePercent: number;
  feedSide: SkywireFeedSide;
  feedPositionPercent: number;
}

export const SKYWIRE_MODEL = {
  id: 'horizontal-full-wave-loop-skywire',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — HF Loop Antennas and The Loop Skywire',
      url: 'https://www.arrl.org/hf-loop-antennas'
    },
    {
      title: 'ARRL — Radio Antennas and How They Operate',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
    }
  ]
} as const;

function finiteInRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

export function calculateSkywire(input: SkywireInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) throw new RangeError('Frequency must be greater than zero.');
  finiteInRange(input.lengthCorrectionFactor, 0.5, 1.2, 'Length correction factor');
  finiteInRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');
  finiteInRange(input.longToShortAspectRatio, 1, 10, 'Aspect ratio');
  finiteInRange(input.riggingReservePercent, 0, 25, 'Rigging reserve');
  finiteInRange(input.feedPositionPercent, 0, 100, 'Feed position');
  if (!['north', 'east', 'south', 'west'].includes(input.feedSide)) throw new RangeError('Feed side is not supported.');
  input.supportHeightsMetres.forEach((height, index) => finiteInRange(height, 0, 1_000, `Support ${index + 1} height`));

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const resonantPerimeterMetres = wavelengthMetres * input.lengthCorrectionFactor;
  const straightPlanPerimeterMetres = resonantPerimeterMetres * (1 + input.trimAllowancePercent / 100);
  const shortSideMetres = straightPlanPerimeterMetres / (2 * (input.longToShortAspectRatio + 1));
  const longSideMetres = shortSideMetres * input.longToShortAspectRatio;
  const [heightA, heightB, heightC, heightD] = input.supportHeightsMetres;
  const segmentLengthsMetres = [
    Math.hypot(longSideMetres, heightB - heightA),
    Math.hypot(shortSideMetres, heightC - heightB),
    Math.hypot(longSideMetres, heightD - heightC),
    Math.hypot(shortSideMetres, heightA - heightD)
  ] as const;
  const tautThreeDimensionalPerimeterMetres = segmentLengthsMetres.reduce((sum, length) => sum + length, 0);
  const heightGeometryExtraMetres = tautThreeDimensionalPerimeterMetres - straightPlanPerimeterMetres;
  const riggingReserveMetres = tautThreeDimensionalPerimeterMetres * input.riggingReservePercent / 100;
  const purchaseWireMetres = tautThreeDimensionalPerimeterMetres + riggingReserveMetres;
  const supportCoordinates = [
    { id: 'A', xMetres: 0, yMetres: 0, heightMetres: heightA },
    { id: 'B', xMetres: longSideMetres, yMetres: 0, heightMetres: heightB },
    { id: 'C', xMetres: longSideMetres, yMetres: shortSideMetres, heightMetres: heightC },
    { id: 'D', xMetres: 0, yMetres: shortSideMetres, heightMetres: heightD }
  ] as const;
  const sideIndex = { north: 0, east: 1, south: 2, west: 3 }[input.feedSide];
  const sideStarts = [supportCoordinates[0], supportCoordinates[1], supportCoordinates[2], supportCoordinates[3]];
  const sideEnds = [supportCoordinates[1], supportCoordinates[2], supportCoordinates[3], supportCoordinates[0]];
  const fraction = input.feedPositionPercent / 100;
  const feedStart = sideStarts[sideIndex];
  const feedEnd = sideEnds[sideIndex];
  const feedpoint = {
    xMetres: feedStart.xMetres + (feedEnd.xMetres - feedStart.xMetres) * fraction,
    yMetres: feedStart.yMetres + (feedEnd.yMetres - feedStart.yMetres) * fraction,
    heightMetres: feedStart.heightMetres + (feedEnd.heightMetres - feedStart.heightMetres) * fraction,
    distanceFromSideStartMetres: segmentLengthsMetres[sideIndex] * fraction
  };
  const heightSpreadMetres = Math.max(...input.supportHeightsMetres) - Math.min(...input.supportHeightsMetres);
  const warnings: string[] = [];
  if (heightSpreadMetres > wavelengthMetres * 0.1) warnings.push('Support-height spread exceeds 0.10 wavelength; use a three-dimensional antenna model rather than treating this as a nearly horizontal loop.');
  if (input.riggingReservePercent > 10) warnings.push('Rigging reserve exceeds 10%; keep unused reserve outside the active radiator and confirm the installed conductor path before tuning.');

  return {
    ...input,
    wavelengthMetres,
    resonantPerimeterMetres,
    straightPlanPerimeterMetres,
    longSideMetres,
    shortSideMetres,
    segmentLengthsMetres,
    tautThreeDimensionalPerimeterMetres,
    heightGeometryExtraMetres,
    riggingReserveMetres,
    purchaseWireMetres,
    supportCoordinates,
    feedpoint,
    heightSpreadMetres,
    averageSupportHeightMetres: input.supportHeightsMetres.reduce((sum, height) => sum + height, 0) / 4,
    warnings
  };
}
