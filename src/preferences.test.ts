/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { defaultPreferences, loadPreferences, PREFERENCES_STORAGE_KEY, savePreferences } from './preferences';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(PREFERENCES_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    value: () => values.get(PREFERENCES_STORAGE_KEY)
  };
}

describe('application preferences', () => {
  it('uses Canada, metric, and standard controls by default', () => {
    expect(loadPreferences()).toEqual(defaultPreferences);
  });

  it('round-trips supported preferences', () => {
    const storage = memoryStorage();
    const preferences = { jurisdiction: 'US', unitSystem: 'imperial', advancedOpen: true, theme: 'dark' } as const;
    savePreferences(preferences, storage);
    expect(loadPreferences(storage)).toEqual(preferences);
  });

  it('persists United Kingdom jurisdiction selection', () => {
    const storage = memoryStorage(JSON.stringify({ jurisdiction: 'GB', unitSystem: 'metric', advancedOpen: false, theme: 'system' }));
    expect(loadPreferences(storage).jurisdiction).toBe('GB');
  });

  it('migrates older preferences to system theme and preserves Australia', () => {
    const storage = memoryStorage(JSON.stringify({ jurisdiction: 'AU', unitSystem: 'metric', advancedOpen: false }));
    expect(loadPreferences(storage)).toMatchObject({ jurisdiction: 'AU', theme: 'system' });
  });

  it('fails closed to valid defaults for malformed or unsupported values', () => {
    expect(loadPreferences(memoryStorage('{bad json'))).toEqual(defaultPreferences);
    expect(
      loadPreferences(memoryStorage(JSON.stringify({ jurisdiction: 'XX', unitSystem: 'yards', advancedOpen: 'yes', theme: 'neon' })))
    ).toEqual(defaultPreferences);
  });
});
