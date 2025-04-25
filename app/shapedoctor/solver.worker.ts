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
  SerializedSolutionRecord,
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
      // --- Add cancellation check early ---
      if ((workerpool as any).isCancelled && (workerpool as any).isCancelled()) {
          // console.log("[Worker solveExactTilingCombination] Cancelled before DLX execution.");
          return null; 
      }
      // ---------------------------------

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
  payload: BacktrackingBranchPayload // Accepts the specific payload for this branch
): Promise<SolutionRecord[] | null> => {
  const { context, startPlacements, startPotentialIndex } = payload; // Destructure payload
  const { shapeDataMap, initialGridState, lockedTilesMask, potentials } = context;
  // Note: initialGridState from context might be ignored if startPlacements are provided, or used as base
  
  // console.log(`[Worker solveBacktrackingBranch] Started. startPotentialIndex: ${startPotentialIndex ?? 'N/A'}, startPlacements count: ${startPlacements.length}`); // <-- Comment out

  // --- Initialize State from Payload --- 
  let currentMaxK = 0;
  let bestSolutions: SolutionRecord[] = [];
  let rawSolutionCountAtMaxK = 0;
  const RAW_SOLUTION_LIMIT = 30000;
  let iterations = 0;

  // Initialize grid state and placed shapes based on startPlacements
  let startingGridState = initialGridState; // Start with base grid (usually 0n)
  const initialPlacedShapes: PlacementRecord[] = [];
  
  for (const placement of startPlacements) {
      // Assume startPlacements are valid and don't overlap each other (dispatcher ensures this)
      startingGridState |= placement.placementMask; // Apply placement mask
      initialPlacedShapes.push({ ...placement }); // Copy placement record
  }
  // console.log(`[Worker solveBacktrackingBranch] Initialized gridState: ${startingGridState.toString(16)}, placedShapes: ${initialPlacedShapes.length}`); // <-- Comment out

  // Determine the index of the potential to start the search from
  const actualStartPotentialIndex = startPotentialIndex ?? 0; // Default to 0 if not provided

  // --- Backtracking Recursive Function (Largely Unchanged Internally) --- 
  const backtrack = (potentialIndex: number, currentGridState: bigint, placedShapes: PlacementRecord[]) => {
    
    // --- Cancellation Check --- 
    if ((workerpool as any).isCancelled && (workerpool as any).isCancelled()) {
        // console.log("[Worker Backtrack] Cancellation detected.");
        return; // Stop exploration if cancelled
    }
    // ------------------------

    iterations++;

    // Periodically emit progress update (consider making interval dynamic or based on branch size)
    if (iterations % 50000 === 0) { // Re-enable progress emit for debugging
        try {
            (workerpool.workerEmit as (msg: WorkerBacktrackingProgressMessage) => void)({
                type: 'BACKTRACKING_PROGRESS',
                payload: {
                    iterations: iterations,
                    currentMaxK: currentMaxK
                }
            });
        } catch (e) {
            console.error("[Worker Backtrack] Error emitting progress:", e);
        }
    }

    // --- Base Case ---
    if (potentialIndex >= potentials.length) {
      const currentK = placedShapes.length;
      if (currentK > currentMaxK) { // Use currentMaxK scoped to this branch
        currentMaxK = currentK;
        const newBestSolution: SolutionRecord = {
          gridState: currentGridState,
          placements: [...placedShapes],
          maxShapes: currentMaxK
        };
        bestSolutions = [newBestSolution];
        rawSolutionCountAtMaxK = 1;
      } else if (currentK === currentMaxK && currentMaxK > 0) {
         if (rawSolutionCountAtMaxK < RAW_SOLUTION_LIMIT) {
             const tiedSolution: SolutionRecord = {
                 gridState: currentGridState,
                 placements: [...placedShapes],
                 maxShapes: currentMaxK
             };
             bestSolutions.push(tiedSolution);
             rawSolutionCountAtMaxK++;
         } else if (rawSolutionCountAtMaxK === RAW_SOLUTION_LIMIT) {
             rawSolutionCountAtMaxK++;
         }
      }
      return; // End this recursive path
    }

    // --- Recursive Step --- //
    const currentPotential = potentials[potentialIndex];
    if (!currentPotential) {
        console.error(`[Worker Backtrack] Error: potentialIndex ${potentialIndex} out of bounds.`);
        return;
    }

    const canonicalData = shapeDataMap.get(currentPotential.canonicalForm);
    const validPlacements = canonicalData?.validPlacements ?? [];

    // --- Option 1: Try placing the current potential ---
    for (const placementMask of validPlacements) {
      if ((currentGridState & placementMask) === 0n) {
        placedShapes.push({ shapeId: currentPotential.id, placementMask });
        backtrack(potentialIndex + 1, currentGridState | placementMask, placedShapes);
        placedShapes.pop();
      }
    }

    // --- Option 2: Skip the current potential ---
    backtrack(potentialIndex + 1, currentGridState, placedShapes);

  };

  // --- Start the Search for this Branch --- 
  // console.log(`[Worker solveBacktrackingBranch] Starting search from index ${actualStartPotentialIndex}`); // <-- Comment out
  
  // Heuristic: Sorting might still be beneficial globally, 
  // but applying it *within* each branch might be complex/less effective.
  // The dispatcher in page.tsx could potentially pass sorted potentials.
  // For now, we use the order provided in context.potentials.

  // Start the search using the INITIALIZED state for this branch
  backtrack(actualStartPotentialIndex, startingGridState, initialPlacedShapes); 

  // console.log(`[Worker solveBacktrackingBranch] Branch search finished. Max k for branch: ${currentMaxK}. Found ${bestSolutions.length} raw solutions.`); // Keep commented

  // --- Filter and Return Results for this Branch --- //
  let filteredSolutions: SolutionRecord[] = [];
  if (bestSolutions.length > 0) {
      const uniqueGridStates = new Set<bigint>();
      for (const solution of bestSolutions) {
          if (!uniqueGridStates.has(solution.gridState)) {
              uniqueGridStates.add(solution.gridState);
              filteredSolutions.push(solution);
              // Limit is applied AFTER aggregation in the main thread now
              // if (filteredSolutions.length >= 500) break;
          }
      }
  }

  // Return the array of unique solutions found *within this branch*
  const result = filteredSolutions.length > 0 ? filteredSolutions : null;
  // console.log(`[Worker solveBacktrackingBranch] Returning ${filteredSolutions.length} unique solutions for k=${currentMaxK} from this branch.`);
  // Log the actual result being returned
  // console.log("[Worker solveBacktrackingBranch] Actual return value:", JSON.stringify(result, (key, value) => 
  //     typeof value === 'bigint' ? value.toString() : value // Handle BigInt serialization for logging
  // , 2));

  // console.log(`[Worker solveBacktrackingBranch] FINISHED branch. Returning ${result ? result.length : 0} solutions.`); // <-- Remove log
  return result;
};


// --- NEW Main Worker Entry Point for Parallel Tasks ---
const processParallelTask = async (task: WorkerTaskPayload): Promise<SerializedSolutionRecord | SerializedSolutionRecord[] | null> => {
    const taskStartTime = Date.now();
    const originatingSolverType = task.data.originatingSolverType; // Extract type
    let finalResult: SerializedSolutionRecord | SerializedSolutionRecord[] | null = null; // Variable to store the final result (serialized)

    try {
        switch (task.type) {
            case 'DLX_BATCH':
                const { combinations, kValue, context } = task.data;
                const totalInBatch = combinations.length;
                let batchSolution: SerializedSolutionRecord | null = null; // Use Serialized type
                // console.log(`[Worker processParallelTask] Processing DLX_BATCH with ${totalInBatch} combinations.`);

                for (let i = 0; i < combinations.length; i++) {
                    // -- Check cancellation WITHIN loop --
                    if ((workerpool as any).isCancelled && (workerpool as any).isCancelled()) {
                        // console.log("[Worker processParallelTask] DLX_BATCH cancelled during loop.");
                        return null; // Exit if cancelled, returning null
                    }
                    // --------------------------------

                    const combination = combinations[i];
                    const solution = solveExactTilingCombination(combination, kValue, context);
                    
                    if (solution) {
                        // Solution found! Serialize and prepare to return.
                        batchSolution = {
                           ...solution,
                           gridState: solution.gridState.toString(), // Serialize BigInt
                           placements: solution.placements.map(p => ({ 
                               ...p, 
                               placementMask: p.placementMask.toString() // Serialize BigInt
                           }))
                        }; // No type assertion needed, shape matches SerializedSolutionRecord
                        break; // Stop processing this batch
                    }
                }

                // --- Emit progress AFTER loop completes --- 
                // Report the total number of combinations processed in THIS batch
                workerpool.workerEmit({ 
                    type: 'PARALLEL_PROGRESS',
                    payload: { checked: totalInBatch } // Report batch size as 'checked'
                } as WorkerParallelProgressMessage);
                // -----------------------------------------

                finalResult = batchSolution; // Set the result for this batch (serialized solution or null)
                break;

            case 'BACKTRACKING_BRANCH':
                // console.log("[Worker processParallelTask] Processing BACKTRACKING_BRANCH...");
                const branchSolutions = await solveBacktrackingBranch(task.data);
                // console.log("[Worker processParallelTask] BACKTRACKING_BRANCH finished.");

                // Serialize the entire array of solutions, or keep null if no solutions found
                finalResult = branchSolutions ? branchSolutions.map(solution => ({
                    ...solution,
                    gridState: solution.gridState.toString(), // Serialize BigInt for gridState
                    placements: solution.placements.map(p => ({
                        ...p,
                        placementMask: p.placementMask.toString() // Serialize BigInt for placementMask
                    }))
                })) : null; // Type matches SerializedSolutionRecord[] | null
                break;

            default:
                console.error("[Worker processParallelTask] Unknown task type received:", task);
                // Optionally emit error message
                workerpool.workerEmit({ 
                    type: 'PARALLEL_ERROR', 
                    payload: { message: `Unknown task type: ${(task as any).type}` } 
                } as WorkerParallelErrorMessage);
                finalResult = null; // Return null on unknown type
        }

    } catch (error: any) {
        const isCancellation = error instanceof workerpool.Promise.CancellationError || error.name === 'CancellationError';
        if (!isCancellation) {
            console.error(`[Worker processParallelTask] Error processing task type ${task.type}:`, error);
            // Optionally emit error message
            workerpool.workerEmit({ 
                type: 'PARALLEL_ERROR', 
                payload: { 
                    message: `Error in task ${task.type}: ${error.message}`,
                    originalTaskType: task.type 
                } 
            } as WorkerParallelErrorMessage);
        }
        finalResult = null; // Return null on error

    } finally {
         const taskEndTime = Date.now();
         // console.log(`[Worker processParallelTask] Finished task type ${task.type} in ${taskEndTime - taskStartTime}ms`);
    }
    
    // Return the final result (serialized solution(s) or null)
    return finalResult;
};


// --- Worker Registration (Updated) ---
workerpool.worker({
  initializeSolverContext: initializeSolverContext,
  processParallelTask: processParallelTask
});

// console.log('[Solver Worker] Worker updated for parallel tasks and ready.'); // Keep commented