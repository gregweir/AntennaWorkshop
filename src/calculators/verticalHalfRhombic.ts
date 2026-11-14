/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type VerticalHalfRhombicMode = 'open' | 'terminated';

export interface VerticalHalfRhombicInput {
  frequencyMHz: number;
  totalWireWavelengths: number;
  apexHeightMetres: number;
  forwardBearingDegrees: number;
  mode: VerticalHalfRhombicMode;
  terminationResistanceOhms: number;
  attachmentAllowancePercent: number;
}

export const VERTICAL_HALF_RHOMBIC_MODEL = {
  id: 'atp-6-02-53-vertical-half-rhombic-site-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'U.S. Army ATP 6-02.53 — vertical half-rhombic construction and termination guidance',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/0C45D378-25E0-438E-8881-749EF51DE080-1452191121290/atp6_02x53.pdf'
    },
    {
      title: 'U.S. Army STP 11-25C13-SM-TG — vertical half-rhombic field construction and counterpoise layout',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/025000CB-0B51-48DA-88F4-E2B43092925D-1274405004999/stp11_25c13.pdf'
    }
  ]
} as const;

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function normalizedBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function compassPoint(bearing: number) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(normalizedBearing(bearing) / 45) % 8];
}

export function calculateVerticalHalfRhombic(input: VerticalHalfRhombicInput) {
  finite(input.frequencyMHz, 'Frequency');
  finite(input.totalWireWavelengths, 'Total wire electrical length');
  finite(input.apexHeightMetres, 'Apex height');
  finite(input.forwardBearingDegrees, 'Forward bearing');
  finite(input.terminationResistanceOhms, 'Termination resistance');
  finite(input.attachmentAllowancePercent, 'Attachment allowance');
  if (input.frequencyMHz <= 0 || input.frequencyMHz > 30) throw new RangeError('Frequency must be above zero and no greater than 30 MHz.');
  if (!Number.isInteger(input.totalWireWavelengths) || input.totalWireWavelengths < 2 || input.totalWireWavelengths > 10) throw new RangeError('Total wire electrical length must be a whole number from 2 through 10 wavelengths.');
  if (input.apexHeightMetres < 1 || input.apexHeightMetres > 100) throw new RangeError('Apex height must be from 1 through 100 metres.');
  if (input.forwardBearingDegrees < 0 || input.forwardBearingDegrees >= 360) throw new RangeError('Forward bearing must be from 0 through 359.999 degrees.');
  if (input.mode !== 'open' && input.mode !== 'terminated') throw new RangeError('Vertical half-rhombic mode is not supported.');
  if (input.terminationResistanceOhms <= 0 || input.terminationResistanceOhms > 10_000) throw new RangeError('Termination resistance must be above zero and no greater than 10,000 ohms.');
  if (input.attachmentAllowancePercent < 0 || input.attachmentAllowancePercent > 25) throw new RangeError('Attachment allowance must be from 0 through 25 percent.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const designRadiatorMetres = 150 * (2 * input.totalWireWavelengths - 0.05) / input.frequencyMHz;
  const designLegMetres = designRadiatorMetres / 2;
  if (input.apexHeightMetres >= designLegMetres) throw new RangeError('Apex height must be less than each sloping wire leg.');
  const horizontalLegRunMetres = Math.sqrt(designLegMetres ** 2 - input.apexHeightMetres ** 2);
  const baseSpanMetres = horizontalLegRunMetres * 2;
  const slopeAngleDegrees = Math.asin(input.apexHeightMetres / designLegMetres) * 180 / Math.PI;
  const allowanceFactor = 1 + input.attachmentAllowancePercent / 100;
  const cutRadiatorMetres = designRadiatorMetres * allowanceFactor;
  const cutCounterpoiseMetres = baseSpanMetres * allowanceFactor;
  const forwardBearingDegrees = normalizedBearing(input.forwardBearingDegrees);
  const bearingRadians = forwardBearingDegrees * Math.PI / 180;
  const coordinate = (distanceMetres: number) => ({
    eastMetres: distanceMetres * Math.sin(bearingRadians),
    northMetres: distanceMetres * Math.cos(bearingRadians)
  });
  const apexCoordinate = coordinate(horizontalLegRunMetres);
  const farCoordinate = coordinate(baseSpanMetres);
  const surveyPoints = [
    { label: 'A', role: 'Feed and near ground/counterpoise end', distanceMetres: 0, bearingDegrees: null, elevationMetres: 0, eastMetres: 0, northMetres: 0 },
    { label: 'B', role: 'Apex support', distanceMetres: horizontalLegRunMetres, bearingDegrees: forwardBearingDegrees, elevationMetres: input.apexHeightMetres, ...apexCoordinate },
    { label: 'C', role: input.mode === 'terminated' ? 'Termination and far ground/counterpoise end' : 'Open far wire and counterpoise end', distanceMetres: baseSpanMetres, bearingDegrees: forwardBearingDegrees, elevationMetres: 0, ...farCoordinate }
  ];
  const reverseBearingDegrees = normalizedBearing(forwardBearingDegrees + 180);
  const warnings: string[] = [];
  if (input.apexHeightMetres < 3) warnings.push('The cited preferred support-height range is 3–7 m. ATP 6-02.53 says operation can be satisfactory as low as about 1 m, but clearances, ground interaction, loss, and pattern still require separate review.');
  if (input.apexHeightMetres > 7) warnings.push('The entered apex is above the cited 3–7 m support-height range. Treat the geometry as a site plan and model the changed height, angle, impedance, and pattern.');
  if (input.mode === 'terminated' && (input.terminationResistanceOhms < 500 || input.terminationResistanceOhms > 600)) warnings.push('ATP 6-02.53 cites a 500–600 Ω non-inductive far-end termination. The entered value is retained as an explicit assumption and must be verified with the complete antenna and ground system.');

  return {
    ...input,
    wavelengthMetres,
    designRadiatorMetres,
    designLegMetres,
    cutRadiatorMetres,
    horizontalLegRunMetres,
    baseSpanMetres,
    slopeAngleDegrees,
    designCounterpoiseMetres: baseSpanMetres,
    cutCounterpoiseMetres,
    totalPurchaseWireMetres: cutRadiatorMetres + cutCounterpoiseMetres,
    forwardBearingDegrees,
    forwardCompassPoint: compassPoint(forwardBearingDegrees),
    reverseBearingDegrees,
    reverseCompassPoint: compassPoint(reverseBearingDegrees),
    surveyPoints,
    directionDescription: input.mode === 'terminated' ? 'Forward from the feed base toward the terminated far end and distant station' : 'Bidirectional along the sloping-wire site axis',
    terminationDescription: input.mode === 'terminated' ? `${input.terminationResistanceOhms.toFixed(0)} Ω entered non-inductive far-end termination to the far ground/counterpoise end` : 'Far wire end open; no terminating resistor',
    warnings
  };
}
