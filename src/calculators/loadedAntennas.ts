/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface LoadedDipoleInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  totalSpanMetres: number;
  loadingPointFromCentreMetres: number;
  heightAboveGroundMetres: number;
  conductorDiameterMillimetres: number;
}

export interface LoadedVerticalInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  radiatorHeightMetres: number;
  loadingPointFromBaseMetres: number;
  conductorDiameterMillimetres: number;
}

export const LOADED_ANTENNA_MODEL = {
  id: 'single-band-inductively-loaded-wire',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL QEX — Design of a Two-band Loaded Dipole Antenna',
      url: 'https://www.arrl.org/files/file/ARRL%20Handbook%20Supplemental%20Files/2019%20Edition/Two%20Band%20Loaded%20Dipole%20-%20Birnbaum.pdf'
    },
    {
      title: 'ARRL Extra Class Study Guide — Loading-coil placement, loss, and bandwidth',
      url: 'https://www.arrl.org/files/file/Extra%20Class%20License%20Manual/ECLM%2010th%20edition/Studyguide%20%20FINAL.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function calculateLoadedArm({
  frequencyMHz,
  lengthCorrectionFactor,
  physicalArmMetres,
  loadingPointFromCurrentMaximumMetres,
  modelHeightMetres,
  conductorDiameterMillimetres
}: {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  physicalArmMetres: number;
  loadingPointFromCurrentMaximumMetres: number;
  modelHeightMetres: number;
  conductorDiameterMillimetres: number;
}) {
  inRange(frequencyMHz, 0.001, 300_000, 'Design frequency');
  inRange(lengthCorrectionFactor, 0.5, 1.2, 'Length correction factor');
  inRange(physicalArmMetres, 0.01, 10_000, 'Physical arm length');
  inRange(modelHeightMetres, 0.01, 10_000, 'Model height');
  inRange(conductorDiameterMillimetres, 0.01, 1_000, 'Conductor diameter');

  if (!Number.isFinite(loadingPointFromCurrentMaximumMetres)
    || loadingPointFromCurrentMaximumMetres < 0
    || loadingPointFromCurrentMaximumMetres >= physicalArmMetres) {
    throw new RangeError('Loading point must be on the physical radiator, before its open end.');
  }

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (frequencyMHz * 1_000_000);
  const resonantArmMetres = wavelengthMetres * 0.25 * lengthCorrectionFactor;
  if (physicalArmMetres >= resonantArmMetres) {
    throw new RangeError('Physical radiator must be shorter than a free-space quarter wavelength.');
  }
  if (loadingPointFromCurrentMaximumMetres >= resonantArmMetres) {
    throw new RangeError('Loading point must be less than a free-space quarter wavelength from the current maximum.');
  }

  const conductorDiameterMetres = conductorDiameterMillimetres / 1_000;
  const characteristicImpedanceOhms = 138 * Math.log10((4 * modelHeightMetres) / conductorDiameterMetres);
  if (!(characteristicImpedanceOhms > 0)) {
    throw new RangeError('Conductor diameter is too large for the selected model height.');
  }

  const outerSectionMetres = physicalArmMetres - loadingPointFromCurrentMaximumMetres;
  const innerAngleRadians = (Math.PI / 2) * (loadingPointFromCurrentMaximumMetres / resonantArmMetres);
  const outerAngleRadians = (Math.PI / 2) * (outerSectionMetres / resonantArmMetres);
  const innerReactanceOhms = characteristicImpedanceOhms * Math.tan(innerAngleRadians);
  const outerReactanceOhms = characteristicImpedanceOhms / Math.tan(outerAngleRadians);
  const requiredReactanceOhms = outerReactanceOhms - innerReactanceOhms;
  if (!(requiredReactanceOhms > 0)) {
    throw new RangeError('This geometry does not require a positive series loading inductance.');
  }

  const inductanceHenries = requiredReactanceOhms / (2 * Math.PI * frequencyMHz * 1_000_000);
  return {
    wavelengthMetres,
    resonantArmMetres,
    physicalArmMetres,
    loadingPointFromCurrentMaximumMetres,
    outerSectionMetres,
    shorteningPercent: (1 - physicalArmMetres / resonantArmMetres) * 100,
    characteristicImpedanceOhms,
    innerReactanceOhms,
    outerReactanceOhms,
    requiredReactanceOhms,
    inductanceMicrohenries: inductanceHenries * 1_000_000
  };
}

export function calculateLoadedDipole(input: LoadedDipoleInput) {
  inRange(input.totalSpanMetres, 0.02, 20_000, 'Total span');
  const arm = calculateLoadedArm({
    frequencyMHz: input.frequencyMHz,
    lengthCorrectionFactor: input.lengthCorrectionFactor,
    physicalArmMetres: input.totalSpanMetres / 2,
    loadingPointFromCurrentMaximumMetres: input.loadingPointFromCentreMetres,
    modelHeightMetres: input.heightAboveGroundMetres,
    conductorDiameterMillimetres: input.conductorDiameterMillimetres
  });

  return {
    ...arm,
    totalSpanMetres: input.totalSpanMetres,
    loadingPointFromCentreMetres: input.loadingPointFromCentreMetres,
    heightAboveGroundMetres: input.heightAboveGroundMetres,
    conductorDiameterMillimetres: input.conductorDiameterMillimetres,
    coilCount: 2 as const
  };
}

export function calculateLoadedVertical(input: LoadedVerticalInput) {
  const arm = calculateLoadedArm({
    frequencyMHz: input.frequencyMHz,
    lengthCorrectionFactor: input.lengthCorrectionFactor,
    physicalArmMetres: input.radiatorHeightMetres,
    loadingPointFromCurrentMaximumMetres: input.loadingPointFromBaseMetres,
    modelHeightMetres: input.radiatorHeightMetres,
    conductorDiameterMillimetres: input.conductorDiameterMillimetres
  });

  return {
    ...arm,
    radiatorHeightMetres: input.radiatorHeightMetres,
    loadingPointFromBaseMetres: input.loadingPointFromBaseMetres,
    conductorDiameterMillimetres: input.conductorDiameterMillimetres,
    coilCount: 1 as const
  };
}
