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
        if (!shapeData || !shapeData.validPlacements) continue;
        const shapeColName = `shape_${shape.id}`;
        const shapeColIndex = columnIndexMap.get(shapeColName)!; 

        for (const placementMask of shapeData.validPlacements) {
            if ((initialGridState & placementMask) === 0n) {
                const coveredTileIds = bitmaskToTileIds(placementMask);
                let allCoveredTilesAvailable = true;
                for(const tileId of coveredTileIds) {
                    const tileColName = `tile_${tileId}`;
                    if (!columnIndexMap.has(tileColName)) {
                        allCoveredTilesAvailable = false;
                        break;
                    }
                }

                if (allCoveredTilesAvailable) {
                    const row = new Array(numColumns).fill(0) as (0 | 1)[]; 
                    
                    // 1. Set the shape column
                    row[shapeColIndex] = 1; 

                    // 2. Set the covered tile columns
                    for(const tileId of coveredTileIds) {
                        const tileColName = `tile_${tileId}`;
                        const tileColIndex = columnIndexMap.get(tileColName)!;
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
        // Use findOne instead of findAll, still expect Result<PlacementRecord>[][]
        let dlxSolutions: Result<PlacementRecord>[][] = []; 
        try {
            // Call findOne - assumes it returns Result<PlacementRecord>[][] like findAll
            dlxSolutions = dlx.findOne(constraints); 
        } catch(dlxError) {
            console.error("[DLX findExactKTilingSolutions] Error calling findOne:", dlxError); 
            return { solutions: [], error: `DLX Solver Error: ${dlxError instanceof Error ? dlxError.message : String(dlxError)}` };
        }
        
        const endTime = Date.now();
        // Adjust logging for findOne result
        console.log(`[DLX findExactKTilingSolutions] findOne completed in ${endTime - startTime}ms. Found ${dlxSolutions.length} raw solution(s).`); 

        // Convert the single dlx solution (if found) to SolutionRecord format
        const formattedSolutions: SolutionRecord[] = [];
        // Check if findOne returned at least one solution
        if (dlxSolutions && dlxSolutions.length > 0) { 
            // Process only the first solution found by findOne
            const firstSolutionItems = dlxSolutions[0]; 
            const placements: PlacementRecord[] = firstSolutionItems.map(item => item.data); 
            const finalGridState = placements.reduce((acc, p) => acc | p.placementMask, 0n);
            formattedSolutions.push({ gridState: finalGridState, placements });
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