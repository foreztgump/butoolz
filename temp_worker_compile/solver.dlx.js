// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT K-shape tilings using dancing-links.
import { findAll } from 'dancing-links';
import { bitmaskToTileIds, countSetBits } from './bitmaskUtils.js'; // ADD .js
import { TOTAL_TILES } from './shapedoctor.config.js'; // ADD .js
;
// --- Matrix Generation for dancing-links ---
// Ensure return type matches SimpleConstraint<PlacementRecord>[]
const buildDancingLinksConstraints = (allShapeData, // Use local type
shapesToTileWith, // Use local type
initialGridState, lockedTilesMask) => {
    // Calculate available tiles
    const availableTiles = new Set();
    for (let i = 1; i <= TOTAL_TILES; i++) {
        if (!((lockedTilesMask >> BigInt(i - 1)) & 1n)) { // Check if the bit for tile i is NOT set in lockedTilesMask
            availableTiles.add(i);
        }
    }
    const availableTileCount = availableTiles.size;
    if (availableTileCount === 0) {
        // No tiles available, no constraints can be built
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
                const coveredTileIds = bitmaskToTileIds(placementMask);
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
    return { constraints, columnCount: numColumns };
};
// --- Function: findMaximalPlacement ---
export const findMaximalPlacement = (shapeDataMap, initialGridStateBigint, allShapes) => {
    try {
        // 1. Define Columns (Items)
        const tileColumns = []; // Names of available tile columns (Primary)
        const shapeColumns = []; // Names of shape columns (Secondary)
        const tileNameToPrimaryIndex = new Map();
        const shapeNameToSecondaryIndex = new Map();
        let primaryIndexCounter = 0;
        let secondaryIndexCounter = 0;
        // Add Tile Columns (Primary)
        for (let i = 0; i < TOTAL_TILES; i++) {
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
                    for (const tileId of bitmaskToTileIds(placementMask)) {
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
        const solutionsRaw = findAll(dlxOptions);
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
export function findExactKTilingSolutions(k, // Target number of shapes
shapeDataMap, // Precomputed placements for ALL potential shapes
_initialConstraints, // Marked unused
shapesToUse, // List of shapes TO USE for tiling (should have length k)
initialGridState = 0n, lockedTilesMask = 0n) {
    // Input Validation
    if (shapesToUse.length !== k) {
        return { solutions: [], error: `Expected ${k} shapes in shapesToUse, but got ${shapesToUse.length}` };
    }
    console.log(`[findExactKTilingSolutions] Starting exact tiling for ${k} specific shapes...`);
    const startTime = Date.now();
    try {
        // 1. Define Primary Columns (Exact Cover Items)
        // Primary items are the things that must be covered exactly once:
        // - Available Tiles
        // - The K specific Shapes provided
        const tileColumns = [];
        const shapeColumns = [];
        const tileNameToPrimaryIndex = new Map();
        const shapeNameToPrimaryIndex = new Map(); // Both are primary now
        let primaryIndexCounter = 0;
        // Add Tile Columns (Primary Items)
        for (let i = 0; i < TOTAL_TILES; i++) {
            const tileIsLocked = ((lockedTilesMask >> BigInt(i)) & 1n) === 1n;
            const tileIsInitial = ((initialGridState >> BigInt(i)) & 1n) === 1n;
            if (!tileIsLocked && !tileIsInitial) {
                const tileName = `T${i}`;
                tileColumns.push(tileName);
                tileNameToPrimaryIndex.set(tileName, primaryIndexCounter++);
            }
        }
        const numTileColumns = tileColumns.length;
        const expectedTileCoverage = k * 4; // Each shape covers 4 tiles
        if (numTileColumns !== expectedTileCoverage) {
            console.warn(`[findExactKTilingSolutions] Mismatch: Trying to tile ${numTileColumns} available tiles with ${k} shapes (requires ${expectedTileCoverage} tiles).`);
            return { solutions: [], error: `Available tile count (${numTileColumns}) does not match required tile count (${expectedTileCoverage}) for ${k} shapes.` };
        }
        if (numTileColumns === 0 && k === 0) {
            console.log('[findExactKTilingSolutions] Trivial case: 0 available tiles, 0 shapes requested. Returning empty solution.');
            // Return a valid SolutionRecord for the empty grid case
            return { solutions: [{ gridState: initialGridState, placements: [] }] };
        }
        if (numTileColumns === 0 && k > 0) {
            console.warn('[findExactKTilingSolutions] Cannot place shapes when 0 tiles are available.');
            return { solutions: [], error: 'No available tiles to place shapes.' };
        }
        // Add Shape Columns (Also Primary Items for Exact Cover)
        shapesToUse.forEach(shape => {
            const shapeName = `S${shape.id}`; // Prefix to avoid collision
            shapeColumns.push(shapeName);
            shapeNameToPrimaryIndex.set(shapeName, primaryIndexCounter++);
        });
        const numShapeColumns = shapeColumns.length; // Should equal k
        const numPrimaryColumnsTotal = numTileColumns + numShapeColumns;
        console.log(`[findExactKTilingSolutions] Primary Columns: ${numPrimaryColumnsTotal} (${numTileColumns} Tiles, ${numShapeColumns} Shapes)`);
        // --- Define Options (Constraints using SimpleConstraint) --- 
        // For pure exact cover, we use SimpleConstraint where the 'row' covers all primary items.
        const dlxOptions = [];
        for (const shape of shapesToUse) {
            const shapeData = shapeDataMap.get(shape.id);
            const shapeColumnIndex = shapeNameToPrimaryIndex.get(`S${shape.id}`); // Get the shape's primary column index
            if (!shapeData || shapeColumnIndex === undefined) {
                console.warn(`[findExactKTilingSolutions] Shape ${shape.id} data or column index not found. Skipping.`);
                continue;
            }
            for (const placementMask of shapeData.validPlacements) {
                // Check if placement is valid w.r.t initial state and available tiles
                if (placementMask !== 0n && (placementMask & initialGridState) === 0n) {
                    const row = new Array(numPrimaryColumnsTotal).fill(0);
                    let allTilesAvailable = true;
                    let tilesCoveredCount = 0;
                    // Set tile columns covered by this placement
                    for (const tileId of bitmaskToTileIds(placementMask)) {
                        const tileName = `T${tileId}`;
                        const tileColumnIndex = tileNameToPrimaryIndex.get(tileName);
                        if (tileColumnIndex !== undefined) {
                            row[tileColumnIndex] = 1; // Index within the combined primary columns
                            tilesCoveredCount++;
                        }
                        else {
                            // Covers a tile not available in this problem instance (e.g., locked or initial)
                            allTilesAvailable = false;
                            break;
                        }
                    }
                    // Ensure this placement is valid and covers the correct number of *available* tiles
                    if (allTilesAvailable && tilesCoveredCount === 4) {
                        // Set the shape column for this placement
                        row[shapeColumnIndex] = 1;
                        const placementData = {
                            shapeId: shape.id,
                            placementMask: placementMask
                        };
                        dlxOptions.push({
                            row: row, // Single row covering all primary items (tiles + shapes)
                            data: placementData
                        });
                    }
                }
            }
        }
        console.log(`[findExactKTilingSolutions] Built ${dlxOptions.length} options for ${numPrimaryColumnsTotal} primary columns.`);
        if (dlxOptions.length === 0) {
            console.log(`[findExactKTilingSolutions] No valid placements found for the given ${k} shapes.`);
            return { solutions: [] };
        }
        // 3. Run the DLX Solver using SimpleConstraint structure
        const solutionsRaw = findAll(dlxOptions);
        const endTime = Date.now();
        console.log(`[findExactKTilingSolutions] DLX search completed in ${endTime - startTime}ms. Found ${solutionsRaw.length} raw solutions.`);
        // 4. Process Results
        const finalSolutions = [];
        if (solutionsRaw && solutionsRaw.length > 0) {
            solutionsRaw.forEach((solutionItems, index) => {
                // In exact cover, each solution should select exactly k constraints (one for each shape)
                if (solutionItems.length !== k) {
                    console.warn(`[findExactKTilingSolutions] Raw solution ${index} has ${solutionItems.length} items, expected ${k}. Discarding.`);
                    return; // Skip this solution
                }
                let calculatedGridState = initialGridState;
                const placements = [];
                let isValid = true;
                for (const item of solutionItems) {
                    const placementData = item.data;
                    if (placementData && placementData.shapeId !== undefined && placementData.placementMask !== undefined) {
                        placements.push(placementData);
                        calculatedGridState |= placementData.placementMask;
                    }
                    else {
                        console.error(`[findExactKTilingSolutions] Invalid item data in solution ${index}, item index ${item.index}. Discarding solution.`);
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    // Final check: Ensure the final grid covers exactly the expected tiles
                    const placedTileCount = countSetBits(calculatedGridState ^ initialGridState);
                    if (placedTileCount !== numTileColumns) { // Compare against number of available tile columns
                        console.warn(`[findExactKTilingSolutions] Solution ${index} covers ${placedTileCount} tiles, expected ${numTileColumns}. Discarding.`);
                    }
                    else {
                        finalSolutions.push({
                            gridState: calculatedGridState,
                            placements: placements
                        });
                    }
                }
            });
        }
        console.log(`[findExactKTilingSolutions] Returning ${finalSolutions.length} valid exact tiling solutions.`);
        return { solutions: finalSolutions };
    }
    catch (error) {
        const endTime = Date.now();
        console.error(`[findExactKTilingSolutions] Error after ${endTime - startTime}ms:`, error);
        return { solutions: [], error: error.message || 'Unknown error during exact tiling search' };
    }
}
//# sourceMappingURL=solver.dlx.js.map