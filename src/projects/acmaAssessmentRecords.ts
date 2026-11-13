/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { isAcmaStationChange, type AcmaStationChange } from './acmaStationChanges';
import type { AcmaAssessmentHandoff } from '../calculators/acmaAssessment';

export const ACMA_RECORD_LIBRARY_KEY = 'radiobook:antenna-workshop:acma-records:v1';
export const ACMA_RECORD_VERSION = 4 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type AcmaOperatorType = 'individual' | 'body-corporate';
export type AcmaAssessmentRoute = '' | 'current' | 'pre-2003' | 'pre-class-licence' | 'pre-amendment' | 'post-amendment-grace';
export type AcmaAssessmentMethodType = '' | 'measurement' | 'calculation' | 'measurement-and-calculation';
export type AcmaAssessmentScope = '' | 'single-station' | 'whole-site';
export type AcmaAssessmentStandard = '' | 'as-nzs-2772-2' | 'ieee-c95-3' | 'iec-62232' | 'legacy-or-transitional';

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
  assessmentRoute: AcmaAssessmentRoute;
  assessmentMethodType: AcmaAssessmentMethodType;
  assessmentScope: AcmaAssessmentScope;
  assessmentStandard: AcmaAssessmentStandard;
  standardEdition: string;
  transitionRecordReference: string;
  operatingConditions: string;
  accessibleLocations: string;
  equipmentOrModel: string;
  calibrationOrValidation: string;
  uncertainty: string;
  simultaneousFrequencyMethod: string;
  resultsSummary: string;
  assessmentConclusion: string;
  evidenceReferences: string;
  changeReview: string;
  agentUsed: boolean;
  agentAgreementReference: string;
  declarationMade: boolean;
  additionalNotes: string;
  stationChanges: AcmaStationChange[];
  revisions: AcmaAssessmentRecordRevision[];
}

type RecordObject = Record<string, unknown>;
const legacyTextFields: Array<keyof AcmaAssessmentRecord> = [
  'title', 'operatorName', 'operatorAddress', 'abn', 'corporateRegistration', 'declarantName',
  'declarantPosition', 'stationLocation', 'antennaType', 'antennaHeight', 'powerLevel', 'antennaGain',
  'antennaSize', 'antennaTilt', 'manufacturer', 'modelNumber', 'emissionMode', 'assessorName',
  'assessorQualification', 'assessmentDate', 'assessmentMethod', 'measurementsAndCalculations',
  'agentAgreementReference', 'additionalNotes'
];
const evidenceTextFields: Array<keyof AcmaAssessmentRecord> = [
  'standardEdition', 'transitionRecordReference', 'operatingConditions', 'accessibleLocations',
  'equipmentOrModel', 'calibrationOrValidation', 'uncertainty', 'simultaneousFrequencyMethod',
  'resultsSummary', 'assessmentConclusion', 'evidenceReferences', 'changeReview'
];
const editableTextFields = [...legacyTextFields, ...evidenceTextFields];
const booleanFields: Array<keyof AcmaAssessmentRecord> = ['agentUsed', 'declarationMade'];
const assessmentRoutes: AcmaAssessmentRoute[] = ['', 'current', 'pre-2003', 'pre-class-licence', 'pre-amendment', 'post-amendment-grace'];
const assessmentMethodTypes: AcmaAssessmentMethodType[] = ['', 'measurement', 'calculation', 'measurement-and-calculation'];
const assessmentScopes: AcmaAssessmentScope[] = ['', 'single-station', 'whole-site'];
const assessmentStandards: AcmaAssessmentStandard[] = ['', 'as-nzs-2772-2', 'ieee-c95-3', 'iec-62232', 'legacy-or-transitional'];

const evidenceDefaults = {
  assessmentRoute: '' as AcmaAssessmentRoute,
  assessmentMethodType: '' as AcmaAssessmentMethodType,
  assessmentScope: '' as AcmaAssessmentScope,
  assessmentStandard: '' as AcmaAssessmentStandard,
  standardEdition: '', transitionRecordReference: '', operatingConditions: '', accessibleLocations: '',
  equipmentOrModel: '', calibrationOrValidation: '', uncertainty: '', simultaneousFrequencyMethod: '',
  resultsSummary: '', assessmentConclusion: '', evidenceReferences: '', changeReview: ''
};

function hasRecordFields(candidate: RecordObject) {
  const hasBaseFields = (candidate.schemaVersion === 1 || candidate.schemaVersion === 2 || candidate.schemaVersion === 3 || candidate.schemaVersion === ACMA_RECORD_VERSION)
    && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
    && typeof candidate.updatedAt === 'string' && Number.isFinite(Date.parse(candidate.updatedAt))
    && legacyTextFields.every((field) => typeof candidate[field] === 'string')
    && (candidate.operatorType === 'individual' || candidate.operatorType === 'body-corporate')
    && booleanFields.every((field) => typeof candidate[field] === 'boolean');
  if (!hasBaseFields || candidate.schemaVersion === 1 || candidate.schemaVersion === 2) return hasBaseFields;
  const hasEvidenceFields = editableTextFields.every((field) => typeof candidate[field] === 'string')
    && assessmentRoutes.includes(candidate.assessmentRoute as AcmaAssessmentRoute)
    && assessmentMethodTypes.includes(candidate.assessmentMethodType as AcmaAssessmentMethodType)
    && assessmentScopes.includes(candidate.assessmentScope as AcmaAssessmentScope)
    && assessmentStandards.includes(candidate.assessmentStandard as AcmaAssessmentStandard);
  if (!hasEvidenceFields || candidate.schemaVersion === 3) return hasEvidenceFields;
  return Array.isArray(candidate.stationChanges)
    && candidate.stationChanges.every(isAcmaStationChange)
    && new Set(candidate.stationChanges.map((change) => (change as AcmaStationChange).id)).size === candidate.stationChanges.length;
}

export function createAcmaAssessmentRecord(id: string, updatedAt: string): AcmaAssessmentRecord {
  return {
    schemaVersion: ACMA_RECORD_VERSION, id, updatedAt, title: 'Australian amateur station EME assessment',
    operatorType: 'individual', operatorName: '', operatorAddress: '', abn: '', corporateRegistration: '',
    declarantName: '', declarantPosition: '', stationLocation: '', antennaType: '', antennaHeight: '',
    powerLevel: '', antennaGain: '', antennaSize: '', antennaTilt: '', manufacturer: '', modelNumber: '',
    emissionMode: '', assessorName: '', assessorQualification: '', assessmentDate: '', assessmentMethod: '',
    measurementsAndCalculations: '', agentUsed: false, agentAgreementReference: '', declarationMade: false,
    ...evidenceDefaults, additionalNotes: '', stationChanges: [], revisions: []
  };
}

export function createAcmaAssessmentRecordFromHandoff(id: string, updatedAt: string, handoff: AcmaAssessmentHandoff): AcmaAssessmentRecord {
  const { input, result } = handoff;
  const stationType = input.stationType === 'fixed' ? 'Fixed / non-mobile station' : 'Mobile station';
  const accessibility = input.everyAntennaInaccessibleToPublic
    ? 'Gateway input: every antenna was marked inaccessible to the general public.'
    : 'Gateway input: not every antenna was marked inaccessible to the general public.';
  const simultaneousFrequencyMethod = input.simultaneousMultipleFrequencies
    ? 'Gateway input indicates simultaneous multiple-frequency operation; RPS S-1 section 3 treatment remains to be documented.'
    : 'Gateway input indicates simultaneous multiple-frequency operation was not selected; confirm this against the installed station.';
  const sharedSite = input.multipleStationsAtSite
    ? 'Gateway input indicates more than one station at the site; any whole-site treatment remains to be documented.'
    : 'Gateway input indicates more than one station at the site was not selected; confirm the site inventory.';
  const branch = result.higherRiskMeasurementRequired
    ? 'The gateway found no clause 3 low-risk path. Clause 4 assessment work and the clause 6 record package remain to be completed and reviewed.'
    : `The gateway identified the ${result.lowRiskPath ?? 'low-risk'} clause 3 path. The public-exposure condition still applies, and this transfer is not compliance evidence.`;

  return {
    ...createAcmaAssessmentRecord(id, updatedAt),
    antennaHeight: `${input.lowestAntennaBaseHeightMetres} m base height of lowest antenna (gateway input)`,
    powerLevel: `${input.averageTotalPowerWatts} W average total power supplied to all antennas (gateway input)`,
    operatingConditions: [
      'Transferred gateway inputs only — these are not assessed operating conditions.',
      `Station type: ${stationType}`,
      `Average total power supplied to all antennas: ${input.averageTotalPowerWatts} W`,
      accessibility,
      `Base height of lowest antenna: ${input.lowestAntennaBaseHeightMetres} m`,
      `Average total EIRP in any direction: ${input.averageTotalEirpWatts} W EIRP`,
      sharedSite
    ].join('\n'),
    simultaneousFrequencyMethod,
    additionalNotes: [
      `Gateway transfer time: ${handoff.transferredAt}`,
      `Gateway model: ${result.modelId} version ${result.modelVersion}`,
      branch,
      'Only gateway inputs and model provenance were transferred. Assessment route, standard, scope, method, assessor details, measurements, calculations, conclusions, and declaration remain deliberately blank.'
    ].join('\n')
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
  const revisions = candidate.schemaVersion === 1 ? [] : candidate.revisions;
  if (!Array.isArray(revisions) || !revisions.every(isRevision)) return null;
  const migrated = candidate.schemaVersion === ACMA_RECORD_VERSION
    ? candidate
    : candidate.schemaVersion === 3
      ? { ...candidate, stationChanges: [] }
      : { ...candidate, ...evidenceDefaults, stationChanges: [] };
  return { ...(migrated as unknown as AcmaAssessmentRecord), schemaVersion: ACMA_RECORD_VERSION, revisions };
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
  const fields: Array<keyof AcmaAssessmentRecord> = [...editableTextFields, ...booleanFields, 'operatorType', 'assessmentRoute', 'assessmentMethodType', 'assessmentScope', 'assessmentStandard'];
  const changes = fields.filter((field) => previous[field] !== next[field]).map(String);
  if (JSON.stringify(previous.stationChanges) !== JSON.stringify(next.stationChanges)) changes.push('stationChanges');
  return changes;
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
