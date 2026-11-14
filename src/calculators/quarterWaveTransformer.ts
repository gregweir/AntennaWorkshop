/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface QuarterWaveTransformerInput {
  frequencyMHz: number;
  sourceResistanceOhms: number;
  loadResistanceOhms: number;
  velocityFactor: number;
  trimAllowancePercent: number;
}

export const QUARTER_WAVE_TRANSFORMER_MODEL = {
  id: 'single-section-quarter-wave-transformer',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'Keysight — Matching Network Yin-Yang, Part 2',
      url: 'https://www.keysight.com/gb/en/assets/7018-01880/article-reprints/5989-9012.pdf'
    },
    {
      title: 'North Carolina State University — Special Cases of Lossless Terminated Lines',
      url: 'https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Electronics/Fundamentals_of_Microwave_and_RF_Design_(Steer)/03%3A_Transmission_Lines/3.04%3A_Special_Cases_of_Lossless_Terminated_Lines'
    },
    {
      title: 'ARRL — A Simple Broadband Dipole for 80 Meters',
      url: 'https://www.arrl.org/files/file/Antenna%20Book%20Supplemental%20Files/23rd%20Edition/A%20Simple%20Broadband%20Dipole%20for%2080%20Meters%20-%20AI1H%20-%20QST%20Sep%201993.pdf'
    }
  ]
} as const;

const SPEED_OF_LIGHT_METRES_PER_SECOND = 299_792_458;

function finiteRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

export function calculateQuarterWaveTransformer(input: QuarterWaveTransformerInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.sourceResistanceOhms, 0.01, 1_000_000, 'Source resistance');
  finiteRange(input.loadResistanceOhms, 0.01, 1_000_000, 'Load resistance');
  finiteRange(input.velocityFactor, 0.01, 1, 'Velocity factor');
  finiteRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');

  const freeSpaceWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const guidedWavelengthMetres = freeSpaceWavelengthMetres * input.velocityFactor;
  const physicalQuarterWaveMetres = guidedWavelengthMetres / 4;
  const cutLengthMetres = physicalQuarterWaveMetres * (1 + input.trimAllowancePercent / 100);
  const requiredCharacteristicImpedanceOhms = Math.sqrt(input.sourceResistanceOhms * input.loadResistanceOhms);
  const idealInputResistanceOhms = requiredCharacteristicImpedanceOhms ** 2 / input.loadResistanceOhms;
  const oneWayDelayNanoseconds = 1_000 / (4 * input.frequencyMHz);

  return {
    ...input,
    freeSpaceWavelengthMetres,
    guidedWavelengthMetres,
    physicalQuarterWaveMetres,
    cutLengthMetres,
    requiredCharacteristicImpedanceOhms,
    idealInputResistanceOhms,
    resistanceRatio: input.loadResistanceOhms / input.sourceResistanceOhms,
    electricalLengthDegrees: 90 as const,
    oneWayDelayNanoseconds
  };
}
