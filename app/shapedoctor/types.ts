export interface Point {
  x: number;
  y: number;
}
export interface HexCoord {
  id: number;
  q: number;
  r: number;
}

// Configuration passed to the solver worker
export interface SolverConfig {
    TOTAL_TILES: number;
    ADJACENT_LIST: number[][];
    // Add other config properties if needed by the worker logic
}

// Data structure sent to the solver worker
export interface SolverWorkerData {
    potentialShapes: string[]; // Array of shape strings
    index: number;             // Worker/task index
    totalTasks: number;        // Total number of workers/tasks
    // config?: SolverConfig; // Config not currently used by worker
}

// Data structure passed to the worker via exec
export interface SolverExecData {
    potentialShapeString: string;
    // Add other necessary parameters if the worker function needs them
}

// Data structure returned by the worker function's promise
export interface SolverResultPayload {
    solutions: string[];  // Array of solution keys (comma-separated tile IDs)
    error?: string;       // Optional error message if execution failed
}

// --- NEW TYPES FOR BACKTRACKING SOLVER ---

// Represents precomputed data for a single shape type
export interface ShapeData {
  id: string;                   // Unique identifier for the shape (e.g., the canonical string)
  baseOrientationMask?: bigint; // <--- Add this optional field
  validPlacements: Set<bigint>; // Set of all valid placement bitmasks on the grid
  // Add other precomputed data if needed (e.g., canonicalMask, orientations)
}

// Represents a single placed shape instance during backtracking
export interface PlacementRecord {
  shapeId: string;        // ID of the shape type placed
  placementMask: bigint;  // The specific bitmask of this placement
}

// Represents a complete solution found by the solver
export interface SolutionRecord {
  gridState: bigint;          // The final combined bitmask of the grid
  placements: PlacementRecord[]; // The list of shapes and their specific placements
}

// Standard solver input type (base interface)
export interface SolverBaseInput {
  initialGridState?: bigint | string; // Initial grid state as bigint or string
  lockedTilesMask: bigint | string;   // Locked tiles mask as bigint or string
}

// Data structure passed to the backtracking solver
export interface SolverExecDataBacktracking extends SolverBaseInput {
  shapesToPlace: { id: string }[]; // List of shapes to attempt placing (initially just need IDs)
  // Make shapeDataMap optional, as precomputation now happens in worker
  shapeDataMap?: Map<string, ShapeData>; 
}

// Data structure passed to the exact tiling solver
export interface SolverExecDataExactTiling extends SolverBaseInput {
  allPotentialsData: { uniqueId: string; baseMaskString: string }[]; // All potential shapes with unique IDs
}

// Data structure returned by both solver functions
export interface SolverResultPayloadBacktracking {
  maxShapes: number;      // Maximum number of shapes placed in the best solutions
  solutions: SolutionRecord[]; // Array of solution records (gridState + placements)
  error?: string;         // Optional error message
} 