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

const unitScale: Record<string, number> = { hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9 };

function pointFromReflection(frequencyHz: number, real: number, imaginary: number, reference: number): TouchstonePoint {
  const magnitude = Math.hypot(real, imaginary);
  const denominator = (1 - real) ** 2 + imaginary ** 2;
  const resistanceOhms = reference * (1 - magnitude ** 2) / denominator;
  const reactanceOhms = reference * (2 * imaginary) / denominator;
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
