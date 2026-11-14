/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type G5rvPreset = 'classic' | 'half-size' | 'zs6bkw' | 'custom';

export interface G5rvInput {
  preset: G5rvPreset;
  inspectionFrequencyMHz: number;
  matchingSectionVelocityFactor: number;
  matchingSectionImpedanceOhms: number;
  customRadiatorLengthMetres: number;
  customMatchingSectionElectricalLengthMetres: number;
}

interface G5rvPresetDefinition {
  label: string;
  radiatorLengthMetres: number;
  matchingSectionElectricalLengthMetres: number;
  bandContext: string;
}

export const G5RV_PRESETS: Record<Exclude<G5rvPreset, 'custom'>, G5rvPresetDefinition> = {
  classic: {
    label: 'Classic full-size G5RV',
    radiatorLengthMetres: 31.1,
    matchingSectionElectricalLengthMetres: 10.36,
    bandContext: 'Designed around 20 m; use a suitable matching network and verify every other intended band.'
  },
  'half-size': {
    label: 'Half-size G5RV',
    radiatorLengthMetres: 15.55,
    matchingSectionElectricalLengthMetres: 5.18,
    bandContext: 'A geometrically scaled starting point; tuner range and usable bands must be established on the installed system.'
  },
  zs6bkw: {
    label: 'ZS6BKW / G0GSF',
    radiatorLengthMetres: 28.5,
    matchingSectionElectricalLengthMetres: 13.3,
    bandContext: 'Published low-SWR context: 40, 20, 17, 12, and 10 m; an ATU is still expected on 80, 30, and 15 m.'
  }
};

export const G5RV_MODEL = {
  id: 'g5rv-family-system',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — Antenna designer Louis Varney, G5RV, SK',
      url: 'https://www.arrl.org/arrlletter?issue=2000-06-30'
    },
    {
      title: 'RSGB — Successful Wire Antennas sample: G5RV and ZS6BKW',
      url: 'https://www.rsgbshop.org/acatalog/PDF/Successful_Wire%20Ant_sample.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculateG5rv(input: G5rvInput) {
  inRange(input.inspectionFrequencyMHz, 0.001, 300_000, 'Inspection frequency');
  inRange(input.matchingSectionVelocityFactor, 0.5, 1, 'Matching-section velocity factor');
  inRange(input.matchingSectionImpedanceOhms, 200, 800, 'Matching-section characteristic impedance');
  inRange(input.customRadiatorLengthMetres, 0.01, 10_000, 'Custom radiator length');
  inRange(input.customMatchingSectionElectricalLengthMetres, 0.01, 10_000, 'Custom matching-section electrical length');

  const definition = input.preset === 'custom'
    ? {
        label: 'Custom G5RV-derived system',
        radiatorLengthMetres: input.customRadiatorLengthMetres,
        matchingSectionElectricalLengthMetres: input.customMatchingSectionElectricalLengthMetres,
        bandContext: 'Custom geometry: model the complete system and establish tuner range and usable bands by measurement.'
      }
    : G5RV_PRESETS[input.preset];
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.inspectionFrequencyMHz * 1_000_000);
  const matchingSectionPhysicalLengthMetres = definition.matchingSectionElectricalLengthMetres * input.matchingSectionVelocityFactor;
  const wavelengthInLineMetres = wavelengthMetres * input.matchingSectionVelocityFactor;
  const matchingSectionElectricalWavelengths = matchingSectionPhysicalLengthMetres / wavelengthInLineMetres;

  return {
    preset: input.preset,
    presetLabel: definition.label,
    radiatorLengthMetres: definition.radiatorLengthMetres,
    legLengthMetres: definition.radiatorLengthMetres / 2,
    matchingSectionElectricalLengthMetres: definition.matchingSectionElectricalLengthMetres,
    matchingSectionPhysicalLengthMetres,
    matchingSectionVelocityFactor: input.matchingSectionVelocityFactor,
    matchingSectionImpedanceOhms: input.matchingSectionImpedanceOhms,
    inspectionFrequencyMHz: input.inspectionFrequencyMHz,
    wavelengthMetres,
    wavelengthInLineMetres,
    radiatorWavelengths: definition.radiatorLengthMetres / wavelengthMetres,
    matchingSectionElectricalWavelengths,
    matchingSectionElectricalDegrees: matchingSectionElectricalWavelengths * 360,
    totalTwoConductorLineMetres: matchingSectionPhysicalLengthMetres * 2,
    minimumConductorMetres: definition.radiatorLengthMetres + matchingSectionPhysicalLengthMetres * 2,
    bandContext: definition.bandContext
  };
}
