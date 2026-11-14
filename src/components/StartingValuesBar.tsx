/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

interface Props {
  scope: string;
  modifiedCount: number;
  onRestore: () => void;
  note: string;
}

export function StartingValuesBar({ scope, modifiedCount, onRestore, note }: Props) {
  return <section className="starting-values-bar" aria-label={`${scope} starting values`}>
    <div><strong>{modifiedCount === 0 ? 'Using starting values' : `${modifiedCount} modified ${modifiedCount === 1 ? 'value' : 'values'}`}</strong><span>{note}</span></div>
    <button type="button" disabled={modifiedCount === 0} onClick={onRestore}>Restore {scope.toLocaleLowerCase()}</button>
  </section>;
}
