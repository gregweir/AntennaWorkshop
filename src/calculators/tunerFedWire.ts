/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type TunerFedWireFeedMode = 'tuner-at-wire' | 'remote-matching-point';

export interface TunerFedWireInput {
  referenceFrequencyMHz: number;
  radiatorLengthMetres: number;
  counterpoiseLengthMetres: number;
  wireAllowancePercent: number;
  feedMode: TunerFedWireFeedMode;
  feedlineLengthMetres: number;
}

export const W3EDP_PRESET = {
  radiatorLengthMetres: 25.908,
  counterpoiseLengthMetres: 5.1816
} as const;

export const TUNER_FED_WIRE_MODEL = {
  id: 'tuner-fed-end-fed-wire',
  version: '1.0.0',
  reviewedOn: '2026-11-15',
  sources: [
    { title: 'RSGB — End-fed wire antennas', url: 'https://rsgb.org/main/get-started-in-amateur-radio/antennas/end-fed-wire-antennas/' },
    { title: 'ARRL — Wire Antennas for the Beginner', url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/0683033.pdf' },
    { title: 'ARRL — Random Wires', url: 'https://www.arrl.org/random-wires' }
  ]
} as const;

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be greater than zero.`);
}

export function calculateTunerFedWire(input: TunerFedWireInput) {
  positive(input.referenceFrequencyMHz, 'Reference frequency');
  positive(input.radiatorLengthMetres, 'Radiator length');
  positive(input.counterpoiseLengthMetres, 'Counterpoise length');
  if (!Number.isFinite(input.wireAllowancePercent) || input.wireAllowancePercent < 0 || input.wireAllowancePercent > 25) throw new RangeError('Wire allowance must be between zero and 25 percent.');
  if (input.feedMode !== 'tuner-at-wire' && input.feedMode !== 'remote-matching-point') throw new TypeError('Unsupported matching-point arrangement.');
  if (!Number.isFinite(input.feedlineLengthMetres) || input.feedlineLengthMetres < 0) throw new RangeError('Feedline length must be zero or greater.');
  if (input.feedMode === 'remote-matching-point' && input.feedlineLengthMetres <= 0) throw new RangeError('Remote matching requires a feedline length greater than zero.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.referenceFrequencyMHz * 1_000_000);
  const quarterWaveMetres = wavelengthMetres / 4;
  const allowanceMultiplier = 1 + input.wireAllowancePercent / 100;
  const radiatorWavelengths = input.radiatorLengthMetres / wavelengthMetres;
  const counterpoiseWavelengths = input.counterpoiseLengthMetres / wavelengthMetres;
  const isW3edpPreset = Math.abs(input.radiatorLengthMetres - W3EDP_PRESET.radiatorLengthMetres) < 0.000_001 && Math.abs(input.counterpoiseLengthMetres - W3EDP_PRESET.counterpoiseLengthMetres) < 0.000_001;
  const warnings: string[] = [];
  if (radiatorWavelengths < 0.25) warnings.push('The radiator is under one quarter wavelength at the reference frequency; efficiency and tuner range require particular scrutiny.');
  if (counterpoiseWavelengths < 0.25) warnings.push(isW3edpPreset
    ? 'The documented W3EDP uses a 17 ft counterpoise, shorter than the ARRL general quarter-wave starting recommendation; verify the complete installed system.'
    : 'The counterpoise is shorter than the ARRL general quarter-wave starting recommendation at the reference frequency.');
  if (input.feedMode === 'tuner-at-wire') warnings.push('The radiating wire and high RF voltage reach the operating position; use low power, controlled access, and careful EMC and touch-current checks.');
  else warnings.push('The coax may operate with substantial mismatch unless the remote network presents an appropriate load; include mismatch loss and common-mode current in commissioning.');

  return {
    ...input,
    wavelengthMetres,
    quarterWaveMetres,
    radiatorWavelengths,
    counterpoiseWavelengths,
    radiatorCutMetres: input.radiatorLengthMetres * allowanceMultiplier,
    counterpoiseCutMetres: input.counterpoiseLengthMetres * allowanceMultiplier,
    totalWireToCutMetres: (input.radiatorLengthMetres + input.counterpoiseLengthMetres) * allowanceMultiplier,
    isW3edpPreset,
    warnings
  };
}
