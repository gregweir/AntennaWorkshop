/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export const PWA_UPDATE_EVENT = 'radiobook:pwa-update-ready';

export interface PwaUpdateDetail {
  applyUpdate: () => Promise<void>;
}

export function announcePwaUpdate(applyUpdate: () => Promise<void>): void {
  window.dispatchEvent(
    new CustomEvent<PwaUpdateDetail>(PWA_UPDATE_EVENT, {
      detail: { applyUpdate }
    })
  );
}
