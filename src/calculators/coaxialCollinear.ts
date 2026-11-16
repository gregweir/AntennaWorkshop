/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type CoaxialCollinearMode = 'balanced-coco' | 'end-fed-receive';

export interface CoaxialCollinearInput {
  frequencyMHz: number;
  mode: CoaxialCollinearMode;
  sectionCount: number;
  coaxVelocityFactor: number;
  cutAllowancePercent: number;
  junctionGapMillimetres: number;
  finishedSectionToleranceMillimetres: number;
}

export const COAXIAL_COLLINEAR_MODEL = {
  id: 'coaxial-collinear-coco',
  version: '1.0.0',
  reviewedOn: '2026-11-16',
  sources: [
    { title: 'NASA — Clark Lake Radio Observatory coaxial-collinear element', url: 'https://ntrs.nasa.gov/api/citations/19750019909/downloads/19750019909.pdf?attachment=true' },
    { title: 'NASA — Directivity and spacing for coaxial-collinear elements', url: 'https://ntrs.nasa.gov/api/citations/19840019086/downloads/19840019086.pdf?attachment=true' },
    { title: 'ARRL QST — Eight-element 1090 MHz collinear vertical', url: 'https://www.arrl.org/files/file/QST/This%20Month%20in%20QST/January%202014/VirtualRadarJan2013QST.pdf' }
  ]
} as const;

function range(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
}

export function calculateCoaxialCollinear(input: CoaxialCollinearInput) {
  range(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  if (input.mode !== 'balanced-coco' && input.mode !== 'end-fed-receive') throw new TypeError('Unsupported coaxial-collinear mode.');
  if (!Number.isInteger(input.sectionCount) || input.sectionCount < 2 || input.sectionCount > 32) throw new RangeError('Coax-section count must be an integer between 2 and 32.');
  if (input.mode === 'balanced-coco' && (input.sectionCount < 4 || input.sectionCount % 2 !== 0)) throw new RangeError('Balanced COCO mode requires an even section count from 4 to 32.');
  if (input.mode === 'end-fed-receive' && input.sectionCount > 16) throw new RangeError('End-fed receiving mode supports 2 to 16 coax sections.');
  range(input.coaxVelocityFactor, 0.5, 1, 'Coax velocity factor');
  range(input.cutAllowancePercent, 0, 25, 'Cut allowance');
  range(input.junctionGapMillimetres, 0, 100, 'Junction gap');
  range(input.finishedSectionToleranceMillimetres, 0, 1_000, 'Finished-section tolerance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const coaxWavelengthMetres = wavelengthMetres * input.coaxVelocityFactor;
  const finishedHalfWaveSectionMetres = coaxWavelengthMetres / 2;
  const cutHalfWaveSectionMetres = finishedHalfWaveSectionMetres * (1 + input.cutAllowancePercent / 100);
  const junctionCount = input.sectionCount - 1;
  const totalJunctionGapMetres = junctionCount * input.junctionGapMillimetres / 1_000;
  const finishedSectionChainMetres = input.sectionCount * finishedHalfWaveSectionMetres + totalJunctionGapMetres;
  const cutCoaxForHalfWaveSectionsMetres = input.sectionCount * cutHalfWaveSectionMetres;
  const finishedQuarterWaveTerminationMetres = input.mode === 'balanced-coco' ? coaxWavelengthMetres / 4 : null;
  const cutQuarterWaveTerminationMetres = finishedQuarterWaveTerminationMetres === null ? null : finishedQuarterWaveTerminationMetres * (1 + input.cutAllowancePercent / 100);
  const terminationCount = input.mode === 'balanced-coco' ? 2 : 0;
  const terminalWhipMetres = input.mode === 'end-fed-receive' ? finishedHalfWaveSectionMetres : null;
  const nominalFinishedOverallMetres = finishedSectionChainMetres
    + (finishedQuarterWaveTerminationMetres === null ? 0 : finishedQuarterWaveTerminationMetres * terminationCount)
    + (terminalWhipMetres ?? 0);
  const totalCoaxCutMetres = cutCoaxForHalfWaveSectionsMetres + (cutQuarterWaveTerminationMetres ?? 0) * terminationCount;
  const toleranceMetres = input.finishedSectionToleranceMillimetres / 1_000;
  const possibleSectionPhaseErrorDegrees = 360 * toleranceMetres / coaxWavelengthMetres;
  const systematicChainPhaseErrorDegrees = possibleSectionPhaseErrorDegrees * input.sectionCount;
  const isPublishedArrlReference = input.mode === 'end-fed-receive'
    && Math.abs(input.frequencyMHz - 1_090) < 0.000_001
    && input.sectionCount === 8
    && Math.abs(input.coaxVelocityFactor - 0.83) < 0.000_001;
  const sectionSchedule = Array.from({ length: input.sectionCount }, (_, index) => ({
    section: index + 1,
    polarity: index % 2 === 0 ? 'A' : 'B',
    finishedTargetMetres: finishedHalfWaveSectionMetres,
    cutLengthMetres: cutHalfWaveSectionMetres,
    junctionAfter: index < input.sectionCount - 1
  }));
  const warnings = [
    'Every junction interchanges the centre conductor and shield. A continuity check cannot replace inspection for shield whiskers, unintended shorts, open connections, or unstable overlap geometry.',
    'Velocity factor sizes the electrical coax sections only. Junction capacitance, exposed conductors, cable diameter, loss, enclosure dielectric, bends, feedline routing, and supports still require modelling and measurement.',
    'This receive-only construction planner does not establish impedance, match, gain, beamwidth, sidelobes, current distribution, common-mode isolation, bandwidth, or transmit power handling.'
  ];
  if (input.mode === 'end-fed-receive' && !isPublishedArrlReference) warnings.push('This is a scaled adaptation of the documented 1090 MHz eight-section receiving build, not a source-validated design at the entered frequency, section count, or cable velocity factor.');
  if (input.mode === 'balanced-coco') warnings.push('The balanced feed, matching or tuning stubs, element orientation, height, and complete array environment must be engineered separately.');
  if (input.cutAllowancePercent === 0) warnings.push('No coax cutting reserve is included.');

  return {
    ...input,
    wavelengthMetres,
    coaxWavelengthMetres,
    finishedHalfWaveSectionMetres,
    cutHalfWaveSectionMetres,
    junctionCount,
    totalJunctionGapMetres,
    finishedSectionChainMetres,
    cutCoaxForHalfWaveSectionsMetres,
    finishedQuarterWaveTerminationMetres,
    cutQuarterWaveTerminationMetres,
    terminationCount,
    terminalWhipMetres,
    nominalFinishedOverallMetres,
    totalCoaxCutMetres,
    possibleSectionPhaseErrorDegrees,
    systematicChainPhaseErrorDegrees,
    isPublishedArrlReference,
    sectionSchedule,
    warnings
  };
}
