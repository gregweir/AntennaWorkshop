/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface MeasuredTrapInput {
  inductanceMicrohenries: number;
  capacitancePicofarads: number;
  measuredResonanceMHz: number;
}

export interface TrapCommissioningInput {
  targetInductanceMicrohenries: number;
  targetCapacitancePicofarads: number;
  targetResonanceMHz: number;
  inductanceTolerancePercent: number;
  capacitanceTolerancePercent: number;
  pairMatchingThresholdPercent: number;
  trapA: MeasuredTrapInput;
  trapB: MeasuredTrapInput;
}

export const TRAP_COMMISSIONING_MODEL = {
  id: 'parallel-lc-trap-commissioning-record',
  version: '1.0.0',
  reviewedOn: '2026-11-13',
  sources: [
    {
      title: 'ARRL QEX — Design of a Two-band Loaded Dipole Antenna',
      url: 'https://www.arrl.org/files/file/ARRL%20Handbook%20Supplemental%20Files/2019%20Edition/Two%20Band%20Loaded%20Dipole%20-%20Birnbaum.pdf'
    },
    {
      title: 'ARRL QST — Homebrew Your Own Inductors!',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/9708033.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function parallelResonanceMHz(inductanceMicrohenries: number, capacitancePicofarads: number) {
  const inductanceHenries = inductanceMicrohenries * 1e-6;
  const capacitanceFarads = capacitancePicofarads * 1e-12;
  return 1 / (2 * Math.PI * Math.sqrt(inductanceHenries * capacitanceFarads)) / 1e6;
}

function deviationPercent(value: number, target: number) {
  return (value / target - 1) * 100;
}

function pairSpreadPercent(first: number, second: number) {
  return Math.abs(first - second) / ((first + second) / 2) * 100;
}

function calculateMeasuredTrap(trap: MeasuredTrapInput, input: TrapCommissioningInput) {
  inRange(trap.inductanceMicrohenries, 0.001, 1_000_000, 'Measured inductance');
  inRange(trap.capacitancePicofarads, 0.001, 1_000_000_000, 'Measured capacitance');
  inRange(trap.measuredResonanceMHz, 0.001, 300_000, 'Measured resonance');
  const calculatedResonanceMHz = parallelResonanceMHz(trap.inductanceMicrohenries, trap.capacitancePicofarads);
  const inductanceDeviationPercent = deviationPercent(trap.inductanceMicrohenries, input.targetInductanceMicrohenries);
  const capacitanceDeviationPercent = deviationPercent(trap.capacitancePicofarads, input.targetCapacitancePicofarads);

  return {
    ...trap,
    calculatedResonanceMHz,
    inductanceDeviationPercent,
    capacitanceDeviationPercent,
    calculatedResonanceDeviationPercent: deviationPercent(calculatedResonanceMHz, input.targetResonanceMHz),
    measuredResonanceDeviationPercent: deviationPercent(trap.measuredResonanceMHz, input.targetResonanceMHz),
    inductanceWithinSelectedTolerance: Math.abs(inductanceDeviationPercent) <= input.inductanceTolerancePercent,
    capacitanceWithinSelectedTolerance: Math.abs(capacitanceDeviationPercent) <= input.capacitanceTolerancePercent
  };
}

export function calculateTrapCommissioning(input: TrapCommissioningInput) {
  inRange(input.targetInductanceMicrohenries, 0.001, 1_000_000, 'Target inductance');
  inRange(input.targetCapacitancePicofarads, 0.001, 1_000_000_000, 'Target capacitance');
  inRange(input.targetResonanceMHz, 0.001, 300_000, 'Target resonance');
  inRange(input.inductanceTolerancePercent, 0, 50, 'Inductance tolerance');
  inRange(input.capacitanceTolerancePercent, 0, 50, 'Capacitance tolerance');
  inRange(input.pairMatchingThresholdPercent, 0.01, 100, 'Pair matching threshold');

  const trapA = calculateMeasuredTrap(input.trapA, input);
  const trapB = calculateMeasuredTrap(input.trapB, input);
  const inductancePairSpreadPercent = pairSpreadPercent(trapA.inductanceMicrohenries, trapB.inductanceMicrohenries);
  const capacitancePairSpreadPercent = pairSpreadPercent(trapA.capacitancePicofarads, trapB.capacitancePicofarads);
  const calculatedResonancePairSpreadPercent = pairSpreadPercent(trapA.calculatedResonanceMHz, trapB.calculatedResonanceMHz);
  const measuredResonancePairSpreadPercent = pairSpreadPercent(trapA.measuredResonanceMHz, trapB.measuredResonanceMHz);
  const minimumTargetInductance = input.targetInductanceMicrohenries * (1 - input.inductanceTolerancePercent / 100);
  const maximumTargetInductance = input.targetInductanceMicrohenries * (1 + input.inductanceTolerancePercent / 100);
  const minimumTargetCapacitance = input.targetCapacitancePicofarads * (1 - input.capacitanceTolerancePercent / 100);
  const maximumTargetCapacitance = input.targetCapacitancePicofarads * (1 + input.capacitanceTolerancePercent / 100);

  return {
    trapA,
    trapB,
    inductancePairSpreadPercent,
    capacitancePairSpreadPercent,
    calculatedResonancePairSpreadPercent,
    measuredResonancePairSpreadPercent,
    inductancePairWithinThreshold: inductancePairSpreadPercent <= input.pairMatchingThresholdPercent,
    capacitancePairWithinThreshold: capacitancePairSpreadPercent <= input.pairMatchingThresholdPercent,
    calculatedResonancePairWithinThreshold: calculatedResonancePairSpreadPercent <= input.pairMatchingThresholdPercent,
    measuredResonancePairWithinThreshold: measuredResonancePairSpreadPercent <= input.pairMatchingThresholdPercent,
    idealToleranceResonanceMinimumMHz: parallelResonanceMHz(maximumTargetInductance, maximumTargetCapacitance),
    idealToleranceResonanceMaximumMHz: parallelResonanceMHz(minimumTargetInductance, minimumTargetCapacitance)
  };
}
