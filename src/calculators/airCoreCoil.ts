/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface AirCoreCoilInput {
  targetInductanceMicrohenries: number;
  formOutsideDiameterMillimetres: number;
  windingLengthMillimetres: number;
  wireOutsideDiameterMillimetres: number;
}

export const AIR_CORE_COIL_MODEL = {
  id: 'arrl-single-layer-air-core-coil',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL QST — Homebrew Your Own Inductors!',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/9708033.pdf'
    },
    {
      title: 'NBS Circular 74 — Radio Instruments and Measurements',
      url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/circ/nbscircular74.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function inductanceMicrohenries(turns: number, meanDiameterInches: number, windingLengthInches: number) {
  return meanDiameterInches ** 2 * turns ** 2 / (18 * meanDiameterInches + 40 * windingLengthInches);
}

export function calculateAirCoreCoil(input: AirCoreCoilInput) {
  inRange(input.targetInductanceMicrohenries, 0.001, 1_000_000, 'Target inductance');
  inRange(input.formOutsideDiameterMillimetres, 1, 10_000, 'Form outside diameter');
  inRange(input.windingLengthMillimetres, 1, 100_000, 'Winding length');
  inRange(input.wireOutsideDiameterMillimetres, 0.01, 1_000, 'Wire outside diameter');

  const meanCoilDiameterMillimetres = input.formOutsideDiameterMillimetres + input.wireOutsideDiameterMillimetres;
  const lengthToDiameterRatio = input.windingLengthMillimetres / meanCoilDiameterMillimetres;
  if (lengthToDiameterRatio < 0.4) {
    throw new RangeError('Winding length must be at least 0.4 times the mean coil diameter for this approximation.');
  }

  const meanDiameterInches = meanCoilDiameterMillimetres / 25.4;
  const windingLengthInches = input.windingLengthMillimetres / 25.4;
  const idealTurns = Math.sqrt(
    input.targetInductanceMicrohenries * (18 * meanDiameterInches + 40 * windingLengthInches)
  ) / meanDiameterInches;
  const roundedTurns = Math.max(1, Math.round(idealTurns));
  const estimatedInductanceMicrohenries = inductanceMicrohenries(roundedTurns, meanDiameterInches, windingLengthInches);
  const turnPitchMillimetres = input.windingLengthMillimetres / roundedTurns;
  const clearSpacingMillimetres = turnPitchMillimetres - input.wireOutsideDiameterMillimetres;
  const closeWoundLengthMillimetres = roundedTurns * input.wireOutsideDiameterMillimetres;
  const circumferenceMillimetres = Math.PI * meanCoilDiameterMillimetres;
  const approximateWindingWireLengthMillimetres = roundedTurns * Math.hypot(circumferenceMillimetres, turnPitchMillimetres);

  return {
    targetInductanceMicrohenries: input.targetInductanceMicrohenries,
    meanCoilDiameterMillimetres,
    windingLengthMillimetres: input.windingLengthMillimetres,
    wireOutsideDiameterMillimetres: input.wireOutsideDiameterMillimetres,
    lengthToDiameterRatio,
    idealTurns,
    roundedTurns,
    estimatedInductanceMicrohenries,
    targetDifferencePercent: (estimatedInductanceMicrohenries / input.targetInductanceMicrohenries - 1) * 100,
    turnPitchMillimetres,
    clearSpacingMillimetres,
    closeWoundLengthMillimetres,
    fitsSingleLayer: clearSpacingMillimetres >= 0,
    turnsPerInch: roundedTurns / windingLengthInches,
    approximateWindingWireLengthMetres: approximateWindingWireLengthMillimetres / 1_000
  };
}
