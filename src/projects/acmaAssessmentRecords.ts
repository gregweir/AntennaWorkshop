/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export const ACMA_RECORD_LIBRARY_KEY = 'radiobook:antenna-workshop:acma-records:v1';
export const ACMA_RECORD_VERSION = 2 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type AcmaOperatorType = 'individual' | 'body-corporate';

export interface AcmaAssessmentRecordRevision {
  replacedAt: string;
  previousUpdatedAt: string;
  changedFields: string[];
  snapshot: string;
}

export interface AcmaAssessmentRecord {
  schemaVersion: typeof ACMA_RECORD_VERSION;
  id: string;
  updatedAt: string;
  title: string;
  operatorType: AcmaOperatorType;
  operatorName: string;
  operatorAddress: string;
  abn: string;
  corporateRegistration: string;
  declarantName: string;
  declarantPosition: string;
  stationLocation: string;
  antennaType: string;
  antennaHeight: string;
  powerLevel: string;
  antennaGain: string;
  antennaSize: string;
  antennaTilt: string;
  manufacturer: string;
  modelNumber: string;
  emissionMode: string;
  assessorName: string;
  assessorQualification: string;
  assessmentDate: string;
  assessmentMethod: string;
  measurementsAndCalculations: string;
  agentUsed: boolean;
  agentAgreementReference: string;
  declarationMade: boolean;
  additionalNotes: string;
  revisions: AcmaAssessmentRecordRevision[];
}

type RecordObject = Record<string, unknown>;
const editableTextFields: Array<keyof AcmaAssessmentRecord> = [
  'title', 'operatorName', 'operatorAddress', 'abn', 'corporateRegistration', 'declarantName',
  'declarantPosition', 'stationLocation', 'antennaType', 'antennaHeight', 'powerLevel', 'antennaGain',
  'antennaSize', 'antennaTilt', 'manufacturer', 'modelNumber', 'emissionMode', 'assessorName',
  'assessorQualification', 'assessmentDate', 'assessmentMethod', 'measurementsAndCalculations',
  'agentAgreementReference', 'additionalNotes'
];
const booleanFields: Array<keyof AcmaAssessmentRecord> = ['agentUsed', 'declarationMade'];

function hasRecordFields(candidate: RecordObject) {
  return (candidate.schemaVersion === 1 || candidate.schemaVersion === ACMA_RECORD_VERSION)
    && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
    && typeof candidate.updatedAt === 'string' && Number.isFinite(Date.parse(candidate.updatedAt))
    && editableTextFields.every((field) => typeof candidate[field] === 'string')
    && (candidate.operatorType === 'individual' || candidate.operatorType === 'body-corporate')
    && booleanFields.every((field) => typeof candidate[field] === 'boolean');
}

export function createAcmaAssessmentRecord(id: string, updatedAt: string): AcmaAssessmentRecord {
  return {
    schemaVersion: ACMA_RECORD_VERSION, id, updatedAt, title: 'Australian amateur station EME assessment',
    operatorType: 'individual', operatorName: '', operatorAddress: '', abn: '', corporateRegistration: '',
    declarantName: '', declarantPosition: '', stationLocation: '', antennaType: '', antennaHeight: '',
    powerLevel: '', antennaGain: '', antennaSize: '', antennaTilt: '', manufacturer: '', modelNumber: '',
    emissionMode: '', assessorName: '', assessorQualification: '', assessmentDate: '', assessmentMethod: '',
    measurementsAndCalculations: '', agentUsed: false, agentAgreementReference: '', declarationMade: false,
    additionalNotes: '', revisions: []
  };
}

function isRevision(value: unknown): value is AcmaAssessmentRecordRevision {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as RecordObject;
  if (typeof candidate.replacedAt !== 'string' || !Number.isFinite(Date.parse(candidate.replacedAt))) return false;
  if (typeof candidate.previousUpdatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.previousUpdatedAt))) return false;
  if (!Array.isArray(candidate.changedFields) || !candidate.changedFields.every((field) => typeof field === 'string')) return false;
  if (typeof candidate.snapshot !== 'string') return false;
  try {
    const snapshot: unknown = JSON.parse(candidate.snapshot);
    if (!snapshot || typeof snapshot !== 'object' || !hasRecordFields(snapshot as RecordObject)) return false;
    const snapshotRecord = snapshot as RecordObject;
    return snapshotRecord.schemaVersion === 1
      || (Array.isArray(snapshotRecord.revisions) && snapshotRecord.revisions.length === 0);
  } catch {
    return false;
  }
}

function normaliseRecord(value: unknown): AcmaAssessmentRecord | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as RecordObject;
  if (!hasRecordFields(candidate)) return null;
  const revisions = candidate.schemaVersion === ACMA_RECORD_VERSION ? candidate.revisions : [];
  if (!Array.isArray(revisions) || !revisions.every(isRevision)) return null;
  return { ...(candidate as unknown as AcmaAssessmentRecord), schemaVersion: ACMA_RECORD_VERSION, revisions };
}

export function validateAcmaAssessmentRecord(record: AcmaAssessmentRecord): AcmaAssessmentRecord {
  const normalised = normaliseRecord(record);
  if (!normalised) throw new TypeError('The ACMA assessment record is invalid or unsupported.');
  return normalised;
}

export function parseAcmaAssessmentRecord(serialized: string, importedId: string, importedAt: string): AcmaAssessmentRecord {
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { throw new TypeError('The selected file is not valid JSON.'); }
  const normalised = normaliseRecord(parsed);
  if (!normalised) throw new TypeError('The selected file is not a supported ACMA assessment record.');
  if (!importedId.trim() || !Number.isFinite(Date.parse(importedAt))) throw new TypeError('The imported record requires a new identifier and valid import time.');
  return { ...normalised, id: importedId, updatedAt: importedAt };
}

export function loadAcmaAssessmentRecords(storage?: StorageLike): AcmaAssessmentRecord[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACMA_RECORD_LIBRARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normaliseRecord).filter((record): record is AcmaAssessmentRecord => record !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

function recordChanges(previous: AcmaAssessmentRecord, next: AcmaAssessmentRecord): string[] {
  const fields: Array<keyof AcmaAssessmentRecord> = [...editableTextFields, ...booleanFields, 'operatorType'];
  return fields.filter((field) => previous[field] !== next[field]).map(String);
}

export function saveAcmaAssessmentRecord(record: AcmaAssessmentRecord, storage?: StorageLike): AcmaAssessmentRecord[] {
  let valid = validateAcmaAssessmentRecord(record);
  const records = loadAcmaAssessmentRecords(storage);
  const previous = records.find((candidate) => candidate.id === valid.id);
  if (previous) {
    const changedFields = recordChanges(previous, valid);
    valid = { ...valid, revisions: changedFields.length ? [{ replacedAt: valid.updatedAt, previousUpdatedAt: previous.updatedAt, changedFields, snapshot: JSON.stringify({ ...previous, revisions: [] }) }, ...previous.revisions] : previous.revisions };
  }
  const next = [valid, ...records.filter((candidate) => candidate.id !== valid.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  storage?.setItem(ACMA_RECORD_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export function restoreAcmaAssessmentRevision(current: AcmaAssessmentRecord, revision: AcmaAssessmentRecordRevision, restoredAt: string): AcmaAssessmentRecord {
  let parsed: unknown;
  try { parsed = JSON.parse(revision.snapshot); } catch { throw new TypeError('The selected record revision cannot be restored.'); }
  const snapshot = normaliseRecord(parsed);
  if (!snapshot || !Number.isFinite(Date.parse(restoredAt))) throw new TypeError('The selected record revision cannot be restored.');
  return { ...snapshot, id: current.id, updatedAt: restoredAt, revisions: current.revisions };
}

export function deleteAcmaAssessmentRecord(id: string, storage?: StorageLike): AcmaAssessmentRecord[] {
  const next = loadAcmaAssessmentRecords(storage).filter((record) => record.id !== id);
  if (next.length) storage?.setItem(ACMA_RECORD_LIBRARY_KEY, JSON.stringify(next)); else storage?.removeItem(ACMA_RECORD_LIBRARY_KEY);
  return next;
}

export function acmaRecordRequiredGaps(record: AcmaAssessmentRecord): string[] {
  const required: Array<[keyof AcmaAssessmentRecord, string]> = [
    ['operatorName', 'operator or corporate name'], ['operatorAddress', 'operator address'], ['stationLocation', 'station location'],
    ['antennaType', 'antenna type'], ['antennaHeight', 'antenna height'], ['powerLevel', 'station power level'],
    ['antennaGain', 'antenna gain'], ['antennaSize', 'antenna size'], ['antennaTilt', 'antenna tilt'],
    ['manufacturer', 'manufacturer'], ['modelNumber', 'model number'], ['emissionMode', 'emission mode'],
    ['assessorName', 'assessor name'], ['assessorQualification', 'assessor qualification'],
    ['assessmentDate', 'assessment date'], ['assessmentMethod', 'assessment method or standard'],
    ['measurementsAndCalculations', 'measurements or calculations']
  ];
  const gaps = required.filter(([field]) => !String(record[field]).trim()).map(([, label]) => label);
  if (record.operatorType === 'body-corporate') {
    if (!record.corporateRegistration.trim()) gaps.push('corporate registration number');
    if (!record.declarantName.trim()) gaps.push('corporate declarant name');
    if (!record.declarantPosition.trim()) gaps.push('corporate declarant position');
  }
  if (record.agentUsed && !record.agentAgreementReference.trim()) gaps.push('agent agreement reference');
  if (!record.declarationMade) gaps.push('compliance declaration made and retained');
  return gaps;
}

export function serializeAcmaAssessmentRecord(record: AcmaAssessmentRecord): string {
  return `${JSON.stringify(validateAcmaAssessmentRecord(record), null, 2)}\n`;
}
