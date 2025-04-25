// import type { Point, HexCoord } from './hexUtils'; // Assuming these are correctly exported from hexUtils

// Basic geometric types
export interface Point {
  x: number;
  y: number;
}
export interface HexCoord {
  q: number;
  r: number;
  // Consider adding id here if consistently used, otherwise keep it simple
}

// --- Add SolverType definition ---
export type SolverType = 'exact' | 'maximal';

// --- CORE DATA STRUCTURES --- //

// Represents a potential shape selected by the user
export interface PotentialShape {
  id: string; // Unique ID for this potential shape instance
  canonicalForm: string; // String representation (e.g., '11101000') of the canonical orientation
  bitmask: bigint; // Bitmask for the canonical orientation
  svgPath: string; // SVG path for rendering
}

// Represents the precomputed data for a canonical shape form
export type ShapeData = {
  id: string;             // Identifier (usually the canonical string form)
  canonicalBitmask: bigint; // Bitmask for the canonical form
  validPlacements: bigint[]; // Array of bitmasks for all valid translated placements on the grid
  // Ensure this matches how precomputation stores data in solver.worker.ts
};

// Map storing precomputed data, keyed by canonical shape form string
export type ShapeDataMap = Map<string, ShapeData>;

// Represents a single placed shape instance in a solution
export type PlacementRecord = {
  shapeId: string;        // ID of the shape type placed (matches PotentialShape id)
  placementMask: bigint;  // The specific bitmask of this placement
};

// Represents a complete solution found by the solver
export interface SolutionRecord {
    gridState: bigint; // Final grid state as a bitmask
    placements: PlacementRecord[]; // List of shapes and their final positions
    maxShapes?: number; // Add optional field for max shapes found (for backtracking)
}

// --- SERIALIZED VERSIONS FOR WORKER COMMUNICATION --- //
// Represents a single placed shape instance with stringified mask
export type SerializedPlacementRecord = {
  shapeId: string;        // ID of the shape type placed (matches PotentialShape id)
  placementMask: string;  // The specific bitmask of this placement as a STRING
};

// Represents a complete solution with stringified state/masks
export interface SerializedSolutionRecord {
    gridState: string; // Final grid state as a STRING bitmask
    placements: SerializedPlacementRecord[]; // List of shapes and their final positions
    maxShapes?: number; // Optional field for max shapes found (for backtracking)
}
// --- END SERIALIZED VERSIONS --- //

// --- MAIN THREAD -> WORKER INITIAL EXECUTION --- //

// Common data for initial solver calls
interface SolverExecBase {
    lockedTilesMask: bigint;
    initialGridState: bigint; // Use bigint, default to 0n if optional
    potentials: PotentialShape[]; // Array of shapes user selected
    shapeDataMap: ShapeDataMap; // Precomputed data needed by worker
}

// Specific data for initiating backtracking
export interface SolverExecDataBacktracking extends SolverExecBase {
    type: 'backtracking';
}

// Specific data for initiating exact tiling
export interface SolverExecDataExactTiling extends SolverExecBase {
    type: 'exactTiling';
    // No specific fields needed here, worker calculates k and combinations
}

// Union type for initial execution call
export type SolverInitialExecData = SolverExecDataBacktracking | SolverExecDataExactTiling;

// --- WORKER -> MAIN THREAD FINAL RESULTS --- //

// Common fields for final results
interface SolverResultBase {
    error?: string;
}

// Final result payload for backtracking
export interface SolverResultPayloadBacktracking extends SolverResultBase {
    type: 'backtracking';
    maxShapes: number;      // Maximum number of shapes placed
    solutions: SolutionRecord[]; // Array of solutions achieving maxShapes
}

// Final result payload for exact tiling
export interface SolverResultPayloadExactTiling extends SolverResultBase {
    type: 'exactTiling';
    foundSolution: boolean;
    solutions: SolutionRecord[]; // Solutions if found
}

// Union type for final results
export type SolverFinalResultPayload = SolverResultPayloadBacktracking | SolverResultPayloadExactTiling;

// --- PARALLEL TASK COMMUNICATION (Main Thread <-> Worker) --- //

// Common context needed for parallel solver tasks
export interface SolverTaskContext {
    shapeDataMap: ShapeDataMap;
    initialGridState: bigint;
    lockedTilesMask: bigint;
    potentials: PotentialShape[]; // Full list of potentials for reference if needed
}

// Payload for a batch of DLX combination checks
export interface DLXBatchPayload {
    combinations: string[][]; // Array of combinations (each combination is an array of shape IDs)
    kValue: number;
    context: SolverTaskContext;
    originatingSolverType: 'exact'; // Added to identify the source
}

// Payload for a backtracking search branch
export interface BacktrackingBranchPayload {
    startPlacements: PlacementRecord[]; // Initial placement(s) defining this branch
    startPotentialIndex?: number; // Optional: Index to start searching potentials from
    context: SolverTaskContext;
    originatingSolverType: 'maximal'; // Added to identify the source
    partitionIndexToSkip?: number; // Optional: Index of the potential used for partitioning
}

// Union type for task data
export type WorkerTaskData = DLXBatchPayload | BacktrackingBranchPayload;

// Re-define the wrapper type for tasks sent to the worker
export type WorkerTaskPayload =
    | { type: 'DLX_BATCH', data: DLXBatchPayload }
    | { type: 'BACKTRACKING_BRANCH', data: BacktrackingBranchPayload };

// --- Worker Response Messages (For Parallel Tasks) --- //

export type WorkerMessageType =
    | 'PARALLEL_RESULT' // Renamed to avoid conflict with final result types
    | 'PARALLEL_PROGRESS'
    | 'PARALLEL_ERROR'
    | 'PARALLEL_LOG'
    | 'BACKTRACKING_PROGRESS';

// Message indicating a solution was found (or not) by a parallel task
export type WorkerParallelResultMessage = {
    type: 'PARALLEL_RESULT';
    payload: SolutionRecord | SolutionRecord[] | null; // Allow single or array
    originatingSolverType: 'exact' | 'maximal'; // Added: Type from the original task
};

// Message indicating progress of a parallel task
export type WorkerParallelProgressMessage = {
    type: 'PARALLEL_PROGRESS';
    payload: {
        checked?: number;
        total?: number;
        percentage?: number;
        message?: string;
    };
};

// Error message
export interface WorkerParallelErrorMessage {
    type: 'PARALLEL_ERROR';
    payload: {
        message: string;
        originalTaskType?: WorkerTaskPayload['type'];
    };
}

// Log message (for debugging/info from worker)
export type WorkerParallelLogMessage = {
    type: 'PARALLEL_LOG';
    payload: {
        level: 'debug' | 'info' | 'warn' | 'error';
        message: string;
    };
    originatingSolverType?: SolverType;
};

/** Payload for BACKTRACKING_PROGRESS */
export interface WorkerBacktrackingProgressPayload {
  iterations: number;
  currentMaxK: number;
}

/** Message sent FROM worker with backtracking progress */
// export type WorkerBacktrackingProgressMessage = {
//     type: 'BACKTRACKING_PROGRESS'; 
//     payload: { 
//         iterations: number; 
//         currentMaxK: number; 
//     }; 
//     originatingSolverType?: SolverType 
// }; 

// Union type for all possible messages sent FROM the worker during parallel execution
export type WorkerParallelResponseMessage =
    | WorkerParallelResultMessage
    | WorkerParallelProgressMessage
    | WorkerParallelErrorMessage
    | WorkerParallelLogMessage;

// --- END OF FILE --- // 