/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests-pwa',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174/antennas/',
    browserName: 'chromium',
    launchOptions: executablePath ? { executablePath } : undefined,
    serviceWorkers: 'allow',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4174/antennas/',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
