/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface TrapDipoleInput {
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  lengthCorrectionFactor: number;
  totalSpanMetres: number;
  trapPositionFromCentreMetres: number;
  heightAboveGroundMetres: number;
  conductorDiameterMillimetres: number;
}

export const TRAP_DIPOLE_MODEL = {
  id: 'birnbaum-two-band-parallel-lc-trap-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL QEX — Design of a Two-band Loaded Dipole Antenna',
      url: 'https://www.arrl.org/files/file/ARRL%20Handbook%20Supplemental%20Files/2019%20Edition/Two%20Band%20Loaded%20Dipole%20-%20Birnbaum.pdf'
    },
    {
      title: 'ARRL — Trap Dipoles & Parallel Poles',
      url: 'https://www.arrl.org/trap-dipoles-parallel-poles'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function reactanceAtFrequency({
  frequencyMHz,
  lengthCorrectionFactor,
  innerSectionMetres,
  outerSectionMetres,
  characteristicImpedanceOhms
}: {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  innerSectionMetres: number;
  outerSectionMetres: number;
  characteristicImpedanceOhms: number;
}) {
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (frequencyMHz * 1_000_000);
  const resonantArmMetres = wavelengthMetres * 0.25 * lengthCorrectionFactor;
  if (innerSectionMetres >= resonantArmMetres || outerSectionMetres >= resonantArmMetres) {
    throw new RangeError('Each wire section must be shorter than the corrected quarter-wave reference at both design frequencies.');
  }

  const innerAngleRadians = (Math.PI / 2) * (innerSectionMetres / resonantArmMetres);
  const outerAngleRadians = (Math.PI / 2) * (outerSectionMetres / resonantArmMetres);
  const innerReactanceOhms = characteristicImpedanceOhms * Math.tan(innerAngleRadians);
  const outerReactanceOhms = characteristicImpedanceOhms / Math.tan(outerAngleRadians);

  return {
    wavelengthMetres,
    resonantArmMetres,
    innerReactanceOhms,
    outerReactanceOhms,
    requiredTrapReactanceOhms: outerReactanceOhms - innerReactanceOhms
  };
}

export function calculateTrapDipole(input: TrapDipoleInput) {
  inRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower design frequency');
  inRange(input.upperFrequencyMHz, 0.001, 300_000, 'Upper design frequency');
  if (input.upperFrequencyMHz <= input.lowerFrequencyMHz) {
    throw new RangeError('Upper design frequency must be greater than lower design frequency.');
  }
  inRange(input.lengthCorrectionFactor, 0.5, 1.2, 'Length correction factor');
  inRange(input.totalSpanMetres, 0.02, 20_000, 'Total span');
  inRange(input.heightAboveGroundMetres, 0.01, 10_000, 'Model height');
  inRange(input.conductorDiameterMillimetres, 0.01, 1_000, 'Conductor diameter');

  const physicalArmMetres = input.totalSpanMetres / 2;
  if (!Number.isFinite(input.trapPositionFromCentreMetres)
    || input.trapPositionFromCentreMetres <= 0
    || input.trapPositionFromCentreMetres >= physicalArmMetres) {
    throw new RangeError('Trap position must be between the feedpoint and the open end of each arm.');
  }

  const outerSectionMetres = physicalArmMetres - input.trapPositionFromCentreMetres;
  const conductorDiameterMetres = input.conductorDiameterMillimetres / 1_000;
  const characteristicImpedanceOhms = 138 * Math.log10((4 * input.heightAboveGroundMetres) / conductorDiameterMetres);
  if (!(characteristicImpedanceOhms > 0)) {
    throw new RangeError('Conductor diameter is too large for the selected model height.');
  }

  const lower = reactanceAtFrequency({
    frequencyMHz: input.lowerFrequencyMHz,
    lengthCorrectionFactor: input.lengthCorrectionFactor,
    innerSectionMetres: input.trapPositionFromCentreMetres,
    outerSectionMetres,
    characteristicImpedanceOhms
  });
  const upper = reactanceAtFrequency({
    frequencyMHz: input.upperFrequencyMHz,
    lengthCorrectionFactor: input.lengthCorrectionFactor,
    innerSectionMetres: input.trapPositionFromCentreMetres,
    outerSectionMetres,
    characteristicImpedanceOhms
  });

  if (!(lower.requiredTrapReactanceOhms > 0) || !(upper.requiredTrapReactanceOhms < 0)) {
    throw new RangeError('Geometry must require inductive trap reactance on the lower frequency and capacitive reactance on the upper frequency.');
  }

  const lowerAngularFrequency = 2 * Math.PI * input.lowerFrequencyMHz * 1_000_000;
  const upperAngularFrequency = 2 * Math.PI * input.upperFrequencyMHz * 1_000_000;
  const reactanceRatio = upper.requiredTrapReactanceOhms / lower.requiredTrapReactanceOhms;
  const trapAngularFrequencySquared = (
    lowerAngularFrequency ** 2 * upperAngularFrequency
    - reactanceRatio * upperAngularFrequency ** 2 * lowerAngularFrequency
  ) / (upperAngularFrequency - reactanceRatio * lowerAngularFrequency);
  if (!(trapAngularFrequencySquared > 0)) {
    throw new RangeError('The selected geometry does not produce a real parallel-LC trap resonance.');
  }

  const trapAngularFrequency = Math.sqrt(trapAngularFrequencySquared);
  const componentReactanceAtResonanceOhms = lower.requiredTrapReactanceOhms * (
    trapAngularFrequency / lowerAngularFrequency
    - lowerAngularFrequency / trapAngularFrequency
  );
  const inductanceHenries = componentReactanceAtResonanceOhms / trapAngularFrequency;
  const capacitanceFarads = 1 / (trapAngularFrequencySquared * inductanceHenries);
  if (!(inductanceHenries > 0) || !(capacitanceFarads > 0)) {
    throw new RangeError('The selected geometry does not produce positive trap component values.');
  }

  const trapResonanceMHz = trapAngularFrequency / (2 * Math.PI * 1_000_000);
  if (!(trapResonanceMHz > input.lowerFrequencyMHz && trapResonanceMHz < input.upperFrequencyMHz)) {
    throw new RangeError('Trap resonance must fall between the two design frequencies.');
  }

  return {
    wavelengthMetres: lower.wavelengthMetres,
    upperWavelengthMetres: upper.wavelengthMetres,
    lowerFrequencyMHz: input.lowerFrequencyMHz,
    upperFrequencyMHz: input.upperFrequencyMHz,
    totalSpanMetres: input.totalSpanMetres,
    physicalArmMetres,
    trapPositionFromCentreMetres: input.trapPositionFromCentreMetres,
    outerSectionMetres,
    heightAboveGroundMetres: input.heightAboveGroundMetres,
    conductorDiameterMillimetres: input.conductorDiameterMillimetres,
    characteristicImpedanceOhms,
    lowerRequiredReactanceOhms: lower.requiredTrapReactanceOhms,
    upperRequiredReactanceOhms: upper.requiredTrapReactanceOhms,
    trapResonanceMHz,
    componentReactanceAtResonanceOhms,
    inductanceMicrohenries: inductanceHenries * 1_000_000,
    capacitancePicofarads: capacitanceFarads * 1_000_000_000_000,
    trapCount: 2 as const
  };
}
