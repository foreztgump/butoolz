// app/shapedoctor/solver.dlx.ts
// Dedicated solver for finding EXACT 11-shape tilings using dancing-links.

// import * as dlxlib from 'dlxlib'; // Old library
// import * as dlx from 'dlx'; // Previous library
import * as dlx from 'dancing-links'; // Use the new library

import { 
    type SolverExecDataBacktracking, // Re-use for input structure
    type SolverResultPayloadBacktracking, // Re-use for output structure (maxShapes will be 11 or 0)
    type ShapeData, 
    type PlacementRecord, 
    type SolutionRecord
} from './types';
import { 
    bitmaskToTileIds,
    countSetBits
} from './bitmaskUtils';
import { TOTAL_TILES } from './shapedoctor.config';

// --- Types specific to dancing-links input --- 
// Each row in the matrix is represented by an object
interface ConstraintInput {
    data: PlacementRecord; // Store the original shape/placement info
    row: (0 | 1)[]; // Explicitly type as array of 0 or 1
    // primaryRow/secondaryRow could be used, but simple 'row' should work
}

// Type for the items returned within a solution array by dancing-links
// Based on library usage: { data: T, index: number }
interface DlxSolutionItem {
    data: PlacementRecord; 
    index: number; // Original index in the constraints array
}

// --- Matrix Generation for dancing-links ---
// Modify the build function to return the new format
const buildDancingLinksConstraints = (
    allShapeData: Map<string, ShapeData>, 
    shapesToTileWith: { id: string }[], // Exactly 11 shapes
    initialGridState: bigint // Should typically be 0n for full grid tiling
): { constraints: ConstraintInput[], columnCount: number } => {
    
    if (shapesToTileWith.length !== 11) {
        throw new Error(`buildDancingLinksConstraints requires exactly 11 shapes, got ${shapesToTileWith.length}`);
    }

    const constraints: ConstraintInput[] = []; 
    const columnIndexMap: Map<string, number> = new Map();
    let currentColumnIndex = 0;

    // --- Define Column Indices --- 
    // (We don't need explicit column names for dancing-links, just the indices)
    // 1. The 11 Shapes (Primary Items)
    for (const shape of shapesToTileWith) {
        const colName = `shape_${shape.id}`; // Use prefix to avoid collision
        columnIndexMap.set(colName, currentColumnIndex++);
    }
    
    // 2. The 44 Tiles (Primary Items)
    for (let i = 1; i <= TOTAL_TILES; i++) {
        const colName = `tile_${i}`;
        if (!((initialGridState >> BigInt(i - 1)) & 1n)) {
            columnIndexMap.set(colName, currentColumnIndex++);
        } else {
            throw new Error(`Cannot find exact tiling: Tile ${i} is initially occupied.`);
        }
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
                const row = new Array(numColumns).fill(0) as (0 | 1)[]; 
                
                // 1. Set the shape column
                row[shapeColIndex] = 1; 

                // 2. Set the covered tile columns
                let placementIsValid = true;
                for(const tileId of coveredTileIds) {
                    const tileColName = `tile_${tileId}`;
                    if (columnIndexMap.has(tileColName)) {
                        const tileColIndex = columnIndexMap.get(tileColName)!;
                        row[tileColIndex] = 1;
                    } else {
                        placementIsValid = false;
                        break; 
                    }
                }

                if (placementIsValid) {
                    // Add the constraint object to the list
                    constraints.push({
                        data: { shapeId: shape.id, placementMask }, // Store original data
                        row: row // Assign the correctly typed row
                    });
                }
            }
        }
    }
    
    console.log(`[Dancing Links] Built ${constraints.length} constraints for ${numColumns} items.`);
    return { constraints, columnCount: numColumns }; 
};

// --- Exact Tiling Solver Function using dancing-links ---
export const findExact11TilingSolutions = (
    shapesToTileWith: { id: string }[], // Exactly 11 shapes
    allShapeData: Map<string, ShapeData>, // Full precomputed data (with orientations)
    initialGridState: bigint = 0n // Default to empty grid for tiling
): SolverResultPayloadBacktracking => {
    console.log('[Dancing Links Solver] Starting exact 11-tiling search...');
    
    if (shapesToTileWith.length !== 11) {
         console.error('[Dancing Links Solver] Must provide exactly 11 shapes.');
         return { maxShapes: 0, solutions: [], error: "Exact tiling requires 11 shapes." };
    }
    if (initialGridState !== 0n) {
         console.warn('[Dancing Links Solver] Finding exact tiling on a non-empty grid is unusual.');
    }

    let constraintResult: { constraints: ConstraintInput[], columnCount: number };
    try {
         constraintResult = buildDancingLinksConstraints(allShapeData, shapesToTileWith, initialGridState);
    } catch (error) {
        console.error('[Dancing Links Solver] Error building constraints:', error);
        return { maxShapes: 0, solutions: [], error: `Error building constraints: ${(error as Error).message}` };
    }

    const { constraints } = constraintResult;

    if (constraints.length === 0) {
        console.log('[Dancing Links Solver] No valid placements (constraints) found for the given 11 shapes.');
        return { maxShapes: 0, solutions: [] };
    }

    try {
        console.log(`[Dancing Links Solver] Calling dlx.findAll with ${constraints.length} constraints...`);
        // Change from findOne to findAll
        const solutions: DlxSolutionItem[][] = dlx.findAll(constraints); // Returns array of solutions
        
        const finalSolutions: SolutionRecord[] = []; // Initialize empty results

        if (solutions && solutions.length > 0) {
            console.log(`[Dancing Links Solver] dlx.findAll returned ${solutions.length} solution(s).`);
            
            // Process each solution found by findAll
            for (const solution of solutions) {
                const currentPlacements: PlacementRecord[] = [];
                let currentGridState = initialGridState; 
                let isValidSolution = true;

                if (solution.length !== 11) {
                    console.warn(`[Dancing Links Solver] Found solution with ${solution.length} items, expected 11. Discarding.`);
                    isValidSolution = false; // Mark as invalid if length is wrong
                } else {
                    // Loop through the items in this specific solution
                    for (const item of solution) {
                        // item should conform to DlxSolutionItem type
                        const placement = item.data;
                        
                        if (placement && placement.shapeId !== undefined && placement.placementMask !== undefined) { 
                            currentPlacements.push(placement);
                            currentGridState |= placement.placementMask;
                        } else {
                            // Use item.index for better error reporting
                            console.error(`[Dancing Links Solver] CRITICAL: Found solution item with missing/invalid placement data! Original Constraint Index: ${item.index}`);
                            isValidSolution = false;
                            break; 
                        }
                    }
                }

                // Only add if the solution was deemed valid (correct length, no missing data)
                if (isValidSolution) {
                     const finalTileCount = countSetBits(currentGridState);
                     if (finalTileCount !== TOTAL_TILES) {
                          // This should ideally not happen if constraints/DLX work correctly for exact cover
                          console.warn(`[Dancing Links Solver] Solution found but only covers ${finalTileCount}/${TOTAL_TILES} tiles. GridState: ${currentGridState}. Discarding.`);
                     } else {
                          // Add the valid, fully covering solution
                          finalSolutions.push({ gridState: currentGridState, placements: currentPlacements });
                     }
                }
            } // End loop processing solutions from findAll
        } else {
             console.log(`[Dancing Links Solver] dlx.findAll returned no solution.`);
        }
        
        console.log(`[Dancing Links Solver] Returning ${finalSolutions.length} valid exact tiling solution(s).`);
        return {
            maxShapes: finalSolutions.length > 0 ? 11 : 0, // Max shapes is always 11 if a solution exists
            solutions: finalSolutions, 
        };
    } catch (error) {
        console.error('[Dancing Links Solver] Error during DLX execution:', error);
        return { maxShapes: 0, solutions: [], error: `DLX execution error: ${(error as Error).message}` };
    }
}; 