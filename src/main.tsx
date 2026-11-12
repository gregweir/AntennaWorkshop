/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { announcePwaUpdate } from './pwa/update';
import './styles/tokens.css';
import './styles/app.css';

const updateServiceWorker = registerSW({
  immediate: false,
  onNeedRefresh() {
    announcePwaUpdate(() => updateServiceWorker(true));
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
