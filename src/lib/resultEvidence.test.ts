/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { classifyResultEvidence, isSupportingResult } from './resultEvidence';

describe('result evidence labels', () => {
  it('distinguishes calculated build dimensions', () => {
    expect(classifyResultEvidence('Total cut length', '10.432 m')).toBe('calculated');
  });

  it('identifies published reference values', () => {
    expect(classifyResultEvidence('Classical gain estimate', '11.2 dBi')).toBe('source');
    expect(classifyResultEvidence('Direction convention', 'Response toward the feed')).toBe('source');
  });

  it('identifies entered assumptions', () => {
    expect(classifyResultEvidence('Termination assumption', '470 ohms')).toBe('assumption');
    expect(classifyResultEvidence('Selected receive direction', '45 degrees NE')).toBe('assumption');
  });

  it('gives unpredicted performance the strongest verification label', () => {
    expect(classifyResultEvidence('Predicted gain and pattern', 'Not inferred - measure the installed antenna')).toBe('measure');
  });

  it('recognizes supporting calculations separately from build dimensions', () => {
    expect(isSupportingResult('Free-space wavelength')).toBe(true);
    expect(isSupportingResult('Driven-loop side')).toBe(false);
  });
});
