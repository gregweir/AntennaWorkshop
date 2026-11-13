/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export const ACMA_RECORD_LIBRARY_KEY = 'radiobook:antenna-workshop:acma-records:v1';
export const ACMA_RECORD_VERSION = 1 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type AcmaOperatorType = 'individual' | 'body-corporate';

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
}

const textFields: Array<keyof AcmaAssessmentRecord> = [
  'id', 'updatedAt', 'title', 'operatorName', 'operatorAddress', 'abn', 'corporateRegistration',
  'declarantName', 'declarantPosition', 'stationLocation', 'antennaType', 'antennaHeight',
  'powerLevel', 'antennaGain', 'antennaSize', 'antennaTilt', 'manufacturer', 'modelNumber',
  'emissionMode', 'assessorName', 'assessorQualification', 'assessmentDate', 'assessmentMethod',
  'measurementsAndCalculations', 'agentAgreementReference', 'additionalNotes'
];

export function createAcmaAssessmentRecord(id: string, updatedAt: string): AcmaAssessmentRecord {
  return {
    schemaVersion: ACMA_RECORD_VERSION, id, updatedAt, title: 'Australian amateur station EME assessment',
    operatorType: 'individual', operatorName: '', operatorAddress: '', abn: '', corporateRegistration: '',
    declarantName: '', declarantPosition: '', stationLocation: '', antennaType: '', antennaHeight: '',
    powerLevel: '', antennaGain: '', antennaSize: '', antennaTilt: '', manufacturer: '', modelNumber: '',
    emissionMode: '', assessorName: '', assessorQualification: '', assessmentDate: '', assessmentMethod: '',
    measurementsAndCalculations: '', agentUsed: false, agentAgreementReference: '', declarationMade: false,
    additionalNotes: ''
  };
}

function isRecord(value: unknown): value is AcmaAssessmentRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.schemaVersion === ACMA_RECORD_VERSION
    && textFields.every((field) => typeof candidate[field] === 'string')
    && typeof candidate.id === 'string' && Boolean(candidate.id.trim())
    && typeof candidate.updatedAt === 'string' && Number.isFinite(Date.parse(candidate.updatedAt))
    && (candidate.operatorType === 'individual' || candidate.operatorType === 'body-corporate')
    && typeof candidate.agentUsed === 'boolean'
    && typeof candidate.declarationMade === 'boolean';
}

export function validateAcmaAssessmentRecord(record: AcmaAssessmentRecord): AcmaAssessmentRecord {
  if (!isRecord(record)) throw new TypeError('The ACMA assessment record is invalid or unsupported.');
  return record;
}

export function loadAcmaAssessmentRecords(storage?: StorageLike): AcmaAssessmentRecord[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ACMA_RECORD_LIBRARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

export function saveAcmaAssessmentRecord(record: AcmaAssessmentRecord, storage?: StorageLike): AcmaAssessmentRecord[] {
  const valid = validateAcmaAssessmentRecord(record);
  const records = loadAcmaAssessmentRecords(storage).filter((candidate) => candidate.id !== valid.id);
  const next = [valid, ...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  storage?.setItem(ACMA_RECORD_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export function deleteAcmaAssessmentRecord(id: string, storage?: StorageLike): AcmaAssessmentRecord[] {
  const next = loadAcmaAssessmentRecords(storage).filter((record) => record.id !== id);
  if (next.length) storage?.setItem(ACMA_RECORD_LIBRARY_KEY, JSON.stringify(next));
  else storage?.removeItem(ACMA_RECORD_LIBRARY_KEY);
  return next;
}

export function acmaRecordRequiredGaps(record: AcmaAssessmentRecord): string[] {
  const required: Array<[keyof AcmaAssessmentRecord, string]> = [
    ['operatorName', 'operator or corporate name'], ['operatorAddress', 'operator address'],
    ['stationLocation', 'station location'], ['antennaType', 'antenna type'], ['antennaHeight', 'antenna height'],
    ['powerLevel', 'station power level'], ['antennaGain', 'antenna gain'], ['antennaSize', 'antenna size'],
    ['antennaTilt', 'antenna tilt'], ['manufacturer', 'manufacturer'], ['modelNumber', 'model number'],
    ['emissionMode', 'emission mode'], ['assessorName', 'assessor name'],
    ['assessorQualification', 'assessor qualification'], ['assessmentDate', 'assessment date'],
    ['assessmentMethod', 'assessment method or standard'], ['measurementsAndCalculations', 'measurements or calculations']
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
