/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export const SPEED_OF_LIGHT_METRES_PER_SECOND = 299_792_458;

export interface DipoleInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
}

export interface DipoleResult {
  wavelengthMetres: number;
  resonantTotalMetres: number;
  resonantLegMetres: number;
  cutTotalMetres: number;
  cutLegMetres: number;
  warnings: string[];
}

export const HALF_WAVE_DIPOLE_MODEL = {
  id: 'half-wave-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-11',
  sources: [
    {
      title: 'ARRL — Single-Band Dipoles',
      url: 'https://www.arrl.org/single-band-dipoles'
    },
    {
      title: 'BIPM — The International System of Units',
      url: 'https://www.bipm.org/en/measurement-units/'
    }
  ]
} as const;

export function calculateHalfWaveDipole(input: DipoleInput): DipoleResult {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) {
    throw new RangeError('Frequency must be greater than zero.');
  }
  if (
    !Number.isFinite(input.lengthCorrectionFactor) ||
    input.lengthCorrectionFactor <= 0 ||
    input.lengthCorrectionFactor > 1
  ) {
    throw new RangeError('Length correction factor must be greater than zero and no more than one.');
  }
  if (
    !Number.isFinite(input.trimAllowancePercent) ||
    input.trimAllowancePercent < 0 ||
    input.trimAllowancePercent > 25
  ) {
    throw new RangeError('Trim allowance must be between zero and 25 percent.');
  }

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const resonantTotalMetres = wavelengthMetres * 0.5 * input.lengthCorrectionFactor;
  const cutTotalMetres = resonantTotalMetres * (1 + input.trimAllowancePercent / 100);
  const warnings: string[] = [];

  if (input.lengthCorrectionFactor === 1) {
    warnings.push('A correction factor of 1.0 is a geometric half wavelength and usually produces an antenna that needs shortening.');
  }
  if (input.trimAllowancePercent === 0) {
    warnings.push('No trimming allowance is included. Real installations normally require measurement and adjustment.');
  }

  return {
    wavelengthMetres,
    resonantTotalMetres,
    resonantLegMetres: resonantTotalMetres / 2,
    cutTotalMetres,
    cutLegMetres: cutTotalMetres / 2,
    warnings
  };
}
