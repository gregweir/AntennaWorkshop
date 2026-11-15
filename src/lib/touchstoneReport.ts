/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { nearestTouchstonePoint, type TouchstonePoint, type TouchstoneSweep } from './touchstone';

export interface TouchstoneReportContext {
  title: string;
  calibrationContext: string;
  referenceState: string;
  comparisonState: string;
}

interface SweepFile {
  fileName: string;
  sweep: TouchstoneSweep;
}

export function serializeTouchstoneComparisonCsv(context: TouchstoneReportContext, reference: SweepFile, comparison: SweepFile | null) {
  const contextColumns = ['report_title', 'calibration_and_reference_plane', 'reference_state', 'comparison_state', 'reference_file', 'reference_impedance_ohms'];
  const referenceColumns = ['reference_frequency_hz', 'reference_swr', 'reference_return_loss_db', 'reference_resistance_ohms', 'reference_reactance_ohms', 'reference_gamma_real', 'reference_gamma_imaginary'];
  const comparisonColumns = comparison ? ['comparison_file', 'comparison_impedance_ohms', 'comparison_frequency_hz', 'frequency_offset_hz', 'comparison_swr', 'swr_change', 'comparison_return_loss_db', 'comparison_resistance_ohms', 'comparison_reactance_ohms', 'comparison_gamma_real', 'comparison_gamma_imaginary'] : [];
  const header = [...contextColumns, ...referenceColumns, ...comparisonColumns];
  const rows = reference.sweep.points.map((point) => {
    const aligned = comparison ? nearestTouchstonePoint(comparison.sweep.points, point.frequencyHz) : null;
    return [
      context.title,
      context.calibrationContext,
      context.referenceState,
      comparison ? context.comparisonState : '',
      reference.fileName,
      reference.sweep.referenceImpedanceOhms,
      ...pointValues(point),
      ...(comparison && aligned ? [
        comparison.fileName,
        comparison.sweep.referenceImpedanceOhms,
        finiteCsvNumber(aligned.frequencyHz),
        finiteCsvNumber(aligned.frequencyHz - point.frequencyHz),
        finiteCsvNumber(aligned.swr),
        finiteCsvNumber(aligned.swr - point.swr),
        finiteCsvNumber(aligned.returnLossDb),
        finiteCsvNumber(aligned.resistanceOhms),
        finiteCsvNumber(aligned.reactanceOhms),
        finiteCsvNumber(aligned.reflectionReal),
        finiteCsvNumber(aligned.reflectionImaginary)
      ] : [])
    ].map(csvCell).join(',');
  });
  return `${header.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}

export function touchstoneReportFilename(title: string) {
  const stem = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'antenna-sweep';
  return `${stem}-measurement.csv`;
}

function pointValues(point: TouchstonePoint) {
  return [
    finiteCsvNumber(point.frequencyHz),
    finiteCsvNumber(point.swr),
    finiteCsvNumber(point.returnLossDb),
    finiteCsvNumber(point.resistanceOhms),
    finiteCsvNumber(point.reactanceOhms),
    finiteCsvNumber(point.reflectionReal),
    finiteCsvNumber(point.reflectionImaginary)
  ];
}

function finiteCsvNumber(value: number) {
  return Number.isFinite(value) ? value : '';
}

function csvCell(value: string | number) {
  const text = typeof value === 'string' && /^[\t ]*[=+\-@]/.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
