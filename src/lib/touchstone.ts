/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type TouchstoneFormat = 'RI' | 'MA' | 'DB';

export interface TouchstonePoint {
  frequencyHz: number;
  reflectionReal: number;
  reflectionImaginary: number;
  reflectionMagnitude: number;
  resistanceOhms: number;
  reactanceOhms: number;
  swr: number;
  returnLossDb: number;
}

export interface TouchstoneSweep {
  format: TouchstoneFormat;
  referenceImpedanceOhms: number;
  points: TouchstonePoint[];
}

export interface TouchstoneSweepSummary {
  best: TouchstonePoint;
  resonant: TouchstonePoint;
  twoToOne: { lower: TouchstonePoint; upper: TouchstonePoint } | null;
}

export interface TouchstoneRangeReview {
  sweepSpansEveryRange: boolean;
  points: TouchstonePoint[];
  lowestSwr: TouchstonePoint | null;
  highestSwr: TouchstonePoint | null;
}

export interface TouchstoneThresholdBoundary {
  frequencyHz: number;
  basis: 'interpolated' | 'sweep-edge' | 'measured-sample';
}

export interface TouchstoneThresholdWindow {
  lower: TouchstoneThresholdBoundary;
  upper: TouchstoneThresholdBoundary;
  widthHz: number;
  measuredPointCount: number;
  lowestSwr: TouchstonePoint;
}

const unitScale: Record<string, number> = { hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9 };

function pointFromReflection(frequencyHz: number, real: number, imaginary: number, reference: number): TouchstonePoint {
  const magnitude = Math.hypot(real, imaginary);
  const denominator = (1 - real) ** 2 + imaginary ** 2;
  const resistanceOhms = denominator === 0 ? Number.POSITIVE_INFINITY : reference * (1 - magnitude ** 2) / denominator;
  const reactanceOhms = denominator === 0 ? 0 : reference * (2 * imaginary) / denominator;
  return {
    frequencyHz,
    reflectionReal: real,
    reflectionImaginary: imaginary,
    reflectionMagnitude: magnitude,
    resistanceOhms,
    reactanceOhms,
    swr: magnitude < 1 ? (1 + magnitude) / (1 - magnitude) : Number.POSITIVE_INFINITY,
    returnLossDb: magnitude === 0 ? Number.POSITIVE_INFINITY : -20 * Math.log10(magnitude)
  };
}

export function parseTouchstoneS1p(source: string): TouchstoneSweep {
  if (source.length > 2_000_000) throw new RangeError('The Touchstone file exceeds the 2 MB local import limit.');
  const lines = source.replace(/\r/g, '').split('\n');
  let scale = 1e9;
  let format: TouchstoneFormat = 'MA';
  let reference = 50;
  let optionSeen = false;
  const points: TouchstonePoint[] = [];

  for (const original of lines) {
    const line = original.split('!')[0].trim();
    if (!line) continue;
    if (line.startsWith('[')) throw new Error('Touchstone 2.x keyword files are not yet supported; export a version 1.x one-port .s1p file.');
    if (line.startsWith('#')) {
      if (optionSeen || points.length) throw new Error('The .s1p file must contain one option line before its data.');
      const tokens = line.slice(1).trim().toLowerCase().split(/\s+/);
      const unit = tokens.find((token) => token in unitScale) ?? 'ghz';
      const parameter = tokens.find((token) => ['s', 'y', 'z', 'g', 'h'].includes(token)) ?? 's';
      const selectedFormat = tokens.find((token) => ['ri', 'ma', 'db'].includes(token)) ?? 'ma';
      const rIndex = tokens.indexOf('r');
      const knownTokens = new Set([...Object.keys(unitScale), 's', 'y', 'z', 'g', 'h', 'ri', 'ma', 'db', 'r']);
      const unknownToken = tokens.find((token, index) => token && !knownTokens.has(token) && index !== rIndex + 1);
      if (unknownToken) throw new Error(`Unsupported Touchstone option: ${unknownToken}.`);
      const parsedReference = rIndex >= 0 ? Number(tokens[rIndex + 1]) : 50;
      if (parameter !== 's') throw new Error('Only one-port scattering-parameter data is supported.');
      if (!Number.isFinite(parsedReference) || parsedReference <= 0) throw new Error('Reference impedance must be a positive number.');
      scale = unitScale[unit];
      format = selectedFormat.toUpperCase() as TouchstoneFormat;
      reference = parsedReference;
      optionSeen = true;
      continue;
    }
    if (!optionSeen) throw new Error('The .s1p file must contain an option line before its data.');
    const values = line.split(/\s+/).map(Number);
    if (values.length !== 3 || values.some((value) => !Number.isFinite(value))) throw new Error('Each .s1p data row must contain frequency and one numeric value pair.');
    const frequencyHz = values[0] * scale;
    if (frequencyHz <= 0) throw new Error('Sweep frequencies must be positive.');
    let real: number;
    let imaginary: number;
    if (format === 'RI') {
      [real, imaginary] = [values[1], values[2]];
    } else {
      const magnitude = format === 'DB' ? 10 ** (values[1] / 20) : values[1];
      const angle = values[2] * Math.PI / 180;
      real = magnitude * Math.cos(angle);
      imaginary = magnitude * Math.sin(angle);
    }
    points.push(pointFromReflection(frequencyHz, real, imaginary, reference));
    if (points.length > 10_000) throw new RangeError('The .s1p file exceeds the 10,000-point local import limit.');
  }
  if (!points.length) throw new Error('No one-port sweep points were found.');
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].frequencyHz <= points[index - 1].frequencyHz) throw new Error('Sweep frequencies must be strictly increasing.');
  }
  return { format, referenceImpedanceOhms: reference, points };
}

export function summarizeTouchstoneSweep(sweep: TouchstoneSweep): TouchstoneSweepSummary {
  const bestIndex = sweep.points.reduce((best, point, index) => point.swr < sweep.points[best].swr ? index : best, 0);
  const resonant = sweep.points.reduce((best, point) => Math.abs(point.reactanceOhms) < Math.abs(best.reactanceOhms) ? point : best);
  let lowerIndex = bestIndex;
  let upperIndex = bestIndex;
  if (sweep.points[bestIndex].swr <= 2) {
    while (lowerIndex > 0 && sweep.points[lowerIndex - 1].swr <= 2) lowerIndex -= 1;
    while (upperIndex < sweep.points.length - 1 && sweep.points[upperIndex + 1].swr <= 2) upperIndex += 1;
  }
  return {
    best: sweep.points[bestIndex],
    resonant,
    twoToOne: sweep.points[bestIndex].swr <= 2 ? { lower: sweep.points[lowerIndex], upper: sweep.points[upperIndex] } : null
  };
}

export function nearestTouchstonePoint(points: TouchstonePoint[], frequencyHz: number) {
  return points[nearestTouchstonePointIndex(points, frequencyHz)];
}

export function nearestTouchstonePointIndex(points: TouchstonePoint[], frequencyHz: number) {
  let low = 0;
  let high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].frequencyHz < frequencyHz) low = middle + 1;
    else high = middle;
  }
  if (low === 0) return 0;
  const previous = points[low - 1];
  return Math.abs(previous.frequencyHz - frequencyHz) <= Math.abs(points[low].frequencyHz - frequencyHz) ? low - 1 : low;
}

export function summarizeTouchstoneRanges(sweep: TouchstoneSweep, ranges: ReadonlyArray<{ lowerHz: number; upperHz: number }>): TouchstoneRangeReview {
  const points = sweep.points.filter((point) => ranges.some((range) => point.frequencyHz >= range.lowerHz && point.frequencyHz <= range.upperHz));
  return {
    sweepSpansEveryRange: ranges.length > 0 && ranges.every((range) => sweep.points[0].frequencyHz <= range.lowerHz && sweep.points.at(-1)!.frequencyHz >= range.upperHz),
    points,
    lowestSwr: points.length ? points.reduce((lowest, point) => point.swr < lowest.swr ? point : lowest) : null,
    highestSwr: points.length ? points.reduce((highest, point) => point.swr > highest.swr ? point : highest) : null
  };
}

export function estimateTouchstoneThresholdWindows(sweep: TouchstoneSweep, threshold: number): TouchstoneThresholdWindow[] {
  if (!Number.isFinite(threshold) || threshold <= 1) throw new RangeError('The SWR threshold must be a finite ratio greater than 1:1.');
  const windows: TouchstoneThresholdWindow[] = [];
  let startIndex: number | null = null;
  for (let index = 0; index <= sweep.points.length; index += 1) {
    const inside = index < sweep.points.length && sweep.points[index].swr <= threshold;
    if (inside && startIndex === null) startIndex = index;
    if (!inside && startIndex !== null) {
      const endIndex = index - 1;
      const lower = startIndex === 0
        ? { frequencyHz: sweep.points[0].frequencyHz, basis: 'sweep-edge' as const }
        : thresholdBoundary(sweep.points[startIndex - 1], sweep.points[startIndex], threshold);
      const upper = endIndex === sweep.points.length - 1
        ? { frequencyHz: sweep.points[endIndex].frequencyHz, basis: 'sweep-edge' as const }
        : thresholdBoundary(sweep.points[endIndex], sweep.points[endIndex + 1], threshold);
      const points = sweep.points.slice(startIndex, endIndex + 1);
      windows.push({
        lower,
        upper,
        widthHz: Math.max(0, upper.frequencyHz - lower.frequencyHz),
        measuredPointCount: points.length,
        lowestSwr: points.reduce((lowest, point) => point.swr < lowest.swr ? point : lowest)
      });
      startIndex = null;
    }
  }
  return windows;
}

function thresholdBoundary(first: TouchstonePoint, second: TouchstonePoint, threshold: number): TouchstoneThresholdBoundary {
  if (Number.isFinite(first.swr) && Number.isFinite(second.swr) && first.swr !== second.swr) {
    const fraction = (threshold - first.swr) / (second.swr - first.swr);
    if (fraction >= 0 && fraction <= 1) return { frequencyHz: first.frequencyHz + fraction * (second.frequencyHz - first.frequencyHz), basis: 'interpolated' };
  }
  const inside = first.swr <= threshold ? first : second;
  return { frequencyHz: inside.frequencyHz, basis: 'measured-sample' };
}
