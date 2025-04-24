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
import { TOTAL_TILES as CONFIG_TOTAL_TILES, HEX_GRID_COORDS } from './shapedoctor.config';

// Export TOTAL_TILES for use in tests
export const TOTAL_TILES = CONFIG_TOTAL_TILES;

// Helper map for quick lookup of tile ID by axial coordinates
const coordToIdMap: Map<string, number> = new Map();
HEX_GRID_COORDS.forEach((coord: { q: number; r: number; id: number }) => {
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
const rotate60ClockwiseCoords = (q: number, r: number): { q: number; r: number } => {
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
export const shapeStringToBitmask = (shapeString: string): bigint => {
  if (shapeString.length !== TOTAL_TILES) {
    throw new Error(
      `Invalid shape string length: expected ${TOTAL_TILES}, got ${shapeString.length}`
    );
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
export const isValidPlacement = (
  gridState: bigint,
  shapePlacement: bigint
): boolean => {
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
export const placeShape = (
  gridState: bigint,
  shapePlacement: bigint
): bigint => {
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
export const removeShape = (
  gridState: bigint,
  shapePlacement: bigint
): bigint => {
  // Use bitwise AND with the complement of the shape mask to remove its bits.
  return gridState & ~shapePlacement;
};

/**
 * A bigint bitmask representing a completely full grid (all 44 tiles occupied).
 * Calculated as (1n << 44n) - 1n.
 */
export const FULL_GRID_MASK = (1n << BigInt(TOTAL_TILES)) - 1n;

/**
 * Checks if the grid is completely full based on its bitmask representation.
 *
 * @param gridState - The current grid state bitmask.
 * @returns True if all 44 tiles are occupied, false otherwise.
 */
export const isGridFull = (gridState: bigint): boolean => {
  return gridState === FULL_GRID_MASK;
};

/**
 * Rotates a shape bitmask 60 degrees clockwise.
 *
 * @param shapeMask - The bitmask of the shape to rotate.
 * @returns The bitmask of the rotated shape, or 0n if rotation results in invalid coordinates.
 */
export const rotateShapeBitmask = (shapeMask: bigint): bigint => {
  let rotatedMask = 0n;
  for (const coord of HEX_GRID_COORDS) {
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
const reflectQAxisCoords = (q: number, r: number): { q: number; r: number } => {
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
export const reflectShapeBitmask = (shapeMask: bigint): bigint => {
  let reflectedMask = 0n;
  for (const coord of HEX_GRID_COORDS) {
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
export const generateUniqueOrientations = (baseShapeMask: bigint): Set<bigint> => {
  const uniqueOrientations = new Set<bigint>();
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
export const getCanonicalShape = (shapeMask: bigint): bigint => {
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
export const bitmaskToTileIds = (bitmask: bigint): number[] => {
  const tileIds: number[] = [];
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
export const findLowestSetBitIndex = (mask: bigint): number => {
  if (mask === 0n) {
    return -1;
  }
  let index = 0;
  while ((mask & (1n << BigInt(index))) === 0n) {
    index++;
    // Add a safeguard against infinite loops, though theoretically unnecessary if mask !== 0n
    if (index > TOTAL_TILES) return -1; // Should not happen for valid shape masks
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
export const translateShapeBitmask = (
  shapeMask: bigint,
  deltaQ: number,
  deltaR: number
): bigint => {
  let translatedMask = 0n;
  for (const coord of HEX_GRID_COORDS) {
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
export const countSetBits = (mask: bigint): number => {
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
export const setTileLock = (mask: bigint, tileId: number): bigint => {
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
export const clearTileLock = (mask: bigint, tileId: number): bigint => {
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
export const toggleTileLock = (mask: bigint, tileId: number): bigint => {
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
export const isTileLocked = (mask: bigint, tileId: number): boolean => {
    if (tileId < 1 || tileId > TOTAL_TILES) {
        console.warn(`Attempted to check lock status for invalid tile ID: ${tileId}`);
        return false; // Or throw an error, depending on desired behavior
    }
    const bitPosition = BigInt(tileId - 1);
    return (mask & (1n << bitPosition)) !== 0n;
};

// Add other bitmask utility functions here in subsequent tasks... 