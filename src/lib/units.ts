/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type UnitSystem = 'metric' | 'imperial';

const METRES_PER_FOOT = 0.3048;
const INCHES_PER_FOOT = 12;

export function metresToFeet(metres: number): number {
  return metres / METRES_PER_FOOT;
}

export function feetToMetres(feet: number): number {
  return feet * METRES_PER_FOOT;
}

export function formatLength(metres: number, unitSystem: UnitSystem): string {
  if (!Number.isFinite(metres) || metres < 0) {
    return '—';
  }

  if (unitSystem === 'metric') {
    if (metres < 1) {
      return `${(metres * 100).toFixed(1)} cm`;
    }
    return `${metres.toFixed(3)} m`;
  }

  const totalFeet = metresToFeet(metres);
  let feet = Math.floor(totalFeet);
  let inches = Math.round((totalFeet - feet) * INCHES_PER_FOOT * 8) / 8;

  if (inches === INCHES_PER_FOOT) {
    feet += 1;
    inches = 0;
  }

  const inchesText =
    inches % 1 === 0 ? inches.toFixed(0) : inches.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

  return `${feet} ft ${inchesText} in`;
}
