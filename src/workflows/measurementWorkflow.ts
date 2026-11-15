/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface MeasurementSweepHandoff {
  file: File;
  planId: string;
  measurementId: string;
  planName: string;
  measurementLabel: string;
  calibrationContext: string;
  referencePlane: string;
  installedGeometry: string;
  adjustment: string;
  observations: string;
}
