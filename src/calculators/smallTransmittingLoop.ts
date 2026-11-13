/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface SmallTransmittingLoopInput {
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  circumferenceMetres: number;
  measuredInductanceMicrohenries: number;
  strayCapacitancePicofarads: number;
  capacitorMinimumPicofarads: number;
  capacitorMaximumPicofarads: number;
}

export const SMALL_TRANSMITTING_LOOP_MODEL = {
  id: 'small-transmitting-loop-measured-inductance',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL — HF Loop Antennas',
      url: 'https://www.arrl.org/hf-loop-antennas'
    },
    {
      title: 'National Bureau of Standards Circular 74 — Radio Instruments and Measurements',
      url: 'https://www.govinfo.gov/content/pkg/GOVPUB-C13-87343a166130cebe2f398530347d772d/pdf/GOVPUB-C13-87343a166130cebe2f398530347d772d.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function resonantCapacitancePicofarads(frequencyMHz: number, inductanceMicrohenries: number) {
  const frequencyHz = frequencyMHz * 1_000_000;
  const inductanceHenries = inductanceMicrohenries * 1e-6;
  return 1e12 / (4 * Math.PI ** 2 * frequencyHz ** 2 * inductanceHenries);
}

export function calculateSmallTransmittingLoop(input: SmallTransmittingLoopInput) {
  inRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower frequency');
  inRange(input.upperFrequencyMHz, 0.001, 300_000, 'Upper frequency');
  if (input.upperFrequencyMHz < input.lowerFrequencyMHz) throw new RangeError('Upper frequency must be at or above the lower frequency.');
  inRange(input.circumferenceMetres, 0.001, 100_000, 'Loop circumference');
  inRange(input.measuredInductanceMicrohenries, 0.000_001, 1_000_000, 'Measured loop inductance');
  inRange(input.strayCapacitancePicofarads, 0, 1_000_000_000, 'Stray capacitance');
  inRange(input.capacitorMinimumPicofarads, 0, 1_000_000_000, 'Capacitor minimum');
  inRange(input.capacitorMaximumPicofarads, 0.001, 1_000_000_000, 'Capacitor maximum');
  if (input.capacitorMaximumPicofarads < input.capacitorMinimumPicofarads) throw new RangeError('Capacitor maximum must be at or above the capacitor minimum.');

  const diameterMetres = input.circumferenceMetres / Math.PI;
  const areaSquareMetres = Math.PI * (diameterMetres / 2) ** 2;
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowerFrequencyMHz * 1_000_000);
  const upperWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.upperFrequencyMHz * 1_000_000);
  const maximumSmallLoopDiameterMetres = upperWavelengthMetres / 16;
  const lowerTotalCapacitancePicofarads = resonantCapacitancePicofarads(input.lowerFrequencyMHz, input.measuredInductanceMicrohenries);
  const upperTotalCapacitancePicofarads = resonantCapacitancePicofarads(input.upperFrequencyMHz, input.measuredInductanceMicrohenries);
  const centreFrequencyMHz = Math.sqrt(input.lowerFrequencyMHz * input.upperFrequencyMHz);
  const centreTotalCapacitancePicofarads = resonantCapacitancePicofarads(centreFrequencyMHz, input.measuredInductanceMicrohenries);
  const minimumRequiredVariableCapacitancePicofarads = upperTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const maximumRequiredVariableCapacitancePicofarads = lowerTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const centreRequiredVariableCapacitancePicofarads = centreTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const positiveTuningCapacitance = minimumRequiredVariableCapacitancePicofarads > 0;
  const capacitorCoversRange = positiveTuningCapacitance
    && input.capacitorMinimumPicofarads <= minimumRequiredVariableCapacitancePicofarads
    && input.capacitorMaximumPicofarads >= maximumRequiredVariableCapacitancePicofarads;
  const warnings: string[] = [];
  if (diameterMetres >= maximumSmallLoopDiameterMetres) warnings.push('The loop is not under the ARRL one-sixteenth-wavelength diameter boundary at the upper frequency.');
  if (!positiveTuningCapacitance) warnings.push('Entered parallel fixed or stray capacitance equals or exceeds the total capacitance required at the upper frequency.');
  if (!capacitorCoversRange) warnings.push('The entered variable-capacitor range does not cover the complete requested tuning range.');

  return {
    ...input,
    wavelengthMetres,
    upperWavelengthMetres,
    centreFrequencyMHz,
    diameterMetres,
    areaSquareMetres,
    maximumSmallLoopDiameterMetres,
    diameterWavelengthRatioAtLowerFrequency: diameterMetres / wavelengthMetres,
    diameterWavelengthRatioAtUpperFrequency: diameterMetres / upperWavelengthMetres,
    isUnderArrlSmallLoopBoundary: diameterMetres < maximumSmallLoopDiameterMetres,
    lowerTotalCapacitancePicofarads,
    upperTotalCapacitancePicofarads,
    centreTotalCapacitancePicofarads,
    minimumRequiredVariableCapacitancePicofarads,
    maximumRequiredVariableCapacitancePicofarads,
    centreRequiredVariableCapacitancePicofarads,
    tuningCapacitancePositive: positiveTuningCapacitance,
    capacitorCoversRange,
    idealCentreSensitivityKilohertzPerPicofarad: centreFrequencyMHz * 1_000 / (2 * centreTotalCapacitancePicofarads),
    warnings
  };
}
