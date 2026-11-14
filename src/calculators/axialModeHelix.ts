/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface AxialModeHelixInput {
  frequencyMHz: number;
  circumferenceWavelengths: number;
  pitchAngleDegrees: number;
  turnCount: number;
  groundPlaneWavelengths: number;
  trimAllowancePercent: number;
  conductorWidthMillimetres: number;
  diameterToleranceMillimetres: number;
  turnSpacingToleranceMillimetres: number;
  feedlineImpedanceOhms: number;
}

export const AXIAL_MODE_HELIX_MODEL = {
  id: 'nasa-axial-mode-helix',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'NASA — Investigation of L-Band Shipboard Antennas for Maritime Satellite Applications',
      url: 'https://ntrs.nasa.gov/api/citations/19720016511/downloads/19720016511.pdf'
    },
    {
      title: 'NASA — Structurally Integrated Antenna Concepts for HALE UAVs',
      url: 'https://ntrs.nasa.gov/api/citations/20060051786/downloads/20060051786.pdf?attachment=true'
    },
    {
      title: 'NASA — Experimental L-Band SST Satellite Communications/Surveillance Terminal Study, Volume IV',
      url: 'https://ntrs.nasa.gov/api/citations/19690011734/downloads/19690011734.pdf'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculateAxialModeHelix(input: AxialModeHelixInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.circumferenceWavelengths, 0.8, 1.25, 'Circumference');
  finiteRange(input.pitchAngleDegrees, 10, 20, 'Pitch angle');
  finiteRange(input.turnCount, 4, 30, 'Turn count');
  if (!Number.isInteger(input.turnCount)) throw new RangeError('Turn count must be a whole number.');
  finiteRange(input.groundPlaneWavelengths, 0.5, 3, 'Ground-plane diameter');
  finiteRange(input.trimAllowancePercent, 0, 25, 'Trim allowance');
  finiteRange(input.conductorWidthMillimetres, 0.01, 1_000, 'Conductor diameter or tape width');
  finiteRange(input.diameterToleranceMillimetres, 0, 1_000, 'Diameter tolerance');
  finiteRange(input.turnSpacingToleranceMillimetres, 0, 1_000, 'Turn-spacing tolerance');
  finiteRange(input.feedlineImpedanceOhms, 1, 2_000, 'Feedline impedance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const circumferenceMetres = wavelengthMetres * input.circumferenceWavelengths;
  const diameterMetres = circumferenceMetres / Math.PI;
  const pitchAngleRadians = input.pitchAngleDegrees * Math.PI / 180;
  const turnSpacingMetres = circumferenceMetres * Math.tan(pitchAngleRadians);
  const turnSpacingWavelengths = turnSpacingMetres / wavelengthMetres;
  const axialLengthMetres = turnSpacingMetres * input.turnCount;
  const conductorPerTurnMetres = Math.hypot(circumferenceMetres, turnSpacingMetres);
  const designConductorLengthMetres = conductorPerTurnMetres * input.turnCount;
  const cutConductorLengthMetres = designConductorLengthMetres * (1 + input.trimAllowancePercent / 100);
  const groundPlaneDiameterMetres = wavelengthMetres * input.groundPlaneWavelengths;
  const conductorWidthMetres = input.conductorWidthMillimetres / 1_000;
  const conductorWidthWavelengths = conductorWidthMetres / wavelengthMetres;
  const diameterToleranceMetres = input.diameterToleranceMillimetres / 1_000;
  const diameterTolerancePercent = diameterToleranceMetres / diameterMetres * 100;
  const circumferenceChangeAtDiameterToleranceMetres = Math.PI * diameterToleranceMetres;
  const circumferenceChangeAtDiameterToleranceWavelengths = circumferenceChangeAtDiameterToleranceMetres / wavelengthMetres;
  const turnSpacingToleranceMetres = input.turnSpacingToleranceMillimetres / 1_000;
  const turnSpacingTolerancePercent = turnSpacingToleranceMetres / turnSpacingMetres * 100;
  const worstCaseAxialStackErrorMetres = turnSpacingToleranceMetres * input.turnCount;
  const turnSchedule = Array.from({ length: input.turnCount }, (_, index) => ({
    turnNumber: index + 1,
    startAxialMetres: index * turnSpacingMetres,
    endAxialMetres: (index + 1) * turnSpacingMetres,
    startConductorMetres: index * conductorPerTurnMetres,
    endConductorMetres: (index + 1) * conductorPerTurnMetres
  }));

  const estimatedHalfPowerBeamwidthDegrees = 52 / (input.circumferenceWavelengths * Math.sqrt(input.turnCount * turnSpacingWavelengths));
  const estimatedFirstNullBeamwidthDegrees = 115 / (input.circumferenceWavelengths * Math.sqrt(input.turnCount * turnSpacingWavelengths));
  const estimatedGainLinear = 10 * input.circumferenceWavelengths ** 2 * input.turnCount * turnSpacingWavelengths;
  const estimatedGainDbi = 10 * Math.log10(estimatedGainLinear);
  const estimatedTerminalResistanceOhms = 140 * input.circumferenceWavelengths;
  const estimatedAxialRatio = (2 * input.turnCount + 1) / (2 * input.turnCount);
  const estimatedTerminalToFeedlineRatio = estimatedTerminalResistanceOhms / input.feedlineImpedanceOhms;
  const estimatedResistiveOnlyReflectionCoefficient = Math.abs((estimatedTerminalResistanceOhms - input.feedlineImpedanceOhms) / (estimatedTerminalResistanceOhms + input.feedlineImpedanceOhms));
  const estimatedResistiveOnlySwr = (1 + estimatedResistiveOnlyReflectionCoefficient) / (1 - estimatedResistiveOnlyReflectionCoefficient);
  const warnings: string[] = [];

  if (input.circumferenceWavelengths < 0.9 || input.circumferenceWavelengths > 1.1) warnings.push('The selected circumference is outside the narrower 0.9–1.1 λ starting region; model the complete antenna before construction.');
  if (input.pitchAngleDegrees < 12 || input.pitchAngleDegrees > 14) warnings.push('The selected pitch angle is outside the commonly documented 12–14° starting region.');
  if (input.groundPlaneWavelengths < 0.8) warnings.push('The ground plane is below the 0.8 λ diameter associated with good measured impedance and circular-polarization behaviour in the cited NASA reference.');
  if (input.trimAllowancePercent === 0) warnings.push('No conductor trimming or connection allowance is included.');
  if (conductorWidthMetres >= turnSpacingMetres) warnings.push('The entered conductor diameter or tape width equals or exceeds the centre-to-centre turn spacing.');
  if (diameterToleranceMetres >= diameterMetres) warnings.push('The entered diameter tolerance equals or exceeds the helix diameter.');
  if (turnSpacingToleranceMetres >= turnSpacingMetres) warnings.push('The entered turn-spacing tolerance equals or exceeds the target spacing.');

  return {
    ...input,
    wavelengthMetres,
    circumferenceMetres,
    diameterMetres,
    turnSpacingMetres,
    turnSpacingWavelengths,
    axialLengthMetres,
    conductorPerTurnMetres,
    designConductorLengthMetres,
    cutConductorLengthMetres,
    groundPlaneDiameterMetres,
    conductorWidthMetres,
    conductorWidthWavelengths,
    diameterToleranceMetres,
    diameterTolerancePercent,
    circumferenceChangeAtDiameterToleranceMetres,
    circumferenceChangeAtDiameterToleranceWavelengths,
    turnSpacingToleranceMetres,
    turnSpacingTolerancePercent,
    worstCaseAxialStackErrorMetres,
    turnSchedule,
    estimatedHalfPowerBeamwidthDegrees,
    estimatedFirstNullBeamwidthDegrees,
    estimatedGainLinear,
    estimatedGainDbi,
    estimatedTerminalResistanceOhms,
    estimatedAxialRatio,
    estimatedTerminalToFeedlineRatio,
    estimatedResistiveOnlyReflectionCoefficient,
    estimatedResistiveOnlySwr,
    warnings
  };
}
