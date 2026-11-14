/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface ActiveReceiveLoopInput {
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  loopDiameterMetres: number;
  baseHeightMetres: number;
  nullAxisBearingDegrees: number;
  conductorCutAllowancePercent: number;
}

export const ACTIVE_RECEIVE_LOOP_MODEL = {
  id: 'untuned-active-receive-loop-planner',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — HF Loop Antennas',
      url: 'https://www.arrl.org/hf-loop-antennas'
    },
    {
      title: 'Roberts — The Small Vertical Loop Antenna for HF Reception',
      url: 'https://www.kk5jy.net/rx-loop/'
    },
    {
      title: 'Iliev — Active Wideband Directional Antenna for HF Reception',
      url: 'https://www.lz1aq.signacor.com/docs/active-wideband-directional-antenna.php'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function compassPoint(bearingDegrees: number) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round(bearingDegrees / 22.5) % points.length];
}

export function calculateActiveReceiveLoop(input: ActiveReceiveLoopInput) {
  finiteRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower frequency');
  finiteRange(input.upperFrequencyMHz, 0.001, 300_000, 'Upper frequency');
  if (input.upperFrequencyMHz <= input.lowerFrequencyMHz) {
    throw new RangeError('Upper frequency must be greater than lower frequency.');
  }
  finiteRange(input.loopDiameterMetres, 0.05, 100, 'Loop diameter');
  finiteRange(input.baseHeightMetres, 0, 1_000, 'Base height');
  if (!Number.isFinite(input.nullAxisBearingDegrees) || input.nullAxisBearingDegrees < 0 || input.nullAxisBearingDegrees >= 360) {
    throw new RangeError('Null-axis bearing must be at least 0 and less than 360.');
  }
  finiteRange(input.conductorCutAllowancePercent, 0, 25, 'Conductor cut allowance');

  const lowerWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowerFrequencyMHz * 1_000_000);
  const upperWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.upperFrequencyMHz * 1_000_000);
  const circumferenceMetres = Math.PI * input.loopDiameterMetres;
  const cutConductorLengthMetres = circumferenceMetres * (1 + input.conductorCutAllowancePercent / 100);
  const enclosedAreaSquareMetres = Math.PI * (input.loopDiameterMetres / 2) ** 2;
  const topHeightMetres = input.baseHeightMetres + input.loopDiameterMetres;
  const lowerEdgeCircumferenceWavelengths = circumferenceMetres / lowerWavelengthMetres;
  const upperEdgeCircumferenceWavelengths = circumferenceMetres / upperWavelengthMetres;
  const upperEdgeDiameterWavelengths = input.loopDiameterMetres / upperWavelengthMetres;
  const reverseNullBearingDegrees = (input.nullAxisBearingDegrees + 180) % 360;
  const loopPlaneBearingDegrees = (input.nullAxisBearingDegrees + 90) % 360;
  const reverseLoopPlaneBearingDegrees = (loopPlaneBearingDegrees + 180) % 360;
  const warnings: string[] = [];

  if (upperEdgeCircumferenceWavelengths >= 0.1) {
    warnings.push('The loop perimeter is at least 0.10 wavelength at the upper range edge; the wideband-loop source identifies this as the point where the loop is no longer electrically small.');
  }
  if (upperEdgeDiameterWavelengths >= 1 / 16) {
    warnings.push('The loop diameter is at least one-sixteenth wavelength at the upper range edge, outside the ARRL small-loop classification.');
  }
  if (input.baseHeightMetres === 0) {
    warnings.push('The loop base is entered at ground level; allow physical clearance for the amplifier enclosure, drainage, vegetation, snow, and maintenance.');
  }
  if (input.conductorCutAllowancePercent === 0) {
    warnings.push('No conductor allowance is included for the feed gap, amplifier terminals, bends, overlap, or trimming.');
  }

  return {
    ...input,
    wavelengthMetres: lowerWavelengthMetres,
    lowerWavelengthMetres,
    upperWavelengthMetres,
    circumferenceMetres,
    cutConductorLengthMetres,
    enclosedAreaSquareMetres,
    topHeightMetres,
    lowerEdgeCircumferenceWavelengths,
    upperEdgeCircumferenceWavelengths,
    upperEdgeDiameterWavelengths,
    reverseNullBearingDegrees,
    nullCompassPoint: compassPoint(input.nullAxisBearingDegrees),
    reverseNullCompassPoint: compassPoint(reverseNullBearingDegrees),
    loopPlaneBearingDegrees,
    loopPlaneCompassPoint: compassPoint(loopPlaneBearingDegrees),
    reverseLoopPlaneBearingDegrees,
    reverseLoopPlaneCompassPoint: compassPoint(reverseLoopPlaneBearingDegrees),
    orientationDescription: `Expected bidirectional null axis at ${input.nullAxisBearingDegrees.toFixed(0)}° ${compassPoint(input.nullAxisBearingDegrees)} and ${reverseNullBearingDegrees.toFixed(0)}° ${compassPoint(reverseNullBearingDegrees)}; loop plane runs ${loopPlaneBearingDegrees.toFixed(0)}° ${compassPoint(loopPlaneBearingDegrees)} to ${reverseLoopPlaneBearingDegrees.toFixed(0)}° ${compassPoint(reverseLoopPlaneBearingDegrees)}`,
    warnings
  };
}
