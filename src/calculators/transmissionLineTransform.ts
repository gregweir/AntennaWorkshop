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
  matchedLossDbPer100Metres: number;
  loadResistanceOhms: number;
  loadReactanceOhms: number;
}

export const TRANSMISSION_LINE_TRANSFORM_MODEL = {
  id: 'uniform-lossy-transmission-line-transform',
  version: '2.0.0',
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
    },
    {
      title: 'Rohde & Schwarz — How to measure cable loss',
      url: 'https://www.rohde-schwarz.com/au/products/test-and-measurement/essentials-test-equipment/spectrum-analyzers/how-to-measure-cable-loss_258130.html'
    },
    {
      title: 'ARRL — What Does Your SWR Cost You?',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/7901019.pdf'
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

interface Complex {
  real: number;
  imaginary: number;
}

function add(left: Complex, right: Complex): Complex {
  return { real: left.real + right.real, imaginary: left.imaginary + right.imaginary };
}

function multiply(left: Complex, right: Complex): Complex {
  return {
    real: left.real * right.real - left.imaginary * right.imaginary,
    imaginary: left.real * right.imaginary + left.imaginary * right.real
  };
}

function scale(value: Complex, factor: number): Complex {
  return { real: value.real * factor, imaginary: value.imaginary * factor };
}

function divide(numerator: Complex, denominator: Complex): Complex {
  const magnitudeSquared = denominator.real ** 2 + denominator.imaginary ** 2;
  return {
    real: (numerator.real * denominator.real + numerator.imaginary * denominator.imaginary) / magnitudeSquared,
    imaginary: (numerator.imaginary * denominator.real - numerator.real * denominator.imaginary) / magnitudeSquared
  };
}

export function calculateTransmissionLineTransform(input: TransmissionLineTransformInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.characteristicImpedanceOhms, 0.01, 1_000_000, 'Characteristic impedance');
  finiteRange(input.physicalLengthMetres, 0, 1_000_000, 'Physical length');
  finiteRange(input.velocityFactor, 0.01, 1, 'Velocity factor');
  finiteRange(input.matchedLossDbPer100Metres, 0, 10_000, 'Matched line loss');
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
  const oneWayMatchedLossDb = input.matchedLossDbPer100Metres * input.physicalLengthMetres / 100;
  const oneWayAttenuationNepers = oneWayMatchedLossDb / (20 * Math.log10(Math.E));
  const expMinusTwiceAttenuation = Math.exp(-2 * oneWayAttenuationNepers);

  // cosh(αl + jβl) and sinh(αl + jβl), scaled by e^-αl to avoid overflow.
  // Their common scale cancels in the input-impedance quotient.
  const scaledCosh = {
    real: (1 + expMinusTwiceAttenuation) * cosine / 2,
    imaginary: (1 - expMinusTwiceAttenuation) * sine / 2
  };
  const scaledSinh = {
    real: (1 - expMinusTwiceAttenuation) * cosine / 2,
    imaginary: (1 + expMinusTwiceAttenuation) * sine / 2
  };
  const load = { real: input.loadResistanceOhms, imaginary: input.loadReactanceOhms };
  const numerator = add(multiply(load, scaledCosh), scale(scaledSinh, input.characteristicImpedanceOhms));
  const denominator = add(scale(scaledCosh, input.characteristicImpedanceOhms), multiply(load, scaledSinh));
  const inputImpedance = scale(divide(numerator, denominator), input.characteristicImpedanceOhms);
  const inputResistanceOhms = inputImpedance.real;
  const inputReactanceOhms = inputImpedance.imaginary;

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
    oneWayMatchedLossDb,
    roundTripReflectionAttenuationDb: oneWayMatchedLossDb * 2,
    matchedOneWayPowerRemainingPercent: 100 * 10 ** (-oneWayMatchedLossDb / 10),
    attenuationNepersPerMetre: input.physicalLengthMetres === 0 ? input.matchedLossDbPer100Metres / 100 / (20 * Math.log10(Math.E)) : oneWayAttenuationNepers / input.physicalLengthMetres,
    oneWayDelayNanoseconds: input.physicalLengthMetres / (SPEED_OF_LIGHT_METRES_PER_SECOND * input.velocityFactor) * 1_000_000_000,
    inputResistanceOhms,
    inputReactanceOhms,
    loadPoint,
    inputPoint,
    expectedInputReflectionMagnitude: loadPoint.reflectionMagnitude * expMinusTwiceAttenuation,
    reflectionMagnitudeResidual: Math.abs(loadPoint.reflectionMagnitude * expMinusTwiceAttenuation - inputPoint.reflectionMagnitude),
    expectedReflectionRotationDegrees: normalizeDegrees(-2 * electricalLengthDegrees)
  };
}
