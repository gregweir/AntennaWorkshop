/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import type { ExposureSensitivityResult } from '../calculators/exposureSensitivity';
import { exposureSensitivityCsvFilename, serializeExposureSensitivityCsv } from './exposureSensitivityCsv';

const result: ExposureSensitivityResult = {
  variable: 'plan-distance', sourceId: 'source', pointId: 'point', currentInputValue: 10,
  currentFractionOfReferenceLevel: 0.25, screeningTriggerFraction: 0.5,
  samples: [
    { inputValue: 3.048, totalFractionOfReferenceLevel: 0.25, status: 'below-screening-trigger' },
    { inputValue: 6.096, totalFractionOfReferenceLevel: null, status: 'method-inapplicable' }
  ],
  thresholdCrossings: [{ inputValue: 4.572, direction: 'falling' }]
};

describe('exposure sensitivity CSV', () => {
  it('exports samples and interpolated crossings in the selected display units', () => {
    const csv = serializeExposureSensitivityCsv(result, { sourceLabel: 'Vertical', pointLabel: 'Yard', variableLabel: 'Plan distance', unitSystem: 'imperial' });
    expect(csv).toContain('"sample","Plan distance","Vertical","Yard","10","ft","0.25","25","below-screening-trigger","0.5","",""');
    expect(csv).toContain('"sample","Plan distance","Vertical","Yard","20","ft","","","method-inapplicable"');
    expect(csv).toContain('"interpolated_crossing","Plan distance","Vertical","Yard","15","ft","0.5","50","","0.5","falling"');
    expect(csv).toContain('not a compliance limit');
  });

  it('escapes labels that spreadsheet applications could interpret as formulas', () => {
    const csv = serializeExposureSensitivityCsv(result, { sourceLabel: '=1+1', pointLabel: '"Yard"', variableLabel: 'Plan distance', unitSystem: 'metric' });
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"""Yard"""');
  });

  it('creates a bounded, portable filename', () => {
    expect(exposureSensitivityCsvFilename('Home Station / RF Assessment', 'transmitter-power')).toBe('home-station-rf-assessment-transmitter-power-sensitivity.csv');
  });
});
