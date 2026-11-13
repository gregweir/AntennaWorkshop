/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { AcmaAssessmentRecord, AcmaAssessmentRoute, AcmaAssessmentStandard } from '../projects/acmaAssessmentRecords';

export const ACMA_EVIDENCE_MODEL = {
  id: 'acma-clause-4-assessment-evidence-workflow',
  version: '1.0.0',
  sourceRevision: 'Radiocommunications (Amateur Stations) Class Licence 2023, Schedule 1, clauses 2–6',
  reviewedOn: '2026-11-13',
  sourceUrl: 'https://www.legislation.gov.au/F2023L01648/latest/text'
} as const;

export const ACMA_ASSESSMENT_STANDARDS: Array<{ id: Exclude<AcmaAssessmentStandard, ''>; label: string; current: boolean }> = [
  { id: 'as-nzs-2772-2', label: 'AS/NZS 2772.2', current: true },
  { id: 'ieee-c95-3', label: 'IEEE C95.3', current: true },
  { id: 'iec-62232', label: 'IEC 62232', current: true },
  { id: 'legacy-or-transitional', label: 'Legacy or transitional document', current: false }
];

export const ACMA_ASSESSMENT_ROUTES: Array<{ id: Exclude<AcmaAssessmentRoute, ''>; label: string; detail: string }> = [
  { id: 'current', label: 'Current named-standard assessment', detail: 'A new measurement or calculation under an applicable AS/NZS 2772.2, IEEE C95.3, or IEC 62232 edition.' },
  { id: 'pre-2003', label: 'Pre-1 March 2003 document', detail: 'A narrowly defined historical transmitter-licence record under clause 4(4).' },
  { id: 'pre-class-licence', label: '1 March 2003 to class-licence commencement', detail: 'A retained assessment record that meets clause 4(6).' },
  { id: 'pre-amendment', label: 'Before a named standard was amended', detail: 'A record made under the immediately preceding edition and retained under clause 4(7).' },
  { id: 'post-amendment-grace', label: 'Within one year after a named-standard amendment', detail: 'A time-limited route using the immediately preceding edition under clause 4(8).' }
];

export interface AcmaEvidenceReadiness {
  recordAnchorGaps: string[];
  supportingEvidenceGaps: string[];
  routeNote: string;
}

function isCurrentNamedStandard(standard: AcmaAssessmentStandard) {
  return standard === 'as-nzs-2772-2' || standard === 'ieee-c95-3' || standard === 'iec-62232';
}

export function evaluateAcmaEvidence(record: AcmaAssessmentRecord): AcmaEvidenceReadiness {
  const recordAnchorGaps: string[] = [];
  if (!record.assessmentRoute) recordAnchorGaps.push('assessment or transitional route');
  if (!record.assessorName.trim()) recordAnchorGaps.push('assessor name');
  if (!record.assessorQualification.trim()) recordAnchorGaps.push('assessor qualification');
  if (!record.assessmentDate.trim()) recordAnchorGaps.push('assessment date');
  if (!record.measurementsAndCalculations.trim()) recordAnchorGaps.push('retained measurements or calculations');

  if (record.assessmentRoute === 'current' && !isCurrentNamedStandard(record.assessmentStandard)) {
    recordAnchorGaps.push('applicable named standard');
  }
  if (record.assessmentRoute && record.assessmentRoute !== 'current') {
    if (!record.transitionRecordReference.trim()) recordAnchorGaps.push('transitional record reference');
    if ((record.assessmentRoute === 'pre-amendment' || record.assessmentRoute === 'post-amendment-grace') && !isCurrentNamedStandard(record.assessmentStandard)) {
      recordAnchorGaps.push('named standard associated with the amendment');
    }
  }

  const supporting: Array<[keyof AcmaAssessmentRecord, string]> = [
    ['assessmentMethodType', 'measurement or calculation method'],
    ['assessmentScope', 'single-station or whole-site scope'],
    ['standardEdition', 'standard title or edition'],
    ['operatingConditions', 'highest normal operating conditions'],
    ['accessibleLocations', 'assessed public-access locations'],
    ['equipmentOrModel', 'measurement equipment or computation model'],
    ['calibrationOrValidation', 'calibration or model-validation evidence'],
    ['uncertainty', 'measurement or modelling uncertainty'],
    ['resultsSummary', 'results summary'],
    ['assessmentConclusion', 'assessor conclusion'],
    ['evidenceReferences', 'supporting file or document references'],
    ['changeReview', 'station-change review basis']
  ];
  const supportingEvidenceGaps = supporting.filter(([field]) => !String(record[field]).trim()).map(([, label]) => label);

  const routeNote = record.assessmentRoute === 'post-amendment-grace'
    ? 'Verify the assessment date is within the one-year period in clause 4(8) and retain the record.'
    : record.assessmentRoute === 'pre-amendment'
      ? 'Confirm the assessment predates the amendment and that the record has remained in possession.'
      : record.assessmentRoute === 'pre-class-licence'
        ? 'Confirm every condition in clause 4(6), including continuous retention, is satisfied.'
        : record.assessmentRoute === 'pre-2003'
          ? 'Confirm every historical transmitter-licence and document condition in clauses 4(4) and 4(5).'
          : record.assessmentRoute === 'current'
            ? 'Confirm the selected standard actually applies to this station and use the applicable edition.'
            : 'Select the route supported by the actual retained assessment record.';

  return { recordAnchorGaps, supportingEvidenceGaps, routeNote };
}
