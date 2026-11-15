/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const binary = process.env.ANTENNA_NEC2C_BIN;
if (!binary) throw new Error('Set ANTENNA_NEC2C_BIN to an executable nec2c binary.');

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'antenna-nec2c-'));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

function parseInputImpedance(output) {
  const heading = output.indexOf('ANTENNA INPUT PARAMETERS');
  if (heading < 0) throw new Error('nec2c output did not contain antenna input parameters.');
  const sourceLine = output.slice(heading).split('\n').find((line) => /^\s*1\s+11\s+/.test(line));
  if (!sourceLine) throw new Error('nec2c output did not report tag 1, centre segment 11.');
  const values = sourceLine.trim().split(/\s+/).map(Number);
  if (values.length < 10 || values.some((value) => !Number.isFinite(value))) throw new Error('Unable to parse the nec2c source result.');
  return { resistanceOhms: values[6], reactanceOhms: values[7] };
}

async function runCase(name, ground) {
  const { generateNec2Dipole } = await server.ssrLoadModule('/src/calculators/nec2Dipole.ts');
  const generated = generateNec2Dipole({
    frequencyMHz: 14.2,
    spanMetres: 10.03,
    heightMetres: 10,
    conductorDiameterMillimetres: 1.6,
    segmentCount: 21,
    ground
  });
  const inputPath = join(temporaryDirectory, `${name}.nec`);
  const outputPath = join(temporaryDirectory, `${name}.out`);
  await writeFile(inputPath, generated.deck);
  execFileSync(binary, [`-i${inputPath}`, `-o${outputPath}`], { stdio: 'pipe' });
  const output = await readFile(outputPath, 'utf8');
  if (/\b(?:error|warning)\b/i.test(output)) throw new Error(`${name} produced an NEC warning or error.`);
  const expectedEnvironment = ground === 'free-space' ? 'FREE SPACE' : 'PERFECT GROUND';
  if (!output.includes(expectedEnvironment)) throw new Error(`${name} did not use ${expectedEnvironment}.`);
  const impedance = parseInputImpedance(output);
  if (impedance.resistanceOhms <= 0) throw new Error(`${name} produced a non-positive input resistance.`);
  return impedance;
}

try {
  const version = execFileSync(binary, ['-v'], { encoding: 'utf8' }).trim();
  const freeSpace = await runCase('free-space', 'free-space');
  const perfectGround = await runCase('perfect-ground', 'perfect-ground');
  console.log(`${version} accepted both bounded reference decks.`);
  console.log(`Free space: ${freeSpace.resistanceOhms.toFixed(3)} ${freeSpace.reactanceOhms < 0 ? '-' : '+'} j${Math.abs(freeSpace.reactanceOhms).toFixed(3)} ohms.`);
  console.log(`Perfect ground: ${perfectGround.resistanceOhms.toFixed(3)} ${perfectGround.reactanceOhms < 0 ? '-' : '+'} j${Math.abs(perfectGround.reactanceOhms).toFixed(3)} ohms.`);
} finally {
  await server.close();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
