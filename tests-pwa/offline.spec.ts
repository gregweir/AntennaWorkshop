/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { expect, test } from '@playwright/test';

test('returns offline and opens every precached workspace', async ({ context, page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Centre-fed half-wave dipole' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Centre-fed half-wave dipole' })).toBeVisible();

    await page.getByRole('button', { name: /Feedline & matching/ }).click();
    await expect(page.getByRole('heading', { name: 'Feedline power budget' })).toBeVisible();

    await page.getByRole('button', { name: /RF exposure/ }).click();
    await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
