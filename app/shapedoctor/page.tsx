"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Puzzle,
  RefreshCw,
  Ban,
} from "lucide-react";
import * as Config from './shapedoctor.config';
import type { Point, HexCoord } from './types';
import * as HexUtils from './hexUtils';
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import the new components
import ShapeCanvas from "./components/ShapeCanvas";
import ControlPanel from "./components/ControlPanel";
import StatusPanel from "./components/StatusPanel";
import ResultsTabs from "./components/ResultsTabs";

// Import workerpool
import * as workerpool from 'workerpool';

// Import specific types needed for the new solver
import { 
    type SolverExecDataBacktracking, 
    type SolverExecDataExactTiling,
    type SolverResultPayloadBacktracking, 
    type SolutionRecord,
    type ShapeData,
    type PlacementRecord,
    type PotentialShape,
    type ShapeDataMap,
    type SolverTaskContext,
    type DLXBatchPayload,
    type BacktrackingBranchPayload,
    type WorkerTaskPayload,
    type WorkerParallelResponseMessage,
    type SerializedSolutionRecord,
} from './types';
import { 
    bitmaskToTileIds, 
    shapeStringToBitmask,
    translateShapeBitmask,
    countSetBits,
    setTileLock,
    clearTileLock,
    toggleTileLock,
    isTileLocked,
    getCanonicalShape,
} from './bitmaskUtils';

// Import QOper8 and define types
// import { QOper8 } from 'qoper8-ww';
// import { type SolverResultPayload } from './solver.worker';

// Remove old QOper8 types
/*
type QOper8TaskMessage = {
    type: string;
    data: any;
    id?: string | number;
};
type QOper8Response = {
  finished: boolean;
  results: any; 
} | undefined;
*/

// Define lockable tile IDs
const LOCKABLE_TILE_IDS: ReadonlySet<number> = new Set([
  1, 3, 6, 10, 13, 17, 20, 24, 27, 31, 34, 35, 38, 37, 39, 40, 41, 42, 43, 44
]);

const isSafeNumber = HexUtils.isSafeNumber;

// Remove Poolifier ref
// const poolManagerRef = useRef<SolverPool | null>(null);

// Add this helper function somewhere within the ShapeDoctor component or outside it
const countSetBitsFromString = (shapeString: string): number => {
    let count = 0;
    for (let i = 0; i < shapeString.length; i++) {
        if (shapeString[i] === '1') {
            count++;
        }
    }
    return count;
};

// --- Helper Functions (Move parallel execution logic here) ---

// Combinatorial Helpers
function calculateTotalCombinations(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }
  if (k > n / 2) {
    k = n - k; // Optimization
  }
  let result = 1;
  for (let i = 1; i <= k; ++i) {
    result = result * (n - i + 1) / i;
  }
  return Math.round(result); // Use Math.round for potential floating point inaccuracies
}

function* combinations<T>(elements: T[], k: number): Generator<T[]> {
  if (k < 0 || k > elements.length) {
    return; // Invalid input
  }
  if (k === 0) {
    yield [];
    return;
  }
  if (k === elements.length) {
    yield [...elements];
    return;
  }

  const n = elements.length;
  const indices = Array.from({ length: k }, (_, i) => i);

  while (true) {
    yield indices.map(i => elements[i]);

    // Find the rightmost index that can be incremented
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) {
      i--;
    }

    if (i < 0) {
      // All combinations generated
      return;
    }

    // Increment this index
    indices[i]++;

    // Update subsequent indices
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

export default function ShapeDoctor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const potentialCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const predefinedCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(
    new Map()
  );
  const hoveredHexIdRef = useRef<number | null>(null);
  const currentOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);
  const workerPoolRef = useRef<any | null>(null);
  const anyExactSolutionFound = useRef<boolean>(false);
  const shapeDataMapRef = useRef<ShapeDataMap | null>(null);
  const activeWorkerPromisesRef = useRef<workerpool.Promise<any>[]>([]);

  const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set());
  const [potentials, setPotentials] = useState<string[]>([]);
  const [bestSolutions, setBestSolutions] = useState<SolutionRecord[]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);
  const [gridState, setGridState] = useState<number[]>(() =>
    Array(Config.TOTAL_TILES + 1).fill(-1)
  );
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [solveProgress, setSolveProgress] = useState<number>(0);
  const [lockedTilesMask, setLockedTilesMask] = useState<bigint>(0n);
  const [exactTilingSolutions, setExactTilingSolutions] = useState<SolutionRecord[]>([]);
  const [isFindingExactTiling, setIsFindingExactTiling] = useState<boolean>(false);
  const [currentExactTilingIndex, setCurrentExactTilingIndex] = useState<number>(-1);
  const [currentSolver, setCurrentSolver] = useState<'exact' | 'maximal' | null>(null);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [totalCombinations, setTotalCombinations] = useState<number | null>(null);
  const [combinationsChecked, setCombinationsChecked] = useState<number>(0);
  const [solverStatusMessage, setSolverStatusMessage] = useState<string | null>(null);
  const [completedBacktrackingTasks, setCompletedBacktrackingTasks] = useState<number>(0);

  // Calculate solveProgress based on checked and total combinations
  useEffect(() => {
    if (totalCombinations && totalCombinations > 0 && combinationsChecked > 0) {
      const progress = Math.min(100, Math.round((combinationsChecked / totalCombinations) * 100));
      setSolveProgress(progress);
    } else {
      setSolveProgress(0); // Reset to 0 if total is null/zero or checked is zero
    }
  }, [combinationsChecked, totalCombinations]); // Re-run when these change

  const formattedProgress = `${Math.round(solveProgress)}%`;

  // Calculate FULL_GRID_MASK directly
  const FULL_GRID_MASK = (1n << BigInt(Config.TOTAL_TILES)) - 1n;

  // Initialize workerpool Pool
  useEffect(() => {
    console.log('Initializing workerpool...');
    if (typeof window !== 'undefined') {
      const workerPath = `/workers/solver.worker.js?v=${Date.now()}`;
      const poolSize = navigator.hardwareConcurrency || 4;

      try {
        const pool = workerpool.pool(workerPath, { 
          maxWorkers: poolSize,
          workerType: 'web' 
        });
        workerPoolRef.current = pool;
        console.log('Workerpool initialized:', pool);

        toast.success("Solver pool ready.");

      } catch (error) {
        console.error("Failed to initialize workerpool:", error);
        toast.error("Failed to initialize solver pool.");
      }

      return () => {
          // Original cleanup:
          if (workerPoolRef.current) {
            console.log('Terminating workerpool...');
            workerPoolRef.current.terminate()
              .then(() => console.log('Workerpool terminated successfully.'))
              .catch((err: any) => console.error('Error terminating workerpool:', err))
              .finally(() => {
                workerPoolRef.current = null;
              });
          }
      };
    }
  }, []);

  // --- Tile Locking Handler (Define before handleClick) ---
  const handleToggleTileLock = useCallback((tileId: number) => {
    // Only allow toggling for designated lockable tiles
    if (!LOCKABLE_TILE_IDS.has(tileId)) {
      toast.warning(`Tile ${tileId} is not lockable.`);
      return;
    }
    setLockedTilesMask(prevMask => toggleTileLock(prevMask, tileId));
  }, [setLockedTilesMask]); // LOCKABLE_TILE_IDS is constant

  // --- Helper Functions ---
  const updateGridStateFromSolution = useCallback((solution: SolutionRecord) => {
    // console.log("[updateGridStateFromSolution] Input Solution:", JSON.stringify(solution, (key, value) => 
    //     typeof value === 'bigint' ? value.toString() + 'n' : value, 2)
    // ); 
    const newGrid = Array(Config.TOTAL_TILES + 1).fill(-1);
    const numColors = Config.HEX_COLORS.length;

    if (solution.placements) {
      solution.placements.forEach((placement, shapeIndex) => {
        // Explicitly convert mask back to BigInt
        let mask: bigint;
        try {
          // Assume it might be string or number after transport
          mask = BigInt(placement.placementMask);
        } catch (e) {
          console.error(`Error converting placementMask ${placement.placementMask} to BigInt for shape ${placement.shapeId}`, e);
          return; // Skip this placement if conversion fails
        }

        // Now use the converted mask
        const currentShapeTiles = bitmaskToTileIds(mask);

        if (currentShapeTiles.length === 0) {
            // Add a log here to see if masks are resulting in zero tiles
            console.warn(`Placement mask ${mask.toString()} for shape ${placement.shapeId} resulted in 0 tiles after bitmaskToTileIds`);
            return; 
        }

        if (currentShapeTiles.length !== 4 && currentShapeTiles.length > 0) {
          console.error(`    ERROR: Placement mask resulted in ${currentShapeTiles.length} tiles!`);
        }

        const forbiddenColors = new Set<number>();
        // Find colors used by adjacent, already placed shapes
        currentShapeTiles.forEach(tileId => {
          const neighbors = Config.ADJACENT_LIST[tileId] || [];
          neighbors.forEach(neighborId => {
            if (neighborId !== 0 && newGrid[neighborId] !== -1) {
              // Check if the neighbor belongs to a DIFFERENT shape that's already colored
              // This check might be redundant if we process shapes sequentially and only look at `newGrid`
              // which only contains colors from previously processed shapes.
              forbiddenColors.add(newGrid[neighborId]);
            }
          });
        });

        // Find the first available color index
        let chosenColorIndex = 0;
        while (forbiddenColors.has(chosenColorIndex % numColors)) {
          chosenColorIndex++;
        }
        chosenColorIndex %= numColors;

        // Assign the chosen color to all tiles of the current shape
        currentShapeTiles.forEach(tileId => {
          if (tileId > 0 && tileId <= Config.TOTAL_TILES) {
            newGrid[tileId] = chosenColorIndex;
          }
        });
      });
    } else {
      console.warn("[updateGridStateFromSolution] Solution object missing placements array.");
    }
    
    // Comment out detailed logging BEFORE setting state
    // console.log("[updateGridStateFromSolution] Final newGrid calculated:", JSON.stringify(newGrid));
    // Log non -1 values for quick check
    // const coloredTiles = newGrid.map((color, index) => color !== -1 ? `${index}:${color}` : null).filter(x => x);
    // console.log("[updateGridStateFromSolution] Colored tiles (id:color):", coloredTiles.join(', '));

    setGridState(newGrid);
  }, [setGridState]);

  // --- Coordinate Conversion & Drawing ---
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const currentOffset = currentOffsetRef.current;
    const currentHoverId = hoveredHexIdRef.current;
    const currentGridState = gridState;

    HexUtils.drawHexGrid(
      ctx,
      centerX,
      centerY,
      zoom,
      currentOffset.x,
      currentOffset.y,
      currentHoverId,
      currentGridState,
      selectedTiles,
      lockedTilesMask,
      LOCKABLE_TILE_IDS
    );

    // Continue the animation loop
    animationFrameIdRef.current = requestAnimationFrame(drawMainCanvas);
  }, [zoom, gridState, selectedTiles, lockedTilesMask, LOCKABLE_TILE_IDS]);

  // Revert back to useCallback
  const drawPotentialShapes = useCallback(() => {
    potentials.forEach((shape, index) => {
      const canvas = potentialCanvasRefs.current.get(index);
      if (canvas) {
        // Pass fillColorOverride and hideGrid for consistent styling
        HexUtils.drawPreviewGrid(
          canvas,
          shape,
          index,
          0.7, // Use default size ratio like predefined
          '#a78bfa', // Override with violet color
          true      // Hide background grid
        );
      }
    });
  }, [potentials]); // Dependency on potentials array

  const drawPredefinedShapes = useCallback(() => {
    Config.PREDEFINED_SHAPES.forEach((shape, index) => {
      const canvas = predefinedCanvasRefs.current.get(index);
      if (canvas) {
        HexUtils.drawPreviewGrid(
          canvas,
          Config.PREDEFINED_SHAPES[index],
          index,
          0.5, // Default sizeRatio - Explicitly set smaller value
          '#a78bfa', // Tailwind violet-400 equivalent for the single color
          true      // Hide the background grid
        );
      }
    });
  }, []); // Dependency on drawPreviewGrid (now HexUtils.drawPreviewGrid) is implicit

  // --- Core Solving Logic / Check Potential ---
  const checkPotential = useCallback((potential: string): number => {
    // Check if all '1's form a single connected component
    const tileIndices = [];
    for (let i = 0; i < potential.length; i++) {
      if (potential.charAt(i) === "1") {
        tileIndices.push(i + 1);
      }
    }
    if (tileIndices.length === 0) return 0;

    const visited = new Set<number>();
    const queue: number[] = [tileIndices[0]]; // Start BFS from the first '1'
    visited.add(tileIndices[0]);

    while (queue.length > 0) {
      const currentTile = queue.shift()!;
      const neighbors = Config.ADJACENT_LIST[currentTile] || [];
      for (const neighbor of neighbors) {
        // Check if the neighbor is part of the potential shape ('1') and not visited
        if (
          neighbor !== 0 &&
          potential.charAt(neighbor - 1) === "1" &&
          !visited.has(neighbor)
        ) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    // If the number of visited tiles equals the number of '1's, it's connected
    return visited.size;
  }, []); // Config.ADJACENT_LIST is constant

  // --- State Update Event Handlers ---
  const handleClearSelection = useCallback(() => {
    setSelectedTiles(new Set());
  }, [setSelectedTiles]);

  const handleResetSelection = useCallback(() => {
    setSelectedTiles(new Set());
    setPotentials([]);
    setBestSolutions([]);
    setCurrentSolutionIndex(-1);
    setExactTilingSolutions([]);
    setCurrentExactTilingIndex(-1);
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
    setSolveProgress(0);
    currentOffsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setLockedTilesMask(0n); // Reset locked tiles
    setSolverError(null); // Also clear any solver errors
    toast.info("Selection, results, and locked tiles cleared.");
  }, []); // Dependencies remain the same as state setters are stable

  const handleSavePotential = useCallback(() => {
    // Allow saving shapes of size 1 to 4
    if (selectedTiles.size !== 4) {
      toast.error("Select exactly 4 tiles to save a potential shape.", { duration: 3000 });
      return;
    }

    let potentialString = "";
    for (let i = 1; i <= Config.TOTAL_TILES; i++) {
      potentialString += selectedTiles.has(i) ? "1" : "0";
    }

    // Validate length (should always be correct if TOTAL_TILES is right)
    if (potentialString.length !== Config.TOTAL_TILES) {
        toast.error(`Internal Error: Generated potential string has wrong length (${potentialString.length}). Expected ${Config.TOTAL_TILES}. Potential not saved.`);
        console.error("Generated invalid potential string:", potentialString);
        return; 
    }

    // Check connectivity using the checkPotential function
    // Use selectedTiles.size which we already know is 4
    if (checkPotential(potentialString) !== 4) { 
      toast.error("Selected tiles must form a single connected shape.", {
        duration: 4000,
      });
      return;
    }

    setPotentials((prev) => [...prev, potentialString]);
    toast.success(`Potential ${potentials.length + 1} (4 tiles) saved.`);
    setSelectedTiles(new Set()); // Clear selection after saving
  }, [
    selectedTiles,
    potentials, // Keep potentials dependency for the success message index
    checkPotential,
    setPotentials,
    setSelectedTiles,
  ]);

  // --- Helper Functions (Move parallel execution logic here) ---

  // Central handler for messages from any worker
  const handleWorkerMessage = useCallback((message: WorkerParallelResponseMessage) => {
    // console.log(`[Main Thread] handleWorkerMessage triggered. Type: ${message.type}`); // Keep commented out
    // console.log(`[Main Thread] currentSolver state inside handleWorkerMessage: ${currentSolver}`); 

    switch (message.type) {
      case 'PARALLEL_PROGRESS':
        // Update progress based on batches checked
        const checkedInBatch = message.payload.checked ?? 0; 
        
        // --- Add Log --- 
        console.log(`[Main Thread] Received PARALLEL_PROGRESS: checked=${checkedInBatch}`);
        // ------------- 
        
        // ONLY update the raw count here
        setCombinationsChecked(prev => prev + checkedInBatch);
        break;

      case 'PARALLEL_RESULT':
        // Handle solutions found by a worker
        const resultPayload = message.payload; // Payload can be SolutionRecord | SolutionRecord[] | null
        const solverType = message.originatingSolverType; // <-- Use type from message
        // console.log(`[Main Thread] Processing PARALLEL_RESULT from originating solver: ${solverType}`); 

        // --- Ignore DLX results here, they are handled by Promise.allSettled --- 
        if (solverType === 'exact') {
            // console.log("[Main Thread] Ignoring PARALLEL_RESULT for exact tiling in handleWorkerMessage.");
            break; // Stop processing this message type for exact tiling
        } 
        // ------------------------------------------------------------------------

        // --- At this point, solverType MUST be 'maximal' (or potentially other types if added later) --- 
        if (resultPayload) {
                 // Backtracking sends an array of solutions (or null)
                 if (Array.isArray(resultPayload)) { // Check if it's an array
                     const solutions = resultPayload as SolutionRecord[]; // Safe assertion now
                // console.log(`[Main Thread] Backtracking SOLUTIONS FOUND by worker (count: ${solutions.length})`); 
                     if (solutions.length > 0) {
                   // Storing results is now handled AFTER all workers finish in runParallelMaximalPlacement
                     }
                 } else {
                    console.error("[Main Thread] Received NON-ARRAY payload for Maximal Placement result. Expected array.", resultPayload);
            }
        } else {
           // Null payload handling for maximal placement
           // console.log(`[Main Thread] Received null result payload (solver: ${solverType}).`); 
        }
        break; // Moved break here, was inside the if(resultPayload) block

      case 'PARALLEL_ERROR':
        const errorMsg = message.payload.message;
        console.error("[Main Thread] Received error from worker:", errorMsg);
        if (!solverError) { // Avoid overwriting earlier errors
          setSolverError(`Worker Error: ${errorMsg}`);
          toast.error(`Worker Error: ${errorMsg}`);
        }
        // Optionally terminate pool on worker error
        // if (workerPoolRef.current) workerPoolRef.current.terminate(true);
        break;

      // Add case for PARALLEL_LOG
      case 'PARALLEL_LOG':
        const { level, message: logMessage } = message.payload;
        const logPrefix = "[Worker Log]";
        switch (level) {
          case 'debug':
            console.debug(`${logPrefix} ${logMessage}`);
            break;
          case 'info':
            console.info(`${logPrefix} ${logMessage}`);
            break;
          case 'warn':
            console.warn(`${logPrefix} ${logMessage}`);
            break;
          case 'error':
            console.error(`${logPrefix} ${logMessage}`);
            break;
          default:
            console.log(`${logPrefix} (Unknown level ${level}): ${logMessage}`);
        }
        break;

      // Add case for BACKTRACKING_PROGRESS
      // case 'BACKTRACKING_PROGRESS': // Keep case but comment out processing // <-- REMOVE THIS CASE ENTIRELY
        // const { iterations, currentMaxK } = message.payload;
        // Update UI state for progress display (e.g., a status message)
        // setSolverStatusMessage(`Searching... Iteration: ${iterations.toLocaleString()}, Max K Found: ${currentMaxK}`);
        // break; // Add break to satisfy switch structure

      default:
        // Type guard for exhaustive check (optional but good practice)
        const _exhaustiveCheck: never = message;
        console.warn("[Main Thread] Received unknown message type from worker:", _exhaustiveCheck);
    }
  }, [
      totalCombinations,
      solverError,
      anyExactSolutionFound,
      setCombinationsChecked,
      setExactTilingSolutions,
      setCurrentExactTilingIndex,
      setSolverError,
      updateGridStateFromSolution,
      setBestSolutions,
      setCurrentSolutionIndex,
      setSolverStatusMessage,
      exactTilingSolutions.length
  ]);

  // Dynamic Batch Size Calculation
  const determineDynamicBatchSize = useCallback((totalItems: number): number => {
    const poolSize = navigator.hardwareConcurrency || 4;
    if (totalItems <= 0) return 100;
    const targetBatchesPerWorker = 4;
    const totalTargetBatches = poolSize * targetBatchesPerWorker;
    let batchSize = Math.ceil(totalItems / totalTargetBatches);
    batchSize = Math.max(10, batchSize);
    batchSize = Math.min(5000, batchSize);
    return batchSize;
  }, []); // Empty dependency array if it doesn't depend on component state

  // Helper to dispatch a batch specifically for Exact Tiling
  const dispatchBatchForExactTiling = useCallback(( 
      batchCombinations: string[][],
      kValue: number,
      context: SolverTaskContext 
  ): workerpool.Promise<SerializedSolutionRecord | null> | null => {
      if (!workerPoolRef.current || batchCombinations.length === 0) return null;

      const batchPayload: DLXBatchPayload = {
          combinations: batchCombinations,
          kValue: kValue,
          context: context,
          originatingSolverType: 'exact'
      };
      const taskPayload: WorkerTaskPayload = { type: 'DLX_BATCH', data: batchPayload };

      try {
          // Execute WITH 'on' callback for progress/logs, but ignore results here
          const promise = workerPoolRef.current.exec(
              'processParallelTask', 
              [taskPayload],
              { 
                  on: handleWorkerMessage // Re-add callback for intermediate messages
              } 
          ); 
          return promise;
      } catch (execError) {
          console.error("Error dispatching worker batch for Exact Tiling:", execError);
          if (!solverError) {
              setSolverError("Failed to dispatch solver task.");
              toast.error("Failed to dispatch solver task.");
          }
          return null;
      }
  }, [solverError, handleWorkerMessage]);

  // Function to handle parallel exact tiling - MODIFIED FOR AGGREGATION & LIMIT
  const runParallelExactTiling = useCallback(async ( 
      potentialsToUse: PotentialShape[],
      kValue: number,
      initialGridState: bigint,
      lockedTilesMask: bigint,
      shapeDataMap: ShapeDataMap
  ): Promise<boolean> => {
      // console.log("[runParallelExactTiling] Entered function."); // <-- Remove log
      if (!workerPoolRef.current) {
          console.error("Worker pool not ready for exact tiling.");
          return false;
      }

      const nValue = potentialsToUse.length;
      let totalCombs = 0;
      try {
        totalCombs = calculateTotalCombinations(nValue, kValue);
        // console.log(`Total combinations C(${nValue}, ${kValue}) = ${totalCombs}`);
         if (totalCombs > 10_000_000) { 
             toast.error(`Too many combinations (${totalCombs}). Attempting fallback...`); // Changed message
             setSolverError(`Too many combinations C(${nValue}, ${kValue})`);
             // Don't set isSolving false, let the fallback run
             // Return a specific value or throw an error to signal fallback needed
             throw new Error('CombinationsExceeded'); // Signal caller to fallback
         }
        setTotalCombinations(totalCombs);
        setCombinationsChecked(0); 
      } catch (e) { 
          if ((e as Error).message === 'CombinationsExceeded') {
              throw e; // Re-throw specific error for fallback
          }
          console.error("Error calculating combinations:", e);
          setSolverError("Failed to calculate combinations.");
          setIsSolving(false);
          return false; // Explicitly return false
      }
      
      // Reset state for this run
      setExactTilingSolutions([]); 
      setCurrentExactTilingIndex(-1);

      const potentialIds = potentialsToUse.map(p => p.id);
      const combinationGenerator = combinations(potentialIds, kValue);
      const BATCH_SIZE = Math.max(10, Math.min(2000, determineDynamicBatchSize(totalCombs || 0))); 
      let batch: string[][] = [];
      const allPromises: workerpool.Promise<SerializedSolutionRecord | null>[] = []; 
      let dispatchedCount = 0;

      const context: SolverTaskContext = { lockedTilesMask, initialGridState, shapeDataMap, potentials: potentialsToUse };
      
      // console.log(`[runParallelExactTiling] Starting dispatch with batch size ${BATCH_SIZE}...`);

      // --- Dispatch loop --- 
      for (const combination of combinationGenerator) {
          batch.push(combination);
          if (batch.length >= BATCH_SIZE) {
              dispatchedCount += batch.length;
              const promise = dispatchBatchForExactTiling(batch, kValue, context); 
              if(promise) allPromises.push(promise);
              batch = [];
              await new Promise(resolve => setTimeout(resolve, 0));
          }
      }
      // Dispatch any remaining combinations
      if (batch.length > 0) {
          dispatchedCount += batch.length;
          const promise = dispatchBatchForExactTiling(batch, kValue, context); 
          if(promise) allPromises.push(promise);
      }

      // console.log(`[runParallelExactTiling] Dispatched ${dispatchedCount} combinations in ${allPromises.length} batches. Waiting for all results...`);
      activeWorkerPromisesRef.current = allPromises;
      setSolverStatusMessage(`Checking ${totalCombs.toLocaleString()} combinations across ${allPromises.length} tasks...`);

      // --- Wait for ALL tasks and Aggregate Results --- 
      let finalUniqueSolutions: SolutionRecord[] = [];
      try {
          // console.log(`[runParallelExactTiling] Waiting for ${allPromises.length} promises...`); // <-- Remove log
          const settledResults = await Promise.allSettled(allPromises);
          // console.log("[runParallelExactTiling] All promises settled."); // <-- Remove log
          setSolverStatusMessage('Aggregating results...');

          // Process results from settled promises
          const candidateSolutionsSerialized: SerializedSolutionRecord[] = []; 

          settledResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value) {
                  // Value should be SerializedSolutionRecord | null
                  const workerSolution = result.value as SerializedSolutionRecord; // Assert serialized type
                  if (workerSolution) { // Check if not null
                     candidateSolutionsSerialized.push(workerSolution);
                  }
              } else if (result.status === 'rejected') {
                   const reason = result.reason;
                   const isCancellation = reason instanceof Error && (reason.name === 'CancellationError' || reason.message.includes('cancelled')); 
                   if (!isCancellation) {
                       // console.error(`[runParallelExactTiling] Exact Tiling worker task ${index} rejected:`, reason); // Keep commented
                       // Don't set global error, allow fallback
                   }
               }
          });

          // console.log(`[runParallelExactTiling] Aggregation complete. Found ${candidateSolutionsSerialized.length} candidate serialized solutions.`); // Keep commented
          setSolverStatusMessage('Filtering unique solutions...');

          // Log all candidate solutions BEFORE filtering
          // console.log(`[runParallelExactTiling] Candidate solutions count: ${candidateSolutionsSerialized.length}`); // <-- Remove log
          
          // --- Detailed Log for First Few Candidates --- 
          // if (candidateSolutionsSerialized.length > 0) { // <-- Remove log block
          //     console.log("--- First Few Candidate Details (Before Filtering) ---");
          //     const limit = Math.min(10, candidateSolutionsSerialized.length); // Log up to 10
          //     for (let i = 0; i < limit; i++) {
          //         const sol = candidateSolutionsSerialized[i];
          //         const shapeIds = sol.placements.map(p => p.shapeId).sort().join(', '); // Get sorted list of shape IDs used
          //         console.log(`  Candidate ${i}: gridState=${sol.gridState}, shapes=[${shapeIds}]`);
          //     }
          //     console.log("-----------------------------------------------------");
          // } 
          // --- End Detailed Log ---

          // Filter for unique solutions based on SHAPE COMBINATION (string) and limit to 50
          if (candidateSolutionsSerialized.length > 0) {
              const uniqueSolutionsMap = new Map<string, SerializedSolutionRecord>(); // Key is now shape combination string
              for (const solution of candidateSolutionsSerialized) {
                  // Create a key based on sorted shape instance IDs
                  const shapeCombinationKey = solution.placements
                      .map(p => p.shapeId)
                      .sort()
                      .join(','); // Join sorted IDs into a string key
                  
                  if (!uniqueSolutionsMap.has(shapeCombinationKey)) {
                      uniqueSolutionsMap.set(shapeCombinationKey, solution);
                      if (uniqueSolutionsMap.size >= 50) { // Apply limit of 50
                           console.log("[runParallelExactTiling] Reached limit of 50 unique solutions (by shape combination)."); 
                          break;
                      }
                  }
              }
              const finalUniqueSolutionsSerialized = Array.from(uniqueSolutionsMap.values());

              // Log the final result before returning
              // console.log(`[runParallelExactTiling] Final solutions count (unique by shape combo): ${finalUniqueSolutionsSerialized.length}`); // <-- Remove log
              // Optional: Log the actual solutions if count is small or for debugging
              // if (finalUniqueSolutionsSerialized.length < 10) { 
              //    console.log("[runParallelExactTiling] Final unique solutions (by shape combo):", finalUniqueSolutionsSerialized);
              // }

              // Deserialize final results
              finalUniqueSolutions = finalUniqueSolutionsSerialized.map(s => ({ 
                  ...s,
                  gridState: BigInt(s.gridState),
                  placements: s.placements.map(p => ({
                      ...p,
                      placementMask: BigInt(p.placementMask)
                  }))
              }));
            
              setExactTilingSolutions(finalUniqueSolutions);
              setCurrentExactTilingIndex(finalUniqueSolutions.length > 0 ? 0 : -1);
              if (finalUniqueSolutions.length > 0) {
                 updateGridStateFromSolution(finalUniqueSolutions[0]); 
                 toast.success(`Exact tiling found! Displaying ${finalUniqueSolutions.length} unique solution(s).`);
                 setSolverStatusMessage(`Found ${finalUniqueSolutions.length} unique solution(s).`);
              } 
              // No explicit toast if none found, fallback handles it
          } 
          // No explicit toast if none found initially, fallback handles it
          else {
              // If candidates were found but filtered to zero unique (unlikely but possible)
              toast.info("Exact tiling finished: No unique solutions found.");
          }

      } catch (error: any) {
          // This catch block might not be reached often with Promise.allSettled
          // console.error("[runParallelExactTiling] Error during Promise.allSettled or aggregation:", error); // Keep commented
          setSolverError("An error occurred during exact tiling search.");
          toast.error("An error occurred during exact tiling search.");
          // Re-throw to potentially trigger fallback in handleUnifiedSolve if needed?
          // Or handle error state directly
          return false; // Indicate failure on unexpected error
      } finally {
           activeWorkerPromisesRef.current = [];
           setSolverStatusMessage(null);
           // isSolving is reset in handleUnifiedSolve
           // console.log("[runParallelExactTiling] finished.");
      }
      
      // console.log(`[runParallelExactTiling] Returning ${finalUniqueSolutions.length > 0}`); // <-- Remove log
      // Return boolean indicating if solutions were found for the fallback logic
      return finalUniqueSolutions.length > 0;
      
  }, [
      determineDynamicBatchSize, 
      solverError, 
      updateGridStateFromSolution, 
      setSolverStatusMessage,
      dispatchBatchForExactTiling 
  ]);

  // Function to handle parallel Maximal Placement (Backtracking) - MODIFIED FOR PARALLEL DISPATCH & PROMISE VALUE PROCESSING
  const runParallelMaximalPlacement = useCallback(async (
    potentialsToUse: PotentialShape[],
    initialGridState: bigint,
    lockedTilesMask: bigint,
    shapeDataMap: ShapeDataMap 
  ) => {
    // console.log("[runParallelMaximalPlacement] Entered function."); 
    if (!workerPoolRef.current) { 
        toast.error("Worker pool not ready for backtracking.");
        console.error("Worker pool is missing for backtracking.");
        setIsSolving(false);
        return;
    }
    if (!shapeDataMap || shapeDataMap.size === 0) { // Added check for shapeDataMap
        toast.error("Shape data map is not available for backtracking.");
        console.error("Shape data map is missing for backtracking.");
        setIsSolving(false);
        return;
    }

    setCompletedBacktrackingTasks(0); 
    setCurrentSolver('maximal');
    setBestSolutions([]); 
    setCurrentSolutionIndex(-1);
    setSolverStatusMessage('Preparing tasks...'); // Updated initial message
    const allPromises: workerpool.Promise<SerializedSolutionRecord[] | null>[] = []; 

    const context: SolverTaskContext = { shapeDataMap, initialGridState, lockedTilesMask, potentials: potentialsToUse };

    // --- Heuristic Partitioning Strategy --- 
    let partitionPotentialIndex = -1;
    let bestPlacementCountDiff = Infinity;
    const targetTaskCount = (navigator.hardwareConcurrency || 4) * 2; // Target ~2x workers
    const potentialsToConsider = Math.min(potentialsToUse.length, 5); // Check first 5 potentials

    if (potentialsToUse.length > 0) {
        for (let i = 0; i < potentialsToConsider; i++) {
            const potential = potentialsToUse[i];
            const potentialData = shapeDataMap.get(potential.canonicalForm);
            const placementCount = potentialData?.validPlacements?.length ?? 0;
            if (placementCount > 0) { // Only consider potentials with placements
                 const diff = Math.abs(placementCount - targetTaskCount);
                 if (diff < bestPlacementCountDiff) {
                     bestPlacementCountDiff = diff;
                     partitionPotentialIndex = i;
                 }
            }
        }
        // Fallback to first potential if none suitable found (or only one potential)
        if (partitionPotentialIndex === -1) {
             partitionPotentialIndex = 0;
        }
        console.log(`[runParallelMaximalPlacement] Partitioning based on potential index: ${partitionPotentialIndex}`);

        const partitionPotential = potentialsToUse[partitionPotentialIndex];
        const partitionPotentialData = shapeDataMap.get(partitionPotential.canonicalForm);
        const partitionPlacements = partitionPotentialData?.validPlacements ?? [];
        const potentialIndexAfterPartition = partitionPotentialIndex + 1; // Index to start search in branches

        // Task 1: Skip the chosen partition potential
        const skipPayload: BacktrackingBranchPayload = { 
            startPlacements: [], 
            startPotentialIndex: potentialIndexAfterPartition, // Start after the skipped one
            // Need to filter out the skipped potential from the context passed?
            // Alternative: Worker skips the partitionPotentialIndex if encountered.
            // Let's keep context simple and handle skipping in worker (requires small worker mod)
            context: { ...context, // Pass full context for now
                 potentials: potentialsToUse // Send original list 
            }, 
            originatingSolverType: 'maximal',
            partitionIndexToSkip: partitionPotentialIndex // Explicitly tell worker which index to skip
        };
        const skipTask: WorkerTaskPayload = { type: 'BACKTRACKING_BRANCH', data: skipPayload };
        try {
            const skipPromise = workerPoolRef.current.exec('processParallelTask', [skipTask]);
            if (skipPromise) allPromises.push(skipPromise);
        } catch (execError) { console.error("Error dispatching 'skip partition' backtracking task:", execError); }

        // Tasks 2...N: Place the chosen partition potential
        for (const placementMask of partitionPlacements) {
            const startPlacement: PlacementRecord = { shapeId: partitionPotential.id, placementMask };
    const branchPayload: BacktrackingBranchPayload = {
                startPlacements: [startPlacement], 
                startPotentialIndex: potentialIndexAfterPartition, // Start after the placed one
                context: { ...context, // Pass full context
                    potentials: potentialsToUse 
                 }, 
                originatingSolverType: 'maximal',
                partitionIndexToSkip: partitionPotentialIndex // Still need to skip this index in sub-branches
            };
            const branchTask: WorkerTaskPayload = { type: 'BACKTRACKING_BRANCH', data: branchPayload };
            try {
                const branchPromise = workerPoolRef.current.exec('processParallelTask', [branchTask]);
                if (branchPromise) allPromises.push(branchPromise);
            } catch (execError) { console.error(`Error dispatching backtracking task for placement ${placementMask}:`, execError); }
        }

    } else {
        console.warn("[runParallelMaximalPlacement] No potentials provided.");
        setIsSolving(false);
        return;
    }
    // --- End Heuristic Partitioning --- 
    
    console.log(`[runParallelMaximalPlacement] Dispatched ${allPromises.length} backtracking tasks. Waiting for results...`); // Log count after dispatch
    activeWorkerPromisesRef.current = allPromises; 

    // --- Wrap promises to track completion --- // <-- New Block
    let settledCount = 0;
    const totalTasks = allPromises.length;
    setSolverStatusMessage(`Processing 0 / ${totalTasks} backtracking tasks...`); // Initial message

    const trackingPromises = allPromises.map(p =>
      p.then(
        (value) => {
          settledCount++;
          setCompletedBacktrackingTasks(settledCount); // Update state on success
          // Update status message periodically or based on count
          if (settledCount % 5 === 0 || settledCount === totalTasks) { // Update every 5 or on last task
             setSolverStatusMessage(`Processing ${settledCount} / ${totalTasks} backtracking tasks...`);
          }
          return { status: 'fulfilled', value }; // Keep standard settled format
        },
        (reason) => {
          settledCount++;
          setCompletedBacktrackingTasks(settledCount); // Update state on failure
           if (settledCount % 5 === 0 || settledCount === totalTasks) {
               setSolverStatusMessage(`Processing ${settledCount} / ${totalTasks} backtracking tasks...`);
           }
          return { status: 'rejected', reason }; // Keep standard settled format
        }
      )
    );
    // --------------------------------------

    // --- Wait for all TRACKING tasks and Aggregate Results --- 
    try {
      // console.log(`[runParallelMaximalPlacement] Waiting for ${trackingPromises.length} tracking promises...`);
      const settledResults = await Promise.allSettled(trackingPromises); // Wait for the wrappers
      // console.log("[runParallelMaximalPlacement] All backtracking tracking promises settled."); 
      setSolverStatusMessage(`Aggregating results from ${totalTasks} tasks...`);

      // Process results - IMPORTANT: result.value is now {status: ..., value: ...} or {status: ..., reason: ...}
      let overallMaxK = 0;
      const candidateSolutionsSerialized: SerializedSolutionRecord[] = []; 

      settledResults.forEach((wrappedResult: PromiseSettledResult<any>, index) => { // Type is now PromiseSettledResult<any> because of the wrapper
          if (wrappedResult.status === 'fulfilled') {
              const originalResult = wrappedResult.value; // This is our {status, value/reason} object
              if (originalResult.status === 'fulfilled' && originalResult.value) {
                  // Original promise was fulfilled, process originalResult.value
                  const workerSolutions = originalResult.value as SerializedSolutionRecord[];
                   if (Array.isArray(workerSolutions) && workerSolutions.length > 0) {
                       // --- Start of existing aggregation logic --- 
                        const workerMaxK = workerSolutions[0]?.maxShapes; 
                        if (typeof workerMaxK === 'number' && isFinite(workerMaxK)) {
                            if (workerMaxK > overallMaxK) {
                                overallMaxK = workerMaxK;
                                candidateSolutionsSerialized.length = 0; // Clear previous candidates
                                candidateSolutionsSerialized.push(...workerSolutions); // Add serialized solutions
                            } else if (workerMaxK === overallMaxK && overallMaxK > 0) {
                                candidateSolutionsSerialized.push(...workerSolutions); // Add serialized solutions
                            }
                        } else {
                             console.warn(` Worker ${index} returned solutions but maxShapes was invalid or missing:`, workerMaxK, workerSolutions[0]);
                         }
                         // --- End of existing aggregation logic --- 
                   }
              } else if (originalResult.status === 'rejected') {
                  // Original promise was rejected
                  const reason = originalResult.reason;
                  const isCancellation = reason instanceof Error && (reason.name === 'CancellationError' || reason.message.includes('cancelled')); 
                  if (!isCancellation) {
                      // console.error(` Backtracking worker task ${index} rejected (via wrapper):`, reason); 
                  }
              }
          } else {
               // Tracking promise itself rejected (shouldn't normally happen here)
               console.error(` Tracking promise ${index} rejected:`, wrappedResult.reason);
           }
      });

      // ... (rest of filtering, deserialization, state updates - NO CHANGE needed here) ...
        setSolverStatusMessage('Filtering unique solutions...');
        if (candidateSolutionsSerialized.length > 0) {
             const uniqueSolutionsMap = new Map<string, SerializedSolutionRecord>();
            for (const solution of candidateSolutionsSerialized) {
                const gridStateKey = solution.gridState; // Already a string
                if (!uniqueSolutionsMap.has(gridStateKey)) {
                    uniqueSolutionsMap.set(gridStateKey, solution);
                    if (uniqueSolutionsMap.size >= 500) {
                        // console.log("[runParallelMaximalPlacement] Reached limit of 500 unique solutions during aggregation.");
                        break;
                    }
                }
            }
            const finalUniqueSolutionsSerialized = Array.from(uniqueSolutionsMap.values());
            const finalUniqueSolutions = finalUniqueSolutionsSerialized.map(s => ({
                ...s,
                gridState: BigInt(s.gridState), // Convert back to BigInt
                placements: s.placements.map(p => ({
                    ...p,
                    placementMask: BigInt(p.placementMask) // Convert back to BigInt
                }))
            }));
            setBestSolutions(finalUniqueSolutions);
            setCurrentSolutionIndex(finalUniqueSolutions.length > 0 ? 0 : -1);
            if (finalUniqueSolutions.length > 0) {
               updateGridStateFromSolution(finalUniqueSolutions[0]); 
               toast.success(`Maximal placement found (${overallMaxK} shapes)! Found ${finalUniqueSolutions.length} unique layouts.`);
            } else { 
               toast.info("Backtracking finished: No placements possible (after filtering).?"); 
               setBestSolutions([]); // Ensure solutions are cleared
               setCurrentSolutionIndex(-1);
            }
        } else {
             toast.info("Backtracking finished: No placements possible.");
             setBestSolutions([]); // Ensure solutions are cleared
             setCurrentSolutionIndex(-1);
        }

    } catch (error) { 
        console.error("[runParallelMaximalPlacement] Error waiting for backtracking promises:", error);
        if (!solverError) { 
            setSolverError("Error processing backtracking results.");
            toast.error("Error processing backtracking results.");
        }
    } finally {
        activeWorkerPromisesRef.current = []; 
        setSolverStatusMessage(null); 
        // Reset completed task count (optional, could do at start)
        // setCompletedBacktrackingTasks(0);
        console.log("[runParallelMaximalPlacement] Exiting function.");
    }
  }, [
      solverError, 
      updateGridStateFromSolution, 
      determineDynamicBatchSize, 
      setSolverStatusMessage,
      setCompletedBacktrackingTasks // <-- Add state setter dependency
  ]); 

  // --- Add useEffect for Backtracking Progress --- // <-- New Block
  useEffect(() => {
    if (currentSolver === 'maximal' && activeWorkerPromisesRef.current.length > 0) {
      const totalTasks = activeWorkerPromisesRef.current.length;
      // Prevent division by zero if totalTasks is somehow 0
      const progress = totalTasks > 0 ? Math.min(100, Math.round((completedBacktrackingTasks / totalTasks) * 100)) : 0;
      setSolveProgress(progress);
    } else if (currentSolver !== 'maximal') {
        // Optional: Reset progress if switching away from maximal
        // setSolveProgress(0); 
    }
    // Check if solve is finished (isSolving is false but solver might still be 'maximal')
    if (!isSolving && currentSolver === 'maximal') {
         setSolveProgress(0); // Reset progress after solve finishes
         setCompletedBacktrackingTasks(0); // Reset count too
    }
  }, [completedBacktrackingTasks, currentSolver, isSolving]);
  // ----------------------------------------------

  // --- Unified Solve Handler --- 
  const handleUnifiedSolve = async () => {
    console.log("[handleUnifiedSolve] Initiating solve...");
    if (!workerPoolRef.current) {
        toast.error("Solver pool not ready.");
        return;
    }
    if (isSolving) {
        toast.warning("Solver is already running.");
        return;
    }

    // --- Reset State --- // (Keep this section)
    setIsSolving(true);
    setSolverError(null);
    setBestSolutions([]); 
    setExactTilingSolutions([]);
    setCurrentSolutionIndex(-1);
    setCurrentExactTilingIndex(-1);
    setSolveProgress(0);
    setCombinationsChecked(0);
    console.log("[handleUnifiedSolve] combinationsChecked state reset to 0");
    setTotalCombinations(null);
    shapeDataMapRef.current = null; 
    anyExactSolutionFound.current = false;
    activeWorkerPromisesRef.current.forEach(p => p.cancel());
    activeWorkerPromisesRef.current = [];

    // --- Prepare Data --- // (Keep this section)
    const currentPotentials = mapPotentialsToObjects(potentials);
    const numSelectedPotentials = currentPotentials.length;
    const currentLockedMask = lockedTilesMask;
    const initialGridState = 0n; // Define initialGridState here

     if (numSelectedPotentials === 0) {
         toast.info("Please select at least one potential shape to solve.");
         setIsSolving(false);
         return;
     }

    try {
        // --- 1. Initialize Context (Precomputation) --- // (Keep this section)
        toast.info("Initializing solver context (precomputing placements)...");
        console.log("Calling initializeSolverContext in worker...");
        const precomputePromise = workerPoolRef.current.exec('initializeSolverContext', [
            currentPotentials,
            currentLockedMask.toString()
        ]);
        activeWorkerPromisesRef.current.push(precomputePromise);
        const shapeDataMapResult = await precomputePromise;
        activeWorkerPromisesRef.current = [];
        shapeDataMapRef.current = shapeDataMapResult as ShapeDataMap; // Store the map
        console.log("Solver context initialized. ShapeDataMap stored.");
        toast.success("Solver context ready.");

        if (!shapeDataMapRef.current || shapeDataMapRef.current.size === 0) {
             throw new Error("Precomputation failed or resulted in no valid shape data.");
         }

        // Filter potentials based on precomputation // (Keep this section)
        const validPotentials = currentPotentials.filter(p => {
            const data = shapeDataMapRef.current?.get(p.canonicalForm);
            return data && data.validPlacements.length > 0;
        });
        const numValidPotentials = validPotentials.length;
        console.log(`Filtered potentials: ${numValidPotentials} have valid placements.`);

        if (numValidPotentials === 0) {
            toast.info("None of the selected shapes have any valid placements on the available grid.");
            setIsSolving(false);
            return;
        }

        // --- 2. Determine Mode --- // (Keep this section)
        const availableTileMask = FULL_GRID_MASK & (~currentLockedMask);
        const availableTileCount = countSetBits(availableTileMask);

        if (availableTileCount === 0) {
            toast.info("No tiles available to place shapes on.");
            setIsSolving(false);
            return;
        }

        const k = availableTileCount / 4;
        const attemptExactTiling = availableTileCount > 0 && availableTileCount % 4 === 0 && numValidPotentials >= k;
        console.log(`Available Tiles: ${availableTileCount}, k=${k}, N(valid)=${numValidPotentials}, Attempt Exact Tiling: ${attemptExactTiling}`);

        // --- 3. Execute Solver --- // (Modify calls within this section)
        let exactSolutionFound = false;
        if (attemptExactTiling) {
            setCurrentSolver('exact');
            toast.info(`Attempting Exact Tiling with k=${k} shapes...`);
            if (shapeDataMapRef.current) {
                try {
                    // Capture the boolean return value
                    exactSolutionFound = await runParallelExactTiling(validPotentials, k, initialGridState, currentLockedMask, shapeDataMapRef.current);
                } catch (error: any) {
                    if (error.message === 'CombinationsExceeded') {
                        // Allow fallback to proceed
                        console.log("Combination limit exceeded, proceeding to fallback.");
                    } else {
                        // Rethrow other errors
                        throw error;
                    }
                }
            } else {
                 throw new Error("Shape data map was not initialized correctly.");
             }

             // Use the captured boolean for fallback decision
             if (!exactSolutionFound) {
                 console.log("Exact Tiling finished, no solution found. Falling back to Maximal Placement.");
                 toast.info("Exact tiling not found. Trying Maximal Placement...");
                 setCurrentSolver('maximal');
                 if (shapeDataMapRef.current) { 
                    await runParallelMaximalPlacement(validPotentials, initialGridState, currentLockedMask, shapeDataMapRef.current);
                 } else {
                     throw new Error("Shape data map was not available for fallback.");
                 }
             }

        } else {
            setCurrentSolver('maximal');
            toast.info("Attempting Maximal Placement...");
             if (shapeDataMapRef.current) { 
                 await runParallelMaximalPlacement(validPotentials, initialGridState, currentLockedMask, shapeDataMapRef.current);
             } else {
                  throw new Error("Shape data map was not available for maximal placement.");
             }
        }

    } catch (error: any) { // (Keep error handling) 
        console.error("Error during unified solve process:", error);
        const errorMsg = error.message || (typeof error === 'string' ? error : "An unknown error occurred");
        setSolverError(errorMsg);
        toast.error(`Solver Error: ${errorMsg}`);
        if (workerPoolRef.current && typeof workerPoolRef.current.terminate === 'function') {
             workerPoolRef.current.terminate(true); 
             workerPoolRef.current = null; 
             toast.error("Solver pool terminated due to error. Please reload.");
        }
    } finally { // (Keep finally block)
        setIsSolving(false);
        activeWorkerPromisesRef.current = [];
        console.log("handleUnifiedSolve finished.");
    }
};

  // --- Rendering Logic ---
  useEffect(() => {
    setIsClient(true);
    requestAnimationFrame(drawMainCanvas);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [drawMainCanvas]);

  useEffect(() => {
    drawPotentialShapes();
  }, [potentials, drawPotentialShapes]);

  // Handle grid update when solution index changes
  useEffect(() => {
    if (currentSolutionIndex >= 0 && bestSolutions[currentSolutionIndex]) {
      // console.log(`[Debug useEffect] Updating grid from Maximal solution index: ${currentSolutionIndex}`); // Reduced
      updateGridStateFromSolution(bestSolutions[currentSolutionIndex]);
    } else if (currentExactTilingIndex >= 0 && exactTilingSolutions[currentExactTilingIndex]) {
      // console.log(`[Debug useEffect] Updating grid from Exact Tiling solution index: ${currentExactTilingIndex}`); // Reduced
      // console.log(`[Debug useEffect] currentSolver: ${currentSolver}, exactTilingSolutions length: ${exactTilingSolutions.length}`); // Add this log
      updateGridStateFromSolution(exactTilingSolutions[currentExactTilingIndex]);
    } else if (!isSolving) {
      // Reset grid if no solution is selected and not solving
      // setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); // Avoid resetting if user is interacting
    }
  }, [currentSolutionIndex, bestSolutions, currentExactTilingIndex, exactTilingSolutions, isSolving]); // Removed updateGridStateFromSolution dependency

  // Debug: Log exactTilingSolutions when it changes
  // console.log("[Debug] exactTilingSolutions state updated:", exactTilingSolutions); // Reduced

  // --- Predefined Shapes --- 
  const handleAddPredefinedPotential = useCallback(
    (shapeString: string) => {
        // Validate length
        if (shapeString.length !== Config.TOTAL_TILES) {
             toast.error(`Cannot add predefined shape: Invalid length (${shapeString.length}). Expected ${Config.TOTAL_TILES}.`);
             console.error("Invalid predefined shape string:", shapeString);
             return;
        }
        setPotentials((prev) => [...prev, shapeString]);
        toast.success("Predefined shape added to saved potentials.");
    },
    [potentials] // Keep dependency on potentials for other logic if needed, or remove if only used for duplicate check
  );

  const handleDeletePotential = useCallback(
    (indexToDelete: number) => {
      setPotentials((prev) => prev.filter((_, index) => index !== indexToDelete));
    },
    [setPotentials]
  );

  const setPredefinedCanvasRef = useCallback(
    (index: number, element: HTMLCanvasElement | null) => {
      if (element) {
        predefinedCanvasRefs.current.set(index, element);
        // Call drawPreviewGrid with override parameters for predefined shapes
        HexUtils.drawPreviewGrid(
          element,
          Config.PREDEFINED_SHAPES[index],
          index,
          0.5, // Default sizeRatio - Explicitly set smaller value
          '#a78bfa', // Tailwind violet-400 equivalent for the single color
          true      // Hide the background grid
        );
    } else {
        predefinedCanvasRefs.current.delete(index);
      }
    },
    [] // No dependencies needed here as Config and HexUtils are stable
  );

  const setPotentialCanvasRef = useCallback(
    (index: number, element: HTMLCanvasElement | null) => {
      if (element) {
        potentialCanvasRefs.current.set(index, element);
        // Call drawPreviewGrid normally for saved potentials (no overrides)
        HexUtils.drawPreviewGrid(
          element,
          potentials[index],
          index
          // Using default sizeRatio, no color override, grid visible
        );
      } else {
        potentialCanvasRefs.current.delete(index);
      }
    },
    [potentials] // Depends on potentials array
  );

  // --- Event Handlers for Canvas Interaction (with Correct Types) --- 
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    setZoom((prevZoom) => Math.min(Math.max(0.2, prevZoom + delta), 3));
  }, []); 

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - currentOffsetRef.current.x, y: e.clientY - currentOffsetRef.current.y });
  }, []); 

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    let hex: HexCoord | null = null;
    let hexId: number | null = null; // Store ID separately

    const worldPos = HexUtils.screenToWorld(screenX, screenY, canvas.width, canvas.height, currentOffsetRef.current, zoom);
    if (worldPos) {
        const axial = HexUtils.pixelToAxial(worldPos.x, worldPos.y);
        if (axial) {
            const rounded = HexUtils.hexRound(axial.q, axial.r);
            if (rounded) {
                 // Find the full coordinate object including ID from config
                const foundCoord = Config.HEX_GRID_COORDS.find(coord => coord.q === rounded.q && coord.r === rounded.r);
                if (foundCoord) {
                    hex = rounded; // Keep the rounded q,r
                    hexId = foundCoord.id; // Store the ID
                }
            }
        }
    }
    hoveredHexIdRef.current = hexId; // Store the ID in the ref

    if (isDragging) {
      currentOffsetRef.current = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
    }
  }, [isDragging, zoom, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    hoveredHexIdRef.current = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    let hex: HexCoord | null = null;
    let hexId: number | null = null; // Store ID separately

    const worldPos = HexUtils.screenToWorld(screenX, screenY, canvas.width, canvas.height, currentOffsetRef.current, zoom);
    if (worldPos) {
        const axial = HexUtils.pixelToAxial(worldPos.x, worldPos.y);
        if (axial) {
            const rounded = HexUtils.hexRound(axial.q, axial.r);
            if (rounded) {
                 // Find the full coordinate object including ID from config
                const foundCoord = Config.HEX_GRID_COORDS.find(coord => coord.q === rounded.q && coord.r === rounded.r);
                if (foundCoord) {
                    hex = rounded; // Keep the rounded q,r
                    hexId = foundCoord.id; // Store the ID
                }
            }
        }
    }

    if (hexId !== null && hexId > 0 && hexId <= Config.TOTAL_TILES) { // Use hexId now
        if (LOCKABLE_TILE_IDS.has(hexId)) {
            handleToggleTileLock(hexId); // Use the dedicated handler
        } else {
            if (isTileLocked(lockedTilesMask, hexId)) {
                 toast.warning("Cannot select a locked tile.");
                 return;
             }
            setSelectedTiles((prev) => {
                const newSelection = new Set(prev);
                if (newSelection.has(hexId)) {
                    newSelection.delete(hexId);
      } else {
                    if (newSelection.size < 4) { 
                        newSelection.add(hexId);
                    } else {
                        toast.error("Maximum 4 tiles selected.");
                    }
                }
                return newSelection;
            });
        }
    }
  }, [
    isDragging, 
    zoom, 
    lockedTilesMask, 
    handleToggleTileLock, 
    setSelectedTiles
  ]);

  // --- Handlers for viewing solutions ---
  const handlePreviousSolution = useCallback(() => {
      if(currentSolver === 'exact'){
          setCurrentExactTilingIndex(prev => (prev > 0 ? prev - 1 : exactTilingSolutions.length - 1));
      } else if (currentSolver === 'maximal'){
         setCurrentSolutionIndex(prev => (prev > 0 ? prev - 1 : bestSolutions.length - 1));
      }
  }, [currentSolver, exactTilingSolutions, bestSolutions]);

  const handleNextSolution = useCallback(() => {
       if(currentSolver === 'exact'){
           setCurrentExactTilingIndex(prev => (prev < exactTilingSolutions.length - 1 ? prev + 1 : 0));
       } else if (currentSolver === 'maximal'){
           setCurrentSolutionIndex(prev => (prev < bestSolutions.length - 1 ? prev + 1 : 0));
       }
  }, [currentSolver, exactTilingSolutions, bestSolutions]);
  
  // --- Effect to update grid when solution index changes ---
  useEffect(() => {
    if (currentSolver === 'exact' && currentExactTilingIndex >= 0 && exactTilingSolutions.length > 0) {
      updateGridStateFromSolution(exactTilingSolutions[currentExactTilingIndex]);
    } else if (currentSolver === 'maximal' && currentSolutionIndex >= 0 && bestSolutions.length > 0) {
      updateGridStateFromSolution(bestSolutions[currentSolutionIndex]);
    } else {
      // If no solution is selected or available for the current mode, reset grid (optional)
      // setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); 
    }
  }, [currentExactTilingIndex, exactTilingSolutions, currentSolutionIndex, bestSolutions, currentSolver, updateGridStateFromSolution]);

  // --- Initialization and Drawing Effects ---
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      animationFrameIdRef.current = requestAnimationFrame(drawMainCanvas);
      drawPotentialShapes();
      drawPredefinedShapes();
      // Add resize listener
      const handleResize = () => {
        // Redraw canvas on resize
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = requestAnimationFrame(drawMainCanvas);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isClient, drawMainCanvas, drawPotentialShapes, drawPredefinedShapes]);

  // Effect to redraw previews when potentials change
  useEffect(() => {
    if (isClient) {
      drawPotentialShapes();
    }
  }, [potentials, isClient, drawPotentialShapes]);

  // --- Cancellation Handler ---
  const handleCancelSolve = useCallback(() => {
    if (activeWorkerPromisesRef.current.length > 0) {
      activeWorkerPromisesRef.current.forEach(p => p.cancel());
      activeWorkerPromisesRef.current = [];
      console.log("Solver task cancellation requested.");
      toast.info("Solver task cancellation requested.");
      // Note: Worker needs to handle cancellation internally to actually stop.
      // State like isSolving will be reset when the promise rejects/resolves after cancellation.
    } else {
      console.warn("Attempted to cancel, but no active worker promises found.");
      // Maybe reset isSolving state here just in case?
      // setIsSolving(false);
    }
  }, []); // No dependencies needed if only interacting with ref

  // Re-add helper function
  const mapPotentialsToObjects = (potentialsStrings: string[]): PotentialShape[] => {
      return potentialsStrings.map((pStr, index) => {
          const parts = pStr.split('::');
          const canonicalForm = parts[0]; // Assuming first part is canonical
          const id = parts.length > 1 ? pStr : `${canonicalForm}::instance_${index}`; // Create unique ID if needed
          try {
              const bitmask = shapeStringToBitmask(canonicalForm); // Calculate bitmask
              if (countSetBits(bitmask) !== 4) {
                  console.warn(`Potential ${pStr} does not have 4 tiles. Filtering out.`);
                  return null; // Filter out invalid shapes early
              }
              return { id, canonicalForm, bitmask };
          } catch (e) {
              console.error(`Error processing potential string: ${pStr}`, e);
              return null; // Filter out on error
          }
      }).filter((p): p is PotentialShape => p !== null); // Filter out nulls and assert type
  };

  // --- Rendering ---
  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 overflow-hidden relative p-4 gap-4">
      {/* <CookieConsentBanner /> */} 
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Center Panel: Canvas (Now Left) */}
        <div ref={containerRef} className="w-2/3 bg-gray-800/30 rounded-lg overflow-hidden border border-border/50 relative flex flex-col"> {/* Added flex flex-col */}
          {/* Add Title */}
          <h2 className="text-xl font-semibold text-center py-2 text-gray-300 bg-gray-900/50 flex-shrink-0"> {/* Adjusted styling */}
            Shape Doctor
          </h2>
          <div className="flex-grow relative"> {/* New wrapper for canvas and overlay */}
            {/* Progress Overlay */}
            {isSolving && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 text-white">
                {currentSolver === 'exact' ? (
                  <>
                    <p className="text-xl font-semibold mb-2">Finding Exact Tilings...</p>
                    <div className="w-3/4 h-4 bg-gray-600 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${formattedProgress}` }}
                      ></div>
                    </div>
                    <p className="text-sm">
                      {formattedProgress} 
                      ({combinationsChecked.toLocaleString()} /
                      {totalCombinations !== null && totalCombinations > 0
                        ? totalCombinations.toLocaleString()
                        : (isSolving ? 'calculating...' : '0')}
                      combinations)
                    </p>
                  </>
                ) : currentSolver === 'maximal' ? (
                  <>
                    <p className="text-xl font-semibold mb-2">Searching Maximal Placement...</p>
                    <div className="w-3/4 h-4 bg-gray-600 rounded-full overflow-hidden mb-1">
                       <div
                         className="h-full bg-purple-500 transition-all duration-100 ease-linear" // Changed color, faster transition
                         style={{ width: `${formattedProgress}` }} // Use the same formattedProgress state
                       ></div>
                     </div>
                     <p className="text-sm mb-2">
                         {formattedProgress} ({completedBacktrackingTasks} / {activeWorkerPromisesRef.current?.length ?? 0} tasks completed)
                     </p>
                    <p className="text-sm mb-2">
                        {solverStatusMessage ?? 'Exploring possibilities...'}
                    </p>
                  </>
                ) : ( 
                     <>
                       <p className="text-xl font-semibold mb-2">Solver Idle</p>
                     </>
                 ) 
                 } 
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelSolve}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
                >
                  <Ban className="h-4 w-4 mr-1" /> Cancel Search
                </Button>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
          </div>
        </div>

        {/* Right Sidebar: Controls, Status, Shapes */}
        <div className="flex flex-col flex-grow flex-shrink-0 gap-4 overflow-y-auto border border-border/50 rounded-lg p-2 bg-gray-800/30">
          {/* Controls */}
          <ControlPanel
            isSolving={isSolving}
            handleSolve={handleUnifiedSolve}
            handleSavePotential={handleSavePotential}
            handleClearSelection={handleClearSelection}
            handleResetAll={handleResetSelection}
            selectedTilesCount={selectedTiles.size}
            currentSolutionIndex={currentSolver === 'exact' ? currentExactTilingIndex : currentSolutionIndex}
            solutionsList={currentSolver === 'exact' ? exactTilingSolutions : bestSolutions}
            selectedTiles={selectedTiles}
            handlePrevSolution={handlePreviousSolution}
            handleNextSolution={handleNextSolution}
            handleBackToEdit={() => {
                setCurrentSolutionIndex(-1);
                setCurrentExactTilingIndex(-1);
                setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
            }}
            potentialsCount={potentials.length}
            currentSolver={currentSolver}
            handleCancelSolve={handleCancelSolve}
            solveProgress={solveProgress}
          />
          {/* Status */}
          <StatusPanel
            solutionsList={currentSolver === 'exact' ? exactTilingSolutions : bestSolutions}
            currentSolutionIndex={currentSolver === 'exact' ? currentExactTilingIndex : currentSolutionIndex}
            isSolving={isSolving}
            lockedTilesCount={countSetBits(lockedTilesMask)}
            availableTiles={Config.TOTAL_TILES - countSetBits(lockedTilesMask)}
            currentSolver={currentSolver}
            solverError={solverError}
            solveProgress={solveProgress}
            totalCombinations={totalCombinations ?? 0}
            combinationsChecked={combinationsChecked}
            isExactTilingMode={currentSolver === 'exact'}
            potentialsCount={potentials.length}
            solverStatusMessage={solverStatusMessage}
          />
          {/* Shapes Tabs (Moved from bottom) */}
          <div className="flex-grow min-h-[200px]"> {/* Ensure it takes remaining space */}
            <ResultsTabs
              isClient={isClient}
              potentials={potentials}
              isSolving={isSolving}
              setPredefinedCanvasRef={setPredefinedCanvasRef}
              setPotentialCanvasRef={setPotentialCanvasRef}
              handleAddPredefinedPotential={handleAddPredefinedPotential}
              handleDeletePotential={handleDeletePotential}
            />
          </div>
        </div>
      </div>

      {/* Wrap the entire section in an Accordion */}
      <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto mt-8 mb-16 px-4 md:px-8">
        <AccordionItem value="how-to-faq" className="border rounded-lg bg-card">
          <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:no-underline">
            How to Use & FAQ
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-0 pb-6">
            {/* Existing Section Content (h2 removed, grid moved inside) */}
            <Separator className="mb-6 mt-2" /> {/* Add separator inside content */}
            <div className="grid md:grid-cols-2 gap-8">

              {/* How to Use Section - Direct List */}
              <div className="text-card-foreground"> {/* Removed card bg/border */}
                <h3 className="text-lg font-medium mb-3">How to Use</h3> {/* Adjusted heading size/margin */}
                <ul className="list-disc list-inside space-y-1.5 text-sm"> {/* Adjusted spacing */}
                  <li>Click tiles to select up to 4 connected hexes.</li>
                  <li>Click lockable tiles (purple outline) to lock/unlock.</li>
                  <li>Click "Save (x/4)" to save selection to "Saved Potentials".</li>
                  <li>Or, add from "Predefined Shapes".</li>
                  <li>Click "Solve" to find placements.</li>
                  <li>Use Next/Prev to view solutions.</li>
                  <li>Click "Back to Edit" to clear the solution view.</li>
                  <li>Click "Reset All" to clear everything.</li>
                  <li>Wheel=Zoom, Drag=Pan grid.</li>
                </ul>
              </div>

              {/* FAQ Section - Single Accordion */}
              <div className="text-card-foreground"> {/* Removed card bg/border */}
                <h3 className="text-lg font-medium mb-3">FAQ</h3> {/* Adjusted heading size/margin */}
                <Accordion type="single" collapsible className="w-full"> {/* Single, collapsible accordion */}
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Why is the solver sometimes slow?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      Finding the best arrangement of shapes (especially Maximal Placement) is a complex problem (NP-hard). While optimized and parallelized, very complex inputs or large numbers of shapes can still take time. The Exact Tiling mode is generally faster if a perfect fit exists for the required number of shapes.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>What does 'Maximal Placement' mean?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      This mode finds the largest possible number of your selected shapes that can fit onto the available (unlocked) grid tiles simultaneously, without overlapping. It doesn't necessarily fill the entire board.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>What does 'Exact Tiling' mean?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      This mode attempts to find if a specific number of shapes (`k = Available Tiles / 4`) can perfectly cover *all* the available grid tiles without any gaps or overlaps. It only runs if the number of available tiles is divisible by 4. If it fails, it automatically falls back to Maximal Placement.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I use shapes with fewer than 4 tiles?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      No, the current solver and grid logic are designed specifically for 4-tile shapes (tetrominoes/tetriamonds on a hex grid).
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Why can I only lock certain tiles?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      Currently, only a predefined set of tiles are designated as lockable to provide specific challenge scenarios while maintaining puzzle integrity. This might be expanded in the future.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}

