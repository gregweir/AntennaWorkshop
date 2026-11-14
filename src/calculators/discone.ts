/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

const METRES_PER_INCH = 0.0254;

export interface DisconeInput {
  lowerFrequencyMHz: number;
  coneHalfAngleDegrees: number;
  coneRadialCount: number;
  discRadialCount: number;
  connectionAllowancePercent: number;
  radialConductorDiameterMillimetres: number;
  feedGapMillimetres: number;
  radialLengthToleranceMillimetres: number;
}

export const DISCONE_MODEL = {
  id: 'ntia-nasa-discone',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'NTIA SP-06-438 — Impulse Radio Transmitter using Time Hopping and Direct Sequence Spread Spectrum',
      url: 'https://its.ntia.gov/publications/download/SP-06-438.pdf'
    },
    {
      title: 'NASA — Portable Life Support System Antenna Study',
      url: 'https://ntrs.nasa.gov/api/citations/19660023327/downloads/19660023327.pdf'
    },
    {
      title: 'US Patent 5,608,416 — Portable rapidly erectable discone antenna',
      url: 'https://patents.google.com/patent/US5608416A/en'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function wholeNumber(value: number, minimum: number, maximum: number, label: string) {
  finiteRange(value, minimum, maximum, label);
  if (!Number.isInteger(value)) throw new RangeError(`${label} must be a whole number.`);
}

export function calculateDiscone(input: DisconeInput) {
  finiteRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower frequency');
  finiteRange(input.coneHalfAngleDegrees, 25, 40, 'Cone half-angle');
  wholeNumber(input.coneRadialCount, 6, 64, 'Cone radial count');
  wholeNumber(input.discRadialCount, 4, 64, 'Disc radial count');
  finiteRange(input.connectionAllowancePercent, 0, 25, 'Connection allowance');
  finiteRange(input.radialConductorDiameterMillimetres, 0.01, 1000, 'Radial conductor diameter');
  finiteRange(input.feedGapMillimetres, 0.01, 1000, 'Feed gap');
  finiteRange(input.radialLengthToleranceMillimetres, 0, 1000, 'Radial length tolerance');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowerFrequencyMHz * 1_000_000);
  const coneSlantLengthMetres = 2958 / input.lowerFrequencyMHz * METRES_PER_INCH;
  const discDiameterMetres = 2008 / input.lowerFrequencyMHz * METRES_PER_INCH;
  const discRadiusMetres = discDiameterMetres / 2;
  const coneHalfAngleRadians = input.coneHalfAngleDegrees * Math.PI / 180;
  const coneHeightMetres = coneSlantLengthMetres * Math.cos(coneHalfAngleRadians);
  const coneBaseRadiusMetres = coneSlantLengthMetres * Math.sin(coneHalfAngleRadians);
  const coneBaseDiameterMetres = coneBaseRadiusMetres * 2;
  const allowanceMultiplier = 1 + input.connectionAllowancePercent / 100;
  const cutConeRadialMetres = coneSlantLengthMetres * allowanceMultiplier;
  const cutDiscRadialMetres = discRadiusMetres * allowanceMultiplier;
  const totalConeRadialWireMetres = cutConeRadialMetres * input.coneRadialCount;
  const totalDiscRadialWireMetres = cutDiscRadialMetres * input.discRadialCount;
  const totalRadialWireMetres = totalConeRadialWireMetres + totalDiscRadialWireMetres;
  const radialConductorDiameterMetres = input.radialConductorDiameterMillimetres / 1000;
  const feedGapMetres = input.feedGapMillimetres / 1000;
  const radialLengthToleranceMetres = input.radialLengthToleranceMillimetres / 1000;
  const coneRadialAngularSpacingDegrees = 360 / input.coneRadialCount;
  const discRadialAngularSpacingDegrees = 360 / input.discRadialCount;
  const coneBaseCircumferenceMetres = Math.PI * coneBaseDiameterMetres;
  const discRimCircumferenceMetres = Math.PI * discDiameterMetres;
  const coneBaseArcSpacingMetres = coneBaseCircumferenceMetres / input.coneRadialCount;
  const discRimArcSpacingMetres = discRimCircumferenceMetres / input.discRadialCount;
  const warnings: string[] = [];

  if (input.connectionAllowancePercent === 0) warnings.push('No connection or trimming allowance is included for the radial elements.');
  if (input.coneRadialCount < 8 || input.discRadialCount < 8) warnings.push('A sparse radial approximation may depart substantially from the solid surfaces; model the exact wire construction.');
  if (radialConductorDiameterMetres >= Math.min(coneBaseArcSpacingMetres, discRimArcSpacingMetres)) warnings.push('The entered conductor diameter equals or exceeds the smallest rim arc spacing; review the radial count and physical layout.');
  if (feedGapMetres >= discRadiusMetres) warnings.push('The entered feed gap equals or exceeds the disc radius; review the feed-region geometry.');
  if (radialLengthToleranceMetres >= Math.min(coneSlantLengthMetres, discRadiusMetres)) warnings.push('The entered radial-length tolerance equals or exceeds the shortest finished radial; use a smaller fabrication tolerance.');

  return {
    ...input,
    wavelengthMetres,
    coneIncludedAngleDegrees: input.coneHalfAngleDegrees * 2,
    coneSlantLengthMetres,
    coneHeightMetres,
    coneBaseRadiusMetres,
    coneBaseDiameterMetres,
    discDiameterMetres,
    discRadiusMetres,
    cutConeRadialMetres,
    cutDiscRadialMetres,
    totalConeRadialWireMetres,
    totalDiscRadialWireMetres,
    totalRadialWireMetres,
    radialConductorDiameterMetres,
    radialConductorDiameterWavelengths: radialConductorDiameterMetres / wavelengthMetres,
    feedGapMetres,
    feedGapWavelengths: feedGapMetres / wavelengthMetres,
    radialLengthToleranceMetres,
    coneRadialLengthTolerancePercent: radialLengthToleranceMetres / coneSlantLengthMetres * 100,
    discRadialLengthTolerancePercent: radialLengthToleranceMetres / discRadiusMetres * 100,
    coneRadialAngularSpacingDegrees,
    discRadialAngularSpacingDegrees,
    coneBaseCircumferenceMetres,
    discRimCircumferenceMetres,
    coneBaseArcSpacingMetres,
    discRimArcSpacingMetres,
    coneSlantWavelengths: coneSlantLengthMetres / wavelengthMetres,
    discDiameterWavelengths: discDiameterMetres / wavelengthMetres,
    warnings
  };
}
