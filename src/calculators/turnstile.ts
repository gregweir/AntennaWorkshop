/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateHalfWaveDipole } from './dipole';

export type TurnstileQuadratureOrder = 'b-lags-a' | 'b-leads-a';

export interface TurnstileInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
  phasingLineVelocityFactor: number;
  quadratureOrder: TurnstileQuadratureOrder;
}

export const TURNSTILE_MODEL = {
  id: 'crossed-dipole-turnstile',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'NASA — Antenna Engineering Handbook, turnstile antenna',
      url: 'https://ntrs.nasa.gov/api/citations/19720016511/downloads/19720016511.pdf'
    },
    {
      title: 'NASA — The Canted Turnstile as an Omnidirectional Spacecraft Antenna System',
      url: 'https://ntrs.nasa.gov/api/citations/19670027843/downloads/19670027843.pdf?attachment=true'
    },
    {
      title: 'ARRL — WWV 25 MHz circularly polarized turnstile',
      url: 'https://www.arrl.org/news/view/wwv-25-mhz-signal-swapped-to-circular-polarization'
    }
  ]
} as const;

export function calculateTurnstile(input: TurnstileInput) {
  if (!Number.isFinite(input.phasingLineVelocityFactor) || input.phasingLineVelocityFactor <= 0 || input.phasingLineVelocityFactor > 1) throw new RangeError('Phasing-line velocity factor must be greater than zero and no more than one.');
  if (!['b-lags-a', 'b-leads-a'].includes(input.quadratureOrder)) throw new RangeError('Quadrature order is not supported.');

  const dipole = calculateHalfWaveDipole(input);
  const quarterWavePhaseLinePhysicalMetres = dipole.wavelengthMetres * input.phasingLineVelocityFactor / 4;
  return {
    ...input,
    wavelengthMetres: dipole.wavelengthMetres,
    resonantDipoleSpanMetres: dipole.resonantTotalMetres,
    cutDipoleSpanMetres: dipole.cutTotalMetres,
    cutArmMetres: dipole.cutLegMetres,
    totalRadiatorConductorMetres: dipole.cutTotalMetres * 2,
    orthogonalAngleDegrees: 90,
    targetRelativePhaseDegrees: input.quadratureOrder === 'b-lags-a' ? -90 : 90,
    quadratureDescription: input.quadratureOrder === 'b-lags-a' ? 'Dipole B lags Dipole A by 90°' : 'Dipole B leads Dipole A by 90°',
    pathDifferenceElectricalWavelengths: 0.25,
    quarterWavePhaseLinePhysicalMetres,
    axialDirections: 'Normal to the crossed-dipole plane in two opposite directions',
    warnings: dipole.warnings
  };
}
