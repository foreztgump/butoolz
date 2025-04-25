// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT K-shape tilings using dancing-links.

// import * as dlxlib from 'dlxlib'; // Old library
// import * as dlx from 'dlx'; // Previous library
import * as dlx from 'dancing-links'; // Use the new library
import { findAll, type SimpleConstraint, type Constraint, type Result } from 'dancing-links'; 
import { 
    ShapeData, 
    PlacementRecord, 
    SolutionRecord // ADD SolutionRecord back
} from './types'; // REMOVE .js
import { 
    bitmaskToTileIds, 
    countSetBits 
} from './bitmaskUtils'; // REMOVE .js
import { TOTAL_TILES } from './shapedoctor.config'; // REMOVE .js

// KEEP local ShapeInput definition
interface ShapeInput { id: string };
type ShapeDataMap = Map<string, ShapeData>; // Keep local definition

// --- Matrix Generation for dancing-links ---
// Ensure return type matches SimpleConstraint<PlacementRecord>[]
const buildDancingLinksConstraints = (
    allShapeData: ShapeDataMap, // Use local type
    shapesToTileWith: ShapeInput[], // Use local type
    initialGridState: bigint, 
    lockedTilesMask: bigint
): { constraints: SimpleConstraint<PlacementRecord>[], columnCount: number } => {
    console.log("[DLX] Starting buildDancingLinksConstraints...");
    
    console.log(`[DLX Build Constraints] shapesToTileWith: ${shapesToTileWith.map(s=>s.id).join(', ')}`);
    console.log(`[DLX Build Constraints] initialGridState: ${initialGridState.toString(16)}`);
    console.log(`[DLX Build Constraints] lockedTilesMask: ${lockedTilesMask.toString(16)}`);
    
    // Calculate available tiles
    const availableTiles = new Set<number>();
    for (let i = 1; i <= TOTAL_TILES; i++) {
        if (!((lockedTilesMask >> BigInt(i - 1)) & 1n)) { // Check if the bit for tile i is NOT set in lockedTilesMask
            availableTiles.add(i);
        }
    }
    const availableTileCount = availableTiles.size;
    if (availableTileCount === 0) {
        console.log("[DLX] No available tiles for constraints.");
        return { constraints: [], columnCount: 0 };
    }

    const constraints: SimpleConstraint<PlacementRecord>[] = []; 
    const columnIndexMap: Map<string, number> = new Map();
    let currentColumnIndex = 0;

    // --- Define Column Indices --- 
    // 1. The K Shape *INSTANCES* (Primary Items)
    const shapeInstanceIndexToData = new Map<number, { shapeId: string, instanceIndex: number }>();
    // 1. The K Shapes (Primary Items)
    shapesToTileWith.forEach((shape, index) => {
        const colName = `shape_instance_${index}`; // Unique column for each instance
        columnIndexMap.set(colName, currentColumnIndex);
        shapeInstanceIndexToData.set(currentColumnIndex, { shapeId: shape.id, instanceIndex: index });
        currentColumnIndex++;
    });
    const shapeColumnCount = shapesToTileWith.length; // Should be k
    
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
    const knownSolutionMasksHex = new Set([
        "9240000000", "d2000000000", // Shape 11010010...
        "12600000",                   // Shape 01101001...
        "17", "4c800",                 // Shape 11101000...
        "102048", "1020480",             // Shape 11000001...
        "810220", "4081100",             // Shape 10100000...
        "9a0000000",                  // Shape 00111001...
        "24408000000"                 // Shape 10001000...
    ]);

    // Iterate through each shape *instance* provided
    shapesToTileWith.forEach((shapeInstance, instanceIndex) => {
        const shapeId = shapeInstance.id;
        const shapeData = allShapeData.get(shapeId); // Get data using the ID
        if (!shapeData || !shapeData.validPlacements) {
            console.warn(`[Build Constraints] No shape data or valid placements found for shape ID: ${shapeId} (instance ${instanceIndex}). Skipping.`);
            return; // continue the forEach loop
        }

        // Get the column index specific to this *instance*
        const shapeInstanceColName = `shape_instance_${instanceIndex}`;
        const shapeInstanceColIndex = columnIndexMap.get(shapeInstanceColName);
        if (shapeInstanceColIndex === undefined) {
            console.error(`[Build Constraints] CRITICAL: Could not find column index for ${shapeInstanceColName}. This should not happen.`);
            return; // continue the forEach loop
        }

        for (const placementMask of shapeData.validPlacements) {
            const placementMaskHex = placementMask.toString(16);
            const isKnownSolutionPlacement = knownSolutionMasksHex.has(placementMaskHex);
            const logPrefix = isKnownSolutionPlacement ? "*** KNOWN SOL PLACEMENT ***" : "   ";

            // Log which instance we are building constraints for
            console.log(`${logPrefix} [Build Constraints] Checking shape ${shapeId} (Instance ${instanceIndex}), placement ${placementMaskHex}`);

            if ((initialGridState & placementMask) === 0n) {
                console.log(`${logPrefix}   -> Initial state check PASSED.`);
                const coveredTileIds = bitmaskToTileIds(placementMask);
                let allCoveredTilesAvailable = true;
                let reasonSkipped = ""; // For logging
                for(const tileId of coveredTileIds) {
                    const tileColName = `tile_${tileId}`;
                    if (!columnIndexMap.has(tileColName)) {
                        allCoveredTilesAvailable = false;
                        reasonSkipped = `Tile ${tileId} not available (not in column map - likely locked)`;
                        console.log(`${logPrefix}     -> Tile check FAILED: ${reasonSkipped}`);
                        break;
                    }
                }

                if (allCoveredTilesAvailable) {
                    console.log(`${logPrefix}   -> Available tiles check PASSED.`);
                    const row = new Array(numColumns).fill(0) as (0 | 1)[]; 
                    
                    // 1. Set the shape *instance* column
                    row[shapeInstanceColIndex] = 1;

                    // 2. Set the covered tile columns
                    for(const tileId of coveredTileIds) {
                        const tileColName = `tile_${tileId}`;
                        const tileColIndex = columnIndexMap.get(tileColName)!;
                        row[tileColIndex] = 1;
                    }

                    console.log(`${logPrefix}     --> ADDING CONSTRAINT row for shape instance ${instanceIndex} (${shapeId}), placement ${placementMaskHex}`);
                    constraints.push({
                        data: { shapeId: shapeId, placementMask }, // Store original shape ID
                        row: row // Assign the correctly typed row
                    });
                } else {
                    // Logging moved inside the loop where failure occurs
                }
            } else {
                console.log(`${logPrefix}   -> Initial state check FAILED (overlaps). Skipping.`);
            }
        }
    }); // End forEach loop over shape instances
    
    console.log(`[Dancing Links] Built ${constraints.length} constraints for ${numColumns} items (${shapeColumnCount} shape instances, ${availableTileCount} available tiles).`);
    console.log("[DLX] Finished buildDancingLinksConstraints.");
    return { constraints, columnCount: numColumns }; 
};


// --- Function: findMaximalPlacement ---
export const findMaximalPlacement = (
    shapeDataMap: ShapeDataMap,
    initialGridStateBigint: bigint,
    allShapes: ShapeInput[],
): { maxShapes: number; solutions: SolutionRecord[], error?: string } => {
    try {
        // 1. Define Columns (Items)
        const tileColumns: string[] = [];       // Names of available tile columns (Primary)
        const shapeColumns: string[] = [];      // Names of shape columns (Secondary)
        const tileNameToPrimaryIndex = new Map<string, number>();
        const shapeNameToSecondaryIndex = new Map<string, number>();
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
        const dlxOptions: Constraint<PlacementRecord>[] = [];
        for (const [shapeId, data] of shapeDataMap.entries()) {
            const shapeColName = `S${data.id}`;
            const secondaryShapeIndex = shapeNameToSecondaryIndex.get(shapeColName);

            if (secondaryShapeIndex === undefined) {
                 console.warn(`[findMaximalPlacement] Shape ID ${data.id} from shapeDataMap not found in secondary columns. Skipping.`);
                 continue;
            }

            for (const placementMask of data.validPlacements) { 
                if (placementMask !== 0n && (placementMask & initialGridStateBigint) === 0n) { 
                    
                    const placementData: PlacementRecord = {
                        shapeId: data.id,
                        placementMask: placementMask
                    };
                    
                    // Create sparse arrays for primary and secondary rows
                    const primaryRowArray = new Array(numPrimaryColumns).fill(0) as (0 | 1)[];
                    const secondaryRowArray = new Array(numSecondaryColumns).fill(0) as (0 | 1)[];
                    let placementIsValidForCurrentColumns = true;
                    let coveredPrimaryIndicesCount = 0;

                    for(const tileId of bitmaskToTileIds(placementMask)){
                        const tileName = `T${tileId}`;
                        const primaryTileIndex = tileNameToPrimaryIndex.get(tileName);
                        if (primaryTileIndex !== undefined) {
                            primaryRowArray[primaryTileIndex] = 1;
                            coveredPrimaryIndicesCount++;
                        } else {
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
                        primaryRow: primaryRowArray,     // Sparse array for primary columns (Tiles)
                        secondaryRow: secondaryRowArray,   // Sparse array for secondary columns (Shapes)
                        data: placementData              // Attach the PlacementRecord data
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
        const solutionsRaw: Result<PlacementRecord>[][] = findAll(dlxOptions) as Result<PlacementRecord>[][]; 

        // 4. Process Results
        const finalSolutions: SolutionRecord[] = [];
        if (solutionsRaw && solutionsRaw.length > 0) {
            const maxPlaced = solutionsRaw.reduce((max, sol) => Math.max(max, sol.length), 0);
            // Note: maxPlaced here refers to the number of constraints (placements) in the solution,
            // which should correspond to the number of shapes placed.
            const maximalSolutions = solutionsRaw.filter(sol => sol.length === maxPlaced); 

            maximalSolutions.forEach(solution => {
                let calculatedGridState = initialGridStateBigint;
                const placements: PlacementRecord[] = solution.map(item => {
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
        } else {
             console.log("[findMaximalPlacement] DLX solver returned no solutions.");
            return { maxShapes: 0, solutions: [] };
        }

    } catch (error: any) {
        console.error("Error in findMaximalPlacement:", error);
        return { maxShapes: 0, solutions: [], error: error.message || 'Unknown error' };
    }
};

// --- Function: findExactKTilingSolutions --- 
// Refactored version for exact cover with k specific shapes
export function findExactKTilingSolutions(
    k: number,                     // Target number of shapes
    shapeDataMap: ShapeDataMap,    // Precomputed placements for ALL potential shapes
    _initialConstraints: PlacementRecord[], // Marked unused
    shapesToUse: ShapeInput[],       // List of shapes TO USE for tiling (should have length k)
    initialGridState: bigint = 0n, 
    lockedTilesMask: bigint = 0n   
): { solutions: SolutionRecord[], error?: string } { 
    console.log(`[DLX findExactKTilingSolutions] Starting for k=${k}...`);
    console.log(`[DLX findExactKTilingSolutions] shapesToUse: ${shapesToUse.map(s=>s.id).join(', ')}`);
    console.log(`[DLX findExactKTilingSolutions] initialGridState: ${initialGridState.toString(16)}`);
    console.log(`[DLX findExactKTilingSolutions] lockedTilesMask: ${lockedTilesMask.toString(16)}`);
    if (k !== shapesToUse.length) {
        console.error(`[DLX findExactKTilingSolutions] Mismatch: k is ${k} but shapesToUse has ${shapesToUse.length} items!`);
        return { solutions: [], error: `Input mismatch: k=${k}, number of shapes provided=${shapesToUse.length}` };
    }
     const startTime = Date.now();
    try {
        // Build constraints using only the shapesToUse and available tiles
        console.log("[DLX findExactKTilingSolutions] Building constraints...");
        const { constraints, columnCount } = buildDancingLinksConstraints(
            shapeDataMap,
            shapesToUse,
            initialGridState,
            lockedTilesMask
        );

        if (constraints.length === 0 || columnCount === 0) {
             console.log("[DLX findExactKTilingSolutions] No constraints built, returning empty.");
             return { solutions: [] };
         }
         
        console.log(`[DLX findExactKTilingSolutions] Constraints built (${constraints.length} rows, ${columnCount} cols). Calling findOne...`);
        let dlxSolutions: Result<PlacementRecord>[][] = []; 
        try {
            dlxSolutions = dlx.findOne(constraints); // Reverted back to findOne
        } catch(dlxError) {
            console.error("[DLX findExactKTilingSolutions] Error calling findOne:", dlxError);
            return { solutions: [], error: `DLX Solver Error: ${dlxError instanceof Error ? dlxError.message : String(dlxError)}` };
        }
        
        const endTime = Date.now();
        console.log(`[DLX findExactKTilingSolutions] findOne completed in ${endTime - startTime}ms. Found ${dlxSolutions.length} raw solution(s).`);
        // Safely log raw solutions, converting BigInts to strings
        try {
            const solutionsString = JSON.stringify(dlxSolutions, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString() // Convert BigInt to string
                    : value, // return everything else unchanged
                2
            );
            console.log('[DLX findExactKTilingSolutions] Raw Solutions (BigInts as Strings):', solutionsString);
        } catch (logError) {
            console.error("[DLX findExactKTilingSolutions] Error stringifying raw solutions for logging:", logError);
            console.log("[DLX findExactKTilingSolutions] Raw Solutions (logging failed):", dlxSolutions); // Log raw object as fallback
        }

        // Convert the single dlx solution (if found) to SolutionRecord format
        const formattedSolutions: SolutionRecord[] = [];
        if (dlxSolutions && dlxSolutions.length > 0) { 
            const solutionItems = dlxSolutions[0]; // Get the single solution's items
            const placements: PlacementRecord[] = solutionItems.map(item => item.data);

            if (placements.length === k) {
                const finalGridState = placements.reduce((acc, p) => acc | p.placementMask, 0n);
                formattedSolutions.push({ gridState: finalGridState, placements });
            } else {
                console.warn(`[DLX findExactKTilingSolutions] Solution found by findOne has ${placements.length} items, expected ${k}. Discarding.`);
            }
        }

        console.log("[DLX findExactKTilingSolutions] Finished processing solution."); 
        return { solutions: formattedSolutions }; // Return array containing 0 or 1 solution

    } catch (error) {
        const errorEndTime = Date.now();
        console.error("[DLX findExactKTilingSolutions] Error:", error);
        return { 
            solutions: [], 
            error: `Error in findExactKTilingSolutions: ${error instanceof Error ? error.message : String(error)} (Took ${errorEndTime - startTime}ms)` 
        };
     }
} 