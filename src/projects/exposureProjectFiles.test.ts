/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import {
  createExposureProjectFile,
  deleteExposureProjectFile,
  exposureProjectFilename,
  getCurrentExposureProjectId,
  loadExposureProjectLibrary,
  parseExposureProjectFile,
  saveExposureProjectFile,
  serializeExposureProjectFile,
  type ExposureProjectData
} from './exposureProjectFiles';

const project: ExposureProjectData = {
  title: 'Back garden station',
  jurisdiction: 'CA',
  environment: 'uncontrolled',
  sourceInventoryComplete: true,
  sources: [{
    id: 'source-1', label: '2 m vertical', frequencyMHz: 146, transmitterPowerWatts: 50,
    dutyCyclePercent: 50, feedSystemLossDb: 1, antennaGainDbi: 2.15,
    antennaLargestDimensionMetres: 1, antennaCentreHeightMetres: 10
  }],
  evaluationPoints: [{ id: 'point-1', label: 'Property line', horizontalDistanceMetres: 20, heightMetres: 1.5 }]
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }
  };
}

describe('exposure project files', () => {
  it('round-trips a versioned, validated project record', () => {
    const file = createExposureProjectFile(project, 'project-1', '2026-11-11T12:00:00Z');
    expect(parseExposureProjectFile(serializeExposureProjectFile(file))).toEqual(file);
  });

  it('rejects unknown versions and invalid calculation inputs', () => {
    const file = createExposureProjectFile(project, 'project-1');
    expect(() => parseExposureProjectFile(JSON.stringify({ ...file, schemaVersion: 2 }))).toThrow(/version/i);
    expect(() => parseExposureProjectFile(JSON.stringify({
      ...file,
      project: { ...project, sources: [{ ...project.sources[0], frequencyMHz: -1 }] }
    }))).toThrow();
  });

  it('saves, updates, orders, and deletes local projects', () => {
    const storage = memoryStorage();
    saveExposureProjectFile(createExposureProjectFile(project, 'one', '2026-11-11T12:00:00Z'), storage);
    saveExposureProjectFile(createExposureProjectFile({ ...project, title: 'Second' }, 'two', '2026-11-11T13:00:00Z'), storage);
    saveExposureProjectFile(createExposureProjectFile({ ...project, title: 'First updated' }, 'one', '2026-11-11T14:00:00Z'), storage);

    expect(loadExposureProjectLibrary(storage).map((file) => file.project.title)).toEqual(['First updated', 'Second']);
    expect(getCurrentExposureProjectId(storage)).toBe('one');
    expect(deleteExposureProjectFile('one', storage).map((file) => file.projectId)).toEqual(['two']);
    expect(getCurrentExposureProjectId(storage)).toBeNull();
  });

  it('ignores malformed local records and creates portable filenames', () => {
    const storage = memoryStorage();
    storage.setItem('radiobook:antenna-workshop:exposure-projects:v1', '[{"bad":true}]');
    expect(loadExposureProjectLibrary(storage)).toEqual([]);
    expect(exposureProjectFilename('My 20 m / 40 m Station')).toBe('my-20-m-40-m-station.antenna-project.json');
  });
});
