/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { gzipSync } from 'node:zlib';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

const maximumChunkBytes = 400 * 1024;
const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const indexHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const entryMatch = indexHtml.match(/<script[^>]+src="[^"]*\/assets\/([^"/]+\.js)"/);

if (!entryMatch) {
  throw new Error('Unable to identify the production JavaScript entry in dist/index.html.');
}

const files = (await readdir(assetsDirectory)).filter((file) => file.endsWith('.js')).sort();
const rows = await Promise.all(files.map(async (file) => {
  const path = join(assetsDirectory.pathname, file);
  const contents = await readFile(path);
  const metadata = await stat(path);
  return { file, bytes: metadata.size, gzipBytes: gzipSync(contents).length, entry: file === basename(entryMatch[1]) };
}));

for (const row of rows) {
  const role = row.entry ? 'entry' : 'chunk';
  console.log(`${role.padEnd(5)} ${row.file.padEnd(48)} ${(row.bytes / 1024).toFixed(2).padStart(7)} KiB · ${(row.gzipBytes / 1024).toFixed(2).padStart(6)} KiB gzip`);
}

const oversized = rows.filter((row) => row.bytes > maximumChunkBytes);
if (oversized.length) {
  const names = oversized.map((row) => `${row.file} (${(row.bytes / 1024).toFixed(2)} KiB)`).join(', ');
  throw new Error(`JavaScript bundle budget exceeded. Maximum is ${maximumChunkBytes / 1024} KiB per file: ${names}`);
}

console.log(`Bundle budget passed: ${rows.length} JavaScript files, each at or below ${maximumChunkBytes / 1024} KiB.`);
