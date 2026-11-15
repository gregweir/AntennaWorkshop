/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { AntennaPlanMeasurementRecord } from './antennaPlans';

export interface MeasurementHistoryDelta {
  minimumSwr: number | null;
  minimumSwrFrequencyHz: number;
  resonanceFrequencyHz: number;
}

export interface MeasurementHistoryComparisonPoint {
  record: AntennaPlanMeasurementRecord;
  delta: MeasurementHistoryDelta | null;
  contextChanges: string[];
}

function textChanged(previous: string, current: string) {
  return previous.trim().toLocaleLowerCase() !== current.trim().toLocaleLowerCase();
}

export function buildMeasurementHistoryComparison(records: AntennaPlanMeasurementRecord[]): MeasurementHistoryComparisonPoint[] {
  const analyzed = records.filter((record) => record.analysis !== null).sort((first, second) => first.recordedAt.localeCompare(second.recordedAt));
  return analyzed.map((record, index) => {
    const previous = analyzed[index - 1];
    if (!previous?.analysis || !record.analysis) return { record, delta: null, contextChanges: [] };
    const contextChanges: string[] = [];
    if (textChanged(previous.calibrationContext, record.calibrationContext)) contextChanges.push('recorded calibration context differs');
    if (textChanged(previous.referencePlane, record.referencePlane)) contextChanges.push('recorded reference plane differs');
    if (textChanged(previous.installedGeometry, record.installedGeometry)) contextChanges.push('recorded geometry or conditions differ');
    if (previous.analysis.referenceImpedanceOhms !== record.analysis.referenceImpedanceOhms) contextChanges.push('reference impedance differs');
    if (previous.analysis.lowerFrequencyHz !== record.analysis.lowerFrequencyHz || previous.analysis.upperFrequencyHz !== record.analysis.upperFrequencyHz) contextChanges.push('sweep coverage differs');
    if (previous.analysis.threshold !== record.analysis.threshold) contextChanges.push('analysis threshold differs');
    return {
      record,
      delta: {
        minimumSwr: previous.analysis.minimumSwr === null || record.analysis.minimumSwr === null ? null : record.analysis.minimumSwr - previous.analysis.minimumSwr,
        minimumSwrFrequencyHz: record.analysis.minimumSwrFrequencyHz - previous.analysis.minimumSwrFrequencyHz,
        resonanceFrequencyHz: record.analysis.resonanceFrequencyHz - previous.analysis.resonanceFrequencyHz
      },
      contextChanges
    };
  });
}
