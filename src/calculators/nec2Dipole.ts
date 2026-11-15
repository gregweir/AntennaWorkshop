/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type Nec2DipoleGround = 'free-space' | 'perfect-ground';

export interface Nec2DipoleInput {
  frequencyMHz: number;
  spanMetres: number;
  heightMetres: number;
  conductorDiameterMillimetres: number;
  segmentCount: number;
  ground: Nec2DipoleGround;
}

export const NEC2_DIPOLE_EXPORT_MODEL = {
  id: 'bounded-nec2-centre-fed-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-15',
  source: {
    title: 'NEC-2 Manual, Part III: User’s Guide',
    url: 'https://www.nec2.org/part_3/toc.html'
  }
} as const;

function finitePositive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be greater than zero.`);
}

function integerField(value: number, width: number) {
  const formatted = Math.trunc(value).toString();
  if (formatted.length > width) throw new RangeError('NEC-2 integer field overflow.');
  return formatted.padStart(width);
}

function floatField(value: number) {
  const fixed = value.toFixed(6);
  if (fixed.length <= 10) return fixed.padStart(10);
  const exponential = value.toExponential(3).replace('e', 'E');
  if (exponential.length > 10) throw new RangeError('NEC-2 numeric field overflow.');
  return exponential.padStart(10);
}

function controlCard(mnemonic: string, integers: number[], floats: number[]) {
  const fields = [...integers, 0, 0, 0, 0].slice(0, 4);
  return mnemonic + integerField(fields[0], 3) + fields.slice(1).map((value) => integerField(value, 5)).join('')
    + [...floats, 0, 0, 0, 0, 0, 0].slice(0, 6).map(floatField).join('');
}

export function generateNec2Dipole(input: Nec2DipoleInput) {
  finitePositive(input.frequencyMHz, 'Frequency');
  finitePositive(input.spanMetres, 'Dipole span');
  finitePositive(input.conductorDiameterMillimetres, 'Conductor diameter');
  if (!Number.isInteger(input.segmentCount) || input.segmentCount < 3 || input.segmentCount > 999 || input.segmentCount % 2 === 0) throw new RangeError('Segment count must be an odd integer from 3 through 999.');
  if (!['free-space', 'perfect-ground'].includes(input.ground)) throw new TypeError('Unsupported NEC-2 ground selection.');
  if (!Number.isFinite(input.heightMetres) || input.heightMetres < 0) throw new RangeError('Height must be zero or greater.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const segmentLengthMetres = input.spanMetres / input.segmentCount;
  const segmentLengthWavelengths = segmentLengthMetres / wavelengthMetres;
  const radiusMetres = input.conductorDiameterMillimetres / 2_000;
  const segmentLengthToRadius = segmentLengthMetres / radiusMetres;
  if (segmentLengthWavelengths > 0.05) throw new RangeError('Segment length must be no more than 0.05 wavelength for this bounded export.');
  if (segmentLengthWavelengths < 0.001) throw new RangeError('Segment length must be at least 0.001 wavelength for this bounded export.');
  if (segmentLengthToRadius < 8) throw new RangeError('Segment length must be at least eight conductor radii for the normal thin-wire kernel.');
  if (input.ground === 'perfect-ground' && input.heightMetres <= radiusMetres * 10) throw new RangeError('Height over perfect ground must exceed ten conductor radii for this bounded export.');

  const z = input.ground === 'perfect-ground' ? input.heightMetres : 0;
  const centreSegment = (input.segmentCount + 1) / 2;
  const comments = [
    'CM RadioBook Antenna Workshop bounded NEC-2 export',
    `CM Centre-fed straight dipole; ${input.frequencyMHz.toFixed(6)} MHz`,
    `CM Span ${input.spanMetres.toFixed(6)} m; diameter ${input.conductorDiameterMillimetres.toFixed(3)} mm; ${input.segmentCount} segments`,
    `CM ${input.ground === 'perfect-ground' ? `Perfect ground; wire axis ${input.heightMetres.toFixed(6)} m high` : 'Free space; height is not represented'}`,
    'CM Lossless round conductor; 1 V applied-E-field source at centre segment',
    'CM No feed gap, feedline, supports, insulation, loading, or nearby objects',
    'CE'
  ];
  const gw = 'GW' + integerField(1, 3) + integerField(input.segmentCount, 5)
    + [-input.spanMetres / 2, 0, z, input.spanMetres / 2, 0, z, radiusMetres].map(floatField).join('');
  const deck = [
    ...comments,
    gw,
    `GE${integerField(input.ground === 'perfect-ground' ? 1 : 0, 3)}`,
    controlCard('GN', [input.ground === 'perfect-ground' ? 1 : -1], []),
    controlCard('FR', [0, 1], [input.frequencyMHz, 0]),
    controlCard('EX', [0, 1, centreSegment, 0], [1, 0]),
    'XQ',
    'EN'
  ].join('\n') + '\n';
  return { ...input, wavelengthMetres, segmentLengthMetres, segmentLengthWavelengths, radiusMetres, segmentLengthToRadius, centreSegment, deck };
}
