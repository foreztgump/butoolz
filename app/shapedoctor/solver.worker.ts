// app/shapedoctor/solver.worker.ts - Optimized Backtracking Version

import * as workerpool from 'workerpool';
import {
  shapeStringToBitmask,
  generateUniqueOrientations,
  translateShapeBitmask,
  bitmaskToTileIds,
  countSetBits,
  getCanonicalShape,
  isValidPlacement,
  placeShape,
  removeShape,
  isGridFull,
  findLowestSetBitIndex,
} from './bitmaskUtils';
import { HEX_GRID_COORDS, ADJACENT_LIST, TOTAL_TILES } from './shapedoctor.config';
import {
    type SolverExecDataBacktracking,
    type SolverResultPayloadBacktracking,
    type ShapeData, 
    type PlacementRecord, 
    type SolutionRecord
} from './types';
import { findExact11TilingSolutions } from './solver.dlx';

// --- Utility Function: Generate Combinations ---
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
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

const FULL_GRID_MASK = (1n << BigInt(TOTAL_TILES)) - 1n; // Mask for a full grid

// --- State Variables for Backtracking ---
let maxShapesPlacedSoFar: number = 0;
// Use a Map for efficient uniqueness check based on gridState
let bestSolutionsFound: Map<bigint, PlacementRecord[]> = new Map();
let allShapeData: Map<string, ShapeData> = new Map(); // To store precomputed data for each shape
// Transposition Table stores max ADDITIONAL shapes found from a state
let transpositionTable: Map<string, number | 'in_progress'> = new Map();

// --- Core Backtracking Function ---
const solveBacktracking = (
  currentGridState: bigint,
  availableShapeIds: string[],
  currentPlacement: PlacementRecord[]
): number => { // <-- Returns max additional shapes
  // --- State Key for Memoization ---
  const stateKey = `${currentGridState}:${availableShapeIds.sort().join(',')}`;

  // --- Transposition Table Lookup ---
  const cachedResult = transpositionTable.get(stateKey);
  if (cachedResult === 'in_progress') {
      return 0; // Cycle detected or already being processed
  }
  if (typeof cachedResult === 'number') {
      // Update global best if this cached path is better than current global best
      const potentialGlobalMax = currentPlacement.length + cachedResult;
      if (potentialGlobalMax > maxShapesPlacedSoFar) {
          // We have a depth, but not the specific placement that achieved it.
          // This simple caching only prunes based on depth, doesn't store the solution path.
          // To store the solution path, the cache value would need to be more complex.
          // For now, just return the cached depth to prune branches.
          // Global best update will happen when leaves are reached directly.
      }
      // Log cache hit
      // if (transpositionTable.size % 10000 === 0) { // Less frequent logging maybe
      //   console.debug(`[Worker BT Cache Hit] State: ${stateKey.substring(0,20)}..., Result: ${cachedResult}`);
      // }
      return cachedResult; // Return cached max additional shapes
  }
  // Mark state as in progress
  transpositionTable.set(stateKey, 'in_progress');
  // --- End Lookup ---

  let maxAdditionalShapesFound = 0;

  // --- Pruning Check (Connected Components) ---
  if (!isRemainingSpaceViable(currentGridState)) {
      transpositionTable.set(stateKey, 0); // Store 0 additional shapes for pruned state
      return 0; 
  }
  // --- End Pruning Check ---

  // --- Goal Check (Updates GLOBAL best) ---
  // This still updates the global best when a valid placement is found
  if (currentPlacement.length > maxShapesPlacedSoFar) {
    maxShapesPlacedSoFar = currentPlacement.length;
    bestSolutionsFound.clear(); 
    bestSolutionsFound.set(currentGridState, [...currentPlacement]); 
    // console.log(`[Worker BT] New best found: ${maxShapesPlacedSoFar} shapes`);
  } else if (currentPlacement.length === maxShapesPlacedSoFar && maxShapesPlacedSoFar > 0) {
    if (!bestSolutionsFound.has(currentGridState)) {
        bestSolutionsFound.set(currentGridState, [...currentPlacement]); 
    }
  }
  // --- End Goal Check ---

  // --- Base Case ---
  if (availableShapeIds.length === 0) {
      transpositionTable.set(stateKey, 0); // Store 0 additional shapes for leaf state
      return 0; // No more shapes can be added
  }
  // --- End Base Case ---

  // --- MRV Heuristic (Select Most Constrained Shape) ---
  let minCount = Infinity;
  let shapeIdToTry: string | null = null;
  for (const currentShapeId of availableShapeIds) {
      const count = countValidPlacements(currentShapeId, currentGridState);
      if (count < minCount) {
          minCount = count;
          shapeIdToTry = currentShapeId;
      }
  }
  if (shapeIdToTry === null && availableShapeIds.length > 0) {
      // This should not happen if precomputation worked and shapes are valid
      console.error("[Worker BT ERROR] MRV failed to select a shape!");
      transpositionTable.set(stateKey, 0); // Store 0 as result for this error state
      return 0; 
  }
  // --- End MRV Heuristic ---
  
  // --- Prepare for Recursion --- 
  // This check is likely redundant due to the MRV error check above, but safe
  if (shapeIdToTry === null) { 
       transpositionTable.set(stateKey, 0); 
       return 0;
  }
  const remainingShapeIds = availableShapeIds.filter(id => id !== shapeIdToTry);
  const shapeData = allShapeData.get(shapeIdToTry)!; // Should exist due to MRV logic
  if (!shapeData) {
     // This would indicate a logic error
     console.error(`[Worker BT] Shape data missing AFTER MRV: ${shapeIdToTry}`);
     transpositionTable.set(stateKey, 0); 
     return 0; 
  }
  // --- End Prepare for Recursion ---

  // --- Recursive Step --- 
  // 1. Try Placing the Selected Shape
  if (shapeData.validPlacements) {
      for (const placementMask of shapeData.validPlacements) {
          if ((currentGridState & placementMask) === 0n) { // Check for overlap
              const newGridState = currentGridState | placementMask;
              const newPlacement = [
                  ...currentPlacement,
                  { shapeId: shapeIdToTry, placementMask }, 
              ];
              // Result is the additional shapes placed from the NEW state
              const additionalShapesAfterPlace = solveBacktracking(newGridState, remainingShapeIds, newPlacement);
              // Our result for *this* branch is 1 (for the shape we placed) + recursive result
              maxAdditionalShapesFound = Math.max(maxAdditionalShapesFound, 1 + additionalShapesAfterPlace);
          }
      }
  } 

  // 2. Try Skipping the Selected Shape
  const additionalShapesAfterSkip = solveBacktracking(currentGridState, remainingShapeIds, currentPlacement);
  maxAdditionalShapesFound = Math.max(maxAdditionalShapesFound, additionalShapesAfterSkip);
  // --- End Recursive Step ---

  // --- Store Result & Return ---
  transpositionTable.set(stateKey, maxAdditionalShapesFound);
  // Add periodic logging for table size if needed for debugging memory
  // if (transpositionTable.size % 50000 === 0) { 
  //     console.log(`[Worker BT] Transposition Table Size: ${transpositionTable.size}`);
  // }
  return maxAdditionalShapesFound;
};

// --- Helper Function for MRV: Count Valid Placements ---
const countValidPlacements = (shapeId: string, currentGridState: bigint): number => {
    const shapeData = allShapeData.get(shapeId);
    // If shape data or placements are missing, return a high value
    if (!shapeData?.validPlacements) {
        return Infinity; // Treat missing data as unconstrained (shouldn't happen ideally)
    }
    let count = 0;
    for (const placementMask of shapeData.validPlacements) {
        if ((currentGridState & placementMask) === 0n) {
            count++;
        }
    }
    return count;
};

// --- Pruning Helper Function (Connected Components Check) ---
const isRemainingSpaceViable = (gridState: bigint): boolean => {
    const emptyTilesMask = FULL_GRID_MASK ^ gridState;
    let visitedMask = 0n;

    // Optimization: If no empty tiles, it's viable (or full)
    if (emptyTilesMask === 0n) {
        return true;
    }

    for (let i = 1; i <= TOTAL_TILES; i++) {
        const tileMask = 1n << BigInt(i - 1);

        // Check if this tile is empty and not yet visited
        if ((emptyTilesMask & tileMask) !== 0n && (visitedMask & tileMask) === 0n) {
            let currentRegionSize = 0;
            const queue: bigint[] = [tileMask]; // Use bigint masks in queue
            visitedMask |= tileMask; // Mark starting tile as visited

            // Start Flood Fill (BFS)
            while (queue.length > 0) {
                const currentTileMask = queue.shift()!;
                currentRegionSize++;
                // Find tile ID from mask efficiently
                const currentTileId = BigInt.asUintN(64, currentTileMask).toString(2).length;
                const neighbors = ADJACENT_LIST[currentTileId] || [];

                for (const neighborId of neighbors) {
                    if (neighborId === 0) continue; // Skip invalid neighbors
                    const neighborMask = 1n << BigInt(neighborId - 1);

                    // Check if neighbor is empty and not visited
                    if ((emptyTilesMask & neighborMask) !== 0n && (visitedMask & neighborMask) === 0n) {
                        visitedMask |= neighborMask;
                        queue.push(neighborMask);
                    }
                }
            }
            // --- End Flood Fill ---

            // Divisibility Check for the completed region
            if (currentRegionSize % 4 !== 0) {
                return false; // Prune: region size not divisible by shape size (4)
            }
        }
    }
    // If all regions passed the divisibility check
    return true;
};

// --- Precomputation Function ---
const precomputeAllShapeData = (
  shapesToPlace: { id: string }[],
  lockedTilesMask: bigint // Add lockedTilesMask parameter
): Map<string, ShapeData> => {
  console.log("[Worker Precompute] Starting precomputation (using deltaQ/R)...");
  const computationStartTime = Date.now();
  const computedData = new Map<string, ShapeData>();

  // Use original IDs directly for the map initially, handle canonical later if needed by solver
  shapesToPlace.forEach(shapeInput => {
    const shapeId = shapeInput.id;
    const shapeStartTime = Date.now();
    try {
        const baseShapeMask = shapeStringToBitmask(shapeId);
        if (baseShapeMask === 0n) {
             console.warn(`[Worker Precompute] Skipping shape with empty mask: ${shapeId}`);
             return; // Skip this shape
        }
        const uniqueOrientations = generateUniqueOrientations(baseShapeMask);
        const validPlacements = new Set<bigint>();
        const tileCount = countSetBits(baseShapeMask); // Expected number of tiles

        // Find reference point for the base shape (needed for delta calculation)
        const baseShapeTileIds = bitmaskToTileIds(baseShapeMask);
        if (baseShapeTileIds.length === 0) throw new Error('Base shape has no tiles.');
        const baseReferenceTileId = Math.min(...baseShapeTileIds);
        const baseReferenceCoord = HEX_GRID_COORDS.find(c => c.id === baseReferenceTileId);
        if (!baseReferenceCoord) throw new Error(`Base ref coord not found for ${baseReferenceTileId}`);

        uniqueOrientations.forEach(orientationMask => {
            const orientationTileIds = bitmaskToTileIds(orientationMask);
            if (orientationTileIds.length === 0) return; // Should not happen
            // Use the same reference point finding logic for consistency
            const orientationReferenceTileId = Math.min(...orientationTileIds);
            const orientationReferenceCoord = HEX_GRID_COORDS.find(c => c.id === orientationReferenceTileId);
            if (!orientationReferenceCoord) return;

            // Iterate through all possible target positions on the grid
            HEX_GRID_COORDS.forEach(targetCoord => {
                const deltaQ = targetCoord.q - orientationReferenceCoord.q;
                const deltaR = targetCoord.r - orientationReferenceCoord.r;

                // Translate the shape
                const translatedMask = translateShapeBitmask(orientationMask, deltaQ, deltaR);

                // Validate the translated mask
                if (countSetBits(translatedMask) === tileCount) { 
                    // *** Check against locked tiles ***
                    if ((translatedMask & lockedTilesMask) === 0n) {
                        validPlacements.add(translatedMask);
                    }
                    // *** End check ***
                }
            });
        });

        if (validPlacements.size > 0) {
            // Use the original shapeId as the key for simplicity here
            // Canonical form handling can be done within the solver if needed
            computedData.set(shapeId, { id: shapeId, validPlacements });
        } else {
            console.warn(`[Worker Precompute] No valid (unlocked) placements found for shape: ${shapeId}`);
        }
        // Optional timing log
        // const shapeEndTime = Date.now();
        // console.log(`[Worker Precompute] Shape ${shapeId} took ${shapeEndTime - shapeStartTime}ms, ${validPlacements.size} placements.`);

    } catch (e) {
      console.error(`[Worker Precompute] Error precomputing shape ${shapeId}:`, e);
      // Store empty set on error to avoid issues later?
       computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
    }
  });

  const computationEndTime = Date.now();
  console.log(`[Worker Precompute] Precomputation finished in ${computationEndTime - computationStartTime}ms. Computed data for ${computedData.size} shapes.`);
  return computedData;
};

// --- Worker Entry Point (Backtracking) --- 
const runSolver = async (taskData: SolverExecDataBacktracking): Promise<SolverResultPayloadBacktracking> => {
  console.log("[Worker runSolver] Received task:", taskData);
  // Reset global state for this run
  maxShapesPlacedSoFar = 0;
  bestSolutionsFound = new Map();
  transpositionTable = new Map(); // Clear transposition table for each run
  allShapeData = new Map(); // Clear precomputed data

  // Destructure necessary data from taskData
  const { shapesToPlace, initialGridState = 0n, lockedTilesMask } = taskData;
  // Note: shapeDataMap is no longer expected from the main thread

  console.log(`[Worker Pool] Starting backtracking solve for ${shapesToPlace.length} shapes...`);
  const startTime = Date.now();

  try {
      // Precomputation happens first, now using lockedTilesMask
      console.log("[Worker Pool] Running precomputation...");
      allShapeData = precomputeAllShapeData(shapesToPlace, lockedTilesMask);
  } catch (error) {
      console.error("[Worker Pool] Error during precomputation phase:", error);
      return {
          maxShapes: 0,
          solutions: [],
          error: `Error during precomputation: ${(error as Error).message}`
      };
  }
  
  // --- Start Backtracking ---
  const availableShapeIds = shapesToPlace.map((shape: { id: string }) => shape.id);
  console.log(`[Worker Pool] Starting backtracking for ${availableShapeIds.length} shapes.`);
  try {
    // Start the recursion 
    solveBacktracking(initialGridState, availableShapeIds, []);

    // Global state (bestSolutionsFound, maxShapesPlacedSoFar) has been updated
    const finalSolutions: SolutionRecord[] = Array.from(bestSolutionsFound.entries()).map(
        ([gridState, placements]) => ({ gridState, placements })
    );
    console.log(`[Worker Pool] Backtracking complete. Found ${finalSolutions.length} unique solutions placing ${maxShapesPlacedSoFar} shapes.`); 

    return {
      maxShapes: maxShapesPlacedSoFar, 
      solutions: finalSolutions, 
    };

  } catch (error) {
    // Check for specific errors like stack overflow or memory issues if needed
    console.error('[Worker Pool] Error during backtracking execution:', error);
    // Try to return partial results if available?
    const partialSolutions: SolutionRecord[] = Array.from(bestSolutionsFound.entries()).map(
        ([gridState, placements]) => ({ gridState, placements })
    );
     return {
        maxShapes: maxShapesPlacedSoFar, // Return best found so far
        solutions: partialSolutions,
        error: `Error during solver execution: ${(error as Error).message}`
    };
  }
};

// --- NEW: Worker Entry Point for Exact Tiling (DLX) ---
const runExactTilingFinder = async (taskData: SolverExecDataBacktracking): Promise<SolverResultPayloadBacktracking> => {
    console.log('[Worker Pool] Received task (Exact 11-Tiling Finder): ', taskData);
    const { shapesToPlace: originalShapesToPlace, initialGridState = 0n } = taskData;

    if (originalShapesToPlace.length < 11) {
        return { maxShapes: 0, solutions: [], error: "Need at least 11 shapes selected to find an exact tiling." };
    }
    if (initialGridState !== 0n) {
         console.warn('[Worker Pool - Exact Tiling] Finding exact tiling on a non-empty grid is not supported by this mode.');
         return { maxShapes: 0, solutions: [], error: "Exact tiling requires an empty grid (initialGridState must be 0)." };
    }

    // Precomputation might have already run if the main solver was called first,
    // but run it again here to ensure `allShapeData` is populated correctly
    // using the version WITH orientations needed for tiling.
    // Note: `allShapeData` is a global within the worker scope.
     try {
        console.log("[Worker Pool - Exact Tiling] Running precomputation with orientations...");
        allShapeData = precomputeAllShapeData(originalShapesToPlace, 0n);
    } catch (error) {
        console.error("[Worker Pool - Exact Tiling] Error during precomputation phase:", error);
        return {
            maxShapes: 0,
            solutions: [],
            error: `Error during precomputation: ${(error as Error).message}`
        };
    }

    // Iterate through combinations of EXACTLY 11 shapes
    console.log(`[Worker Pool - Exact Tiling] Searching ${originalShapesToPlace.length} choose 11 combinations...`);
    const k = 11;
    const allFoundTilings: SolutionRecord[] = [];
    let combinationCount = 0;

    for (const currentShapeCombination of combinations(originalShapesToPlace, k)) {
        combinationCount++;
        // Optional: Log progress intermittently
        // if (combinationCount % 100 === 0) {
        //    console.log(`[Worker Pool - Exact Tiling] Tested ${combinationCount} combinations...`);
        // }

        try {
            // Call the dedicated DLX exact tiling solver 
            // It requires the full allShapeData for lookups
            const result = findExact11TilingSolutions(currentShapeCombination, allShapeData, initialGridState);
            
            if (result.solutions && result.solutions.length > 0) { 
                console.log(`[Worker Pool - Exact Tiling] Found ${result.solutions.length} tiling(s) for combination ${combinationCount}.`);
                allFoundTilings.push(...result.solutions);
                // Optional: Stop after finding the first combination that yields tilings?
                // Or find all possible tilings from all combinations?
                // Let's find all for now.
            }
        } catch (error) {
            console.error(`[Worker Pool - Exact Tiling] Error during DLX execution for combination ${combinationCount}:`, error);
            // Continue checking other combinations
        }
    }

    console.log(`[Worker Pool - Exact Tiling] Search complete. Tested ${combinationCount} combinations. Found ${allFoundTilings.length} total exact tiling solutions.`);
    return {
        maxShapes: allFoundTilings.length > 0 ? 11 : 0,
        solutions: allFoundTilings, // Return all found tilings
    };
};

// Worker function for the combinatorial exact tiling search
async function runCombinatorialExactTiling(taskData: {
    allPotentialsData: { uniqueId: string; baseMaskString: string }[]; 
    initialGridState: string;
    lockedTilesMask: string; // Add lockedTilesMask (passed as string)
}): Promise<SolverResultPayloadBacktracking> {
    console.log("[Worker runCombinatorialExactTiling] Received task with", taskData.allPotentialsData.length, "potentials.");
    const { allPotentialsData, initialGridState: initialGridStateString, lockedTilesMask: lockedTilesMaskString } = taskData;

    // Convert string masks back to bigint
    const initialGridState = BigInt(initialGridStateString);
    const lockedTilesMask = BigInt(lockedTilesMaskString);

    // Reset global state (optional, DLX state should be self-contained)
    maxShapesPlacedSoFar = 0;
    bestSolutionsFound = new Map();

    // Declare shapeDataMap here to be accessible in both try blocks
    let shapeDataMap: Map<string, ShapeData>;

    // --- Precompute shape data respecting locked tiles --- 
    try {
        console.log("[Worker Pool - Comb Exact Tiling] Running precomputation...");
        // Map potentials to the format needed by precomputeAllShapeData
        const shapesToPrecompute = allPotentialsData.map(p => ({ id: p.uniqueId })); 
        // Assign to the outer scoped variable
        shapeDataMap = precomputeAllShapeData(shapesToPrecompute, lockedTilesMask);
    } catch (error) {
        console.error("[Worker Pool - Comb Exact Tiling] Error during precomputation phase:", error);
        return { maxShapes: 0, solutions: [], error: `Precomputation error: ${(error as Error).message}` };
    }

    // --- Call the DLX-based Exact Tiling Solver --- 
    try {
        console.log("[Worker Pool - Comb Exact Tiling] Calling findExact11TilingSolutions...");
        // Pass the PRECOMPUTED map as the second argument
        const resultPayload = await findExact11TilingSolutions(
            allPotentialsData.map(p => ({ id: p.uniqueId })), // Map to expected { id: string }[]
            shapeDataMap,       // Pass the precomputed map (now accessible)
            initialGridState   // Pass initial grid state
            // lockedTilesMask will be added in Task 8 when the DLX function is updated
        );
        console.log(`[Worker Pool - Comb Exact Tiling] DLX solver returned ${resultPayload.solutions.length} solutions.`);

        // Format result according to SolverResultPayloadBacktracking
        // maxShapes will be 11 if solutions are found, 0 otherwise
        return {
            maxShapes: resultPayload.solutions.length > 0 ? 11 : 0,
            solutions: resultPayload.solutions,
        };
    } catch (error) {
        console.error("[Worker Pool - Comb Exact Tiling] Error during DLX execution:", error);
        return { maxShapes: 0, solutions: [], error: `Worker error: ${(error as Error).message}` };
    }
}

// --- Register Worker Functions --- 
workerpool.worker({
  runSolver: runSolver, // Register the backtracking solver as the default
  runExactTilingFinder: runExactTilingFinder, // Register the new DLX exact tiling finder
  runCombinatorialExactTiling: runCombinatorialExactTiling
});

console.log('[Worker Pool] Worker registered: runSolver (Backtracking), runExactTilingFinder (DLX 11-Tiling), runCombinatorialExactTiling (Combinatorial Exact Tiling).');


