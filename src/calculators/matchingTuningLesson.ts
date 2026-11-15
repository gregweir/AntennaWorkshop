/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateImpedanceExplorer } from './impedanceExplorer';
import { calculateLNetwork } from './lNetwork';

export type MatchingLessonLoad = 'resonant-mismatch' | 'reactive-fifty' | 'complex-load';
export type MatchingLessonNetwork = 'bypass' | 'ideal-l-match';

const LOADS: Record<MatchingLessonLoad, { resistanceOhms: number; reactanceOhms: number; label: string }> = {
  'resonant-mismatch': { resistanceOhms: 100, reactanceOhms: 0, label: 'Resonant, not 50 Ω' },
  'reactive-fifty': { resistanceOhms: 50, reactanceOhms: 30, label: '50 Ω plus reactance' },
  'complex-load': { resistanceOhms: 25, reactanceOhms: 50, label: 'Complex low resistance' }
};

export function evaluateMatchingTuningLesson(frequencyMHz: number, loadId: MatchingLessonLoad, network: MatchingLessonNetwork) {
  if (!Object.hasOwn(LOADS, loadId) || !['bypass', 'ideal-l-match'].includes(network)) throw new TypeError('Unsupported matching lesson selection.');
  const load = LOADS[loadId];
  const loadPoint = calculateImpedanceExplorer({
    frequencyMHz,
    referenceResistanceOhms: 50,
    loadResistanceOhms: load.resistanceOhms,
    loadReactanceOhms: load.reactanceOhms
  });
  const synthesis = calculateLNetwork({
    frequencyMHz,
    systemResistanceOhms: 50,
    loadResistanceOhms: load.resistanceOhms,
    loadReactanceOhms: load.reactanceOhms
  });
  if (synthesis.solutions.length === 0) throw new RangeError('No ideal L-network solution is available for this lesson load.');
  const solution = synthesis.solutions[0];
  const inputPoint = network === 'ideal-l-match'
    ? calculateImpedanceExplorer({
      frequencyMHz,
      referenceResistanceOhms: 50,
      loadResistanceOhms: solution.inputResistanceOhms,
      loadReactanceOhms: solution.inputReactanceOhms
    })
    : loadPoint;
  return {
    frequencyMHz,
    loadId,
    network,
    loadLabel: load.label,
    loadResistanceOhms: load.resistanceOhms,
    loadReactanceOhms: load.reactanceOhms,
    loadIsResonant: Math.abs(load.reactanceOhms) < 1e-9,
    loadSwr: loadPoint.swr,
    inputResistanceOhms: inputPoint.loadResistanceOhms,
    inputReactanceOhms: inputPoint.loadReactanceOhms,
    inputSwr: inputPoint.swr,
    solution,
    headline: network === 'ideal-l-match'
      ? 'The source sees a match; the antenna-terminal load did not change'
      : loadPoint.swr <= 1.05
        ? 'This load is already close to a 50 Ω source match'
        : 'Resonance and source match are separate questions'
  };
}
