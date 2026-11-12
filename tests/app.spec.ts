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

test('persists jurisdiction, units, and advanced controls', async ({ page }) => {
  await page.locator('.global-controls select').selectOption('US');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await page.getByRole('button', { name: 'Show advanced' }).click();
  await page.reload();

  await expect(page.locator('.global-controls select')).toHaveValue('US');
  await expect(page.getByRole('button', { name: 'Imperial' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Hide advanced' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: /Length correction factor/ })).toBeVisible();
});

test('maps a selected band to frequency and wavelength', async ({ page }) => {
  await page.locator('select.band-select').selectOption('20m');

  await expect(page.getByRole('spinbutton', { name: /Design frequency/ })).toHaveValue('14.175');
  await expect(page.locator('.band-indicator')).toContainText('20 m');
  await expect(page.locator('.band-indicator')).toContainText('21.149 m');
});

test('switches among graphical antenna designs and updates construction results', async ({ page }) => {
  await page.getByRole('button', { name: /Inverted-V/ }).click();
  await expect(page.getByRole('heading', { name: 'Inverted-V dipole' })).toBeVisible();
  await expect(page.getByLabel('Included apex angle')).toHaveValue('120');
  await expect(page.getByRole('img', { name: /Dimensioned inverted-V/ })).toBeVisible();

  await page.getByRole('button', { name: /EFHW/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('7.100');
  await expect(page.getByRole('heading', { name: 'End-fed half-wave (EFHW)' })).toBeVisible();
  await expect(page.getByLabel('Transformer impedance ratio')).toHaveValue('49');
  await expect(page.getByRole('img', { name: /Dimensioned end-fed half-wave/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('50.0 Ω');
  await expect(page.locator('.harmonic-panel')).toContainText('14.200 MHz');
  await expect(page.locator('.harmonic-panel')).toContainText('20 m allocation');
  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByLabel('Estimated antenna end impedance')).toHaveValue('2450');

  await page.getByRole('button', { name: /OCFD/ }).click();
  await expect(page.getByRole('heading', { name: 'Off-centre-fed dipole (OCFD)' })).toBeVisible();
  await expect(page.getByLabel('Feedpoint position from short end')).toHaveValue('33.333');
  await expect(page.getByLabel('Current-balun impedance ratio')).toHaveValue('4');
  await expect(page.getByLabel('Estimated OCFD feedpoint impedance')).toHaveValue('200');
  await expect(page.getByRole('img', { name: /Dimensioned off-centre-fed dipole/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('50.0 Ω');
  await expect(page.locator('.harmonic-panel')).toContainText('21.300 MHz');

  await page.getByRole('button', { name: /J-pole/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('146.000');
  await expect(page.getByRole('heading', { name: 'J-pole vertical' })).toBeVisible();
  await expect(page.getByLabel('Construction medium')).toHaveValue('twinlead');
  await expect(page.getByLabel('Coax tap height on matching stub')).toHaveValue('7.5');
  await expect(page.getByLabel('Length correction factor')).toHaveValue('0.83');
  await expect(page.getByRole('img', { name: /Dimensioned J-pole antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Quarter-wave matching stub');
  await page.getByLabel('Construction medium').selectOption('metal');
  await expect(page.getByLabel('Length correction factor')).toHaveValue('0.93');

  await page.getByRole('button', { name: /Slim Jim/ }).click();
  await expect(page.getByRole('heading', { name: 'Slim Jim vertical' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Interruption gap' })).toHaveValue('5');
  await expect(page.getByRole('img', { name: /Dimensioned Slim Jim antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Total conductor');
  await page.getByLabel('Construction medium').selectOption('twinlead');
  await expect(page.getByLabel('Length correction factor')).toHaveValue('0.83');

  await page.getByRole('button', { name: /Moxon/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('435.000');
  await expect(page.getByRole('heading', { name: 'Moxon rectangle' })).toBeVisible();
  await expect(page.getByLabel('Conductor diameter')).toHaveValue('2.05');
  await expect(page.getByRole('img', { name: /Dimensioned Moxon rectangle/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Critical tip gap');
  await expect(page.getByRole('button', { name: /advanced/ })).toHaveCount(0);

  await page.getByRole('button', { name: /Basic Yagi/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('146.000');
  await expect(page.getByRole('heading', { name: 'Three-element Yagi' })).toBeVisible();
  await expect(page.getByText('NBS reference geometry')).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned three-element Yagi/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Reference element diameter');
  await expect(page.locator('.caution-card')).toContainText('do not guarantee a 50 Ω feed');

  await page.getByRole('button', { name: /Ground vertical/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('7.100');
  await expect(page.getByRole('heading', { name: 'Ground-mounted quarter-wave vertical' })).toBeVisible();
  await expect(page.getByLabel('Number of ground radials')).toHaveValue('32');
  await expect(page.getByLabel('Radial length multiplier')).toHaveValue('1');
  await expect(page.getByRole('img', { name: /Dimensioned ground-mounted quarter-wave vertical/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('32 radial wires');
  await expect(page.locator('.caution-card')).toContainText('ground rod is not an RF radial field');

  await page.getByRole('button', { name: /Ground plane/ }).click();
  await expect(page.getByLabel('Number of radials')).toHaveValue('4');
  await expect(page.getByRole('img', { name: /Dimensioned quarter-wave ground-plane/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('4 radial wires');

  await page.getByRole('button', { name: /Full-wave loop/ }).click();
  await page.getByLabel('Loop shape').selectOption('circle');
  await expect(page.getByRole('img', { name: /Dimensioned full-wave circle loop/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Diameter');
});

test('calculates feedline loss and preserves physical values across unit changes', async ({ page }) => {
  await page.getByRole('button', { name: /Feedline & matching/ }).click();
  await expect(page.getByRole('heading', { name: 'Feedline power budget' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Feedline power-flow diagram' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('63.10 W');
  await expect(page.locator('.result-summary')).toContainText('1.80 dB');

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByLabel('Cable length')).toHaveValue('98.425');
  await expect(page.getByLabel('Published matched cable loss')).toHaveValue('1.829');
  await expect(page.locator('.result-summary')).toContainText('63.10 W');

  await page.getByRole('button', { name: /Coaxial stub/ }).click();
  await expect(page.getByRole('heading', { name: 'Coaxial stub length' })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Operating frequency' }).fill('14.100');
  await expect(page.getByLabel('Velocity factor')).toHaveValue('0.66');
  await expect(page.getByLabel('Electrical length')).toHaveValue('0.25');
  await expect(page.getByLabel('Far-end termination')).toHaveValue('short');
  await expect(page.getByRole('img', { name: /Dimensioned coaxial stub/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('12 ft 1 in');
  await expect(page.locator('.result-summary')).toContainText('High impedance');

  await page.getByLabel('Far-end termination').selectOption('open');
  await expect(page.locator('.result-summary')).toContainText('Low impedance');

  await page.getByRole('button', { name: /ERP \/ EIRP/ }).click();
  await expect(page.getByRole('heading', { name: 'ERP and EIRP' })).toBeVisible();
  await page.getByLabel('Transmitter power').fill('100');
  await page.getByLabel('Total feed-system loss').fill('2');
  await page.getByLabel('Antenna gain').fill('6');
  await expect(page.getByLabel('Gain reference')).toHaveValue('dBi');
  await expect(page.getByRole('img', { name: /ERP and EIRP antenna-system diagram/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('251.19 W');
  await expect(page.locator('.result-summary')).toContainText('153.11 W');

  await page.getByLabel('Gain reference').selectOption('dBd');
  await expect(page.locator('.result-summary')).toContainText('412.10 W');
});

test('carries an antenna and feed-system source into a station project', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Centre-fed half-wave dipole' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to feedline and exposure' }).click();

  await expect(page.getByRole('heading', { name: 'ERP and EIRP' })).toBeVisible();
  const linked = page.locator('.linked-workflow');
  await expect(linked).toContainText('Centre-fed half-wave dipole');
  await expect(linked).toContainText('14.200 MHz');
  await expect(linked).toContainText('half-wave-dipole 1.0.0');
  await expect(page.getByLabel('Operating frequency')).toHaveAttribute('readonly');
  await expect(page.locator('select.band-select')).toBeDisabled();

  await page.getByLabel('Transmitter power').fill('75');
  await page.getByLabel('Total feed-system loss').fill('2');
  await page.getByLabel('Antenna gain').fill('3');
  await page.getByLabel('Exposure duty cycle').fill('25');
  await page.getByLabel('Installed antenna centre height').fill('11');
  await page.getByLabel('Installed antenna east position').fill('6');
  await page.getByLabel('Installed antenna north position').fill('-3');
  await page.getByRole('button', { name: 'Add to station project' }).click();

  const project = page.locator('.project-section');
  await expect(project.getByRole('heading', { name: 'Station assessment project' })).toBeVisible();
  await expect(project.locator('.workflow-message')).toContainText('Centre-fed half-wave dipole');
  await expect(project.locator('.project-source-editor')).toHaveCount(3);
  const transferred = project.locator('.project-source-editor').last();
  await expect(transferred).toContainText('14.2 MHz · 75 W · linked workflow');
  await transferred.locator('summary').click();
  await expect(transferred).toContainText('half-wave-dipole 1.0.0');
  await expect(transferred.getByLabel('Project source 3 duty cycle')).toHaveValue('25');
  await expect(transferred.getByLabel('Project source 3 feed loss')).toHaveValue('2');
  await expect(transferred.getByLabel('Project source 3 antenna gain')).toHaveValue('3');
  await expect(transferred.getByLabel('Project source 3 east position')).toHaveValue('6');
  await expect(transferred.getByLabel('Project source 3 north position')).toHaveValue('-3');
  await expect(project.getByRole('checkbox', { name: /Station-site source inventory assessed/ })).not.toBeChecked();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('radiobook:antenna-workshop:exposure-projects:v1'))).toContain('half-wave-dipole');

  await page.reload();
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const restored = page.locator('.project-source-editor').last();
  await expect(page.locator('.project-source-editor')).toHaveCount(3);
  await expect(restored).toContainText('linked workflow');
});

test('shows and dismisses an application update notice', async ({ page }) => {
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('radiobook:pwa-update-ready', {
        detail: { applyUpdate: async () => undefined }
      })
    );
  });

  await expect(page.getByRole('status')).toContainText('A new version is ready');
  await page.getByRole('button', { name: 'Later' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('shows official RF exposure reference limits without a compliance result', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('do not by themselves determine compliance');
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('146.000');
  await expect(page.locator('.result-summary')).toContainText('1.291 W/m²');
  await expect(page.locator('.result-summary')).toContainText('6.00 min');
  await expect(page.getByRole('img', { name: /RF exposure power-density reference levels/ })).toBeVisible();

  await page.getByLabel('Exposure environment').selectOption('controlled');
  await expect(page.locator('.result-summary')).toContainText('7.800 W/m²');

  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('7.100');
  await expect(page.getByRole('alert')).toContainText('not applicable');
  await expect(page.locator('.result-summary')).toHaveCount(0);

  await page.locator('.global-controls select').selectOption('US');
  await expect(page.locator('.result-summary')).toContainText('178.536 W/m²');
  await expect(page.locator('.result-summary')).toContainText('6.00 min');
});

test('classifies conservative far-field screening limitations', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Single source/ }).click();
  const stationScreen = page.locator('.exposure-screen-section');
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('146.000');
  await expect(page.getByRole('heading', { name: 'Single-source far-field estimate' })).toBeVisible();
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Far-field method is inapplicable here');

  await page.getByRole('spinbutton', { name: 'Largest antenna dimension' }).fill('1');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Screening is inconclusive');

  await page.getByLabel('Other RF sources').selectOption('assessed');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Below the preliminary screening trigger');
  await expect(stationScreen.locator('.screen-result-card')).toContainText('50.0 W');
  await expect(page.getByRole('img', { name: /Far-field exposure screening geometry/ })).toBeVisible();

  await page.getByRole('spinbutton', { name: 'Straight-line separation' }).fill('2');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Further analysis is required');
  await expect(stationScreen.locator('.screen-limitations')).toContainText('does not mean safe, compliant, certified, or exempt');
});

test('normalizes and sums multiple RF sources without inferring compliance', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Measured sources/ }).click();
  const aggregation = page.locator('.aggregation-section');
  await expect(aggregation.getByRole('heading', { name: 'Local RF environment' })).toBeVisible();
  await expect(aggregation.locator('.screen-outcome')).toContainText('Source inventory is incomplete');
  await expect(aggregation.getByRole('img', { name: /Multiple-source normalized exposure sum/ })).toBeVisible();
  await expect(aggregation.locator('.aggregation-summary')).toContainText('10.70%');

  await aggregation.getByRole('checkbox', { name: /Local source inventory assessed/ }).check();
  await expect(aggregation.locator('.screen-outcome')).toContainText('Below the aggregate screening trigger');

  await aggregation.getByRole('spinbutton', { name: 'Source 1 power density' }).fill('0.7');
  await expect(aggregation.locator('.screen-outcome')).toContainText('Further analysis is required');
  await expect(aggregation.locator('.screen-limitations')).toContainText('does not mean safe, compliant, certified, or exempt');

  await aggregation.getByRole('button', { name: /Add RF source/ }).click();
  await expect(aggregation.getByRole('group')).toHaveCount(3);
  await expect(aggregation.locator('.screen-outcome')).toContainText('Source inventory is incomplete');
});

test('calculates a multi-source station project across accessible locations', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');

  await expect(project.getByRole('heading', { name: 'Station assessment project' })).toBeVisible();
  await expect(project.locator('.screen-outcome')).toContainText('station source inventory is incomplete');
  await expect(project.getByRole('img', { name: /Station site plan/ })).toBeVisible();
  await expect(project.getByRole('img', { name: /Elevation section/ })).toBeVisible();
  await expect(project.locator('.project-point-results article')).toHaveCount(2);
  await expect(project.getByRole('button', { name: 'Print assessment' })).toBeVisible();

  await project.getByRole('checkbox', { name: /Station-site source inventory assessed/ }).check();
  await expect(project.locator('.screen-outcome')).toContainText('All modelled points are below the screening trigger');

  await project.getByRole('spinbutton', { name: 'Project point 1 east position' }).fill('0.05');
  await project.getByRole('spinbutton', { name: 'Project point 1 height' }).fill('10');
  await expect(project.locator('.screen-outcome')).toContainText('Far-field screening is inapplicable');

  await project.getByRole('button', { name: /Add evaluation point/ }).click();
  await expect(project.locator('.project-point-editor')).toHaveCount(3);

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.tool-nav')).toBeHidden();
  await expect(project.locator('.project-editor')).toBeHidden();
  await expect(project.locator('.project-print-contributions').first()).toBeVisible();
});

test('persists and transfers validated station projects', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  let project = page.locator('.project-section');

  await project.getByLabel('Project title').fill('Field day station');
  await page.locator('.global-controls select').selectOption('US');
  await page.getByLabel('Exposure environment').selectOption('controlled');
  await project.getByRole('spinbutton', { name: 'Project point 1 east position' }).fill('42');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('radiobook:antenna-workshop:exposure-projects:v1'))).toContain('Field day station');

  await page.reload();
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  project = page.locator('.project-section');
  await expect(project.getByLabel('Project title')).toHaveValue('Field day station');
  await expect(page.locator('.global-controls select')).toHaveValue('US');
  await expect(page.getByLabel('Exposure environment')).toHaveValue('controlled');
  await expect(project.getByRole('spinbutton', { name: 'Project point 1 east position' })).toHaveValue('42');

  const downloadPromise = page.waitForEvent('download');
  await project.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('field-day-station.antenna-project.json');
  const exportedPath = await download.path();
  expect(exportedPath).not.toBeNull();

  await project.getByRole('button', { name: 'New project' }).click();
  await expect(project.getByLabel('Project title')).toHaveValue('Home station RF assessment');
  await expect(project.getByLabel('Open saved station project').locator('option')).toHaveCount(2);

  await project.getByLabel('Import project JSON').setInputFiles(exportedPath!);
  await expect(project.getByLabel('Project title')).toHaveValue('Field day station');
  await expect(project.getByLabel('Open saved station project').locator('option')).toHaveCount(3);

  page.once('dialog', (dialog) => dialog.accept());
  await project.getByRole('button', { name: 'Delete project' }).click();
  await expect(project.getByLabel('Open saved station project').locator('option')).toHaveCount(2);
});

test('has no horizontal overflow on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /RF exposure/ }).click();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth
  }));

  expect(dimensions.content).toBe(dimensions.viewport);
});

test('shows corporate branding, attribution, and public project links', async ({ page }) => {
  await expect(page.getByAltText('Tartanleaf tartan maple-leaf logo').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'RadioBook home' })).toHaveAttribute('href', 'https://www.radiobook.ca/');
  await expect(page.getByRole('link', { name: 'Visit Tartanleaf.com Inc.' })).toHaveAttribute('href', 'https://www.tartanleaf.com/');
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/gregweir/AntennaWorkshop');
  await expect(page.getByRole('link', { name: 'gweir@tartanleaf.com' })).toHaveAttribute('href', 'mailto:gweir@tartanleaf.com');
  await expect(page.locator('.site-footer')).toContainText('Developed by Greg Weir, VA1GW');
});
