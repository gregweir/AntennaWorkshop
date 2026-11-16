/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface LinkedDipoleInput {
  frequenciesMHz: number[];
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  linkGapMillimetres: number;
  includedAngleDegrees: number;
}

export const LINKED_DIPOLE_MODEL = {
  id: 'linked-multiband-dipole',
  version: '1.0.0',
  reviewedOn: '2026-11-16',
  sources: [
    { title: 'ARRL — Single-Band Dipoles', url: 'https://www.arrl.org/single-band-dipoles' },
    { title: 'SOTABEAMS — Band Hopper linked-dipole instructions', url: 'https://www.sotabeams.co.uk/content/Band%20Hoppers%20Instructions.pdf' },
    { title: 'SOTABEAMS — Linked Dipole Kit instructions', url: 'https://www.sotabeams.co.uk/content/LDK%20Instructions.pdf' }
  ]
} as const;

function range(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
}

export function calculateLinkedDipole(input: LinkedDipoleInput) {
  if (!Array.isArray(input.frequenciesMHz) || input.frequenciesMHz.length < 2 || input.frequenciesMHz.length > 5) throw new RangeError('A linked dipole requires two to five design frequencies.');
  input.frequenciesMHz.forEach((frequency) => range(frequency, 0.001, 300_000, 'Frequency'));
  if (new Set(input.frequenciesMHz.map((frequency) => frequency.toFixed(9))).size !== input.frequenciesMHz.length) throw new RangeError('Each linked-dipole configuration requires a distinct design frequency.');
  range(input.lengthCorrectionFactor, 0.5, 1, 'Length correction factor');
  range(input.trimAllowancePercent, 0, 25, 'Trim allowance');
  range(input.linkGapMillimetres, 0, 500, 'Link gap');
  range(input.includedAngleDegrees, 60, 180, 'Included angle');

  const bands = [...input.frequenciesMHz].sort((a, b) => b - a).map((frequencyMHz) => {
    const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (frequencyMHz * 1_000_000);
    const finishedTotalMetres = wavelengthMetres * 0.5 * input.lengthCorrectionFactor;
    return { frequencyMHz, wavelengthMetres, finishedTotalMetres, finishedLegMetres: finishedTotalMetres / 2 };
  });
  const allowanceMultiplier = 1 + input.trimAllowancePercent / 100;
  const segments = bands.map((band, index) => {
    const previousLegMetres = index === 0 ? 0 : bands[index - 1].finishedLegMetres;
    const finishedEachSideMetres = band.finishedLegMetres - previousLegMetres;
    return {
      id: `S${index + 1}`,
      role: index === 0 ? 'Inner segment' : `Extension ${index}`,
      reachesFrequencyMHz: band.frequencyMHz,
      finishedEachSideMetres,
      cutEachSideMetres: finishedEachSideMetres * allowanceMultiplier,
      linkAfter: index < bands.length - 1
    };
  });
  const configurations = bands.map((band, index) => ({
    frequencyMHz: band.frequencyMHz,
    finishedTotalMetres: band.finishedTotalMetres,
    cutTotalThroughActiveSegmentsMetres: 2 * segments.slice(0, index + 1).reduce((total, segment) => total + segment.cutEachSideMetres, 0),
    closedLinksPerSide: index,
    firstOpenLinkFromFeed: index < bands.length - 1 ? index + 1 : null,
    state: index === bands.length - 1 ? 'Close every link on both sides' : index === 0 ? 'Open the first link on both sides' : `Close links 1–${index}; open link ${index + 1} on both sides`
  }));
  const linkCountPerSide = bands.length - 1;
  const linkGapMetres = input.linkGapMillimetres / 1_000;
  const longestCutLegMetres = segments.reduce((total, segment) => total + segment.cutEachSideMetres, 0);
  const longestMechanicalLegRouteMetres = longestCutLegMetres + linkCountPerSide * linkGapMetres;
  const halfAngleRadians = input.includedAngleDegrees / 2 * Math.PI / 180;
  const supportSpanMetres = 2 * longestMechanicalLegRouteMetres * Math.sin(halfAngleRadians);
  const endpointDropMetres = longestMechanicalLegRouteMetres * Math.cos(halfAngleRadians);
  const warnings = [
    'Open or close the matching link on both legs before applying RF. Never change links while transmitting.',
    'The entered link gap records mechanical layout only. Clip overlap, pigtails, knots, insulators, and exposed conductor change electrical length and must be included during tuning.',
    'Tune the shortest, highest-frequency configuration first, then close the next symmetric link pair and work outward toward the lowest frequency.',
    'A common feedpoint does not prove current balance or a suitable match. Measure every linked state in the final support geometry and provide appropriate common-mode control.',
    'This planner does not establish installed impedance, SWR, bandwidth, efficiency, pattern, link contact heating, power handling, structural capacity, or exposure.'
  ];
  if (input.trimAllowancePercent === 0) warnings.push('No trimming allowance is included.');

  return {
    ...input,
    bands,
    segments,
    configurations,
    wavelengthMetres: bands[bands.length - 1].wavelengthMetres,
    highestFrequencyMHz: bands[0].frequencyMHz,
    lowestFrequencyMHz: bands[bands.length - 1].frequencyMHz,
    linkCountPerSide,
    totalLinkCount: linkCountPerSide * 2,
    linkGapMetres,
    longestCutLegMetres,
    longestMechanicalLegRouteMetres,
    longestCutSpanMetres: longestCutLegMetres * 2,
    totalWireCutMetres: longestCutLegMetres * 2,
    supportSpanMetres,
    endpointDropMetres,
    warnings
  };
}
