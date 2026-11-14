/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type ConnectionForm = 'balanced' | 'unbalanced';

export interface IdealTransformerInput {
  sourceResistanceOhms: number;
  loadResistanceOhms: number;
  sourceTurns: number;
  sourceConnection: ConnectionForm;
  loadConnection: ConnectionForm;
}

export interface TransformerTurnsCandidate {
  loadTurns: number;
  turnsRatioLoadToSource: number;
  impedanceRatioLoadToSource: number;
  reflectedInputResistanceOhms: number;
  reflectionCoefficient: number;
  idealSWR: number;
  resistanceErrorPercent: number;
}

export const IDEAL_TRANSFORMER_MODEL = {
  id: 'ideal-two-winding-impedance-transformer',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — Some Principles of Radiotelephony, Part IV',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/5410022.pdf'
    },
    {
      title: 'Analog Devices — Transformer-Coupled Front-End for Wideband A/D Converters',
      url: 'https://www.analog.com/en/resources/analog-dialogue/articles/transformer-coupled-front-end-a-d-converters.html'
    },
    {
      title: 'Analog Devices — ADALM2000 Activity: Transformers',
      url: 'https://ez.analog.com/adiacademy/university-program/a/studentzone-articles/c/magnetic-components/SA1024/adalm2000-activity-transformers'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

function candidate(input: IdealTransformerInput, loadTurns: number): TransformerTurnsCandidate {
  const turnsRatioLoadToSource = loadTurns / input.sourceTurns;
  const impedanceRatioLoadToSource = turnsRatioLoadToSource ** 2;
  const reflectedInputResistanceOhms = input.loadResistanceOhms / impedanceRatioLoadToSource;
  const reflectionCoefficient = Math.abs((reflectedInputResistanceOhms - input.sourceResistanceOhms) / (reflectedInputResistanceOhms + input.sourceResistanceOhms));
  return {
    loadTurns,
    turnsRatioLoadToSource,
    impedanceRatioLoadToSource,
    reflectedInputResistanceOhms,
    reflectionCoefficient,
    idealSWR: (1 + reflectionCoefficient) / (1 - reflectionCoefficient),
    resistanceErrorPercent: 100 * (reflectedInputResistanceOhms - input.sourceResistanceOhms) / input.sourceResistanceOhms
  };
}

export function calculateIdealTransformer(input: IdealTransformerInput) {
  finiteRange(input.sourceResistanceOhms, 0.01, 1_000_000, 'Source resistance');
  finiteRange(input.loadResistanceOhms, 0.01, 1_000_000, 'Load resistance');
  finiteRange(input.sourceTurns, 1, 100, 'Source-side turns');
  if (!Number.isInteger(input.sourceTurns)) throw new RangeError('Source-side turns must be a whole number.');
  if (!['balanced', 'unbalanced'].includes(input.sourceConnection) || !['balanced', 'unbalanced'].includes(input.loadConnection)) throw new RangeError('Connection form must be balanced or unbalanced.');

  const idealImpedanceRatioLoadToSource = input.loadResistanceOhms / input.sourceResistanceOhms;
  const idealTurnsRatioLoadToSource = Math.sqrt(idealImpedanceRatioLoadToSource);
  const exactLoadTurns = input.sourceTurns * idealTurnsRatioLoadToSource;
  const integerLoadTurns = [...new Set([Math.max(1, Math.floor(exactLoadTurns)), Math.max(1, Math.ceil(exactLoadTurns))])];
  const candidates = integerLoadTurns
    .map((loadTurns) => candidate(input, loadTurns))
    .sort((a, b) => Math.abs(a.resistanceErrorPercent) - Math.abs(b.resistanceErrorPercent));
  const deviceClass = input.sourceConnection !== input.loadConnection
    ? 'balun'
    : input.sourceConnection === 'unbalanced'
      ? 'unun'
      : 'balanced transformer';

  return {
    ...input,
    idealImpedanceRatioLoadToSource,
    idealTurnsRatioLoadToSource,
    exactLoadTurns,
    candidates,
    deviceClass
  };
}
