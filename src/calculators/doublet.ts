/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface DoubletInput {
  lowestFrequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  balancedLineLengthMetres: number;
  balancedLineVelocityFactor: number;
  balancedLineImpedanceOhms: number;
  lineCheckFrequencyMHz: number;
}

export const DOUBLET_MODEL = {
  id: 'balanced-line-multiband-doublet',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL — Lab Notes: Multiband Dipoles Compared',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/9611073.pdf'
    },
    {
      title: 'ARRL — Radio Antennas and How They Operate',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
    },
    {
      title: 'ARRL — Feed Lines',
      url: 'https://www.arrl.org/feed-lines'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculateDoublet(input: DoubletInput) {
  inRange(input.lowestFrequencyMHz, 0.001, 300_000, 'Lowest design frequency');
  inRange(input.lengthCorrectionFactor, 0.5, 1.2, 'Length correction factor');
  inRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');
  inRange(input.balancedLineLengthMetres, 0.01, 10_000, 'Balanced-line length');
  inRange(input.balancedLineVelocityFactor, 0.5, 1, 'Balanced-line velocity factor');
  inRange(input.balancedLineImpedanceOhms, 200, 800, 'Balanced-line characteristic impedance');
  inRange(input.lineCheckFrequencyMHz, 0.001, 300_000, 'Feedline check frequency');

  const designWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowestFrequencyMHz * 1_000_000);
  const resonantTotalMetres = designWavelengthMetres * 0.5 * input.lengthCorrectionFactor;
  const cutTotalMetres = resonantTotalMetres * (1 + input.trimAllowancePercent / 100);
  const checkWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lineCheckFrequencyMHz * 1_000_000);
  const wavelengthInLineMetres = checkWavelengthMetres * input.balancedLineVelocityFactor;
  const feedlineElectricalWavelengths = input.balancedLineLengthMetres / wavelengthInLineMetres;

  return {
    wavelengthMetres: designWavelengthMetres,
    resonantTotalMetres,
    cutTotalMetres,
    cutLegMetres: cutTotalMetres / 2,
    balancedLineLengthMetres: input.balancedLineLengthMetres,
    balancedLineImpedanceOhms: input.balancedLineImpedanceOhms,
    lineCheckFrequencyMHz: input.lineCheckFrequencyMHz,
    wavelengthInLineMetres,
    feedlineElectricalWavelengths,
    feedlineElectricalDegrees: feedlineElectricalWavelengths * 360,
    feedlinePositionWithinHalfWave: ((feedlineElectricalWavelengths % 0.5) + 0.5) % 0.5,
    eighthWaveAdjustmentMetres: wavelengthInLineMetres / 8,
    totalConductorMetres: cutTotalMetres + 2 * input.balancedLineLengthMetres
  };
}
