/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateVBeam } from './vBeam';

const base = { frequencyMHz: 14.2, legWavelengths: 2 as const, targetBearingDegrees: 0, mode: 'open' as const, terminationResistanceOhms: 300, trimAllowancePercent: 2.5 };

describe('V-beam site planner', () => {
  it('reproduces the published two-wavelength angle and long-wire correction', () => {
    const result = calculateVBeam(base);
    expect(result.apexAngleDegrees).toBe(70);
    expect(result.designLegMetres).toBeCloseTo(41.72535, 5);
    expect(result.cutLegMetres).toBeCloseTo(42.76849, 5);
    expect(result.endpointSpanMetres).toBeCloseTo(47.86536, 5);
    expect(result.forwardDepthMetres).toBeCloseTo(34.17941, 5);
    expect(result.directionDescription).toContain('Bidirectional');
  });

  it('maps true bearing into two endpoint survey coordinates', () => {
    const result = calculateVBeam({ ...base, targetBearingDegrees: 90 });
    expect(result.targetCompassPoint).toBe('E');
    expect(result.endpoints[0].bearingDegrees).toBe(55);
    expect(result.endpoints[1].bearingDegrees).toBe(125);
    expect(result.endpoints[0].eastMetres).toBeCloseTo(result.endpoints[1].eastMetres, 8);
    expect(result.endpoints[0].northMetres).toBeCloseTo(-result.endpoints[1].northMetres, 8);
  });

  it('keeps termination assumptions and direction explicit', () => {
    const result = calculateVBeam({ ...base, mode: 'terminated', terminationResistanceOhms: 500 });
    expect(result.terminationDescription).toContain('500 Ω');
    expect(result.directionDescription).toContain('Forward away');
    expect(result.warnings).toHaveLength(1);
  });

  it('rejects unsupported geometry and unsafe numeric inputs', () => {
    expect(() => calculateVBeam({ ...base, legWavelengths: 5 as 4 })).toThrow(RangeError);
    expect(() => calculateVBeam({ ...base, targetBearingDegrees: 360 })).toThrow(RangeError);
    expect(() => calculateVBeam({ ...base, trimAllowancePercent: -1 })).toThrow(RangeError);
    expect(() => calculateVBeam({ ...base, terminationResistanceOhms: 0 })).toThrow(RangeError);
  });
});
