/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useState } from 'react';
import { PWA_UPDATE_EVENT, type PwaUpdateDetail } from '../pwa/update';

export function PwaUpdateBanner() {
  const [update, setUpdate] = useState<PwaUpdateDetail | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      setUpdate((event as CustomEvent<PwaUpdateDetail>).detail);
    };

    window.addEventListener(PWA_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, handleUpdate);
  }, []);

  if (!update) {
    return null;
  }

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <div>
        <strong>A new version is ready.</strong>
        <span>Apply it when you are ready; your saved preferences will remain on this device.</span>
      </div>
      <div className="update-actions">
        <button type="button" onClick={() => setUpdate(null)} disabled={applying}>Later</button>
        <button
          type="button"
          disabled={applying}
          onClick={async () => {
            setApplying(true);
            await update.applyUpdate();
          }}
        >
          {applying ? 'Updating…' : 'Update now'}
        </button>
      </div>
    </div>
  );
}
