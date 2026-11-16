/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

interface BodyStyleSnapshot {
  position: string;
  top: string;
  width: string;
  overflow: string;
}

let activeLocks = 0;
let lockedScrollY = 0;
let bodyStyleSnapshot: BodyStyleSnapshot | null = null;

export function lockDocumentScroll(className: string) {
  const body = document.body;
  body.classList.add(className);
  if (activeLocks === 0) {
    lockedScrollY = window.scrollY;
    bodyStyleSnapshot = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow
    };
    body.style.position = 'fixed';
    body.style.top = `-${lockedScrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }
  activeLocks += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    body.classList.remove(className);
    activeLocks = Math.max(0, activeLocks - 1);
    if (activeLocks !== 0 || !bodyStyleSnapshot) return;
    body.style.position = bodyStyleSnapshot.position;
    body.style.top = bodyStyleSnapshot.top;
    body.style.width = bodyStyleSnapshot.width;
    body.style.overflow = bodyStyleSnapshot.overflow;
    bodyStyleSnapshot = null;
    window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'auto' });
  };
}
