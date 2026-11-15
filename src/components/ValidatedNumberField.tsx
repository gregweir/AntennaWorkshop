/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import { HelpTip } from './ContextHelp';

interface Props {
  label: string;
  ariaLabel?: string;
  id?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  help?: string;
  tooltip?: ReactNode;
  onChange: (value: number) => void;
}

export function ValidatedNumberField({ label, ariaLabel, id, value, min, max, step, unit, help, tooltip, onChange }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const invalid = !Number.isFinite(value) || value < min || value > max;

  return <div className={`field${invalid ? ' field-invalid' : ''}`}>
    <span className={tooltip ? 'field-label-with-help' : undefined}><label htmlFor={inputId}>{label}</label>{tooltip && <HelpTip label={label}>{tooltip}</HelpTip>}</span>
    <span className="input-with-unit"><input id={inputId} aria-label={ariaLabel} aria-describedby={`${help ? helpId : ''}${invalid ? `${help ? ' ' : ''}${errorId}` : ''}` || undefined} aria-invalid={invalid || undefined} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span>
    {invalid && <small id={errorId} className="field-validation">Enter a value from {min} to {max} {unit}.</small>}
    {help && <small id={helpId}>{help}</small>}
  </div>;
}
