/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ACMA_RECORD_LIBRARY_KEY, acmaRecordRequiredGaps, createAcmaAssessmentRecord, createAcmaAssessmentRecordFromHandoff, deleteAcmaAssessmentRecord, loadAcmaAssessmentRecords, parseAcmaAssessmentRecord, restoreAcmaAssessmentRevision, saveAcmaAssessmentRecord, serializeAcmaAssessmentRecord, type StorageLike } from './acmaAssessmentRecords';
import { assessAcmaStation, type AcmaAssessmentInput } from '../calculators/acmaAssessment';
import { createAcmaStationChange } from './acmaStationChanges';

function memoryStorage(initial?: string): StorageLike {
  const values = new Map<string, string>();
  if (initial) values.set(ACMA_RECORD_LIBRARY_KEY, initial);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}

describe('ACMA assessment record library', () => {
  it('transfers gateway facts and provenance without supplying assessment judgments or evidence', () => {
    const input: AcmaAssessmentInput = { stationType: 'mobile', averageTotalPowerWatts: 100.1, everyAntennaInaccessibleToPublic: false, lowestAntennaBaseHeightMetres: 10, averageTotalEirpWatts: 3200, simultaneousMultipleFrequencies: true, multipleStationsAtSite: true };
    const record = createAcmaAssessmentRecordFromHandoff('record-1', '2026-11-13T12:00:00.000Z', { input, result: assessAcmaStation(input), transferredAt: '2026-11-13T11:59:00.000Z' });
    expect(record).toMatchObject({
      id: 'record-1', powerLevel: '100.1 W average total power supplied to all antennas (gateway input)',
      antennaHeight: '10 m base height of lowest antenna (gateway input)', assessmentRoute: '', assessmentMethodType: '',
      assessmentScope: '', assessmentStandard: '', assessorName: '', assessmentDate: '', measurementsAndCalculations: '', declarationMade: false
    });
    expect(record.operatingConditions).toContain('Mobile station');
    expect(record.operatingConditions).toContain('not assessed operating conditions');
    expect(record.operatingConditions).toContain('3200 W EIRP');
    expect(record.simultaneousFrequencyMethod).toContain('remains to be documented');
    expect(record.additionalNotes).toContain('acma-amateur-class-licence-schedule-1-gateway version 1.0.0');
    expect(record.additionalNotes).toContain('Clause 4 assessment work and the clause 6 record package remain');
  });

  it('saves, updates, and deletes versioned records', () => {
    const storage = memoryStorage();
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(saveAcmaAssessmentRecord(record, storage)).toHaveLength(1);
    saveAcmaAssessmentRecord({ ...record, title: 'Updated', updatedAt: '2026-11-13T11:00:00.000Z' }, storage);
    expect(loadAcmaAssessmentRecords(storage)).toMatchObject([{ id: 'record-1', title: 'Updated', revisions: [{ previousUpdatedAt: record.updatedAt, changedFields: ['title'] }] }]);
    expect(deleteAcmaAssessmentRecord('record-1', storage)).toEqual([]);
  });

  it('migrates version 1, 2, and 3 records without discarding them', () => {
    const current = createAcmaAssessmentRecord('legacy', '2026-11-13T10:00:00.000Z');
    const evidenceFields = ['assessmentRoute', 'assessmentMethodType', 'assessmentScope', 'assessmentStandard', 'standardEdition', 'transitionRecordReference', 'operatingConditions', 'accessibleLocations', 'equipmentOrModel', 'calibrationOrValidation', 'uncertainty', 'simultaneousFrequencyMethod', 'resultsSummary', 'assessmentConclusion', 'evidenceReferences', 'changeReview'];
    const version1 = { ...current, schemaVersion: 1 } as Record<string, unknown>;
    const version2 = { ...current, schemaVersion: 2 } as Record<string, unknown>;
    const version3 = { ...current, schemaVersion: 3 } as Record<string, unknown>;
    delete version1.revisions;
    delete version3.stationChanges;
    for (const field of evidenceFields) { delete version1[field]; delete version2[field]; }
    version2.assessmentRoute = 'unsupported-value';
    version2.revisions = [{ replacedAt: '2026-11-13T11:00:00.000Z', previousUpdatedAt: '2026-11-13T10:00:00.000Z', changedFields: ['title'], snapshot: JSON.stringify({ ...version2, revisions: [] }) }];
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([version1])))).toMatchObject([{ schemaVersion: 4, id: 'legacy', assessmentRoute: '', stationChanges: [], revisions: [] }]);
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([version2])))).toMatchObject([{ schemaVersion: 4, id: 'legacy', assessmentRoute: '', stationChanges: [], revisions: [{ changedFields: ['title'] }] }]);
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([version3])))).toMatchObject([{ schemaVersion: 4, id: 'legacy', stationChanges: [], revisions: [] }]);
  });

  it('adds revisions only for substantive saved changes and restores them as drafts', () => {
    const storage = memoryStorage();
    const original = { ...createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z'), operatorName: 'Original operator' };
    saveAcmaAssessmentRecord(original, storage);
    const changed = { ...original, operatorName: 'Updated operator', updatedAt: '2026-11-13T11:00:00.000Z' };
    const afterChange = saveAcmaAssessmentRecord(changed, storage)[0];
    expect(afterChange.revisions).toHaveLength(1);
    expect(saveAcmaAssessmentRecord({ ...afterChange, updatedAt: '2026-11-13T12:00:00.000Z' }, storage)[0].revisions).toHaveLength(1);
    expect(restoreAcmaAssessmentRevision(afterChange, afterChange.revisions[0], '2026-11-13T13:00:00.000Z')).toMatchObject({ id: 'record-1', operatorName: 'Original operator', updatedAt: '2026-11-13T13:00:00.000Z', revisions: afterChange.revisions });
  });

  it('imports supported JSON under a new local identity and rejects invalid files', () => {
    const source = { ...createAcmaAssessmentRecord('source-id', '2026-11-13T10:00:00.000Z'), title: 'Portable record' };
    expect(parseAcmaAssessmentRecord(JSON.stringify(source), 'import-id', '2026-11-13T11:00:00.000Z')).toMatchObject({ id: 'import-id', title: 'Portable record', updatedAt: '2026-11-13T11:00:00.000Z' });
    expect(() => parseAcmaAssessmentRecord('{bad', 'import-id', '2026-11-13T11:00:00.000Z')).toThrow('not valid JSON');
    expect(() => parseAcmaAssessmentRecord(JSON.stringify({ schemaVersion: 99 }), 'import-id', '2026-11-13T11:00:00.000Z')).toThrow('not a supported');
    expect(() => parseAcmaAssessmentRecord(JSON.stringify({ ...source, revisions: [{ replacedAt: source.updatedAt, previousUpdatedAt: source.updatedAt, changedFields: ['title'], snapshot: '{}' }] }), 'import-id', '2026-11-13T11:00:00.000Z')).toThrow('not a supported');
    const duplicateChange = createAcmaStationChange('duplicate');
    expect(() => parseAcmaAssessmentRecord(JSON.stringify({ ...source, stationChanges: [duplicateChange, duplicateChange] }), 'import-id', '2026-11-13T11:00:00.000Z')).toThrow('not a supported');
  });

  it('ignores malformed local data without overwriting it', () => {
    expect(loadAcmaAssessmentRecords(memoryStorage('{bad json'))).toEqual([]);
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([{ schemaVersion: 99 }])))).toEqual([]);
  });

  it('derives conditional documentation gaps without claiming verification', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(acmaRecordRequiredGaps(record)).toContain('compliance declaration made and retained');
    expect(acmaRecordRequiredGaps({ ...record, operatorType: 'body-corporate', agentUsed: true })).toEqual(expect.arrayContaining(['corporate registration number', 'corporate declarant name', 'corporate declarant position', 'agent agreement reference']));
  });

  it('serializes a validated portable record', () => {
    const serialized = serializeAcmaAssessmentRecord(createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z'));
    expect(JSON.parse(serialized)).toMatchObject({ schemaVersion: 4, id: 'record-1', assessmentRoute: '', stationChanges: [], revisions: [] });
  });
});
