/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type CompactReceiveGeometry = 'flag' | 'pennant' | 'ewe';

export interface CompactReceiveInput {
  frequencyMHz: number;
  geometry: CompactReceiveGeometry;
  horizontalSpanMetres: number;
  verticalHeightMetres: number;
  bottomClearanceMetres: number;
  receiveBearingDegrees: number;
  terminationResistanceOhms: number;
  assumedAntennaImpedanceOhms: number;
  feedlineImpedanceOhms: number;
  wireCutAllowancePercent: number;
}

export const COMPACT_RECEIVE_MODEL = {
  id: 'compact-terminated-receive-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'Cunningham — Flags, Pennants and Other Ground-Independent Low-Band Receiving Antennas',
      url: 'https://om6bb.bab.sk/files/HAM%20kniznica/Magaziny/QST/07%20July%202000%20QST.pdf'
    },
    {
      title: 'Koontz — Is This Ewe for You?',
      url: 'https://noji.com/hamradio/pdf-ppt/articles/EWE-Antenna-Original.pdf'
    }
  ]
} as const;

export const COMPACT_RECEIVE_PRESETS: Record<CompactReceiveGeometry, {
  label: string;
  horizontalSpanMetres: number;
  verticalHeightMetres: number;
  bottomClearanceMetres: number;
  terminationResistanceOhms: number;
  assumedAntennaImpedanceOhms: number;
}> = {
  flag: {
    label: 'K6SE Flag starting geometry',
    horizontalSpanMetres: 8.84,
    verticalHeightMetres: 4.27,
    bottomClearanceMetres: 1.83,
    terminationResistanceOhms: 945,
    assumedAntennaImpedanceOhms: 945
  },
  pennant: {
    label: 'K6SE point-fed Pennant starting geometry',
    horizontalSpanMetres: 8.84,
    verticalHeightMetres: 4.27,
    bottomClearanceMetres: 1.83,
    terminationResistanceOhms: 860,
    assumedAntennaImpedanceOhms: 903
  },
  ewe: {
    label: 'WA2WVL 80-m EWE example',
    horizontalSpanMetres: 7.62,
    verticalHeightMetres: 3.048,
    bottomClearanceMetres: 0,
    terminationResistanceOhms: 850,
    assumedAntennaImpedanceOhms: 450
  }
};

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function compassPoint(bearingDegrees: number) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round(bearingDegrees / 22.5) % points.length];
}

export function calculateCompactReceive(input: CompactReceiveInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  if (!['flag', 'pennant', 'ewe'].includes(input.geometry)) throw new RangeError('Geometry is invalid.');
  finiteRange(input.horizontalSpanMetres, 0.1, 1_000, 'Horizontal span');
  finiteRange(input.verticalHeightMetres, 0.1, 100, 'Vertical height');
  finiteRange(input.bottomClearanceMetres, 0, 100, 'Bottom clearance');
  if (!Number.isFinite(input.receiveBearingDegrees) || input.receiveBearingDegrees < 0 || input.receiveBearingDegrees >= 360) {
    throw new RangeError('Receive bearing must be at least 0 and less than 360.');
  }
  finiteRange(input.terminationResistanceOhms, 1, 10_000, 'Termination resistance');
  finiteRange(input.assumedAntennaImpedanceOhms, 1, 10_000, 'Assumed antenna impedance');
  finiteRange(input.feedlineImpedanceOhms, 1, 1_000, 'Feedline impedance');
  finiteRange(input.wireCutAllowancePercent, 0, 25, 'Wire cut allowance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const slopingSideMetres = Math.hypot(input.horizontalSpanMetres, input.verticalHeightMetres / 2);
  const designWireLengthMetres = input.geometry === 'flag'
    ? 2 * (input.horizontalSpanMetres + input.verticalHeightMetres)
    : input.geometry === 'pennant'
      ? input.verticalHeightMetres + 2 * slopingSideMetres
      : input.horizontalSpanMetres + 2 * input.verticalHeightMetres;
  const cutWireLengthMetres = designWireLengthMetres * (1 + input.wireCutAllowancePercent / 100);
  const nullBearingDegrees = (input.receiveBearingDegrees + 180) % 360;
  const bearingRadians = input.receiveBearingDegrees * Math.PI / 180;
  const feedEastOffsetMetres = input.horizontalSpanMetres * Math.sin(bearingRadians);
  const feedNorthOffsetMetres = input.horizontalSpanMetres * Math.cos(bearingRadians);
  const impedanceTransformationRatio = input.assumedAntennaImpedanceOhms / input.feedlineImpedanceOhms;
  const transformerTurnsRatio = Math.sqrt(impedanceTransformationRatio);
  const terminationDifferencePercent = Math.abs(input.terminationResistanceOhms - input.assumedAntennaImpedanceOhms) / input.assumedAntennaImpedanceOhms * 100;
  const warnings: string[] = [];

  if (input.geometry === 'ewe') warnings.push('An EWE depends on two ground returns; soil, moisture, electrode construction, and nearby conductors can materially change its impedance and pattern.');
  if (input.geometry !== 'ewe' && input.bottomClearanceMetres === 0) warnings.push('The source Flag and Pennant are elevated, ground-independent loops; provide practical clearance and non-conductive supports.');
  if (input.geometry === 'ewe' && input.bottomClearanceMetres > 0) warnings.push('EWE bottom clearance is not used in the wire calculation because both vertical ends continue to their ground-return connections.');
  if (terminationDifferencePercent > 25) warnings.push('The entered termination differs by more than 25% from the assumed antenna impedance; model or measure the complete installed antenna before adjusting it.');
  if (input.wireCutAllowancePercent === 0) warnings.push('No connection, routing, or trimming allowance is included.');
  if (Math.max(input.horizontalSpanMetres, input.verticalHeightMetres) / wavelengthMetres > 0.25) warnings.push('The selected geometry is electrically large at the reference frequency; do not extrapolate the source low-band pattern without full-wave modelling.');

  return {
    ...input,
    wavelengthMetres,
    slopingSideMetres: input.geometry === 'pennant' ? slopingSideMetres : null,
    designWireLengthMetres,
    cutWireLengthMetres,
    horizontalSpanWavelengths: input.horizontalSpanMetres / wavelengthMetres,
    verticalHeightWavelengths: input.verticalHeightMetres / wavelengthMetres,
    receiveCompassPoint: compassPoint(input.receiveBearingDegrees),
    nullBearingDegrees,
    nullCompassPoint: compassPoint(nullBearingDegrees),
    feedEastOffsetMetres,
    feedNorthOffsetMetres,
    impedanceTransformationRatio,
    transformerTurnsRatio,
    terminationDifferencePercent,
    directionDescription: `Primary response toward the feed end at ${input.receiveBearingDegrees.toFixed(0)}° ${compassPoint(input.receiveBearingDegrees)}; principal null toward the termination at ${nullBearingDegrees.toFixed(0)}° ${compassPoint(nullBearingDegrees)}`,
    requiresGroundReturns: input.geometry === 'ewe',
    warnings
  };
}
