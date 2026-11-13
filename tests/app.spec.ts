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
  await expect(page.getByLabel('Transformer impedance ratio', { exact: true })).toHaveValue('49');
  await expect(page.getByRole('img', { name: /Dimensioned end-fed half-wave/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('50.0 Ω');
  await expect(page.locator('.harmonic-panel')).toContainText('14.200 MHz');
  await expect(page.locator('.harmonic-panel')).toContainText('20 m allocation');
  await expect(page.getByText('Choose the fundamental')).toBeHidden();
  await page.getByText('Build and tune an EFHW').click();
  await expect(page.getByText('Choose the fundamental')).toBeVisible();
  await expect(page.locator('.step-by-step-help')).toContainText('does not design a transformer');
  await page.getByLabel('Help: Transformer impedance ratio').click();
  await expect(page.getByRole('note').filter({ hasText: 'Transformer impedance ratio' })).toContainText('7:1 ideal turns ratio');
  await page.getByLabel('Help: Transformer impedance ratio').click();
  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByLabel('Estimated antenna end impedance', { exact: true })).toHaveValue('2450');
  await page.getByLabel('Help: Estimated antenna end impedance').click();
  await expect(page.getByRole('note').filter({ hasText: 'Estimated antenna end impedance' })).toContainText('planning assumption');

  await page.getByRole('button', { name: /OCFD/ }).click();
  await expect(page.getByRole('heading', { name: 'Off-centre-fed dipole (OCFD)' })).toBeVisible();
  await expect(page.getByLabel('Feedpoint position from short end', { exact: true })).toHaveValue('33.333');
  await expect(page.getByLabel('Current-balun impedance ratio', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Estimated OCFD feedpoint impedance', { exact: true })).toHaveValue('200');
  await expect(page.getByRole('img', { name: /Dimensioned off-centre-fed dipole/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('50.0 Ω');
  await expect(page.locator('.harmonic-panel')).toContainText('21.300 MHz');
  await expect(page.getByText('Choose the installed geometry')).toBeHidden();
  await page.getByText('Build and tune an OCFD').click();
  await expect(page.getByText('Choose the installed geometry')).toBeVisible();
  await expect(page.locator('.step-by-step-help')).toContainText('does not design or power-rate a balun');
  await page.getByLabel('Help: Feedpoint position from short end').click();
  await expect(page.getByRole('note').filter({ hasText: 'Feedpoint position from short end' })).toContainText('both leg lengths');
  await page.getByLabel('Help: Feedpoint position from short end').click();
  await page.getByLabel('Help: Estimated OCFD feedpoint impedance').click();
  await expect(page.getByRole('note').filter({ hasText: 'Estimated OCFD feedpoint impedance' })).toContainText('resistance assumption');

  await page.getByRole('button', { name: /J-pole/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('146.000');
  await expect(page.getByRole('heading', { name: 'J-pole vertical' })).toBeVisible();
  await expect(page.getByLabel('Construction medium', { exact: true })).toHaveValue('twinlead');
  await expect(page.getByLabel('Coax tap height on matching stub', { exact: true })).toHaveValue('7.5');
  await expect(page.getByLabel('Length correction factor', { exact: true })).toHaveValue('0.83');
  await expect(page.getByRole('img', { name: /Dimensioned J-pole antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Quarter-wave matching stub');
  await expect(page.getByText('Build the parallel section')).toBeHidden();
  await page.getByText('Build and tune a J-pole').click();
  await expect(page.getByText('Build the parallel section')).toBeVisible();
  await page.getByLabel('Help: J-pole construction medium').click();
  await expect(page.getByRole('note').filter({ hasText: 'J-pole construction medium' })).toContainText('0.83');
  await page.getByLabel('Help: J-pole construction medium').click();
  await page.getByLabel('Help: Coax tap height on matching stub').click();
  await expect(page.getByRole('note').filter({ hasText: 'Coax tap height on matching stub' })).toContainText('move the centre-conductor and shield contacts together');
  await page.getByLabel('Construction medium', { exact: true }).selectOption('metal');
  await expect(page.getByLabel('Length correction factor', { exact: true })).toHaveValue('0.93');

  await page.getByRole('button', { name: /Slim Jim/ }).click();
  await expect(page.getByRole('heading', { name: 'Slim Jim vertical' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Interruption gap' })).toHaveValue('5');
  await expect(page.getByRole('img', { name: /Dimensioned Slim Jim antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Total conductor');
  await expect(page.getByText('Preserve the folded geometry', { exact: true })).toBeHidden();
  await page.getByText('Build and tune a Slim Jim').click();
  await expect(page.getByText('Preserve the folded geometry', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Interruption gap').click();
  await expect(page.getByRole('note').filter({ hasText: 'Interruption gap' })).toContainText('physical opening');
  await page.getByLabel('Construction medium', { exact: true }).selectOption('twinlead');
  await expect(page.getByLabel('Length correction factor', { exact: true })).toHaveValue('0.83');

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
  await expect(page.getByLabel('Number of ground radials', { exact: true })).toHaveValue('32');
  await expect(page.getByLabel('Radial length multiplier', { exact: true })).toHaveValue('1');
  await expect(page.getByRole('img', { name: /Dimensioned ground-mounted quarter-wave vertical/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('32 radial wires');
  await expect(page.locator('.caution-card')).toContainText('ground rod is not an RF radial field');
  await expect(page.getByText('Lay out the RF radial field')).toBeHidden();
  await page.getByText('Build a ground-mounted vertical').click();
  await expect(page.getByText('Lay out the RF radial field')).toBeVisible();
  await page.getByLabel('Help: Number of ground radials').click();
  await expect(page.getByRole('note').filter({ hasText: 'Number of ground radials' })).toContainText('ground rod is not a substitute');

  await page.getByRole('button', { name: /Ground plane/ }).click();
  await expect(page.getByLabel('Number of radials', { exact: true })).toHaveValue('4');
  await expect(page.getByRole('img', { name: /Dimensioned quarter-wave ground-plane/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('4 radial wires');
  await expect(page.getByText('Set the radial slope')).toBeHidden();
  await page.getByText('Build an elevated ground plane').click();
  await expect(page.getByText('Set the radial slope')).toBeVisible();
  await page.getByLabel('Help: Radial slope below horizontal').click();
  await expect(page.getByRole('note').filter({ hasText: 'Radial slope below horizontal' })).toContainText('actual result depends on the complete installation');

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
  await transferred.locator(':scope > summary').click();
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

  await expect(project.getByText('Set the assessment context')).toBeHidden();
  await project.getByText('Build a station assessment project').click();
  await expect(project.getByText('Set the assessment context')).toBeVisible();
  await expect(project).toContainText('This is a preliminary engineering screen');

  const firstSource = project.locator('.project-source-editor').first();
  await firstSource.locator(':scope > summary').click();
  await firstSource.getByLabel('Help: Source 1 largest antenna dimension').click();
  await expect(project.getByRole('note').filter({ hasText: 'Source 1 largest antenna dimension' })).toContainText('far-field boundary');

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
  await expect(project.locator('.sensitivity-explorer')).toBeHidden();
  await expect(project.locator('.project-print-contributions').first()).toBeVisible();
});

test('tracks assessment blockers, documentation gaps, and external review separately', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');
  const checklist = project.getByRole('region', { name: 'Assessment review checklist' });

  await expect(checklist).toContainText('Review blockers remain');
  await expect(checklist.locator('.assessment-count-recorded')).toContainText('2 recorded');
  await expect(checklist.locator('.assessment-count-attention')).toContainText('5 documentation gaps');
  await expect(checklist.locator('.assessment-count-required')).toContainText('2 action required');
  await expect(checklist.locator('.assessment-count-external-review')).toContainText('1 external review');
  await expect(checklist).toContainText('A complete checklist is not a compliance result');

  await project.getByLabel('Station-site source inventory assessed').check();
  await expect(checklist).toContainText('Documentation gaps remain');
  await expect(checklist.locator('.assessment-count-recorded')).toContainText('4 recorded');
  await expect(checklist.locator('.assessment-count-required')).toContainText('0 action required');

  await project.getByRole('spinbutton', { name: 'Project point 1 east position' }).fill('0');
  await project.getByRole('spinbutton', { name: 'Project point 1 height' }).fill('9.9');
  await expect(checklist).toContainText('source-to-point path is inside the conservative far-field boundary');
  await expect(checklist.getByText('Far-field method applicability').locator('..')).toContainText('Action required');
  await expect(checklist.locator('.assessment-check-external-review')).toContainText('near-field method or measurement');

  await checklist.getByLabel('Missing critical value').selectOption({ label: '2 m vertical · Transmitter output' });
  await checklist.getByRole('button', { name: 'Document selected value' }).click();
  const evidenceLog = project.locator('.evidence-log');
  await expect(evidenceLog.getByRole('status')).toContainText('2 m vertical · Transmitter output');
  await expect(evidenceLog.getByLabel('Evidence scope', { exact: true })).toHaveValue('source');
  await expect(evidenceLog.getByLabel('Evidence scope item')).toHaveValue('project-source-1');
  await expect(evidenceLog.getByLabel('Evidence related input', { exact: true })).toHaveValue('transmitterPowerWatts');
  await expect(evidenceLog.getByLabel('Evidence template', { exact: true })).toHaveValue('measurement');
  await evidenceLog.getByRole('button', { name: 'Apply template' }).click();
  await expect(evidenceLog.getByRole('status')).toContainText('Field or bench measurement template applied');
  await expect(evidenceLog.getByLabel('Evidence category')).toHaveValue('measurement');
  await expect(evidenceLog.getByLabel('Evidence title')).toHaveValue('Transmitter output measurement record');
  await expect(evidenceLog.getByLabel('Evidence detail')).toHaveAttribute('placeholder', /instrument and calibration status/i);
  await expect(evidenceLog.getByLabel('Evidence scope item')).toHaveValue('project-source-1');
  await evidenceLog.getByLabel('Evidence reviewer').fill('Greg Weir, VA1GW');
  await evidenceLog.getByLabel('Evidence detail').fill('Measured transmitter output with a calibrated inline wattmeter and recorded the test conditions.');
  await evidenceLog.getByRole('button', { name: 'Add to evidence log' }).click();
  await expect(checklist.getByLabel('Missing critical value').getByRole('option', { name: '2 m vertical · Transmitter output' })).toHaveCount(0);
  await expect(checklist.locator('.assessment-check-attention').filter({ hasText: 'Critical input evidence coverage' })).toContainText('1 of 25 critical values');
});

test('edits station geometry with pointer and keyboard controls', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');
  const editor = project.getByRole('group', { name: 'Editable station site plan' });
  const yardMarker = editor.getByRole('button', { name: /Yard access evaluation point/ });
  const yardEast = project.getByRole('spinbutton', { name: 'Project point 1 east position' });

  await yardMarker.scrollIntoViewIfNeeded();
  const hitBox = await yardMarker.locator('.site-editor-hit').boundingBox();
  expect(hitBox).not.toBeNull();
  await page.mouse.move(hitBox!.x + hitBox!.width / 2, hitBox!.y + hitBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hitBox!.x + hitBox!.width / 2 + 45, hitBox!.y + hitBox!.height / 2 - 20, { steps: 4 });
  await page.mouse.up();
  await expect(yardEast).not.toHaveValue('15');

  const northBefore = Number(await project.getByRole('spinbutton', { name: 'Project point 1 north position' }).inputValue());
  await yardMarker.focus();
  await yardMarker.press('Shift+ArrowUp');
  await expect(project.getByRole('spinbutton', { name: 'Project point 1 north position' })).toHaveValue((northBefore + 0.1).toString());

  const inventory = project.getByRole('checkbox', { name: /Station-site source inventory assessed/ });
  await inventory.check();
  const sourceMarker = editor.getByRole('button', { name: /2 m vertical antenna/ });
  await sourceMarker.focus();
  await sourceMarker.press('ArrowRight');
  await expect(project.locator('input[aria-label="Project source 1 east position"]')).toHaveValue('1');
  await expect(inventory).not.toBeChecked();
  await expect(project.locator('.site-layout-status')).toContainText('2 m vertical moved');
});

test('records and visualizes antenna azimuth orientation without reducing the exposure screen', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  let project = page.locator('.project-section');
  await project.getByRole('checkbox', { name: /Station-site source inventory assessed/ }).check();
  await project.locator('.project-source-editor').first().locator(':scope > summary').click();

  await project.getByLabel('Project source 1 azimuth pattern').selectOption('directional');
  await project.getByRole('spinbutton', { name: 'Project source 1 bearing' }).fill('90');
  await project.getByLabel('Project source 1 beamwidth').fill('55');
  await expect(project.getByRole('checkbox', { name: /Station-site source inventory assessed/ })).not.toBeChecked();
  await expect(project.getByRole('img', { name: '2 m vertical azimuth orientation' })).toBeVisible();
  await expect(project.locator('.azimuth-preview').first()).toContainText('55 degree directional envelope');
  await expect(project.getByRole('group', { name: 'Editable station site plan' }).locator('.azimuth-pattern-directional')).toHaveCount(1);
  const routeOverview = project.getByRole('region', { name: 'Orientation toward Yard access' });
  await expect(routeOverview).toContainText('Orientation toward Yard access');
  await expect(routeOverview).toContainText('90.0° true · 0.0° off 90° lobe');
  await expect(routeOverview).toContainText('Inside entered 55° envelope');
  await expect(routeOverview).toContainText('do not change the conservative exposure values');
  await expect(project.locator('.project-record-grid')).toContainText('90° true / 55° beamwidth');
  await expect(project.locator('.project-record-grid')).toContainText('maximum stated gain is still applied toward every point');

  await page.reload();
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  project = page.locator('.project-section');
  await project.locator('.project-source-editor').first().locator(':scope > summary').click();
  await expect(project.getByLabel('Project source 1 azimuth pattern')).toHaveValue('directional');
  await expect(project.getByRole('spinbutton', { name: 'Project source 1 bearing' })).toHaveValue('90');
  await expect(project.getByLabel('Project source 1 beamwidth')).toHaveValue('55');
});

test('duplicates and compares station scenarios without overwriting the baseline', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');
  await project.getByRole('checkbox', { name: /Station-site source inventory assessed/ }).check();
  await project.getByRole('button', { name: 'Duplicate as scenario' }).click();

  await expect(project.getByLabel('Project title')).toHaveValue('Home station RF assessment — scenario');
  await expect(project.getByLabel('Open saved station project').locator('option')).toHaveCount(2);
  await expect(project.getByLabel('Scenario comparison baseline')).not.toHaveValue('');
  const comparison = project.getByRole('region', { name: 'Compare saved station scenarios' });
  await expect(comparison).toContainText('Baseline: Home station RF assessment');
  await expect(comparison).toContainText('No calculated change');

  await project.locator('.project-source-editor').first().locator(':scope > summary').click();
  await project.getByRole('spinbutton', { name: 'Project source 1 transmitter output' }).fill('100');
  await expect(comparison).toContainText('+1.73 percentage points');
  await expect(comparison).toContainText('Higher in current scenario');
  const inputAudit = comparison.getByRole('region', { name: 'What changed between these projects' });
  await expect(inputAudit).toContainText('Input audit · 3 changes');
  await expect(inputAudit).toContainText('Transmitter output');
  await expect(inputAudit).toContainText('50 W');
  await expect(inputAudit).toContainText('100 W');
  await expect(inputAudit).toContainText('Source inventory confirmation');
  await expect(inputAudit).toContainText('Complete');
  await expect(inputAudit).toContainText('Incomplete');

  await project.getByLabel('Open saved station project').selectOption({ label: 'Home station RF assessment' });
  await expect(project.locator('input[aria-label="Project source 1 transmitter output"]')).toHaveValue('50');
});

test('explores exposure sensitivity without changing the saved project', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');
  const explorer = project.getByRole('region', { name: 'Exposure sensitivity explorer' });
  await expect(explorer.getByRole('img', { name: /Transmitter output sensitivity at Yard access/ })).toBeVisible();
  await expect(explorer).toContainText('Previewing a sample does not edit or save the project');

  await explorer.getByRole('slider', { name: 'Sensitivity preview position' }).fill('40');
  await expect(explorer.locator('.sensitivity-preview-value')).toContainText('100 W');
  await expect(explorer.locator('.sensitivity-preview')).toContainText('4.17%');
  await expect(project.locator('input[aria-label="Project source 1 transmitter output"]')).toHaveValue('50');

  await explorer.getByLabel('Sensitivity variable').selectOption('plan-distance');
  await explorer.getByRole('slider', { name: 'Sensitivity preview position' }).fill('40');
  await expect(explorer.getByRole('img', { name: /Point plan distance from selected source sensitivity at Yard access/ })).toBeVisible();
  await expect(explorer.locator('.sensitivity-preview-value')).toContainText('30.000 m');
  await expect(project.getByRole('spinbutton', { name: 'Project point 1 east position' })).toHaveValue('15');

  await explorer.getByLabel('Sensitivity variable').selectOption('transmitter-power');
  await explorer.getByLabel('Sensitivity range maximum').fill('2000');
  await expect(explorer.locator('.sensitivity-crossing')).toHaveCount(1);
  await expect(explorer.locator('.sensitivity-crossing-summary')).toContainText('Estimated trigger crossing');
  await expect(explorer.locator('.sensitivity-crossing-summary')).toContainText('rising');
  await expect(explorer.locator('.sensitivity-crossing-summary')).toContainText('not a compliance limit');
  await explorer.getByText('View all 41 sensitivity samples').click();
  const sampleTable = explorer.getByRole('table', { name: /Transmitter output sensitivity samples/ });
  await expect(sampleTable.getByRole('row')).toHaveCount(42);
  await expect(sampleTable.getByRole('row').nth(1)).toContainText('12.5 W');
  await expect(sampleTable).toContainText('Below trigger');
  const csvDownloadPromise = page.waitForEvent('download');
  await explorer.getByRole('button', { name: 'Download CSV' }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toBe('home-station-rf-assessment-transmitter-power-sensitivity.csv');
  const csvPath = await csvDownload.path();
  expect(csvPath).not.toBeNull();
  const csv = await import('node:fs/promises').then(({ readFile }) => readFile(csvPath!, 'utf8'));
  expect(csv).toContain('"record_type","variable","source","evaluation_point"');
  expect(csv.match(/"sample"/g)).toHaveLength(41);
  expect(csv).toContain('"interpolated_crossing"');
  expect(csv).toContain('not a compliance limit');
  await expect(explorer.getByRole('status')).toContainText('Downloaded 41 sensitivity samples and 1 interpolated crossing');
  await explorer.getByLabel('Sensitivity range minimum').fill('2001');
  await expect(explorer.getByRole('alert')).toContainText('minimum must be less than range maximum');
  await expect(project.locator('input[aria-label="Project source 1 transmitter output"]')).toHaveValue('50');
});

test('records, transfers, and audits assessment evidence', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const project = page.locator('.project-section');
  let evidenceLog = project.locator('.evidence-log');

  await expect(evidenceLog.getByText('Choose the target')).toBeHidden();
  await evidenceLog.getByText('Build a reproducible evidence entry').click();
  await expect(evidenceLog.getByText('Choose the target')).toBeVisible();
  await expect(evidenceLog).toContainText('This guide organizes documentation');
  await evidenceLog.getByLabel('Help: Evidence scope').click();
  await expect(evidenceLog.getByRole('note').filter({ hasText: 'Evidence scope' })).toContainText('whole-project scope');
  await evidenceLog.getByLabel('Help: Evidence scope').click();

  await evidenceLog.getByRole('button', { name: 'Add to evidence log' }).click();
  await expect(evidenceLog.getByRole('alert')).toContainText('Enter a title, detail, review date, and reviewer');
  await evidenceLog.getByLabel('Evidence category').selectOption('measurement');
  await evidenceLog.getByLabel('Evidence scope', { exact: true }).selectOption('source');
  await evidenceLog.getByLabel('Evidence scope item').selectOption({ label: '2 m vertical' });
  await evidenceLog.getByLabel('Evidence related input', { exact: true }).selectOption('antennaCentreHeightMetres');
  await evidenceLog.getByLabel('Evidence title').fill('Mast height field check');
  await evidenceLog.getByLabel('Evidence review date').fill('2026-11-12');
  await evidenceLog.getByLabel('Evidence review reminder', { exact: true }).fill('2020-01-01');
  await evidenceLog.getByLabel('Evidence reviewer').fill('Greg Weir, VA1GW');
  await evidenceLog.getByLabel('Evidence detail').fill('Measured antenna centre height as 10.0 m using a laser rangefinder.');
  await evidenceLog.getByLabel('Evidence reference link').fill('https://www.radiobook.ca/');
  await evidenceLog.getByLabel('Measured value and units are recorded').check();
  await evidenceLog.getByLabel('Method and conditions are recorded').check();
  await evidenceLog.getByRole('button', { name: 'Add to evidence log' }).click();
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('Mast height field check');
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('Greg Weir, VA1GW');
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('2 of 4 quality prompts recorded');
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('Documentation follow-up');
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('Review due 2020-01-01');
  await expect(evidenceLog.locator('.evidence-overview-counts')).toContainText('1 total');
  await expect(evidenceLog.locator('.evidence-overview-counts')).toContainText('1 follow-up');
  await expect(evidenceLog.locator('.evidence-overview-counts')).toContainText('1 review due');
  await expect(project.locator('.evidence-record')).toContainText('Measured antenna centre height as 10.0 m');
  await expect(project.locator('.evidence-record')).toContainText('Self-declared record quality: 2 of 4 prompts recorded');
  await expect(project.locator('.evidence-record')).toContainText('Author-set review reminder: 2020-01-01 · review due');

  await evidenceLog.getByLabel('Filter evidence category').selectOption('assumption');
  await expect(evidenceLog).toContainText('No evidence entries match the current filters');
  await expect(evidenceLog.locator('.evidence-filter-result')).toContainText('Showing 0 of 1');
  await evidenceLog.getByRole('button', { name: 'Reset filters' }).click();
  await evidenceLog.getByLabel('Search evidence').fill('mast height');
  await expect(evidenceLog.locator('.evidence-filter-result')).toContainText('Showing 1 of 1');
  await evidenceLog.getByLabel('Filter evidence status').selectOption('review-due');
  await expect(evidenceLog.locator('.evidence-filter-result')).toContainText('Showing 1 of 1');
  await evidenceLog.getByRole('button', { name: 'Reset filters' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('radiobook:antenna-workshop:exposure-projects:v1'))).toContain('Mast height field check');

  await project.getByRole('button', { name: 'Duplicate as scenario' }).click();
  evidenceLog = project.locator('.evidence-log');
  await evidenceLog.getByRole('button', { name: 'Edit' }).click();
  await evidenceLog.getByLabel('Evidence detail').fill('Rechecked antenna centre height as 10.2 m using a laser rangefinder.');
  await evidenceLog.getByLabel('Instrument and calibration status are recorded').check();
  await evidenceLog.getByLabel('Uncertainty or repeatability is addressed').check();
  await evidenceLog.getByRole('button', { name: 'Save evidence changes' }).click();
  await expect(evidenceLog.locator('.evidence-entry-list')).toContainText('All 4 quality prompts recorded');
  await expect(evidenceLog.locator('.evidence-overview-counts')).toContainText('1 quality complete');
  await expect(evidenceLog.locator('.evidence-overview-counts')).toContainText('0 follow-up');
  const audit = project.getByRole('region', { name: 'What changed between these projects' });
  await expect(audit).toContainText('Evidence detail');
  await expect(audit).toContainText('Measured antenna centre height as 10.0 m');
  await expect(audit).toContainText('Rechecked antenna centre height as 10.2 m');

  const downloadPromise = page.waitForEvent('download');
  await project.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  expect(exportedPath).not.toBeNull();
  const exported = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(exportedPath!, 'utf8')));
  expect(exported.schemaVersion).toBe(7);
  expect(exported.project.evidenceEntries).toMatchObject([{ category: 'measurement', title: 'Mast height field check', reviewer: 'Greg Weir, VA1GW', reviewDueOn: '2020-01-01', referenceUrl: 'https://www.radiobook.ca/', scopeType: 'source', scopeId: 'project-source-1', relatedField: 'antennaCentreHeightMetres', qualityChecks: ['measurement-value', 'measurement-method', 'measurement-instrument', 'measurement-uncertainty'] }]);

  const firstSource = project.locator('.project-source-editor').first();
  await firstSource.locator(':scope > summary').click();
  await firstSource.getByRole('button', { name: 'Remove source' }).click();
  await expect(evidenceLog.locator('.evidence-scope')).toContainText('Whole project · General / multiple inputs');
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
  await page.getByRole('button', { name: /Station project/ }).click();
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
