/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export function PwaInstallGuide() {
  return <details className="pwa-install-guide">
    <summary><span><strong>Install for offline use</strong><small>Add the workshop to a phone, tablet, or desktop.</small></span></summary>
    <div className="pwa-install-body">
      <p>Open the workshop once while online so its application files can be stored. Installation commands differ by browser:</p>
      <div className="pwa-install-platforms">
        <section><h2>Chrome or Edge</h2><p>Use the install icon in the address bar when it appears. Otherwise open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p></section>
        <section><h2>iPhone or iPad</h2><p>Open the workshop in Safari, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p></section>
        <section><h2>Other browsers</h2><p>Look for an install or home-screen command in the browser menu. If none is offered, bookmark the workshop or use a browser that supports standalone web-app installation.</p></section>
      </div>
    </div>
  </details>;
}
