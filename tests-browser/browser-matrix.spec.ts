/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('opens every workspace and preserves a user preference', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Half-wave dipole' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('5.139 m each');

  await page.getByRole('button', { name: /Feedline & matching/ }).click();
  await expect(page.getByRole('heading', { name: 'Feedline power budget' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('63.10 W');
  await page.getByRole('button', { name: /Impedance explorer/ }).click();
  await expect(page.getByRole('heading', { name: 'Impedance and Smith chart' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('2.618 : 1');
  await expect(page.getByRole('img', { name: /Smith chart for the entered complex load/ })).toBeVisible();
  await page.getByRole('button', { name: /Line transformation/ }).click();
  await expect(page.getByRole('heading', { name: 'Transmission-line transformation' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Transmission-line impedance transformation with entered attenuation/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Near-end SWR with entered loss');
  await page.getByRole('button', { name: /L-network/ }).click();
  await expect(page.getByRole('heading', { name: 'L-network matching' })).toBeVisible();
  await expect(page.locator('.l-network-solution')).toHaveCount(2);
  await page.getByRole('button', { name: /Quarter-wave transformer/ }).click();
  await expect(page.getByRole('heading', { name: 'Quarter-wave transformer' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('70.71 Ω');
  await expect(page.getByRole('img', { name: /Dimensioned quarter-wave transmission-line transformer/ })).toBeVisible();
  await page.getByRole('button', { name: /Balun \/ unun ratio/ }).click();
  await expect(page.getByRole('heading', { name: 'Balun and unun ratio' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('1 : 4.000');
  await expect(page.getByRole('img', { name: /Ideal balun ratio diagram/ })).toBeVisible();
  const matchingDimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(matchingDimensions.content).toBeLessThanOrEqual(matchingDimensions.viewport);

  await page.getByRole('button', { name: /RF exposure/ }).click();
  await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('2.000 W/m²');

  await page.getByLabel('Theme').selectOption('dark');
  await page.reload();
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('supports keyboard entry and remains within the viewport', async ({ page, isMobile }) => {
  await expect(page.getByRole('heading', { name: 'Half-wave dipole' })).toBeVisible();
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to calculator' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#calculator$/);
  await expect(page.locator('#calculator')).toBeFocused();

  await page.getByRole('button', { name: /EFHW/ }).click();
  const frequency = page.getByRole('spinbutton', { name: 'Design frequency' });
  await frequency.focus();
  await frequency.fill('7.100');
  await expect(page.locator('.result-summary')).toContainText('20.558 m');

  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  if (isMobile) {
    await expect(page.getByRole('button', { name: /Antenna designs/ })).toHaveCSS('min-height', '44px');
    await expect(page.getByRole('button', { name: /Feedline & matching/ })).toHaveCSS('min-height', '44px');
    await expect(page.getByRole('button', { name: 'Change design' })).toHaveCSS('min-height', '44px');
    await expect(page.getByRole('button', { name: 'View drawing' })).toHaveCSS('min-height', '44px');
    await page.getByRole('button', { name: 'View drawing' }).click();
    await expect(page.locator('#design-drawing')).toBeInViewport();
    await page.getByText('Compare antenna designs', { exact: true }).click();
    await expect(page.locator('.comparison-card')).toHaveCount(3);
    const comparisonDimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
    expect(comparisonDimensions.content).toBeLessThanOrEqual(comparisonDimensions.viewport);
  }
});
