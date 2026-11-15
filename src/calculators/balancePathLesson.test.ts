/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { evaluateBalancePath } from './balancePathLesson';

describe('balance and common-mode path lesson', () => {
  it('requires a return-path plan for an end-fed radiator', () => {
    const result = evaluateBalancePath({ topology: 'end-fed', feedline: 'coax', commonModePlan: 'documented-control', returnPathPlan: 'unspecified' });
    expect(result.status).toBe('requires-plan');
    expect(result.headline).toContain('return path is missing');
    expect(result.showUnintendedOutsidePath).toBe(true);
    expect(result.intendedPath).toContain('second RF path');
  });

  it('does not treat a balanced centre drawing and low SWR as common-mode control', () => {
    const result = evaluateBalancePath({ topology: 'balanced-centre', feedline: 'coax', commonModePlan: 'none', returnPathPlan: 'documented' });
    expect(result.status).toBe('requires-plan');
    expect(result.headline).toContain('coax outside');
    expect(result.controlMeaning).toContain('SWR');
  });

  it('requires installed verification even with balanced line and a documented control', () => {
    const result = evaluateBalancePath({ topology: 'balanced-centre', feedline: 'balanced-line', commonModePlan: 'documented-control', returnPathPlan: 'documented' });
    expect(result.status).toBe('verify-installed');
    expect(result.showUnintendedOutsidePath).toBe(false);
    expect(result.checks).toHaveLength(3);
  });

  it('flags unsupported selections', () => {
    expect(() => evaluateBalancePath({ topology: 'loop' as never, feedline: 'coax', commonModePlan: 'none', returnPathPlan: 'documented' })).toThrow(TypeError);
  });
});
