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
}

export const TWO_ELEMENT_CUBICAL_QUAD_MODEL = {
  id: 'arrl-two-element-cubical-quad',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
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

export function calculateTwoElementCubicalQuad(input: TwoElementCubicalQuadInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.elementSpacingWavelengths, 0.1, 0.25, 'Element spacing');
  finiteRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const drivenDesignPerimeterMetres = 1005 / input.frequencyMHz * METRES_PER_FOOT;
  const reflectorDesignPerimeterMetres = drivenDesignPerimeterMetres * 1.05;
  const trimMultiplier = 1 + input.trimAllowancePercent / 100;
  const drivenCutPerimeterMetres = drivenDesignPerimeterMetres * trimMultiplier;
  const reflectorCutPerimeterMetres = reflectorDesignPerimeterMetres * trimMultiplier;
  const drivenSideMetres = drivenCutPerimeterMetres / 4;
  const reflectorSideMetres = reflectorCutPerimeterMetres / 4;
  const drivenDiagonalMetres = drivenSideMetres * Math.SQRT2;
  const reflectorDiagonalMetres = reflectorSideMetres * Math.SQRT2;
  const drivenSpreaderArmMetres = drivenDiagonalMetres / 2;
  const reflectorSpreaderArmMetres = reflectorDiagonalMetres / 2;
  const elementSpacingMetres = wavelengthMetres * input.elementSpacingWavelengths;
  const totalLoopWireMetres = drivenCutPerimeterMetres + reflectorCutPerimeterMetres;
  const warnings: string[] = [];

  if (input.trimAllowancePercent === 0) warnings.push('No loop-wire trimming allowance is included.');
  if (input.elementSpacingWavelengths === 0.1 || input.elementSpacingWavelengths === 0.25) warnings.push('The selected spacing is at the edge of this planner’s supported range and requires electromagnetic modelling.');

  return {
    ...input,
    wavelengthMetres,
    drivenDesignPerimeterMetres,
    reflectorDesignPerimeterMetres,
    drivenCutPerimeterMetres,
    reflectorCutPerimeterMetres,
    drivenSideMetres,
    reflectorSideMetres,
    drivenDiagonalMetres,
    reflectorDiagonalMetres,
    drivenSpreaderArmMetres,
    reflectorSpreaderArmMetres,
    elementSpacingMetres,
    totalLoopWireMetres,
    reflectorPerimeterRatio: reflectorDesignPerimeterMetres / drivenDesignPerimeterMetres,
    warnings
  };
}
