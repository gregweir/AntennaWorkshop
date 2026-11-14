/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateImpedanceExplorer } from './impedanceExplorer';

export interface TransmissionLineTransformInput {
  frequencyMHz: number;
  characteristicImpedanceOhms: number;
  physicalLengthMetres: number;
  velocityFactor: number;
  loadResistanceOhms: number;
  loadReactanceOhms: number;
}

export const TRANSMISSION_LINE_TRANSFORM_MODEL = {
  id: 'lossless-uniform-transmission-line-transform',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — Smith Chart Supplement, Solving Problems with the Smith Chart',
      url: 'https://www.arrl.org/files/file/Antenna%20Book%20Supplemental%20Files/22nd%20Edition/Smith%20Chart%20Supplement%20-%20Corrected%20Jan%202012.pdf'
    },
    {
      title: 'Keysight — S-Parameter Design Seminar, Transmission Lines',
      url: 'https://www.keysight.com/zz/en/assets/7018-06743/application-notes/5952-1087.pdf'
    },
    {
      title: 'Rohde & Schwarz — Cable impedance measurement',
      url: 'https://www.rohde-schwarz.com/us/products/test-and-measurement/essentials-test-equipment/spectrum-analyzers/cable-impedance-measurement_257988.html'
    }
  ]
} as const;

const SPEED_OF_LIGHT_METRES_PER_SECOND = 299_792_458;

function finiteRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

function normalizeDegrees(degrees: number) {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function calculateTransmissionLineTransform(input: TransmissionLineTransformInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.characteristicImpedanceOhms, 0.01, 1_000_000, 'Characteristic impedance');
  finiteRange(input.physicalLengthMetres, 0, 1_000_000, 'Physical length');
  finiteRange(input.velocityFactor, 0.01, 1, 'Velocity factor');
  finiteRange(input.loadResistanceOhms, 0.01, 1_000_000, 'Load resistance');
  finiteRange(input.loadReactanceOhms, -1_000_000, 1_000_000, 'Load reactance');

  const freeSpaceWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const guidedWavelengthMetres = freeSpaceWavelengthMetres * input.velocityFactor;
  const electricalLengthWavelengths = input.physicalLengthMetres / guidedWavelengthMetres;
  const electricalLengthDegrees = electricalLengthWavelengths * 360;
  const wrappedElectricalLengthDegrees = normalizeDegrees(electricalLengthDegrees);
  const phaseRadians = wrappedElectricalLengthDegrees * Math.PI / 180;
  const cosine = Math.cos(phaseRadians);
  const sine = Math.sin(phaseRadians);

  const numeratorReal = input.loadResistanceOhms * cosine;
  const numeratorImaginary = input.loadReactanceOhms * cosine + input.characteristicImpedanceOhms * sine;
  const denominatorReal = input.characteristicImpedanceOhms * cosine - input.loadReactanceOhms * sine;
  const denominatorImaginary = input.loadResistanceOhms * sine;
  const denominatorMagnitudeSquared = denominatorReal ** 2 + denominatorImaginary ** 2;
  const inputResistanceOhms = input.characteristicImpedanceOhms * (numeratorReal * denominatorReal + numeratorImaginary * denominatorImaginary) / denominatorMagnitudeSquared;
  const inputReactanceOhms = input.characteristicImpedanceOhms * (numeratorImaginary * denominatorReal - numeratorReal * denominatorImaginary) / denominatorMagnitudeSquared;

  const loadPoint = calculateImpedanceExplorer({
    frequencyMHz: input.frequencyMHz,
    referenceResistanceOhms: input.characteristicImpedanceOhms,
    loadResistanceOhms: input.loadResistanceOhms,
    loadReactanceOhms: input.loadReactanceOhms
  });
  const inputPoint = calculateImpedanceExplorer({
    frequencyMHz: input.frequencyMHz,
    referenceResistanceOhms: input.characteristicImpedanceOhms,
    loadResistanceOhms: inputResistanceOhms,
    loadReactanceOhms: inputReactanceOhms
  });

  return {
    ...input,
    freeSpaceWavelengthMetres,
    guidedWavelengthMetres,
    electricalLengthWavelengths,
    electricalLengthDegrees,
    wrappedElectricalLengthDegrees,
    oneWayDelayNanoseconds: input.physicalLengthMetres / (SPEED_OF_LIGHT_METRES_PER_SECOND * input.velocityFactor) * 1_000_000_000,
    inputResistanceOhms,
    inputReactanceOhms,
    loadPoint,
    inputPoint,
    reflectionMagnitudeResidual: Math.abs(loadPoint.reflectionMagnitude - inputPoint.reflectionMagnitude),
    expectedReflectionRotationDegrees: normalizeDegrees(-2 * electricalLengthDegrees)
  };
}
