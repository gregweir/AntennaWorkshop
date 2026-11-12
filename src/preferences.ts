/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { UnitSystem } from './lib/units';
import type { JurisdictionCode } from './regulations/catalog';

export interface AppPreferences {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  advancedOpen: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PREFERENCES_STORAGE_KEY = 'radiobook:antenna-workshop:preferences:v1';

export const defaultPreferences: AppPreferences = {
  jurisdiction: 'CA',
  unitSystem: 'metric',
  advancedOpen: false
};

function isJurisdiction(value: unknown): value is JurisdictionCode {
  return value === 'CA' || value === 'US';
}

function isUnitSystem(value: unknown): value is UnitSystem {
  return value === 'metric' || value === 'imperial';
}

export function loadPreferences(storage?: StorageLike): AppPreferences {
  if (!storage) {
    return defaultPreferences;
  }

  try {
    const serialized = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!serialized) {
      return defaultPreferences;
    }

    const candidate = JSON.parse(serialized) as Partial<AppPreferences>;
    return {
      jurisdiction: isJurisdiction(candidate.jurisdiction) ? candidate.jurisdiction : defaultPreferences.jurisdiction,
      unitSystem: isUnitSystem(candidate.unitSystem) ? candidate.unitSystem : defaultPreferences.unitSystem,
      advancedOpen:
        typeof candidate.advancedOpen === 'boolean' ? candidate.advancedOpen : defaultPreferences.advancedOpen
    };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: AppPreferences, storage?: StorageLike): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences remain usable for the current session when storage is unavailable.
  }
}
