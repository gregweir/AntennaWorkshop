/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type ResultEvidenceKind = 'calculated' | 'source' | 'assumption' | 'measure';

export const RESULT_EVIDENCE = {
  calculated: {
    label: 'Calculated',
    explanation: 'Derived from the displayed inputs and this calculator model.'
  },
  source: {
    label: 'Published starting point',
    explanation: 'Taken from, or closely tied to, a cited design reference.'
  },
  assumption: {
    label: 'Entered assumption',
    explanation: 'A selected or entered value that must match the intended build.'
  },
  measure: {
    label: 'Must measure',
    explanation: 'Not predicted here; verify the completed installation.'
  }
} as const satisfies Record<ResultEvidenceKind, { label: string; explanation: string }>;

const measurementPattern = /not inferred|must measure|model and measure|measure the|evaluate the complete|compare the installed|measure all four/i;
const sourcePattern = /classical|source |reference element|reference tolerance|direction convention|response context|ground-return requirement|antenna earth connection|isolation transformer windings|qst reference/i;
const assumptionPattern = /assum|selected|entered|receive range|operating range|tau \/ sigma|pitch angle|cone included angle|radial wires|average wire height|feedline impedance|base height|apex height|lower corner height|termination resistance/i;
const supportingPattern = /wavelength|electrical length|electrical degrees|ratio|impedance|reactance|area|bandwidth|shortening|reference frequency|feedline efficiency|ideal |circumference at|perimeter at|diameter at|wire length at/i;

export function classifyResultEvidence(term: string, value: string): ResultEvidenceKind {
  const text = `${term} ${value}`;
  if (measurementPattern.test(text)) return 'measure';
  if (sourcePattern.test(text)) return 'source';
  if (assumptionPattern.test(text)) return 'assumption';
  return 'calculated';
}

export function isSupportingResult(term: string): boolean {
  return supportingPattern.test(term);
}
