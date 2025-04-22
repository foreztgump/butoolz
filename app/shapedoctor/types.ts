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