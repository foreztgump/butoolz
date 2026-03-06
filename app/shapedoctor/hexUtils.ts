import type { Point, HexCoord } from './types';
import * as Config from './shapedoctor.config';
import { isTileLocked } from './bitmaskUtils';

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
  selectedTiles: Set<number>,
  lockedTilesMask: bigint,
  lockableTiles: ReadonlySet<number>
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

    // Add lock state checks
    const isLocked = isTileLocked(lockedTilesMask, hex.id);
    const isLockable = lockableTiles.has(hex.id);

    let fillColor = Config.DEFAULT_COLOR;
    let strokeColor = Config.STROKE_COLOR_DEFAULT;
    let lineWidth = 1;

    // Apply base styles based on lock state first
    let shouldDrawLockIcon = false; // Flag to draw icon after hex
    if (isLocked) {
      // Keep default fill/stroke, but flag to draw icon
      shouldDrawLockIcon = true;
      fillColor = Config.DEFAULT_COLOR; // Ensure default fill
      strokeColor = Config.STROKE_COLOR_DEFAULT; // Ensure default stroke
      lineWidth = 1;
    } else if (isLockable) {
      // Lockable but not locked: Keep default fill, indicate with border
      strokeColor = Config.LOCKABLE_BORDER_COLOR; // Use the defined lockable border color
      lineWidth = 1.5; // Slightly thicker border
    }

    // Override with solution/selection/hover styles
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

    // Draw lock icon on top if needed
    if (shouldDrawLockIcon) {
      drawLockIcon(ctx, pixel.x, pixel.y, Config.HEX_SIZE * 0.4); // Draw icon at 40% of hex size
    }
  });

  ctx.restore();
};

export const drawLockIcon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number // Overall size of the icon
) => {
  const bodyHeight = size * 0.6;
  const bodyWidth = size * 0.7;
  const handleRadius = size * 0.3;
  const handleThickness = size * 0.12;
  const handleTop = cy - size * 0.5;
  const bodyTop = cy - size * 0.1;

  ctx.save();
  ctx.fillStyle = Config.LOCKED_ICON_COLOR; // Use a defined color
  ctx.strokeStyle = Config.STROKE_COLOR_ACTIVE; // Use active stroke for visibility
  ctx.lineWidth = size * 0.08; // Relative line width

  // Draw Body (rectangle)
  ctx.fillRect(cx - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
  ctx.strokeRect(cx - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);

  // Draw Handle (arc)
  ctx.beginPath();
  ctx.arc(cx, handleTop + handleRadius, handleRadius, Math.PI, 0); // Outer arc
  ctx.stroke();
  // Optionally add inner arc for thickness, but might be too small

  ctx.restore();
};

// Define preview grid colors locally if not in config
const PREVIEW_GRID_BG_COLOR = 'rgba(100, 116, 139, 0.1)'; // Faint slate-ish background
const PREVIEW_GRID_STROKE_COLOR = 'rgba(100, 116, 139, 0.2)'; // Slightly darker stroke

export const drawPreviewGrid = (
  canvas: HTMLCanvasElement,
  shape: string,
  colorIndex: number,
  sizeRatio: number = 0.7,
  fillColorOverride?: string, // Optional: Override fill color
  hideGrid?: boolean         // Optional: Hide background grid
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Get tile coordinates and IDs
  const tiles = shape.split("").map(Number);
  const shapeCoords: { q: number; r: number }[] = [];
  const tileIds: number[] = []; // Store the Tile IDs
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 1) {
      // Find the hex data by matching the ID, don't assume array index matches ID
      const tileId = i + 1;
      const hex = Config.HEX_GRID_COORDS.find(h => h.id === tileId);
      
      if (hex) {
        shapeCoords.push({ q: hex.q, r: hex.r });
        tileIds.push(hex.id); // Add the ID
      }
    }
  }

  if (shapeCoords.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // --- Calculate Pixel Bounding Box & Optimal Scale ---
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const shapePixels: Point[] = [];
  shapeCoords.forEach((coord) => {
    const pixel = axialToPixel(coord.q, coord.r);
    if (pixel) {
      shapePixels.push(pixel);
      // Consider the hexagon's extent
      minX = Math.min(minX, pixel.x - Config.HEX_SIZE);
      maxX = Math.max(maxX, pixel.x + Config.HEX_SIZE);
      minY = Math.min(minY, pixel.y - Config.HEX_HEIGHT / 2);
      maxY = Math.max(maxY, pixel.y + Config.HEX_HEIGHT / 2);
    }
  });

  if (shapePixels.length === 0) return;

  const shapePixelWidth = maxX - minX;
  const shapePixelHeight = maxY - minY;

  const margin = 0.9; // Use 90% of canvas space
  let calculatedSizeRatio = 1.0;
  if (shapePixelWidth > 0 && shapePixelHeight > 0) { // Avoid division by zero
      const ratioX = (canvas.width * margin) / shapePixelWidth;
      const ratioY = (canvas.height * margin) / shapePixelHeight;
      calculatedSizeRatio = Math.min(ratioX, ratioY, 1.0); // Don't scale up beyond 1.0
  }
  
  const scaledHexSize = Config.HEX_SIZE * calculatedSizeRatio;

  // Calculate the *original* center of the shape's bounding box
  const originalCenterX = minX + shapePixelWidth / 2;
  const originalCenterY = minY + shapePixelHeight / 2;

  // Calculate the target center of the canvas
  const targetCenterX = canvas.width / 2;
  const targetCenterY = canvas.height / 2;
  // --- End Bounding Box Calculation ---

  // --- Clear Canvas --- 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // --- No context scaling or translation needed now --- 

  // --- Background Grid (Optional) --- 
  // NOTE: Drawing background grid is complex without context scaling.
  // Consider omitting it or calculating each background hex position similarly.
  // For now, skipping background grid if hideGrid=false in this mode.
  if (!hideGrid) {
      // TODO: Implement background grid drawing without context scaling if needed.
      // console.warn("Background grid drawing not implemented for this preview mode.");
  }
  // ----------------------------------

  // --- Draw Shape Tiles --- 
  const fillColor = fillColorOverride ?? Config.HEX_COLORS[colorIndex % Config.HEX_COLORS.length];

  shapePixels.forEach((originalPixel) => {
    // Calculate position relative to original bounding box center
    const relativeX = originalPixel.x - originalCenterX;
    const relativeY = originalPixel.y - originalCenterY;

    // Calculate final draw position: scale relative pos and add target center
    const drawX = targetCenterX + relativeX * calculatedSizeRatio;
    const drawY = targetCenterY + relativeY * calculatedSizeRatio;

    // Draw the hexagon at the calculated scaled position and size
    drawHexagon(
      ctx,
      drawX, 
      drawY, 
      scaledHexSize, // Use calculated scaled size
      fillColor,
      1, // Standard line width
      Config.STROKE_COLOR_ACTIVE // Force more opaque stroke for previews
    );
  });
  // -----------------------

  // No ctx.restore() needed as we didn't save/transform
};

export const tileSetToShapeString = (tileSet: Set<number>): string => {
  let shapeString = "";
  for (let i = 1; i <= Config.TOTAL_TILES; i++) {
    shapeString += tileSet.has(i) ? "1" : "0";
  }
  return shapeString;
}; 