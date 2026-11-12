/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { AmateurBand } from '../bands/catalog';
import { formatFrequencyRange } from '../bands/catalog';
import { SPEED_OF_LIGHT_METRES_PER_SECOND } from '../calculators/dipole';
import { formatLength, type UnitSystem } from '../lib/units';

interface BandIndicatorProps {
  band?: AmateurBand;
  frequencyMHz: number;
  unitSystem: UnitSystem;
}

export function BandIndicator({ band, frequencyMHz, unitSystem }: BandIndicatorProps) {
  if (!Number.isFinite(frequencyMHz) || frequencyMHz <= 0) {
    return null;
  }

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (frequencyMHz * 1_000_000);
  const wavelengthLabel =
    unitSystem === 'imperial'
      ? `${formatLength(wavelengthMetres, 'metric')} · ${formatLength(wavelengthMetres, 'imperial')}`
      : formatLength(wavelengthMetres, 'metric');

  if (!band) {
    return (
      <aside className="band-indicator band-indicator-custom" aria-label="Frequency and wavelength relationship">
        <div>
          <span className="band-kicker">Custom frequency</span>
          <strong>{frequencyMHz.toFixed(3)} MHz</strong>
        </div>
        <p>
          Free-space wavelength: <b>{wavelengthLabel}</b>. This frequency is not inside a
          listed amateur allocation for the selected jurisdiction.
        </p>
      </aside>
    );
  }

  const fraction =
    band.upperMHz === band.lowerMHz
      ? 0.5
      : Math.min(1, Math.max(0, (frequencyMHz - band.lowerMHz) / (band.upperMHz - band.lowerMHz)));

  return (
    <aside className="band-indicator" aria-label={`${band.label} band frequency position`}>
      <div className="band-indicator-heading">
        <div>
          <span className="band-kicker">Conventional band name</span>
          <strong>{band.label}</strong>
        </div>
        <div className="band-wavelength">
          <span>Actual wavelength at {frequencyMHz.toFixed(3)} MHz</span>
          <b>{wavelengthLabel}</b>
        </div>
      </div>

      {band.continuous === false ? (
        <div className="band-special-range">
          <span>Special allocation</span>
          <strong>{frequencyMHz.toFixed(3)} MHz selected</strong>
        </div>
      ) : (
        <>
          <div className="band-scale" aria-hidden="true">
            <span className="band-marker" style={{ left: `${fraction * 100}%` }} />
          </div>
          <div className="band-scale-labels">
            <span>{band.lowerMHz.toFixed(band.lowerMHz < 30 ? 3 : 1)} MHz</span>
            <strong>{frequencyMHz.toFixed(3)} MHz</strong>
            <span>{band.upperMHz.toFixed(band.upperMHz < 30 ? 3 : 1)} MHz</span>
          </div>
        </>
      )}

      <p>
        The name “{band.label}” is conventional; wavelength varies across its {formatFrequencyRange(band)} allocation.
        {band.note ? ` ${band.note}` : ''}
      </p>
    </aside>
  );
}
