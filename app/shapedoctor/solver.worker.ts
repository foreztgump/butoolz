// app/shapedoctor/solver.worker.ts - Optimized Backtracking Version

import * as workerpool from 'workerpool';
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

// --- Combinatorial Exact Tiling Function (DLX-based) ---
// Ensure this function definition is present and uncommented
async function runCombinatorialExactTiling(
  taskData: ExactTilingTaskData // Use the refined type
): Promise<{ maxShapes: number; solutions: SolutionRecord[], error?: string }> {
    console.log(`[Worker runCombinatorialExactTiling] Received task for k=${taskData.k}`);
    allShapeData = new Map(); // Reset precomputed data for this run
    const { 
        k, 
        shapesToTileWith, 
        allPotentialsData, 
        initialGridState = 0n, 
        lockedTilesMask 
    } = taskData;
    
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
        const result = findExactKTilingSolutions(
            k,
            allShapeData, // Pass ALL precomputed data
            [], // initialConstraints (unused)
            shapesToTileWith, // Pass the specific shapes to use for this tiling
            initialGridStateBigint,
            lockedTilesMaskBigint
        );

        const endTime = Date.now();
        console.log(`[Worker runCombinatorialExactTiling] DLX finished in ${endTime - startTime}ms. Found ${result.solutions.length} solutions.`);

        if (result.error) {
            return { maxShapes: 0, solutions: [], error: result.error };
        }
        
        // Return result with maxShapes = k if solutions found
        return { maxShapes: result.solutions.length > 0 ? k : 0, solutions: result.solutions };

    } catch (error) {
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