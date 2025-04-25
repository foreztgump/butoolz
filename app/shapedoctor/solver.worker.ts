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
  // Core Types
  PotentialShape,
  ShapeData,
  ShapeDataMap, 
  PlacementRecord, 
  SolutionRecord, 
  // Parallel Task Communication Types
  SolverTaskContext,
  DLXBatchPayload,
  BacktrackingBranchPayload,
  WorkerTaskPayload,
  WorkerMessageType,
  WorkerParallelResultMessage,
  WorkerParallelProgressMessage,
  WorkerParallelErrorMessage,
  WorkerParallelLogMessage,
  WorkerParallelResponseMessage,
  WorkerBacktrackingProgressMessage,
} from './types';

// DEFINE ONLY types not exported from types.ts if needed
interface ShapeInput { id: string }; // Used internally by solver.dlx

// Define the type for the taskData specific to runCombinatorialExactTiling
// Based on the data passed from page.tsx
// REMOVE THIS INTERFACE as it references the old type and seems unused now
/*
interface ExactTilingTaskData extends SolverExecDataExactTiling {
    k: number;
    shapesToTileWith: { id: string }[];
}
*/

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

// State variable to store precomputed data for each shape (Now managed by context)
// let allShapeData: ShapeDataMap = new Map(); // Remove global state

// Define the type for HEX_GRID_COORDS elements
interface HexCoord { id: number; q: number; r: number; s?: number; }

// --- Precomputation Function (Now internal, called by initializeSolverContext) ---
const precomputeAllShapeDataInternal = (
  potentials: PotentialShape[], // Use PotentialShape from types.ts
  lockedTilesMask: bigint | string
): Map<string, ShapeData> => {
  // console.log("[Worker Precompute] Starting precomputation (Single Orientation, All Translations)...");
  const computationStartTime = Date.now();
  const computedData: Map<string, ShapeData> = new Map();

  const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;

  const coordsMap = new Map<number, { q: number; r: number }>();
  HEX_GRID_COORDS.forEach((coord, index) => {
    coordsMap.set(index, { q: coord.q, r: coord.r });
  });

  potentials.forEach((potential: PotentialShape) => { // Use PotentialShape
    const shapeId = potential.id; // This is the unique ID like shapeA::11001010...
    const canonicalForm = potential.canonicalForm; // This is the canonical string '11001010...'
    const baseShapeMask = potential.bitmask; // Use the bitmask directly

    try {
      if (!computedData.has(canonicalForm)) { // Compute only once per canonical form
        // console.log(`[Worker Precompute] Computing for canonical form: ${canonicalForm}`);
        if (baseShapeMask === 0n) {
          console.warn(`[Worker Precompute] Skipping shape with empty mask (from ${shapeId})`);
          computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: 0n, validPlacements: [] });
          return;
        }

        const initialTileCount = countSetBits(baseShapeMask);
        if (initialTileCount !== 4) {
          console.warn(`[Worker Precompute] Skipping shape ${canonicalForm} because initial mask has ${initialTileCount} tiles, not 4.`);
          computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: baseShapeMask, validPlacements: [] });
          return; // Skip this shape
        }

        const validPlacements: bigint[] = []; // Store as array
        const sourceTileIndex = findLowestSetBitIndex(baseShapeMask);
        if (sourceTileIndex === -1) {
          console.warn(`[Worker Precompute] Could not find anchor for non-empty shape ${canonicalForm}. Skipping.`);
          computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: baseShapeMask, validPlacements: [] });
          return;
        }
        const sourceCoords = coordsMap.get(sourceTileIndex);
        if (!sourceCoords) {
          console.error(`[Worker Precompute] Could not find coordinates for source index ${sourceTileIndex} of shape ${canonicalForm}. Check HEX_GRID_COORDS structure/order. Skipping.`);
          computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: baseShapeMask, validPlacements: [] });
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
            const translatedTileCount = countSetBits(translatedMask);
            if (translatedTileCount === 4) {
              validPlacements.push(translatedMask);
            }
          }
        }
        computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: baseShapeMask, validPlacements });
      } else {
        // console.log(`[Worker Precompute] Canonical form ${canonicalForm} already computed.`);
      }

    } catch (e) {
      console.error(`[Worker Precompute] Error precomputing shape ${canonicalForm} (from ${shapeId}):`, e);
      computedData.set(canonicalForm, { id: canonicalForm, canonicalBitmask: baseShapeMask, validPlacements: [] });
    }
  });

  const computationEndTime = Date.now();
  // console.log(`[Worker Precompute] Precomputation finished in ${computationEndTime - computationStartTime}ms. Computed data for ${computedData.size} canonical shapes.`);
  return computedData;
};

// --- NEW Exported Function: Initialize Context ---
const initializeSolverContext = async (
  potentials: PotentialShape[],
  lockedTilesMaskStr: string // Expect string due to workerpool serialization
): Promise<ShapeDataMap> => {
  // console.log("[Worker Initialize] Received initialization request.");
  try {
    const lockedTilesMask = BigInt(lockedTilesMaskStr);
    const shapeDataMap = precomputeAllShapeDataInternal(potentials, lockedTilesMask);
    // We return the map directly; the workerpool promise handles the async nature.
    // console.log("[Worker Initialize] Context initialized successfully.");
    return shapeDataMap;
  } catch (error) {
    console.error("[Worker Initialize] Error during initialization:", error);
    throw error; // Re-throw to make it a worker error
  }
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

// --- Internal Solver Logic (Adapted from previous exports) ---

// Internal function for Exact Tiling (now processes combinations passed to it)
// Note: This function itself is NOT parallel, the loop over combinations is removed
const solveExactTilingCombination = (
  combination: string[], // Array of shape IDs for *this specific* combination
  kValue: number,
  context: SolverTaskContext
): SolutionRecord | null => {
    // console.log(`[Worker solveExactTilingCombination] Solving for combination: ${combination.join(', ')}`);
    try {
      const { shapeDataMap, initialGridState, lockedTilesMask } = context;

      // The shapes to use are defined by the combination array
      const shapesToUseInput: ShapeInput[] = combination.map(id => ({ id }));

      // Need to map the incoming shape IDs (like shapeA::110...) to their canonical forms
      // to look up precomputed data in shapeDataMap.
      const shapeDataMapForCombination: ShapeDataMap = new Map();
      const canonicalFormsInCombination = new Set<string>();

      for (const fullShapeId of combination) {
         const parts = fullShapeId.split('::');
         if (parts.length === 2) {
             const canonicalForm = parts[0]; // Assuming ID format is canonical::uniqueifier or similar
             // TODO: Adjust canonicalForm extraction if ID format differs
             const precomputedData = shapeDataMap.get(canonicalForm);
             if (precomputedData) {
                 // We map the *instance ID* (fullShapeId) to the *precomputed canonical data*
                 // This allows buildDancingLinksConstraints to use the correct data for each instance.
                 shapeDataMapForCombination.set(fullShapeId, precomputedData);
                 canonicalFormsInCombination.add(canonicalForm);
             } else {
                 console.warn(`[Worker solveExactTilingCombination] Precomputed data not found for canonical form ${canonicalForm} (from ${fullShapeId})`);
             }
         } else {
             console.warn(`[Worker solveExactTilingCombination] Invalid shape ID format for lookup: ${fullShapeId}`);
         }
      }
      
      // Check if we actually found data for k unique canonical forms
      // This check might be redundant if the combination generation ensures k shapes are passed.
      // if (canonicalFormsInCombination.size !== kValue) {
      //     console.warn(`[Worker solveExactTilingCombination] Combination provided ${combination.length} IDs, but only mapped to ${canonicalFormsInCombination.size} unique canonical forms with data. Expected ${kValue}.`);
          // Potentially return null or handle error
      // }

      const result = findExactKTilingSolutions(
        kValue,
        shapeDataMapForCombination, // Pass the map keyed by INSTANCE ID
        [], // initialConstraints - not used in current dlx impl
        shapesToUseInput, // Array of { id: instanceId } for buildConstraints
        initialGridState,
        lockedTilesMask
      );

      if (result.solutions && result.solutions.length > 0) {
        // console.log(`[Worker solveExactTilingCombination] Solution FOUND for combination: ${combination.join(', ')}`);
        return result.solutions[0]; // Return the first solution found for this combo
      } else if (result.error) {
         console.error(`[Worker solveExactTilingCombination] DLX error for combination ${combination.join(', ')}:`, result.error);
         // Decide if this should throw or just return null
         return null;
      } else {
        // console.log(`[Worker solveExactTilingCombination] No solution for combination: ${combination.join(', ')}`);
        return null;
      }

    } catch (error) {
        console.error(`[Worker solveExactTilingCombination] Unexpected error processing combination ${combination.join(', ')}:`, error);
        // Decide how to handle unexpected errors - throw? log? return null?
        return null;
    }
};

// Internal function for Backtracking (structure remains, needs adaptation for parallel start)
// This function will need significant changes to accept a starting point/
// branch and return the best result *for that branch only*.
const solveBacktrackingBranch = async (
  payload: BacktrackingBranchPayload
): Promise<SolutionRecord[] | null> => {
  const { context } = payload;
  const { shapeDataMap, initialGridState, lockedTilesMask, potentials } = context;
  console.log(`[Worker solveBacktrackingBranch] Started with ${potentials.length} potentials.`);

  // Backtracking state
  let maxK = 0;
  let bestSolutions: SolutionRecord[] = [];
  let rawSolutionCountAtMaxK = 0; // Counter for solutions found at the current maxK
  const RAW_SOLUTION_LIMIT = 30000; // Stop collecting raw solutions after this many
  let iterations = 0; // Counter for progress/debugging

  // Potential Refinement: Could sort placements once outside the recursive calls if beneficial,
  // but the current logic accesses placements per-potential inside the loop.
  // For Task 7, let's keep the structure but ensure clarity.

  const backtrack = (potentialIndex: number, currentGridState: bigint, placedShapes: PlacementRecord[]) => {
    iterations++;

    // Periodically emit progress update
    if (iterations % 50000 === 0) {
        try {
            // Use type assertion for workerEmit if necessary
            (workerpool.workerEmit as (msg: WorkerBacktrackingProgressMessage) => void)({
                type: 'BACKTRACKING_PROGRESS',
                payload: {
                    iterations: iterations,
                    currentMaxK: maxK
                }
            });
        } catch (e) {
            // Handle potential errors during emit, though unlikely
            console.error("[Worker Backtrack] Error emitting progress:", e);
        }
    }

    // --- Base Case ---
    // Condition is clear: all potentials considered for this specific path.
    if (potentialIndex >= potentials.length) {
      const currentK = placedShapes.length;
      // Logic for updating best solutions seems correct.
      if (currentK > maxK) {
        maxK = currentK;
        const newBestSolution: SolutionRecord = { // Create new solution object
          gridState: currentGridState,
          placements: [...placedShapes], // Copy placedShapes array for the solution record
          maxShapes: maxK
        };
        bestSolutions = [newBestSolution]; // Reset bestSolutions with the new single best
        rawSolutionCountAtMaxK = 1; // Reset counter for the new maxK
        // console.log(`[Worker Backtrack DBG] New max k! k=${maxK}. Resetting solutions. Added gridState: ${currentGridState.toString(16)}`);
      } else if (currentK === maxK && maxK > 0) {
         // Store multiple solutions achieving the current maxK, up to a limit
         if (rawSolutionCountAtMaxK < RAW_SOLUTION_LIMIT) {
             const tiedSolution: SolutionRecord = {
                 gridState: currentGridState,
                 placements: [...placedShapes], // Copy placedShapes array
                 maxShapes: maxK
             };
             bestSolutions.push(tiedSolution);
             rawSolutionCountAtMaxK++;
             // console.log(`[Worker Backtrack DBG] Tied max k! k=${maxK}. Appending solution (${rawSolutionCountAtMaxK}/${RAW_SOLUTION_LIMIT}). Added gridState: ${currentGridState.toString(16)}. Total raw now: ${bestSolutions.length}`);
         } else if (rawSolutionCountAtMaxK === RAW_SOLUTION_LIMIT) {
             // Log only once when the limit is first hit for this maxK
             // console.log(`[Worker Backtrack DBG] Reached raw solution limit (${RAW_SOLUTION_LIMIT}) for k=${maxK}. Will stop collecting, but continue searching for potentially higher k.`);
             rawSolutionCountAtMaxK++; // Increment past limit to prevent re-logging
         }
         // If rawSolutionCountAtMaxK > RAW_SOLUTION_LIMIT, do nothing (don't add to bestSolutions)
      }
      return; // End this recursive path
    }

    // --- Recursive Step --- //

    const currentPotential = potentials[potentialIndex];
    // Defensive check for robustness, although shouldn't happen with correct logic.
    if (!currentPotential) {
        console.error(`[Worker Backtrack] Error: potentialIndex ${potentialIndex} out of bounds for potentials array (length ${potentials.length}). Stopping this path.`);
        return;
    }

    // Look up precomputed valid placements for the shape's canonical form.
    const canonicalData = shapeDataMap.get(currentPotential.canonicalForm);
    // validPlacements were pre-filtered against locked tiles.
    const validPlacements = canonicalData?.validPlacements ?? [];

    // --- Option 1: Try placing the current potential ---
    // Iterate through all valid placements for the current potential's canonical form.
    for (const placementMask of validPlacements) {
      // Check for overlap with the *current grid state* (already placed shapes).
      if ((currentGridState & placementMask) === 0n) {
        // If placement is valid, place it:
        // Add the specific instance ID and its placement mask to the current path.
        placedShapes.push({ shapeId: currentPotential.id, placementMask });
        // Recurse for the *next* potential index. This ensures that each potential
        // instance (from the input 'potentials' array) is considered at most once
        // down any single path, satisfying the instance uniqueness constraint.
        backtrack(potentialIndex + 1, currentGridState | placementMask, placedShapes);
        // Backtrack: Remove the shape just placed to explore other possibilities
        // (e.g., different placements of this potential, or skipping it entirely).
        placedShapes.pop();
      }
    }

    // --- Option 2: Skip the current potential ---
    // Always explore the path where the current potential instance is *not* placed.
    // This is crucial because skipping an earlier potential might allow for a
    // better overall solution using later potentials.
    // Recurse for the *next* potential index, keeping gridState and placedShapes unchanged.
    backtrack(potentialIndex + 1, currentGridState, placedShapes);

  };

  // Start the backtracking search from the first potential (index 0)
  // console.log(`[Worker Backtrack] Starting search for ${potentials.length} potentials.`);

  // --- Heuristic: Sort potentials by fewest valid placements first --- 
  const sortedPotentials = [...potentials].sort((a, b) => {
    const placementsA = shapeDataMap.get(a.canonicalForm)?.validPlacements?.length ?? Infinity;
    const placementsB = shapeDataMap.get(b.canonicalForm)?.validPlacements?.length ?? Infinity;
    return placementsA - placementsB;
  });
  // console.log("[Worker Backtrack] Potentials sorted by placement count:", sortedPotentials.map(p => ({ id: p.id, count: shapeDataMap.get(p.canonicalForm)?.validPlacements?.length ?? 'N/A' })));

  // Start the search using the sorted potentials
  backtrack(0, initialGridState, []); // Start with potential index 0

  // console.log(`[Worker Backtrack] Search finished. Max k found: ${maxK}. Found ${bestSolutions.length} raw solutions achieving max k.`); // Log finish
  // ADDED LOG: Log the collected raw solutions before filtering
  // Note: This might be very verbose if many solutions are found.
  // Consider stringifying only gridStates if output is too large.
  // console.log(`[Worker Backtrack] Raw bestSolutions (first few):`, bestSolutions.slice(0, 5).map(s => ({ gridState: s.gridState.toString(), k: s.maxShapes }))); 

  // --- Filter for unique solutions and limit to 500 --- //
  let filteredSolutions: SolutionRecord[] = [];
  if (bestSolutions.length > 0) {
      const uniqueGridStates = new Set<bigint>();
      for (const solution of bestSolutions) {
          if (!uniqueGridStates.has(solution.gridState)) {
              uniqueGridStates.add(solution.gridState);
              filteredSolutions.push(solution);
              if (filteredSolutions.length >= 500) {
                  console.log(`[Worker Backtrack] Reached limit of 500 unique solutions.`);
                  break; // Stop collecting more unique solutions
              }
          }
      }
      // console.log(`[Worker Backtrack] Filtered down to ${filteredSolutions.length} unique solutions.`);
  }

  // Return the array of unique, limited best solutions (or null if k=0)
  const result = filteredSolutions.length > 0 ? filteredSolutions : null;
  // console.log(`[Worker Backtrack] Returning ${filteredSolutions.length} unique solutions for k=${maxK}`);
  return result;
};


// --- NEW Main Worker Entry Point for Parallel Tasks ---
const processParallelTask = async (task: WorkerTaskPayload): Promise<void> => {
    const taskStartTime = Date.now();
    const originatingSolverType = task.data.originatingSolverType; // Extract type

    try {
        switch (task.type) {
            case 'DLX_BATCH':
                const { combinations, kValue, context } = task.data;
                const totalInBatch = combinations.length;
                // console.log(`[Worker processParallelTask] Processing DLX_BATCH with ${totalInBatch} combinations.`);

                // Emit initial progress for this batch
                workerpool.workerEmit({ 
                    type: 'PARALLEL_PROGRESS', 
                    payload: { checked: 0, total: totalInBatch } 
                } as WorkerParallelProgressMessage);

                for (let i = 0; i < combinations.length; i++) {
                    // Check for cancellation before processing each combination
                    if ((workerpool as any).isCancelled && (workerpool as any).isCancelled()) {
                        // console.log("[Worker processParallelTask] DLX_BATCH task cancelled.");
                        return; // Exit if cancelled
                    }

                    const combination = combinations[i];
                    const solution = solveExactTilingCombination(combination, kValue, context);
                    
                    // Emit progress update
                    workerpool.workerEmit({ 
                        type: 'PARALLEL_PROGRESS', 
                        payload: { checked: i + 1, total: totalInBatch } 
                    } as WorkerParallelProgressMessage);

                    if (solution) {
                        // Solution found! Emit result and stop processing this batch.
                        const resultPayload = { // Create payload with serialized BigInts
                           ...solution,
                           gridState: solution.gridState.toString(), // Serialize BigInt
                           placements: solution.placements.map(p => ({ 
                               ...p, 
                               placementMask: p.placementMask.toString() // Serialize BigInt
                           }))
                        };
                        workerpool.workerEmit({
                            type: 'PARALLEL_RESULT',
                            payload: resultPayload,
                            originatingSolverType: originatingSolverType // Include type in result
                        } as any); // Use type assertion to bypass strict check
                        return; // Found solution, task done
                    }
                    
                    // Optional: Yield control briefly to allow cancellation checks etc.
                    // await new Promise(resolve => setTimeout(resolve, 0)); 
                }

                // If loop completes without finding a solution in this batch
                // console.log("[Worker processParallelTask] DLX_BATCH finished processing all combinations, no solution found in this batch.");
                workerpool.workerEmit({ 
                    type: 'PARALLEL_RESULT', 
                    payload: null, 
                    originatingSolverType: originatingSolverType // Include type in result
                } as any); // Use type assertion
                break;

            case 'BACKTRACKING_BRANCH':
                // console.log("[Worker processParallelTask] Processing BACKTRACKING_BRANCH...");
                const branchSolutions = await solveBacktrackingBranch(task.data);
                // console.log("[Worker processParallelTask] BACKTRACKING_BRANCH finished.");

                // Serialize the entire array of solutions, or send null if no solutions found
                const branchResultPayload = branchSolutions ? branchSolutions.map(solution => ({
                    ...solution,
                    gridState: solution.gridState.toString(), // Serialize BigInt for gridState
                    placements: solution.placements.map(p => ({
                        ...p,
                        placementMask: p.placementMask.toString() // Serialize BigInt for placementMask
                    }))
                    // maxShapes is already a number, no need to serialize
                })) : null;

                workerpool.workerEmit({ 
                    type: 'PARALLEL_RESULT', 
                     payload: branchResultPayload, // Send the array (or null)
                     originatingSolverType: originatingSolverType // Include type in result
                } as any); // Use type assertion
                break;

            default:
                console.error("[Worker processParallelTask] Unknown task type received:", task);
                workerpool.workerEmit({ 
                    type: 'PARALLEL_ERROR', 
                    payload: { message: `Unknown task type: ${(task as any).type}` } 
                } as WorkerParallelErrorMessage);
        }

    } catch (error: any) {
        const isCancellation = error instanceof workerpool.Promise.CancellationError || error.name === 'CancellationError';
        if (!isCancellation) {
            console.error(`[Worker processParallelTask] Error processing task type ${task.type}:`, error);
            workerpool.workerEmit({ 
                type: 'PARALLEL_ERROR', 
                payload: { 
                    message: `Error in task ${task.type}: ${error.message}`,
                    originalTaskType: task.type 
                } 
            } as WorkerParallelErrorMessage);
        }
        // Do not emit anything further if cancelled, let the main thread handle timeout/cleanup

    } finally {
         const taskEndTime = Date.now();
         // console.log(`[Worker processParallelTask] Finished task type ${task.type} in ${taskEndTime - taskStartTime}ms`);
    }
};


// --- Worker Registration (Updated) ---
workerpool.worker({
  initializeSolverContext: initializeSolverContext,
  processParallelTask: processParallelTask
});

// console.log('[Solver Worker] Worker updated for parallel tasks and ready.');