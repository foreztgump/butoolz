// app/shapedoctor/solver.worker.ts - Optimized Backtracking Version

import * as workerpool from 'workerpool';
// @ts-ignore - Ignore missing types for mathjs if not critical
import { combinations as mathCombinations } from 'mathjs';
import {
  shapeStringToBitmask,
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
import { findExactKTilingSolutions } from './solver.dlx';
import { 
  ShapeData, 
  PlacementRecord, 
  SolutionRecord, 
  SolverExecDataBacktracking, 
  SolverExecDataExactTiling 
} from './types';

// DEFINE ONLY types not exported from types.ts if needed
interface PotentialPlacement { uniqueId: string; baseMaskString: string };
type ShapeDataMap = Map<string, ShapeData>; // Assuming ShapeData IS exported
interface ShapeInput { id: string }; // ADD BACK local definition

// Define the type for the taskData specific to runCombinatorialExactTiling
// Based on the data passed from page.tsx
interface ExactTilingTaskData extends SolverExecDataExactTiling {
    k: number;
    shapesToTileWith: { id: string }[];
}

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

// State variable to store precomputed data for each shape
let allShapeData: ShapeDataMap = new Map();

// Define the type for HEX_GRID_COORDS elements
interface HexCoord { id: number; q: number; r: number; s?: number; }

// --- Precomputation Function ---
const precomputeAllShapeData = (
  shapesToPlace: ShapeInput[],
  lockedTilesMask: bigint | string
): Map<string, ShapeData> => {
    console.log("[Worker Precompute] Starting precomputation (Single Orientation, All Translations)..."); 
  const computationStartTime = Date.now();
    const computedData: Map<string, ShapeData> = new Map();
  
  const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;

    const coordsMap = new Map<number, { q: number; r: number }>();
    HEX_GRID_COORDS.forEach((coord, index) => { 
        coordsMap.set(index, { q: coord.q, r: coord.r }); 
    });

  shapesToPlace.forEach((shapeInput: ShapeInput) => {
    const shapeId = shapeInput.id;
        try {
            const shapeStringParts = shapeId.split('::');
            if (shapeStringParts.length !== 2 || shapeStringParts[1].length !== TOTAL_TILES) {
                console.error(`[Worker Precompute] Invalid shapeId format or length: ${shapeId}. Skipping.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }
            const actualShapeString = shapeStringParts[1];
            const baseShapeMask = shapeStringToBitmask(actualShapeString);

        if (baseShapeMask === 0n) {
                console.warn(`[Worker Precompute] Skipping shape with empty mask (from ${shapeId})`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
                return;
            }

            // ---> Add check for exactly 4 tiles <--- //
            const initialTileCount = countSetBits(baseShapeMask);
            if (initialTileCount !== 4) {
                console.warn(`[Worker Precompute] Skipping shape ${shapeId} because initial mask has ${initialTileCount} tiles, not 4.`);
                computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
             return; // Skip this shape
        }
            // --------------------------------------- //

        const validPlacements = new Set<bigint>();
            const sourceTileIndex = findLowestSetBitIndex(baseShapeMask);
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

            for (let targetTileIndex = 0; targetTileIndex < TOTAL_TILES; targetTileIndex++) {
                const targetCoords = coordsMap.get(targetTileIndex);
                 if (!targetCoords) {
                     console.error(`[Worker Precompute] Missing coordinates for target index ${targetTileIndex}. Skipping translation.`);
                     continue;
                 }
                const { q: targetQ, r: targetR } = targetCoords;
                const deltaQ = targetQ - sourceQ;
                const deltaR = targetR - sourceR;
                const translatedMask = translateShapeBitmask(baseShapeMask, deltaQ, deltaR);

                if (translatedMask !== 0n && (translatedMask & lockedTilesMaskBigint) === 0n) {
                    // ---> Add check for 4 tiles AFTER translation <--- //
                    const translatedTileCount = countSetBits(translatedMask);
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

    } catch (e) {
      console.error(`[Worker Precompute] Error precomputing shape ${shapeId}:`, e);
       computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
    }
  });

  const computationEndTime = Date.now();
    console.log(`[Worker Precompute] Precomputation finished in ${computationEndTime - computationStartTime}ms. Computed data for ${computedData.size} shapes (Single Orientation, All Translations).`); 
  return computedData;
};

// Helper to calculate combinations safely
function calculateTotalCombinations(n: number, k: number): number {
    if (k < 0 || k > n) {
        return 0;
    }
    if (k === 0 || k === n) {
        return 1;
    }
    if (k > n / 2) {
        k = n - k; // Optimization
    }
    try {
        // Use a library or careful implementation for large numbers if needed
        // For moderate N (like 24 choose 11), standard numbers should be okay
        // but using a library like mathjs is safer.
        const result = mathCombinations(n, k);
        if (typeof result === 'number' && isFinite(result)) {
             return result;
        }
         console.warn(`[Combinations] Calculation resulted in non-finite number for C(${n}, ${k}). Reporting 0.`);
        return 0; // Or throw error / handle appropriately
    } catch (e) {
        console.error(`[Combinations] Error calculating C(${n}, ${k}):`, e);
        return 0; // Indicate failure
    }
}

// --- Combinatorial Exact Tiling Function (DLX-based) ---
async function runCombinatorialExactTiling(
  taskData: SolverExecDataExactTiling
): Promise<{ status: 'completed' | 'cancelled' | 'error', combinationsChecked: number, error?: string }> {
    console.log("[Worker runCombinatorialExactTiling] Received task to find exact tiling subset.");
    allShapeData = new Map(); // Reset precomputed data for this run
    const { 
        allPotentialsData,
        initialGridState = 0n, 
        lockedTilesMask 
    } = taskData;
    
  const initialGridStateBigint = typeof initialGridState === 'string' ? BigInt(initialGridState) : initialGridState;
  const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    const overallStartTime = Date.now();
    let combinationCount = 0; // Initialize counter

    // Define a helper for cancellation check
    const isCancelled = (): boolean => {
        try {
             return (workerpool as any).isCancelled && (workerpool as any).isCancelled();
        } catch (e) {
            console.warn("Error checking cancellation status:", e);
            return false;
        }
    };

    try {
        // 1. Calculate available tiles and required shapes (k)
        const availableTileMask = FULL_GRID_MASK & (~lockedTilesMaskBigint);
        const availableTileCount = countSetBits(availableTileMask);
        console.log(`[Worker CET] Available tiles: ${availableTileCount}`); // CET for Combinatorial Exact Tiling

        if (availableTileCount === 0) {
            console.log("[Worker CET] No available tiles. Exact tiling impossible.");
            return { status: 'completed', combinationsChecked: 0 };
        }

        if (availableTileCount % 4 !== 0) {
            console.log(`[Worker CET] Available tile count (${availableTileCount}) not divisible by 4. Exact tiling impossible.`);
            return { status: 'completed', combinationsChecked: 0 };
        }

        const k = availableTileCount / 4;
        console.log(`[Worker CET] Required shapes (k): ${k}`);

        // 2. Check if enough shapes are provided
        const numSelectedShapes = allPotentialsData.length;
        console.log(`[Worker CET] Selected shapes (N): ${numSelectedShapes}`);
        if (numSelectedShapes < k) {
            console.log(`[Worker CET] Not enough selected shapes (${numSelectedShapes}) to form a ${k}-shape tiling. Exact tiling impossible.`);
            return { status: 'completed', combinationsChecked: 0 };
        }

        // 3. Precompute data for ALL provided potential shapes
        console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] Running precomputation for all ${numSelectedShapes} selected shapes...`);
        const shapesForPrecompute = allPotentialsData.map(p => ({ id: p.uniqueId }));
        allShapeData = precomputeAllShapeData(shapesForPrecompute, lockedTilesMaskBigint);
        const precomputeEndTime = Date.now();
        console.log(`[Worker CET @ ${precomputeEndTime - overallStartTime}ms] Precomputation done. ${allShapeData.size} shapes have data.`);
        
        // Filter out shapes that had no valid placements after precomputation
        const potentialsWithValidPlacements = allPotentialsData.filter(p => {
            const data = allShapeData.get(p.uniqueId);
            return data && data.validPlacements.size > 0;
        });
        const numValidPotentials = potentialsWithValidPlacements.length;
        console.log(`[Worker CET] Potentials with valid placements (N for combinations): ${numValidPotentials}`);

        if (numValidPotentials < k) {
             console.log(`[Worker CET] Not enough shapes with valid placements (${numValidPotentials}) to form a ${k}-shape tiling.`);
             return { status: 'completed', combinationsChecked: 0 };
        }

        // Calculate total combinations for progress reporting
        console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] Calculating total combinations C(${numValidPotentials}, ${k})...`);
        const totalCombinations = calculateTotalCombinations(numValidPotentials, k);
        console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] Total combinations to check: ${totalCombinations}`);

        // Emit initial progress
        workerpool.workerEmit({ event: 'progressUpdate', data: { progress: 0, currentCount: 0, totalCount: totalCombinations } });

        // 4. Iterate through combinations of k shapes from the valid potentials
        console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] Starting combinations loop (k=${k}, N=${numValidPotentials})...`);

        // --- DEBUG: Log valid placements (removed for general case) ---

        for (const shapeCombination of combinations(potentialsWithValidPlacements, k)) {
            // --- Cancellation Check ---
            if (isCancelled()) {
                 console.log(`[Worker CET] Cancellation requested after ${combinationCount} combinations.`);
                throw new workerpool.Promise.CancellationError();
            }
            // -------------------------

            combinationCount++;
            const loopIterationStartTime = Date.now();
            if (combinationCount <= 5 || combinationCount % 1000 === 0) { // Log first 5 and every 1000th
                console.log(`[Worker CET @ ${loopIterationStartTime - overallStartTime}ms] --- Iteration ${combinationCount} / ${totalCombinations} ---`);
                // Log the shapes in this specific combination
                const shapesInThisCombo = shapeCombination.map(p => p.uniqueId.split('::')[1]); // Get just the mask part
                console.log(`[Worker CET]   Testing combination: [${shapesInThisCombo.join(', ')}]`);
            }
            
             // --- Progress Update --- MODIFIED --- 
             // Update every 1000 or on the last iteration
             if (combinationCount % 1000 === 0 || combinationCount === totalCombinations) { 
                 const percentComplete = totalCombinations > 0 ? (combinationCount / totalCombinations) * 100 : (combinationCount > 0 ? 100 : 0); // Handle totalCombinations=0
                 workerpool.workerEmit({
                     event: 'progressUpdate',
                     data: { progress: Math.min(100, Math.round(percentComplete)), currentCount: combinationCount, totalCount: totalCombinations }
                 });
             }
             // -------------------------------------

            // Map combination to ShapeInput[] for the DLX solver
            const shapesToTileWith: ShapeInput[] = shapeCombination.map(p => ({ id: p.uniqueId }));
            
            // 5. Call the DLX solver for the current combination
            if (combinationCount <= 5 || combinationCount % 1000 === 0) {
                console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms]   Calling findExactKTilingSolutions...`);
            }
            const solveStartTime = Date.now();
            const result = findExactKTilingSolutions(
                k,
                allShapeData, 
                [], 
                shapesToTileWith,
                initialGridStateBigint,
                lockedTilesMaskBigint
            );
            const solveEndTime = Date.now();
            if (combinationCount <= 5 || combinationCount % 1000 === 0) {
                 console.log(`[Worker CET @ ${solveEndTime - overallStartTime}ms]   findExactKTilingSolutions returned in ${solveEndTime - solveStartTime}ms. Error: ${result.error ?? 'None'}, Solutions found: ${result.solutions?.length ?? 0}`);
            }

            if (result.error) {
                if (combinationCount <= 5) { // Only log errors verbosely for first few
                    console.warn(`[Worker CET] DLX solver error for combination ${combinationCount}: ${result.error}`);
                }
            }

            // 6. Check if a solution was found for this combination
            if (result.solutions && result.solutions.length > 0) {
                console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] Solution found for combination ${combinationCount}. Emitting...`);
                const solutionToSend = {
                    ...result.solutions[0],
                    gridState: result.solutions[0].gridState.toString(),
                    placements: result.solutions[0].placements.map(p => ({
                        shapeId: p.shapeId,
                        placementMask: p.placementMask.toString()
                    }))
                };
                try {
                    workerpool.workerEmit({ event: 'solutionUpdate', data: { maxShapes: k, solution: solutionToSend } });
                } catch (emitError) {
                    console.error("[Worker CET] Error emitting solution update:", emitError);
                }
            }
            // Log end of iteration for the first few
            if (combinationCount <= 5) {
                console.log(`[Worker CET @ ${Date.now() - overallStartTime}ms] --- Finished Iteration ${combinationCount} ---`);
            }
        }
        
        // 7. If loop completes
        const overallEndTime = Date.now();

        // --- ADD FINAL PROGRESS UPDATE --- 
        console.log("[Worker CET] Emitting final 100% progress update.");
        workerpool.workerEmit({ 
            event: 'progressUpdate', 
            data: { progress: 100, currentCount: combinationCount, totalCount: totalCombinations }
        });
        // ---------------------------------

        await new Promise(resolve => setTimeout(resolve, 10)); 
        console.log(`[Worker CET] Finished testing ${combinationCount} combinations in ${overallEndTime - overallStartTime}ms.`);
        return { status: 'completed', combinationsChecked: combinationCount }; 

    } catch (error: any) {
        const errorEndTime = Date.now();
        // Check cancellation error type safely
        const isCancellationError = (e: any): boolean => {
            return e instanceof workerpool.Promise.CancellationError || (typeof e === 'object' && e !== null && e.name === 'CancellationError');
        };

        if (isCancellationError(error)) {
            console.log(`[Worker CET] Task cancelled after ${errorEndTime - overallStartTime}ms.`);
             return { status: 'cancelled', combinationsChecked: combinationCount };
        } else {
            console.error("[Worker CET] Error during execution:", error);
            return { 
                status: 'error', 
                combinationsChecked: combinationCount, 
                error: `Exact Tiling Worker Error: ${error instanceof Error ? error.message : String(error)} (Took ${errorEndTime - overallStartTime}ms)` 
            };
        }
    }
}

// --- Backtracking-Based Maximal Placement Function ---
const runMaximalPlacementBacktracking = async (
  taskData: SolverExecDataBacktracking
): Promise<{ maxShapes: number; solutions: SolutionRecord[], error?: string }> => {
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
    const allValidPlacementsUnsorted: PlacementRecord[] = [];
    const placementCountsPerShapeType: { [key: string]: number } = {};

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
    let finalBestSolutions: SolutionRecord[] = [];
    const usedShapeTypes = new Set<string>();

    // 4. Define the recursive backtracking function
    const backtrack = (
      currentIndex: number,
      currentGrid: bigint,
      currentPlacementList: PlacementRecord[],
      currentShapeTypeSet: Set<string>
    ) => {
      const currentK = currentPlacementList.length;

      if (currentK > maxKFound) {
        maxKFound = currentK;
        const newBestSolution: SolutionRecord = { gridState: currentGrid, placements: [...currentPlacementList] };
        finalBestSolutions = [newBestSolution];

        // Directly emit the solution (assuming precompute now guarantees 4 tiles)
         console.log(`[Worker Backtrack] New best k = ${maxKFound} found. Emitting solutionUpdate...`);
         try {
             workerpool.workerEmit({
                 event: 'solutionUpdate',
                 data: { maxShapes: maxKFound, solution: newBestSolution }
             });
         } catch (emitError) {
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
        if (
          (currentGrid & placement.placementMask) === 0n && // No overlap with current grid
          !currentShapeTypeSet.has(baseShapeId) // Shape type not already used
        ) {
          // Place the shape
          currentPlacementList.push(placement);
          currentShapeTypeSet.add(baseShapeId);

          // Recurse
          backtrack(
            i + 1, // Start next search from the next placement
            currentGrid | placement.placementMask,
            currentPlacementList,
            currentShapeTypeSet
          );

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
    
  } catch (error: any) {
    console.error('[Worker runMaximalPlacementBacktracking] Error during execution:', error);
    return { maxShapes: 0, solutions: [], error: `Maximal Placement Backtracking Worker Error: ${error.message}` };
  }
};

// --- Worker Entry Point ---
workerpool.worker({
  runCombinatorialExactTiling: runCombinatorialExactTiling,
  runMaximalPlacementBacktracking: runMaximalPlacementBacktracking
});

console.log('[Solver Worker] Worker initialized and ready.');