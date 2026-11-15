/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { UnitSystem } from './lib/units';
import { ANTENNA_TYPES, type AntennaType } from './lib/antennaTypes';
import type { JurisdictionCode } from './regulations/catalog';

export interface AppPreferences {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  advancedOpen: boolean;
  theme: ThemePreference;
  activeWorkspace: WorkshopWorkspace;
  activeAntennaDesign: AntennaType;
  activeFeedlineTool: FeedlineTool;
  activeExposureView: ExposureView;
  explanationDepth: ExplanationDepth;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type ExplanationDepth = 'quick' | 'builder' | 'technical';
export type WorkshopWorkspace = 'antennas' | 'feedline' | 'exposure';
export type FeedlineTool = 'power' | 'stub' | 'explore' | 'sweep' | 'line' | 'match' | 'transformer' | 'ratio' | 'radiated';
export type ExposureView = 'reference' | 'single' | 'project' | 'aggregate' | 'fcc-exemption' | 'fcc-multiple' | 'ofcom-assessment' | 'ofcom-distance' | 'ofcom-multiple' | 'arpansa-reference' | 'acma-assessment' | 'acma-distance' | 'acma-record';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PREFERENCES_STORAGE_KEY = 'radiobook:antenna-workshop:preferences:v1';

export const defaultPreferences: AppPreferences = {
  jurisdiction: 'CA',
  unitSystem: 'metric',
  advancedOpen: false,
  theme: 'system',
  activeWorkspace: 'antennas',
  activeAntennaDesign: 'dipole',
  activeFeedlineTool: 'power',
  activeExposureView: 'reference',
  explanationDepth: 'builder'
};

function isJurisdiction(value: unknown): value is JurisdictionCode {
  return value === 'CA' || value === 'US' || value === 'GB' || value === 'AU';
}

function isUnitSystem(value: unknown): value is UnitSystem {
  return value === 'metric' || value === 'imperial';
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isExplanationDepth(value: unknown): value is ExplanationDepth {
  return value === 'quick' || value === 'builder' || value === 'technical';
}

function isWorkshopWorkspace(value: unknown): value is WorkshopWorkspace {
  return value === 'antennas' || value === 'feedline' || value === 'exposure';
}

function isAntennaType(value: unknown): value is AntennaType {
  return typeof value === 'string' && (ANTENNA_TYPES as readonly string[]).includes(value);
}

function isFeedlineTool(value: unknown): value is FeedlineTool {
  return value === 'power' || value === 'stub' || value === 'explore' || value === 'sweep' || value === 'line'
    || value === 'match' || value === 'transformer' || value === 'ratio' || value === 'radiated';
}

function isExposureView(value: unknown): value is ExposureView {
  return value === 'reference' || value === 'single' || value === 'project' || value === 'aggregate'
    || value === 'fcc-exemption' || value === 'fcc-multiple' || value === 'ofcom-assessment'
    || value === 'ofcom-distance' || value === 'ofcom-multiple' || value === 'arpansa-reference'
    || value === 'acma-assessment' || value === 'acma-distance' || value === 'acma-record';
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
        typeof candidate.advancedOpen === 'boolean' ? candidate.advancedOpen : defaultPreferences.advancedOpen,
      theme: isThemePreference(candidate.theme) ? candidate.theme : defaultPreferences.theme,
      activeWorkspace: isWorkshopWorkspace(candidate.activeWorkspace)
        ? candidate.activeWorkspace
        : defaultPreferences.activeWorkspace,
      activeAntennaDesign: isAntennaType(candidate.activeAntennaDesign)
        ? candidate.activeAntennaDesign
        : defaultPreferences.activeAntennaDesign,
      activeFeedlineTool: isFeedlineTool(candidate.activeFeedlineTool)
        ? candidate.activeFeedlineTool
        : defaultPreferences.activeFeedlineTool,
      activeExposureView: isExposureView(candidate.activeExposureView)
        ? candidate.activeExposureView
        : defaultPreferences.activeExposureView,
      explanationDepth: isExplanationDepth(candidate.explanationDepth)
        ? candidate.explanationDepth
        : defaultPreferences.explanationDepth
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
