/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureSensitivityResult, ExposureSensitivityVariable } from '../calculators/exposureSensitivity';
import { metresToFeet, type UnitSystem } from '../lib/units';

interface ExposureSensitivityCsvOptions {
  sourceLabel: string;
  pointLabel: string;
  variableLabel: string;
  unitSystem: UnitSystem;
}

const lengthVariables: ExposureSensitivityVariable[] = ['antenna-height', 'plan-distance'];

function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function precise(value: number) {
  return Number(value.toPrecision(12));
}

function displayInput(value: number, variable: ExposureSensitivityVariable, unitSystem: UnitSystem) {
  return lengthVariables.includes(variable) && unitSystem === 'imperial' ? metresToFeet(value) : value;
}

function inputUnit(variable: ExposureSensitivityVariable, unitSystem: UnitSystem) {
  if (lengthVariables.includes(variable)) return unitSystem === 'metric' ? 'm' : 'ft';
  return variable === 'transmitter-power' ? 'W' : '%';
}

export function serializeExposureSensitivityCsv(result: ExposureSensitivityResult, options: ExposureSensitivityCsvOptions) {
  const header = ['record_type', 'variable', 'source', 'evaluation_point', 'input_value', 'input_unit', 'normalized_fraction', 'normalized_percent', 'status', 'screening_trigger_fraction', 'crossing_direction', 'notes'];
  const shared = [options.variableLabel, options.sourceLabel, options.pointLabel];
  const unit = inputUnit(result.variable, options.unitSystem);
  const rows: Array<Array<string | number>> = result.samples.map((sample) => [
    'sample', ...shared, precise(displayInput(sample.inputValue, result.variable, options.unitSystem)), unit,
    sample.totalFractionOfReferenceLevel === null ? '' : precise(sample.totalFractionOfReferenceLevel),
    sample.totalFractionOfReferenceLevel === null ? '' : precise(sample.totalFractionOfReferenceLevel * 100),
    sample.status, precise(result.screeningTriggerFraction), '', ''
  ]);
  rows.push(...result.thresholdCrossings.map((crossing) => [
    'interpolated_crossing', ...shared, precise(displayInput(crossing.inputValue, result.variable, options.unitSystem)), unit,
    precise(result.screeningTriggerFraction), precise(result.screeningTriggerFraction * 100), '',
    precise(result.screeningTriggerFraction), crossing.direction,
    'Linear interpolation between adjacent valid, far-field-applicable samples; not a compliance limit.'
  ]));
  return `${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function exposureSensitivityCsvFilename(projectTitle: string, variable: ExposureSensitivityVariable) {
  const slug = projectTitle.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  return `${slug || 'station-assessment'}-${variable}-sensitivity.csv`;
}
