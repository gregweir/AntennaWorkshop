/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type FeedpointTopology = 'balanced-centre' | 'asymmetrical' | 'end-fed';
export type FeedlineForm = 'coax' | 'balanced-line';
export type CommonModePlan = 'none' | 'documented-control';
export type ReturnPathPlan = 'unspecified' | 'documented';

export interface BalancePathInput {
  topology: FeedpointTopology;
  feedline: FeedlineForm;
  commonModePlan: CommonModePlan;
  returnPathPlan: ReturnPathPlan;
}

export interface BalancePathResult extends BalancePathInput {
  status: 'requires-plan' | 'verify-installed';
  headline: string;
  intendedPath: string;
  concern: string;
  controlMeaning: string;
  showUnintendedOutsidePath: boolean;
  checks: string[];
}

export function evaluateBalancePath(input: BalancePathInput): BalancePathResult {
  if (!['balanced-centre', 'asymmetrical', 'end-fed'].includes(input.topology)
    || !['coax', 'balanced-line'].includes(input.feedline)
    || !['none', 'documented-control'].includes(input.commonModePlan)
    || !['unspecified', 'documented'].includes(input.returnPathPlan)) throw new TypeError('Unsupported balance-path lesson selection.');

  const endReturnMissing = input.topology === 'end-fed' && input.returnPathPlan === 'unspecified';
  const coaxControlMissing = input.feedline === 'coax' && input.commonModePlan === 'none';
  const status = endReturnMissing || coaxControlMissing ? 'requires-plan' : 'verify-installed';
  const headline = endReturnMissing
    ? 'The RF return path is missing from this plan'
    : coaxControlMissing
      ? 'The coax outside can become an unintended current path'
      : 'The intended current boundary still requires installed verification';
  const intendedPath = input.topology === 'balanced-centre'
    ? 'Equal and opposite current is intended on the two radiator sides and the two feed conductors.'
    : input.topology === 'asymmetrical'
      ? 'Current must complete a circuit through unequal radiator geometry, so equal conductor current cannot be assumed.'
      : input.returnPathPlan === 'documented'
        ? 'Radiator current returns through the separately documented counterpoise, radial, body, or other engineered RF path.'
        : 'Radiator current still needs a second RF path; the feedline, equipment, wiring, earth coupling, or nearby conductors may supply it unintentionally.';
  const concern = input.feedline === 'coax'
    ? 'Coax supports differential current inside, but current on the shield exterior is a separate common-mode path affected by the complete installation.'
    : 'A two-conductor line supports differential current, but unequal surroundings, routing, tuner connections, and geometry can still create common mode.';
  const controlMeaning = input.commonModePlan === 'documented-control'
    ? 'The selected choke, isolator, or balanced transition defines an intended boundary only; its common-mode impedance, frequency coverage, heating, and installation remain to be verified.'
    : 'No explicit common-mode boundary is recorded. A favourable SWR or symmetrical drawing does not show that outside current is acceptably controlled.';
  const showUnintendedOutsidePath = endReturnMissing || coaxControlMissing || input.topology === 'asymmetrical';
  return {
    ...input,
    status,
    headline,
    intendedPath,
    concern,
    controlMeaning,
    showUnintendedOutsidePath,
    checks: [
      'Document feedpoint conductors, return path, feedline route, enclosure, bonds, and the intended common-mode boundary.',
      'Measure or compare line current at useful positions and frequencies with a suitable RF-current method; do not infer it from SWR alone.',
      'Recheck after changing feedline length or routing, support geometry, tuner, grounding, bonding, power, frequency, or nearby conductors.'
    ]
  };
}
