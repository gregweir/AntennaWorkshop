/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distribution = resolve('dist');
const indexPath = resolve(distribution, 'index.html');
const workerPath = resolve(distribution, 'sw.js');
const manifestPath = resolve(distribution, 'manifest.webmanifest');

const [index, worker, manifestText] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(workerPath, 'utf8'),
  readFile(manifestPath, 'utf8')
]);

if (!index.includes('/antennas/')) {
  throw new Error('Production index does not use the /antennas/ base path.');
}
if (!index.includes('rel="apple-touch-icon"') || !index.includes('/antennas/pwa-192.png')) {
  throw new Error('Production index does not publish the Antenna Workshop Apple touch icon.');
}

const manifest = JSON.parse(manifestText);
if (manifest.start_url !== './' || manifest.scope !== './') {
  throw new Error('PWA manifest must keep its start URL and scope relative to /antennas/.');
}
const requiredIconSizes = new Set(['192x192', '512x512']);
for (const icon of manifest.icons ?? []) {
  if (icon.purpose?.split(/\s+/).includes('maskable')) requiredIconSizes.delete(icon.sizes);
}
if (requiredIconSizes.size > 0) {
  throw new Error(`PWA manifest is missing maskable install icons: ${[...requiredIconSizes].join(', ')}`);
}

const precacheUrls = [...worker.matchAll(/\{url:"([^"]+)"/g)].map((match) => match[1]);
if (precacheUrls.length === 0) {
  throw new Error('No service-worker precache URLs were found.');
}

const workerDependency = worker.match(/define\(\["\.\/([^"]+)"\]/)?.[1];
if (!workerDependency) {
  throw new Error('The service worker imported Workbox file could not be identified.');
}

const requiredUrls = [...new Set([...precacheUrls, `${workerDependency}.js`])];
for (const url of requiredUrls) {
  if (url.startsWith('/') || url.includes('..')) {
    throw new Error(`Unsafe generated service-worker URL: ${url}`);
  }
  await access(resolve(distribution, url));
}

console.log(`Release build verified: ${precacheUrls.length} precache entries and ${requiredUrls.length} required files.`);
