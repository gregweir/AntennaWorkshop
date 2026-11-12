/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface SitePosition {
  eastMetres: number;
  northMetres: number;
}

export interface SiteCanvasPoint {
  x: number;
  y: number;
}

export interface SitePlanViewport {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  minimumEastMetres: number;
  maximumEastMetres: number;
  minimumNorthMetres: number;
  maximumNorthMetres: number;
  gridStepMetres: number;
  eastGridMetres: number[];
  northGridMetres: number[];
  toCanvas: (position: SitePosition) => SiteCanvasPoint;
  fromCanvas: (point: SiteCanvasPoint) => SitePosition;
}

const WIDTH = 680;
const HEIGHT = 440;
const LEFT = 70;
const RIGHT = 650;
const TOP = 50;
const BOTTOM = 390;

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
}

function niceStep(target: number) {
  const exponent = Math.floor(Math.log10(target));
  const power = 10 ** exponent;
  const fraction = target / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
}

function gridValues(minimum: number, maximum: number, step: number) {
  const first = Math.ceil(minimum / step) * step;
  const values: number[] = [];
  for (let value = first; value <= maximum + step * 1e-9 && values.length < 100; value += step) {
    values.push(Number(value.toPrecision(12)));
  }
  return values;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function snapSiteCoordinate(value: number, incrementMetres = 0.1) {
  finite(value, 'Coordinate');
  if (!Number.isFinite(incrementMetres) || incrementMetres <= 0) throw new RangeError('Snap increment must be greater than zero.');
  return Math.round(value / incrementMetres) * incrementMetres;
}

export function createSitePlanViewport(positions: SitePosition[]): SitePlanViewport {
  if (!positions.length) throw new RangeError('At least one site position is required.');
  for (const position of positions) {
    finite(position.eastMetres, 'East coordinate');
    finite(position.northMetres, 'North coordinate');
  }

  const eastValues = positions.map((position) => position.eastMetres);
  const northValues = positions.map((position) => position.northMetres);
  const rawMinimumEast = Math.min(...eastValues);
  const rawMaximumEast = Math.max(...eastValues);
  const rawMinimumNorth = Math.min(...northValues);
  const rawMaximumNorth = Math.max(...northValues);
  const rawEastSpan = rawMaximumEast - rawMinimumEast;
  const rawNorthSpan = rawMaximumNorth - rawMinimumNorth;
  const referenceSpan = Math.max(rawEastSpan, rawNorthSpan, 10);
  const margin = Math.max(referenceSpan * 0.15, 1);
  const eastSpan = Math.max(rawEastSpan, 10) + margin * 2;
  const northSpan = Math.max(rawNorthSpan, 10) + margin * 2;
  const middleEast = (rawMinimumEast + rawMaximumEast) / 2;
  const middleNorth = (rawMinimumNorth + rawMaximumNorth) / 2;
  const minimumEastMetres = middleEast - eastSpan / 2;
  const maximumEastMetres = middleEast + eastSpan / 2;
  const minimumNorthMetres = middleNorth - northSpan / 2;
  const maximumNorthMetres = middleNorth + northSpan / 2;
  const scale = Math.min((RIGHT - LEFT) / eastSpan, (BOTTOM - TOP) / northSpan);
  const canvasWidth = eastSpan * scale;
  const canvasHeight = northSpan * scale;
  const canvasLeft = (WIDTH - canvasWidth) / 2;
  const canvasTop = (HEIGHT - canvasHeight) / 2;
  const gridStepMetres = niceStep(referenceSpan / 6);

  const toCanvas = (position: SitePosition): SiteCanvasPoint => ({
    x: canvasLeft + (position.eastMetres - minimumEastMetres) * scale,
    y: canvasTop + (maximumNorthMetres - position.northMetres) * scale
  });
  const fromCanvas = (point: SiteCanvasPoint): SitePosition => ({
    eastMetres: minimumEastMetres + (clamp(point.x, canvasLeft, canvasLeft + canvasWidth) - canvasLeft) / scale,
    northMetres: maximumNorthMetres - (clamp(point.y, canvasTop, canvasTop + canvasHeight) - canvasTop) / scale
  });

  return {
    width: WIDTH,
    height: HEIGHT,
    left: canvasLeft,
    right: canvasLeft + canvasWidth,
    top: canvasTop,
    bottom: canvasTop + canvasHeight,
    minimumEastMetres,
    maximumEastMetres,
    minimumNorthMetres,
    maximumNorthMetres,
    gridStepMetres,
    eastGridMetres: gridValues(minimumEastMetres, maximumEastMetres, gridStepMetres),
    northGridMetres: gridValues(minimumNorthMetres, maximumNorthMetres, gridStepMetres),
    toCanvas,
    fromCanvas
  };
}
