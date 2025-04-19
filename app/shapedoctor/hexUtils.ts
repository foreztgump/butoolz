import type { Point, HexCoord } from './types';
import * as Config from './shapedoctor.config';

export const isSafeNumber = (num: unknown): num is number =>
  typeof num === "number" && Number.isFinite(num);

export const axialToPixel = (q: number, r: number): Point | null => {
  const x = Config.HEX_SIZE * ((3 / 2) * q);
  const y = Config.HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
  if (!isSafeNumber(x) || !isSafeNumber(y)) {
    return null;
  }
  return { x, y };
};

export const screenToWorld = (
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  currentOffset: Point,
  currentZoom: number
): Point | null => {
  if (
    !isSafeNumber(screenX) ||
    !isSafeNumber(screenY) ||
    !isSafeNumber(currentOffset.x) ||
    !isSafeNumber(currentOffset.y) ||
    !isSafeNumber(currentZoom) ||
    currentZoom <= 0 ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    return null;
  }
  const x = (screenX - canvasWidth / 2 - currentOffset.x) / currentZoom;
  const y = (screenY - canvasHeight / 2 - currentOffset.y) / currentZoom;
  if (!isSafeNumber(x) || !isSafeNumber(y)) {
    return null;
  }
  return { x, y };
};

export const drawHexagon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillColor: string,
  lineWidth: number = 1,
  strokeColor: string = Config.STROKE_COLOR_DEFAULT
) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i;
    const angle_rad = (Math.PI / 180) * angle_deg;
    const pointX = x + size * Math.cos(angle_rad);
    const pointY = y + size * Math.sin(angle_rad);
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
};

export const pixelToAxial = (
  x: number,
  y: number
): { q: number; r: number } | null => {
  const q = ((2 / 3) * x) / Config.HEX_SIZE;
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / Config.HEX_SIZE;
  if (!isSafeNumber(q) || !isSafeNumber(r)) {
    return null;
  }
  return { q, r };
};

export const hexRound = (
  q: number,
  r: number
): { q: number; r: number; s: number } | null => {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  if (!isSafeNumber(rq) || !isSafeNumber(rr) || !isSafeNumber(rs)) {
    return null;
  }

  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  if (!isSafeNumber(q_diff) || !isSafeNumber(r_diff) || !isSafeNumber(s_diff)) {
    return null;
  }

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }
  return { q: rq, r: rr, s: rs };
};

export const findHexByCoords = (
  q: number,
  r: number
): HexCoord | undefined => {
  return Config.HEX_GRID_COORDS.find((hex) => hex.q === q && hex.r === r);
};

export const drawHexGrid = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  currentZoom: number,
  offsetX: number,
  offsetY: number,
  currentHoverId: number | null,
  currentGridState: number[],
  selectedTiles: Set<number> // Pass selectedTiles as an argument
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(centerX + offsetX, centerY + offsetY);
  ctx.scale(currentZoom, currentZoom);

  Config.HEX_GRID_COORDS.forEach((hex) => {
    const pixel = axialToPixel(hex.q, hex.r);
    if (!pixel) return;

    const isSelected = selectedTiles.has(hex.id);
    const isHovered = hex.id === currentHoverId;
    const solutionPieceIndex = currentGridState[hex.id];
    const isPartOfSolution = solutionPieceIndex !== -1;

    let fillColor = Config.DEFAULT_COLOR;
    let strokeColor = Config.STROKE_COLOR_DEFAULT;
    let lineWidth = 1;

    if (isPartOfSolution) {
      fillColor = Config.HEX_COLORS[solutionPieceIndex % Config.HEX_COLORS.length];
      strokeColor = Config.STROKE_COLOR_ACTIVE;
      lineWidth = 1.5;
    } else if (isSelected) {
      fillColor = Config.SELECTED_COLOR;
      strokeColor = Config.STROKE_COLOR_ACTIVE;
      lineWidth = 1.5;
    } else if (isHovered) {
      fillColor = Config.HOVER_COLOR;
      strokeColor = Config.STROKE_COLOR_ACTIVE;
      lineWidth = 1.5;
    }

    drawHexagon(
      ctx,
      pixel.x,
      pixel.y,
      Config.HEX_SIZE,
      fillColor,
      lineWidth,
      strokeColor
    );
  });

  ctx.restore();
};

export const drawPreviewGrid = (
  canvas: HTMLCanvasElement,
  shape: string,
  colorIndex: number,
  sizeRatio: number = 0.7
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const previewSize = Config.HEX_SIZE * sizeRatio;
  const tiles = shape.split("").map(Number);
  let minQ = Infinity,
    maxQ = -Infinity,
    minR = Infinity,
    maxR = -Infinity;

  const shapeCoords: HexCoord[] = [];
  Config.HEX_GRID_COORDS.forEach((coord, index) => {
    if (tiles[index] === 1) {
      shapeCoords.push(coord);
      minQ = Math.min(minQ, coord.q);
      maxQ = Math.max(maxQ, coord.q);
      minR = Math.min(minR, coord.r);
      maxR = Math.max(maxR, coord.r);
    }
  });

  if (shapeCoords.length === 0) return; // No tiles in shape

  const centerQ = (minQ + maxQ) / 2;
  const centerR = (minR + maxR) / 2;
  const centerPixel = axialToPixel(centerQ, centerR);
  if (!centerPixel) return;

  const offsetX = canvas.width / 2 - centerPixel.x * sizeRatio;
  const offsetY = canvas.height / 2 - centerPixel.y * sizeRatio;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(sizeRatio, sizeRatio);

  const fillColor = Config.HEX_COLORS[colorIndex % Config.HEX_COLORS.length];

  shapeCoords.forEach((coord) => {
    const pixel = axialToPixel(coord.q, coord.r);
    if (pixel) {
      drawHexagon(
        ctx,
        pixel.x,
        pixel.y,
        Config.HEX_SIZE,
        fillColor,
        1,
        Config.STROKE_COLOR_ACTIVE
      );
    }
  });

  ctx.restore();
}; 