/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { ACMA_ASSESSMENT_MODEL } from '../calculators/acmaAssessment';
import { ACMA_ASSESSMENT_ROUTES, ACMA_ASSESSMENT_STANDARDS, evaluateAcmaEvidence } from '../calculators/acmaEvidence';
import { acmaRecordRequiredGaps, type AcmaAssessmentRecord } from '../projects/acmaAssessmentRecords';
import { ACMA_CHANGE_CATEGORIES, reviewAcmaStationChange } from '../projects/acmaStationChanges';

interface Props {
  record: AcmaAssessmentRecord;
  savedAt?: string;
  hasUnsavedChanges: boolean;
}

function valueOrGap(value: string) {
  return value.trim() || 'Not documented';
}

function PrintField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? 'acma-print-field acma-print-wide' : 'acma-print-field'}><dt>{label}</dt><dd>{valueOrGap(value)}</dd></div>;
}

const methodLabels: Record<AcmaAssessmentRecord['assessmentMethodType'], string> = {
  '': 'Not documented', measurement: 'Measurement', calculation: 'Calculation / computation', 'measurement-and-calculation': 'Measurement and calculation'
};
const scopeLabels: Record<AcmaAssessmentRecord['assessmentScope'], string> = {
  '': 'Not documented', 'single-station': 'This station', 'whole-site': 'All stations at the shared site'
};
const lowRiskLabels = {
  '': 'Not documented', 'remains-clause-3': 'A clause 3 low-risk path still applies', 'clause-4-applies': 'No clause 3 path applies; clause 4 applies',
  'already-higher-risk': 'Station was already subject to clause 4', 'review-pending': 'Review not completed'
} as const;
const assessmentActionLabels = {
  '': 'Not documented', 'not-required-clause-3': 'No clause 4 action recorded because clause 3 still applies', 'existing-record-reviewed': 'Existing assessment record reviewed for changed configuration',
  'new-assessment-completed': 'New measurement or calculation completed', pending: 'Assessment action pending'
} as const;
const declarationActionLabels = {
  '': 'Not documented', 'not-required': 'Reviewed; no declaration information changed or became incorrect', 'new-declaration-made': 'New declaration made and retained', pending: 'Declaration review pending'
} as const;

export function AcmaAssessmentPrintReport({ record, savedAt, hasUnsavedChanges }: Props) {
  const gaps = acmaRecordRequiredGaps(record);
  const evidence = evaluateAcmaEvidence(record);
  const route = ACMA_ASSESSMENT_ROUTES.find((candidate) => candidate.id === record.assessmentRoute)?.label ?? 'Not documented';
  const standard = ACMA_ASSESSMENT_STANDARDS.find((candidate) => candidate.id === record.assessmentStandard)?.label ?? 'Not documented';

  return <article className="acma-print-report" aria-label="Printable Australian amateur station assessment record">
    <header className="acma-print-heading">
      <img src="/antennas/TartanleafLogo.jpg" alt="Tartanleaf tartan maple-leaf logo" width="56" height="56" />
      <div><p>RadioBook Antenna Workshop · Australian EME record</p><h1>{record.title || 'Untitled Australian amateur station assessment'}</h1><span>Clauses 4–6 documentation package · Schema v{record.schemaVersion}</span></div>
    </header>

    <div className="acma-print-warning"><strong>Record copy — not a compliance certificate</strong><span>This report reproduces user-entered information. It does not verify station facts, measurements, calculations, qualifications, standard applicability, declarations, transitional eligibility, or compliance.</span></div>

    <section><h2>Record identity and responsible person</h2><dl className="acma-print-grid">
      <PrintField label="Record ID" value={record.id} /><PrintField label="Record state" value={savedAt ? hasUnsavedChanges ? `Unsaved changes · Last saved ${new Date(savedAt).toLocaleString()}` : `Saved ${new Date(savedAt).toLocaleString()}` : 'Unsaved draft'} />
      <PrintField label="Operator type" value={record.operatorType === 'body-corporate' ? 'Body corporate' : 'Individual'} /><PrintField label="Operator or corporate name" value={record.operatorName} />
      <PrintField label="Address" value={record.operatorAddress} wide /><PrintField label="ABN" value={record.abn} />
      {record.operatorType === 'body-corporate' && <><PrintField label="ACN, ARBN, or registration number" value={record.corporateRegistration} /><PrintField label="Declarant name" value={record.declarantName} /><PrintField label="Declarant position" value={record.declarantPosition} /></>}
    </dl></section>

    <section><h2>Installed station</h2><dl className="acma-print-grid">
      <PrintField label="Station location" value={record.stationLocation} wide /><PrintField label="Antenna type" value={record.antennaType} /><PrintField label="Height above ground or accessible surface" value={record.antennaHeight} />
      <PrintField label="Power level" value={record.powerLevel} /><PrintField label="Antenna gain" value={record.antennaGain} /><PrintField label="Antenna size" value={record.antennaSize} /><PrintField label="Antenna tilt" value={record.antennaTilt} />
      <PrintField label="Manufacturer" value={record.manufacturer} /><PrintField label="Model number" value={record.modelNumber} /><PrintField label="Emission mode" value={record.emissionMode} />
    </dl></section>

    <section><h2>Assessment basis and retained record</h2><dl className="acma-print-grid">
      <PrintField label="Assessment or transitional route" value={route} wide /><PrintField label="Named assessment standard" value={standard} /><PrintField label="Standard title, edition, or publication date" value={record.standardEdition} />
      <PrintField label="Method type" value={methodLabels[record.assessmentMethodType]} /><PrintField label="Assessment scope" value={scopeLabels[record.assessmentScope]} /><PrintField label="Transitional record reference" value={record.transitionRecordReference} wide />
      <PrintField label="Assessor name" value={record.assessorName} /><PrintField label="Assessor qualification" value={record.assessorQualification} /><PrintField label="Assessment date" value={record.assessmentDate} /><PrintField label="Assessment method summary" value={record.assessmentMethod} />
      <PrintField label="Measurements or calculations" value={record.measurementsAndCalculations} wide /><PrintField label="Agent arrangement" value={record.agentUsed ? 'Agent recorded as used' : 'No agent recorded'} /><PrintField label="Written agent-agreement reference" value={record.agentAgreementReference} />
      <PrintField label="Additional notes and linked evidence" value={record.additionalNotes} wide />
    </dl></section>

    <section><h2>Assessment reproducibility evidence</h2><dl className="acma-print-grid">
      <PrintField label="Highest normal operating conditions assessed" value={record.operatingConditions} wide /><PrintField label="Publicly accessible locations assessed" value={record.accessibleLocations} wide />
      <PrintField label="Equipment, software, or computation model" value={record.equipmentOrModel} /><PrintField label="Calibration or model validation" value={record.calibrationOrValidation} /><PrintField label="Uncertainty and conservatism" value={record.uncertainty} /><PrintField label="Simultaneous-frequency treatment" value={record.simultaneousFrequencyMethod} />
      <PrintField label="Results summary with quantities and units" value={record.resultsSummary} wide /><PrintField label="Assessor conclusion and limitations" value={record.assessmentConclusion} wide /><PrintField label="Supporting file and document references" value={record.evidenceReferences} wide /><PrintField label="Station-change review basis" value={record.changeReview} wide />
    </dl></section>

    <section><h2>Responsible-person declaration</h2><div className="acma-print-declaration"><strong>{record.declarationMade ? 'Recorded as made and retained' : 'Not recorded as made and retained'}</strong><p>The worksheet records whether the responsible person states that a declaration containing the required clause 2(1) compliance statement has been made and retained. This report does not authenticate that declaration.</p></div></section>

    <section><h2>Station-change and reassessment log</h2>{record.stationChanges.length ? <ol className="acma-print-change-log">{record.stationChanges.map((change, index) => {
      const review = reviewAcmaStationChange(change);
      return <li key={change.id}><h3>Change {index + 1} · {change.changeDate || 'Date not documented'}</h3><dl className="acma-print-grid">
        <PrintField label="Categories" value={change.categories.map((id) => ACMA_CHANGE_CATEGORIES.find((category) => category.id === id)?.label ?? id).join(' · ')} wide /><PrintField label="Change description" value={change.summary} wide />
        <PrintField label="Post-change clause 3 review" value={lowRiskLabels[change.lowRiskReview]} /><PrintField label="Clause 4 assessment action" value={assessmentActionLabels[change.assessmentAction]} /><PrintField label="Assessment record reference" value={change.assessmentReference} wide />
        <PrintField label="Clause 6 declaration action" value={declarationActionLabels[change.declarationAction]} /><PrintField label="New declaration reference" value={change.declarationReference} /><PrintField label="Reviewed by" value={change.reviewedBy} /><PrintField label="Notes and supporting references" value={change.notes} wide />
        <PrintField label="Derived documentation gaps" value={review.documentationGaps.join(' · ') || 'None shown'} /><PrintField label="Derived follow-up" value={review.followUp.join(' · ') || 'None shown'} />
      </dl></li>;
    })}</ol> : <p className="acma-print-empty">No station-change entries are recorded.</p>}</section>

    <section><h2>Documentation summary</h2><dl className="acma-print-grid">
      <PrintField label="Clause 6 worksheet gaps" value={gaps.join(' · ') || 'No named field gaps shown'} wide /><PrintField label="Clause 4 record-anchor gaps" value={evidence.recordAnchorGaps.join(' · ') || 'No named anchor gaps shown'} wide /><PrintField label="Supporting quality prompts" value={evidence.supportingEvidenceGaps.join(' · ') || 'No prompt gaps shown'} wide />
      <PrintField label="Earlier saved revisions" value={`${record.revisions.length} retained in the local/JSON record; revision snapshots are not reproduced in this print copy`} wide />
    </dl><p className="acma-print-summary-limit">A completed documentation summary is not a technical or legal finding.</p></section>

    <footer><p><strong>Official source:</strong> {ACMA_ASSESSMENT_MODEL.sourceRevision}</p><p>{ACMA_ASSESSMENT_MODEL.source.url}</p><p>Model {ACMA_ASSESSMENT_MODEL.id} v{ACMA_ASSESSMENT_MODEL.version} · Source reviewed {ACMA_ASSESSMENT_MODEL.reviewedOn}</p><p>Generated from RadioBook Antenna Workshop · Tartanleaf.com Inc. · Greg Weir, VA1GW</p></footer>
  </article>;
}
