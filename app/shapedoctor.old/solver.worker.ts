export {};

// --- Constants ---
const TOTAL_TILES = 44;
const ADJACENT_LIST = [
  [0, 0, 0, 0, 0, 0],
    [3, 0, 0, 2, 5, 0], [5, 1, 0, 0, 8, 4], [6, 0, 1, 5, 9, 0], // 1-3
    [8, 2, 0, 0, 11, 7], [12, 5, 4, 11, 15, 0], [13, 6, 5, 12, 16, 0], // 4-6
    [11, 4, 0, 0, 14, 0], [16, 9, 8, 15, 19, 0], // 7-9
    [17, 0, 6, 13, 0, 0], [15, 8, 7, 0, 18, 14], [19, 12, 11, 18, 22, 0], // 10-12
    [17, 10, 9, 16, 20, 0], [18, 11, 0, 0, 21, 7], [22, 15, 14, 21, 25, 0], // 13-15
    [20, 13, 12, 19, 23, 0], [24, 0, 13, 20, 0, 10], [26, 19, 18, 25, 29, 0], // 16-18
    [23, 16, 15, 22, 26, 0], [27, 17, 16, 23, 24, 0], [25, 18, 0, 0, 28, 14], // 19-21
    [29, 22, 21, 28, 32, 0], [27, 20, 19, 26, 30, 0], [31, 0, 20, 27, 0, 17], // 22-24
    [32, 25, 0, 0, 35, 21], [30, 23, 22, 29, 33, 0], [34, 27, 26, 33, 37, 0], // 25-27
    [36, 29, 28, 35, 39, 0], [33, 26, 25, 32, 36, 0], [37, 30, 29, 36, 40, 0], // 28-30
    [38, 0, 27, 34, 0, 24], [40, 33, 32, 39, 42, 0], // 31-33
    [41, 31, 30, 37, 38, 0], [39, 32, 0, 0, 0, 28], [42, 36, 35, 0, 0, 0], // 34-36
    [41, 34, 33, 40, 43, 0], [0, 0, 34, 41, 0, 31], [43, 37, 36, 42, 44, 0], // 37-39
    [0, 43, 42, 0, 0, 0], // 40-42
    [0, 41, 40, 44, 0, 0], [44, 40, 39, 0, 0, 0], // 43-44
];
const PROGRESS_UPDATE_INTERVAL = 50000;
const NUM_HEX_COLORS = 12;

// --- Bitmask Constants & Helpers ---
// A single 64-bit BigInt can represent the 44 tiles
type GridState = bigint;
const ALL_TILES_MASK = (BigInt(1) << BigInt(TOTAL_TILES)) - BigInt(1);

// Check if a tile is occupied in the bitmask state
const isTileOccupied = (state: GridState, tileId: number): boolean => {
    if (tileId < 1 || tileId > TOTAL_TILES) return true; // Treat out-of-bounds as occupied
    return (state & (BigInt(1) << BigInt(tileId - 1))) !== BigInt(0);
};

// --- Data Structures ---
interface PlacementOption {
    shapeIndex: number;
    tileIDs: number[];
    // Add bitmask representation later in Subtask 3.2
    // placementMask: GridState;
}

const HEX_GRID_COORDS_LIST = [
    { id: 1, q: 0, r: -3 }, { id: 2, q: -1, r: -2 }, { id: 3, q: 1, r: -3 },
    { id: 4, q: -2, r: -1 }, { id: 5, q: 0, r: -2 }, { id: 6, q: 2, r: -3 },
    { id: 7, q: -3, r: 0 },  { id: 8, q: -1, r: -1 }, { id: 9, q: 1, r: -2 }, { id: 10, q: 3, r: -3 },
    { id: 11, q: -2, r: 0 }, { id: 12, q: 0, r: -1 }, { id: 13, q: 2, r: -2 }, { id: 17, q: 3, r: -2 },
    { id: 14, q: -3, r: 1 }, { id: 15, q: -1, r: 0 }, { id: 16, q: 1, r: -1 }, { id: 20, q: 2, r: -1 }, { id: 24, q: 3, r: -1 },
    { id: 18, q: -2, r: 1 }, { id: 19, q: 0, r: 0 }, { id: 22, q: -1, r: 1 }, { id: 23, q: 1, r: 0 }, { id: 27, q: 2, r: 0 }, { id: 31, q: 3, r: 0 },
    { id: 21, q: -3, r: 2 }, { id: 25, q: -2, r: 2 }, { id: 26, q: 0, r: 1 }, { id: 29, q: -1, r: 2 }, { id: 30, q: 1, r: 1 }, { id: 34, q: 2, r: 1 }, { id: 38, q: 3, r: 1 },
    { id: 28, q: -3, r: 3 }, { id: 32, q: -2, r: 3 }, { id: 33, q: 0, r: 2 }, { id: 36, q: -1, r: 3 }, { id: 37, q: 1, r: 2 }, { id: 41, q: 2, r: 2 },
    { id: 35, q: -3, r: 4 }, { id: 39, q: -2, r: 4 }, { id: 40, q: 0, r: 3 }, { id: 42, q: -1, r: 4 }, { id: 43, q: 1, r: 3 }, { id: 44, q: 0, r: 4 }
];
const HEX_GRID_COORDS_MAP = new Map<number, { q: number; r: number }>();
HEX_GRID_COORDS_LIST.forEach((item) => HEX_GRID_COORDS_MAP.set(item.id, { q: item.q, r: item.r }));
const COORDS_TO_ID_MAP = new Map<string, number>();
HEX_GRID_COORDS_LIST.forEach((item) => COORDS_TO_ID_MAP.set(`${item.q},${item.r}`, item.id));

// --- Placement Generation Logic ---
const getRelativeCoords = (potentialString: string): Set<string> | null => {
    const coords: { q: number; r: number }[] = [];
    let firstTileId = -1;
    for (let i = 0; i < potentialString.length; i++) {
        if (potentialString.charAt(i) === '1') {
            const tileId = i + 1;
            if (tileId > TOTAL_TILES) continue;
            const coordData = HEX_GRID_COORDS_MAP.get(tileId);
            if (!coordData) continue;
            coords.push(coordData);
            if (firstTileId === -1) {
                firstTileId = tileId;
            }
        }
    }
    if (firstTileId === -1) return new Set();
    const anchorCoord = HEX_GRID_COORDS_MAP.get(firstTileId);
     if (!anchorCoord) return null;
    const relativeCoords = new Set<string>();
    coords.forEach(coord => {
        const relQ = coord.q - anchorCoord.q;
        const relR = coord.r - anchorCoord.r;
        relativeCoords.add(`${relQ},${relR}`);
    });
    return relativeCoords;
};

const generateAllPlacements = (
    potentialsList: string[]
): { allPlacements: PlacementOption[]; potentialCoveringShapesByTile: Map<number, Set<number>> } => {
    const allPlacementsMap = new Map<string, PlacementOption>();
    const potentialCoveringShapesByTile = new Map<number, Set<number>>();
    const expectedShapeSize = 4;

    potentialsList.forEach((potentialString, shapeIndex) => {
        const relativeCoordsSet = getRelativeCoords(potentialString);
        if (!relativeCoordsSet || relativeCoordsSet.size !== expectedShapeSize) {
            return; // Skip invalid shapes
        }
        const relativeCoordsArray = Array.from(relativeCoordsSet).map(s => {
             const [q, r] = s.split(',').map(Number);
             return { q, r };
         });
        for (let gridAnchorId = 1; gridAnchorId <= TOTAL_TILES; gridAnchorId++) {
            const gridAnchorCoord = HEX_GRID_COORDS_MAP.get(gridAnchorId);
            if (!gridAnchorCoord) continue;
            for (const shapeAnchorCoord of relativeCoordsArray) {
                const coveredTileIds = new Set<number>();
                let possiblePlacement = true;
                const originQ = gridAnchorCoord.q - shapeAnchorCoord.q;
                const originR = gridAnchorCoord.r - shapeAnchorCoord.r;
                for (const targetRelCoord of relativeCoordsArray) {
                    const targetGridQ = originQ + targetRelCoord.q;
                    const targetGridR = originR + targetRelCoord.r;
                    const targetGridId = COORDS_TO_ID_MAP.get(`${targetGridQ},${targetGridR}`);
                    if (targetGridId === undefined) {
                        possiblePlacement = false;
                        break;
                    }
                    coveredTileIds.add(targetGridId);
                }
                if (possiblePlacement && coveredTileIds.size === expectedShapeSize) {
                    const sortedTileIds = Array.from(coveredTileIds).sort((a, b) => a - b);
                    const placementKey = sortedTileIds.join(',');
                    if (!allPlacementsMap.has(placementKey)) {
                        const newPlacement: PlacementOption = {
                            shapeIndex: shapeIndex,
                            tileIDs: sortedTileIds,
                        };
                        allPlacementsMap.set(placementKey, newPlacement);

                        // Populate potentialCoveringShapesByTile
                        sortedTileIds.forEach(tileId => {
                            if (!potentialCoveringShapesByTile.has(tileId)) {
                                potentialCoveringShapesByTile.set(tileId, new Set<number>());
                            }
                            potentialCoveringShapesByTile.get(tileId)?.add(shapeIndex);
                        });
                    }
                }
            }
        }
    });
    return {
        allPlacements: Array.from(allPlacementsMap.values()),
        potentialCoveringShapesByTile: potentialCoveringShapesByTile
    };
};

// --- Backtracking Solver Implementation ---

/**
 * Checks if the remaining empty space is potentially viable for remaining shapes.
 * TODO: Enhance this significantly in later tasks (e.g., Task 4/Subtask 4.5).
 */
const isRemainingSpaceViable = (
    occupiedMask: GridState,
    availableShapeIndices: Set<number>,
    placementMasksByShape: Map<number, GridState[]>,
    potentialCoveringShapesByTile: Map<number, Set<number>>,
    currentPiecesPlaced: number
): { viable: boolean; upperBound: number } => {
    const numRemainingShapes = availableShapeIndices.size;
    if (numRemainingShapes <= 0) {
        // console.log(`[Viable Check @ Depth ${currentPiecesPlaced}] No remaining shapes. Viable: true, UB: ${currentPiecesPlaced}`);
        return { viable: true, upperBound: currentPiecesPlaced };
    }

    // Count empty tiles
    let emptyCount = 0;
    const emptyTiles: number[] = []; // Store IDs of empty tiles
    const emptyTileMask = ~occupiedMask & ALL_TILES_MASK;
    let checkMask = emptyTileMask;
    for (let tileId = 1; tileId <= TOTAL_TILES; tileId++) {
        if ((checkMask & BigInt(1)) !== BigInt(0)) {
            emptyCount++;
            emptyTiles.push(tileId);
        }
        checkMask >>= BigInt(1);
    }

    const maxPossibleFromEmpty = Math.floor(emptyCount / 4);
    const potentialUpperBound = currentPiecesPlaced + maxPossibleFromEmpty;

    // Basic checks
    if (emptyCount === 0) {
        // console.log(`[DEBUG][Viable Check @ Depth ${currentPiecesPlaced}] No empty tiles. Viable: ${numRemainingShapes === 0}, UB: ${currentPiecesPlaced}`);
        return { viable: numRemainingShapes === 0, upperBound: currentPiecesPlaced };
    }

    // --- OPTIMIZED Dead-End Detection: Check if any empty tile is uncoverable --- 
    for (const tileId of emptyTiles) { // Loop 1: Over all empty tiles
        let canTileBeCovered = false;
        const potentialShapes = potentialCoveringShapesByTile.get(tileId);

        if (potentialShapes) {
            // Find intersection: potentialShapes INTERSECT availableShapeIndices
            const relevantAvailableShapes: number[] = [];
            for (const shapeIdx of availableShapeIndices) {
                if (potentialShapes.has(shapeIdx)) {
                    relevantAvailableShapes.push(shapeIdx);
                }
            }

            // Check if any relevant shape can actually be placed to cover this tile
            tileCheckLoop:
            for (const shapeIndex of relevantAvailableShapes) { // Loop 2: *Only* over relevant available shapes
                const placements = placementMasksByShape.get(shapeIndex) || [];
                for (const placementMask of placements) { // Loop 3: Over placements for that shape
                    // Check if placement is valid (no overlap) AND covers the tile
                    if (((placementMask & occupiedMask) === BigInt(0)) &&
                        ((placementMask & (BigInt(1) << BigInt(tileId - 1))) !== BigInt(0))) {
                        canTileBeCovered = true;
                        break tileCheckLoop; // Found a covering placement, move to next empty tile
                    }
                }
            }
        }
        // If no potential shapes could ever cover this tile, or if none of the relevant
        // available shapes had a valid placement covering it, canTileBeCovered remains false.

        if (!canTileBeCovered) {
            // console.log(`[DEBUG][Optimized Viable Check @ Depth ${currentPiecesPlaced}] DeadEnd: Tile ${tileId} cannot be covered by remaining shapes: ${Array.from(availableShapeIndices).join(',')}`);
            return { viable: false, upperBound: potentialUpperBound }; // Found an uncoverable empty tile
        }
    }
    // --- End Optimized Dead-End Detection ---

    // If all checks pass
    // console.log(`[Viable Check @ Depth ${currentPiecesPlaced}] Checks passed. Viable: true, UB: ${potentialUpperBound}`);
    return { viable: true, upperBound: potentialUpperBound };
};

// --- State for the solver ---
// Store solutions as GridState (bitmasks)
let allFoundSolutionsMasks: GridState[] = [];
// Store the mapping from placed shape index to its bitmask for each solution
let allFoundSolutionsDetails: Map<number, GridState>[] = [];

// --- Transposition Table (Memoization) ---
interface MemoEntry {
    score: number; // Max pieces found *from* this state
    depthSearched: number; // How many levels deep the search went *from* this state
    // Future: Add type: 'exact' | 'lowerBound' | 'upperBound'
}
// Key = GridState (BigInt as string)
let searchedStates: Map<string, MemoEntry>;

// Global max pieces found across all solutions
let maxPiecesPlaced = 0;

// --- Object Pooling for Sets ---
const setPool: Set<number>[] = [];
const MAX_POOL_SIZE = 100; // Limit pool size to prevent unbounded growth

const getSetFromPool = (): Set<number> => {
    if (setPool.length > 0) {
        const pooledSet = setPool.pop()!;
        // pooledSet.clear(); // Clear is done in release
        return pooledSet;
    }
    return new Set<number>();
};

const releaseSetToPool = (releasedSet: Set<number>): void => {
    releasedSet.clear();
    if (setPool.length < MAX_POOL_SIZE) {
         setPool.push(releasedSet);
    }
    // If pool is full, the set will just be garbage collected
};

/**
 * Converts a GridState (bitmask) back to the number[] format expected by colorSolution.
 * TODO: Optimize or remove colorSolution later if possible.
 */
const gridStateToArray = (occupiedMask: GridState, shapeMasks: Map<number, GridState>): number[] => {
    const solutionGrid = Array(TOTAL_TILES + 1).fill(-1);
    shapeMasks.forEach((mask, shapeIndex) => {
        for (let tileId = 1; tileId <= TOTAL_TILES; tileId++) {
             if ((mask & (BigInt(1) << BigInt(tileId - 1))) !== BigInt(0)) {
                 solutionGrid[tileId] = shapeIndex;
             }
        }
    });
    return solutionGrid;
};

/**
 * Calculates valid placement counts for all available shapes and returns them sorted by count (ascending).
 */
const getShapesSortedByMRV = (
    availableShapeIndices: Set<number>,
    currentOccupiedMask: GridState,
    placementMasksByShape: Map<number, GridState[]>,
): { shapeIndex: number; count: number }[] => {
    const shapePlacementCounts: { shapeIndex: number; count: number }[] = [];

    for (const shapeIndex of availableShapeIndices) {
        const placements = placementMasksByShape.get(shapeIndex) || [];
        let validPlacementCount = 0;
        for (const placementMask of placements) {
            // Check if placement is valid (no overlap with current mask)
            if ((currentOccupiedMask & placementMask) === BigInt(0)) {
                validPlacementCount++;
            }
        }

        // Only consider shapes that *can* be placed
        if (validPlacementCount > 0) {
             shapePlacementCounts.push({ shapeIndex, count: validPlacementCount });
        }
    }

    // Sort shapes: fewest valid placements first
    shapePlacementCounts.sort((a, b) => a.count - b.count);

    return shapePlacementCounts;
};

/**
 * Recursive backtracking solver using pre-calculated placements and bitmasks.
 * Incorporates branch & bound pruning, MRV heuristic (ordering), and transposition table.
 */
const solveRecursive = (
  potentialsList: string[],
  allPlacements: PlacementOption[],
  placementMasksByShape: Map<number, GridState[]>,
  potentialCoveringShapesByTile: Map<number, Set<number>>,
  availableShapeIndices: Set<number>,
  currentOccupiedMask: GridState,
  currentPlacedMasks: Map<number, GridState>,
  currentDepth: number,
  depthLimit: number
): number => {
  // const currentMaskStr = currentOccupiedMask.toString(); // For logging
  // console.log(`[DEBUG][Enter solveRecursive] Depth: ${currentDepth}, Limit: ${depthLimit}, Mask: ${currentMaskStr.slice(0,20)}..., Avail: ${availableShapeIndices.size}`);

  // --- Base Case / Depth Limit ---
  if (currentDepth >= depthLimit || availableShapeIndices.size === 0) {
      // Found a potential solution (reached depth limit or ran out of shapes)
      if (currentDepth > maxPiecesPlaced) {
          // This is a new best depth
          maxPiecesPlaced = currentDepth;
          allFoundSolutionsDetails = [new Map(currentPlacedMasks)]; // Store ONLY this new best solution
          // console.log(`[Worker] New best depth: ${maxPiecesPlaced} pieces. Storing 1 solution.`);
      } else if (currentDepth === maxPiecesPlaced && maxPiecesPlaced > 0 && allFoundSolutionsDetails.length === 0) {
          // This is the FIRST solution found at the current best depth
          allFoundSolutionsDetails.push(new Map(currentPlacedMasks));
          // console.log(`[Worker] Storing FIRST solution for depth ${maxPiecesPlaced}.`);
      }
      // If currentDepth === maxPiecesPlaced but we already have a solution stored, we do nothing.
      // If currentDepth < maxPiecesPlaced, we also do nothing.

      return 0; // Return 0 additional pieces from this leaf/limit
  }

  // --- Calculate Remaining Depth & State Key ---
  const remainingDepthToSearch = depthLimit - currentDepth;
  const stateKey = currentOccupiedMask.toString(); // Use already stringified mask

  // --- Transposition Table Lookup ---
  const memoEntry = searchedStates.get(stateKey);
  if (memoEntry && memoEntry.depthSearched >= remainingDepthToSearch) {
      // console.log(`[DEBUG][Memo Hit] Depth: ${currentDepth}, Key: ${stateKey.slice(0,20)}..., Stored Score: ${memoEntry.score}, Stored Depth: ${memoEntry.depthSearched} >= Remaining: ${remainingDepthToSearch}`);
      // If a memoized entry leads to the currently known max score, we need to reconstruct/store its path later if needed.
      // For now, return the score to assist pruning.
      return memoEntry.score;
  }

  // --- Calculate Remaining Shapes & Upper Bound Pruning ---
  const numRemainingShapes = availableShapeIndices.size;
  const { viable: isCurrentStateViable, upperBound: currentUpperBound } = isRemainingSpaceViable(
      currentOccupiedMask,
      availableShapeIndices,
      placementMasksByShape,
      potentialCoveringShapesByTile,
      currentDepth
  );

  // ---> Disable Log Before Prune 1 <---
  // console.log(`[DEBUG][Pruning Check @ Depth ${currentDepth}] Viable: ${isCurrentStateViable}, UpperBound: ${currentUpperBound}, MaxPlaced: ${maxPiecesPlaced}. Condition: (!${isCurrentStateViable} || (${currentDepth} + ${currentUpperBound}) <= ${maxPiecesPlaced})`);
  // ---> End Log <---

  // Pruning 1
  if (!isCurrentStateViable || (currentDepth + currentUpperBound) <= maxPiecesPlaced) {
      // Important: Even if we prune, a stored memoEntry score might have been important.
      // However, the base case logic now handles storing the actual solution maps.
      return 0;
  }

  // --- Progress Update ---
  if (searchedStates.size % PROGRESS_UPDATE_INTERVAL === 0) {
    self.postMessage({ type: "progress", count: searchedStates.size });
  }

  // --- Main Recursive Loop --- 
  let maxScoreFromThisNode = 0; // Max score achievable *from* this node, assuming we place *nothing* initially

  // Get available shapes sorted by MRV
  const shapesToTry = getShapesSortedByMRV(
      availableShapeIndices,
      currentOccupiedMask,
      placementMasksByShape
  );

  // Iterate through each available shape (ordered by MRV)
  for (const shapeInfo of shapesToTry) {
      const shapeToTryIndex = shapeInfo.shapeIndex;
      const placementMasksToTry = placementMasksByShape.get(shapeToTryIndex) || [];

      // Create the set of remaining shapes *if* we place this one
      const nextAvailableIndices = getSetFromPool();
      for (const idx of availableShapeIndices) {
          if (idx !== shapeToTryIndex) {
              nextAvailableIndices.add(idx);
          }
      }

      // Try each valid placement for the current shapeToTryIndex
      for (const placementMask of placementMasksToTry) {
          if ((currentOccupiedMask & placementMask) === BigInt(0)) { // Check if placement is valid
              const nextOccupiedMask = currentOccupiedMask | placementMask;
              const nextPiecesPlaced = currentDepth + 1;

              // Pruning 2: Check if this placement could possibly lead to a better solution
              const { viable: isNextStateViable, upperBound: nextUpperBound } = isRemainingSpaceViable(
                  nextOccupiedMask,
                  nextAvailableIndices,
                  placementMasksByShape,
                  potentialCoveringShapesByTile,
                  nextPiecesPlaced
              );
              const potentialScoreViaNext = nextPiecesPlaced + nextUpperBound;

              if (isNextStateViable && potentialScoreViaNext > maxPiecesPlaced) {
                  // Place the piece and recurse
                  currentPlacedMasks.set(shapeToTryIndex, placementMask);

                  const scoreFromBranch = solveRecursive(
                      potentialsList,
                      allPlacements,
                      placementMasksByShape,
                      potentialCoveringShapesByTile,
                      nextAvailableIndices,
                      nextOccupiedMask,
                      currentPlacedMasks,
                      nextPiecesPlaced,
                      depthLimit
                  );

                  // We placed 1 piece + score from the recursive call
                  const totalScoreForThisBranch = 1 + scoreFromBranch;
                  maxScoreFromThisNode = Math.max(maxScoreFromThisNode, totalScoreForThisBranch);

                  // Backtrack
                  currentPlacedMasks.delete(shapeToTryIndex);
              } // End prune check
          } // End placement valid check
      } // End loop over placements

      // Release the set used for this shape's recursion branches
      releaseSetToPool(nextAvailableIndices);

  } // End loop over shapes to try

  // --- Store result in Transposition Table ---
  const existingEntry = searchedStates.get(stateKey);
  if (!existingEntry || existingEntry.depthSearched < remainingDepthToSearch) {
      searchedStates.set(stateKey, { score: maxScoreFromThisNode, depthSearched: remainingDepthToSearch });
  }

  return maxScoreFromThisNode;
};

// --- Web Worker Message Handling ---
self.onmessage = (event: MessageEvent<{ potentials: string[]; initialShapeIndexToTry?: number | null }>) => {
  const { potentials: potentialsList, initialShapeIndexToTry = null } = event.data;
  if (!potentialsList || potentialsList.length === 0) {
    self.postMessage({ type: "error", message: "No potentials provided." });
    return;
  }

  console.log(`[Worker] Received ${potentialsList.length} potentials. ${initialShapeIndexToTry !== null ? `Assigned initial shape: ${initialShapeIndexToTry}` : 'Running full search.'}`);
  const startTime = performance.now();

  // --- Pre-calculation ---
  let allPlacements: PlacementOption[];
  let placementMasksByShape: Map<number, GridState[]> = new Map();
  let potentialCoveringShapesByTile: Map<number, Set<number>>;

  try {
      const generationResult = generateAllPlacements(potentialsList);
      allPlacements = generationResult.allPlacements;
      potentialCoveringShapesByTile = generationResult.potentialCoveringShapesByTile;
      console.log(`[Worker] Generated ${allPlacements.length} total unique placements.`);
      console.log(`[Worker] Generated potential covering shapes map for tiles.`);

      allPlacements.forEach(placement => {
          let mask = BigInt(0);
          for (const tileId of placement.tileIDs) {
              mask |= (BigInt(1) << BigInt(tileId - 1));
          }
          if (!placementMasksByShape.has(placement.shapeIndex)) {
              placementMasksByShape.set(placement.shapeIndex, []);
          }
          placementMasksByShape.get(placement.shapeIndex)?.push(mask);
      });
      console.log(`[Worker] Precomputed placement masks for ${placementMasksByShape.size} shapes.`);

  } catch (e) {
       console.error("[Worker] Error during placement generation:", e);
       self.postMessage({ type: "error", message: `Placement generation failed: ${e instanceof Error ? e.message : e}` });
       return;
  }

  const shapeIndices = potentialsList.map((_, index) => index).filter(index => {
       return placementMasksByShape.has(index);
  });
  console.log(`[Worker] Filtered ${shapeIndices.length} shape indices with valid placements.`);
  // Sorting here is less critical now as work distribution handles initial choices

  // --- End Pre-calculation ---

  // Reset state for backtracking
  allFoundSolutionsDetails = []; // Worker only finds its local best
  maxPiecesPlaced = 0;
  searchedStates = new Map<string, MemoEntry>();
  const initialOccupiedMask: GridState = BigInt(0);
  const initialPlacedMasks = new Map<number, GridState>();
  const maxPossibleDepth = shapeIndices.length;

  try {
    let overallMaxScore = 0; // Track the max score found by this worker

    if (initialShapeIndexToTry !== null && shapeIndices.includes(initialShapeIndexToTry)) {
        // --- Worker assigned a specific starting shape ---
        console.log(`[Worker] Starting search focused on initial shape ${initialShapeIndexToTry}. Max Depth: ${maxPossibleDepth}`);
        const shapeToTryIndex = initialShapeIndexToTry;
        const placements = placementMasksByShape.get(shapeToTryIndex) || [];

        const nextAvailableIndicesBase = getSetFromPool();
        for(const idx of shapeIndices) {
            if (idx !== shapeToTryIndex) {
                nextAvailableIndicesBase.add(idx);
            }
        }

        if (placements.length > 0 && nextAvailableIndicesBase.size >= 0) {
            for (const placementMask of placements) {
                 // Check validity against initial empty mask (should always be valid)
                 if ((initialOccupiedMask & placementMask) === BigInt(0)) { 
                    const nextOccupiedMask = initialOccupiedMask | placementMask;
                    const nextPiecesPlaced = 1; // We've placed the first piece

                    // Pruning check before diving deep
                    const { viable: isNextStateViable, upperBound: nextUpperBound } = isRemainingSpaceViable(
                        nextOccupiedMask,
                        nextAvailableIndicesBase,
                        placementMasksByShape,
                        potentialCoveringShapesByTile,
                        nextPiecesPlaced
                    );
                    // We don't have a global maxPiecesPlaced yet, so just check viability
                    if (isNextStateViable) { 
                        initialPlacedMasks.set(shapeToTryIndex, placementMask); // Set the initial placement

                        const scoreFromBranch = solveRecursive(
                            potentialsList,
                            allPlacements,
                            placementMasksByShape,
                            potentialCoveringShapesByTile,
                            nextAvailableIndicesBase, // Pass the set excluding the initial shape
                            nextOccupiedMask,
                            initialPlacedMasks, // Pass the map with the initial placement
                            nextPiecesPlaced, // Start depth is 1
                            maxPossibleDepth
                        );
                        
                        // +1 because scoreFromBranch is pieces *in addition* to the initial one
                        overallMaxScore = Math.max(overallMaxScore, 1 + scoreFromBranch); 

                        initialPlacedMasks.delete(shapeToTryIndex); // Backtrack initial placement
                    }
                }
            }
        } else {
             console.log(`[Worker] Initial shape ${initialShapeIndexToTry} has no placements or no other shapes exist.`);
        }
        releaseSetToPool(nextAvailableIndicesBase);

    } else {
        // --- Worker runs the full search (original single-pass logic) ---
        console.log(`[Worker] Starting full single search pass. Max Depth: ${maxPossibleDepth}`);
        if (shapeIndices.length > 0) {
            overallMaxScore = solveRecursive(
                potentialsList,
                allPlacements,
                placementMasksByShape,
                potentialCoveringShapesByTile,
                new Set(shapeIndices),
                initialOccupiedMask,
                initialPlacedMasks,
                0, // Start at depth 0
                maxPossibleDepth
            );
        } else {
             console.log(`[Worker] No valid shapes to place.`);
        }
    }

    // NOTE: maxPiecesPlaced is updated globally within solveRecursive
    // If this worker found *the* best solution across all potential workers,
    // allFoundSolutionsDetails will contain it.

    const endTime = performance.now();
    console.log(`[Worker ${initialShapeIndexToTry ?? 'Full'}] Search finished in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`[Worker ${initialShapeIndexToTry ?? 'Full'}] Explored ${searchedStates?.size || 0} states.`);
    console.log(`[Worker ${initialShapeIndexToTry ?? 'Full'}] Max pieces found in *this worker's branch*: ${maxPiecesPlaced}. Found ${allFoundSolutionsDetails.length} solution(s).`);

    // Send back this worker's best result
    self.postMessage({
      type: "result",
      // Send only the details map; the main thread will aggregate
      bestSolutionMap: allFoundSolutionsDetails.length > 0 ? allFoundSolutionsDetails[0] : null, 
      maxPieces: maxPiecesPlaced, // Max pieces found by this worker
      searchedCount: searchedStates?.size || 0,
      workerId: initialShapeIndexToTry, // Identify which worker this was
    });

  } catch (error) {
    console.error(`[Worker ${initialShapeIndexToTry ?? 'Full'}] Error during backtracking:`, error);
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "Unknown worker error", workerId: initialShapeIndexToTry });
  }
};