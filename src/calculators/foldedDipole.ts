/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateHalfWaveDipole } from './dipole';

export interface FoldedDipoleInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  conductorSpacingMetres: number;
  assumedSingleDipoleResistanceOhms: number;
  plannedFeedlineImpedanceOhms: number;
}

export const FOLDED_DIPOLE_MODEL = {
  id: 'equal-conductor-folded-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'NTIA — Antenna Models for Electromagnetic Compatibility Analyses',
      url: 'https://www.ntia.doc.gov/files/ntia/publications/antenna_models_report_tm-13-489.pdf'
    },
    {
      title: 'ARRL — Extra Class folded-dipole reference',
      url: 'https://www.arrl.org/files/file/Instructor%20resources/Tiley%2C%20AD7FO/2016%20Extra%20Class%20rev%201%209.pdf'
    },
    {
      title: 'NOAA — Half-wavelength folded dipole construction example',
      url: 'https://www.weather.gov/gyx/nwrhist.html'
    }
  ]
} as const;

function positiveFinite(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be greater than zero.`);
}

export function calculateFoldedDipole(input: FoldedDipoleInput) {
  positiveFinite(input.conductorSpacingMetres, 'Conductor spacing');
  positiveFinite(input.assumedSingleDipoleResistanceOhms, 'Reference dipole resistance');
  positiveFinite(input.plannedFeedlineImpedanceOhms, 'Planned feedline impedance');

  const dipole = calculateHalfWaveDipole(input);
  const nominalImpedanceMultiplier = 4;
  const nominalFoldedResistanceOhms = input.assumedSingleDipoleResistanceOhms * nominalImpedanceMultiplier;
  const assumedImpedanceRatioToFeedline = nominalFoldedResistanceOhms / input.plannedFeedlineImpedanceOhms;
  const assumedTurnsRatioToFeedline = Math.sqrt(assumedImpedanceRatioToFeedline);
  const assumedDirectSWR = Math.max(assumedImpedanceRatioToFeedline, 1 / assumedImpedanceRatioToFeedline);
  const conductorSpacingWavelengths = input.conductorSpacingMetres / dipole.wavelengthMetres;
  const warnings = [...dipole.warnings];
  if (conductorSpacingWavelengths > 0.05) warnings.push('The entered parallel spacing exceeds 0.05 wavelength; use a full antenna model rather than the thin folded-dipole approximation.');

  return {
    ...input,
    wavelengthMetres: dipole.wavelengthMetres,
    resonantSpanMetres: dipole.resonantTotalMetres,
    cutSpanMetres: dipole.cutTotalMetres,
    eachParallelConductorMetres: dipole.cutTotalMetres,
    eachHalfFromCentreMetres: dipole.cutLegMetres,
    conductorSpacingWavelengths,
    approximateTotalConductorMetres: 2 * dipole.cutTotalMetres + 2 * input.conductorSpacingMetres,
    nominalImpedanceMultiplier,
    nominalFoldedResistanceOhms,
    assumedImpedanceRatioToFeedline,
    assumedTurnsRatioToFeedline,
    assumedDirectSWR,
    warnings
  };
}
