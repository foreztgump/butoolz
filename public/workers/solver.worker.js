/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./app/shapedoctor/bitmaskUtils.ts":
/*!*****************************************!*\
  !*** ./app/shapedoctor/bitmaskUtils.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FULL_GRID_MASK: () => (/* binding */ FULL_GRID_MASK),
/* harmony export */   TOTAL_TILES: () => (/* binding */ TOTAL_TILES),
/* harmony export */   bitmaskToTileIds: () => (/* binding */ bitmaskToTileIds),
/* harmony export */   clearTileLock: () => (/* binding */ clearTileLock),
/* harmony export */   countSetBits: () => (/* binding */ countSetBits),
/* harmony export */   findLowestSetBitIndex: () => (/* binding */ findLowestSetBitIndex),
/* harmony export */   generateUniqueOrientations: () => (/* binding */ generateUniqueOrientations),
/* harmony export */   getCanonicalShape: () => (/* binding */ getCanonicalShape),
/* harmony export */   isGridFull: () => (/* binding */ isGridFull),
/* harmony export */   isTileLocked: () => (/* binding */ isTileLocked),
/* harmony export */   isValidPlacement: () => (/* binding */ isValidPlacement),
/* harmony export */   placeShape: () => (/* binding */ placeShape),
/* harmony export */   reflectShapeBitmask: () => (/* binding */ reflectShapeBitmask),
/* harmony export */   removeShape: () => (/* binding */ removeShape),
/* harmony export */   rotateShapeBitmask: () => (/* binding */ rotateShapeBitmask),
/* harmony export */   setTileLock: () => (/* binding */ setTileLock),
/* harmony export */   shapeStringToBitmask: () => (/* binding */ shapeStringToBitmask),
/* harmony export */   toggleTileLock: () => (/* binding */ toggleTileLock),
/* harmony export */   translateShapeBitmask: () => (/* binding */ translateShapeBitmask)
/* harmony export */ });
/* harmony import */ var _shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shapedoctor.config */ "./app/shapedoctor/shapedoctor.config.ts");
/**
 * Utility functions for working with bigint bitmasks representing the hexagonal grid state.
 *
 * Grid Mapping Convention:
 * - The grid state and shape placements are represented by BigInt values.
 * - Bit `i` (0-indexed, value `1n << BigInt(i)`) corresponds to the hexagonal tile
 *   with `id: i + 1` as defined in `shapedoctor.config.ts::HEX_GRID_COORDS`.
 * - This mapping utilizes bits 0 through 43 (inclusive) for the 44 grid tiles.
 */
// Ensure import is extensionless for bundler resolution

// Export TOTAL_TILES for use in tests
const TOTAL_TILES = _shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__.TOTAL_TILES;
// Helper map for quick lookup of tile ID by axial coordinates
const coordToIdMap = new Map();
_shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__.HEX_GRID_COORDS.forEach((coord) => {
    coordToIdMap.set(`${coord.q},${coord.r}`, coord.id);
});
/**
 * Calculates the axial coordinates after a 60-degree clockwise rotation.
 * Rotation transformation: (q, r, s) -> (-s, -q, -r)
 * Since s = -q - r, this becomes q' = -(-q-r) = q+r, r' = -q
 *
 * @param q - The initial q coordinate.
 * @param r - The initial r coordinate.
 * @returns The rotated { q, r } coordinates.
 */
const rotate60ClockwiseCoords = (q, r) => {
    const q_new = q + r;
    const r_new = -q;
    return { q: q_new, r: r_new };
};
/**
 * Converts a 44-character string representation of a shape ('1' for occupied, '0' for empty)
 * into its bigint bitmask representation based on the standard grid mapping.
 *
 * @param shapeString - The 44-character string representation.
 * @returns The bigint bitmask representation of the shape.
 * @throws Error if the shapeString length is not equal to TOTAL_TILES (44).
 */
const shapeStringToBitmask = (shapeString) => {
    if (shapeString.length !== TOTAL_TILES) {
        throw new Error(`Invalid shape string length: expected ${TOTAL_TILES}, got ${shapeString.length}`);
    }
    let bitmask = 0n;
    for (let i = 0; i < TOTAL_TILES; i++) {
        if (shapeString[i] === '1') {
            // Set the i-th bit (corresponding to tile id i+1)
            bitmask |= 1n << BigInt(i);
        }
    }
    return bitmask;
};
/**
 * Checks if placing a shape (represented by its bitmask) onto the current grid state
 * is valid (i.e., does not overlap with already occupied tiles).
 *
 * @param gridState - The current state of the grid as a bigint bitmask.
 * @param shapePlacement - The bitmask representing the shape's intended placement on the grid.
 * @returns True if the placement is valid (no overlaps), false otherwise.
 */
const isValidPlacement = (gridState, shapePlacement) => {
    // Placement is valid if there are no overlapping bits between the grid and the shape.
    return (gridState & shapePlacement) === 0n;
};
/**
 * Adds a shape placement to the grid state.
 *
 * @param gridState - The current grid state bitmask.
 * @param shapePlacement - The bitmask of the shape to place.
 * @returns The new grid state bitmask with the shape added.
 */
const placeShape = (gridState, shapePlacement) => {
    // Use bitwise OR to add the shape's bits to the grid state.
    return gridState | shapePlacement;
};
/**
 * Removes a shape placement from the grid state.
 *
 * @param gridState - The current grid state bitmask.
 * @param shapePlacement - The bitmask of the shape to remove.
 * @returns The new grid state bitmask with the shape removed.
 */
const removeShape = (gridState, shapePlacement) => {
    // Use bitwise AND with the complement of the shape mask to remove its bits.
    return gridState & ~shapePlacement;
};
/**
 * A bigint bitmask representing a completely full grid (all 44 tiles occupied).
 * Calculated as (1n << 44n) - 1n.
 */
const FULL_GRID_MASK = (1n << BigInt(TOTAL_TILES)) - 1n;
/**
 * Checks if the grid is completely full based on its bitmask representation.
 *
 * @param gridState - The current grid state bitmask.
 * @returns True if all 44 tiles are occupied, false otherwise.
 */
const isGridFull = (gridState) => {
    return gridState === FULL_GRID_MASK;
};
/**
 * Rotates a shape bitmask 60 degrees clockwise.
 *
 * @param shapeMask - The bitmask of the shape to rotate.
 * @returns The bitmask of the rotated shape, or 0n if rotation results in invalid coordinates.
 */
const rotateShapeBitmask = (shapeMask) => {
    let rotatedMask = 0n;
    for (const coord of _shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__.HEX_GRID_COORDS) {
        const bitPosition = BigInt(coord.id - 1);
        // Check if the current tile is part of the shape
        if ((shapeMask & (1n << bitPosition)) !== 0n) {
            // Calculate rotated coordinates
            const { q: rotQ, r: rotR } = rotate60ClockwiseCoords(coord.q, coord.r);
            // Find the ID of the tile at the rotated coordinates
            const rotatedId = coordToIdMap.get(`${rotQ},${rotR}`);
            // If the rotated coordinate is valid and exists on the grid
            if (rotatedId !== undefined) {
                const rotatedBitPosition = BigInt(rotatedId - 1);
                rotatedMask |= 1n << rotatedBitPosition;
            }
            // If rotated coordinate is off-grid, that part of the shape is lost (mask remains 0 for it)
        }
    }
    return rotatedMask;
};
/**
 * Calculates the axial coordinates after reflection across the q-axis (horizontal).
 * Reflection transformation: (q, r, s) -> (q, s, r)
 * Since s = -q - r, this becomes q' = q, r' = s = -q - r
 *
 * @param q - The initial q coordinate.
 * @param r - The initial r coordinate.
 * @returns The reflected { q, r } coordinates.
 */
const reflectQAxisCoords = (q, r) => {
    const q_new = q;
    const r_new = -q - r; // s = -q - r
    return { q: q_new, r: r_new };
};
/**
 * Reflects a shape bitmask across the q-axis (horizontal).
 *
 * @param shapeMask - The bitmask of the shape to reflect.
 * @returns The bitmask of the reflected shape, or 0n if reflection results in invalid coordinates.
 */
const reflectShapeBitmask = (shapeMask) => {
    let reflectedMask = 0n;
    for (const coord of _shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__.HEX_GRID_COORDS) {
        const bitPosition = BigInt(coord.id - 1);
        // Check if the current tile is part of the shape
        if ((shapeMask & (1n << bitPosition)) !== 0n) {
            // Calculate reflected coordinates
            const { q: refQ, r: refR } = reflectQAxisCoords(coord.q, coord.r);
            // Find the ID of the tile at the reflected coordinates
            const reflectedId = coordToIdMap.get(`${refQ},${refR}`);
            // If the reflected coordinate is valid and exists on the grid
            if (reflectedId !== undefined) {
                const reflectedBitPosition = BigInt(reflectedId - 1);
                reflectedMask |= 1n << reflectedBitPosition;
            }
            // If reflected coordinate is off-grid, that part of the shape is lost
        }
    }
    return reflectedMask;
};
/**
 * Generates all unique orientations (rotations and reflections) for a given shape bitmask.
 *
 * @param baseShapeMask - The bitmask of the base shape.
 * @returns A Set containing the bigint bitmasks of all unique orientations.
 */
const generateUniqueOrientations = (baseShapeMask) => {
    const uniqueOrientations = new Set();
    let currentMask = baseShapeMask;
    // Add the base shape and its 5 rotations
    for (let i = 0; i < 6; i++) {
        if (currentMask !== 0n) { // Avoid adding empty masks if shape rotates off-grid
            uniqueOrientations.add(currentMask);
        }
        currentMask = rotateShapeBitmask(currentMask);
    }
    // Reflect the base shape and add its 6 rotations
    currentMask = reflectShapeBitmask(baseShapeMask);
    for (let i = 0; i < 6; i++) {
        if (currentMask !== 0n) { // Avoid adding empty masks
            uniqueOrientations.add(currentMask);
        }
        currentMask = rotateShapeBitmask(currentMask);
    }
    return uniqueOrientations;
};
/**
 * Finds the canonical representation of a shape.
 * The canonical form is defined as the orientation with the smallest bigint value
 * among all possible unique rotations and reflections.
 *
 * @param shapeMask - The bitmask of any orientation of the shape.
 * @returns The bigint bitmask of the canonical orientation, or 0n if the input mask is 0n.
 */
const getCanonicalShape = (shapeMask) => {
    if (shapeMask === 0n) {
        return 0n;
    }
    const orientations = generateUniqueOrientations(shapeMask);
    let canonicalMask = -1n; // Use -1n as an initial value guaranteed to be replaced
    for (const mask of orientations) {
        if (canonicalMask === -1n || mask < canonicalMask) {
            canonicalMask = mask;
        }
    }
    // Should theoretically always find a mask if input wasn't 0n, but handle edge case.
    return canonicalMask === -1n ? 0n : canonicalMask;
};
/**
 * Converts a bigint bitmask representation back into an array of tile IDs.
 *
 * @param bitmask - The bigint bitmask.
 * @returns An array of tile IDs (1-based) corresponding to the set bits.
 */
const bitmaskToTileIds = (bitmask) => {
    const tileIds = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
        if ((bitmask & (1n << BigInt(i))) !== 0n) {
            tileIds.push(i + 1); // Tile ID is bit position + 1
        }
    }
    return tileIds;
};
/**
 * Finds the index (0-based) of the lowest set bit (least significant bit) in a bigint mask.
 * Corresponds to the smallest tile ID (id = index + 1) in the shape mask.
 *
 * @param mask - The bigint mask.
 * @returns The 0-based index of the lowest set bit, or -1 if the mask is 0n.
 */
const findLowestSetBitIndex = (mask) => {
    if (mask === 0n) {
        return -1;
    }
    let index = 0;
    while ((mask & (1n << BigInt(index))) === 0n) {
        index++;
        // Add a safeguard against infinite loops, though theoretically unnecessary if mask !== 0n
        if (index > TOTAL_TILES)
            return -1; // Should not happen for valid shape masks
    }
    return index;
};
/**
 * Translates a shape bitmask based on a delta in axial coordinates.
 *
 * @param shapeMask - The bitmask of the shape to translate.
 * @param deltaQ - The change in the q coordinate.
 * @param deltaR - The change in the r coordinate.
 * @returns The bitmask of the translated shape, or 0n if translation results in invalid coordinates.
 */
const translateShapeBitmask = (shapeMask, deltaQ, deltaR) => {
    let translatedMask = 0n;
    for (const coord of _shapedoctor_config__WEBPACK_IMPORTED_MODULE_0__.HEX_GRID_COORDS) {
        const bitPosition = BigInt(coord.id - 1);
        // Check if the current tile is part of the shape
        if ((shapeMask & (1n << bitPosition)) !== 0n) {
            // Calculate translated coordinates
            const q_trans = coord.q + deltaQ;
            const r_trans = coord.r + deltaR;
            // Find the ID of the tile at the translated coordinates
            const translatedId = coordToIdMap.get(`${q_trans},${r_trans}`);
            // If the translated coordinate is valid and exists on the grid
            if (translatedId !== undefined) {
                const translatedBitPosition = BigInt(translatedId - 1);
                translatedMask |= 1n << translatedBitPosition;
            }
            // If translated coordinate is off-grid, that part of the shape is lost
        }
    }
    return translatedMask;
};
/**
 * Counts the number of set bits (1s) in a bigint bitmask.
 *
 * @param mask - The bigint mask.
 * @returns The number of set bits.
 */
const countSetBits = (mask) => {
    let count = 0;
    let tempMask = mask;
    while (tempMask > 0n) {
        // Check the least significant bit
        if ((tempMask & 1n) === 1n) {
            count++;
        }
        // Right shift the mask by 1
        tempMask >>= 1n;
    }
    return count;
};
/**
 * Sets the bit corresponding to a specific tile ID in the mask (locks the tile).
 *
 * @param mask - The current bitmask.
 * @param tileId - The 1-based ID of the tile to lock.
 * @returns The new bitmask with the specified tile's bit set.
 */
const setTileLock = (mask, tileId) => {
    if (tileId < 1 || tileId > TOTAL_TILES) {
        console.warn(`Attempted to set lock for invalid tile ID: ${tileId}`);
        return mask;
    }
    const bitPosition = BigInt(tileId - 1);
    return mask | (1n << bitPosition);
};
/**
 * Clears the bit corresponding to a specific tile ID in the mask (unlocks the tile).
 *
 * @param mask - The current bitmask.
 * @param tileId - The 1-based ID of the tile to unlock.
 * @returns The new bitmask with the specified tile's bit cleared.
 */
const clearTileLock = (mask, tileId) => {
    if (tileId < 1 || tileId > TOTAL_TILES) {
        console.warn(`Attempted to clear lock for invalid tile ID: ${tileId}`);
        return mask;
    }
    const bitPosition = BigInt(tileId - 1);
    return mask & ~(1n << bitPosition);
};
/**
 * Toggles the bit corresponding to a specific tile ID in the mask.
 *
 * @param mask - The current bitmask.
 * @param tileId - The 1-based ID of the tile to toggle.
 * @returns The new bitmask with the specified tile's bit toggled.
 */
const toggleTileLock = (mask, tileId) => {
    if (tileId < 1 || tileId > TOTAL_TILES) {
        console.warn(`Attempted to toggle lock for invalid tile ID: ${tileId}`);
        return mask;
    }
    const bitPosition = BigInt(tileId - 1);
    return mask ^ (1n << bitPosition);
};
/**
 * Checks if a specific tile is locked (bit is set) in the mask.
 *
 * @param mask - The current bitmask.
 * @param tileId - The 1-based ID of the tile to check.
 * @returns True if the tile is locked, false otherwise.
 */
const isTileLocked = (mask, tileId) => {
    if (tileId < 1 || tileId > TOTAL_TILES) {
        console.warn(`Attempted to check lock status for invalid tile ID: ${tileId}`);
        return false; // Or throw an error, depending on desired behavior
    }
    const bitPosition = BigInt(tileId - 1);
    return (mask & (1n << bitPosition)) !== 0n;
};
// Add other bitmask utility functions here in subsequent tasks... 


/***/ }),

/***/ "./app/shapedoctor/shapedoctor.config.ts":
/*!***********************************************!*\
  !*** ./app/shapedoctor/shapedoctor.config.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ADJACENT_LIST: () => (/* binding */ ADJACENT_LIST),
/* harmony export */   CANVAS_BG_DARK: () => (/* binding */ CANVAS_BG_DARK),
/* harmony export */   DEFAULT_COLOR: () => (/* binding */ DEFAULT_COLOR),
/* harmony export */   HEX_COLORS: () => (/* binding */ HEX_COLORS),
/* harmony export */   HEX_GRID_COORDS: () => (/* binding */ HEX_GRID_COORDS),
/* harmony export */   HEX_HEIGHT: () => (/* binding */ HEX_HEIGHT),
/* harmony export */   HEX_SIZE: () => (/* binding */ HEX_SIZE),
/* harmony export */   HEX_WIDTH: () => (/* binding */ HEX_WIDTH),
/* harmony export */   HOVER_COLOR: () => (/* binding */ HOVER_COLOR),
/* harmony export */   LOCKABLE_BORDER_COLOR: () => (/* binding */ LOCKABLE_BORDER_COLOR),
/* harmony export */   LOCKED_COLOR: () => (/* binding */ LOCKED_COLOR),
/* harmony export */   LOCKED_ICON_COLOR: () => (/* binding */ LOCKED_ICON_COLOR),
/* harmony export */   MAX_ZOOM: () => (/* binding */ MAX_ZOOM),
/* harmony export */   MIN_ZOOM: () => (/* binding */ MIN_ZOOM),
/* harmony export */   PAN_SENSITIVITY: () => (/* binding */ PAN_SENSITIVITY),
/* harmony export */   PREDEFINED_SHAPES: () => (/* binding */ PREDEFINED_SHAPES),
/* harmony export */   PREVIEW_BG: () => (/* binding */ PREVIEW_BG),
/* harmony export */   SELECTED_COLOR: () => (/* binding */ SELECTED_COLOR),
/* harmony export */   STROKE_COLOR_ACTIVE: () => (/* binding */ STROKE_COLOR_ACTIVE),
/* harmony export */   STROKE_COLOR_DEFAULT: () => (/* binding */ STROKE_COLOR_DEFAULT),
/* harmony export */   TOTAL_TILES: () => (/* binding */ TOTAL_TILES),
/* harmony export */   ZOOM_SENSITIVITY: () => (/* binding */ ZOOM_SENSITIVITY)
/* harmony export */ });
// --- Constants & Config ---\
const TOTAL_TILES = 44;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1;
// Colors and Styles
const HEX_COLORS = [
    "#8B5CF6",
    "#0D9488",
    "#DB2777",
    "#D97706",
    "#65A30D",
    "#0284C7",
];
const DEFAULT_COLOR = "#374151"; // gray-700
const SELECTED_COLOR = "#A78BFA"; // violet-400
const HOVER_COLOR = "#4B5563"; // gray-600
const STROKE_COLOR_DEFAULT = "hsl(210 40% 96.1% / 0.4)";
const STROKE_COLOR_ACTIVE = "hsl(210 40% 96.1% / 0.9)";
const CANVAS_BG_DARK = "dark:bg-gray-900";
const PREVIEW_BG = "bg-background";
const HEX_SIZE = 30;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const HEX_WIDTH = 2 * HEX_SIZE;
// Add new colors for locked/lockable states
const LOCKED_COLOR = "hsl(210 10% 30% / 0.6)"; // Semi-transparent dark gray
const LOCKABLE_BORDER_COLOR = "hsl(200 90% 60% / 0.8)"; // Distinct blue (No longer used in drawHexGrid)
const LOCKED_ICON_COLOR = "hsl(210 40% 96.1% / 0.8)"; // Light gray/white for icon on dark hex
// User-provided list of predefined shapes
const PREDEFINED_SHAPES = [
    '11101000000000000000000000000000000000000000',
    '11010010000000000000000000000000000000000000',
    '11010001000000000000000000000000000000000000',
    '11010000001000000000000000000000000000000000',
    '11001001000000000000000000000000000000000000',
    '11001000100000000000000000000000000000000000',
    '11001000000100000000000000000000000000000000',
    '11000001001000000000000000000000000000000000',
    '11000001000100000000000000000000000000000000',
    '10101001000000000000000000000000000000000000',
    '10101000100000000000000000000000000000000000',
    '10101000000100000000000000000000000000000000',
    '10100100100000000000000000000000000000000000',
    '10100100010000000000000000000000000000000000',
    '10100100000010000000000000000000000000000000',
    '10100000100100000000000000000000000000000000',
    '10100000100010000000000000000000000000000000',
    '10011001000000000000000000000000000000000000',
    '10001100100000000000000000000000000000000000',
    '10001001001000000000000000000000000000000000',
    '10001001000100000000000000000000000000000000',
    '10001000100100000000000000000000000000000000',
    '10001000100010000000000000000000000000000000',
    '10001000000100010000000000000000000000000000',
    '01101100000000000000000000000000000000000000',
    '01101001000000000000000000000000000000000000',
    '01101000100000000000000000000000000000000000',
    '01010011000000000000000000000000000000000000',
    '01001100100000000000000000000000000000000000',
    '01001001100000000000000000000000000000000000',
    '00111001000000000000000000000000000000000000',
];
// Updated based on the 44-tile image layout - CORRECTED
const HEX_GRID_COORDS = [
    { id: 1, q: 0, r: -3 },
    { id: 2, q: -1, r: -2 }, { id: 3, q: 1, r: -3 },
    { id: 4, q: -2, r: -1 }, { id: 5, q: 0, r: -2 }, { id: 6, q: 2, r: -3 },
    { id: 7, q: -3, r: 0 }, { id: 8, q: -1, r: -1 }, { id: 9, q: 1, r: -2 }, { id: 10, q: 3, r: -3 },
    { id: 11, q: -2, r: 0 }, { id: 12, q: 0, r: -1 }, { id: 13, q: 2, r: -2 }, { id: 17, q: 3, r: -2 },
    { id: 14, q: -3, r: 1 }, { id: 15, q: -1, r: 0 }, { id: 16, q: 1, r: -1 }, { id: 20, q: 2, r: -1 }, { id: 24, q: 3, r: -1 },
    { id: 18, q: -2, r: 1 }, { id: 19, q: 0, r: 0 }, { id: 22, q: -1, r: 1 }, { id: 23, q: 1, r: 0 }, { id: 27, q: 2, r: 0 }, { id: 31, q: 3, r: 0 },
    { id: 21, q: -3, r: 2 }, { id: 25, q: -2, r: 2 }, { id: 26, q: 0, r: 1 }, { id: 29, q: -1, r: 2 }, { id: 30, q: 1, r: 1 }, { id: 34, q: 2, r: 1 }, { id: 38, q: 3, r: 1 },
    { id: 28, q: -3, r: 3 }, { id: 32, q: -2, r: 3 }, { id: 33, q: 0, r: 2 }, { id: 36, q: -1, r: 3 }, { id: 37, q: 1, r: 2 }, { id: 41, q: 2, r: 2 },
    { id: 35, q: -3, r: 4 }, { id: 39, q: -2, r: 4 }, { id: 40, q: 0, r: 3 }, { id: 42, q: -1, r: 4 }, { id: 43, q: 1, r: 3 }, { id: 44, q: 0, r: 4 }
];
// IMPORTANT: The solver worker (solver.worker.ts) likely needs this updated list too!
// Corrected based on coordinate validation script
const ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0], // 0 (padding)
    [2, 3, 5, 0, 0, 0], // 1
    [1, 4, 5, 8, 0, 0], // 2
    [1, 5, 6, 9, 0, 0], // 3
    [2, 7, 8, 11, 0, 0], // 4
    [1, 2, 3, 8, 9, 12], // 5
    [3, 9, 10, 13, 0, 0], // 6
    [4, 11, 14, 0, 0, 0], // 7
    [2, 4, 5, 11, 12, 15], // 8
    [3, 5, 6, 12, 13, 16], // 9
    [6, 13, 17, 0, 0, 0], // 10
    [4, 7, 8, 14, 15, 18], // 11
    [5, 8, 9, 15, 16, 19], // 12
    [6, 9, 10, 16, 17, 20], // 13
    [7, 11, 18, 21, 0, 0], // 14
    [8, 11, 12, 18, 19, 22], // 15
    [9, 12, 13, 19, 20, 23], // 16
    [10, 13, 20, 24, 0, 0], // 17
    [11, 14, 15, 21, 22, 25], // 18
    [12, 15, 16, 22, 23, 26], // 19
    [13, 16, 17, 23, 24, 27], // 20
    [14, 18, 25, 28, 0, 0], // 21
    [15, 18, 19, 25, 26, 29], // 22
    [16, 19, 20, 26, 27, 30], // 23
    [17, 20, 27, 31, 0, 0], // 24
    [18, 21, 22, 28, 29, 32], // 25
    [19, 22, 23, 29, 30, 33], // 26
    [20, 23, 24, 30, 31, 34], // 27
    [21, 25, 32, 35, 0, 0], // 28
    [22, 25, 26, 32, 33, 36], // 29
    [23, 26, 27, 33, 34, 37], // 30
    [24, 27, 34, 38, 0, 0], // 31
    [25, 28, 29, 35, 36, 39], // 32
    [26, 29, 30, 36, 37, 40], // 33
    [27, 30, 31, 37, 38, 41], // 34
    [28, 32, 39, 0, 0, 0], // 35
    [29, 32, 33, 39, 40, 42], // 36
    [30, 33, 34, 40, 41, 43], // 37
    [31, 34, 41, 0, 0, 0], // 38
    [32, 35, 36, 42, 0, 0], // 39
    [33, 36, 37, 42, 43, 44], // 40
    [34, 37, 38, 43, 0, 0], // 41
    [36, 39, 40, 44, 0, 0], // 42
    [37, 40, 41, 44, 0, 0], // 43
    [40, 42, 43, 0, 0, 0] // 44
];


/***/ }),

/***/ "./app/shapedoctor/solver.dlx.ts":
/*!***************************************!*\
  !*** ./app/shapedoctor/solver.dlx.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   findExactKTilingSolutions: () => (/* binding */ findExactKTilingSolutions),
/* harmony export */   findMaximalPlacement: () => (/* binding */ findMaximalPlacement)
/* harmony export */ });
/* harmony import */ var dancing_links__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dancing-links */ "./node_modules/dancing-links/built/lib/index.js");
/* harmony import */ var _bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bitmaskUtils */ "./app/shapedoctor/bitmaskUtils.ts");
/* harmony import */ var _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapedoctor.config */ "./app/shapedoctor/shapedoctor.config.ts");
// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT K-shape tilings using dancing-links.
// import * as dlxlib from 'dlxlib'; // Old library
// import * as dlx from 'dlx'; // Previous library
 // Use the new library

 // REMOVE .js
 // REMOVE .js
;
// --- Matrix Generation for dancing-links ---
// Ensure return type matches SimpleConstraint<PlacementRecord>[]
const buildDancingLinksConstraints = (allShapeData, // Use local type
shapesToTileWith, // Use local type
initialGridState, lockedTilesMask) => {
    console.log("[DLX] Starting buildDancingLinksConstraints...");
    // Calculate available tiles
    const availableTiles = new Set();
    for (let i = 1; i <= _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.TOTAL_TILES; i++) {
        if (!((lockedTilesMask >> BigInt(i - 1)) & 1n)) { // Check if the bit for tile i is NOT set in lockedTilesMask
            availableTiles.add(i);
        }
    }
    const availableTileCount = availableTiles.size;
    if (availableTileCount === 0) {
        console.log("[DLX] No available tiles for constraints.");
        return { constraints: [], columnCount: 0 };
    }
    const constraints = [];
    const columnIndexMap = new Map();
    let currentColumnIndex = 0;
    // --- Define Column Indices --- 
    // 1. The K Shapes (Primary Items)
    for (const shape of shapesToTileWith) {
        const colName = `shape_${shape.id}`; // Use prefix to avoid collision
        columnIndexMap.set(colName, currentColumnIndex++);
    }
    // 2. The Available Tiles (Primary Items)
    for (const tileId of availableTiles) {
        // Check if the available tile is already occupied initially
        if (((initialGridState >> BigInt(tileId - 1)) & 1n)) {
            throw new Error(`Cannot find exact tiling: Available Tile ${tileId} is initially occupied.`);
        }
        const colName = `tile_${tileId}`;
        columnIndexMap.set(colName, currentColumnIndex++);
    }
    const numColumns = currentColumnIndex; // Total number of primary items
    // --- Define Rows (Constraints) --- 
    for (const shape of shapesToTileWith) {
        const shapeData = allShapeData.get(shape.id);
        if (!shapeData || !shapeData.validPlacements)
            continue;
        const shapeColName = `shape_${shape.id}`;
        const shapeColIndex = columnIndexMap.get(shapeColName);
        for (const placementMask of shapeData.validPlacements) {
            if ((initialGridState & placementMask) === 0n) {
                const coveredTileIds = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.bitmaskToTileIds)(placementMask);
                let allCoveredTilesAvailable = true;
                for (const tileId of coveredTileIds) {
                    const tileColName = `tile_${tileId}`;
                    if (!columnIndexMap.has(tileColName)) {
                        allCoveredTilesAvailable = false;
                        break;
                    }
                }
                if (allCoveredTilesAvailable) {
                    const row = new Array(numColumns).fill(0);
                    // 1. Set the shape column
                    row[shapeColIndex] = 1;
                    // 2. Set the covered tile columns
                    for (const tileId of coveredTileIds) {
                        const tileColName = `tile_${tileId}`;
                        const tileColIndex = columnIndexMap.get(tileColName);
                        row[tileColIndex] = 1;
                    }
                    // Add the constraint object to the list
                    constraints.push({
                        data: { shapeId: shape.id, placementMask }, // Store original data
                        row: row // Assign the correctly typed row
                    });
                }
            }
        }
    }
    console.log(`[Dancing Links] Built ${constraints.length} constraints for ${numColumns} items (${shapesToTileWith.length} shapes, ${availableTileCount} available tiles).`);
    console.log("[DLX] Finished buildDancingLinksConstraints.");
    return { constraints, columnCount: numColumns };
};
// --- Function: findMaximalPlacement ---
const findMaximalPlacement = (shapeDataMap, initialGridStateBigint, allShapes) => {
    try {
        // 1. Define Columns (Items)
        const tileColumns = []; // Names of available tile columns (Primary)
        const shapeColumns = []; // Names of shape columns (Secondary)
        const tileNameToPrimaryIndex = new Map();
        const shapeNameToSecondaryIndex = new Map();
        let primaryIndexCounter = 0;
        let secondaryIndexCounter = 0;
        // Add Tile Columns (Primary)
        for (let i = 0; i < _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.TOTAL_TILES; i++) {
            if (!((initialGridStateBigint >> BigInt(i)) & 1n)) {
                const tileName = `T${i}`;
                tileColumns.push(tileName);
                tileNameToPrimaryIndex.set(tileName, primaryIndexCounter++);
            }
        }
        const numPrimaryColumns = tileColumns.length;
        if (numPrimaryColumns === 0) {
            console.log("[findMaximalPlacement] No available tiles based on initialGridState. Returning empty solution.");
            return { maxShapes: 0, solutions: [] };
        }
        // Add Shape Columns (Secondary)
        allShapes.forEach(shape => {
            const shapeName = `S${shape.id}`;
            shapeColumns.push(shapeName);
            shapeNameToSecondaryIndex.set(shapeName, secondaryIndexCounter++);
        });
        const numSecondaryColumns = shapeColumns.length;
        console.log(`[findMaximalPlacement] Columns defined: ${numPrimaryColumns} Primary (Tiles), ${numSecondaryColumns} Secondary (Shapes)`);
        // 2. Define Options (Rows for the DLX matrix)
        const dlxOptions = [];
        for (const [shapeId, data] of shapeDataMap.entries()) {
            const shapeColName = `S${data.id}`;
            const secondaryShapeIndex = shapeNameToSecondaryIndex.get(shapeColName);
            if (secondaryShapeIndex === undefined) {
                console.warn(`[findMaximalPlacement] Shape ID ${data.id} from shapeDataMap not found in secondary columns. Skipping.`);
                continue;
            }
            for (const placementMask of data.validPlacements) {
                if (placementMask !== 0n && (placementMask & initialGridStateBigint) === 0n) {
                    const placementData = {
                        shapeId: data.id,
                        placementMask: placementMask
                    };
                    // Create sparse arrays for primary and secondary rows
                    const primaryRowArray = new Array(numPrimaryColumns).fill(0);
                    const secondaryRowArray = new Array(numSecondaryColumns).fill(0);
                    let placementIsValidForCurrentColumns = true;
                    let coveredPrimaryIndicesCount = 0;
                    for (const tileId of (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.bitmaskToTileIds)(placementMask)) {
                        const tileName = `T${tileId}`;
                        const primaryTileIndex = tileNameToPrimaryIndex.get(tileName);
                        if (primaryTileIndex !== undefined) {
                            primaryRowArray[primaryTileIndex] = 1;
                            coveredPrimaryIndicesCount++;
                        }
                        else {
                            // This placement covers a tile that is already occupied by initialGridState
                            placementIsValidForCurrentColumns = false;
                            break;
                        }
                    }
                    if (!placementIsValidForCurrentColumns || coveredPrimaryIndicesCount === 0) {
                        continue; // Skip if placement hits occupied tile or covers no available primary columns
                    }
                    // Set the secondary column (shape)
                    secondaryRowArray[secondaryShapeIndex] = 1;
                    dlxOptions.push({
                        primaryRow: primaryRowArray, // Sparse array for primary columns (Tiles)
                        secondaryRow: secondaryRowArray, // Sparse array for secondary columns (Shapes)
                        data: placementData // Attach the PlacementRecord data
                    });
                }
            }
        }
        console.log(`[findMaximalPlacement] Built ${dlxOptions.length} options (constraints)`);
        if (dlxOptions.length === 0) {
            console.log("[findMaximalPlacement] No valid options generated. Returning empty solution.");
            return { maxShapes: 0, solutions: [] };
        }
        // 3. Run the DLX solver
        const solutionsRaw = (0,dancing_links__WEBPACK_IMPORTED_MODULE_0__.findAll)(dlxOptions);
        // 4. Process Results
        const finalSolutions = [];
        if (solutionsRaw && solutionsRaw.length > 0) {
            const maxPlaced = solutionsRaw.reduce((max, sol) => Math.max(max, sol.length), 0);
            // Note: maxPlaced here refers to the number of constraints (placements) in the solution,
            // which should correspond to the number of shapes placed.
            const maximalSolutions = solutionsRaw.filter(sol => sol.length === maxPlaced);
            maximalSolutions.forEach(solution => {
                let calculatedGridState = initialGridStateBigint;
                const placements = solution.map(item => {
                    const placementData = item.data;
                    calculatedGridState |= placementData.placementMask;
                    return placementData;
                });
                finalSolutions.push({
                    gridState: calculatedGridState,
                    placements: placements
                });
            });
            console.log(`[findMaximalPlacement] Found ${finalSolutions.length} maximal solutions placing ${maxPlaced} shapes.`);
            return { maxShapes: maxPlaced, solutions: finalSolutions };
        }
        else {
            console.log("[findMaximalPlacement] DLX solver returned no solutions.");
            return { maxShapes: 0, solutions: [] };
        }
    }
    catch (error) {
        console.error("Error in findMaximalPlacement:", error);
        return { maxShapes: 0, solutions: [], error: error.message || 'Unknown error' };
    }
};
// --- Function: findExactKTilingSolutions --- 
// Refactored version for exact cover with k specific shapes
function findExactKTilingSolutions(k, // Target number of shapes
shapeDataMap, // Precomputed placements for ALL potential shapes
_initialConstraints, // Marked unused
shapesToUse, // List of shapes TO USE for tiling (should have length k)
initialGridState = 0n, lockedTilesMask = 0n) {
    console.log(`[DLX findExactKTilingSolutions] Starting for k=${k}...`);
    const startTime = Date.now();
    try {
        // Build constraints using only the shapesToUse and available tiles
        console.log("[DLX findExactKTilingSolutions] Building constraints...");
        const { constraints, columnCount } = buildDancingLinksConstraints(shapeDataMap, shapesToUse, initialGridState, lockedTilesMask);
        if (constraints.length === 0 || columnCount === 0) {
            console.log("[DLX findExactKTilingSolutions] No constraints built, returning empty.");
            return { solutions: [] };
        }
        console.log(`[DLX findExactKTilingSolutions] Constraints built (${constraints.length} rows, ${columnCount} cols). Calling findOne...`);
        // Use findOne instead of findAll, still expect Result<PlacementRecord>[][]
        let dlxSolutions = [];
        try {
            // Call findOne - assumes it returns Result<PlacementRecord>[][] like findAll
            dlxSolutions = dancing_links__WEBPACK_IMPORTED_MODULE_0__.findOne(constraints);
        }
        catch (dlxError) {
            console.error("[DLX findExactKTilingSolutions] Error calling findOne:", dlxError);
            return { solutions: [], error: `DLX Solver Error: ${dlxError instanceof Error ? dlxError.message : String(dlxError)}` };
        }
        const endTime = Date.now();
        // Adjust logging for findOne result
        console.log(`[DLX findExactKTilingSolutions] findOne completed in ${endTime - startTime}ms. Found ${dlxSolutions.length} raw solution(s).`);
        // Convert the single dlx solution (if found) to SolutionRecord format
        const formattedSolutions = [];
        // Check if findOne returned at least one solution
        if (dlxSolutions && dlxSolutions.length > 0) {
            // Process only the first solution found by findOne
            const firstSolutionItems = dlxSolutions[0];
            const placements = firstSolutionItems.map(item => item.data);
            const finalGridState = placements.reduce((acc, p) => acc | p.placementMask, 0n);
            formattedSolutions.push({ gridState: finalGridState, placements });
        }
        console.log("[DLX findExactKTilingSolutions] Finished processing solution.");
        return { solutions: formattedSolutions }; // Return array containing 0 or 1 solution
    }
    catch (error) {
        const errorEndTime = Date.now();
        console.error("[DLX findExactKTilingSolutions] Error:", error);
        return {
            solutions: [],
            error: `Error in findExactKTilingSolutions: ${error instanceof Error ? error.message : String(error)} (Took ${errorEndTime - startTime}ms)`
        };
    }
}


/***/ }),

/***/ "./node_modules/dancing-links/built/lib/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/dancing-links/built/lib/index.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const index_1 = __webpack_require__(/*! ./lib/index */ "./node_modules/dancing-links/built/lib/lib/index.js");
const utils_1 = __webpack_require__(/*! ./lib/utils */ "./node_modules/dancing-links/built/lib/lib/utils.js");
function findAll(constraints) {
    return index_1.search(utils_1.getSearchConfig(Infinity, constraints));
}
exports.findAll = findAll;
function findOne(constraints) {
    return index_1.search(utils_1.getSearchConfig(1, constraints));
}
exports.findOne = findOne;
function find(constraints, numSolutions) {
    return index_1.search(utils_1.getSearchConfig(numSolutions, constraints));
}
exports.find = find;
function findRaw(config) {
    return index_1.search(config);
}
exports.findRaw = findRaw;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/dancing-links/built/lib/lib/index.js":
/*!***********************************************************!*\
  !*** ./node_modules/dancing-links/built/lib/lib/index.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * Knuth's Dancing Links
 * Original paper: https://arxiv.org/pdf/cs/0011047.pdf
 * Implementation ported from: https://github.com/shreevatsa/knuth-literate-programs/blob/master/programs/dance.pdf
 *
 * Code runs in a state machine in order to avoid recursion
 * and in order to work around the lack of `goto` in JS
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var SearchState;
(function (SearchState) {
    SearchState[SearchState["FORWARD"] = 0] = "FORWARD";
    SearchState[SearchState["ADVANCE"] = 1] = "ADVANCE";
    SearchState[SearchState["BACKUP"] = 2] = "BACKUP";
    SearchState[SearchState["RECOVER"] = 3] = "RECOVER";
    SearchState[SearchState["DONE"] = 4] = "DONE";
})(SearchState || (SearchState = {}));
function search(config) {
    const { numSolutions, numPrimary, numSecondary, rows } = config;
    const root = {};
    const colArray = [root];
    const nodeArray = [];
    const solutions = [];
    let currentSearchState = SearchState.FORWARD;
    let running = true;
    let level = 0;
    let choice = [];
    let bestCol;
    let currentNode;
    function readColumnNames() {
        // Skip root node
        let curColIndex = 1;
        for (let i = 0; i < numPrimary; i++) {
            const head = {};
            head.up = head;
            head.down = head;
            const column = {
                len: 0,
                head
            };
            column.prev = colArray[curColIndex - 1];
            colArray[curColIndex - 1].next = column;
            colArray[curColIndex] = column;
            curColIndex = curColIndex + 1;
        }
        const lastCol = colArray[curColIndex - 1];
        // Link the last primary constraint to wrap back into the root
        lastCol.next = root;
        root.prev = lastCol;
        for (let i = 0; i < numSecondary; i++) {
            const head = {};
            head.up = head;
            head.down = head;
            const column = {
                head,
                len: 0
            };
            column.prev = column;
            column.next = column;
            colArray[curColIndex] = column;
            curColIndex = curColIndex + 1;
        }
    }
    function readRows() {
        let curNodeIndex = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let rowStart = undefined;
            for (const columnIndex of row.coveredColumns) {
                let node = {};
                node.left = node;
                node.right = node;
                node.down = node;
                node.up = node;
                node.index = i;
                node.data = row.data;
                nodeArray[curNodeIndex] = node;
                if (!rowStart) {
                    rowStart = node;
                }
                else {
                    node.left = nodeArray[curNodeIndex - 1];
                    nodeArray[curNodeIndex - 1].right = node;
                }
                const col = colArray[columnIndex + 1];
                node.col = col;
                node.up = col.head.up;
                col.head.up.down = node;
                col.head.up = node;
                node.down = col.head;
                col.len = col.len + 1;
                curNodeIndex = curNodeIndex + 1;
            }
            rowStart.left = nodeArray[curNodeIndex - 1];
            nodeArray[curNodeIndex - 1].right = rowStart;
        }
    }
    function cover(c) {
        const l = c.prev;
        const r = c.next;
        // Unlink column
        l.next = r;
        r.prev = l;
        // From to to bottom, left to right unlink every row node from its column
        for (let rr = c.head.down; rr !== c.head; rr = rr.down) {
            for (let nn = rr.right; nn !== rr; nn = nn.right) {
                let uu = nn.up;
                let dd = nn.down;
                uu.down = dd;
                dd.up = uu;
                nn.col.len -= 1;
            }
        }
    }
    function uncover(c) {
        // From bottom to top, right to left relink every row node to its column
        for (let rr = c.head.up; rr !== c.head; rr = rr.up) {
            for (let nn = rr.left; nn !== rr; nn = nn.left) {
                let uu = nn.up;
                let dd = nn.down;
                uu.down = nn;
                dd.up = nn;
                nn.col.len += 1;
            }
        }
        const l = c.prev;
        const r = c.next;
        // Unlink column
        l.next = c;
        r.prev = c;
    }
    function pickBestColum() {
        let lowestLen = root.next.len;
        let lowest = root.next;
        for (let curCol = root.next; curCol !== root; curCol = curCol.next) {
            let length = curCol.len;
            if (length < lowestLen) {
                lowestLen = length;
                lowest = curCol;
            }
        }
        bestCol = lowest;
    }
    function forward() {
        pickBestColum();
        cover(bestCol);
        currentNode = bestCol.head.down;
        choice[level] = currentNode;
        currentSearchState = SearchState.ADVANCE;
    }
    function recordSolution() {
        let results = [];
        for (let l = 0; l <= level; l++) {
            const node = choice[l];
            results.push({
                index: node.index,
                data: node.data
            });
        }
        solutions.push(results);
    }
    function advance() {
        if (currentNode === bestCol.head) {
            currentSearchState = SearchState.BACKUP;
            return;
        }
        for (let pp = currentNode.right; pp !== currentNode; pp = pp.right) {
            cover(pp.col);
        }
        if (root.next === root) {
            recordSolution();
            if (solutions.length === numSolutions) {
                currentSearchState = SearchState.DONE;
            }
            else {
                currentSearchState = SearchState.RECOVER;
            }
            return;
        }
        level = level + 1;
        currentSearchState = SearchState.FORWARD;
    }
    function backup() {
        uncover(bestCol);
        if (level === 0) {
            currentSearchState = SearchState.DONE;
            return;
        }
        level = level - 1;
        currentNode = choice[level];
        bestCol = currentNode.col;
        currentSearchState = SearchState.RECOVER;
    }
    function recover() {
        for (let pp = currentNode.left; pp !== currentNode; pp = pp.left) {
            uncover(pp.col);
        }
        currentNode = currentNode.down;
        choice[level] = currentNode;
        currentSearchState = SearchState.ADVANCE;
    }
    function done() {
        running = false;
    }
    const stateMethods = {
        [SearchState.FORWARD]: forward,
        [SearchState.ADVANCE]: advance,
        [SearchState.BACKUP]: backup,
        [SearchState.RECOVER]: recover,
        [SearchState.DONE]: done
    };
    readColumnNames();
    readRows();
    while (running) {
        const currentStateMethod = stateMethods[currentSearchState];
        currentStateMethod();
    }
    return solutions;
}
exports.search = search;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/dancing-links/built/lib/lib/interfaces.js":
/*!****************************************************************!*\
  !*** ./node_modules/dancing-links/built/lib/lib/interfaces.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function isSimpleConstraint(arg) {
    return arg.row !== undefined;
}
exports.isSimpleConstraint = isSimpleConstraint;
function isComplexConstraint(arg) {
    return arg.primaryRow !== undefined && arg.secondaryRow !== undefined;
}
exports.isComplexConstraint = isComplexConstraint;
//# sourceMappingURL=interfaces.js.map

/***/ }),

/***/ "./node_modules/dancing-links/built/lib/lib/utils.js":
/*!***********************************************************!*\
  !*** ./node_modules/dancing-links/built/lib/lib/utils.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const interfaces_1 = __webpack_require__(/*! ./interfaces */ "./node_modules/dancing-links/built/lib/lib/interfaces.js");
function binaryToSparseRow(binaryRow, offset = 0) {
    const sparseRow = [];
    for (let i = 0; i < binaryRow.length; i++) {
        if (binaryRow[i] === 1) {
            sparseRow.push(i + offset);
        }
    }
    return sparseRow;
}
function getParams(constraint) {
    let numPrimary = 0;
    let numSecondary = 0;
    if (interfaces_1.isSimpleConstraint(constraint)) {
        numPrimary = constraint.row.length;
    }
    else if (interfaces_1.isComplexConstraint(constraint)) {
        numPrimary = constraint.primaryRow.length;
        numSecondary = constraint.secondaryRow.length;
    }
    return {
        numPrimary,
        numSecondary
    };
}
function getSearchConfig(numSolutions, constraints) {
    const { numPrimary, numSecondary } = getParams(constraints[0]);
    const sparseConstraints = constraints.map((c) => {
        const data = c.data;
        let coveredColumns;
        if (interfaces_1.isSimpleConstraint(c)) {
            coveredColumns = binaryToSparseRow(c.row);
        }
        else if (interfaces_1.isComplexConstraint(c)) {
            coveredColumns = binaryToSparseRow(c.primaryRow).concat(binaryToSparseRow(c.secondaryRow, numPrimary));
        }
        return {
            data,
            coveredColumns
        };
    });
    return {
        numPrimary,
        numSecondary,
        numSolutions,
        rows: sparseConstraints
    };
}
exports.getSearchConfig = getSearchConfig;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ "./node_modules/workerpool/dist/workerpool.js":
/*!****************************************************!*\
  !*** ./node_modules/workerpool/dist/workerpool.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var __dirname = "/";
/**
 * workerpool.js
 * https://github.com/josdejong/workerpool
 *
 * Offload tasks to a pool of workers on node.js and in the browser.
 *
 * @version 9.2.0
 * @date    2024-10-11
 *
 * @license
 * Copyright (C) 2014-2022 Jos de Jong <wjosdejong@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

(function (global, factory) {
   true ? factory(exports) :
  0;
})(this, (function (exports) { 'use strict';

  var src = {};

  var environment = {exports: {}};

  (function (module) {
    // source: https://github.com/flexdinesh/browser-or-node
    // source: https://github.com/mozilla/pdf.js/blob/7ea0e40e588864cd938d1836ec61f1928d3877d3/src/shared/util.js#L24
    var isNode = function isNode(nodeProcess) {
      return typeof nodeProcess !== 'undefined' && nodeProcess.versions != null && nodeProcess.versions.node != null && nodeProcess + '' === '[object process]';
    };
    module.exports.isNode = isNode;

    // determines the JavaScript platform: browser or node
    module.exports.platform = typeof process !== 'undefined' && isNode(process) ? 'node' : 'browser';

    // determines whether the code is running in main thread or not
    // note that in node.js we have to check both worker_thread and child_process
    var worker_threads = module.exports.platform === 'node' && __webpack_require__(/*! worker_threads */ "?5693");
    module.exports.isMainThread = module.exports.platform === 'node' ? (!worker_threads || worker_threads.isMainThread) && !process.connected : typeof Window !== 'undefined';

    // determines the number of cpus available
    module.exports.cpus = module.exports.platform === 'browser' ? self.navigator.hardwareConcurrency : (__webpack_require__(/*! os */ "?90e7").cpus)().length;
  })(environment);
  var environmentExports = environment.exports;

  var _Promise$1 = {};

  var hasRequired_Promise;
  function require_Promise() {
    if (hasRequired_Promise) return _Promise$1;
    hasRequired_Promise = 1;

    /**
     * Promise
     *
     * Inspired by https://gist.github.com/RubaXa/8501359 from RubaXa <trash@rubaxa.org>
     * @template T
     * @template [E=Error]
     * @param {Function} handler   Called as handler(resolve: Function, reject: Function)
     * @param {Promise} [parent]   Parent promise for propagation of cancel and timeout
     */
    function Promise(handler, parent) {
      var me = this;
      if (!(this instanceof Promise)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }
      if (typeof handler !== 'function') {
        throw new SyntaxError('Function parameter handler(resolve, reject) missing');
      }
      var _onSuccess = [];
      var _onFail = [];

      // status
      /**
       * @readonly
       */
      this.resolved = false;
      /**
       * @readonly
       */
      this.rejected = false;
      /**
       * @readonly
       */
      this.pending = true;

      /**
       * Process onSuccess and onFail callbacks: add them to the queue.
       * Once the promise is resolved, the function _promise is replace.
       * @param {Function} onSuccess
       * @param {Function} onFail
       * @private
       */
      var _process = function _process(onSuccess, onFail) {
        _onSuccess.push(onSuccess);
        _onFail.push(onFail);
      };

      /**
       * Add an onSuccess callback and optionally an onFail callback to the Promise
       * @template TT
       * @template [TE=never]
       * @param {(r: T) => TT | PromiseLike<TT>} onSuccess
       * @param {(r: E) => TE | PromiseLike<TE>} [onFail]
       * @returns {Promise<TT | TE, any>} promise
       */
      this.then = function (onSuccess, onFail) {
        return new Promise(function (resolve, reject) {
          var s = onSuccess ? _then(onSuccess, resolve, reject) : resolve;
          var f = onFail ? _then(onFail, resolve, reject) : reject;
          _process(s, f);
        }, me);
      };

      /**
       * Resolve the promise
       * @param {*} result
       * @type {Function}
       */
      var _resolve2 = function _resolve(result) {
        // update status
        me.resolved = true;
        me.rejected = false;
        me.pending = false;
        _onSuccess.forEach(function (fn) {
          fn(result);
        });
        _process = function _process(onSuccess, onFail) {
          onSuccess(result);
        };
        _resolve2 = _reject2 = function _reject() {};
        return me;
      };

      /**
       * Reject the promise
       * @param {Error} error
       * @type {Function}
       */
      var _reject2 = function _reject(error) {
        // update status
        me.resolved = false;
        me.rejected = true;
        me.pending = false;
        _onFail.forEach(function (fn) {
          fn(error);
        });
        _process = function _process(onSuccess, onFail) {
          onFail(error);
        };
        _resolve2 = _reject2 = function _reject() {};
        return me;
      };

      /**
       * Cancel the promise. This will reject the promise with a CancellationError
       * @returns {this} self
       */
      this.cancel = function () {
        if (parent) {
          parent.cancel();
        } else {
          _reject2(new CancellationError());
        }
        return me;
      };

      /**
       * Set a timeout for the promise. If the promise is not resolved within
       * the time, the promise will be cancelled and a TimeoutError is thrown.
       * If the promise is resolved in time, the timeout is removed.
       * @param {number} delay     Delay in milliseconds
       * @returns {this} self
       */
      this.timeout = function (delay) {
        if (parent) {
          parent.timeout(delay);
        } else {
          var timer = setTimeout(function () {
            _reject2(new TimeoutError('Promise timed out after ' + delay + ' ms'));
          }, delay);
          me.always(function () {
            clearTimeout(timer);
          });
        }
        return me;
      };

      // attach handler passing the resolve and reject functions
      handler(function (result) {
        _resolve2(result);
      }, function (error) {
        _reject2(error);
      });
    }

    /**
     * Execute given callback, then call resolve/reject based on the returned result
     * @param {Function} callback
     * @param {Function} resolve
     * @param {Function} reject
     * @returns {Function}
     * @private
     */
    function _then(callback, resolve, reject) {
      return function (result) {
        try {
          var res = callback(result);
          if (res && typeof res.then === 'function' && typeof res['catch'] === 'function') {
            // method returned a promise
            res.then(resolve, reject);
          } else {
            resolve(res);
          }
        } catch (error) {
          reject(error);
        }
      };
    }

    /**
     * Add an onFail callback to the Promise
     * @template TT
     * @param {(error: E) => TT | PromiseLike<TT>} onFail
     * @returns {Promise<T | TT>} promise
     */
    Promise.prototype['catch'] = function (onFail) {
      return this.then(null, onFail);
    };

    // TODO: add support for Promise.catch(Error, callback)
    // TODO: add support for Promise.catch(Error, Error, callback)

    /**
     * Execute given callback when the promise either resolves or rejects.
     * @template TT
     * @param {() => Promise<TT>} fn
     * @returns {Promise<TT>} promise
     */
    Promise.prototype.always = function (fn) {
      return this.then(fn, fn);
    };

    /**
      * Execute given callback when the promise either resolves or rejects.
      * Same semantics as Node's Promise.finally()
      * @param {Function} fn
      * @returns {Promise} promise
      */
    Promise.prototype.finally = function (fn) {
      var me = this;
      var final = function final() {
        return new Promise(function (resolve) {
          return resolve();
        }).then(fn).then(function () {
          return me;
        });
      };
      return this.then(final, final);
    };

    /**
     * Create a promise which resolves when all provided promises are resolved,
     * and fails when any of the promises resolves.
     * @param {Promise[]} promises
     * @returns {Promise<any[], any>} promise
     */
    Promise.all = function (promises) {
      return new Promise(function (resolve, reject) {
        var remaining = promises.length,
          results = [];
        if (remaining) {
          promises.forEach(function (p, i) {
            p.then(function (result) {
              results[i] = result;
              remaining--;
              if (remaining == 0) {
                resolve(results);
              }
            }, function (error) {
              remaining = 0;
              reject(error);
            });
          });
        } else {
          resolve(results);
        }
      });
    };

    /**
     * Create a promise resolver
     * @returns {{promise: Promise, resolve: Function, reject: Function}} resolver
     */
    Promise.defer = function () {
      var resolver = {};
      resolver.promise = new Promise(function (resolve, reject) {
        resolver.resolve = resolve;
        resolver.reject = reject;
      });
      return resolver;
    };

    /**
     * Create a cancellation error
     * @param {String} [message]
     * @extends Error
     */
    function CancellationError(message) {
      this.message = message || 'promise cancelled';
      this.stack = new Error().stack;
    }
    CancellationError.prototype = new Error();
    CancellationError.prototype.constructor = Error;
    CancellationError.prototype.name = 'CancellationError';
    Promise.CancellationError = CancellationError;

    /**
     * Create a timeout error
     * @param {String} [message]
     * @extends Error
     */
    function TimeoutError(message) {
      this.message = message || 'timeout exceeded';
      this.stack = new Error().stack;
    }
    TimeoutError.prototype = new Error();
    TimeoutError.prototype.constructor = Error;
    TimeoutError.prototype.name = 'TimeoutError';
    Promise.TimeoutError = TimeoutError;
    _Promise$1.Promise = Promise;
    return _Promise$1;
  }

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
        t && (r = t);
        var n = 0,
          F = function () {};
        return {
          s: F,
          n: function () {
            return n >= r.length ? {
              done: !0
            } : {
              done: !1,
              value: r[n++]
            };
          },
          e: function (r) {
            throw r;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o,
      a = !0,
      u = !1;
    return {
      s: function () {
        t = t.call(r);
      },
      n: function () {
        var r = t.next();
        return a = r.done, r;
      },
      e: function (r) {
        u = !0, o = r;
      },
      f: function () {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
    };
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  var WorkerHandler = {exports: {}};

  var validateOptions = {};

  /**
   * Validate that the object only contains known option names
   * - Throws an error when unknown options are detected
   * - Throws an error when some of the allowed options are attached
   * @param {Object | undefined} options
   * @param {string[]} allowedOptionNames
   * @param {string} objectName
   * @retrun {Object} Returns the original options
   */
  var hasRequiredValidateOptions;
  function requireValidateOptions() {
    if (hasRequiredValidateOptions) return validateOptions;
    hasRequiredValidateOptions = 1;
    validateOptions.validateOptions = function validateOptions(options, allowedOptionNames, objectName) {
      if (!options) {
        return;
      }
      var optionNames = options ? Object.keys(options) : [];

      // check for unknown properties
      var unknownOptionName = optionNames.find(function (optionName) {
        return !allowedOptionNames.includes(optionName);
      });
      if (unknownOptionName) {
        throw new Error('Object "' + objectName + '" contains an unknown option "' + unknownOptionName + '"');
      }

      // check for inherited properties which are not present on the object itself
      var illegalOptionName = allowedOptionNames.find(function (allowedOptionName) {
        return Object.prototype[allowedOptionName] && !optionNames.includes(allowedOptionName);
      });
      if (illegalOptionName) {
        throw new Error('Object "' + objectName + '" contains an inherited option "' + illegalOptionName + '" which is ' + 'not defined in the object itself but in its prototype. Only plain objects are allowed. ' + 'Please remove the option from the prototype or override it with a value "undefined".');
      }
      return options;
    };

    // source: https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker
    validateOptions.workerOptsNames = ['credentials', 'name', 'type'];

    // source: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
    validateOptions.forkOptsNames = ['cwd', 'detached', 'env', 'execPath', 'execArgv', 'gid', 'serialization', 'signal', 'killSignal', 'silent', 'stdio', 'uid', 'windowsVerbatimArguments', 'timeout'];

    // source: https://nodejs.org/api/worker_threads.html#new-workerfilename-options
    validateOptions.workerThreadOptsNames = ['argv', 'env', 'eval', 'execArgv', 'stdin', 'stdout', 'stderr', 'workerData', 'trackUnmanagedFds', 'transferList', 'resourceLimits', 'name'];
    return validateOptions;
  }

  /**
   * embeddedWorker.js contains an embedded version of worker.js.
   * This file is automatically generated,
   * changes made in this file will be overwritten.
   */
  var embeddedWorker;
  var hasRequiredEmbeddedWorker;
  function requireEmbeddedWorker() {
    if (hasRequiredEmbeddedWorker) return embeddedWorker;
    hasRequiredEmbeddedWorker = 1;
    embeddedWorker = "!function(e,n){\"object\"==typeof exports&&\"undefined\"!=typeof module?module.exports=n():\"function\"==typeof define&&define.amd?define(n):(e=\"undefined\"!=typeof globalThis?globalThis:e||self).worker=n()}(this,(function(){\"use strict\";function e(n){return e=\"function\"==typeof Symbol&&\"symbol\"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&\"function\"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?\"symbol\":typeof e},e(n)}function n(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,\"default\")?e.default:e}var t={};var r=function(e,n){this.message=e,this.transfer=n},o={};function i(e,n){var t=this;if(!(this instanceof i))throw new SyntaxError(\"Constructor must be called with the new operator\");if(\"function\"!=typeof e)throw new SyntaxError(\"Function parameter handler(resolve, reject) missing\");var r=[],o=[];this.resolved=!1,this.rejected=!1,this.pending=!0;var a=function(e,n){r.push(e),o.push(n)};this.then=function(e,n){return new i((function(t,r){var o=e?u(e,t,r):t,i=n?u(n,t,r):r;a(o,i)}),t)};var f=function(e){return t.resolved=!0,t.rejected=!1,t.pending=!1,r.forEach((function(n){n(e)})),a=function(n,t){n(e)},f=d=function(){},t},d=function(e){return t.resolved=!1,t.rejected=!0,t.pending=!1,o.forEach((function(n){n(e)})),a=function(n,t){t(e)},f=d=function(){},t};this.cancel=function(){return n?n.cancel():d(new s),t},this.timeout=function(e){if(n)n.timeout(e);else{var r=setTimeout((function(){d(new c(\"Promise timed out after \"+e+\" ms\"))}),e);t.always((function(){clearTimeout(r)}))}return t},e((function(e){f(e)}),(function(e){d(e)}))}function u(e,n,t){return function(r){try{var o=e(r);o&&\"function\"==typeof o.then&&\"function\"==typeof o.catch?o.then(n,t):n(o)}catch(e){t(e)}}}function s(e){this.message=e||\"promise cancelled\",this.stack=(new Error).stack}function c(e){this.message=e||\"timeout exceeded\",this.stack=(new Error).stack}return i.prototype.catch=function(e){return this.then(null,e)},i.prototype.always=function(e){return this.then(e,e)},i.prototype.finally=function(e){var n=this,t=function(){return new i((function(e){return e()})).then(e).then((function(){return n}))};return this.then(t,t)},i.all=function(e){return new i((function(n,t){var r=e.length,o=[];r?e.forEach((function(e,i){e.then((function(e){o[i]=e,0==--r&&n(o)}),(function(e){r=0,t(e)}))})):n(o)}))},i.defer=function(){var e={};return e.promise=new i((function(n,t){e.resolve=n,e.reject=t})),e},s.prototype=new Error,s.prototype.constructor=Error,s.prototype.name=\"CancellationError\",i.CancellationError=s,c.prototype=new Error,c.prototype.constructor=Error,c.prototype.name=\"TimeoutError\",i.TimeoutError=c,o.Promise=i,function(n){var t=r,i=o.Promise,u=\"__workerpool-cleanup__\",s={exit:function(){}},c={addAbortListener:function(e){s.abortListeners.push(e)},emit:s.emit};if(\"undefined\"!=typeof self&&\"function\"==typeof postMessage&&\"function\"==typeof addEventListener)s.on=function(e,n){addEventListener(e,(function(e){n(e.data)}))},s.send=function(e,n){n?postMessage(e,n):postMessage(e)};else{if(\"undefined\"==typeof process)throw new Error(\"Script must be executed as a worker\");var a;try{a=require(\"worker_threads\")}catch(n){if(\"object\"!==e(n)||null===n||\"MODULE_NOT_FOUND\"!==n.code)throw n}if(a&&null!==a.parentPort){var f=a.parentPort;s.send=f.postMessage.bind(f),s.on=f.on.bind(f),s.exit=process.exit.bind(process)}else s.on=process.on.bind(process),s.send=function(e){process.send(e)},s.on(\"disconnect\",(function(){process.exit(1)})),s.exit=process.exit.bind(process)}function d(e){return Object.getOwnPropertyNames(e).reduce((function(n,t){return Object.defineProperty(n,t,{value:e[t],enumerable:!0})}),{})}function l(e){return e&&\"function\"==typeof e.then&&\"function\"==typeof e.catch}s.methods={},s.methods.run=function(e,n){var t=new Function(\"return (\"+e+\").apply(this, arguments);\");return t.worker=c,t.apply(t,n)},s.methods.methods=function(){return Object.keys(s.methods)},s.terminationHandler=void 0,s.abortListenerTimeout=1e3,s.abortListeners=[],s.terminateAndExit=function(e){var n=function(){s.exit(e)};if(!s.terminationHandler)return n();var t=s.terminationHandler(e);return l(t)?(t.then(n,n),t):(n(),new i((function(e,n){n(new Error(\"Worker terminating\"))})))},s.cleanup=function(e){if(!s.abortListeners.length)return s.send({id:e,method:u,error:d(new Error(\"Worker terminating\"))}),new i((function(e){e()}));var n,t=s.abortListeners.map((function(e){return e()})),r=new i((function(e,t){n=setTimeout((function(){t(new Error(\"Timeout occured waiting for abort handler, killing worker\"))}),s.abortListenerTimeout)})),o=i.all(t).then((function(){clearTimeout(n),s.abortListeners.length||(s.abortListeners=[])}),(function(){clearTimeout(n),s.exit()}));return i.all([o,r]).then((function(){s.send({id:e,method:u,error:null})}),(function(n){s.send({id:e,method:u,error:n?d(n):null})}))};var p=null;s.on(\"message\",(function(e){if(\"__workerpool-terminate__\"===e)return s.terminateAndExit(0);if(e.method===u)return s.cleanup(e.id);try{var n=s.methods[e.method];if(!n)throw new Error('Unknown method \"'+e.method+'\"');p=e.id;var r=n.apply(n,e.params);l(r)?r.then((function(n){n instanceof t?s.send({id:e.id,result:n.message,error:null},n.transfer):s.send({id:e.id,result:n,error:null}),p=null})).catch((function(n){s.send({id:e.id,result:null,error:d(n)}),p=null})):(r instanceof t?s.send({id:e.id,result:r.message,error:null},r.transfer):s.send({id:e.id,result:r,error:null}),p=null)}catch(n){s.send({id:e.id,result:null,error:d(n)})}})),s.register=function(e,n){if(e)for(var t in e)e.hasOwnProperty(t)&&(s.methods[t]=e[t],s.methods[t].worker=c);n&&(s.terminationHandler=n.onTerminate,s.abortListenerTimeout=n.abortListenerTimeout||1e3),s.send(\"ready\")},s.emit=function(e){if(p){if(e instanceof t)return void s.send({id:p,isEvent:!0,payload:e.message},e.transfer);s.send({id:p,isEvent:!0,payload:e})}},n.add=s.register,n.emit=s.emit}(t),n(t)}));\n//# sourceMappingURL=worker.min.js.map\n";
    return embeddedWorker;
  }

  var hasRequiredWorkerHandler;
  function requireWorkerHandler() {
    if (hasRequiredWorkerHandler) return WorkerHandler.exports;
    hasRequiredWorkerHandler = 1;
    var _require$$ = require_Promise(),
      Promise = _require$$.Promise;
    var environment = environmentExports;
    var _require$$2 = requireValidateOptions(),
      validateOptions = _require$$2.validateOptions,
      forkOptsNames = _require$$2.forkOptsNames,
      workerThreadOptsNames = _require$$2.workerThreadOptsNames,
      workerOptsNames = _require$$2.workerOptsNames;

    /**
     * Special message sent by parent which causes a child process worker to terminate itself.
     * Not a "message object"; this string is the entire message.
     */
    var TERMINATE_METHOD_ID = '__workerpool-terminate__';

    /**
     * Special message by parent which causes a child process worker to perform cleaup
     * steps before determining if the child process worker should be terminated.
     */
    var CLEANUP_METHOD_ID = '__workerpool-cleanup__';
    function ensureWorkerThreads() {
      var WorkerThreads = tryRequireWorkerThreads();
      if (!WorkerThreads) {
        throw new Error('WorkerPool: workerType = \'thread\' is not supported, Node >= 11.7.0 required');
      }
      return WorkerThreads;
    }

    // check whether Worker is supported by the browser
    function ensureWebWorker() {
      // Workaround for a bug in PhantomJS (Or QtWebkit): https://github.com/ariya/phantomjs/issues/14534
      if (typeof Worker !== 'function' && ((typeof Worker === "undefined" ? "undefined" : _typeof(Worker)) !== 'object' || typeof Worker.prototype.constructor !== 'function')) {
        throw new Error('WorkerPool: Web Workers not supported');
      }
    }
    function tryRequireWorkerThreads() {
      try {
        return __webpack_require__(/*! worker_threads */ "?5693");
      } catch (error) {
        if (_typeof(error) === 'object' && error !== null && error.code === 'MODULE_NOT_FOUND') {
          // no worker_threads available (old version of node.js)
          return null;
        } else {
          throw error;
        }
      }
    }

    // get the default worker script
    function getDefaultWorker() {
      if (environment.platform === 'browser') {
        // test whether the browser supports all features that we need
        if (typeof Blob === 'undefined') {
          throw new Error('Blob not supported by the browser');
        }
        if (!window.URL || typeof window.URL.createObjectURL !== 'function') {
          throw new Error('URL.createObjectURL not supported by the browser');
        }

        // use embedded worker.js
        var blob = new Blob([requireEmbeddedWorker()], {
          type: 'text/javascript'
        });
        return window.URL.createObjectURL(blob);
      } else {
        // use external worker.js in current directory
        return __dirname + '/worker.js';
      }
    }
    function setupWorker(script, options) {
      if (options.workerType === 'web') {
        // browser only
        ensureWebWorker();
        return setupBrowserWorker(script, options.workerOpts, Worker);
      } else if (options.workerType === 'thread') {
        // node.js only
        WorkerThreads = ensureWorkerThreads();
        return setupWorkerThreadWorker(script, WorkerThreads, options);
      } else if (options.workerType === 'process' || !options.workerType) {
        // node.js only
        return setupProcessWorker(script, resolveForkOptions(options), __webpack_require__(/*! child_process */ "?ccfa"));
      } else {
        // options.workerType === 'auto' or undefined
        if (environment.platform === 'browser') {
          ensureWebWorker();
          return setupBrowserWorker(script, options.workerOpts, Worker);
        } else {
          // environment.platform === 'node'
          var WorkerThreads = tryRequireWorkerThreads();
          if (WorkerThreads) {
            return setupWorkerThreadWorker(script, WorkerThreads, options);
          } else {
            return setupProcessWorker(script, resolveForkOptions(options), __webpack_require__(/*! child_process */ "?ccfa"));
          }
        }
      }
    }
    function setupBrowserWorker(script, workerOpts, Worker) {
      // validate the options right before creating the worker (not when creating the pool)
      validateOptions(workerOpts, workerOptsNames, 'workerOpts');

      // create the web worker
      var worker = new Worker(script, workerOpts);
      worker.isBrowserWorker = true;
      // add node.js API to the web worker
      worker.on = function (event, callback) {
        this.addEventListener(event, function (message) {
          callback(message.data);
        });
      };
      worker.send = function (message, transfer) {
        this.postMessage(message, transfer);
      };
      return worker;
    }
    function setupWorkerThreadWorker(script, WorkerThreads, options) {
      var _options$emitStdStrea, _options$emitStdStrea2;
      // validate the options right before creating the worker thread (not when creating the pool)
      validateOptions(options === null || options === void 0 ? void 0 : options.workerThreadOpts, workerThreadOptsNames, 'workerThreadOpts');
      var worker = new WorkerThreads.Worker(script, _objectSpread2({
        stdout: (_options$emitStdStrea = options === null || options === void 0 ? void 0 : options.emitStdStreams) !== null && _options$emitStdStrea !== void 0 ? _options$emitStdStrea : false,
        // pipe worker.STDOUT to process.STDOUT if not requested
        stderr: (_options$emitStdStrea2 = options === null || options === void 0 ? void 0 : options.emitStdStreams) !== null && _options$emitStdStrea2 !== void 0 ? _options$emitStdStrea2 : false
      }, options === null || options === void 0 ? void 0 : options.workerThreadOpts));
      worker.isWorkerThread = true;
      worker.send = function (message, transfer) {
        this.postMessage(message, transfer);
      };
      worker.kill = function () {
        this.terminate();
        return true;
      };
      worker.disconnect = function () {
        this.terminate();
      };
      if (options !== null && options !== void 0 && options.emitStdStreams) {
        worker.stdout.on('data', function (data) {
          return worker.emit("stdout", data);
        });
        worker.stderr.on('data', function (data) {
          return worker.emit("stderr", data);
        });
      }
      return worker;
    }
    function setupProcessWorker(script, options, child_process) {
      // validate the options right before creating the child process (not when creating the pool)
      validateOptions(options.forkOpts, forkOptsNames, 'forkOpts');

      // no WorkerThreads, fallback to sub-process based workers
      var worker = child_process.fork(script, options.forkArgs, options.forkOpts);

      // ignore transfer argument since it is not supported by process
      var send = worker.send;
      worker.send = function (message) {
        return send.call(worker, message);
      };
      if (options.emitStdStreams) {
        worker.stdout.on('data', function (data) {
          return worker.emit("stdout", data);
        });
        worker.stderr.on('data', function (data) {
          return worker.emit("stderr", data);
        });
      }
      worker.isChildProcess = true;
      return worker;
    }

    // add debug flags to child processes if the node inspector is active
    function resolveForkOptions(opts) {
      opts = opts || {};
      var processExecArgv = process.execArgv.join(' ');
      var inspectorActive = processExecArgv.indexOf('--inspect') !== -1;
      var debugBrk = processExecArgv.indexOf('--debug-brk') !== -1;
      var execArgv = [];
      if (inspectorActive) {
        execArgv.push('--inspect=' + opts.debugPort);
        if (debugBrk) {
          execArgv.push('--debug-brk');
        }
      }
      process.execArgv.forEach(function (arg) {
        if (arg.indexOf('--max-old-space-size') > -1) {
          execArgv.push(arg);
        }
      });
      return Object.assign({}, opts, {
        forkArgs: opts.forkArgs,
        forkOpts: Object.assign({}, opts.forkOpts, {
          execArgv: (opts.forkOpts && opts.forkOpts.execArgv || []).concat(execArgv),
          stdio: opts.emitStdStreams ? "pipe" : undefined
        })
      });
    }

    /**
     * Converts a serialized error to Error
     * @param {Object} obj Error that has been serialized and parsed to object
     * @return {Error} The equivalent Error.
     */
    function objectToError(obj) {
      var temp = new Error('');
      var props = Object.keys(obj);
      for (var i = 0; i < props.length; i++) {
        temp[props[i]] = obj[props[i]];
      }
      return temp;
    }
    function handleEmittedStdPayload(handler, payload) {
      // TODO: refactor if parallel task execution gets added
      if (Object.keys(handler.processing).length !== 1) {
        return;
      }
      var task = Object.values(handler.processing)[0];
      if (task.options && typeof task.options.on === 'function') {
        task.options.on(payload);
      }
    }

    /**
     * A WorkerHandler controls a single worker. This worker can be a child process
     * on node.js or a WebWorker in a browser environment.
     * @param {String} [script] If no script is provided, a default worker with a
     *                          function run will be created.
     * @param {import('./types.js').WorkerPoolOptions} [_options] See docs
     * @constructor
     */
    function WorkerHandler$1(script, _options) {
      var me = this;
      var options = _options || {};
      this.script = script || getDefaultWorker();
      this.worker = setupWorker(this.script, options);
      this.debugPort = options.debugPort;
      this.forkOpts = options.forkOpts;
      this.forkArgs = options.forkArgs;
      this.workerOpts = options.workerOpts;
      this.workerThreadOpts = options.workerThreadOpts;
      this.workerTerminateTimeout = options.workerTerminateTimeout;

      // The ready message is only sent if the worker.add method is called (And the default script is not used)
      if (!script) {
        this.worker.ready = true;
      }

      // queue for requests that are received before the worker is ready
      this.requestQueue = [];
      this.worker.on("stdout", function (data) {
        handleEmittedStdPayload(me, {
          "stdout": data.toString()
        });
      });
      this.worker.on("stderr", function (data) {
        handleEmittedStdPayload(me, {
          "stderr": data.toString()
        });
      });
      this.worker.on('message', function (response) {
        if (me.terminated) {
          return;
        }
        if (typeof response === 'string' && response === 'ready') {
          me.worker.ready = true;
          dispatchQueuedRequests();
        } else {
          // find the task from the processing queue, and run the tasks callback
          var id = response.id;
          var task = me.processing[id];
          if (task !== undefined) {
            if (response.isEvent) {
              if (task.options && typeof task.options.on === 'function') {
                task.options.on(response.payload);
              }
            } else {
              // remove the task from the queue
              delete me.processing[id];

              // test if we need to terminate
              if (me.terminating === true) {
                // complete worker termination if all tasks are finished
                me.terminate();
              }

              // resolve the task's promise
              if (response.error) {
                task.resolver.reject(objectToError(response.error));
              } else {
                task.resolver.resolve(response.result);
              }
            }
          }
          if (response.method === CLEANUP_METHOD_ID) {
            var trackedTask = me.tracking[response.id];
            if (trackedTask !== undefined) {
              if (response.error) {
                clearTimeout(trackedTask.timeoutId);
                trackedTask.resolver.reject(objectToError(response.error));
              } else {
                me.tracking && clearTimeout(trackedTask.timeoutId);
                trackedTask.resolver.resolve(trackedTask.result);
              }
            }
            delete me.tracking[id];
          }
        }
      });

      // reject all running tasks on worker error
      function onError(error) {
        me.terminated = true;
        for (var id in me.processing) {
          if (me.processing[id] !== undefined) {
            me.processing[id].resolver.reject(error);
          }
        }
        me.processing = Object.create(null);
      }

      // send all queued requests to worker
      function dispatchQueuedRequests() {
        var _iterator = _createForOfIteratorHelper(me.requestQueue.splice(0)),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var request = _step.value;
            me.worker.send(request.message, request.transfer);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      var worker = this.worker;
      // listen for worker messages error and exit
      this.worker.on('error', onError);
      this.worker.on('exit', function (exitCode, signalCode) {
        var message = 'Workerpool Worker terminated Unexpectedly\n';
        message += '    exitCode: `' + exitCode + '`\n';
        message += '    signalCode: `' + signalCode + '`\n';
        message += '    workerpool.script: `' + me.script + '`\n';
        message += '    spawnArgs: `' + worker.spawnargs + '`\n';
        message += '    spawnfile: `' + worker.spawnfile + '`\n';
        message += '    stdout: `' + worker.stdout + '`\n';
        message += '    stderr: `' + worker.stderr + '`\n';
        onError(new Error(message));
      });
      this.processing = Object.create(null); // queue with tasks currently in progress
      this.tracking = Object.create(null); // queue with tasks being monitored for cleanup status
      this.terminating = false;
      this.terminated = false;
      this.cleaning = false;
      this.terminationHandler = null;
      this.lastId = 0;
    }

    /**
     * Get a list with methods available on the worker.
     * @return {Promise.<String[], Error>} methods
     */
    WorkerHandler$1.prototype.methods = function () {
      return this.exec('methods');
    };

    /**
     * Execute a method with given parameters on the worker
     * @param {String} method
     * @param {Array} [params]
     * @param {{resolve: Function, reject: Function}} [resolver]
     * @param {import('./types.js').ExecOptions}  [options]
     * @return {Promise.<*, Error>} result
     */
    WorkerHandler$1.prototype.exec = function (method, params, resolver, options) {
      if (!resolver) {
        resolver = Promise.defer();
      }

      // generate a unique id for the task
      var id = ++this.lastId;

      // register a new task as being in progress
      this.processing[id] = {
        id: id,
        resolver: resolver,
        options: options
      };

      // build a JSON-RPC request
      var request = {
        message: {
          id: id,
          method: method,
          params: params
        },
        transfer: options && options.transfer
      };
      if (this.terminated) {
        resolver.reject(new Error('Worker is terminated'));
      } else if (this.worker.ready) {
        // send the request to the worker
        this.worker.send(request.message, request.transfer);
      } else {
        this.requestQueue.push(request);
      }

      // on cancellation, force the worker to terminate
      var me = this;
      return resolver.promise.catch(function (error) {
        if (error instanceof Promise.CancellationError || error instanceof Promise.TimeoutError) {
          me.tracking[id] = {
            id: id,
            resolver: Promise.defer()
          };

          // remove this task from the queue. It is already rejected (hence this
          // catch event), and else it will be rejected again when terminating
          delete me.processing[id];
          me.tracking[id].resolver.promise = me.tracking[id].resolver.promise.catch(function (err) {
            delete me.tracking[id];
            var promise = me.terminateAndNotify(true).then(function () {
              throw err;
            }, function (err) {
              throw err;
            });
            return promise;
          });
          me.worker.send({
            id: id,
            method: CLEANUP_METHOD_ID
          });

          /**
            * Sets a timeout to reject the cleanup operation if the message sent to the worker
            * does not receive a response. see worker.tryCleanup for worker cleanup operations.
            * Here we use the workerTerminateTimeout as the worker will be terminated if the timeout does invoke.
            * 
            * We need this timeout in either case of a Timeout or Cancellation Error as if
            * the worker does not send a message we still need to give a window of time for a response.
            * 
            * The workerTermniateTimeout is used here if this promise is rejected the worker cleanup
            * operations will occure.
          */
          me.tracking[id].timeoutId = setTimeout(function () {
            me.tracking[id].resolver.reject(error);
          }, me.workerTerminateTimeout);
          return me.tracking[id].resolver.promise;
        } else {
          throw error;
        }
      });
    };

    /**
     * Test whether the worker is processing any tasks or cleaning up before termination.
     * @return {boolean} Returns true if the worker is busy
     */
    WorkerHandler$1.prototype.busy = function () {
      return this.cleaning || Object.keys(this.processing).length > 0;
    };

    /**
     * Terminate the worker.
     * @param {boolean} [force=false]   If false (default), the worker is terminated
     *                                  after finishing all tasks currently in
     *                                  progress. If true, the worker will be
     *                                  terminated immediately.
     * @param {function} [callback=null] If provided, will be called when process terminates.
     */
    WorkerHandler$1.prototype.terminate = function (force, callback) {
      var me = this;
      if (force) {
        // cancel all tasks in progress
        for (var id in this.processing) {
          if (this.processing[id] !== undefined) {
            this.processing[id].resolver.reject(new Error('Worker terminated'));
          }
        }
        this.processing = Object.create(null);
      }

      // If we are terminating, cancel all tracked task for cleanup
      for (var _i = 0, _Object$values = Object.values(me.tracking); _i < _Object$values.length; _i++) {
        var task = _Object$values[_i];
        clearTimeout(task.timeoutId);
        task.resolver.reject(new Error('Worker Terminating'));
      }
      me.tracking = Object.create(null);
      if (typeof callback === 'function') {
        this.terminationHandler = callback;
      }
      if (!this.busy()) {
        // all tasks are finished. kill the worker
        var cleanup = function cleanup(err) {
          me.terminated = true;
          me.cleaning = false;
          if (me.worker != null && me.worker.removeAllListeners) {
            // removeAllListeners is only available for child_process
            me.worker.removeAllListeners('message');
          }
          me.worker = null;
          me.terminating = false;
          if (me.terminationHandler) {
            me.terminationHandler(err, me);
          } else if (err) {
            throw err;
          }
        };
        if (this.worker) {
          if (typeof this.worker.kill === 'function') {
            if (this.worker.killed) {
              cleanup(new Error('worker already killed!'));
              return;
            }

            // child process and worker threads
            var cleanExitTimeout = setTimeout(function () {
              if (me.worker) {
                me.worker.kill();
              }
            }, this.workerTerminateTimeout);
            this.worker.once('exit', function () {
              clearTimeout(cleanExitTimeout);
              if (me.worker) {
                me.worker.killed = true;
              }
              cleanup();
            });
            if (this.worker.ready) {
              this.worker.send(TERMINATE_METHOD_ID);
            } else {
              this.requestQueue.push({
                message: TERMINATE_METHOD_ID
              });
            }

            // mark that the worker is cleaning up resources
            // to prevent new tasks from being executed
            this.cleaning = true;
            return;
          } else if (typeof this.worker.terminate === 'function') {
            this.worker.terminate(); // web worker
            this.worker.killed = true;
          } else {
            throw new Error('Failed to terminate worker');
          }
        }
        cleanup();
      } else {
        // we can't terminate immediately, there are still tasks being executed
        this.terminating = true;
      }
    };

    /**
     * Terminate the worker, returning a Promise that resolves when the termination has been done.
     * @param {boolean} [force=false]   If false (default), the worker is terminated
     *                                  after finishing all tasks currently in
     *                                  progress. If true, the worker will be
     *                                  terminated immediately.
     * @param {number} [timeout]        If provided and non-zero, worker termination promise will be rejected
     *                                  after timeout if worker process has not been terminated.
     * @return {Promise.<WorkerHandler, Error>}
     */
    WorkerHandler$1.prototype.terminateAndNotify = function (force, timeout) {
      var resolver = Promise.defer();
      if (timeout) {
        resolver.promise.timeout(timeout);
      }
      this.terminate(force, function (err, worker) {
        if (err) {
          resolver.reject(err);
        } else {
          resolver.resolve(worker);
        }
      });
      return resolver.promise;
    };
    WorkerHandler.exports = WorkerHandler$1;
    WorkerHandler.exports._tryRequireWorkerThreads = tryRequireWorkerThreads;
    WorkerHandler.exports._setupProcessWorker = setupProcessWorker;
    WorkerHandler.exports._setupBrowserWorker = setupBrowserWorker;
    WorkerHandler.exports._setupWorkerThreadWorker = setupWorkerThreadWorker;
    WorkerHandler.exports.ensureWorkerThreads = ensureWorkerThreads;
    return WorkerHandler.exports;
  }

  var debugPortAllocator;
  var hasRequiredDebugPortAllocator;
  function requireDebugPortAllocator() {
    if (hasRequiredDebugPortAllocator) return debugPortAllocator;
    hasRequiredDebugPortAllocator = 1;
    var MAX_PORTS = 65535;
    debugPortAllocator = DebugPortAllocator;
    function DebugPortAllocator() {
      this.ports = Object.create(null);
      this.length = 0;
    }
    DebugPortAllocator.prototype.nextAvailableStartingAt = function (starting) {
      while (this.ports[starting] === true) {
        starting++;
      }
      if (starting >= MAX_PORTS) {
        throw new Error('WorkerPool debug port limit reached: ' + starting + '>= ' + MAX_PORTS);
      }
      this.ports[starting] = true;
      this.length++;
      return starting;
    };
    DebugPortAllocator.prototype.releasePort = function (port) {
      delete this.ports[port];
      this.length--;
    };
    return debugPortAllocator;
  }

  var Pool_1;
  var hasRequiredPool;
  function requirePool() {
    if (hasRequiredPool) return Pool_1;
    hasRequiredPool = 1;
    var _require$$ = require_Promise(),
      Promise = _require$$.Promise;
    var WorkerHandler = requireWorkerHandler();
    var environment = environmentExports;
    var DebugPortAllocator = requireDebugPortAllocator();
    var DEBUG_PORT_ALLOCATOR = new DebugPortAllocator();
    /**
     * A pool to manage workers, which can be created using the function workerpool.pool.
     *
     * @param {String} [script]   Optional worker script
     * @param {import('./types.js').WorkerPoolOptions} [options]  See docs
     * @constructor
     */
    function Pool(script, options) {
      if (typeof script === 'string') {
        /** @readonly */
        this.script = script || null;
      } else {
        this.script = null;
        options = script;
      }

      /** @private */
      this.workers = []; // queue with all workers
      /** @private */
      this.tasks = []; // queue with tasks awaiting execution

      options = options || {};

      /** @readonly */
      this.forkArgs = Object.freeze(options.forkArgs || []);
      /** @readonly */
      this.forkOpts = Object.freeze(options.forkOpts || {});
      /** @readonly */
      this.workerOpts = Object.freeze(options.workerOpts || {});
      /** @readonly */
      this.workerThreadOpts = Object.freeze(options.workerThreadOpts || {});
      /** @private */
      this.debugPortStart = options.debugPortStart || 43210;
      /** @readonly @deprecated */
      this.nodeWorker = options.nodeWorker;
      /** @readonly
       * @type {'auto' | 'web' | 'process' | 'thread'}
       */
      this.workerType = options.workerType || options.nodeWorker || 'auto';
      /** @readonly */
      this.maxQueueSize = options.maxQueueSize || Infinity;
      /** @readonly */
      this.workerTerminateTimeout = options.workerTerminateTimeout || 1000;

      /** @readonly */
      this.onCreateWorker = options.onCreateWorker || function () {
        return null;
      };
      /** @readonly */
      this.onTerminateWorker = options.onTerminateWorker || function () {
        return null;
      };

      /** @readonly */
      this.emitStdStreams = options.emitStdStreams || false;

      // configuration
      if (options && 'maxWorkers' in options) {
        validateMaxWorkers(options.maxWorkers);
        /** @readonly */
        this.maxWorkers = options.maxWorkers;
      } else {
        this.maxWorkers = Math.max((environment.cpus || 4) - 1, 1);
      }
      if (options && 'minWorkers' in options) {
        if (options.minWorkers === 'max') {
          /** @readonly */
          this.minWorkers = this.maxWorkers;
        } else {
          validateMinWorkers(options.minWorkers);
          this.minWorkers = options.minWorkers;
          this.maxWorkers = Math.max(this.minWorkers, this.maxWorkers); // in case minWorkers is higher than maxWorkers
        }
        this._ensureMinWorkers();
      }

      /** @private */
      this._boundNext = this._next.bind(this);
      if (this.workerType === 'thread') {
        WorkerHandler.ensureWorkerThreads();
      }
    }

    /**
     * Execute a function on a worker.
     *
     * Example usage:
     *
     *   var pool = new Pool()
     *
     *   // call a function available on the worker
     *   pool.exec('fibonacci', [6])
     *
     *   // offload a function
     *   function add(a, b) {
     *     return a + b
     *   };
     *   pool.exec(add, [2, 4])
     *       .then(function (result) {
     *         console.log(result); // outputs 6
     *       })
     *       .catch(function(error) {
     *         console.log(error);
     *       });
     * @template { (...args: any[]) => any } T
     * @param {String | T} method  Function name or function.
     *                                    If `method` is a string, the corresponding
     *                                    method on the worker will be executed
     *                                    If `method` is a Function, the function
     *                                    will be stringified and executed via the
     *                                    workers built-in function `run(fn, args)`.
     * @param {Parameters<T> | null} [params]  Function arguments applied when calling the function
     * @param {import('./types.js').ExecOptions} [options]  Options
     * @return {Promise<ReturnType<T>>}
     */
    Pool.prototype.exec = function (method, params, options) {
      // validate type of arguments
      if (params && !Array.isArray(params)) {
        throw new TypeError('Array expected as argument "params"');
      }
      if (typeof method === 'string') {
        var resolver = Promise.defer();
        if (this.tasks.length >= this.maxQueueSize) {
          throw new Error('Max queue size of ' + this.maxQueueSize + ' reached');
        }

        // add a new task to the queue
        var tasks = this.tasks;
        var task = {
          method: method,
          params: params,
          resolver: resolver,
          timeout: null,
          options: options
        };
        tasks.push(task);

        // replace the timeout method of the Promise with our own,
        // which starts the timer as soon as the task is actually started
        var originalTimeout = resolver.promise.timeout;
        resolver.promise.timeout = function timeout(delay) {
          if (tasks.indexOf(task) !== -1) {
            // task is still queued -> start the timer later on
            task.timeout = delay;
            return resolver.promise;
          } else {
            // task is already being executed -> start timer immediately
            return originalTimeout.call(resolver.promise, delay);
          }
        };

        // trigger task execution
        this._next();
        return resolver.promise;
      } else if (typeof method === 'function') {
        // send stringified function and function arguments to worker
        return this.exec('run', [String(method), params], options);
      } else {
        throw new TypeError('Function or string expected as argument "method"');
      }
    };

    /**
     * Create a proxy for current worker. Returns an object containing all
     * methods available on the worker. All methods return promises resolving the methods result.
     * @template { { [k: string]: (...args: any[]) => any } } T
     * @return {Promise<import('./types.js').Proxy<T>, Error>} Returns a promise which resolves with a proxy object
     */
    Pool.prototype.proxy = function () {
      if (arguments.length > 0) {
        throw new Error('No arguments expected');
      }
      var pool = this;
      return this.exec('methods').then(function (methods) {
        var proxy = {};
        methods.forEach(function (method) {
          proxy[method] = function () {
            return pool.exec(method, Array.prototype.slice.call(arguments));
          };
        });
        return proxy;
      });
    };

    /**
     * Creates new array with the results of calling a provided callback function
     * on every element in this array.
     * @param {Array} array
     * @param {function} callback  Function taking two arguments:
     *                             `callback(currentValue, index)`
     * @return {Promise.<Array>} Returns a promise which resolves  with an Array
     *                           containing the results of the callback function
     *                           executed for each of the array elements.
     */
    /* TODO: implement map
    Pool.prototype.map = function (array, callback) {
    };
    */

    /**
     * Grab the first task from the queue, find a free worker, and assign the
     * worker to the task.
     * @private
     */
    Pool.prototype._next = function () {
      if (this.tasks.length > 0) {
        // there are tasks in the queue

        // find an available worker
        var worker = this._getWorker();
        if (worker) {
          // get the first task from the queue
          var me = this;
          var task = this.tasks.shift();

          // check if the task is still pending (and not cancelled -> promise rejected)
          if (task.resolver.promise.pending) {
            // send the request to the worker
            var promise = worker.exec(task.method, task.params, task.resolver, task.options).then(me._boundNext).catch(function () {
              // if the worker crashed and terminated, remove it from the pool
              if (worker.terminated) {
                return me._removeWorker(worker);
              }
            }).then(function () {
              me._next(); // trigger next task in the queue
            });

            // start queued timer now
            if (typeof task.timeout === 'number') {
              promise.timeout(task.timeout);
            }
          } else {
            // The task taken was already complete (either rejected or resolved), so just trigger next task in the queue
            me._next();
          }
        }
      }
    };

    /**
     * Get an available worker. If no worker is available and the maximum number
     * of workers isn't yet reached, a new worker will be created and returned.
     * If no worker is available and the maximum number of workers is reached,
     * null will be returned.
     *
     * @return {WorkerHandler | null} worker
     * @private
     */
    Pool.prototype._getWorker = function () {
      // find a non-busy worker
      var workers = this.workers;
      for (var i = 0; i < workers.length; i++) {
        var worker = workers[i];
        if (worker.busy() === false) {
          return worker;
        }
      }
      if (workers.length < this.maxWorkers) {
        // create a new worker
        worker = this._createWorkerHandler();
        workers.push(worker);
        return worker;
      }
      return null;
    };

    /**
     * Remove a worker from the pool.
     * Attempts to terminate worker if not already terminated, and ensures the minimum
     * pool size is met.
     * @param {WorkerHandler} worker
     * @return {Promise<WorkerHandler>}
     * @private
     */
    Pool.prototype._removeWorker = function (worker) {
      var me = this;
      DEBUG_PORT_ALLOCATOR.releasePort(worker.debugPort);
      // _removeWorker will call this, but we need it to be removed synchronously
      this._removeWorkerFromList(worker);
      // If minWorkers set, spin up new workers to replace the crashed ones
      this._ensureMinWorkers();
      // terminate the worker (if not already terminated)
      return new Promise(function (resolve, reject) {
        worker.terminate(false, function (err) {
          me.onTerminateWorker({
            forkArgs: worker.forkArgs,
            forkOpts: worker.forkOpts,
            workerThreadOpts: worker.workerThreadOpts,
            script: worker.script
          });
          if (err) {
            reject(err);
          } else {
            resolve(worker);
          }
        });
      });
    };

    /**
     * Remove a worker from the pool list.
     * @param {WorkerHandler} worker
     * @private
     */
    Pool.prototype._removeWorkerFromList = function (worker) {
      // remove from the list with workers
      var index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
    };

    /**
     * Close all active workers. Tasks currently being executed will be finished first.
     * @param {boolean} [force=false]   If false (default), the workers are terminated
     *                                  after finishing all tasks currently in
     *                                  progress. If true, the workers will be
     *                                  terminated immediately.
     * @param {number} [timeout]        If provided and non-zero, worker termination promise will be rejected
     *                                  after timeout if worker process has not been terminated.
     * @return {Promise.<void, Error>}
     */
    Pool.prototype.terminate = function (force, timeout) {
      var me = this;

      // cancel any pending tasks
      this.tasks.forEach(function (task) {
        task.resolver.reject(new Error('Pool terminated'));
      });
      this.tasks.length = 0;
      var f = function f(worker) {
        DEBUG_PORT_ALLOCATOR.releasePort(worker.debugPort);
        this._removeWorkerFromList(worker);
      };
      var removeWorker = f.bind(this);
      var promises = [];
      var workers = this.workers.slice();
      workers.forEach(function (worker) {
        var termPromise = worker.terminateAndNotify(force, timeout).then(removeWorker).always(function () {
          me.onTerminateWorker({
            forkArgs: worker.forkArgs,
            forkOpts: worker.forkOpts,
            workerThreadOpts: worker.workerThreadOpts,
            script: worker.script
          });
        });
        promises.push(termPromise);
      });
      return Promise.all(promises);
    };

    /**
     * Retrieve statistics on tasks and workers.
     * @return {{totalWorkers: number, busyWorkers: number, idleWorkers: number, pendingTasks: number, activeTasks: number}} Returns an object with statistics
     */
    Pool.prototype.stats = function () {
      var totalWorkers = this.workers.length;
      var busyWorkers = this.workers.filter(function (worker) {
        return worker.busy();
      }).length;
      return {
        totalWorkers: totalWorkers,
        busyWorkers: busyWorkers,
        idleWorkers: totalWorkers - busyWorkers,
        pendingTasks: this.tasks.length,
        activeTasks: busyWorkers
      };
    };

    /**
     * Ensures that a minimum of minWorkers is up and running
     * @private
     */
    Pool.prototype._ensureMinWorkers = function () {
      if (this.minWorkers) {
        for (var i = this.workers.length; i < this.minWorkers; i++) {
          this.workers.push(this._createWorkerHandler());
        }
      }
    };

    /**
     * Helper function to create a new WorkerHandler and pass all options.
     * @return {WorkerHandler}
     * @private
     */
    Pool.prototype._createWorkerHandler = function () {
      var overriddenParams = this.onCreateWorker({
        forkArgs: this.forkArgs,
        forkOpts: this.forkOpts,
        workerOpts: this.workerOpts,
        workerThreadOpts: this.workerThreadOpts,
        script: this.script
      }) || {};
      return new WorkerHandler(overriddenParams.script || this.script, {
        forkArgs: overriddenParams.forkArgs || this.forkArgs,
        forkOpts: overriddenParams.forkOpts || this.forkOpts,
        workerOpts: overriddenParams.workerOpts || this.workerOpts,
        workerThreadOpts: overriddenParams.workerThreadOpts || this.workerThreadOpts,
        debugPort: DEBUG_PORT_ALLOCATOR.nextAvailableStartingAt(this.debugPortStart),
        workerType: this.workerType,
        workerTerminateTimeout: this.workerTerminateTimeout,
        emitStdStreams: this.emitStdStreams
      });
    };

    /**
     * Ensure that the maxWorkers option is an integer >= 1
     * @param {*} maxWorkers
     * @returns {boolean} returns true maxWorkers has a valid value
     */
    function validateMaxWorkers(maxWorkers) {
      if (!isNumber(maxWorkers) || !isInteger(maxWorkers) || maxWorkers < 1) {
        throw new TypeError('Option maxWorkers must be an integer number >= 1');
      }
    }

    /**
     * Ensure that the minWorkers option is an integer >= 0
     * @param {*} minWorkers
     * @returns {boolean} returns true when minWorkers has a valid value
     */
    function validateMinWorkers(minWorkers) {
      if (!isNumber(minWorkers) || !isInteger(minWorkers) || minWorkers < 0) {
        throw new TypeError('Option minWorkers must be an integer number >= 0');
      }
    }

    /**
     * Test whether a variable is a number
     * @param {*} value
     * @returns {boolean} returns true when value is a number
     */
    function isNumber(value) {
      return typeof value === 'number';
    }

    /**
     * Test whether a number is an integer
     * @param {number} value
     * @returns {boolean} Returns true if value is an integer
     */
    function isInteger(value) {
      return Math.round(value) == value;
    }
    Pool_1 = Pool;
    return Pool_1;
  }

  var worker$1 = {};

  /**
   * The helper class for transferring data from the worker to the main thread.
   *
   * @param {Object} message The object to deliver to the main thread.
   * @param {Object[]} transfer An array of transferable Objects to transfer ownership of.
   */
  var transfer;
  var hasRequiredTransfer;
  function requireTransfer() {
    if (hasRequiredTransfer) return transfer;
    hasRequiredTransfer = 1;
    function Transfer(message, transfer) {
      this.message = message;
      this.transfer = transfer;
    }
    transfer = Transfer;
    return transfer;
  }

  var hasRequiredWorker;
  function requireWorker() {
    if (hasRequiredWorker) return worker$1;
    hasRequiredWorker = 1;
    (function (exports) {
      var Transfer = requireTransfer();

      /**
       * worker must handle async cleanup handlers. Use custom Promise implementation. 
      */
      var Promise = require_Promise().Promise;
      /**
       * Special message sent by parent which causes the worker to terminate itself.
       * Not a "message object"; this string is the entire message.
       */
      var TERMINATE_METHOD_ID = '__workerpool-terminate__';

      /**
       * Special message by parent which causes a child process worker to perform cleaup
       * steps before determining if the child process worker should be terminated.
      */
      var CLEANUP_METHOD_ID = '__workerpool-cleanup__';
      // var nodeOSPlatform = require('./environment').nodeOSPlatform;

      var TIMEOUT_DEFAULT = 1000;

      // create a worker API for sending and receiving messages which works both on
      // node.js and in the browser
      var worker = {
        exit: function exit() {}
      };

      // api for in worker communication with parent process
      // works in both node.js and the browser
      var publicWorker = {
        /**
         * 
         * @param {() => Promise<void>} listener 
         */
        addAbortListener: function addAbortListener(listener) {
          worker.abortListeners.push(listener);
        },
        emit: worker.emit
      };
      if (typeof self !== 'undefined' && typeof postMessage === 'function' && typeof addEventListener === 'function') {
        // worker in the browser
        worker.on = function (event, callback) {
          addEventListener(event, function (message) {
            callback(message.data);
          });
        };
        worker.send = function (message, transfer) {
          transfer ? postMessage(message, transfer) : postMessage(message);
        };
      } else if (typeof process !== 'undefined') {
        // node.js

        var WorkerThreads;
        try {
          WorkerThreads = __webpack_require__(/*! worker_threads */ "?5693");
        } catch (error) {
          if (_typeof(error) === 'object' && error !== null && error.code === 'MODULE_NOT_FOUND') ; else {
            throw error;
          }
        }
        if (WorkerThreads && /* if there is a parentPort, we are in a WorkerThread */
        WorkerThreads.parentPort !== null) {
          var parentPort = WorkerThreads.parentPort;
          worker.send = parentPort.postMessage.bind(parentPort);
          worker.on = parentPort.on.bind(parentPort);
          worker.exit = process.exit.bind(process);
        } else {
          worker.on = process.on.bind(process);
          // ignore transfer argument since it is not supported by process
          worker.send = function (message) {
            process.send(message);
          };
          // register disconnect handler only for subprocess worker to exit when parent is killed unexpectedly
          worker.on('disconnect', function () {
            process.exit(1);
          });
          worker.exit = process.exit.bind(process);
        }
      } else {
        throw new Error('Script must be executed as a worker');
      }
      function convertError(error) {
        return Object.getOwnPropertyNames(error).reduce(function (product, name) {
          return Object.defineProperty(product, name, {
            value: error[name],
            enumerable: true
          });
        }, {});
      }

      /**
       * Test whether a value is a Promise via duck typing.
       * @param {*} value
       * @returns {boolean} Returns true when given value is an object
       *                    having functions `then` and `catch`.
       */
      function isPromise(value) {
        return value && typeof value.then === 'function' && typeof value.catch === 'function';
      }

      // functions available externally
      worker.methods = {};

      /**
       * Execute a function with provided arguments
       * @param {String} fn     Stringified function
       * @param {Array} [args]  Function arguments
       * @returns {*}
       */
      worker.methods.run = function run(fn, args) {
        var f = new Function('return (' + fn + ').apply(this, arguments);');
        f.worker = publicWorker;
        return f.apply(f, args);
      };

      /**
       * Get a list with methods available on this worker
       * @return {String[]} methods
       */
      worker.methods.methods = function methods() {
        return Object.keys(worker.methods);
      };

      /**
       * Custom handler for when the worker is terminated.
       */
      worker.terminationHandler = undefined;
      worker.abortListenerTimeout = TIMEOUT_DEFAULT;

      /**
       * Abort handlers for resolving errors which may cause a timeout or cancellation
       * to occur from a worker context
       */
      worker.abortListeners = [];

      /**
       * Cleanup and exit the worker.
       * @param {Number} code 
       * @returns {Promise<void>}
       */
      worker.terminateAndExit = function (code) {
        var _exit = function _exit() {
          worker.exit(code);
        };
        if (!worker.terminationHandler) {
          return _exit();
        }
        var result = worker.terminationHandler(code);
        if (isPromise(result)) {
          result.then(_exit, _exit);
          return result;
        } else {
          _exit();
          return new Promise(function (_resolve, reject) {
            reject(new Error("Worker terminating"));
          });
        }
      };

      /**
        * Called within the worker message handler to run abort handlers if registered to perform cleanup operations.
        * @param {Integer} [requestId] id of task which is currently executing in the worker
        * @return {Promise<void>}
      */
      worker.cleanup = function (requestId) {
        if (!worker.abortListeners.length) {
          worker.send({
            id: requestId,
            method: CLEANUP_METHOD_ID,
            error: convertError(new Error('Worker terminating'))
          });

          // If there are no handlers registered, reject the promise with an error as we want the handler to be notified
          // that cleanup should begin and the handler should be GCed.
          return new Promise(function (resolve) {
            resolve();
          });
        }
        var _exit = function _exit() {
          worker.exit();
        };
        var _abort = function _abort() {
          if (!worker.abortListeners.length) {
            worker.abortListeners = [];
          }
        };
        var promises = worker.abortListeners.map(function (listener) {
          return listener();
        });
        var timerId;
        var timeoutPromise = new Promise(function (_resolve, reject) {
          timerId = setTimeout(function () {
            reject(new Error('Timeout occured waiting for abort handler, killing worker'));
          }, worker.abortListenerTimeout);
        });

        // Once a promise settles we need to clear the timeout to prevet fulfulling the promise twice 
        var settlePromise = Promise.all(promises).then(function () {
          clearTimeout(timerId);
          _abort();
        }, function () {
          clearTimeout(timerId);
          _exit();
        });

        // Returns a promise which will result in one of the following cases
        // - Resolve once all handlers resolve
        // - Reject if one or more handlers exceed the 'abortListenerTimeout' interval
        // - Reject if one or more handlers reject
        // Upon one of the above cases a message will be sent to the handler with the result of the handler execution
        // which will either kill the worker if the result contains an error, or 
        return Promise.all([settlePromise, timeoutPromise]).then(function () {
          worker.send({
            id: requestId,
            method: CLEANUP_METHOD_ID,
            error: null
          });
        }, function (err) {
          worker.send({
            id: requestId,
            method: CLEANUP_METHOD_ID,
            error: err ? convertError(err) : null
          });
        });
      };
      var currentRequestId = null;
      worker.on('message', function (request) {
        if (request === TERMINATE_METHOD_ID) {
          return worker.terminateAndExit(0);
        }
        if (request.method === CLEANUP_METHOD_ID) {
          return worker.cleanup(request.id);
        }
        try {
          var method = worker.methods[request.method];
          if (method) {
            currentRequestId = request.id;

            // execute the function
            var result = method.apply(method, request.params);
            if (isPromise(result)) {
              // promise returned, resolve this and then return
              result.then(function (result) {
                if (result instanceof Transfer) {
                  worker.send({
                    id: request.id,
                    result: result.message,
                    error: null
                  }, result.transfer);
                } else {
                  worker.send({
                    id: request.id,
                    result: result,
                    error: null
                  });
                }
                currentRequestId = null;
              }).catch(function (err) {
                worker.send({
                  id: request.id,
                  result: null,
                  error: convertError(err)
                });
                currentRequestId = null;
              });
            } else {
              // immediate result
              if (result instanceof Transfer) {
                worker.send({
                  id: request.id,
                  result: result.message,
                  error: null
                }, result.transfer);
              } else {
                worker.send({
                  id: request.id,
                  result: result,
                  error: null
                });
              }
              currentRequestId = null;
            }
          } else {
            throw new Error('Unknown method "' + request.method + '"');
          }
        } catch (err) {
          worker.send({
            id: request.id,
            result: null,
            error: convertError(err)
          });
        }
      });

      /**
       * Register methods to the worker
       * @param {Object} [methods]
       * @param {import('./types.js').WorkerRegisterOptions} [options]
       */
      worker.register = function (methods, options) {
        if (methods) {
          for (var name in methods) {
            if (methods.hasOwnProperty(name)) {
              worker.methods[name] = methods[name];
              worker.methods[name].worker = publicWorker;
            }
          }
        }
        if (options) {
          worker.terminationHandler = options.onTerminate;
          // register listener timeout or default to 1 second
          worker.abortListenerTimeout = options.abortListenerTimeout || TIMEOUT_DEFAULT;
        }
        worker.send('ready');
      };
      worker.emit = function (payload) {
        if (currentRequestId) {
          if (payload instanceof Transfer) {
            worker.send({
              id: currentRequestId,
              isEvent: true,
              payload: payload.message
            }, payload.transfer);
            return;
          }
          worker.send({
            id: currentRequestId,
            isEvent: true,
            payload: payload
          });
        }
      };
      {
        exports.add = worker.register;
        exports.emit = worker.emit;
      }
    })(worker$1);
    return worker$1;
  }

  var platform = environmentExports.platform,
    isMainThread = environmentExports.isMainThread,
    cpus = environmentExports.cpus;

  /** @typedef {import("./Pool")} Pool */
  /** @typedef {import("./types.js").WorkerPoolOptions} WorkerPoolOptions */
  /** @typedef {import("./types.js").WorkerRegisterOptions} WorkerRegisterOptions */

  /**
   * @template { { [k: string]: (...args: any[]) => any } } T
   * @typedef {import('./types.js').Proxy<T>} Proxy<T>
   */

  /**
   * @overload
   * Create a new worker pool
   * @param {WorkerPoolOptions} [script]
   * @returns {Pool} pool
   */
  /**
   * @overload
   * Create a new worker pool
   * @param {string} [script]
   * @param {WorkerPoolOptions} [options]
   * @returns {Pool} pool
   */
  function pool(script, options) {
    var Pool = requirePool();
    return new Pool(script, options);
  }
  var pool_1 = src.pool = pool;

  /**
   * Create a worker and optionally register a set of methods to the worker.
   * @param {{ [k: string]: (...args: any[]) => any }} [methods]
   * @param {WorkerRegisterOptions} [options]
   */
  function worker(methods, options) {
    var worker = requireWorker();
    worker.add(methods, options);
  }
  var worker_1 = src.worker = worker;

  /**
   * Sends an event to the parent worker pool.
   * @param {any} payload 
   */
  function workerEmit(payload) {
    var worker = requireWorker();
    worker.emit(payload);
  }
  var workerEmit_1 = src.workerEmit = workerEmit;
  var _require$$ = require_Promise(),
    Promise$1 = _require$$.Promise;
  var _Promise = src.Promise = Promise$1;
  var Transfer = src.Transfer = requireTransfer();
  var platform_1 = src.platform = platform;
  var isMainThread_1 = src.isMainThread = isMainThread;
  var cpus_1 = src.cpus = cpus;

  exports.Promise = _Promise;
  exports.Transfer = Transfer;
  exports.cpus = cpus_1;
  exports.default = src;
  exports.isMainThread = isMainThread_1;
  exports.platform = platform_1;
  exports.pool = pool_1;
  exports.worker = worker_1;
  exports.workerEmit = workerEmit_1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=workerpool.js.map


/***/ }),

/***/ "?5693":
/*!********************************!*\
  !*** worker_threads (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?90e7":
/*!********************!*\
  !*** os (ignored) ***!
  \********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?ccfa":
/*!*******************************!*\
  !*** child_process (ignored) ***!
  \*******************************/
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!******************************************!*\
  !*** ./app/shapedoctor/solver.worker.ts ***!
  \******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var workerpool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! workerpool */ "./node_modules/workerpool/dist/workerpool.js");
/* harmony import */ var workerpool__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(workerpool__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bitmaskUtils */ "./app/shapedoctor/bitmaskUtils.ts");
/* harmony import */ var _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapedoctor.config */ "./app/shapedoctor/shapedoctor.config.ts");
/* harmony import */ var _solver_dlx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./solver.dlx */ "./app/shapedoctor/solver.dlx.ts");
// app/shapedoctor/solver.worker.ts - Optimized Backtracking Version




;
; // ADD BACK local definition
// --- Utility Function: Generate Combinations ---
function* combinations(arr, k) {
    if (k < 0 || k > arr.length) {
        return;
    }
    if (k === 0) {
        yield [];
        return;
    }
    if (k === arr.length) {
        yield arr;
        return;
    }
    const first = arr[0];
    const rest = arr.slice(1);
    // Combinations including the first element
    for (const combo of combinations(rest, k - 1)) {
        yield [first, ...combo];
    }
    // Combinations excluding the first element
    for (const combo of combinations(rest, k)) {
        yield combo;
    }
}
const FULL_GRID_MASK = (1n << BigInt(_shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.TOTAL_TILES)) - 1n; // Mask for a full grid
// State variable to store precomputed data for each shape
let allShapeData = new Map();
// --- Precomputation Function ---
const precomputeAllShapeData = (shapesToPlace, lockedTilesMask) => {
    console.log("[Worker Precompute] Starting precomputation (Single Orientation, All Translations)...");
    const computationStartTime = Date.now();
    const computedData = new Map();
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    const coordsMap = new Map();
    _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.HEX_GRID_COORDS.forEach((coord, index) => {
        coordsMap.set(index, { q: coord.q, r: coord.r });
    });
    shapesToPlace.forEach((shapeInput) => {
        const shapeId = shapeInput.id;
        try {
            const shapeStringParts = shapeId.split('::');
            if (shapeStringParts.length !== 2 || shapeStringParts[1].length !== _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.TOTAL_TILES) {
                console.error(`[Worker Precompute] Invalid shapeId format or length: ${shapeId}. Skipping.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }
            const actualShapeString = shapeStringParts[1];
            const baseShapeMask = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.shapeStringToBitmask)(actualShapeString);
            if (baseShapeMask === 0n) {
                console.warn(`[Worker Precompute] Skipping shape with empty mask (from ${shapeId})`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }
            // ---> Add check for exactly 4 tiles <--- //
            const initialTileCount = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.countSetBits)(baseShapeMask);
            if (initialTileCount !== 4) {
                console.warn(`[Worker Precompute] Skipping shape ${shapeId} because initial mask has ${initialTileCount} tiles, not 4.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return; // Skip this shape
            }
            // --------------------------------------- //
            const validPlacements = new Set();
            const sourceTileIndex = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.findLowestSetBitIndex)(baseShapeMask);
            if (sourceTileIndex === -1) {
                console.warn(`[Worker Precompute] Could not find anchor for non-empty shape ${shapeId}. Skipping.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }
            const sourceCoords = coordsMap.get(sourceTileIndex);
            if (!sourceCoords) {
                console.error(`[Worker Precompute] Could not find coordinates for source index ${sourceTileIndex} of shape ${shapeId}. Check HEX_GRID_COORDS structure/order. Skipping.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }
            const { q: sourceQ, r: sourceR } = sourceCoords;
            for (let targetTileIndex = 0; targetTileIndex < _shapedoctor_config__WEBPACK_IMPORTED_MODULE_2__.TOTAL_TILES; targetTileIndex++) {
                const targetCoords = coordsMap.get(targetTileIndex);
                if (!targetCoords) {
                    console.error(`[Worker Precompute] Missing coordinates for target index ${targetTileIndex}. Skipping translation.`);
                    continue;
                }
                const { q: targetQ, r: targetR } = targetCoords;
                const deltaQ = targetQ - sourceQ;
                const deltaR = targetR - sourceR;
                const translatedMask = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.translateShapeBitmask)(baseShapeMask, deltaQ, deltaR);
                if (translatedMask !== 0n && (translatedMask & lockedTilesMaskBigint) === 0n) {
                    // ---> Add check for 4 tiles AFTER translation <--- //
                    const translatedTileCount = (0,_bitmaskUtils__WEBPACK_IMPORTED_MODULE_1__.countSetBits)(translatedMask);
                    if (translatedTileCount === 4) {
                        validPlacements.add(translatedMask);
                    }
                    // Optional: Log if a translation resulted in fewer tiles
                    // else if (translatedTileCount > 0) { 
                    //    console.log(`[Worker Precompute] Shape ${shapeId} translation resulted in ${translatedTileCount} tiles. Discarding.`);
                    // }
                    // -------------------------------------------------- //
                }
            }
            computedData.set(shapeId, { id: shapeId, validPlacements });
        }
        catch (e) {
            console.error(`[Worker Precompute] Error precomputing shape ${shapeId}:`, e);
            computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
        }
    });
    const computationEndTime = Date.now();
    console.log(`[Worker Precompute] Precomputation finished in ${computationEndTime - computationStartTime}ms. Computed data for ${computedData.size} shapes (Single Orientation, All Translations).`);
    return computedData;
};
// --- Combinatorial Exact Tiling Function (DLX-based) ---
// Ensure this function definition is present and uncommented
async function runCombinatorialExactTiling(taskData // Use the refined type
) {
    console.log(`[Worker runCombinatorialExactTiling] Received task for k=${taskData.k}`);
    allShapeData = new Map(); // Reset precomputed data for this run
    const { k, shapesToTileWith, allPotentialsData, initialGridState = 0n, lockedTilesMask } = taskData;
    const initialGridStateBigint = typeof initialGridState === 'string' ? BigInt(initialGridState) : initialGridState;
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    const startTime = Date.now();
    try {
        // Precompute data for ALL provided potential shapes (needed by DLX solver)
        console.log("[Worker runCombinatorialExactTiling] Running precomputation...");
        // Need to map allPotentialsData to ShapeInput format for precomputation
        const shapesForPrecompute = allPotentialsData.map(p => ({ id: p.uniqueId }));
        allShapeData = precomputeAllShapeData(shapesForPrecompute, lockedTilesMaskBigint);
        console.log(`[Worker runCombinatorialExactTiling] Precomputation done. ${allShapeData.size} shapes processed.`);
        console.log(`[Worker runCombinatorialExactTiling] Calling findExactKTilingSolutions with k=${k}...`);
        const result = (0,_solver_dlx__WEBPACK_IMPORTED_MODULE_3__.findExactKTilingSolutions)(k, allShapeData, // Pass ALL precomputed data
        [], // initialConstraints (unused)
        shapesToTileWith, // Pass the specific shapes to use for this tiling
        initialGridStateBigint, lockedTilesMaskBigint);
        const endTime = Date.now();
        console.log(`[Worker runCombinatorialExactTiling] DLX finished in ${endTime - startTime}ms. Found ${result.solutions.length} solutions.`);
        if (result.error) {
            return { maxShapes: 0, solutions: [], error: result.error };
        }
        // Return result with maxShapes = k if solutions found
        return { maxShapes: result.solutions.length > 0 ? k : 0, solutions: result.solutions };
    }
    catch (error) {
        const errorEndTime = Date.now();
        console.error("[Worker runCombinatorialExactTiling] Error during execution:", error);
        return {
            maxShapes: 0,
            solutions: [],
            error: `Exact Tiling Worker Error: ${error instanceof Error ? error.message : String(error)} (Took ${errorEndTime - startTime}ms)`
        };
    }
}
// --- Backtracking-Based Maximal Placement Function ---
const runMaximalPlacementBacktracking = async (taskData) => {
    console.log("[Worker runMaximalPlacementBacktracking] Starting maximal placement using Backtracking...");
    allShapeData = new Map(); // Reset precomputed data
    const { shapesToPlace, initialGridState = 0n, lockedTilesMask } = taskData;
    const initialGridStateBigint = typeof initialGridState === 'string' ? BigInt(initialGridState) : initialGridState;
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    const startTime = Date.now();
    try {
        console.log("[Worker runMaximalPlacementBacktracking] Running precomputation...");
        // 1. Precompute all valid placements
        allShapeData = precomputeAllShapeData(shapesToPlace, lockedTilesMaskBigint);
        // 2. Prepare data for backtracking: Flatten and Sort valid placements
        const allValidPlacementsUnsorted = [];
        const placementCountsPerShapeType = {};
        allShapeData.forEach((shapeData, fullShapeId) => {
            const baseShapeId = fullShapeId.split('::')[0];
            if (!placementCountsPerShapeType[baseShapeId]) {
                placementCountsPerShapeType[baseShapeId] = 0;
            }
            shapeData.validPlacements.forEach(mask => {
                allValidPlacementsUnsorted.push({ shapeId: fullShapeId, placementMask: mask });
                placementCountsPerShapeType[baseShapeId]++;
            });
        });
        // Sort based on the heuristic (shape types with fewer placements first)
        const allValidPlacements = allValidPlacementsUnsorted.sort((a, b) => {
            const baseIdA = a.shapeId.split('::')[0];
            const baseIdB = b.shapeId.split('::')[0];
            const countA = placementCountsPerShapeType[baseIdA] ?? Infinity;
            const countB = placementCountsPerShapeType[baseIdB] ?? Infinity;
            // Primary sort: fewer placements first
            if (countA !== countB) {
                return countA - countB;
            }
            // Secondary sort: maybe by shapeId to ensure consistency (optional)
            return a.shapeId.localeCompare(b.shapeId);
        });
        if (allValidPlacements.length === 0) {
            console.log("[Worker runMaximalPlacementBacktracking] No valid placements found after precomputation.");
            return { maxShapes: 0, solutions: [] };
        }
        console.log(`[Worker runMaximalPlacementBacktracking] Precomputation done. Found ${allValidPlacements.length} total valid placements (Sorted).`); // Indicate sorted
        // 3. Initialize backtracking state
        let maxKFound = 0;
        let finalBestSolutions = [];
        const usedShapeTypes = new Set();
        // 4. Define the recursive backtracking function
        const backtrack = (currentIndex, currentGrid, currentPlacementList, currentShapeTypeSet) => {
            const currentK = currentPlacementList.length;
            if (currentK > maxKFound) {
                maxKFound = currentK;
                const newBestSolution = { gridState: currentGrid, placements: [...currentPlacementList] };
                finalBestSolutions = [newBestSolution];
                // Directly emit the solution (assuming precompute now guarantees 4 tiles)
                console.log(`[Worker Backtrack] New best k = ${maxKFound} found. Emitting solutionUpdate...`);
                try {
                    workerpool__WEBPACK_IMPORTED_MODULE_0__.workerEmit({
                        event: 'solutionUpdate',
                        data: { maxShapes: maxKFound, solution: newBestSolution }
                    });
                }
                catch (emitError) {
                    console.error("[Worker Backtrack] Error emitting solution update:", emitError);
                }
            }
            // Pruning: If remaining placements can't possibly beat maxKFound, stop.
            if (currentIndex >= allValidPlacements.length || (currentK + (allValidPlacements.length - currentIndex)) < maxKFound) {
                return;
            }
            // Iterate through remaining placements (now sorted)
            for (let i = currentIndex; i < allValidPlacements.length; i++) {
                const placement = allValidPlacements[i];
                // Extract base shape ID (part before '::') to check type usage
                const baseShapeId = placement.shapeId.split('::')[0];
                // Check for overlap AND if shape type already used
                if ((currentGrid & placement.placementMask) === 0n && // No overlap with current grid
                    !currentShapeTypeSet.has(baseShapeId) // Shape type not already used
                ) {
                    // Place the shape
                    currentPlacementList.push(placement);
                    currentShapeTypeSet.add(baseShapeId);
                    // Recurse
                    backtrack(i + 1, // Start next search from the next placement
                    currentGrid | placement.placementMask, currentPlacementList, currentShapeTypeSet);
                    // Backtrack: Remove the shape
                    currentPlacementList.pop();
                    currentShapeTypeSet.delete(baseShapeId);
                }
            }
        };
        // 5. Start the backtracking search (uses the sorted placements)
        console.log("[Worker runMaximalPlacementBacktracking] Starting backtracking search (with sorted placements)...");
        backtrack(0, initialGridStateBigint, [], usedShapeTypes);
        const endTime = Date.now();
        console.log(`[Worker runMaximalPlacementBacktracking] Backtracking finished in ${endTime - startTime}ms. Final max k = ${maxKFound}. Found ${finalBestSolutions.length} solution(s).`);
        return { maxShapes: maxKFound, solutions: finalBestSolutions };
    }
    catch (error) {
        console.error('[Worker runMaximalPlacementBacktracking] Error during execution:', error);
        return { maxShapes: 0, solutions: [], error: `Maximal Placement Backtracking Worker Error: ${error.message}` };
    }
};
// --- Worker Entry Point ---
workerpool__WEBPACK_IMPORTED_MODULE_0__.worker({
    runCombinatorialExactTiling: runCombinatorialExactTiling,
    runMaximalPlacementBacktracking: runMaximalPlacementBacktracking
});
console.log('[Solver Worker] Worker initialized and ready.');

})();

/******/ })()
;