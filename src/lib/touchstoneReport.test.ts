/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { parseTouchstoneS1p } from './touchstone';
import { serializeTouchstoneComparisonCsv, touchstoneReportFilename } from './touchstoneReport';

describe('Touchstone measurement report export', () => {
  const context = { title: 'Dipole, final', calibrationContext: 'Feedpoint, OSL calibration', referenceState: 'Before trim', comparisonState: 'After trim' };
  const reference = { fileName: 'before.s1p', sweep: parseTouchstoneS1p('# MHz S RI R 50\n14.1 0.5 0\n14.2 0 0') };
  const comparison = { fileName: 'after.s1p', sweep: parseTouchstoneS1p('# MHz S RI R 50\n14.09 0.4 0\n14.21 0.1 0') };

  it('exports every reference point with the nearest comparison sample', () => {
    const csv = serializeTouchstoneComparisonCsv(context, reference, comparison);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('frequency_offset_hz');
    expect(lines[1]).toContain('14090000,-10000');
    expect(lines[2]).toContain('14210000,10000');
    expect(lines[1]).toContain('"Dipole, final"');
  });

  it('supports a reference-only export and safe filename', () => {
    const csv = serializeTouchstoneComparisonCsv(context, reference, null);
    expect(csv).not.toContain('comparison_frequency_hz');
    expect(csv.trim().split('\r\n')).toHaveLength(3);
    expect(touchstoneReportFilename('  My 20 m / Dipole  ')).toBe('my-20-m-dipole-measurement.csv');
  });

  it('prevents user-entered text from becoming a spreadsheet formula', () => {
    const csv = serializeTouchstoneComparisonCsv({ ...context, title: '=HYPERLINK("https://example.invalid")' }, reference, null);
    expect(csv.split('\r\n')[1]).toContain('"\'=HYPERLINK(""https://example.invalid"")"');
  });
});
