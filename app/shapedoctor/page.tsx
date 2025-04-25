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

// Import the new components
import ShapeCanvas from "./components/ShapeCanvas";
import ControlPanel from "./components/ControlPanel";
import StatusPanel from "./components/StatusPanel";
import ResultsTabs from "./components/ResultsTabs";

// Import workerpool
import workerpool from 'workerpool';

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
  const [totalCombinations, setTotalCombinations] = useState<number | null>(null); // <--- MODIFIED TYPE
  const [combinationsChecked, setCombinationsChecked] = useState<number>(0); // For progress display
  const [solverStatusMessage, setSolverStatusMessage] = useState<string | null>(null);

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
    console.log(`[Main Thread] handleWorkerMessage triggered. Type: ${message.type}`);
    // console.log(`[Main Thread] currentSolver state inside handleWorkerMessage: ${currentSolver}`); // No longer need component state here

    switch (message.type) {
      case 'PARALLEL_PROGRESS':
        // Update progress based on batches checked
        const checkedInBatch = message.payload.checked ?? 0; 
        
        // ONLY update the raw count here
        setCombinationsChecked(prev => prev + checkedInBatch);
        break;

      case 'PARALLEL_RESULT':
        // Handle solutions found by a worker
        const resultPayload = message.payload; // Payload can be SolutionRecord | SolutionRecord[] | null
        const solverType = message.originatingSolverType; // <-- Use type from message
        console.log(`[Main Thread] Processing PARALLEL_RESULT from originating solver: ${solverType}`); // Log originating type
        
        if (resultPayload) {
            if (solverType === 'exact') { // <-- Check message type
                // Exact tiling sends single solutions (should not be an array)
                if (!Array.isArray(resultPayload)) { 
                    const solution = resultPayload as SolutionRecord; // Safe assertion now
                    console.log(`[Main Thread] Exact Tiling SOLUTION FOUND by worker:`, solution);
                    if (!anyExactSolutionFound.current) {
                       anyExactSolutionFound.current = true;
                       console.log("Setting anyExactSolutionFound to true");
                       updateGridStateFromSolution(solution);
                    }
                    setExactTilingSolutions(prev => [...prev, solution]);
                    if (exactTilingSolutions.length === 0) { 
                       setCurrentExactTilingIndex(0); 
                    }
                    toast.success("Exact tiling solution found!");
                } else {
                    console.error("[Main Thread] Received ARRAY payload for Exact Tiling result. Expected single object.", resultPayload);
                }
            } else if (solverType === 'maximal') { // <-- Check message type
                 // Backtracking sends an array of solutions (or null)
                 if (Array.isArray(resultPayload)) { // Check if it's an array
                     const solutions = resultPayload as SolutionRecord[]; // Safe assertion now
                     console.log(`[Main Thread] Backtracking SOLUTIONS FOUND by worker (count: ${solutions.length})`);
                     if (solutions.length > 0) {
                        setBestSolutions(solutions);
                        setCurrentSolutionIndex(0);
                        toast.success(`Maximal placement found (${solutions[0].maxShapes} shapes)! Found ${solutions.length} layouts.`);
                        updateGridStateFromSolution(solutions[0]); 
                     }
                 } else {
                    console.error("[Main Thread] Received NON-ARRAY payload for Maximal Placement result. Expected array.", resultPayload);
                 }
            }
        } else {
           // Null payload handling (e.g., backtracking found k=0)
           console.log(`[Main Thread] Received null result payload (solver: ${solverType}).`);
           if (solverType === 'maximal') {
               toast.info("Backtracking finished: No placements possible.");
               setBestSolutions([]); // Clear previous solutions
               setCurrentSolutionIndex(-1);
           }
           // Handle null for exact if needed, though current worker impl sends empty array
        }
        break;

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
      case 'BACKTRACKING_PROGRESS':
        const { iterations, currentMaxK } = message.payload;
        // Update UI state for progress display (e.g., a status message)
        setSolverStatusMessage(`Searching... Iteration: ${iterations.toLocaleString()}, Max K Found: ${currentMaxK}`);
        break;

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
      setSolverStatusMessage
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

  // Helper to dispatch a batch
  const dispatchBatch = useCallback(( // Use useCallback
      batchCombinations: string[][],
      kValue: number,
      context: SolverTaskContext, // Pass the actual context object
      promisesArray: workerpool.Promise<any>[]
  ) => {
      if (!workerPoolRef.current || batchCombinations.length === 0) return;

      const batchPayload: DLXBatchPayload = {
          combinations: batchCombinations,
          kValue: kValue,
          context: context, // Pass context directly
          originatingSolverType: 'exact' // Add type
      };

      try {
          const promise = workerPoolRef.current.exec('processParallelTask', [
              { type: 'DLX_BATCH', data: batchPayload } as WorkerTaskPayload
          ], {
              on: handleWorkerMessage // Use the memoized handler directly
          });
          promisesArray.push(promise);
      } catch (execError) {
          console.error("Error dispatching worker batch:", execError);
          if (!solverError) { // Check solverError state
              setSolverError("Failed to dispatch solver task.");
              toast.error("Failed to dispatch solver task.");
          }
      }
  }, [handleWorkerMessage, solverError]); // Add dependencies

  // Function to handle parallel exact tiling
  const runParallelExactTiling = useCallback(async ( // Use useCallback
      potentialsToUse: PotentialShape[],
      kValue: number,
      initialGridState: bigint,
      lockedTilesMask: bigint,
      shapeDataMap: ShapeDataMap
  ) => {
      if (!workerPoolRef.current) return;

      const nValue = potentialsToUse.length;
      let totalCombs = 0;
      try {
        totalCombs = calculateTotalCombinations(nValue, kValue);
        console.log(`Total combinations C(${nValue}, ${kValue}) = ${totalCombs}`);
         if (totalCombs > 10_000_000) { 
             toast.error(`Too many combinations (${totalCombs}).`);
             setSolverError(`Aborted: Too many combinations C(${nValue}, ${kValue})`);
             setIsSolving(false);
             return;
         }
        setTotalCombinations(totalCombs);
      } catch (e) { /* ... error handling ... */ return; }
      
      anyExactSolutionFound.current = false;

      const potentialIds = potentialsToUse.map(p => p.id);
      const combinationGenerator = combinations(potentialIds, kValue);
      const BATCH_SIZE = determineDynamicBatchSize(totalCombs || 0);
      let batch: string[][] = [];
      const allPromises: workerpool.Promise<any>[] = [];
      let dispatchedCount = 0;

      const context: SolverTaskContext = {
          lockedTilesMask,
          initialGridState,
          shapeDataMap,
          potentials: potentialsToUse
      };

      for (const combination of combinationGenerator) {
          if (anyExactSolutionFound.current) break;
          batch.push(combination);
          if (batch.length >= BATCH_SIZE) {
              dispatchedCount += batch.length;
              dispatchBatch(batch, kValue, context, allPromises);
              batch = [];
              await new Promise(resolve => setTimeout(resolve, 0));
          }
      }
      if (batch.length > 0) {
          dispatchedCount += batch.length;
          dispatchBatch(batch, kValue, context, allPromises);
      }
      console.log(`Dispatched ${dispatchedCount} combinations in ${allPromises.length} batches.`);
      activeWorkerPromisesRef.current = allPromises;

      try {
          await Promise.allSettled(allPromises);
          console.log("All DLX worker promises settled.");
      } catch (error) { /* ... error handling ... */ }
       finally {
           activeWorkerPromisesRef.current = [];
       }
  }, [dispatchBatch, determineDynamicBatchSize, solverError]); // Add dependencies

  // Function to handle parallel Maximal Placement (Backtracking) - Modified for Sequential Test
  const runParallelMaximalPlacement = useCallback(async (
    potentialsToUse: PotentialShape[],
    initialGridState: bigint,
    lockedTilesMask: bigint,
    shapeDataMap: ShapeDataMap | null // Changed from Optional to Required for context
  ) => {
    if (!workerPoolRef.current || !shapeDataMap) {
        toast.error("Worker pool or shape data not ready for backtracking.");
        console.error("Worker pool or shape data map is missing for backtracking.");
        setIsSolving(false); // Ensure solving state is reset
        return;
    }

    console.log("[runParallelMaximalPlacement] Dispatching SINGLE sequential backtracking task...");
    setCurrentSolver('maximal'); // Ensure solver state is set

    // Construct the context needed by the worker task
    const context: SolverTaskContext = {
        shapeDataMap: shapeDataMap, // Use the provided map
        initialGridState: initialGridState,
        lockedTilesMask: lockedTilesMask,
        potentials: potentialsToUse // Pass the potentials directly
    };

    // Construct the payload for the single branch (representing the whole search space)
    const branchPayload: BacktrackingBranchPayload = {
        startPlacements: [], // Empty start placements for a full sequential run
        context: context,
        originatingSolverType: 'maximal' // Add type
    };

    // Create the task payload
    const taskPayload: WorkerTaskPayload = {
        type: 'BACKTRACKING_BRANCH',
        data: branchPayload
    };

    // Clear previous promises and execute the single task
    activeWorkerPromisesRef.current.forEach(p => p.cancel());
    activeWorkerPromisesRef.current = [];

    try {
        const promise = workerPoolRef.current.exec('processParallelTask', [taskPayload], {
            on: handleWorkerMessage // Use the same handler for results/errors/progress
        });
        activeWorkerPromisesRef.current.push(promise);

        // Wait for this single promise to settle
        await Promise.allSettled([promise]);
        console.log("Backtracking worker promise settled.");

    } catch (execError) {
        console.error("Error dispatching worker task for backtracking:", execError);
        if (!solverError) { // Access solverError state via its state variable
            setSolverError("Failed to dispatch backtracking task.");
            toast.error("Failed to dispatch backtracking task.");
        }
    } finally {
        // Resetting isSolving is handled in handleUnifiedSolve's finally block
        activeWorkerPromisesRef.current = []; // Clear promises here too
    }

  }, [handleWorkerMessage, solverError]); // Added handleWorkerMessage and solverError dependencies

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
        if (attemptExactTiling) {
            setCurrentSolver('exact');
            toast.info(`Attempting Exact Tiling with k=${k} shapes...`);
            if (shapeDataMapRef.current) {
                await runParallelExactTiling(validPotentials, k, initialGridState, currentLockedMask, shapeDataMapRef.current);
            } else {
                 throw new Error("Shape data map was not initialized correctly.");
             }

             if (!anyExactSolutionFound.current) {
                 console.log("Exact Tiling finished, no solution found. Falling back to Maximal Placement.");
                 toast.info("Exact tiling not found. Trying Maximal Placement...");
                 setCurrentSolver('maximal');
                 if (shapeDataMapRef.current) { 
                    await runParallelMaximalPlacement(validPotentials, initialGridState, currentLockedMask, shapeDataMapRef.current);
                 } else {
                     throw new Error("Shape data map was not available for fallback.");
                 }
             } else {
                 console.log("Exact Tiling finished, solution was found.");
                 toast.success("Exact Tiling solution found!");
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
        <div ref={containerRef} className="w-2/3 bg-gray-800/30 rounded-lg overflow-hidden border border-border/50 relative">
          {/* Progress Overlay */}
          {isSolving && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 text-white">
              {currentSolver === 'exact' ? (
                <>
                  <p className="text-xl font-semibold mb-2">Finding Exact Tilings...</p>
                  <div className="w-3/4 h-4 bg-gray-600 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${formattedProgress}` }} // Use formattedProgress state
                    ></div>
                  </div>
                  <p className="text-sm">
                    {formattedProgress} {/* Use formattedProgress state */}
                    ({combinationsChecked.toLocaleString()} /
                    {totalCombinations !== null && totalCombinations > 0
                      ? totalCombinations.toLocaleString()
                      : (isSolving ? 'calculating...' : '0')}
                    combinations)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-semibold mb-2">Searching Maximal Placement...</p>
                  {/* Display the status message from state if available, else generic text */}
                  <p className="text-sm mb-2">
                      {solverStatusMessage ?? 'Exploring possibilities...'}
                  </p>
                  {/* No progress bar for backtracking */}
                </>
              )}
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
    </main>
  );
}

