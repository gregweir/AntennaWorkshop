/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateHalfWaveDipole } from './dipole';

export type HaloShape = 'circular' | 'square';

export interface HaloInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  shape: HaloShape;
  farEndGapMetres: number;
  feedpointGapMetres: number;
}

export const HALO_MODEL = {
  id: 'open-ring-halo',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — General Class License Manual, halo definition',
      url: 'https://www.arrl.org/files/file/General%20Class%20License%20Manual/GCLM%209th%20ed%20Chap%2010%20-%20Version%201_0.pdf'
    },
    {
      title: 'ARRL — Single-Band Dipoles',
      url: 'https://www.arrl.org/single-band-dipoles'
    }
  ]
} as const;

function positiveFinite(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be greater than zero.`);
}

export function calculateHalo(input: HaloInput) {
  if (!['circular', 'square'].includes(input.shape)) throw new RangeError('Halo shape is not supported.');
  positiveFinite(input.farEndGapMetres, 'Far-end gap');
  positiveFinite(input.feedpointGapMetres, 'Feedpoint gap');

  const dipole = calculateHalfWaveDipole(input);
  const totalOpeningMetres = input.farEndGapMetres + input.feedpointGapMetres;
  if (totalOpeningMetres >= dipole.cutTotalMetres) throw new RangeError('Combined gaps must be shorter than the cut radiator.');

  const referencePerimeterMetres = dipole.cutTotalMetres + totalOpeningMetres;
  const circularCentrelineDiameterMetres = referencePerimeterMetres / Math.PI;
  const squareCentrelineSideMetres = referencePerimeterMetres / 4;
  const circularFarEndGapChordMetres = circularCentrelineDiameterMetres * Math.sin(Math.PI * input.farEndGapMetres / referencePerimeterMetres);
  const circularFeedpointGapChordMetres = circularCentrelineDiameterMetres * Math.sin(Math.PI * input.feedpointGapMetres / referencePerimeterMetres);
  const totalOpeningPercent = totalOpeningMetres / referencePerimeterMetres * 100;
  const warnings = [...dipole.warnings];
  if (totalOpeningPercent > 10) warnings.push('The two openings exceed 10% of the reference perimeter; this simple bent-dipole layout needs full modelling before construction.');

  return {
    ...input,
    wavelengthMetres: dipole.wavelengthMetres,
    resonantRadiatorMetres: dipole.resonantTotalMetres,
    cutRadiatorMetres: dipole.cutTotalMetres,
    eachArmMetres: dipole.cutLegMetres,
    totalOpeningMetres,
    totalOpeningPercent,
    referencePerimeterMetres,
    circularCentrelineDiameterMetres,
    circularFarEndGapChordMetres,
    circularFeedpointGapChordMetres,
    squareCentrelineSideMetres,
    plannedWidthMetres: input.shape === 'circular' ? circularCentrelineDiameterMetres : squareCentrelineSideMetres,
    shapeLabel: input.shape === 'circular' ? 'Circular halo' : 'Square halo (squalo)',
    warnings
  };
}
