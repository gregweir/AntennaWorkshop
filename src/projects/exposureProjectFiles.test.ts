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
  evidenceEntries: [{ id: 'evidence-1', category: 'measurement', title: 'Mast height checked', detail: 'Measured from grade to antenna centre with a laser rangefinder.', recordedOn: '2026-11-10', reviewDueOn: '2027-11-10', reviewer: 'Greg Weir, VA1GW', referenceUrl: 'https://www.radiobook.ca/', scopeType: 'source', scopeId: 'source-1', relatedField: 'antennaCentreHeightMetres', qualityChecks: ['measurement-value', 'measurement-instrument', 'measurement-method', 'measurement-uncertainty'] }],
  sources: [{
    id: 'source-1', label: '2 m vertical', frequencyMHz: 146, transmitterPowerWatts: 50,
    dutyCyclePercent: 50, feedSystemLossDb: 1, antennaGainDbi: 2.15,
    antennaLargestDimensionMetres: 1, antennaCentreHeightMetres: 10,
    eastOffsetMetres: 3, northOffsetMetres: -2,
    patternType: 'directional', bearingDegrees: 75, beamwidthDegrees: 55
  }],
  evaluationPoints: [{ id: 'point-1', label: 'Property line', eastOffsetMetres: 20, northOffsetMetres: 5, heightMetres: 1.5 }]
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

  it('preserves linked calculator provenance in portable records', () => {
    const linkedProject: ExposureProjectData = {
      ...project,
      sources: [{
        ...project.sources[0],
        linkedModels: {
          antennaDesignId: 'half-wave-dipole',
          antennaDesignVersion: '1.0.0',
          feedSystemId: 'erp-eirp',
          feedSystemVersion: '1.0.0'
        }
      }]
    };
    const parsed = parseExposureProjectFile(serializeExposureProjectFile(
      createExposureProjectFile(linkedProject, 'linked-project', '2026-11-11T12:00:00Z')
    ));
    expect(parsed.project.sources[0].linkedModels?.feedSystemId).toBe('erp-eirp');
  });

  it('rejects unknown versions and invalid calculation inputs', () => {
    const file = createExposureProjectFile(project, 'project-1');
    expect(() => parseExposureProjectFile(JSON.stringify({ ...file, schemaVersion: 8 }))).toThrow(/version/i);
    expect(() => parseExposureProjectFile(JSON.stringify({
      ...file,
      project: { ...project, sources: [{ ...project.sources[0], frequencyMHz: -1 }] }
    }))).toThrow();
  });

  it('migrates version 1 common-support geometry to site coordinates', () => {
    const legacy = {
      kind: 'radiobook-antenna-workshop/exposure-project',
      schemaVersion: 1,
      projectId: 'legacy-project',
      savedAt: '2026-11-11T12:00:00Z',
      project: {
        ...project,
        sources: project.sources.map(({ eastOffsetMetres: _east, northOffsetMetres: _north, patternType: _pattern, bearingDegrees: _bearing, beamwidthDegrees: _beamwidth, ...source }) => source),
        evaluationPoints: [{ id: 'point-1', label: 'Property line', horizontalDistanceMetres: 20, heightMetres: 1.5 }]
      }
    };
    const migrated = parseExposureProjectFile(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries).toEqual([]);
    expect(migrated.project.sources[0]).toMatchObject({ eastOffsetMetres: 0, northOffsetMetres: 0, patternType: 'unknown', bearingDegrees: 0, beamwidthDegrees: 90 });
    expect(migrated.project.evaluationPoints[0]).toMatchObject({ eastOffsetMetres: 20, northOffsetMetres: 0 });
  });

  it('migrates version 2 projects without pattern metadata', () => {
    const legacy = createExposureProjectFile(project, 'legacy-v2', '2026-11-11T12:00:00Z') as unknown as Record<string, unknown>;
    legacy.schemaVersion = 2;
    const legacyProject = legacy.project as ExposureProjectData;
    legacyProject.sources = legacyProject.sources.map(({ patternType: _pattern, bearingDegrees: _bearing, beamwidthDegrees: _beamwidth, ...source }) => source as typeof project.sources[number]);
    const migrated = parseExposureProjectFile(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries).toEqual([]);
    expect(migrated.project.sources[0]).toMatchObject({ patternType: 'unknown', bearingDegrees: 0, beamwidthDegrees: 90 });
  });

  it('migrates version 3 projects without evidence and validates evidence URLs', () => {
    const current = createExposureProjectFile(project, 'legacy-v3', '2026-11-11T12:00:00Z');
    const { evidenceEntries: _evidence, ...legacyProject } = current.project;
    const migrated = parseExposureProjectFile(JSON.stringify({ ...current, schemaVersion: 3, project: legacyProject }));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries).toEqual([]);

    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [{ ...project.evidenceEntries[0], referenceUrl: 'javascript:alert(1)' }]
    }, 'unsafe-reference')).toThrow(/HTTP or HTTPS/i);
    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [project.evidenceEntries[0], { ...project.evidenceEntries[0], title: 'Duplicate identifier' }]
    }, 'duplicate-evidence')).toThrow(/unique/i);
    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [{ ...project.evidenceEntries[0], recordedOn: '2026-02-30' }]
    }, 'invalid-date')).toThrow(/valid YYYY-MM-DD/i);
  });

  it('migrates version 4 evidence to project scope and validates scoped identities and fields', () => {
    const current = createExposureProjectFile(project, 'legacy-v4', '2026-11-11T12:00:00Z');
    const legacyEvidence = current.project.evidenceEntries.map(({ scopeType: _scope, scopeId: _scopeId, relatedField: _field, ...entry }) => entry);
    const migrated = parseExposureProjectFile(JSON.stringify({ ...current, schemaVersion: 4, project: { ...current.project, evidenceEntries: legacyEvidence } }));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries[0]).toMatchObject({ scopeType: 'project', relatedField: 'general' });

    expect(() => createExposureProjectFile({ ...project, evidenceEntries: [{ ...project.evidenceEntries[0], scopeId: 'missing-source' }] }, 'missing-scope')).toThrow(/invalid scope/i);
    expect(() => createExposureProjectFile({ ...project, evidenceEntries: [{ ...project.evidenceEntries[0], relatedField: 'heightMetres' }] }, 'wrong-field')).toThrow(/invalid scope/i);
  });

  it('migrates version 5 evidence to unrecorded quality prompts and validates category checks', () => {
    const current = createExposureProjectFile(project, 'legacy-v5', '2026-11-11T12:00:00Z');
    const legacyEvidence = current.project.evidenceEntries.map(({ qualityChecks: _qualityChecks, ...entry }) => entry);
    const migrated = parseExposureProjectFile(JSON.stringify({ ...current, schemaVersion: 5, project: { ...current.project, evidenceEntries: legacyEvidence } }));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries[0].qualityChecks).toEqual([]);

    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [{ ...project.evidenceEntries[0], qualityChecks: ['source-identity'] as typeof project.evidenceEntries[0]['qualityChecks'] }]
    }, 'wrong-quality-category')).toThrow(/selected category/i);
    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [{ ...project.evidenceEntries[0], qualityChecks: ['measurement-value', 'measurement-value'] }]
    }, 'duplicate-quality-check')).toThrow(/unique/i);
  });

  it('migrates version 6 evidence without inventing a review reminder', () => {
    const current = createExposureProjectFile(project, 'legacy-v6', '2026-11-11T12:00:00Z');
    const legacyEvidence = current.project.evidenceEntries.map(({ reviewDueOn: _reviewDueOn, ...entry }) => entry);
    const migrated = parseExposureProjectFile(JSON.stringify({ ...current, schemaVersion: 6, project: { ...current.project, evidenceEntries: legacyEvidence } }));
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.project.evidenceEntries[0].reviewDueOn).toBeUndefined();

    expect(() => createExposureProjectFile({
      ...project,
      evidenceEntries: [{ ...project.evidenceEntries[0], reviewDueOn: '2026-02-30' }]
    }, 'invalid-review-reminder')).toThrow(/valid YYYY-MM-DD/i);
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
