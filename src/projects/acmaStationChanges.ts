/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AcmaChangeCategory = 'location' | 'power' | 'antenna-type' | 'antenna-gain' | 'antenna-size' | 'antenna-height' | 'antenna-tilt' | 'antenna-manufacturer-model' | 'emission-mode' | 'responsible-person' | 'other';
export type AcmaLowRiskReview = '' | 'remains-clause-3' | 'clause-4-applies' | 'already-higher-risk' | 'review-pending';
export type AcmaChangeAssessmentAction = '' | 'not-required-clause-3' | 'existing-record-reviewed' | 'new-assessment-completed' | 'pending';
export type AcmaChangeDeclarationAction = '' | 'not-required' | 'new-declaration-made' | 'pending';

export interface AcmaStationChange {
  id: string;
  changeDate: string;
  categories: AcmaChangeCategory[];
  summary: string;
  lowRiskReview: AcmaLowRiskReview;
  assessmentAction: AcmaChangeAssessmentAction;
  assessmentReference: string;
  declarationAction: AcmaChangeDeclarationAction;
  declarationReference: string;
  reviewedBy: string;
  notes: string;
}

export const ACMA_CHANGE_CATEGORIES: Array<{ id: AcmaChangeCategory; label: string; clause5: boolean; declarationMatter: boolean }> = [
  { id: 'location', label: 'Station location', clause5: true, declarationMatter: true },
  { id: 'power', label: 'Power fed to antennas', clause5: true, declarationMatter: false },
  { id: 'antenna-type', label: 'Antenna type', clause5: false, declarationMatter: true },
  { id: 'antenna-gain', label: 'Antenna gain', clause5: true, declarationMatter: false },
  { id: 'antenna-size', label: 'Antenna size', clause5: true, declarationMatter: false },
  { id: 'antenna-height', label: 'Antenna height', clause5: true, declarationMatter: true },
  { id: 'antenna-tilt', label: 'Antenna tilt', clause5: true, declarationMatter: false },
  { id: 'antenna-manufacturer-model', label: 'Antenna manufacturer or model', clause5: false, declarationMatter: false },
  { id: 'emission-mode', label: 'Emission mode', clause5: true, declarationMatter: false },
  { id: 'responsible-person', label: 'Responsible-person or corporate declaration details', clause5: false, declarationMatter: true },
  { id: 'other', label: 'Other exposure-relevant change', clause5: false, declarationMatter: false }
];

export function createAcmaStationChange(id: string): AcmaStationChange {
  return {
    id, changeDate: '', categories: [], summary: '', lowRiskReview: '', assessmentAction: '',
    assessmentReference: '', declarationAction: '', declarationReference: '', reviewedBy: '', notes: ''
  };
}

const categoryIds = ACMA_CHANGE_CATEGORIES.map((category) => category.id);
const lowRiskReviews: AcmaLowRiskReview[] = ['', 'remains-clause-3', 'clause-4-applies', 'already-higher-risk', 'review-pending'];
const assessmentActions: AcmaChangeAssessmentAction[] = ['', 'not-required-clause-3', 'existing-record-reviewed', 'new-assessment-completed', 'pending'];
const declarationActions: AcmaChangeDeclarationAction[] = ['', 'not-required', 'new-declaration-made', 'pending'];

export function isAcmaStationChange(value: unknown): value is AcmaStationChange {
  if (!value || typeof value !== 'object') return false;
  const change = value as Record<string, unknown>;
  return typeof change.id === 'string' && Boolean(change.id.trim())
    && typeof change.changeDate === 'string' && (!change.changeDate || Number.isFinite(Date.parse(change.changeDate)))
    && Array.isArray(change.categories) && change.categories.every((category) => categoryIds.includes(category as AcmaChangeCategory))
    && new Set(change.categories).size === change.categories.length
    && typeof change.summary === 'string'
    && lowRiskReviews.includes(change.lowRiskReview as AcmaLowRiskReview)
    && assessmentActions.includes(change.assessmentAction as AcmaChangeAssessmentAction)
    && typeof change.assessmentReference === 'string'
    && declarationActions.includes(change.declarationAction as AcmaChangeDeclarationAction)
    && typeof change.declarationReference === 'string'
    && typeof change.reviewedBy === 'string'
    && typeof change.notes === 'string';
}

export interface AcmaStationChangeReview {
  documentationGaps: string[];
  followUp: string[];
  clause5CategorySelected: boolean;
  declarationReviewRelevant: boolean;
}

export function reviewAcmaStationChange(change: AcmaStationChange): AcmaStationChangeReview {
  const documentationGaps: string[] = [];
  if (!change.changeDate) documentationGaps.push('change date');
  if (!change.categories.length) documentationGaps.push('change category');
  if (!change.summary.trim()) documentationGaps.push('change description');
  if (!change.lowRiskReview) documentationGaps.push('post-change clause 3 review');
  if (!change.reviewedBy.trim()) documentationGaps.push('reviewer or responsible person');

  const clause5CategorySelected = change.categories.some((id) => ACMA_CHANGE_CATEGORIES.find((category) => category.id === id)?.clause5);
  const declarationReviewRelevant = change.categories.some((id) => ACMA_CHANGE_CATEGORIES.find((category) => category.id === id)?.declarationMatter);
  const followUp: string[] = [];

  if (change.lowRiskReview === 'review-pending' || !change.lowRiskReview) followUp.push('complete the post-change clause 3 review');
  if (change.lowRiskReview === 'remains-clause-3' && (!change.assessmentAction || change.assessmentAction === 'pending')) followUp.push('record the clause 4 assessment action decision');
  if (change.lowRiskReview === 'clause-4-applies' || change.lowRiskReview === 'already-higher-risk') {
    if (!change.assessmentAction || change.assessmentAction === 'pending' || change.assessmentAction === 'not-required-clause-3') followUp.push('resolve the clause 4 assessment action');
  }
  if ((change.assessmentAction === 'existing-record-reviewed' || change.assessmentAction === 'new-assessment-completed') && !change.assessmentReference.trim()) followUp.push('identify the supporting assessment record');
  if (declarationReviewRelevant) {
    if (!change.declarationAction || change.declarationAction === 'pending') followUp.push('resolve whether a new declaration is required and retain it if made');
  }
  if (change.declarationAction === 'new-declaration-made' && !change.declarationReference.trim()) followUp.push('identify the new declaration');

  return { documentationGaps, followUp, clause5CategorySelected, declarationReviewRelevant };
}
