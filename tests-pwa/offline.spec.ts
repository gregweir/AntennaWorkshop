/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { expect, test } from '@playwright/test';

test('publishes an installable scoped manifest and active worker', async ({ page, request }) => {
  await page.goto('./');
  await page.getByText('Install this app', { exact: true }).click();
  await expect(page.locator('.pwa-install-guide')).toContainText('Add to Home Screen');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifestResponse = await request.get(new URL(manifestHref!, page.url()).toString());
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: 'RadioBook Antenna Workshop',
    short_name: 'Antenna Workshop',
    display: 'standalone',
    start_url: './',
    scope: './'
  });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }),
    expect.objectContaining({ src: 'pwa-512.png', sizes: '512x512', type: 'image/png' })
  ]));

  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, active: Boolean(registration.active) };
  });
  expect(worker.active).toBe(true);
  expect(worker.scope).toBe('http://127.0.0.1:4174/antennas/');
});

test('returns offline, preserves a saved antenna plan, and opens every precached workspace', async ({ context, page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Centre-fed half-wave dipole' })).toBeVisible();
  await page.getByText('Saved antenna plans', { exact: true }).click();
  await page.getByLabel('New plan name').fill('Offline dipole plan');
  await page.getByRole('button', { name: 'Save new plan' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'New plan saved' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Centre-fed half-wave dipole' })).toBeVisible();
    await page.getByText('Saved antenna plans', { exact: true }).click();
    await expect(page.getByLabel('Saved antenna plan')).toContainText('Offline dipole plan');
    await page.getByRole('button', { name: 'Open plan' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Opened Offline dipole plan' })).toBeVisible();

    await page.getByRole('button', { name: /Feedline & matching/ }).click();
    await expect(page.getByRole('heading', { name: 'Feedline power budget' })).toBeVisible();

    await page.getByRole('button', { name: /RF exposure/ }).click();
    await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
