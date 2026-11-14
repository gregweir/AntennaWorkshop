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

test('persists jurisdiction, units, theme, and advanced controls', async ({ page }) => {
  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('US');
  await page.getByLabel('Theme').selectOption('dark');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await page.getByRole('button', { name: 'Show advanced' }).click();
  await page.reload();

  await expect(page.getByLabel('Station jurisdiction', { exact: true })).toHaveValue('US');
  await expect(page.getByLabel('Theme')).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Imperial' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Hide advanced' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: /Length correction factor/ })).toBeVisible();
});

test('applies light, dark, and live system theme modes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByLabel('Theme').selectOption('system');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await page.getByLabel('Theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Theme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('maps a selected band to frequency and wavelength', async ({ page }) => {
  await page.locator('select.band-select').selectOption('20m');

  await expect(page.getByRole('spinbutton', { name: /Design frequency/ })).toHaveValue('14.175');
  await expect(page.locator('.band-indicator')).toContainText('20 m');
  await expect(page.locator('.band-indicator')).toContainText('21.149 m');
});

test('builds a guided multiband fan dipole and exposes Australian bands', async ({ page }) => {
  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('AU');
  await page.locator('select.band-select').selectOption('80m');
  await expect(page.getByRole('spinbutton', { name: /Design frequency/ })).toHaveValue('3.600');
  await expect(page.locator('.allocation-note')).toContainText('Radiocommunications (Amateur Stations) Class Licence 2023');

  await page.getByRole('button', { name: /Fan dipole/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('7.100');
  await page.getByLabel('Fan dipole wire pair 2 frequency').fill('14.200');
  await page.getByLabel('Fan dipole wire pair 3 frequency').fill('28.400');
  await expect(page.getByRole('heading', { name: 'Multiband fan dipole' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned parallel fan dipole/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Cut 3 equal wire pairs');
  await expect(page.locator('.result-summary')).toContainText('7.100 MHz · each leg');
  await expect(page.locator('.result-summary')).toContainText('28.400 MHz · each leg');
  await expect(page.locator('.caution-card')).toContainText('Every wire pair changes the shared feedpoint');
  await expect(page.getByText('Tune from highest frequency downward')).toBeHidden();
  await page.getByText('Build and tune a fan dipole').click();
  await expect(page.getByText('Tune from highest frequency downward')).toBeVisible();
  await page.getByRole('button', { name: 'Remove fan dipole wire pair 3' }).click();
  await expect(page.locator('.result-summary')).toContainText('Cut 2 equal wire pairs');
});

test('plans a balanced-line doublet without inventing a tuner-side impedance', async ({ page }) => {
  await page.getByRole('button', { name: /Doublet/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('3.600');
  await page.getByLabel('Balanced-line physical length').fill('12');
  await page.getByLabel('Doublet feedline check frequency').fill('14.200');
  await expect(page.getByRole('heading', { name: 'Balanced-line multiband doublet' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned balanced-line multiband doublet/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('20.272 m each');
  await expect(page.locator('.result-summary')).toContainText('0.598 λ · 215.4°');
  await expect(page.locator('.result-summary')).toContainText('Eighth-wave line adjustment');
  await expect(page.locator('.caution-card')).toContainText('A tuner match does not reveal system loss');
  await page.getByLabel('Tuner interface', { exact: true }).selectOption('external-balun');
  await expect(page.getByText(/Keep the coax between balun and tuner short/)).toBeVisible();
  await page.getByLabel('Help: Doublet tuner interface').click();
  await expect(page.getByRole('note').filter({ hasText: 'Doublet tuner interface' })).toContainText('correct transformation ratio and location depend on the actual impedances');
  await expect(page.getByText('Commission every intended band')).toBeHidden();
  await page.getByText('Plan and commission a multiband doublet').click();
  await expect(page.getByText('Commission every intended band')).toBeVisible();
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByLabel('Balanced-line physical length')).toHaveValue('39.37');
  await expect(page.locator('.result-summary')).toContainText('66 ft 6.125 in');
});

test('plans loaded dipoles and verticals with adjustable coil positions', async ({ page }) => {
  await page.getByRole('button', { name: /Loaded dipole/ }).click();
  await expect(page.getByRole('heading', { name: 'Inductively loaded dipole' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned centre-fed loaded dipole/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build two equal series loading coils');
  await expect(page.locator('.result-summary')).toContainText('Physical shortening');
  await expect(page.locator('.result-summary')).toContainText('µH each');
  await page.getByLabel('Help: Coil position from centre').click();
  await expect(page.getByRole('note').filter({ hasText: 'Coil position from centre' })).toContainText('requires greater reactance');
  await expect(page.getByText('Build two equal high-Q coils')).toBeHidden();
  await page.getByText('Build and tune a loaded dipole').click();
  await expect(page.getByText('Build two equal high-Q coils')).toBeVisible();
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Available total span' })).toHaveValue('24.606');
  await expect(page.getByRole('spinbutton', { name: 'Conductor outside diameter' })).toHaveValue('0.0787');

  await page.getByRole('button', { name: /Loaded vertical/ }).click();
  await expect(page.getByRole('heading', { name: 'Inductively loaded vertical' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned inductively loaded vertical/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build one base-loading coil');
  await page.getByRole('spinbutton', { name: 'Coil position from base' }).fill('5.741');
  await expect(page.locator('.result-summary')).toContainText('Build one series loading coil');
  await expect(page.locator('.caution-card').filter({ hasText: 'Inductance alone does not describe the finished coil' })).toBeVisible();
  await page.getByText('Build and tune a loaded vertical').click();
  await expect(page.getByText('Plan the RF return system')).toBeVisible();
});

test('designs two matched parallel-LC traps for a two-band dipole', async ({ page }) => {
  await page.getByRole('button', { name: /Trap dipole/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency', exact: true }).fill('10.100');
  await page.getByRole('spinbutton', { name: 'Upper design frequency' }).fill('14.050');
  await page.getByRole('spinbutton', { name: 'Available total span' }).fill('12.192');
  await page.getByRole('spinbutton', { name: 'Trap position from centre' }).fill('4.2672');
  await page.getByRole('spinbutton', { name: 'Installed wire height' }).fill('6.096');
  await page.getByRole('spinbutton', { name: 'Conductor outside diameter' }).fill('3.175');

  await expect(page.getByRole('heading', { name: 'Two-band parallel-LC trap dipole' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned two-band parallel-LC trap dipole/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build two matched parallel-LC traps');
  await expect(page.locator('.result-summary')).toContainText('2.93 µH ∥ 52.7 pF each');
  await expect(page.locator('.result-summary')).toContainText('12.811 MHz');
  await expect(page.locator('.result-summary')).toContainText('+j491 Ω');
  await expect(page.locator('.result-summary')).toContainText('−j1274 Ω');
  await expect(page.getByRole('heading', { name: 'Each trap coil: single-layer air-core geometry' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Single-layer air-core coil construction diagram/ })).toBeVisible();
  await expect(page.locator('.coil-turn-result')).toContainText('10 turns');
  await page.getByLabel('Help: Coil winding length').click();
  await expect(page.getByRole('note').filter({ hasText: 'Coil winding length' })).toContainText('at least 0.4 times the mean coil diameter');
  await page.getByRole('spinbutton', { name: 'Coil winding length' }).fill('20');
  await expect(page.getByRole('alert')).toContainText('at least 0.4 times the mean coil diameter');
  await page.getByRole('spinbutton', { name: 'Coil winding length' }).fill('75');
  await page.getByRole('spinbutton', { name: 'Insulated wire outside diameter' }).fill('10');
  await expect(page.locator('.coil-construction-results')).toContainText('Does not fit');
  await page.getByRole('spinbutton', { name: 'Insulated wire outside diameter' }).fill('2');
  await expect(page.getByRole('heading', { name: 'Commission and match the trap pair' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Measured trap resonance comparison/ })).toBeVisible();
  await expect(page.locator('.trap-result-table-wrap')).toContainText('Instrument-measured resonance');
  await expect(page.locator('.pair-state-within')).toHaveCount(4);
  await expect(page.getByText('Calibrate at the fixture plane')).toBeHidden();
  await page.getByText('Measure and commission two traps').click();
  await expect(page.getByText('Calibrate at the fixture plane')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Trap B measured inductance' }).fill('3.100');
  await page.getByRole('spinbutton', { name: 'Trap B measured capacitance' }).fill('55.50');
  await page.getByRole('spinbutton', { name: 'Trap B measured resonance' }).fill('12.200');
  await page.getByRole('spinbutton', { name: 'Pair-matching threshold' }).fill('1');
  await expect(page.locator('.pair-state-outside')).toHaveCount(4);
  await page.getByLabel('Help: Pair-matching threshold').click();
  await expect(page.getByRole('note').filter({ hasText: 'Pair-matching threshold' })).toContainText('workbench sorting threshold only');
  await expect(page.locator('.trap-commissioning-panel > .caution-card')).toContainText('Matched readings do not establish a safe trap');
  await page.getByLabel('Build or pair label').fill('Portable 30 m / 20 m trap pair');
  await page.getByLabel('Instrument and calibration').fill('VNA, fixture-plane calibration');
  await page.getByLabel('Fixture and lead arrangement').fill('Final enclosures with equal 50 mm leads');
  await page.getByRole('button', { name: 'Save record' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Measurement record saved on this device' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('radiobook:antenna-workshop:trap-commissioning-records:v1'))).toContain('Portable 30 m / 20 m trap pair');
  const trapRecordDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const trapRecordDownload = await trapRecordDownloadPromise;
  expect(trapRecordDownload.suggestedFilename()).toBe('portable-30-m-20-m-trap-pair.trap-record.json');
  const trapRecordPath = await trapRecordDownload.path();
  expect(trapRecordPath).toBeTruthy();
  await page.getByLabel('Import trap commissioning record JSON').setInputFiles(trapRecordPath!);
  await expect(page.getByRole('status').filter({ hasText: 'JSON record imported as a new local copy' })).toBeVisible();
  await expect(page.getByLabel('Saved trap commissioning records').locator('option')).toHaveCount(3);
  await page.evaluate(() => {
    (window as typeof window & { trapPrintCalls?: number }).trapPrintCalls = 0;
    window.print = () => { (window as typeof window & { trapPrintCalls?: number }).trapPrintCalls = 1; };
  });
  await page.getByRole('button', { name: 'Print worksheet' }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { trapPrintCalls?: number }).trapPrintCalls)).toBe(1);
  await page.getByLabel('Help: Upper design frequency').click();
  await expect(page.getByRole('note').filter({ hasText: 'Upper design frequency' })).toContainText('resonance lies between the two design frequencies');
  await expect(page.getByText('Build and measure a matched pair')).toBeHidden();
  await page.getByText('Build and tune a two-band trap dipole').click();
  await expect(page.getByText('Build and measure a matched pair')).toBeVisible();
  await expect(page.locator('.caution-card').filter({ hasText: 'Ideal L and C values are not a power rating' })).toBeVisible();

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Available total span' })).toHaveValue('40');
  await expect(page.getByRole('spinbutton', { name: 'Trap position from centre' })).toHaveValue('14');
  await expect(page.getByRole('spinbutton', { name: 'Installed wire height' })).toHaveValue('20');
  await expect(page.getByRole('spinbutton', { name: 'Conductor outside diameter' })).toHaveValue('0.125');
  await expect(page.getByRole('spinbutton', { name: 'Coil form outside diameter' })).toHaveValue('1.9685');
  await expect(page.getByRole('spinbutton', { name: 'Coil winding length' })).toHaveValue('2.9528');
  await expect(page.getByRole('spinbutton', { name: 'Insulated wire outside diameter' })).toHaveValue('0.0787');
});

test('plans a measured-inductance small transmitting loop without inferring performance', async ({ page }) => {
  await page.getByRole('button', { name: /Small loop/ }).click();

  await expect(page.getByRole('heading', { name: 'Small transmitting loop' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Lower tuning frequency' })).toHaveValue('14.000');
  await expect(page.getByRole('spinbutton', { name: 'Upper tuning frequency' })).toHaveValue('14.350');
  await expect(page.getByRole('img', { name: /Dimensioned circular small transmitting loop tuning plan/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Entered capacitor covers the ideal range');
  await expect(page.locator('.result-summary')).toContainText('39.2–41.7 pF');
  await expect(page.locator('.result-summary')).toContainText('Measured finished-loop inductance');
  await expect(page.locator('.small-loop-boundary')).toContainText('under 1/16 λ');
  await expect(page.getByRole('button', { name: 'Show advanced' })).toBeHidden();

  await expect(page.getByText('Measure the finished loop inductance')).toBeHidden();
  await page.getByText('Build and tune a small transmitting loop').click();
  await expect(page.getByText('Measure the finished loop inductance')).toBeVisible();
  await page.getByLabel('Help: Measured finished-loop inductance').click();
  await expect(page.getByRole('note').filter({ hasText: 'Measured finished-loop inductance' })).toContainText('complete main loop');

  await page.getByRole('spinbutton', { name: 'Variable-capacitor maximum' }).fill('40');
  await expect(page.locator('.result-summary')).toContainText('Revise the capacitor or tuning range');
  await page.getByRole('spinbutton', { name: 'Parallel fixed and stray capacitance' }).fill('50');
  await expect(page.locator('.result-summary')).toContainText('No positive variable-C solution');
  await page.getByRole('spinbutton', { name: 'Parallel fixed and stray capacitance' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Variable-capacitor maximum' }).fill('100');

  await page.locator('select.band-select').selectOption('40m');
  await expect(page.getByRole('spinbutton', { name: 'Lower tuning frequency' })).toHaveValue('7.000');
  await expect(page.getByRole('spinbutton', { name: 'Upper tuning frequency' })).toHaveValue('7.300');
  await expect(page.locator('.workflow-handoff')).toContainText('Range centre');
  await expect(page.locator('.caution-card').filter({ hasText: 'Resonance does not establish a safe transmitting system' })).toBeVisible();

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Main-loop circumference' })).toHaveValue('9.843');
  await expect(page.locator('.result-summary')).toContainText('3 ft 1.625 in');
  await expect(page.locator('.provenance-card')).toContainText('small-transmitting-loop-measured-inductance');
});

test('plans an equal-section phased wire collinear without inventing gain or matching', async ({ page }) => {
  await page.getByRole('button', { name: /Collinear/ }).click();

  await expect(page.getByRole('heading', { name: 'Phased wire collinear array' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Radiating half-wave sections' })).toHaveValue('4');
  await expect(page.getByRole('spinbutton', { name: 'Phasing-line velocity factor' })).toHaveValue('0.95');
  await expect(page.getByRole('img', { name: /Dimensioned half-wave phased wire collinear array/ })).toBeVisible();
  await expect(page.locator('.collinear-radiators line')).toHaveCount(4);
  await expect(page.locator('.collinear-stubs path')).toHaveCount(3);
  await expect(page.locator('.result-summary')).toContainText('Build 4 equal half-wave radiator sections');
  await expect(page.locator('.result-summary')).toContainText('10.279 m each');
  await expect(page.locator('.result-summary')).toContainText('41.116 m');
  await expect(page.locator('.visual-panel')).toContainText('QST reference · balanced voltage feed');
  await expect(page.locator('.result-summary')).toContainText('QST reference: over 1000 Ω');

  await expect(page.getByText('Establish the electrical half wave')).toBeHidden();
  await page.getByText('Build and commission a phased wire collinear').click();
  await expect(page.getByText('Establish the electrical half wave')).toBeVisible();
  await page.getByLabel('Help: Phasing-line velocity factor').click();
  await expect(page.getByRole('note').filter({ hasText: 'Phasing-line velocity factor' })).toContainText('actual two-conductor phasing line');

  await page.getByRole('spinbutton', { name: 'Radiating half-wave sections' }).fill('2');
  await expect(page.locator('.collinear-stubs path')).toHaveCount(1);
  await expect(page.locator('.result-summary')).toContainText('Build 2 equal half-wave radiator sections');
  await page.getByRole('spinbutton', { name: 'Phasing-line velocity factor' }).fill('0.8');
  await expect(page.locator('.result-summary')).toContainText('4.328 m');
  await page.getByRole('spinbutton', { name: 'Radiating half-wave sections' }).fill('3');
  await expect(page.locator('.result-summary')).toContainText('Balanced current feed');
  await expect(page.locator('.result-summary')).toContainText('QST reference: slightly over 300 Ω');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Length correction factor' })).toHaveValue('0.95');
  await expect(page.getByRole('spinbutton', { name: 'Extra length for trimming' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'Equal dimensions do not guarantee equal in-phase currents' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('half-wave-phased-wire-collinear');

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('33 ft 8.625 in each');
});

test('plans a two-element cubical quad without inventing directional performance', async ({ page }) => {
  await page.getByRole('button', { name: /Cubical quad/ }).click();

  await expect(page.getByRole('heading', { name: 'Two-element cubical quad' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Driven-to-reflector spacing' })).toHaveValue('0.2');
  await expect(page.getByLabel('Cubical quad polarization', { exact: true })).toHaveValue('horizontal');
  await expect(page.getByRole('img', { name: /Dimensioned two-element diamond cubical quad/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build one driven loop and one 5% larger reflector');
  await expect(page.locator('.result-summary')).toContainText('22.111 m + 23.217 m');
  await expect(page.locator('.result-summary')).toContainText('Driven-loop side5.528 m');
  await expect(page.locator('.result-summary')).toContainText('Driven-to-reflector boom spacing4.222 m');
  await expect(page.locator('.quad-feedpoint')).toContainText('horizontal feedpoint');
  await expect(page.locator('.quad-forward')).toContainText('Forward direction');

  await expect(page.getByText('Choose and model element spacing')).toBeHidden();
  await page.getByText('Build and commission a two-element cubical quad').click();
  await expect(page.getByText('Choose and model element spacing')).toBeVisible();
  await page.getByLabel('Help: Cubical quad polarization').click();
  await expect(page.getByRole('note').filter({ hasText: 'Cubical quad polarization' })).toContainText('bottom corner produces horizontal polarization');

  await page.getByRole('spinbutton', { name: 'Driven-to-reflector spacing' }).fill('0.25');
  await expect(page.locator('.result-summary')).toContainText('5.278 m');
  await page.getByLabel('Cubical quad polarization', { exact: true }).selectOption('vertical');
  await expect(page.locator('.quad-feedpoint')).toContainText('vertical feedpoint');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Extra loop length for trimming' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'Loop dimensions alone do not define the finished beam' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('arrl-two-element-cubical-quad');

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('18 ft 1.625 in');
});

test('plans an axial-mode helix and separates dimensions from classical estimates', async ({ page }) => {
  await page.getByRole('button', { name: /Axial helix/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('435');

  await expect(page.getByRole('heading', { name: 'Axial-mode helical antenna' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Turn circumference' })).toHaveValue('1');
  await expect(page.getByRole('spinbutton', { name: 'Pitch angle' })).toHaveValue('12.5');
  await expect(page.getByRole('spinbutton', { name: 'Number of turns' })).toHaveValue('6');
  await expect(page.getByRole('spinbutton', { name: 'Ground-plane diameter' })).toHaveValue('0.8');
  await expect(page.getByLabel('Helix winding and polarization', { exact: true })).toHaveValue('right');
  await expect(page.getByRole('img', { name: /Dimensioned axial-mode helical antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Wind 6 uniform axial-mode turns');
  await expect(page.locator('.result-summary')).toContainText('21.9 cm diameter');
  await expect(page.locator('.result-summary')).toContainText('Turn spacing15.3 cm · 0.222 λ');
  await expect(page.locator('.result-summary')).toContainText('Axial length91.7 cm');
  await expect(page.locator('.result-summary')).toContainText('Helix conductor with allowance4.341 m');
  await expect(page.locator('.result-summary')).toContainText('Classical half-power beamwidth estimate45.1°');
  await expect(page.locator('.result-summary')).toContainText('Classical gain estimate11.2 dBi');
  await expect(page.locator('.helix-polarization')).toContainText('Right-handed winding · RHCP');
  await expect(page.getByRole('complementary', { name: 'Helix design advisories' })).toHaveCount(0);

  await expect(page.getByText('Choose polarization before winding')).toBeHidden();
  await page.getByText('Build and commission an axial-mode helix').click();
  await expect(page.getByText('Choose polarization before winding')).toBeVisible();
  await page.getByLabel('Help: Helix winding and polarization').click();
  await expect(page.getByRole('note').filter({ hasText: 'Helix winding and polarization' })).toContainText('dish reverses the circular-polarization sense');

  await page.getByRole('spinbutton', { name: 'Number of turns' }).fill('8');
  await expect(page.locator('.result-summary')).toContainText('Wind 8 uniform axial-mode turns');
  await page.getByRole('spinbutton', { name: 'Turn circumference' }).fill('0.8');
  await expect(page.getByRole('complementary', { name: 'Helix design advisories' })).toContainText('outside the narrower 0.9–1.1 λ starting region');
  await page.getByLabel('Helix winding and polarization', { exact: true }).selectOption('left');
  await expect(page.locator('.helix-polarization')).toContainText('Left-handed winding · LHCP');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Extra helix conductor for connections' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'A one-wavelength turn is not a completed 50-ohm antenna' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('nasa-axial-mode-helix');

  await page.getByRole('spinbutton', { name: 'Turn circumference' }).fill('1');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('0 ft 8.625 in diameter');
});

test('plans a radial discone without inventing an upper usable frequency', async ({ page }) => {
  await page.getByRole('button', { name: /Discone/ }).click();
  await page.locator('select.band-select').selectOption('2m');
  await expect(page.getByRole('spinbutton', { name: 'Lowest design frequency' })).toHaveValue('144.0');

  await expect(page.getByRole('heading', { name: 'Broadband discone antenna' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Cone half-angle' })).toHaveValue('30');
  await expect(page.getByRole('spinbutton', { name: 'Cone radial elements' })).toHaveValue('8');
  await expect(page.getByRole('spinbutton', { name: 'Disc radial elements' })).toHaveValue('8');
  await expect(page.getByRole('img', { name: /Dimensioned radial-element discone antenna/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build 8 disc and 8 cone radials');
  await expect(page.locator('.result-summary')).toContainText('52.2 cm cone slant');
  await expect(page.locator('.result-summary')).toContainText('Cone vertical height45.2 cm');
  await expect(page.locator('.result-summary')).toContainText('Disc diameter35.4 cm');
  await expect(page.locator('.result-summary')).toContainText('Total radial wire5.731 m');
  await expect(page.locator('.result-summary')).toContainText('Upper-frequency limitNot inferred · measure the finished antenna');
  await expect(page.getByRole('complementary', { name: 'Discone design advisories' })).toHaveCount(0);

  await expect(page.getByText('Keep the feed region compact')).toBeHidden();
  await page.getByText('Build and commission a radial discone').click();
  await expect(page.getByText('Keep the feed region compact')).toBeVisible();
  await page.getByLabel('Help: Cone half-angle').click();
  await expect(page.getByRole('note').filter({ hasText: 'Cone half-angle' })).toContainText('60° included cone');

  await page.getByRole('spinbutton', { name: 'Cone half-angle' }).fill('35');
  await expect(page.locator('.result-summary')).toContainText('Cone included angle70°');
  await page.getByRole('spinbutton', { name: 'Disc radial elements' }).fill('4');
  await expect(page.getByRole('complementary', { name: 'Discone design advisories' })).toContainText('sparse radial approximation');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Extra radial length for connections' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'Broadband geometry does not establish broadband performance' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('ntia-nasa-discone');

  await page.getByRole('spinbutton', { name: 'Cone half-angle' }).fill('30');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('1 ft 8.5 in cone slant');
});

test('plans a log-periodic element schedule without predicting finished performance', async ({ page }) => {
  await page.getByRole('button', { name: /Log-periodic/ }).click();
  await page.locator('select.band-select').selectOption('2m');
  await expect(page.getByRole('spinbutton', { name: 'Lower operating frequency' })).toHaveValue('144.0');
  await expect(page.getByRole('spinbutton', { name: 'Upper operating frequency' })).toHaveValue('148.0');

  await expect(page.getByRole('heading', { name: 'Log-periodic dipole array' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Tau length scale' })).toHaveValue('0.92');
  await expect(page.getByRole('spinbutton', { name: 'Sigma spacing factor' })).toHaveValue('0.12');
  await expect(page.getByRole('img', { name: /Dimensioned log-periodic dipole array/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build and alternately connect 6 scaled dipoles');
  await expect(page.locator('.result-summary')).toContainText('1.065 m element-centre span');
  await expect(page.locator('.result-summary')).toContainText('Included apex angle18.9°');
  await expect(page.locator('.result-summary')).toContainText('Smallest-element half-wave reference218.486 MHz');
  await expect(page.locator('.result-summary')).toContainText('Predicted impedance, gain, and SWRNot inferred · model and measure');
  await expect(page.getByRole('table')).toContainText('A-left / B-right');
  await expect(page.getByRole('table')).toContainText('B-left / A-right');
  await expect(page.getByRole('row', { name: /1 1.067 m 53.3 cm 25.0 cm 0.0 cm 144.000 MHz A-left/ })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Log-periodic design advisories' })).toHaveCount(0);

  await page.getByRole('spinbutton', { name: 'Upper operating frequency' }).fill('450');
  await expect(page.locator('select.band-select')).toHaveValue('custom');
  await page.locator('select.band-select').selectOption('2m');

  await expect(page.getByText('Alternate the balanced connections')).toBeHidden();
  await page.getByText('Build and commission a log-periodic dipole array').click();
  await expect(page.getByText('Alternate the balanced connections')).toBeVisible();
  await page.getByLabel('Help: Sigma spacing factor').click();
  await expect(page.getByRole('note').filter({ hasText: 'Sigma spacing factor' })).toContainText('centre spacing to the next smaller dipole');

  await page.getByRole('spinbutton', { name: 'Sigma spacing factor' }).fill('0.04');
  await expect(page.getByRole('complementary', { name: 'Log-periodic design advisories' })).toContainText('below σ = 0.05');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Active-region bandwidth factor' })).toHaveValue('1.46');
  await expect(page.getByRole('spinbutton', { name: 'Extra element length for trimming' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'A scaled element schedule is not a finished wideband feed system' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('carrel-log-periodic-geometry');

  await page.getByRole('spinbutton', { name: 'Sigma spacing factor' }).fill('0.12');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('3 ft 5.875 in element-centre span');
});

test('plans a receive-only Beverage route with explicit direction and impedance assumptions', async ({ page }) => {
  await page.getByRole('button', { name: /Beverage/ }).click();
  await page.locator('select.band-select').selectOption('160m');
  await expect(page.getByRole('spinbutton', { name: 'Receive reference frequency' })).toHaveValue('1.900');

  await expect(page.getByRole('heading', { name: 'Beverage receiving antenna' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Horizontal wire length' })).toHaveValue('1');
  await expect(page.getByRole('spinbutton', { name: 'Wire height above ground' })).toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'Target bearing from feed' })).toHaveValue('45');
  await expect(page.getByLabel('Beverage far-end configuration', { exact: true })).toHaveValue('terminated');
  await expect(page.getByRole('img', { name: /Beverage receiving-antenna route and elevation/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Survey a terminated one-way receive route');
  await expect(page.locator('.result-summary')).toContainText('157.786 m horizontal endpoint distance');
  await expect(page.locator('.result-summary')).toContainText('Horizontal wire to cut161.730 m');
  await expect(page.locator('.result-summary')).toContainText('Target axis from feed45° NE');
  await expect(page.locator('.result-summary')).toContainText('111.571 m east');
  await expect(page.locator('.result-summary')).toContainText('111.571 m north');
  await expect(page.locator('.result-summary')).toContainText('Nominal transformer turns ratio3.00 : 1');
  await expect(page.locator('.result-summary')).toContainText('Predicted gain, pattern, and front-to-back ratioNot inferred · measure the installed antenna');
  await expect(page.getByRole('complementary', { name: 'Beverage design advisories' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue to feedline and exposure' })).toHaveCount(0);

  await expect(page.getByText('Build stable ground returns')).toBeHidden();
  await page.getByText('Plan and commission a Beverage receiving antenna').click();
  await expect(page.getByText('Build stable ground returns')).toBeVisible();
  await page.getByLabel('Help: Target bearing from feed').click();
  await expect(page.getByRole('note').filter({ hasText: 'Target bearing from feed' })).toContainText('clockwise from geographic north');

  await page.getByRole('spinbutton', { name: 'Target bearing from feed' }).fill('225');
  await expect(page.locator('.result-summary')).toContainText('225° SW');
  await expect(page.locator('.result-summary')).toContainText('111.571 m west');
  await expect(page.locator('.result-summary')).toContainText('111.571 m south');
  await page.getByLabel('Beverage far-end configuration', { exact: true }).selectOption('unterminated');
  await expect(page.getByRole('spinbutton', { name: 'Far-end termination resistance' })).toHaveCount(0);
  await expect(page.locator('.result-summary')).toContainText('225° SW and 45° NE');
  await expect(page.getByRole('complementary', { name: 'Beverage design advisories' })).toContainText('bidirectional tendency');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Assumed antenna-side impedance' })).toHaveValue('450');
  await expect(page.getByRole('spinbutton', { name: 'Receiver feedline impedance' })).toHaveValue('50');
  await expect(page.getByRole('spinbutton', { name: 'Extra horizontal wire for routing' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'A low, long wire is both an RF circuit and a site hazard' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('beverage-wave-antenna-planner');

  await page.getByRole('spinbutton', { name: 'Target bearing from feed' }).fill('45');
  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.locator('.result-summary')).toContainText('517 ft 8 in horizontal endpoint distance');
});

test('plans Flag, point-fed Pennant, and EWE receive antennas with the correct direction convention', async ({ page }) => {
  await page.getByRole('button', { name: /Flag · Pennant · EWE/ }).click();
  await page.locator('select.band-select').selectOption('160m');

  await expect(page.getByRole('heading', { name: 'Compact terminated receiving antenna' })).toBeVisible();
  await expect(page.getByLabel('Compact receive antenna geometry', { exact: true })).toHaveValue('flag');
  await expect(page.getByRole('spinbutton', { name: 'Horizontal span' })).toHaveValue('8.84');
  await expect(page.getByRole('spinbutton', { name: 'Vertical height' })).toHaveValue('4.27');
  await expect(page.getByRole('spinbutton', { name: 'Receive bearing toward feed end' })).toHaveValue('45');
  await expect(page.getByRole('img', { name: /Flag receiving-antenna geometry and direction/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build a receive-only Flag');
  await expect(page.locator('.result-summary')).toContainText('Primary response toward feed45° NE');
  await expect(page.locator('.result-summary')).toContainText('Principal null toward termination225° SW');
  await expect(page.locator('.result-summary')).toContainText('Predicted gain, null depth, and front-to-back ratioNot inferred');
  await expect(page.getByRole('button', { name: 'Continue to feedline and exposure' })).toHaveCount(0);

  await page.getByLabel('Compact receive antenna geometry', { exact: true }).selectOption('pennant');
  await expect(page.getByRole('img', { name: /point-fed Pennant receiving-antenna geometry and direction/ })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Termination resistance' })).toHaveValue('860');
  await expect(page.locator('.result-summary')).toContainText('Build a receive-only Point-fed Pennant');

  await page.getByLabel('Compact receive antenna geometry', { exact: true }).selectOption('ewe');
  await expect(page.getByRole('spinbutton', { name: 'Bottom wire clearance' })).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: 'Horizontal span' })).toHaveValue('7.62');
  await expect(page.getByRole('spinbutton', { name: 'Vertical height' })).toHaveValue('3.048');
  await expect(page.getByRole('spinbutton', { name: 'Termination resistance' })).toHaveValue('850');
  await expect(page.getByRole('img', { name: /EWE receiving-antenna geometry and direction/ })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Compact receive design advisories' })).toContainText('depends on two ground returns');

  await expect(page.getByText('Aim the feed end toward the target')).toBeHidden();
  await page.getByText('Build and commission a compact directional receiving antenna').click();
  await expect(page.getByText('Aim the feed end toward the target')).toBeVisible();
  await page.getByLabel('Help: Receive bearing toward feed end').click();
  await expect(page.getByRole('note').filter({ hasText: 'Receive bearing toward feed end' })).toContainText('opposite end-direction convention from a terminated Beverage');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Assumed antenna-side impedance' })).toHaveValue('450');
  await expect(page.getByRole('spinbutton', { name: 'Receiver feedline impedance' })).toHaveValue('50');
  await expect(page.getByRole('spinbutton', { name: 'Extra wire for connections and trimming' })).toHaveValue('2.5');
  await expect(page.locator('.caution-card').filter({ hasText: 'A compact loop is still a complete outdoor RF system' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('compact-terminated-receive-planner');
});

test('maps four K9AY receive directions to crossed-loop switching states', async ({ page }) => {
  await page.getByRole('button', { name: /K9AY loops/ }).click();
  await page.locator('select.band-select').selectOption('160m');

  await expect(page.getByRole('heading', { name: 'K9AY four-direction receiving loops' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Apex height' })).toHaveValue('7.62');
  await expect(page.getByRole('spinbutton', { name: 'Loop half-width' })).toHaveValue('4.572');
  await expect(page.getByRole('spinbutton', { name: 'Lower corner height' })).toHaveValue('1.524');
  await expect(page.getByRole('spinbutton', { name: 'Loop 1 reference receive bearing' })).toHaveValue('45');
  await expect(page.getByLabel('Selected K9AY receive direction', { exact: true })).toHaveValue('0');
  await expect(page.getByRole('img', { name: /K9AY crossed-loop geometry and four-direction switching/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Build two crossed, switchable K9AY loops');
  await expect(page.locator('.result-summary')).toContainText('9.144 m diameter footprint');
  await expect(page.locator('.result-summary')).toContainText('Selected receive direction45° NE');
  await expect(page.locator('.result-summary')).toContainText('Selected switching stateLoop 1 · reference connections');
  await expect(page.locator('.result-summary')).toContainText('Nominal transformer turns ratio3.00 : 1');
  await expect(page.getByRole('button', { name: 'Continue to feedline and exposure' })).toHaveCount(0);

  await page.getByLabel('Selected K9AY receive direction', { exact: true }).selectOption('3');
  await expect(page.locator('.result-summary')).toContainText('Selected receive direction315° NW');
  await expect(page.locator('.result-summary')).toContainText('Selected switching stateLoop 2 · feed/termination reversed');
  await expect(page.locator('.result-summary')).toContainText('Termination and principal-null direction135° SE');

  await expect(page.getByText('Map the relay states before installation')).toBeHidden();
  await page.getByText('Build and commission four-direction K9AY loops').click();
  await expect(page.getByText('Map the relay states before installation')).toBeVisible();
  await page.getByLabel('Help: Selected K9AY receive direction').click();
  await expect(page.getByRole('note').filter({ hasText: 'Selected K9AY receive direction' })).toContainText('continuity tests with power removed');

  await page.getByRole('button', { name: 'Show advanced' }).click();
  await expect(page.getByRole('spinbutton', { name: 'K9AY assumed antenna-side impedance' })).toHaveValue('450');
  await expect(page.getByRole('spinbutton', { name: 'K9AY receiver feedline impedance' })).toHaveValue('50');
  await expect(page.getByRole('spinbutton', { name: 'K9AY extra wire for corners and pigtails' })).toHaveValue('4.14');
  await expect(page.locator('.caution-card').filter({ hasText: 'Four directions require four verified circuit states' })).toBeVisible();
  await expect(page.locator('.provenance-card')).toContainText('k9ay-four-direction-loop-planner');
});

test('switches among graphical antenna designs and updates construction results', async ({ page }) => {
  await expect(page.getByText('Plan the installed span')).toBeHidden();
  await page.getByText('Build and tune a centre-fed dipole').click();
  await expect(page.getByText('Plan the installed span')).toBeVisible();

  await page.getByRole('button', { name: /Inverted-V/ }).click();
  await expect(page.getByRole('heading', { name: 'Inverted-V dipole' })).toBeVisible();
  await expect(page.getByLabel('Included apex angle', { exact: true })).toHaveValue('120');
  await expect(page.getByRole('img', { name: /Dimensioned inverted-V/ })).toBeVisible();
  await expect(page.getByText('Keep both legs symmetrical')).toBeHidden();
  await page.getByText('Build and tune an inverted-V').click();
  await expect(page.getByText('Keep both legs symmetrical')).toBeVisible();
  await page.getByLabel('Help: Included apex angle').click();
  await expect(page.getByRole('note').filter({ hasText: 'Included apex angle' })).toContainText('angle between the two wire legs');

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
  await expect(page.getByLabel('Conductor diameter', { exact: true })).toHaveValue('2.05');
  await expect(page.getByRole('img', { name: /Dimensioned Moxon rectangle/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Critical tip gap');
  await expect(page.getByText('Hold both critical gaps', { exact: true })).toBeHidden();
  await page.getByText('Build and verify a Moxon rectangle').click();
  await expect(page.getByText('Hold both critical gaps', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Conductor diameter').click();
  await expect(page.getByRole('note').filter({ hasText: 'Conductor diameter' })).toContainText('Cebik regression');
  await expect(page.getByRole('button', { name: /advanced/ })).toHaveCount(0);

  await page.getByRole('button', { name: /Basic Yagi/ }).click();
  await page.getByRole('spinbutton', { name: 'Design frequency' }).fill('146.000');
  await expect(page.getByRole('heading', { name: 'Three-element Yagi' })).toBeVisible();
  await expect(page.getByText('NBS reference geometry', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /Dimensioned three-element Yagi/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Reference element diameter');
  await expect(page.getByText('Scale every dimension together', { exact: true })).toBeHidden();
  await page.getByText('Build and verify the NBS Yagi').click();
  await expect(page.getByText('Scale every dimension together', { exact: true })).toBeVisible();
  await page.getByLabel('Help: NBS Yagi reference geometry').click();
  await expect(page.getByRole('note').filter({ hasText: 'NBS Yagi reference geometry' })).toContainText('complete measured reference system');
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
  await page.getByLabel('Loop shape', { exact: true }).selectOption('circle');
  await expect(page.getByRole('img', { name: /Dimensioned full-wave circle loop/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('Diameter');
  await expect(page.getByText('Choose the installed plane')).toBeHidden();
  await page.getByText('Build and tune a full-wave loop').click();
  await expect(page.getByText('Choose the installed plane')).toBeVisible();
  await page.getByLabel('Help: Loop shape').click();
  await expect(page.getByRole('note').filter({ hasText: 'Loop shape' })).toContainText('one perimeter');
});

test('calculates feedline loss and preserves physical values across unit changes', async ({ page }) => {
  await page.getByRole('button', { name: /Feedline & matching/ }).click();
  await expect(page.getByRole('heading', { name: 'Feedline power budget' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Feedline power-flow diagram' })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('63.10 W');
  await expect(page.locator('.result-summary')).toContainText('1.80 dB');
  await expect(page.getByText('Measure at the antenna reference plane', { exact: true })).toBeHidden();
  await page.getByText('Plan and verify a feedline budget').click();
  await expect(page.getByText('Measure at the antenna reference plane', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Published matched cable loss').click();
  await expect(page.getByRole('note').filter({ hasText: 'Published matched cable loss' })).toContainText('matched-line attenuation');
  await page.getByLabel('Help: SWR at the antenna').click();
  await expect(page.getByRole('note').filter({ hasText: 'SWR at the antenna' })).toContainText('transmitter-end SWR');

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(page.getByLabel('Cable length')).toHaveValue('98.425');
  await expect(page.getByLabel('Published matched cable loss', { exact: true })).toHaveValue('1.829');
  await expect(page.locator('.result-summary')).toContainText('63.10 W');

  await page.getByRole('button', { name: /Coaxial stub/ }).click();
  await expect(page.getByRole('heading', { name: 'Coaxial stub length' })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Operating frequency' }).fill('14.100');
  await expect(page.getByLabel('Velocity factor', { exact: true })).toHaveValue('0.66');
  await expect(page.getByLabel('Electrical length', { exact: true })).toHaveValue('0.25');
  await expect(page.getByLabel('Far-end termination', { exact: true })).toHaveValue('short');
  await expect(page.getByRole('img', { name: /Dimensioned coaxial stub/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('12 ft 1 in');
  await expect(page.locator('.result-summary')).toContainText('High impedance');
  await expect(page.getByText('Build the final termination', { exact: true })).toBeHidden();
  await page.getByText('Build and verify a coaxial stub').click();
  await expect(page.getByText('Build the final termination', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Velocity factor').click();
  await expect(page.getByRole('note').filter({ hasText: 'Velocity factor' })).toContainText('specific cable construction');
  await page.getByLabel('Help: Electrical length').click();
  await expect(page.getByLabel('Help: Electrical length').locator('..').getByRole('note')).toContainText('quarter-wave line');

  await page.getByLabel('Far-end termination', { exact: true }).selectOption('open');
  await expect(page.locator('.result-summary')).toContainText('Low impedance');

  await page.getByRole('button', { name: /ERP \/ EIRP/ }).click();
  await expect(page.getByRole('heading', { name: 'ERP and EIRP' })).toBeVisible();
  await expect(page.getByText('Confirm the gain reference', { exact: true })).toBeHidden();
  await page.getByText('Calculate and document ERP / EIRP').click();
  await expect(page.getByText('Confirm the gain reference', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Total feed-system loss').click();
  await expect(page.getByRole('note').filter({ hasText: 'Total feed-system loss' })).toContainText('transmitter-power reference plane');
  await page.getByLabel('Help: Gain reference').click();
  await expect(page.getByRole('note').filter({ hasText: 'Gain reference' })).toContainText('2.15 dB greater');
  await page.getByLabel('Transmitter power', { exact: true }).fill('100');
  await page.getByLabel('Total feed-system loss', { exact: true }).fill('2');
  await page.getByLabel('Antenna gain', { exact: true }).fill('6');
  await expect(page.getByLabel('Gain reference', { exact: true })).toHaveValue('dBi');
  await expect(page.getByRole('img', { name: /ERP and EIRP antenna-system diagram/ })).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('251.19 W');
  await expect(page.locator('.result-summary')).toContainText('153.11 W');

  await page.getByLabel('Gain reference', { exact: true }).selectOption('dBd');
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

  await page.getByLabel('Help: Exposure duty cycle').click();
  await expect(page.getByLabel('Help: Exposure duty cycle').locator('..').getByRole('note')).toContainText('not applied to the displayed ERP or EIRP');
  await page.getByLabel('Transmitter power', { exact: true }).fill('75');
  await page.getByLabel('Total feed-system loss', { exact: true }).fill('2');
  await page.getByLabel('Antenna gain', { exact: true }).fill('3');
  await page.getByLabel('Exposure duty cycle', { exact: true }).fill('25');
  await page.getByLabel('Installed antenna centre height', { exact: true }).fill('11');
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

  await expect(page.locator('.update-banner')).toContainText('A new version is ready');
  await page.getByRole('button', { name: 'Later' }).click();
  await expect(page.locator('.update-banner')).toHaveCount(0);
});

test('shows official RF exposure reference limits without a compliance result', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await expect(page.getByRole('heading', { name: 'Official reference limits' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('do not by themselves determine compliance');
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('146.000');
  await expect(page.locator('.result-summary')).toContainText('1.291 W/m²');
  await expect(page.locator('.result-summary')).toContainText('6.00 min');
  await expect(page.getByRole('img', { name: /RF exposure power-density reference levels/ })).toBeVisible();
  await expect(page.getByText('Separate the limit from the assessment', { exact: true })).toBeHidden();
  await page.getByText('Choose an exposure reference level').click();
  await expect(page.getByText('Separate the limit from the assessment', { exact: true })).toBeVisible();
  await page.getByLabel('Help: Exposure environment').click();
  await expect(page.getByRole('note').filter({ hasText: 'Exposure environment' })).toContainText('controlled-environment conditions are not met');

  await page.getByLabel('Exposure environment', { exact: true }).selectOption('controlled');
  await expect(page.locator('.result-summary')).toContainText('7.800 W/m²');

  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('7.100');
  await expect(page.getByRole('alert')).toContainText('not applicable');
  await expect(page.locator('.result-summary')).toHaveCount(0);

  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('US');
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
  await expect(stationScreen.getByText('Check far-field applicability', { exact: true })).toBeHidden();
  await stationScreen.getByText('Run a conservative single-source screen').click();
  await expect(stationScreen.getByText('Check far-field applicability', { exact: true })).toBeVisible();
  await stationScreen.getByLabel('Help: Transmit duty cycle').click();
  await expect(stationScreen.getByRole('note').filter({ hasText: 'Transmit duty cycle' })).toContainText('regulatory averaging period');
  await stationScreen.getByLabel('Help: Transmit duty cycle').click();
  await stationScreen.getByLabel('Help: Largest antenna dimension').click();
  await expect(stationScreen.getByRole('note').filter({ hasText: 'Largest antenna dimension' })).toContainText('2D²/λ');
  await stationScreen.getByLabel('Help: Largest antenna dimension').click();

  await page.getByRole('spinbutton', { name: 'Largest antenna dimension', exact: true }).fill('1');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Screening is inconclusive');

  await page.getByLabel('Other RF sources', { exact: true }).selectOption('assessed');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Below the preliminary screening trigger');
  await expect(stationScreen.locator('.screen-result-card')).toContainText('50.0 W');
  await expect(page.getByRole('img', { name: /Far-field exposure screening geometry/ })).toBeVisible();

  await page.getByRole('spinbutton', { name: 'Straight-line separation' }).fill('2');
  await expect(stationScreen.locator('.screen-outcome')).toContainText('Further analysis is required');
  await expect(stationScreen.locator('.screen-limitations')).toContainText('does not mean safe, compliant, certified, or exempt');
});

test('evaluates the three FCC single-source exemption paths without implying compliance', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /FCC single/ }).click();
  const exemption = page.locator('.fcc-exemption-section');
  await expect(exemption.getByRole('heading', { name: 'FCC single-source exemption' })).toBeVisible();
  await expect(exemption.locator('.screen-outcome')).toContainText('FCC exemption is not evaluated');

  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('US');
  await expect(exemption.locator('.screen-outcome')).toContainText('Exempt from routine environmental evaluation');
  await expect(exemption.getByRole('img', { name: /FCC single-source exemption criterion comparison/ })).toBeVisible();
  await expect(exemption.locator('.fcc-criterion-card').filter({ hasText: 'Distance-based ERP criterion' })).toContainText('Qualifies');
  await expect(exemption.locator('.screen-limitations')).toContainText('not an exemption from RF exposure limits');

  await exemption.getByLabel('Help: Maximum time-averaged ERP').click();
  await expect(exemption.getByRole('note').filter({ hasText: 'Maximum time-averaged ERP' })).toContainText('Do not enter EIRP');
  await exemption.getByLabel('Help: Maximum time-averaged ERP').click();

  await exemption.getByLabel('Minimum body separation', { exact: true }).fill('1');
  await expect(exemption.locator('.screen-outcome')).toContainText('Routine environmental evaluation is required');

  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('1000');
  await exemption.getByLabel('Available maximum time-averaged power', { exact: true }).fill('0.5');
  await exemption.getByLabel('Maximum time-averaged ERP', { exact: true }).fill('0.7');
  await exemption.getByLabel('Minimum body separation', { exact: true }).fill('0.1');
  await expect(exemption.locator('.screen-outcome')).toContainText('0.5–40 cm close-proximity criterion is satisfied');

  await exemption.getByLabel('Available maximum time-averaged power', { exact: true }).fill('0.001');
  await exemption.getByLabel('Maximum time-averaged ERP', { exact: true }).fill('1000');
  await expect(exemption.locator('.screen-outcome')).toContainText('One-milliwatt criterion is satisfied');
});

test('combines FCC multiple-source exemption fractions and special low-power conditions', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /FCC multiple/ }).click();
  const multiple = page.locator('.fcc-multiple-section');
  await expect(multiple.getByRole('heading', { name: 'FCC multiple-source exemption', exact: true })).toBeVisible();
  await expect(multiple.locator('.screen-outcome')).toContainText('FCC multiple-source exemption is not evaluated');

  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('US');
  await expect(multiple.locator('.screen-outcome')).toContainText('Collective-source conditions are not confirmed');
  await multiple.getByRole('checkbox', { name: /Collective source set complete/ }).check();
  await multiple.getByRole('checkbox', { name: /Fixed positional relationship/ }).check();
  await multiple.getByRole('checkbox', { name: /Same time-averaging basis/ }).check();
  await expect(multiple.locator('.screen-outcome')).toContainText('Collective sources are exempt from routine evaluation');
  await expect(multiple.getByRole('img', { name: /FCC multiple-source exemption fractions/ })).toBeVisible();
  await expect(multiple.locator('.fcc-contribution-grid .fcc-criterion-card')).toHaveCount(2);
  await expect(multiple.locator('.screen-limitations')).toContainText('not a compliance determination');

  const sourceFields = multiple.locator('fieldset.fcc-multiple-source');
  await sourceFields.nth(0).getByLabel('Contribution method').selectOption('evaluated');
  await sourceFields.nth(1).getByLabel('Contribution method').selectOption('evaluated');
  await sourceFields.nth(0).getByRole('spinbutton', { name: 'Source 1 evaluated exposure' }).fill('0.6');
  await sourceFields.nth(0).getByRole('spinbutton', { name: 'Source 1 applicable exposure limit' }).fill('1');
  await sourceFields.nth(1).getByRole('spinbutton', { name: 'Source 2 evaluated exposure' }).fill('0.5');
  await sourceFields.nth(1).getByRole('spinbutton', { name: 'Source 2 applicable exposure limit' }).fill('1');
  await expect(multiple.locator('.screen-outcome')).toContainText('Routine environmental evaluation is required');

  await sourceFields.nth(0).getByLabel('Contribution method').selectOption('close-proximity');
  await expect(multiple.locator('.screen-outcome')).toContainText('selected contribution method is inapplicable');

  await sourceFields.nth(0).getByRole('spinbutton', { name: 'Source 1 available maximum time-averaged power' }).fill('0.0006');
  await sourceFields.nth(1).getByRole('spinbutton', { name: 'Source 2 available maximum time-averaged power' }).fill('0.0006');
  await multiple.getByLabel('Minimum inter-source separation', { exact: true }).fill('2');
  await expect(multiple.locator('.screen-outcome')).toContainText('special multiple-source 1 mW path is satisfied');

  await multiple.getByRole('button', { name: 'Add RF source' }).click();
  await expect(multiple.locator('fieldset.fcc-multiple-source')).toHaveCount(3);
  await multiple.getByRole('button', { name: 'Remove source 3' }).click();
  await expect(multiple.locator('fieldset.fcc-multiple-source')).toHaveCount(2);
});

test('applies the Ofcom assessment and distance workflows for United Kingdom stations', async ({ page }) => {
  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('GB');
  await expect(page.getByText('Jurisdiction: United Kingdom')).toBeVisible();
  await page.getByRole('button', { name: /RF exposure/ }).click();

  await expect(page.getByRole('button', { name: /Ofcom gateway/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /FCC single/ })).toHaveCount(0);
  const panel = page.locator('.ofcom-assessment-section');
  await expect(panel.getByRole('heading', { name: 'Ofcom EMF assessment requirement' })).toBeVisible();
  await expect(panel.locator('.screen-outcome')).toContainText('retain the average-power record');
  await expect(panel.getByRole('img', { name: /Ofcom assessment gateway/ })).toContainText('8.33 W');

  await panel.getByRole('spinbutton', { name: 'Maximum radiated power' }).fill('101');
  await panel.getByRole('spinbutton', { name: 'Maximum transmission time in any six minutes' }).fill('1');
  await expect(panel.locator('.screen-outcome')).toContainText('An EMF assessment and record are required');

  await panel.getByLabel('Radiated-power basis', { exact: true }).selectOption('ERP');
  await panel.getByRole('spinbutton', { name: 'Maximum radiated power' }).fill('61');
  await panel.getByRole('spinbutton', { name: 'Maximum transmission time in any six minutes' }).fill('36');
  await expect(panel.locator('.screen-outcome')).toContainText('retain the average-power record');

  await panel.getByRole('checkbox', { name: /Equipment is currently used/ }).uncheck();
  await expect(panel.locator('.screen-outcome')).toContainText('No EMF assessment or record is required');

  await page.getByRole('button', { name: /Compliance distance/ }).click();
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('450');
  const distance = page.locator('.ofcom-distance-section');
  await expect(distance.getByRole('heading', { name: 'Ofcom compliance distance' })).toBeVisible();
  await expect(distance.locator('.result-summary')).toContainText('2.46 m');
  await expect(distance.getByRole('img', { name: /Ofcom compliance-distance geometry/ })).toBeVisible();
  await expect(distance.locator('.screen-outcome')).toContainText('Maintain the calculated distance');

  await distance.getByRole('spinbutton', { name: 'Largest antenna dimension' }).fill('1');
  await expect(distance.locator('.screen-outcome')).toContainText('material limitation');
  await expect(distance.locator('.screen-limitations').first()).toContainText('half a wavelength');
  await distance.getByRole('checkbox', { name: /highly reflective surface/ }).check();
  await expect(distance.locator('.screen-limitations').first()).toContainText('seawater or metal');

  await distance.getByRole('spinbutton', { name: 'Maximum radiated power' }).fill('100');
  await distance.getByRole('spinbutton', { name: 'Maximum transmission time in any six minutes' }).fill('36');
  await expect(distance.locator('.screen-outcome')).toContainText('No further assessment is required');

  await page.getByRole('button', { name: /Multiple transmitters/ }).click();
  const multiple = page.locator('.ofcom-multiple-distance-section');
  await expect(multiple.getByRole('heading', { name: 'Ofcom multiple-transmitter distance' })).toBeVisible();
  await expect(multiple.locator('.ofcom-multiple-summary')).toContainText('200.00 W EIRP');
  await expect(multiple.locator('.ofcom-multiple-summary')).toContainText('120 s');
  await expect(multiple.locator('.ofcom-multiple-summary')).toContainText('2.46 m');
  await expect(multiple.locator('.ofcom-frequency-results article')).toHaveCount(2);
  await expect(multiple.locator('.screen-outcome')).toContainText('450 MHz governs');

  await multiple.getByRole('spinbutton', { name: 'Transmitter 1 maximum time in six minutes' }).fill('240');
  await multiple.getByRole('spinbutton', { name: 'Transmitter 2 maximum time in six minutes' }).fill('240');
  await expect(multiple.locator('.ofcom-multiple-summary')).toContainText('480 s summed; capped at six minutes');
  await multiple.getByRole('spinbutton', { name: 'Transmitter 1 largest antenna dimension' }).fill('1');
  await expect(multiple.locator('.screen-outcome')).toContainText('material limitation');

  await multiple.getByRole('button', { name: 'Add transmitter' }).click();
  await expect(multiple.locator('fieldset.ofcom-multiple-source')).toHaveCount(3);
  await multiple.getByRole('button', { name: 'Remove transmitter 3' }).click();
  await expect(multiple.locator('fieldset.ofcom-multiple-source')).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('applies the Australian ACMA gateway and ARPANSA reference levels', async ({ page }) => {
  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('AU');
  await expect(page.getByText('Jurisdiction: Australia')).toBeVisible();
  await page.getByRole('button', { name: /RF exposure/ }).click();

  await expect(page.getByRole('button', { name: /ACMA gateway/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Exclusion distance/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /ARPANSA limits/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Single source/ })).toHaveCount(0);
  const gateway = page.getByRole('region', { name: 'Amateur station EME assessment path' });
  await expect(gateway.locator('.screen-outcome')).toContainText('low-risk category');
  await expect(gateway.getByRole('button', { name: 'Document these station inputs' })).toBeVisible();
  await expect(gateway.getByRole('img', { name: /Australian amateur station EME assessment gateway/ })).toBeVisible();

  await gateway.getByRole('checkbox', { name: /Every antenna is inaccessible/ }).uncheck();
  await gateway.getByRole('spinbutton', { name: 'Average total power to all antennas' }).fill('101');
  await gateway.getByRole('spinbutton', { name: 'Base height of lowest antenna' }).fill('9.999');
  await expect(gateway.locator('.screen-outcome')).toContainText('Higher-risk measurement, calculation, and records are required');

  await gateway.getByRole('spinbutton', { name: 'Base height of lowest antenna' }).fill('10');
  await gateway.getByRole('spinbutton', { name: 'Average total EIRP in any direction' }).fill('3200');
  await expect(gateway.locator('.screen-outcome')).toContainText('low-risk category');
  await gateway.getByRole('checkbox', { name: /simultaneously on multiple frequencies/ }).check();
  await gateway.getByRole('checkbox', { name: /more than one station/ }).check();
  await expect(gateway.locator('.screen-limitations').first()).toContainText('RPS S-1 section 3');
  await expect(gateway.locator('.screen-limitations').first()).toContainText('whole-site');

  await gateway.getByLabel('Station type').selectOption('mobile');
  await gateway.getByRole('spinbutton', { name: 'Average total power to all antennas' }).fill('100');
  await expect(gateway.locator('.screen-outcome')).toContainText('low-risk category');
  await gateway.getByRole('spinbutton', { name: 'Average total power to all antennas' }).fill('100.1');
  await expect(gateway.locator('.screen-outcome')).toContainText('Higher-risk');

  await page.getByRole('button', { name: 'Imperial' }).click();
  await expect(gateway.getByRole('spinbutton', { name: 'Base height of lowest antenna' })).toHaveValue('32.808');

  await gateway.getByRole('button', { name: 'Start assessment record' }).click();
  const record = page.getByRole('region', { name: 'Assessment record worksheet' });
  await expect(record.getByRole('status').filter({ hasText: 'Gateway inputs transferred into a new unsaved draft' })).toBeVisible();
  await expect(record.getByLabel('Power level')).toHaveValue(/100\.1 W/);
  await expect(record.getByLabel('Height above ground or accessible surface')).toHaveValue(/10 m/);
  await expect(record.getByLabel('Highest normal operating conditions assessed')).toHaveValue(/Mobile station/);
  await expect(record.getByLabel('Highest normal operating conditions assessed')).toHaveValue(/3200 W EIRP/);
  await expect(record.getByLabel('Simultaneous-frequency treatment')).toHaveValue(/remains to be documented/);
  await expect(record.getByLabel('Assessment or transitional route')).toHaveValue('');
  await expect(record.getByLabel('Assessor name')).toHaveValue('');
  await expect(record.getByRole('checkbox', { name: /A declaration containing/ })).not.toBeChecked();
  await expect(record.locator('.acma-record-readiness')).toContainText('16 required items not documented');
  await record.getByLabel('Record title').fill('Home station assessment');
  await record.getByLabel('Operator or corporate name').fill('Test Operator');
  await record.getByLabel('Operator type').selectOption('body-corporate');
  await expect(record.getByLabel('ACN, ARBN, or registration number')).toBeVisible();
  await expect(record.locator('.acma-evidence-status')).toContainText('5 record anchors not documented');
  await record.getByLabel('Assessment or transitional route').selectOption('current');
  await expect(record.locator('.acma-route-note')).toContainText('actually applies');
  await record.getByLabel('Named assessment standard').selectOption('as-nzs-2772-2');
  await expect(record.locator('.acma-evidence-status')).toContainText('4 record anchors not documented');
  await record.getByLabel('Standard title, edition, or publication date').fill('AS/NZS 2772.2:2016');
  await record.getByLabel('Method type').selectOption('calculation');
  await record.getByLabel('Assessment scope').selectOption('single-station');
  await record.getByRole('checkbox', { name: /Station location/ }).check();
  await record.getByLabel('Change effective date').fill('2026-11-13');
  await record.getByLabel('What changed?').fill('Station moved to a new residential location');
  await record.getByLabel('Post-change clause 3 review result').selectOption('clause-4-applies');
  await record.getByLabel('Clause 4 assessment action').selectOption('new-assessment-completed');
  await record.getByLabel('Assessment record reference').fill('Assessment report AU-2026-01');
  await record.getByLabel('Clause 6 declaration action').selectOption('new-declaration-made');
  await record.getByLabel('New declaration reference').fill('Declaration AU-2026-01');
  await record.getByLabel('Reviewed by').fill('Responsible operator');
  await expect(record.locator('.acma-change-review')).toContainText('No derived follow-up shown');
  await record.getByRole('button', { name: 'Add change entry' }).click();
  await expect(record.locator('.acma-change-log li')).toHaveCount(1);
  await record.getByRole('checkbox', { name: /An agent is used/ }).check();
  await expect(record.getByLabel('Written agent-agreement reference')).toBeVisible();
  await record.getByRole('button', { name: 'Save draft' }).click();
  await expect(record.getByRole('status').filter({ hasText: 'Draft saved' })).toBeVisible();
  await record.getByRole('button', { name: 'New draft' }).click();
  await record.getByLabel('Saved ACMA assessment records').selectOption({ index: 1 });
  await expect(record.getByLabel('Operator or corporate name')).toHaveValue('Test Operator');
  const downloadPromise = page.waitForEvent('download');
  await record.getByRole('button', { name: 'Download JSON' }).click();
  const downloadedRecord = await downloadPromise;
  await expect(downloadedRecord.suggestedFilename()).toBe('home-station-assessment.acma-eme-record.json');
  await page.emulateMedia({ media: 'print' });
  const printReport = record.getByRole('article', { name: 'Printable Australian amateur station assessment record' });
  await expect(printReport).toBeVisible();
  await expect(printReport).toContainText('Record copy — not a compliance certificate');
  await expect(printReport).toContainText('Station moved to a new residential location');
  await expect(printReport).toContainText('Assessment report AU-2026-01');
  await expect(printReport).toContainText('Declaration AU-2026-01');
  await expect(printReport.locator('.acma-print-field').filter({ hasText: 'Record state' })).toContainText('Saved');
  await expect(record.locator('.acma-record-form')).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.emulateMedia({ media: 'screen' });
  await record.getByLabel('Operator or corporate name').fill('Updated Operator');
  await page.emulateMedia({ media: 'print' });
  await expect(printReport.locator('.acma-print-field').filter({ hasText: 'Record state' })).toContainText('Unsaved changes');
  await page.emulateMedia({ media: 'screen' });
  await record.getByRole('button', { name: 'Save draft' }).click();
  const history = record.getByRole('region', { name: 'Earlier saved revisions' });
  await expect(history.locator('li')).toHaveCount(1);
  await expect(history).toContainText('operator name');
  await history.getByRole('button', { name: 'Restore revision 1' }).click();
  await expect(record.getByLabel('Operator or corporate name')).toHaveValue('Test Operator');
  await expect(record.getByRole('status').filter({ hasText: 'Revision restored as an unsaved draft' })).toBeVisible();
  await record.getByRole('button', { name: 'Save draft' }).click();
  await expect(record.getByRole('region', { name: 'Earlier saved revisions' }).locator('li')).toHaveCount(2);
  const downloadedPath = await downloadedRecord.path();
  expect(downloadedPath).toBeTruthy();
  await record.getByLabel('Import ACMA assessment record JSON').setInputFiles(downloadedPath!);
  await expect(record.getByRole('status').filter({ hasText: 'imported as a new local copy' })).toBeVisible();
  await expect(record.getByLabel('Saved ACMA assessment records').locator('option')).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole('button', { name: /ARPANSA limits/ }).click();
  const panel = page.getByRole('region', { name: 'ARPANSA RPS S-1 reference levels' });
  await expect(panel).toContainText('30-minute average');
  await expect(panel).toContainText('6-minute average');
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('3.5');
  await expect(panel).toContainText('ES — use peak-field level');
  await expect(panel).toContainText('83 V/m · 21 A/m');
  await expect(panel).toContainText('45 mA when grounded');

  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('146');
  await expect(panel).toContainText('27.700 V/m');
  await expect(panel).toContainText('2.000 W/m²');
  await expect(panel).toContainText('62.000 V/m');
  await expect(panel).toContainText('10.000 W/m²');
  await expect(panel).toContainText('Table 7 ends at 10 MHz');

  await page.getByLabel('Exposure environment', { exact: true }).selectOption('controlled');
  await expect(panel).toContainText('61.000 V/m');
  await expect(panel).toContainText('50.000 W/m²');

  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('0.099');
  await expect(panel.getByRole('alert')).toContainText('0.1 to 300,000 MHz');

  await page.getByRole('button', { name: /Exclusion distance/ }).click();
  await page.getByRole('button', { name: 'Metric' }).click();
  const exclusion = page.getByRole('region', { name: 'ACMA RF exclusion distance' });
  await page.getByRole('spinbutton', { name: 'Evaluation frequency' }).fill('3000');
  await expect(exclusion.locator('.result-summary')).toContainText('3.173 m');
  await expect(exclusion.locator('.result-summary')).toContainText('10.000 W/m²');
  await expect(exclusion.getByRole('img', { name: 'ACMA simple RF exclusion-distance geometry' })).toBeVisible();
  await expect(exclusion.locator('.screen-outcome')).toContainText('Official simple far-field distance available');
  await exclusion.getByRole('spinbutton', { name: 'ACMA largest antenna dimension' }).fill('100');
  await expect(exclusion.locator('.screen-outcome')).toContainText('inside the far-field boundary');
  await expect(exclusion.locator('.screen-limitations')).toContainText('not a declaration of compliance');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('normalizes and sums multiple RF sources without inferring compliance', async ({ page }) => {
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Measured sources/ }).click();
  const aggregation = page.locator('.aggregation-section');
  await expect(aggregation.getByRole('heading', { name: 'Local RF environment' })).toBeVisible();
  await expect(aggregation.locator('.screen-outcome')).toContainText('Source inventory is incomplete');
  await expect(aggregation.getByRole('img', { name: /Multiple-source normalized exposure sum/ })).toBeVisible();
  await expect(aggregation.locator('.aggregation-summary')).toContainText('10.70%');
  await expect(aggregation.getByText('Normalize before adding', { exact: true })).toBeHidden();
  await aggregation.getByText('Combine multiple RF sources').click();
  await expect(aggregation.getByText('Normalize before adding', { exact: true })).toBeVisible();

  await aggregation.getByRole('checkbox', { name: /Local source inventory assessed/ }).check();
  await expect(aggregation.locator('.screen-outcome')).toContainText('Below the aggregate screening trigger');

  await aggregation.getByRole('spinbutton', { name: 'Source 1 power density' }).fill('0.7');
  await expect(aggregation.locator('.screen-outcome')).toContainText('Further analysis is required');
  await expect(aggregation.locator('.screen-limitations')).toContainText('does not mean safe, compliant, certified, or exempt');

  await aggregation.getByRole('button', { name: /Add RF source/ }).click();
  await expect(aggregation.locator('fieldset.aggregation-source')).toHaveCount(3);
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
  await page.getByLabel('Station jurisdiction', { exact: true }).selectOption('US');
  await page.getByLabel('Exposure environment', { exact: true }).selectOption('controlled');
  await project.getByRole('spinbutton', { name: 'Project point 1 east position' }).fill('42');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('radiobook:antenna-workshop:exposure-projects:v1'))).toContain('Field day station');

  await page.reload();
  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  project = page.locator('.project-section');
  await expect(project.getByLabel('Project title')).toHaveValue('Field day station');
  await expect(page.getByLabel('Station jurisdiction', { exact: true })).toHaveValue('US');
  await expect(page.getByLabel('Exposure environment', { exact: true })).toHaveValue('controlled');
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
  await page.getByRole('button', { name: /Trap dipole/ }).click();
  await page.getByRole('button', { name: 'Show advanced' }).click();
  const loadedDimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(loadedDimensions.content).toBe(loadedDimensions.viewport);

  await page.getByRole('button', { name: /RF exposure/ }).click();
  await page.getByRole('button', { name: /Station project/ }).click();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth
  }));

  expect(dimensions.content).toBe(dimensions.viewport);
});

test('shows corporate branding, attribution, and public project links', async ({ page }) => {
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/antennas/favicon.ico');
  await expect(page.getByRole('heading', { name: 'Build antennas with the measurements—and the reasoning—to get them right.' })).toHaveCSS('font-size', '44px');
  await expect(page.getByAltText('Tartanleaf tartan maple-leaf logo').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'RadioBook home' })).toHaveAttribute('href', 'https://www.radiobook.ca/');
  await expect(page.getByRole('link', { name: 'Visit Tartanleaf.com Inc.' })).toHaveAttribute('href', 'https://www.tartanleaf.com/');
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/gregweir/AntennaWorkshop');
  await expect(page.getByRole('link', { name: 'gweir@tartanleaf.com' })).toHaveAttribute('href', 'mailto:gweir@tartanleaf.com');
  await expect(page.locator('.site-footer')).toContainText('Developed by Greg Weir, VA1GW');
});
