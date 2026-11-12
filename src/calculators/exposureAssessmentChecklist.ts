/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateExposureProject, type ExposureProjectInput, type ExposureProjectResult } from './exposureProject';

export type AssessmentCheckStatus = 'recorded' | 'attention' | 'required' | 'external-review';
export type AssessmentEvidenceCategory = 'assumption' | 'measurement' | 'source-reference' | 'review-note';

export interface AssessmentEvidenceEntry {
  category: AssessmentEvidenceCategory;
  scopeType: 'project' | 'source' | 'point';
  scopeId?: string;
  relatedField: string;
}

export interface AssessmentChecklistInput extends ExposureProjectInput {
  evidenceEntries: AssessmentEvidenceEntry[];
}

export interface AssessmentChecklistItem {
  id: string;
  label: string;
  status: AssessmentCheckStatus;
  detail: string;
}

export interface AssessmentEvidenceTarget {
  scopeType: AssessmentEvidenceEntry['scopeType'];
  scopeId?: string;
  relatedField: string;
  label: string;
}

export interface AssessmentChecklistResult {
  items: AssessmentChecklistItem[];
  missingEvidenceTargets: AssessmentEvidenceTarget[];
  recordedCount: number;
  attentionCount: number;
  requiredCount: number;
  externalReviewCount: number;
}

function evidenceItem(input: AssessmentChecklistInput, category: AssessmentEvidenceCategory, label: string, missingDetail: string, presentDetail: string): AssessmentChecklistItem {
  const count = input.evidenceEntries.filter((entry) => entry.category === category).length;
  return count
    ? { id: `evidence-${category}`, label, status: 'recorded', detail: `${count} ${count === 1 ? 'entry is' : 'entries are'} logged. ${presentDetail}` }
    : { id: `evidence-${category}`, label, status: 'attention', detail: missingDetail };
}

function criticalEvidenceCoverage(input: AssessmentChecklistInput): { item: AssessmentChecklistItem; missing: AssessmentEvidenceTarget[] } {
  const sourceFields = [
    ['frequencyMHz', 'Frequency'], ['transmitterPowerWatts', 'Transmitter output'], ['dutyCyclePercent', 'Duty cycle'],
    ['feedSystemLossDb', 'Feed-system loss'], ['antennaGainDbi', 'Maximum antenna gain'],
    ['antennaLargestDimensionMetres', 'Largest antenna dimension'], ['antennaCentreHeightMetres', 'Antenna centre height'],
    ['eastOffsetMetres', 'East position'], ['northOffsetMetres', 'North position']
  ] as const;
  const pointFields = [['eastOffsetMetres', 'East position'], ['northOffsetMetres', 'North position'], ['heightMetres', 'Evaluation-point height']] as const;
  const requirements: AssessmentEvidenceTarget[] = [
    { scopeType: 'project', relatedField: 'sourceInventoryComplete', label: 'Whole project · Source inventory confirmation' },
    ...input.sources.flatMap((source) => sourceFields.map(([relatedField, label]) => ({ scopeType: 'source' as const, scopeId: source.id, relatedField, label: `${source.label} · ${label}` }))),
    ...input.evaluationPoints.flatMap((point) => pointFields.map(([relatedField, label]) => ({ scopeType: 'point' as const, scopeId: point.id, relatedField, label: `${point.label} · ${label}` })))
  ];
  const missing = requirements.filter((requirement) => !input.evidenceEntries.some((entry) => entry.scopeType === requirement.scopeType && entry.scopeId === requirement.scopeId && entry.relatedField === requirement.relatedField));
  const covered = requirements.length - missing.length;
  if (!missing.length) return { item: { id: 'critical-input-evidence', label: 'Critical input evidence coverage', status: 'recorded', detail: `All ${requirements.length} critical project, source, and point values have at least one field-specific evidence entry. Content quality is not verified.` }, missing };
  const examples = missing.slice(0, 4).map((requirement) => requirement.label).join('; ');
  const remainder = missing.length > 4 ? `; and ${missing.length - 4} more` : '';
  return { item: { id: 'critical-input-evidence', label: 'Critical input evidence coverage', status: 'attention', detail: `${covered} of ${requirements.length} critical values have field-specific evidence. Missing: ${examples}${remainder}. General notes do not count as field-specific coverage.` }, missing };
}

function applicabilityItem(result: ExposureProjectResult | null): AssessmentChecklistItem {
  if (!result) return { id: 'far-field-applicability', label: 'Far-field method applicability', status: 'required', detail: 'Applicability cannot be assessed until project inputs are valid.' };
  const inapplicablePaths = result.pointResults.flatMap((point) => point.sourceResults.filter((source) => source.screen.status === 'method-inapplicable'));
  return inapplicablePaths.length
    ? { id: 'far-field-applicability', label: 'Far-field method applicability', status: 'required', detail: `${inapplicablePaths.length} source-to-point ${inapplicablePaths.length === 1 ? 'path is' : 'paths are'} inside the conservative far-field boundary. Use a suitable near-field method or measurement.` }
    : { id: 'far-field-applicability', label: 'Far-field method applicability', status: 'recorded', detail: 'Every modelled source-to-point path is beyond its conservative far-field boundary.' };
}

function outcomeItem(result: ExposureProjectResult | null): AssessmentChecklistItem {
  if (!result) return { id: 'screening-outcome', label: 'Preliminary screening outcome', status: 'required', detail: 'No outcome is available until project inputs are valid.' };
  if (result.status === 'method-inapplicable') return { id: 'screening-outcome', label: 'Preliminary screening outcome', status: 'required', detail: 'The simplified screen cannot be interpreted because the far-field method is inapplicable at one or more paths.' };
  if (result.status === 'screening-inconclusive') return { id: 'screening-outcome', label: 'Preliminary screening outcome', status: 'required', detail: 'The calculated subtotal is inconclusive until the relevant station-site source inventory is confirmed.' };
  if (result.status === 'further-analysis-required') return { id: 'screening-outcome', label: 'Preliminary screening outcome', status: 'required', detail: 'At least one point reaches the preliminary trigger. Detailed calculation, measurement, or mitigation is required.' };
  return { id: 'screening-outcome', label: 'Preliminary screening outcome', status: 'recorded', detail: 'All modelled points are below the preliminary trigger under the entered conservative assumptions. This is not a compliance determination.' };
}

function externalReviewItem(result: ExposureProjectResult | null): AssessmentChecklistItem {
  if (!result) return { id: 'independent-review', label: 'Independent technical review', status: 'external-review', detail: 'Resolve invalid inputs before arranging review. The application cannot verify reviewer independence or qualifications.' };
  if (result.status === 'method-inapplicable') return { id: 'independent-review', label: 'Independent technical review', status: 'external-review', detail: 'A qualified reviewer should select or assess a suitable near-field method or measurement. The application cannot perform or verify that review.' };
  if (result.status === 'further-analysis-required') return { id: 'independent-review', label: 'Independent technical review', status: 'external-review', detail: 'A qualified reviewer should assess detailed calculations, measurements, or mitigation. A logged review note does not prove independence.' };
  return { id: 'independent-review', label: 'Independent technical review', status: 'external-review', detail: 'Independent review is recommended before relying on this preliminary screen for regulatory or installation decisions. A logged review note does not prove independence.' };
}

export function calculateAssessmentChecklist(input: AssessmentChecklistInput): AssessmentChecklistResult {
  let result: ExposureProjectResult | null = null;
  let inputError = '';
  try {
    result = calculateExposureProject(input);
  } catch (error) {
    inputError = error instanceof Error ? error.message : 'One or more project inputs are invalid.';
  }
  const criticalEvidence = criticalEvidenceCoverage(input);
  const items: AssessmentChecklistItem[] = [
    inputError
      ? { id: 'input-validity', label: 'Calculation inputs', status: 'required', detail: inputError }
      : { id: 'input-validity', label: 'Calculation inputs', status: 'recorded', detail: 'The current project inputs pass the calculation model’s range and identity checks.' },
    input.sourceInventoryComplete
      ? { id: 'source-inventory', label: 'Station-site source inventory', status: 'recorded', detail: 'The project records that relevant transmitters and antennas at this station site have been assessed. Off-site sources are not discovered automatically.' }
      : { id: 'source-inventory', label: 'Station-site source inventory', status: 'required', detail: 'Confirm all relevant transmitters and antennas at this station site before interpreting the calculated subtotal.' },
    applicabilityItem(result),
    outcomeItem(result),
    criticalEvidence.item,
    evidenceItem(input, 'assumption', 'Assumptions documented', 'Record assumptions that materially affect power, geometry, gain, duty cycle, or accessibility.', 'Presence is recorded; accuracy and completeness are not verified.'),
    evidenceItem(input, 'measurement', 'Measurements documented', 'Record relevant field measurements and how they were obtained.', 'Presence is recorded; method, calibration, coverage, and uncertainty are not verified.'),
    evidenceItem(input, 'source-reference', 'Source references documented', 'Record the regulations, manuals, specifications, or other sources supporting entered values.', 'Presence is recorded; authority, revision, and applicability are not verified.'),
    evidenceItem(input, 'review-note', 'Review notes documented', 'Record review conclusions, open questions, and follow-up work.', 'Presence is recorded; reviewer independence and qualifications are not verified.'),
    externalReviewItem(result)
  ];
  return {
    items,
    missingEvidenceTargets: criticalEvidence.missing,
    recordedCount: items.filter((item) => item.status === 'recorded').length,
    attentionCount: items.filter((item) => item.status === 'attention').length,
    requiredCount: items.filter((item) => item.status === 'required').length,
    externalReviewCount: items.filter((item) => item.status === 'external-review').length
  };
}
