/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ACMA_RECORD_LIBRARY_KEY, acmaRecordRequiredGaps, createAcmaAssessmentRecord, deleteAcmaAssessmentRecord, loadAcmaAssessmentRecords, parseAcmaAssessmentRecord, restoreAcmaAssessmentRevision, saveAcmaAssessmentRecord, serializeAcmaAssessmentRecord, type StorageLike } from './acmaAssessmentRecords';

function memoryStorage(initial?: string): StorageLike {
  const values = new Map<string, string>();
  if (initial) values.set(ACMA_RECORD_LIBRARY_KEY, initial);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}

describe('ACMA assessment record library', () => {
  it('saves, updates, and deletes versioned records', () => {
    const storage = memoryStorage();
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(saveAcmaAssessmentRecord(record, storage)).toHaveLength(1);
    saveAcmaAssessmentRecord({ ...record, title: 'Updated', updatedAt: '2026-11-13T11:00:00.000Z' }, storage);
    expect(loadAcmaAssessmentRecords(storage)).toMatchObject([{ id: 'record-1', title: 'Updated', revisions: [{ previousUpdatedAt: record.updatedAt, changedFields: ['title'] }] }]);
    expect(deleteAcmaAssessmentRecord('record-1', storage)).toEqual([]);
  });

  it('migrates version 1 records without discarding them', () => {
    const legacy = { ...createAcmaAssessmentRecord('legacy', '2026-11-13T10:00:00.000Z'), schemaVersion: 1 } as Record<string, unknown>;
    delete legacy.revisions;
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([legacy])))).toMatchObject([{ schemaVersion: 2, id: 'legacy', revisions: [] }]);
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
    expect(JSON.parse(serialized)).toMatchObject({ schemaVersion: 2, id: 'record-1', revisions: [] });
  });
});
