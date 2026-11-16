/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type SleeveDipoleConstruction = 'rigid-sleeve' | 'foldback-braid';

export interface SleeveDipoleInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  construction: SleeveDipoleConstruction;
  feedlineOutsideDiameterMillimetres: number;
  sleeveInsideDiameterMillimetres: number;
}

export const SLEEVE_DIPOLE_MODEL = {
  id: 'sleeve-coaxial-vertical-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-15',
  sources: [
    { title: 'NTIA — Antenna System Guide', url: 'https://its.ntia.gov/umbraco/surface/download/publication?reportNumber=NIJ-202-00.pdf' },
    { title: 'NASA — ITOS Data Collection System', url: 'https://ntrs.nasa.gov/api/citations/19730008154/downloads/19730008154.pdf' },
    { title: 'ARRL — Coaxial Antenna for EmComm', url: 'https://www.arrl.org/aresletterissue?issue=2008-10-17' }
  ]
} as const;

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be greater than zero.`);
}

export function calculateSleeveDipole(input: SleeveDipoleInput) {
  positive(input.frequencyMHz, 'Frequency');
  if (!Number.isFinite(input.lengthCorrectionFactor) || input.lengthCorrectionFactor < 0.5 || input.lengthCorrectionFactor > 1.2) throw new RangeError('Length correction factor must be between 0.5 and 1.2.');
  if (!Number.isFinite(input.trimAllowancePercent) || input.trimAllowancePercent < 0 || input.trimAllowancePercent > 25) throw new RangeError('Trim allowance must be between zero and 25 percent.');
  if (input.construction !== 'rigid-sleeve' && input.construction !== 'foldback-braid') throw new TypeError('Unsupported sleeve-dipole construction.');
  positive(input.feedlineOutsideDiameterMillimetres, 'Feedline outside diameter');
  positive(input.sleeveInsideDiameterMillimetres, 'Sleeve inside diameter');
  if (input.construction === 'rigid-sleeve' && input.sleeveInsideDiameterMillimetres <= input.feedlineOutsideDiameterMillimetres) throw new RangeError('Rigid sleeve inside diameter must be greater than the feedline outside diameter.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const freeSpaceQuarterWaveMetres = wavelengthMetres / 4;
  const designElementMetres = freeSpaceQuarterWaveMetres * input.lengthCorrectionFactor;
  const cutElementMetres = designElementMetres * (1 + input.trimAllowancePercent / 100);
  const radialClearanceMillimetres = input.construction === 'rigid-sleeve'
    ? (input.sleeveInsideDiameterMillimetres - input.feedlineOutsideDiameterMillimetres) / 2
    : null;
  const warnings = [
    'The coaxial cable velocity factor does not set these external quarter-wave surfaces; tune the completed antenna in its final support and weatherproofing.',
    'The sleeve is the lower dipole element and intended feedline-current boundary, not proof that common-mode current is absent; measure the installed feedline.'
  ];
  if (input.construction === 'foldback-braid') warnings.push('Braid stretch, jacket dielectric, the fold, tape, and support tube can shift resonance; leave both radiating sections long and trim symmetrically.');
  if (designElementMetres > 5) warnings.push('Each element exceeds five metres; structural loading, safe support, access, and conductor loss require particular attention.');

  return {
    ...input,
    wavelengthMetres,
    freeSpaceQuarterWaveMetres,
    designUpperRadiatorMetres: designElementMetres,
    designSleeveMetres: designElementMetres,
    cutUpperRadiatorMetres: cutElementMetres,
    cutSleeveMetres: cutElementMetres,
    designOverallSpanMetres: designElementMetres * 2,
    cutMaterialTotalMetres: cutElementMetres * 2,
    radialClearanceMillimetres,
    warnings
  };
}
