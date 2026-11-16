/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { lockDocumentScroll } from '../lib/modalScroll';

interface Props {
  label: string;
  help: string;
  openRequest?: number;
}

const zoomLevels = [100, 125, 150, 200];

export function DiagramControls({ label, help, openRequest = 0 }: Props) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const helpId = useId();
  const [expanded, setExpanded] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    if (openRequest > 0) {
      setZoomIndex(0);
      setExpanded(true);
    }
  }, [openRequest]);

  useEffect(() => {
    const panel = controlsRef.current?.closest<HTMLElement>('.visual-panel');
    if (!panel) return;

    panel.classList.toggle('diagram-expanded', expanded);
    panel.style.setProperty('--diagram-zoom', `${zoomLevels[zoomIndex]}%`);
    if (expanded) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', titleId);
      panel.setAttribute('aria-describedby', helpId);
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
      panel.removeAttribute('aria-labelledby');
      panel.removeAttribute('aria-describedby');
    }

    return () => {
      panel.classList.remove('diagram-expanded');
      panel.style.removeProperty('--diagram-zoom');
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
      panel.removeAttribute('aria-labelledby');
      panel.removeAttribute('aria-describedby');
    };
  }, [expanded, helpId, titleId, zoomIndex]);

  useEffect(() => {
    if (!expanded) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : toggleRef.current;
    const panel = controlsRef.current?.closest<HTMLElement>('.visual-panel');
    const unlock = lockDocumentScroll('diagram-view-open');
    panel?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    globalThis.requestAnimationFrame?.(() => toggleRef.current?.focus({ preventScroll: true }));
    const keepControlsVisible = () => globalThis.requestAnimationFrame?.(() => panel?.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    window.addEventListener('orientationchange', keepControlsVisible);
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
      if (focusable.length === 0) return;
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1) : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
      event.preventDefault();
      focusable[nextIndex].focus();
    };
    document.addEventListener('keydown', handleDialogKey);
    return () => {
      document.removeEventListener('keydown', handleDialogKey);
      window.removeEventListener('orientationchange', keepControlsVisible);
      unlock();
      globalThis.requestAnimationFrame?.(() => returnFocusRef.current?.focus({ preventScroll: true }));
    };
  }, [expanded]);

  const toggleExpanded = () => {
    setExpanded((current) => !current);
    setZoomIndex(0);
  };

  return <div className="diagram-controls" ref={controlsRef}>
    <h2 className="sr-only" id={titleId}>{label} enlarged view</h2>
    <div className="diagram-reading-guide" id={helpId}><strong>How to read this drawing</strong><span>{help}</span></div>
    <div className="diagram-control-actions">
      {expanded && <div className="diagram-zoom-controls" aria-label="Diagram zoom">
        <button type="button" aria-label="Zoom diagram out" disabled={zoomIndex === 0} onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}>−</button>
        <output aria-live="polite">{zoomLevels[zoomIndex]}%</output>
        <button type="button" aria-label="Zoom diagram in" disabled={zoomIndex === zoomLevels.length - 1} onClick={() => setZoomIndex((current) => Math.min(zoomLevels.length - 1, current + 1))}>+</button>
      </div>}
      <button className="diagram-expand-button" ref={toggleRef} type="button" aria-expanded={expanded} onClick={toggleExpanded}>{expanded ? 'Close enlarged view' : 'View larger'}</button>
    </div>
  </div>;
}
