// app/shapedoctor/solver.worker.ts - Optimized Backtracking Version
import { shapeStringToBitmask, generateUniqueOrientations, translateShapeBitmask, bitmaskToTileIds, countSetBits, } from './bitmaskUtils.js';
import { HEX_GRID_COORDS, TOTAL_TILES } from './shapedoctor.config.js';
import { findExactKTilingSolutions } from './solver.dlx.js';
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
const FULL_GRID_MASK = (1n << BigInt(TOTAL_TILES)) - 1n; // Mask for a full grid
// State variable to store precomputed data for each shape
let allShapeData = new Map();
// --- Precomputation Function ---
const precomputeAllShapeData = (shapesToPlace, lockedTilesMask // Support either bigint or string
) => {
    console.log("[Worker Precompute] Starting precomputation (using deltaQ/R)...");
    const computationStartTime = Date.now();
    const computedData = new Map();
    // Convert string to bigint if needed
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    // Use original IDs directly for the map initially, handle canonical later if needed by solver
    shapesToPlace.forEach((shapeInput) => {
        const shapeId = shapeInput.id;
        const shapeStartTime = Date.now();
        try {
            const baseShapeMask = shapeStringToBitmask(shapeId);
            if (baseShapeMask === 0n) {
                console.warn(`[Worker Precompute] Skipping shape with empty mask: ${shapeId}`);
                return; // Skip this shape
            }
            const uniqueOrientations = generateUniqueOrientations(baseShapeMask);
            const validPlacements = new Set();
            const tileCount = countSetBits(baseShapeMask); // Expected number of tiles
            // Find reference point for the base shape (needed for delta calculation)
            const baseShapeTileIds = bitmaskToTileIds(baseShapeMask);
            if (baseShapeTileIds.length === 0)
                throw new Error('Base shape has no tiles.');
            const baseReferenceTileId = Math.min(...baseShapeTileIds);
            const baseReferenceCoord = HEX_GRID_COORDS.find((c) => c.id === baseReferenceTileId);
            if (!baseReferenceCoord)
                throw new Error(`Base ref coord not found for ${baseReferenceTileId}`);
            uniqueOrientations.forEach((orientationMask) => {
                const orientationTileIds = bitmaskToTileIds(orientationMask);
                if (orientationTileIds.length === 0)
                    return; // Should not happen
                // Use the same reference point finding logic for consistency
                const orientationReferenceTileId = Math.min(...orientationTileIds);
                const orientationReferenceCoord = HEX_GRID_COORDS.find((c) => c.id === orientationReferenceTileId);
                if (!orientationReferenceCoord)
                    return;
                // Iterate through all possible target positions on the grid
                HEX_GRID_COORDS.forEach((targetCoord) => {
                    const deltaQ = targetCoord.q - orientationReferenceCoord.q;
                    const deltaR = targetCoord.r - orientationReferenceCoord.r;
                    // Translate the shape
                    const translatedMask = translateShapeBitmask(orientationMask, deltaQ, deltaR);
                    // Validate the translated mask
                    if (countSetBits(translatedMask) === tileCount) {
                        // *** Check against locked tiles ***
                        if ((translatedMask & lockedTilesMaskBigint) === 0n) {
                            validPlacements.add(translatedMask);
                        }
                        // *** End check ***
                    }
                });
            });
            if (validPlacements.size > 0) {
                // Use the original shapeId as the key for simplicity here
                // Canonical form handling can be done within the solver if needed by solver
                computedData.set(shapeId, { id: shapeId, validPlacements });
            }
            else {
                console.warn(`[Worker Precompute] No valid (unlocked) placements found for shape: ${shapeId}`);
            }
            // Optional timing log
            // const shapeEndTime = Date.now();
            // console.log(`[Worker Precompute] Shape ${shapeId} took ${shapeEndTime - shapeStartTime}ms, ${validPlacements.size} placements.`);
        }
        catch (e) {
            console.error(`[Worker Precompute] Error precomputing shape ${shapeId}:`, e);
            // Store empty set on error to avoid issues later?
            computedData.set(shapeId, { id: shapeId, validPlacements: new Set() });
        }
    });
    const computationEndTime = Date.now();
    console.log(`[Worker Precompute] Precomputation finished in ${computationEndTime - computationStartTime}ms. Computed data for ${computedData.size} shapes.`);
    return computedData;
};
// --- NEW FUNCTION: DLX-Based Maximal Placement ---
const runMaximalPlacementDLX = async (taskData) => {
    console.log("[Worker runMaximalPlacementDLX] Starting maximal placement using DLX...");
    allShapeData = new Map();
    const { shapesToPlace, initialGridState = 0n, lockedTilesMask } = taskData;
    const initialGridStateBigint = typeof initialGridState === 'string' ? BigInt(initialGridState) : initialGridState;
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    console.log(`[Worker runMaximalPlacementDLX] Starting solver for ${shapesToPlace.length} shapes...`);
    const startTime = Date.now();
    let maxK = 0;
    let allMaxKSolutions = [];
    try {
        console.log("[Worker runMaximalPlacementDLX] Running precomputation...");
        allShapeData = precomputeAllShapeData(shapesToPlace, lockedTilesMaskBigint);
        const availableTileCount = TOTAL_TILES - countSetBits(lockedTilesMaskBigint);
        console.log(`[Worker runMaximalPlacementDLX] Available tiles: ${availableTileCount}`);
        if (availableTileCount === 0) {
            console.log("[Worker runMaximalPlacementDLX] No available tiles, returning empty result");
            return { maxShapes: 0, solutions: [] };
        }
        const availableShapeIds = shapesToPlace.map((shape) => shape.id).filter((id) => {
            const shapeData = allShapeData.get(id);
            return !!shapeData && shapeData.validPlacements.size > 0;
        });
        console.log(`[Worker runMaximalPlacementDLX] Available shapes after precomputation: ${availableShapeIds.length}`);
        if (availableShapeIds.length === 0) {
            console.log("[Worker runMaximalPlacementDLX] No shapes with valid placements, returning empty result");
            return { maxShapes: 0, solutions: [] };
        }
        const maxPossibleShapes = Math.min(availableShapeIds.length, Math.floor(availableTileCount / 4));
        console.log(`[Worker runMaximalPlacementDLX] Maximum possible shapes: ${maxPossibleShapes}`);
        for (let k = maxPossibleShapes; k >= 1; k--) {
            console.log(`[Worker runMaximalPlacementDLX] Trying with k = ${k} shapes...`);
            const kStartTime = Date.now();
            let foundSolutionForCurrentK = false;
            let combinationGenerationTime = 0;
            let dlxSolvingTimeForK = 0;
            if (k <= availableShapeIds.length) {
                const comboGenStartTime = Date.now();
                const shapeIdCombos = Array.from(combinations(availableShapeIds, k));
                combinationGenerationTime = Date.now() - comboGenStartTime;
                console.log(`[Worker runMaximalPlacementDLX] Generated ${shapeIdCombos.length} combinations of ${k} shapes in ${combinationGenerationTime}ms`);
                const sortStartTime = Date.now();
                shapeIdCombos.sort((comboA, comboB) => {
                    const minPlacementsA = Math.min(...comboA.map((id) => allShapeData.get(id)?.validPlacements.size ?? Infinity));
                    const minPlacementsB = Math.min(...comboB.map((id) => allShapeData.get(id)?.validPlacements.size ?? Infinity));
                    return minPlacementsA - minPlacementsB;
                });
                console.log(`[Worker runMaximalPlacementDLX] Sorted combinations using heuristic in ${Date.now() - sortStartTime}ms`);
                const comboLoopStartTime = Date.now();
                for (const shapeIdCombo of shapeIdCombos) {
                    const shapesToTry = shapeIdCombo.map((id) => ({ id }));
                    const dlxCallStartTime = Date.now();
                    const dlxResult = findExactKTilingSolutions(k, // 1st arg: number of shapes
                    allShapeData, // 2nd arg: shape data map
                    [], // 3rd arg: initial constraints (unused, pass empty)
                    shapesToTry, // 4th arg: the specific shapes to use
                    initialGridStateBigint, // 5th arg: initial grid state
                    lockedTilesMaskBigint // 6th arg: locked tiles
                    );
                    dlxSolvingTimeForK += Date.now() - dlxCallStartTime;
                    if (dlxResult.solutions.length > 0) {
                        console.log(`[Worker runMaximalPlacementDLX] Found solution with ${k} shapes, solution count: ${dlxResult.solutions.length}`);
                        foundSolutionForCurrentK = true;
                        if (maxK === 0 || k > maxK) {
                            maxK = k;
                            allMaxKSolutions = [...dlxResult.solutions];
                        }
                        else if (k === maxK) {
                            allMaxKSolutions = [...allMaxKSolutions, ...dlxResult.solutions];
                        }
                    }
                }
            }
            const kEndTime = Date.now();
            console.log(`[Worker runMaximalPlacementDLX] Finished k = ${k}. Total time for k: ${kEndTime - kStartTime}ms (Combo Gen: ${combinationGenerationTime}ms, DLX Calls: ${dlxSolvingTimeForK}ms)`);
            if (foundSolutionForCurrentK && maxK === k) {
                console.log(`[Worker runMaximalPlacementDLX] Found the max k = ${k} with ${allMaxKSolutions.length} total solutions`);
                break;
            }
            console.log(`[Worker runMaximalPlacementDLX] No solution found with k = ${k} shapes`);
        }
        if (maxK > 0) {
            console.log(`[Worker runMaximalPlacementDLX] Returning ${allMaxKSolutions.length} solutions for max k = ${maxK}`);
            return { maxShapes: maxK, solutions: allMaxKSolutions };
        }
        else {
            console.log("[Worker runMaximalPlacementDLX] No solution found for any k");
            return { maxShapes: 0, solutions: [] };
        }
    }
    catch (error) {
        console.error('[Worker runMaximalPlacementDLX] Error during solver execution:', error);
        return { maxShapes: 0, solutions: [], error: `Error during solver execution: ${error.message}` };
    }
    finally {
        const endTime = Date.now();
        console.log(`[Worker runMaximalPlacementDLX] Total execution time: ${endTime - startTime}ms`);
    }
};
// --- Worker Entry Point ---
const runSolver = async (taskData) => {
    console.log("[Worker runSolver] Received task:", taskData);
    return runMaximalPlacementDLX(taskData);
};
// --- Combinatorial Exact Tiling Function ---
async function runCombinatorialExactTiling(taskData) {
    console.log("[Worker runCombinatorialExactTiling] Received task with", taskData.allPotentialsData.length, "potentials.");
    const { allPotentialsData, initialGridState = 0n, lockedTilesMask } = taskData;
    const initialGridStateBigint = typeof initialGridState === 'string' ? BigInt(initialGridState) : initialGridState;
    const lockedTilesMaskBigint = typeof lockedTilesMask === 'string' ? BigInt(lockedTilesMask) : lockedTilesMask;
    let shapeDataMap;
    try {
        const availableTileCount = TOTAL_TILES - countSetBits(lockedTilesMaskBigint);
        console.log(`[Worker runCombinatorialExactTiling] Available tiles: ${availableTileCount}`);
        if (availableTileCount % 4 !== 0) {
            console.log(`[Worker runCombinatorialExactTiling] Available tiles (${availableTileCount}) not divisible by 4, exact tiling is impossible.`);
            return { maxShapes: 0, solutions: [] };
        }
        const numShapesNeeded = availableTileCount / 4;
        console.log(`[Worker runCombinatorialExactTiling] Need exactly ${numShapesNeeded} shapes to cover ${availableTileCount} tiles.`);
        const allShapes = allPotentialsData.map((p) => ({ id: p.uniqueId }));
        shapeDataMap = precomputeAllShapeData(allShapes, lockedTilesMaskBigint);
        if (numShapesNeeded === allShapes.length) {
            console.log(`[Worker runCombinatorialExactTiling] Need all ${numShapesNeeded} available shapes, running direct DLX solve.`);
            const dlxResult = findExactKTilingSolutions(numShapesNeeded, // 1st arg: k
            shapeDataMap, // 2nd arg: shape data
            [], // 3rd arg: initial constraints (unused)
            allShapes, // 4th arg: shapes to use
            initialGridStateBigint, // 5th arg: initial grid
            lockedTilesMaskBigint // 6th arg: locked tiles
            );
            return {
                maxShapes: dlxResult.solutions.length > 0 ? numShapesNeeded : 0,
                solutions: dlxResult.solutions,
                error: dlxResult.error
            };
        }
        if (numShapesNeeded < allShapes.length) {
            console.log(`[Worker runCombinatorialExactTiling] Need ${numShapesNeeded} shapes out of ${allShapes.length} available potentials, trying combinations.`);
            const shapesWithPlacements = allShapes.filter(shape => shapeDataMap?.get(shape.id)?.validPlacements.size ?? 0 > 0);
            if (shapesWithPlacements.length < numShapesNeeded) {
                console.log(`[Worker runCombinatorialExactTiling] Not enough shapes (${shapesWithPlacements.length}) with valid placements to form a combination of ${numShapesNeeded}.`);
                return { maxShapes: 0, solutions: [] };
            }
            const shapeCombinations = Array.from(combinations(shapesWithPlacements, numShapesNeeded));
            console.log(`[Worker runCombinatorialExactTiling] Generated ${shapeCombinations.length} combinations.`);
            for (const combo of shapeCombinations) {
                const dlxResult = findExactKTilingSolutions(numShapesNeeded, // 1st arg: k (which is combo.length)
                shapeDataMap, // 2nd arg: shape data (assert non-null as precompute ran)
                [], // 3rd arg: initial constraints (unused)
                combo, // 4th arg: shapes to use (current combo)
                initialGridStateBigint, // 5th arg: initial grid
                lockedTilesMaskBigint // 6th arg: locked tiles
                );
                if (dlxResult.solutions.length > 0) {
                    console.log(`[Worker runCombinatorialExactTiling] Found solution with combination of ${numShapesNeeded} shapes.`);
                    return { maxShapes: numShapesNeeded, solutions: dlxResult.solutions, error: dlxResult.error };
                }
            }
            console.log(`[Worker runCombinatorialExactTiling] Tried all combinations, no exact tiling solution found.`);
            return { maxShapes: 0, solutions: [] };
        }
        console.log(`[Worker runCombinatorialExactTiling] Need ${numShapesNeeded} shapes but only have ${allShapes.length} potentially available, exact tiling is impossible.`);
        return { maxShapes: 0, solutions: [] };
    }
    catch (error) {
        console.error("[Worker runCombinatorialExactTiling] Error during exact tiling search:", error);
        return { maxShapes: 0, solutions: [], error: `Error during exact tiling search: ${error.message}` };
    }
}
// --- Register worker functions --- 
// ... (remains the same) ...
//# sourceMappingURL=solver.worker.js.map