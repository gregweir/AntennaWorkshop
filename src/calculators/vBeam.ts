/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type VBeamLegWavelengths = 1 | 2 | 3 | 4 | 6 | 8 | 10;
export type VBeamMode = 'open' | 'terminated';

export interface VBeamInput {
  frequencyMHz: number;
  legWavelengths: VBeamLegWavelengths;
  targetBearingDegrees: number;
  mode: VBeamMode;
  terminationResistanceOhms: number;
  trimAllowancePercent: number;
}

const APEX_ANGLES: Record<VBeamLegWavelengths, number> = { 1: 90, 2: 70, 3: 58, 4: 50, 6: 40, 8: 35, 10: 33 };

export const V_BEAM_MODEL = {
  id: 'atp-6-02-53-v-beam-site-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'U.S. Army ATP 6-02.53 — V antenna layout, apex-angle table, and termination context',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/0C45D378-25E0-438E-8881-749EF51DE080-1452191121290/atp6_02x53.pdf'
    },
    {
      title: 'U.S. Army TC 9-64 — basic V and rhombic antenna principles',
      url: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/8594DF18-D94D-432C-823B-7D40C4B4BE4A-1274317197310/tc_9-64.pdf'
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

export function calculateVBeam(input: VBeamInput) {
  finite(input.frequencyMHz, 'Frequency');
  finite(input.targetBearingDegrees, 'Target bearing');
  finite(input.terminationResistanceOhms, 'Termination resistance');
  finite(input.trimAllowancePercent, 'Trim allowance');
  if (input.frequencyMHz <= 0 || input.frequencyMHz > 300) throw new RangeError('Frequency must be above zero and no greater than 300 MHz.');
  if (!(input.legWavelengths in APEX_ANGLES)) throw new RangeError('Select a published leg-length option.');
  if (input.targetBearingDegrees < 0 || input.targetBearingDegrees >= 360) throw new RangeError('Target bearing must be from 0 through 359.999 degrees.');
  if (input.mode !== 'open' && input.mode !== 'terminated') throw new RangeError('V-beam mode is not supported.');
  if (input.terminationResistanceOhms <= 0 || input.terminationResistanceOhms > 10_000) throw new RangeError('Termination resistance must be above zero and no greater than 10,000 ohms.');
  if (input.trimAllowancePercent < 0 || input.trimAllowancePercent > 25) throw new RangeError('Trim allowance must be from 0 through 25 percent.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const apexAngleDegrees = APEX_ANGLES[input.legWavelengths];
  const designLegMetres = 150 * (2 * input.legWavelengths - 0.05) / input.frequencyMHz;
  const cutLegMetres = designLegMetres * (1 + input.trimAllowancePercent / 100);
  const halfAngleRadians = apexAngleDegrees * Math.PI / 360;
  const forwardDepthMetres = designLegMetres * Math.cos(halfAngleRadians);
  const endpointSpanMetres = 2 * designLegMetres * Math.sin(halfAngleRadians);
  const targetBearingDegrees = normalizedBearing(input.targetBearingDegrees);
  const endpointBearings = [normalizedBearing(targetBearingDegrees - apexAngleDegrees / 2), normalizedBearing(targetBearingDegrees + apexAngleDegrees / 2)];
  const endpoints = endpointBearings.map((bearingDegrees, index) => {
    const radians = bearingDegrees * Math.PI / 180;
    return {
      label: index === 0 ? 'Left leg endpoint' : 'Right leg endpoint',
      bearingDegrees,
      eastMetres: designLegMetres * Math.sin(radians),
      northMetres: designLegMetres * Math.cos(radians)
    };
  });
  const reverseBearingDegrees = normalizedBearing(targetBearingDegrees + 180);
  const warnings: string[] = [];
  if (input.mode === 'terminated' && (input.terminationResistanceOhms < 250 || input.terminationResistanceOhms > 350)) warnings.push('The Army V-antenna reference describes about 300 Ω at each far end. Treat the entered value as a documented design assumption and verify the complete feed, termination, ground, and antenna system.');
  if (input.frequencyMHz > 30) warnings.push('The cited apex-angle table is presented for long-range HF V antennas. Use above 30 MHz requires separate modelling of the exact conductor, height, feed, termination, and surroundings.');

  return {
    ...input,
    wavelengthMetres,
    apexAngleDegrees,
    designLegMetres,
    cutLegMetres,
    totalDesignWireMetres: designLegMetres * 2,
    totalCutWireMetres: cutLegMetres * 2,
    forwardDepthMetres,
    endpointSpanMetres,
    footprintAreaSquareMetres: endpointSpanMetres * forwardDepthMetres / 2,
    targetBearingDegrees,
    targetCompassPoint: compassPoint(targetBearingDegrees),
    reverseBearingDegrees,
    reverseCompassPoint: compassPoint(reverseBearingDegrees),
    endpoints,
    directionDescription: input.mode === 'terminated' ? 'Forward away from the feed apex along the V bisector' : 'Bidirectional along the V bisector, forward and behind the feed apex',
    terminationDescription: input.mode === 'terminated' ? `Separate ${input.terminationResistanceOhms.toFixed(0)} Ω non-inductive far-end terminations to suitable ground systems` : 'Far ends open; no terminating resistors',
    warnings
  };
}
