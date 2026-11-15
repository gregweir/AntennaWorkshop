/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateImpedanceExplorer } from './impedanceExplorer';

export type SameSwrExampleKind = 'high-resistance' | 'low-resistance' | 'inductive';

export interface SameSwrExample {
  kind: SameSwrExampleKind;
  label: string;
  resistanceOhms: number;
  reactanceOhms: number;
  swr: number;
  reflectionReal: number;
  reflectionImaginary: number;
  reflectionPhaseDegrees: number;
}

export interface SameSwrComparison {
  targetSwr: number;
  referenceResistanceOhms: number;
  reflectionMagnitude: number;
  reflectedPowerPercent: number;
  examples: SameSwrExample[];
}

export function calculateSameSwrComparison(targetSwr: number, referenceResistanceOhms = 50): SameSwrComparison {
  if (!Number.isFinite(targetSwr) || targetSwr < 1.1 || targetSwr > 10) throw new RangeError('Target SWR must be between 1.1 and 10.');
  if (!Number.isFinite(referenceResistanceOhms) || referenceResistanceOhms <= 0 || referenceResistanceOhms > 1_000_000) throw new RangeError('Reference resistance must be greater than zero and no more than 1,000,000 ohms.');
  const reflectionMagnitude = (targetSwr - 1) / (targetSwr + 1);
  const normalizedReactiveMagnitude = 2 * reflectionMagnitude / Math.sqrt(1 - reflectionMagnitude ** 2);
  const inputs: Array<{ kind: SameSwrExampleKind; label: string; resistanceOhms: number; reactanceOhms: number }> = [
    { kind: 'high-resistance', label: 'High resistance', resistanceOhms: referenceResistanceOhms * targetSwr, reactanceOhms: 0 },
    { kind: 'low-resistance', label: 'Low resistance', resistanceOhms: referenceResistanceOhms / targetSwr, reactanceOhms: 0 },
    { kind: 'inductive', label: 'Inductive reactance', resistanceOhms: referenceResistanceOhms, reactanceOhms: normalizedReactiveMagnitude * referenceResistanceOhms }
  ];
  const examples = inputs.map((input) => {
    const result = calculateImpedanceExplorer({
      frequencyMHz: 14.2,
      referenceResistanceOhms,
      loadResistanceOhms: input.resistanceOhms,
      loadReactanceOhms: input.reactanceOhms
    });
    return {
      ...input,
      swr: result.swr,
      reflectionReal: result.reflectionReal,
      reflectionImaginary: result.reflectionImaginary,
      reflectionPhaseDegrees: result.reflectionPhaseDegrees
    };
  });
  return {
    targetSwr,
    referenceResistanceOhms,
    reflectionMagnitude,
    reflectedPowerPercent: reflectionMagnitude ** 2 * 100,
    examples
  };
}
