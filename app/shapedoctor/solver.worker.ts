// app/shapedoctor/solver.worker.ts - TEMPORARY SIMPLIFIED VERSION FOR DEBUGGING

// REMOVE Old QOper8 debug logs and initialization
/*
console.log("[Worker DEBUG] Simple worker script loaded.");
const simpleTestHandler = (...) => { ... };
const worker = new QOper8Worker();
worker.on('message', simpleTestHandler); 
console.log(`[Worker DEBUG ${self.name}] QOper8 worker initialized and SIMPLE handler registered.`);
*/

// RESTORE Imports needed for solver logic
import * as workerpool from 'workerpool';
import {
  shapeStringToBitmask,
  generateUniqueOrientations,
  translateShapeBitmask,
  // findLowestSetBitIndex, // Not used in current logic
  bitmaskToTileIds,
  countSetBits
} from './bitmaskUtils';
import { HEX_GRID_COORDS } from './shapedoctor.config';
import { type SolverExecData, type SolverResultPayload } from './types'; // Use updated types

const TOTAL_TILES = 44; 

// Define solverHandler with RESTORED logic
const findPlacements = async (taskData: SolverExecData): Promise<SolverResultPayload> => {
  console.log('[Worker Pool] Received data:', taskData);
  const { potentialShapeString } = taskData;

  try {
    console.log(`[Worker Pool] Processing shape: ${potentialShapeString}`);

    const solutions = new Set<string>();
    if (!potentialShapeString) {
      throw new Error('No potential shape string provided.');
    }

    const baseShapeMask = shapeStringToBitmask(potentialShapeString);
    const uniqueOrientations = generateUniqueOrientations(baseShapeMask);
    const tileCount = countSetBits(baseShapeMask);

    // Find the reference point (lowest ID tile) for the base shape
    const baseShapeTileIds = bitmaskToTileIds(baseShapeMask);
    if (baseShapeTileIds.length === 0) {
      throw new Error('Base shape mask resulted in zero tile IDs.');
    }
    const baseReferenceTileId = Math.min(...baseShapeTileIds);
    const baseReferenceCoord = HEX_GRID_COORDS.find(c => c.id === baseReferenceTileId);
    if (!baseReferenceCoord) {
      throw new Error(`Could not find coordinates for base reference tile ID: ${baseReferenceTileId}`);
    }

    uniqueOrientations.forEach(orientationMask => {
      const orientationTileIds = bitmaskToTileIds(orientationMask);
      if (orientationTileIds.length === 0) {
        console.warn('[Worker Pool] Orientation resulted in zero tile IDs, skipping.');
        return;
      }
      const orientationReferenceTileId = Math.min(...orientationTileIds);
      const orientationReferenceCoord = HEX_GRID_COORDS.find(c => c.id === orientationReferenceTileId);
      if (!orientationReferenceCoord) {
        console.error(`[Worker Pool] Could not find coordinates for orientation reference tile ID: ${orientationReferenceTileId}`);
        return;
      }

      HEX_GRID_COORDS.forEach(targetCoord => {
        const deltaQ = targetCoord.q - orientationReferenceCoord.q;
        const deltaR = targetCoord.r - orientationReferenceCoord.r;
        const translatedMask = translateShapeBitmask(orientationMask, deltaQ, deltaR);

        if (countSetBits(translatedMask) === tileCount) {
          const solutionTileIds = bitmaskToTileIds(translatedMask);
          const solutionKey = solutionTileIds.sort((a, b) => a - b).join(',');
          solutions.add(solutionKey);
        }
      });
    });

    const resultPayload: SolverResultPayload = {
      solutions: Array.from(solutions),
    };

    console.log(`[Worker Pool] Processing complete for shape. Found ${resultPayload.solutions.length} unique placements.`);
    return resultPayload; // Return result via promise

  } catch (error) {
    console.error(`[Worker Pool] Error processing shape ${potentialShapeString}:`, error);
    // Return error structure via promise rejection (workerpool handles this)
    // Alternatively, return an error payload:
    return { solutions: [], error: `Error processing shape: ${(error as Error).message}` };
  }
};

// --- Register Worker Function ---
workerpool.worker({
  findPlacements: findPlacements
});

console.log('[Worker Pool] Worker registered functions.');