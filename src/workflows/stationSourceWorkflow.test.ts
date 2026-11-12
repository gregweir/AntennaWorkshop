/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { createAntennaDesignHandoff, createStationSourceTransfer } from './stationSourceWorkflow';

const antenna = createAntennaDesignHandoff({
  handoffId: 'design-1',
  label: 'Centre-fed half-wave dipole',
  frequencyMHz: 14.2,
  largestDimensionMetres: 10.03,
  antennaModelId: 'half-wave-dipole',
  antennaModelVersion: '1.0.0'
});

describe('station source workflow', () => {
  it('combines antenna geometry and feed-system inputs without changing physical values', () => {
    const transfer = createStationSourceTransfer('transfer-1', antenna, {
      transmitterPowerWatts: 100,
      dutyCyclePercent: 40,
      feedSystemLossDb: 1.8,
      antennaGainDbi: 2.15,
      antennaCentreHeightMetres: 12,
      feedSystemModelId: 'erp-eirp',
      feedSystemModelVersion: '1.0.0'
    });
    expect(transfer.source).toMatchObject({
      label: 'Centre-fed half-wave dipole',
      frequencyMHz: 14.2,
      transmitterPowerWatts: 100,
      dutyCyclePercent: 40,
      feedSystemLossDb: 1.8,
      antennaGainDbi: 2.15,
      antennaLargestDimensionMetres: 10.03,
      antennaCentreHeightMetres: 12
    });
    expect(transfer.source.linkedModels?.antennaDesignId).toBe('half-wave-dipole');
  });

  it('rejects missing provenance and invalid exposure-specific values', () => {
    expect(() => createAntennaDesignHandoff({ ...antenna, antennaModelId: '' })).toThrow(/provenance/i);
    expect(() => createStationSourceTransfer('transfer-1', antenna, {
      transmitterPowerWatts: 100,
      dutyCyclePercent: 0,
      feedSystemLossDb: 1.8,
      antennaGainDbi: 2.15,
      antennaCentreHeightMetres: 12,
      feedSystemModelId: 'erp-eirp',
      feedSystemModelVersion: '1.0.0'
    })).toThrow(/duty cycle/i);
  });
});
