/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface PhasedWireCollinearInput {
  frequencyMHz: number;
  elementCount: number;
  radiatorCorrectionFactor: number;
  radiatorTrimAllowancePercent: number;
  phasingLineVelocityFactor: number;
  phasingStubTrimAllowancePercent: number;
}

export const PHASED_WIRE_COLLINEAR_MODEL = {
  id: 'half-wave-phased-wire-collinear',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'US Navy NEETS Module 10 — Collinear Arrays',
      url: 'https://oemcomm.org/wp-content/uploads/2020/02/NEETS-Module-10-Propagation-Transmission-Lines-and-Antennas-NAVEDTRA-14182A-2012-edition.pdf'
    },
    {
      title: 'QST, March 1989 — Collinear Phased Antennas for the HF Bands',
      url: 'https://www.worldradiohistory.com/Archive-DX/QST/80s/QST-1989-03.pdf'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function calculatePhasedWireCollinear(input: PhasedWireCollinearInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  if (!Number.isInteger(input.elementCount) || input.elementCount < 2 || input.elementCount > 8) {
    throw new RangeError('Radiating-section count must be an integer between 2 and 8.');
  }
  finiteRange(input.radiatorCorrectionFactor, 0.5, 1, 'Radiator correction factor');
  finiteRange(input.radiatorTrimAllowancePercent, 0, 25, 'Radiator trim allowance');
  finiteRange(input.phasingLineVelocityFactor, 0.5, 1, 'Phasing-line velocity factor');
  finiteRange(input.phasingStubTrimAllowancePercent, 0, 25, 'Phasing-stub trim allowance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const resonantRadiatorSectionMetres = wavelengthMetres * 0.5 * input.radiatorCorrectionFactor;
  const cutRadiatorSectionMetres = resonantRadiatorSectionMetres * (1 + input.radiatorTrimAllowancePercent / 100);
  const phasingStubElectricalLengthMetres = wavelengthMetres * 0.25;
  const resonantPhasingStubPhysicalLengthMetres = phasingStubElectricalLengthMetres * input.phasingLineVelocityFactor;
  const cutPhasingStubPhysicalLengthMetres = resonantPhasingStubPhysicalLengthMetres * (1 + input.phasingStubTrimAllowancePercent / 100);
  const phasingStubCount = input.elementCount - 1;
  const radiatingSpanMetres = cutRadiatorSectionMetres * input.elementCount;
  const totalRadiatorWireMetres = radiatingSpanMetres;
  const totalPhasingStubConductorMetres = cutPhasingStubPhysicalLengthMetres * 2 * phasingStubCount;
  const minimumConductorMetres = totalRadiatorWireMetres + totalPhasingStubConductorMetres;
  const feedModeReference = input.elementCount % 2 === 0 ? 'Balanced voltage feed' : 'Balanced current feed';
  const feedImpedanceReference = input.elementCount % 2 === 0 ? 'QST reference: over 1000 Ω' : 'QST reference: slightly over 300 Ω';
  const warnings: string[] = [];

  if (input.radiatorCorrectionFactor === 1) warnings.push('A radiator correction factor of 1.0 is a geometric half wavelength and will normally require installed shortening.');
  if (input.radiatorTrimAllowancePercent === 0) warnings.push('No radiator trimming allowance is included.');
  if (input.phasingStubTrimAllowancePercent === 0) warnings.push('No phasing-stub trimming allowance is included.');

  return {
    ...input,
    wavelengthMetres,
    resonantRadiatorSectionMetres,
    cutRadiatorSectionMetres,
    phasingStubElectricalLengthMetres,
    resonantPhasingStubPhysicalLengthMetres,
    cutPhasingStubPhysicalLengthMetres,
    phasingStubCount,
    radiatingSpanMetres,
    totalRadiatorWireMetres,
    totalPhasingStubConductorMetres,
    minimumConductorMetres,
    feedModeReference,
    feedImpedanceReference,
    warnings
  };
}
