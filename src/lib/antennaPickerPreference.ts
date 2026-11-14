/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AntennaPickerMode = 'workbench' | 'guided';

interface PickerPreferenceStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const PICKER_MODE_KEY = 'radiobook:antenna-workshop:picker-mode:v1';

export function loadAntennaPickerMode(storage: PickerPreferenceStorage): AntennaPickerMode {
  try {
    return storage.getItem(PICKER_MODE_KEY) === 'workbench' ? 'workbench' : 'guided';
  } catch {
    return 'guided';
  }
}

export function saveAntennaPickerMode(storage: PickerPreferenceStorage, mode: AntennaPickerMode) {
  try {
    storage.setItem(PICKER_MODE_KEY, mode);
  } catch {
    // The active mode still works when browser storage is unavailable.
  }
}
