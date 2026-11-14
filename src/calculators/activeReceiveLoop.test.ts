/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ACTIVE_RECEIVE_LOOP_MODEL, calculateActiveReceiveLoop } from './activeReceiveLoop';

const baseline = {
  lowerFrequencyMHz: 1.8,
  upperFrequencyMHz: 30,
  loopDiameterMetres: 1,
  baseHeightMetres: 1.5,
  nullAxisBearingDegrees: 45,
  conductorCutAllowancePercent: 2.5
};

describe('calculateActiveReceiveLoop', () => {
  it('plans a circular vertical loop and its orientation', () => {
    const result = calculateActiveReceiveLoop(baseline);

    expect(result.circumferenceMetres).toBeCloseTo(Math.PI, 9);
    expect(result.cutConductorLengthMetres).toBeCloseTo(Math.PI * 1.025, 9);
    expect(result.enclosedAreaSquareMetres).toBeCloseTo(Math.PI / 4, 9);
    expect(result.topHeightMetres).toBe(2.5);
    expect(result.lowerEdgeCircumferenceWavelengths).toBeCloseTo(0.01886, 4);
    expect(result.upperEdgeCircumferenceWavelengths).toBeCloseTo(0.31438, 4);
    expect(result.reverseNullBearingDegrees).toBe(225);
    expect(result.loopPlaneBearingDegrees).toBe(135);
    expect(result.reverseLoopPlaneBearingDegrees).toBe(315);
    expect(result.orientationDescription).toContain('45° NE and 225° SW');
  });

  it('keeps a 30-inch loop small through 14.35 MHz', () => {
    const result = calculateActiveReceiveLoop({ ...baseline, upperFrequencyMHz: 14.35, loopDiameterMetres: 0.762 });

    expect(result.upperEdgeCircumferenceWavelengths).toBeLessThan(0.12);
    expect(result.warnings).toContainEqual(expect.stringContaining('0.10 wavelength'));
    expect(result.warnings).not.toContainEqual(expect.stringContaining('one-sixteenth'));
  });

  it('reports both electrical-size boundaries independently', () => {
    const result = calculateActiveReceiveLoop({ ...baseline, upperFrequencyMHz: 30, loopDiameterMetres: 1 });

    expect(result.warnings).toContainEqual(expect.stringContaining('0.10 wavelength'));
    expect(result.warnings).toContainEqual(expect.stringContaining('one-sixteenth'));
  });

  it('reports construction boundary choices', () => {
    const result = calculateActiveReceiveLoop({ ...baseline, baseHeightMetres: 0, conductorCutAllowancePercent: 0 });

    expect(result.warnings).toContainEqual(expect.stringContaining('ground level'));
    expect(result.warnings).toContainEqual(expect.stringContaining('No conductor allowance'));
  });

  it.each([
    [{ ...baseline, lowerFrequencyMHz: 0 }, 'Lower frequency'],
    [{ ...baseline, upperFrequencyMHz: 1.8 }, 'Upper frequency must be greater'],
    [{ ...baseline, loopDiameterMetres: 0.01 }, 'Loop diameter'],
    [{ ...baseline, baseHeightMetres: -1 }, 'Base height'],
    [{ ...baseline, nullAxisBearingDegrees: 360 }, 'Null-axis bearing'],
    [{ ...baseline, conductorCutAllowancePercent: 26 }, 'Conductor cut allowance']
  ])('rejects invalid input %#', (input, message) => {
    expect(() => calculateActiveReceiveLoop(input)).toThrow(message);
  });

  it('retains source provenance and review date', () => {
    expect(ACTIVE_RECEIVE_LOOP_MODEL.reviewedOn).toBe('2026-11-14');
    expect(ACTIVE_RECEIVE_LOOP_MODEL.sources).toHaveLength(3);
    expect(ACTIVE_RECEIVE_LOOP_MODEL.sources.map((source) => source.url)).toContain('https://www.lz1aq.signacor.com/docs/active-wideband-directional-antenna.php');
  });
});
