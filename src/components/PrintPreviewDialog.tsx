/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { lockDocumentScroll } from '../lib/modalScroll';

export interface PrintPreviewContent {
  title: string;
  printClass: string;
  html: string;
}

const svgStyleProperties = [
  'color', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'opacity',
  'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing', 'text-anchor',
  'dominant-baseline', 'paint-order', 'visibility'
];

function descendantsIncludingRoot(root: HTMLElement) {
  return [root, ...root.querySelectorAll<HTMLElement>('*')];
}

function preserveSvgStyles(source: HTMLElement, clone: HTMLElement) {
  const sourceElements = descendantsIncludingRoot(source);
  const cloneElements = descendantsIncludingRoot(clone);
  sourceElements.forEach((element, index) => {
    if (!(element instanceof SVGElement) || !(cloneElements[index] instanceof SVGElement)) return;
    const computed = getComputedStyle(element);
    const clonedElement = cloneElements[index];
    svgStyleProperties.forEach((property) => {
      const value = computed.getPropertyValue(property);
      if (value) clonedElement.style.setProperty(property, value);
    });
  });
}

function replaceFragmentReferences(value: string, replacements: Map<string, string>) {
  let next = value;
  replacements.forEach((replacement, original) => {
    next = next
      .replaceAll(`url(#${original})`, `url(#${replacement})`)
      .replaceAll(`url("#${original}")`, `url("#${replacement}")`)
      .replaceAll(`url('#${original}')`, `url('#${replacement}')`);
    if (next === `#${original}`) next = `#${replacement}`;
  });
  return next;
}

function rewriteCloneIds(container: HTMLElement, prefix: string) {
  const replacements = new Map<string, string>();
  descendantsIncludingRoot(container).filter((element) => element.id).forEach((element, index) => {
    const original = element.id;
    const replacement = `${prefix}-${index}-${original}`;
    replacements.set(original, replacement);
    element.id = replacement;
  });
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    container.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach((element) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      element.setAttribute(attribute, value.split(/\s+/).map((id) => replacements.get(id) ?? id).join(' '));
    });
  }
  descendantsIncludingRoot(container).forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const replacement = replaceFragmentReferences(attribute.value, replacements);
      if (replacement !== attribute.value) element.setAttribute(attribute.name, replacement);
    });
  });
  container.querySelectorAll('style').forEach((style) => {
    if (style.textContent) style.textContent = replaceFragmentReferences(style.textContent, replacements);
  });
}

export function capturePrintPreview(title: string, printClass: string, selectors: string[]): PrintPreviewContent {
  const container = document.createElement('div');
  const capturePrefix = `print-preview-${Date.now()}`;
  selectors.forEach((selector, index) => {
    const source = document.querySelector<HTMLElement>(selector);
    if (!source) return;
    const clone = source.cloneNode(true) as HTMLElement;
    preserveSvgStyles(source, clone);
    rewriteCloneIds(clone, `${capturePrefix}-${index}`);
    container.append(clone);
  });
  return { title, printClass, html: container.innerHTML };
}

function standaloneDocument(content: PrintPreviewContent) {
  const title = content.title.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[character]!);
  const baseUrl = document.baseURI.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[character]!);
  const styles = Array.from(document.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style'))
    .map((element) => element.outerHTML)
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${baseUrl}"><title>${title}</title>${styles}<style>
  :root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17212b;background:#eef2f1}*{box-sizing:border-box}body{margin:0}.toolbar{position:sticky;z-index:10;top:0;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem max(1rem,env(safe-area-inset-right)) .8rem max(1rem,env(safe-area-inset-left));background:#183b3f;color:#fff}.toolbar p{margin:0;font-size:.9rem}.toolbar button{display:inline-flex!important;min-height:44px;align-items:center;padding:.55rem .9rem;border:0;border-radius:.45rem;background:#f2c6a0;color:#17212b;font-weight:750}.document{width:min(56rem,calc(100% - 1rem));margin:.5rem auto 2rem;padding:clamp(1rem,4vw,2rem);background:#fff;box-shadow:0 10px 30px #17212b24}.document img,.document svg{max-width:100%;height:auto}.document h1,.document h2,.document h3,.document h4,.document h5{break-after:avoid}.document dl{display:grid;gap:.4rem}.document dl div,.document section,.document article{break-inside:avoid}.document dd{margin:0;white-space:pre-wrap}.document .result-summary-actions,.document .diagram-controls,.document button,.document input,.document select,.document textarea{display:none!important}@media print{body{background:#fff}.toolbar{display:none!important}.document{width:auto;margin:0;padding:0;box-shadow:none}@page{margin:12mm}}
  </style></head><body class="${content.printClass}"><div class="toolbar"><p>If the print sheet does not open, use Safari’s Share menu and choose Print or Save to Files.</p><button type="button" onclick="window.print()">Print or save</button></div><main class="document print-preview-document">${content.html}</main></body></html>`;
}

interface Props {
  content: PrintPreviewContent;
  onClose: () => void;
}

export function PrintPreviewDialog({ content, onClose }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const afterPrintRef = useRef<(() => void) | null>(null);
  const [message, setMessage] = useState('Review the complete document before opening the system print sheet.');

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockDocumentScroll('print-preview-open');
    globalThis.requestAnimationFrame?.(() => closeRef.current?.focus());
    return () => {
      if (afterPrintRef.current) window.removeEventListener('afterprint', afterPrintRef.current);
      document.body.classList.remove(content.printClass);
      unlock();
      globalThis.requestAnimationFrame?.(() => returnFocusRef.current?.focus({ preventScroll: true }));
    };
  }, [content.printClass]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])') ?? []);
      if (!focusable.length) return;
      const current = focusable.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (current <= 0 ? focusable.length - 1 : current - 1) : (current === focusable.length - 1 ? 0 : current + 1);
      event.preventDefault();
      focusable[next].focus();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const openNativePrint = () => {
    if (typeof window.print !== 'function') {
      setMessage('This browser does not expose a print command. Open the printable copy and use Safari’s Share menu instead.');
      return;
    }
    if (afterPrintRef.current) window.removeEventListener('afterprint', afterPrintRef.current);
    const finish = () => {
      document.body.classList.remove(content.printClass);
      setMessage('The system print sheet closed. You can print again or close this preview.');
      afterPrintRef.current = null;
    };
    afterPrintRef.current = finish;
    window.addEventListener('afterprint', finish, { once: true });
    document.body.classList.add(content.printClass);
    setMessage('Opening the system print sheet. If nothing appears, use Open printable copy.');
    try {
      window.print();
    } catch {
      window.removeEventListener('afterprint', finish);
      afterPrintRef.current = null;
      document.body.classList.remove(content.printClass);
      setMessage('The browser could not open its print sheet. Open the printable copy and use Safari’s Share menu instead.');
    }
  };

  const openPrintableCopy = () => {
    const printable = window.open('', '_blank');
    if (!printable) {
      setMessage('The browser blocked the printable copy. Allow pop-ups for this site, or open this page in Safari and try again.');
      return;
    }
    printable.opener = null;
    printable.document.open();
    printable.document.write(standaloneDocument(content));
    printable.document.close();
    setMessage('Printable copy opened. On iPhone or iPad, use Safari’s Share menu for Print or Save to Files.');
  };

  return <div className="print-preview-backdrop">
    <div className="print-preview-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} ref={dialogRef}>
      <header className="print-preview-toolbar">
        <div><p className="eyebrow">Print preview</p><h2 id={titleId}>{content.title}</h2><p id={descriptionId}>This preview stays open until you close it. No project or measurement data is uploaded.</p></div>
        <button type="button" ref={closeRef} onClick={onClose}>Close preview</button>
      </header>
      <div className="print-preview-actions">
        <button type="button" className="primary-action" onClick={openNativePrint}>Open print dialog</button>
        <button type="button" onClick={openPrintableCopy}>Open printable copy</button>
        <p role="status" aria-live="polite">{message}</p>
      </div>
      <div className="print-preview-scroll" tabIndex={0} aria-label={`${content.title} document preview`}>
        <article className="print-preview-document" dangerouslySetInnerHTML={{ __html: content.html }} />
      </div>
    </div>
  </div>;
}
