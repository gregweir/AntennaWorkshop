/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type GroundLessonGeometry = 'horizontal-wire' | 'ground-referenced-vertical';
export type GroundLessonHeight = '0.1' | '0.25' | '0.5' | '1';
export type GroundLessonReturn = 'unspecified' | 'documented';
export type GroundLessonEnvironment = 'clear' | 'nearby-objects';

export interface GroundEffectsLessonInput {
  frequencyMHz: number;
  geometry: GroundLessonGeometry;
  heightWavelengths: GroundLessonHeight;
  returnSystem: GroundLessonReturn;
  environment: GroundLessonEnvironment;
}

export function evaluateGroundEffectsLesson(input: GroundEffectsLessonInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0 || input.frequencyMHz > 300_000) throw new RangeError('Frequency must be greater than zero and no more than 300,000 MHz.');
  if (!['horizontal-wire', 'ground-referenced-vertical'].includes(input.geometry)
    || !['0.1', '0.25', '0.5', '1'].includes(input.heightWavelengths)
    || !['unspecified', 'documented'].includes(input.returnSystem)
    || !['clear', 'nearby-objects'].includes(input.environment)) throw new TypeError('Unsupported ground-effects lesson selection.');
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const heightRatio = Number(input.heightWavelengths);
  const heightMetres = wavelengthMetres * heightRatio;
  const missingReturn = input.geometry === 'ground-referenced-vertical' && input.returnSystem === 'unspecified';
  const nearby = input.environment === 'nearby-objects';
  const headline = missingReturn
    ? 'The RF return system is an unfinished part of this vertical'
    : nearby
      ? 'Nearby objects make the installation more than antenna plus ground'
      : heightRatio <= 0.1
        ? 'At this height, ground interaction cannot be treated as a small correction'
        : 'Height in wavelengths is useful context—not a pattern prediction';
  const groundMeaning = input.geometry === 'horizontal-wire'
    ? 'Direct and ground-reflected fields can combine differently with height, soil, terrain, frequency, and direction.'
    : 'Radials, counterpoise, screen, vehicle body, or other return conductors participate in the RF circuit; earth alone is not a documented return design.';
  const objectMeaning = nearby
    ? 'Buildings, wiring, masts, trees, fences, vehicles, and sloping terrain can couple to the antenna or alter its surroundings.'
    : 'An open-site assumption is recorded, but real soil, terrain, supports, feedline routing, and distant objects still remain.';
  return {
    ...input,
    wavelengthMetres,
    heightRatio,
    heightMetres,
    status: missingReturn || nearby ? 'review-installation' as const : 'model-and-measure' as const,
    headline,
    groundMeaning,
    objectMeaning,
    checks: [
      'Record height above local ground, terrain slope, soil conditions, support materials, and nearby conductive or dielectric objects.',
      input.geometry === 'ground-referenced-vertical'
        ? 'Document radial, counterpoise, screen, body, bonding, feedline, and common-mode-control geometry.'
        : 'Document wire orientation, end heights, sag, feedline drop, support geometry, and ground clearance along the span.',
      'Measure complex impedance and common-mode current after installation; use an appropriate antenna model or field measurement for pattern claims.'
    ]
  };
}
