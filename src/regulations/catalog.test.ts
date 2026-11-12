/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { jurisdictionProfiles } from './catalog';

describe('regulatory source catalog', () => {
  it('has unique jurisdiction codes and sources for every jurisdiction', () => {
    const codes = jurisdictionProfiles.map((profile) => profile.code);
    expect(new Set(codes).size).toBe(codes.length);

    for (const profile of jurisdictionProfiles) {
      expect(profile.sources.length).toBeGreaterThan(0);
      for (const source of profile.sources) {
        expect(source.url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('marks Canada and the United States for the initial release', () => {
    expect(
      jurisdictionProfiles
        .filter((profile) => profile.releaseStatus === 'initial')
        .map((profile) => profile.code)
    ).toEqual(['CA', 'US']);
  });
});
