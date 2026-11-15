/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const python = process.env.ANTENNA_PYNEC_PYTHON;
if (!python) throw new Error('Set ANTENNA_PYNEC_PYTHON to a Python executable with PyNEC installed.');

const script = fileURLToPath(new URL('./check-pynec-dipole.py', import.meta.url));
const output = execFileSync(python, [script], { encoding: 'utf8' });
process.stdout.write(output);
