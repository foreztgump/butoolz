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

// --- Precomputation Function (Using orientations) ---
// Use the version that generates orientations for the backtracking solver
const precomputeAllShapeData = (shapesToPlace: { id: string }[]): Map<string, ShapeData> => {
    console.log("[Worker] Starting precomputation (with orientations)...");
    const computedData = new Map<string, ShapeData>();

    for (const shape of shapesToPlace) {
        const shapeId = shape.id; 
        console.log(`[Worker] Precomputing for shape: ${shapeId}`);
        try {
            const solutions = new Set<bigint>(); 
            const baseShapeMask = shapeStringToBitmask(shapeId);
            // Generate orientations for backtracking
            const uniqueOrientations = generateUniqueOrientations(baseShapeMask); 
            const tileCount = countSetBits(baseShapeMask);

            const baseShapeTileIds = bitmaskToTileIds(baseShapeMask);
            if (baseShapeTileIds.length === 0) throw new Error('Base shape has no tiles.');
            const baseReferenceTileId = Math.min(...baseShapeTileIds);
            const baseReferenceCoord = HEX_GRID_COORDS.find(c => c.id === baseReferenceTileId);
            if (!baseReferenceCoord) throw new Error(`Base ref coord not found for ${baseReferenceTileId}`);

            uniqueOrientations.forEach(orientationMask => {
                const orientationTileIds = bitmaskToTileIds(orientationMask);
                if (orientationTileIds.length === 0) return; // Should not happen for valid shapes
                const orientationReferenceTileId = Math.min(...orientationTileIds);
                const orientationReferenceCoord = HEX_GRID_COORDS.find(c => c.id === orientationReferenceTileId);
                if (!orientationReferenceCoord) return; // Should find coord

                HEX_GRID_COORDS.forEach(targetCoord => {
                    const deltaQ = targetCoord.q - orientationReferenceCoord.q;
                    const deltaR = targetCoord.r - orientationReferenceCoord.r;
                    const translatedMask = translateShapeBitmask(orientationMask, deltaQ, deltaR);

                    if (countSetBits(translatedMask) === tileCount) {
                        solutions.add(translatedMask);
                    }
                });
            });

            computedData.set(shapeId, {
                id: shapeId,
                validPlacements: solutions, 
            });
            console.log(`[Worker] Precomputed ${solutions.size} placements (including orientations) for ${shapeId}`);

        } catch(error) {
            console.error(`[Worker] Error precomputing shape ${shapeId}:`, error);
            computedData.set(shapeId, {
                id: shapeId,
                validPlacements: new Set(), 
            });
        }
    }
    console.log("[Worker] Precomputation finished.");
    return computedData;
};


// --- Worker Entry Point (Backtracking) --- 
const runSolver = async (taskData: SolverExecDataBacktracking): Promise<SolverResultPayloadBacktracking> => {
  console.log('[Worker Pool] Received task (Backtracking Solver): ', taskData);
  const { shapesToPlace, initialGridState = 0n } = taskData;

  // Reset state for this run
  maxShapesPlacedSoFar = 0;
  bestSolutionsFound.clear(); 
  allShapeData.clear();
  transpositionTable.clear(); 

  // --- Call Precomputation ---
  try {
      // Use the precomputation that generates orientations
      allShapeData = precomputeAllShapeData(shapesToPlace); 
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
        allShapeData = precomputeAllShapeData(originalShapesToPlace);
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

// NEW function for Combinatorial Exact Tiling
async function runCombinatorialExactTiling(taskData: {
    allPotentialsData: { uniqueId: string; baseMaskString: string }[]; 
    initialGridState: string;
}): Promise<SolverResultPayloadBacktracking> {
    console.log('[Worker] Starting combinatorial exact tiling search...');
    const { allPotentialsData, initialGridState: initialGridStateStr } = taskData;
    
    try {
        const initialGridState = BigInt(initialGridStateStr);
        
        // Validate input length
        if (allPotentialsData.length < 11) {
             return { maxShapes: 0, solutions: [], error: "Received less than 11 potential shapes." };
        }

        const allFoundSolutions: SolutionRecord[] = [];
        let combinationCounter = 0;

        console.log(`[Worker] Generating combinations of 11 from ${allPotentialsData.length} shapes...`);
        // Generate combinations based on the full list of potential data objects
        const combinationGenerator = combinations(allPotentialsData, 11);

        for (const currentCombination of combinationGenerator) {
            combinationCounter++;
            if (combinationCounter % 100 === 0) { 
                 console.log(`[Worker] Testing combination ${combinationCounter}...`);
            }

            // 1. Prepare ShapeData for this specific combination
            const currentShapeDataMap = new Map<string, ShapeData>();
            let canBuildCombination = true;
            // Use the uniqueId from the combination items
            for (const potential of currentCombination) {
                const { uniqueId, baseMaskString } = potential;
                const baseMask = BigInt(baseMaskString);
                
                if (!baseMask || baseMask === 0n) { 
                    console.error(`[Worker] CRITICAL: Invalid base mask found for potential unique ID ${uniqueId} in combination ${combinationCounter}`);
                    canBuildCombination = false;
                    break; 
                }

                // Calculate valid placements for this fixed orientation
                const validPlacements = new Set<bigint>();
                const baseBitCount = countSetBits(baseMask);
                if (baseBitCount === 0) {
                     console.warn(`[Worker] Potential ${uniqueId} has base mask with zero bits.`);
                     continue; 
                }
                const anchorBitIndex = findLowestSetBitIndex(baseMask);
                if (anchorBitIndex === -1) {
                    console.error(`[Worker] Could not find anchor bit for potential ${uniqueId}`);
                    canBuildCombination = false;
                    break;
                }
                const anchorTileId = anchorBitIndex + 1;
                const anchorCoord = HEX_GRID_COORDS.find(c => c.id === anchorTileId);
                if (!anchorCoord) {
                     console.error(`[Worker] Could not find anchor coordinates for tile ID ${anchorTileId} (potential ${uniqueId})`);
                     canBuildCombination = false;
                     break;
                }
                for (const targetCoord of HEX_GRID_COORDS) {
                    const deltaQ = targetCoord.q - anchorCoord.q;
                    const deltaR = targetCoord.r - anchorCoord.r;
                    const translatedMask = translateShapeBitmask(baseMask, deltaQ, deltaR);
                    if (translatedMask !== 0n && countSetBits(translatedMask) === baseBitCount) {
                        validPlacements.add(translatedMask);
                    }
                }

                if (validPlacements.size === 0) {
                    canBuildCombination = false; 
                    break; 
                }

                // Use uniqueId as the key and the ID within ShapeData
                currentShapeDataMap.set(uniqueId, {
                    id: uniqueId, 
                    baseOrientationMask: baseMask, 
                    validPlacements: validPlacements, 
                });
            }

            if (!canBuildCombination) {
                continue; // Skip to the next combination
            }

            // 2. Call the DLX solver for this combination
            const result = findExact11TilingSolutions(
                // Pass the list of shapes with their unique IDs
                currentCombination.map(p => ({ id: p.uniqueId })), 
                currentShapeDataMap,
                initialGridState
            );

            // 3. Aggregate results (PlacementRecord.shapeId will now be the uniqueId)
            if (result.solutions && result.solutions.length > 0) {
                console.log(`[Worker] Found ${result.solutions.length} solution(s) for combination ${combinationCounter}`);
                allFoundSolutions.push(...result.solutions);
            }
            if (result.error) {
                 console.warn(`[Worker] DLX solver error for combination ${combinationCounter}: ${result.error}`);
            }
        } // End loop through combinations

        console.log(`[Worker] Finished checking ${combinationCounter} combinations. Found ${allFoundSolutions.length} total solutions.`);
        return {
            maxShapes: allFoundSolutions.length > 0 ? 11 : 0,
            solutions: allFoundSolutions,
        };

    } catch (error) {
        console.error('[Worker] Error during combinatorial exact tiling:', error);
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


