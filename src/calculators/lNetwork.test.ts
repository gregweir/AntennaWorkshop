/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLNetwork } from './lNetwork';

describe('lossless L-network synthesis', () => {
  it('matches a 100 ohm resistive load to 50 ohms with both polarities', () => {
    const result = calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 50, loadResistanceOhms: 100, loadReactanceOhms: 0 });
    expect(result.solutions).toHaveLength(2);
    expect(result.solutions.every((solution) => solution.topology === 'series-first')).toBe(true);
    expect(result.solutions.map((solution) => solution.series.reactanceOhms)).toEqual([50, -50]);
    expect(result.solutions.map((solution) => solution.shunt.susceptanceSiemens)).toEqual([0.01, -0.01]);
    expect(result.solutions[0].series.inductanceHenries).toBeCloseTo(5.604047e-7, 12);
    expect(result.solutions[0].shunt.capacitanceFarads).toBeCloseTo(1.120809e-10, 16);
  });

  it('matches a 25 ohm resistive load with the shunt element at the source side', () => {
    const result = calculateLNetwork({ frequencyMHz: 7.1, systemResistanceOhms: 50, loadResistanceOhms: 25, loadReactanceOhms: 0 });
    expect(result.solutions).toHaveLength(2);
    expect(result.solutions.every((solution) => solution.topology === 'shunt-first')).toBe(true);
    expect(result.solutions.map((solution) => solution.series.reactanceOhms)).toEqual([25, -25]);
    expect(result.solutions.map((solution) => solution.shunt.susceptanceSiemens)).toEqual([0.02, -0.02]);
  });

  it('enumerates and independently verifies overlapping solutions for a complex load', () => {
    const result = calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 50, loadResistanceOhms: 25, loadReactanceOhms: 50 });
    expect(result.solutions).toHaveLength(4);
    for (const solution of result.solutions) {
      expect(solution.inputResistanceOhms).toBeCloseTo(50, 9);
      expect(solution.inputReactanceOhms).toBeCloseTo(0, 9);
      expect(solution.residualMagnitudeOhms).toBeLessThan(1e-9);
    }
  });

  it('deduplicates the direct series cancellation case', () => {
    const result = calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 50, loadResistanceOhms: 50, loadReactanceOhms: 30 });
    expect(result.solutions.some((solution) => solution.series.reactanceOhms === -30 && solution.shunt.kind === 'none')).toBe(true);
  });

  it('rejects nonphysical and unsupported inputs', () => {
    expect(() => calculateLNetwork({ frequencyMHz: 0, systemResistanceOhms: 50, loadResistanceOhms: 100, loadReactanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 0, loadResistanceOhms: 100, loadReactanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 50, loadResistanceOhms: -1, loadReactanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateLNetwork({ frequencyMHz: 14.2, systemResistanceOhms: 50, loadResistanceOhms: 100, loadReactanceOhms: Number.NaN })).toThrow(RangeError);
  });
});
