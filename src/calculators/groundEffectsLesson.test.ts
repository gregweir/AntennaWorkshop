/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { evaluateGroundEffectsLesson } from './groundEffectsLesson';

const input = () => ({ frequencyMHz: 14.2, geometry: 'horizontal-wire' as const, heightWavelengths: '0.25' as const, returnSystem: 'unspecified' as const, environment: 'clear' as const });

describe('ground-effects lesson', () => {
  it('converts normalized height to physical height at the active frequency', () => {
    const result = evaluateGroundEffectsLesson(input());
    expect(result.wavelengthMetres).toBeCloseTo(21.1121449, 6);
    expect(result.heightMetres).toBeCloseTo(5.2780362, 6);
    expect(result.status).toBe('model-and-measure');
  });

  it('requires an explicit RF return design for a ground-referenced vertical', () => {
    const result = evaluateGroundEffectsLesson({ ...input(), geometry: 'ground-referenced-vertical' });
    expect(result.status).toBe('review-installation');
    expect(result.headline).toContain('RF return system');
    expect(result.groundMeaning).toContain('Radials');
  });

  it('surfaces nearby objects without predicting their effect', () => {
    const result = evaluateGroundEffectsLesson({ ...input(), environment: 'nearby-objects' });
    expect(result.status).toBe('review-installation');
    expect(result.objectMeaning).toContain('can couple');
  });

  it('rejects invalid frequencies and selections', () => {
    expect(() => evaluateGroundEffectsLesson({ ...input(), frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => evaluateGroundEffectsLesson({ ...input(), heightWavelengths: '2' as never })).toThrow(TypeError);
  });
});
