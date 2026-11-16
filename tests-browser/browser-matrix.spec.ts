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
  await expect(page.locator('.result-summary')).toContainText('Near-end SWR');
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
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: /RF exposure/ }).click();
  await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('2.000 W/m²');

  await page.getByLabel('Theme').selectOption('dark');
  await page.reload();
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: /RF exposure/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
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

  await page.getByRole('tab', { name: /Workbench/ }).click();
  await page.getByRole('button', { name: /EFHW/ }).click();
  const frequency = page.getByRole('spinbutton', { name: 'Design frequency' });
  await frequency.focus();
  await frequency.fill('7.100');
  await expect(page.locator('.result-summary')).toContainText('20.558 m');

  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  if (isMobile) {
    await expect(page.locator('html')).toHaveCSS('font-size', '17px');
    const touchTargets = [
      page.getByRole('button', { name: /Antenna designs/ }),
      page.getByRole('button', { name: /Feedline & matching/ }),
      page.getByRole('button', { name: 'Change design' }),
      page.getByRole('button', { name: 'Enlarge drawing' })
    ];
    for (const target of touchTargets) {
      const bounds = await target.boundingBox();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const originalViewport = page.viewportSize();
    const openDrawing = page.getByRole('button', { name: 'Enlarge drawing' });
    await openDrawing.click();
    const dialog = page.getByRole('dialog', { name: /construction drawing enlarged view/ });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('position', 'fixed');
    await expect(page.getByRole('button', { name: 'Close enlarged view' })).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/diagram-view-open/);
    await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    const portraitBounds = await dialog.boundingBox();
    expect(Math.abs((portraitBounds?.width ?? 0) - (originalViewport?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((portraitBounds?.height ?? 0) - (originalViewport?.height ?? 0))).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Zoom diagram in' }).click();
    await expect(page.locator('.diagram-zoom-controls output')).toHaveText('125%');

    await page.setViewportSize({ width: 844, height: 390 });
    const landscapeBounds = await dialog.boundingBox();
    expect(landscapeBounds?.width ?? 0).toBeGreaterThanOrEqual(828);
    expect(landscapeBounds?.height ?? 0).toBeGreaterThanOrEqual(374);
    expect(landscapeBounds?.width ?? 0).toBeLessThanOrEqual(844);
    expect(landscapeBounds?.height ?? 0).toBeLessThanOrEqual(390);
    await expect(page.getByRole('button', { name: 'Close enlarged view' })).toBeInViewport();
    if (originalViewport) await page.setViewportSize(originalViewport);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(openDrawing).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/diagram-view-open/);
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

    const printBuildSheet = page.getByRole('button', { name: 'Print build sheet' });
    await printBuildSheet.click();
    const printPreview = page.getByRole('dialog', { name: /build sheet/ });
    await expect(printPreview).toBeVisible();
    await expect(printPreview.locator('.antenna-print-heading')).toBeVisible();
    await expect(printPreview.locator('.result-summary')).toBeVisible();
    await expect(printPreview.locator('.antenna-figure')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close preview' })).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/print-preview-open/);
    await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    const previewBounds = await printPreview.boundingBox();
    expect(Math.abs((previewBounds?.width ?? 0) - (originalViewport?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((previewBounds?.height ?? 0) - (originalViewport?.height ?? 0))).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(printPreview).toHaveCount(0);
    await expect(printBuildSheet).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/print-preview-open/);
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

    await page.getByText('Compare antenna designs', { exact: true }).click();
    await expect(page.locator('.comparison-card')).toHaveCount(3);
    const comparisonDimensions = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
    expect(comparisonDimensions.content).toBeLessThanOrEqual(comparisonDimensions.viewport);
  }
});
