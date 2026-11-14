/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateIdealTransformer } from './idealTransformer';

describe('ideal two-winding transformer ratio', () => {
  it('calculates an exact 1:4 impedance and 1:2 turns balun', () => {
    const result = calculateIdealTransformer({ sourceResistanceOhms: 50, loadResistanceOhms: 200, sourceTurns: 3, sourceConnection: 'unbalanced', loadConnection: 'balanced' });
    expect(result.deviceClass).toBe('balun');
    expect(result.idealImpedanceRatioLoadToSource).toBe(4);
    expect(result.idealTurnsRatioLoadToSource).toBe(2);
    expect(result.exactLoadTurns).toBe(6);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].reflectedInputResistanceOhms).toBe(50);
    expect(result.candidates[0].idealSWR).toBe(1);
  });

  it('shows both adjacent integer options for a non-integer winding', () => {
    const result = calculateIdealTransformer({ sourceResistanceOhms: 50, loadResistanceOhms: 75, sourceTurns: 3, sourceConnection: 'unbalanced', loadConnection: 'unbalanced' });
    expect(result.deviceClass).toBe('unun');
    expect(result.exactLoadTurns).toBeCloseTo(3.6742346, 6);
    expect(result.candidates.map((option) => option.loadTurns).sort()).toEqual([3, 4]);
    expect(result.candidates[0].loadTurns).toBe(4);
    expect(result.candidates[0].reflectedInputResistanceOhms).toBeCloseTo(42.1875, 8);
  });

  it('handles a step-down ratio and identifies a balanced transformer', () => {
    const result = calculateIdealTransformer({ sourceResistanceOhms: 200, loadResistanceOhms: 50, sourceTurns: 8, sourceConnection: 'balanced', loadConnection: 'balanced' });
    expect(result.deviceClass).toBe('balanced transformer');
    expect(result.idealTurnsRatioLoadToSource).toBe(0.5);
    expect(result.exactLoadTurns).toBe(4);
    expect(result.candidates[0].reflectedInputResistanceOhms).toBe(200);
  });

  it('rejects invalid impedances, turns, and connection forms', () => {
    const valid = { sourceResistanceOhms: 50, loadResistanceOhms: 200, sourceTurns: 3, sourceConnection: 'unbalanced' as const, loadConnection: 'balanced' as const };
    expect(() => calculateIdealTransformer({ ...valid, sourceResistanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateIdealTransformer({ ...valid, loadResistanceOhms: Number.NaN })).toThrow(RangeError);
    expect(() => calculateIdealTransformer({ ...valid, sourceTurns: 2.5 })).toThrow(RangeError);
    expect(() => calculateIdealTransformer({ ...valid, sourceConnection: 'other' as never })).toThrow(RangeError);
  });
});
