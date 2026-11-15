/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface ElectricalLengthSample {
  frequencyMHz: number;
  wavelengthMetres: number;
  halfWaveMetres: number;
}

export interface ElectricalLengthComparison {
  base: ElectricalLengthSample;
  comparison: ElectricalLengthSample;
  frequencyMultiplier: number;
  halfWaveLengthRatio: number;
  halfWaveChangePercent: number;
}

function sample(frequencyMHz: number): ElectricalLengthSample {
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (frequencyMHz * 1_000_000);
  return { frequencyMHz, wavelengthMetres, halfWaveMetres: wavelengthMetres / 2 };
}

export function calculateElectricalLengthComparison(baseFrequencyMHz: number, frequencyMultiplier: number): ElectricalLengthComparison {
  if (!Number.isFinite(baseFrequencyMHz) || baseFrequencyMHz <= 0) throw new RangeError('Base frequency must be greater than zero.');
  if (!Number.isFinite(frequencyMultiplier) || frequencyMultiplier < 0.5 || frequencyMultiplier > 2) throw new RangeError('Frequency multiplier must be between 0.5 and 2.');
  const base = sample(baseFrequencyMHz);
  const comparison = sample(baseFrequencyMHz * frequencyMultiplier);
  const halfWaveLengthRatio = comparison.halfWaveMetres / base.halfWaveMetres;
  return {
    base,
    comparison,
    frequencyMultiplier,
    halfWaveLengthRatio,
    halfWaveChangePercent: (halfWaveLengthRatio - 1) * 100
  };
}
