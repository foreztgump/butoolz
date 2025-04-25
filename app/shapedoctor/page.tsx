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
    type ShapeData
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
    getCanonicalShape
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
  // Ref for workerpool instance - Use any temporarily
  const workerPoolRef = useRef<any | null>(null); // Changed type to any
  const currentTaskPromiseRef = useRef<workerpool.Promise<any> | null>(null); // Ref for cancellation

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
  const [totalCombinations, setTotalCombinations] = useState<number>(0); // For progress display
  const [combinationsChecked, setCombinationsChecked] = useState<number>(0); // For progress display

  const formattedProgress = `${Math.round(solveProgress)}%`;

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
    console.log("[updateGridStateFromSolution] Updating grid for solution:", solution);
    const newGrid = Array(Config.TOTAL_TILES + 1).fill(-1);
    const numColors = Config.HEX_COLORS.length;

    if (solution.placements) {
      solution.placements.forEach((placement, shapeIndex) => {
        const mask = placement.placementMask;
        const currentShapeTiles = typeof mask === 'bigint' ? bitmaskToTileIds(mask) : [];

        if (currentShapeTiles.length === 0) return; // Skip empty shapes

        // Log details for EACH placement mask
        console.log(`  Processing Placement ${shapeIndex}: ShapeId=${placement.shapeId}, Mask=${mask?.toString()}, Tiles=[${currentShapeTiles.join(',')}] (Count: ${currentShapeTiles.length})`);
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

  // Function to run the Maximal Placement solver
  const runMaximalPlacementSolver = async (potentialsToSolve: string[], currentLockedMask: bigint) => {
    console.log("[runMaximalPlacementSolver] Initiating Maximal Placement (Backtracking)...");
    setCurrentSolver('maximal');
    setBestSolutions([]); // Clear previous maximal solutions
    setCurrentSolutionIndex(-1);
    
    if (!workerPoolRef.current) {
      toast.error("Worker pool not available for Maximal Placement.");
      setIsSolving(false);
      return;
    }

    // Prepare data for the backtracking worker
    const shapesToPlaceInput = potentialsToSolve.map(p => { 
        const originalString = p; // Use the potential string directly
        // Construct the ID format the worker expects ('identifier::originalString')
        // Using original string itself as the identifier part is fine as worker splits it.
        return { id: `original::${originalString}` }; 
    });
    
    const taskData: SolverExecDataBacktracking = {
        shapesToPlace: shapesToPlaceInput,
        lockedTilesMask: currentLockedMask.toString(), // Send as string
        // initialGridState can be added if needed, defaults to 0n in worker
    };

    try {
        console.log("[runMaximalPlacementSolver] Executing worker...");
        const result: SolverResultPayloadBacktracking = await workerPoolRef.current.exec(
            'runMaximalPlacementBacktracking', 
            [taskData],
            {
                on: (payload: any) => {
                    console.log("[Maximal Placement] Received update from worker:", payload);
                    
                    if (payload && payload.event === 'solutionUpdate' && payload.data && payload.data.solution && typeof payload.data.maxShapes === 'number') {
                        const data = payload.data;
                         // Since updates might come frequently, only update if maxShapes improved or is the first one
                         setBestSolutions(prevSolutions => {
                             // Check if the new solution offers a better or equal maxK
                             const currentMaxK = prevSolutions[0]?.placements.length ?? 0;
                             if (data.maxShapes >= currentMaxK) {
                                 // Replace existing solutions if the new one is strictly better,
                                 // or add if it's the first or equal to the best
                                 const newSolutions = data.maxShapes > currentMaxK ? [data.solution] : [...prevSolutions, data.solution];
                                 // Deduplicate solutions based on gridState (optional, but good practice)
                                 const uniqueSolutionsMap = new Map<string, SolutionRecord>();
                                 newSolutions.forEach(sol => uniqueSolutionsMap.set(sol.gridState.toString(), sol));
                                 const uniqueSolutions = Array.from(uniqueSolutionsMap.values());
                                 
                                 // Sort solutions (e.g., by gridState or keep worker order)
                                 // For simplicity, let's just keep the unique ones for now.
                                 setCurrentSolutionIndex(0); // Show the first best solution
                                 return uniqueSolutions;
                             }
                             return prevSolutions; // Keep old solutions if new one isn't better
                         });
                     } else if (payload && payload.event === 'progressUpdate' && payload.data && typeof payload.data.progress === 'number') {
                        // Optional: Handle progress updates if the worker sends them
                        setSolveProgress(payload.data.progress);
                    }
                     else {
                        // Add more detailed logging to see the actual data structure
                        if (payload && payload.event === 'solutionUpdate') {
                            console.warn(`[Maximal Placement] Received 'solutionUpdate' but format is wrong. Data:`, payload.data);
                        } else if (payload && payload.event === 'progressUpdate') {
                            console.warn(`[Maximal Placement] Received 'progressUpdate' but format is wrong. Data:`, payload.data);
                        } else {
                            console.warn("[Maximal Placement] Received completely unexpected payload format from worker:", payload);
                        }
                     }
                }
            }
        );
        console.log("[runMaximalPlacementSolver] Worker finished.", result);

        if (result.error) {
            throw new Error(result.error);
        }

        // Final update with potentially more solutions found at the end
        if (result.solutions && result.solutions.length > 0) {
             // Deduplicate solutions based on gridState
            const finalUniqueSolutionsMap = new Map<string, SolutionRecord>();
            result.solutions.forEach((sol: SolutionRecord) => finalUniqueSolutionsMap.set(sol.gridState.toString(), sol)); // Add type to sol
            const finalUniqueSolutions = Array.from(finalUniqueSolutionsMap.values());

            setBestSolutions(finalUniqueSolutions);
            setCurrentSolutionIndex(0); // Start viewing from the first solution
            toast.success(`Maximal Placement found ${result.maxShapes} shape(s) in ${finalUniqueSolutions.length} configuration(s).`);
            if(finalUniqueSolutions.length > 0){
              updateGridStateFromSolution(finalUniqueSolutions[0]); // Show first solution
            }
        } else {
            setBestSolutions([]);
            setCurrentSolutionIndex(-1);
            toast.info("Maximal Placement: No solution found.");
        }

    } catch (err: any) {
        console.error("[runMaximalPlacementSolver] Error:", err);
        setSolverError(`Maximal Placement Error: ${err.message}`);
        toast.error(`Maximal Placement failed: ${err.message}`);
        setBestSolutions([]);
        setCurrentSolutionIndex(-1);
    } finally {
        setIsSolving(false);
    }
  };

  // Updated Solver Logic
  const handleUnifiedSolve = async () => {
    console.log("[handleUnifiedSolve] Initiating solve...");
    // Reset states
    setSolverError(null); 
    setIsSolving(true); 
    setCurrentSolver(null); 
    setBestSolutions([]); 
    setCurrentSolutionIndex(-1);
    setExactTilingSolutions([]);
    setCurrentExactTilingIndex(-1);
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); 
    setSolveProgress(0); // Reset progress

    if (!workerPoolRef.current) {
      toast.error("Worker pool not initialized.");
      setIsSolving(false);
      return;
    }
    
    // Filter valid potentials (length and 4 tiles)
    const validLengthPotentials = potentials.filter(p => typeof p === 'string' && p.length === Config.TOTAL_TILES);
    const validFourTilePotentials = validLengthPotentials.filter(p => countSetBitsFromString(p) === 4);
    const potentialsToSolve = validFourTilePotentials;
    const lengthExcludedCount = potentials.length - validLengthPotentials.length;
    const tileCountExcludedCount = validLengthPotentials.length - validFourTilePotentials.length;
    if (lengthExcludedCount > 0) toast.warning(`Excluded ${lengthExcludedCount} potential(s) due to incorrect length.`);
    if (tileCountExcludedCount > 0) toast.warning(`Excluded ${tileCountExcludedCount} potential(s) without exactly 4 tiles.`);

    if (potentialsToSolve.length === 0) {
      toast.error("No valid 4-tile potential shapes to solve with.");
        setIsSolving(false);
        return;
    }

    // Calculate needed values
    const currentLockedMask = lockedTilesMask;
    const availableTileCount = Config.TOTAL_TILES - countSetBits(currentLockedMask);
    const numSelectedShapes = potentialsToSolve.length;
    const k = (availableTileCount > 0 && availableTileCount % 4 === 0) ? availableTileCount / 4 : 0;

    console.log(`[handleUnifiedSolve] Available Tiles: ${availableTileCount}, Selected Shapes: ${numSelectedShapes}, Required for Exact (k): ${k}`);

    // Determine if Exact Tiling should be attempted
    const attemptExactTiling = k > 0 && numSelectedShapes >= k;

    if (attemptExactTiling) {
      console.log("[handleUnifiedSolve] Attempting Exact Tiling (Subset Search)...");
        setCurrentSolver('exact'); 
      
      const potentialDataForWorker = potentialsToSolve.map(p => { 
          const originalString = p; // Use the potential string directly
          // Construct the ID format the worker expects ('identifier::originalString')
          const uniqueId = `original::${originalString}`;
          return { uniqueId: uniqueId, baseMaskString: originalString }; 
      });

      const taskData: SolverExecDataExactTiling = {
          allPotentialsData: potentialDataForWorker,
          lockedTilesMask: currentLockedMask.toString(),
          // initialGridState optional
      };

      try {
        if (currentTaskPromiseRef.current) { // Cancel any previous task
            try { currentTaskPromiseRef.current.cancel(); } catch (e) { console.warn("Error cancelling previous task:", e); }
            currentTaskPromiseRef.current = null;
        }

        currentTaskPromiseRef.current = workerPoolRef.current.exec(
            'runCombinatorialExactTiling', 
            [taskData],
            { 
                on: (payload: any) => {
                    console.log("[Exact Tiling] Received update from worker:", payload);
                     if (payload && payload.event === 'solutionUpdate' && payload.data && payload.data.solution) {
                         // Maybe add a toast notification?
                         // toast.info(`Found an Exact Tiling solution! (${exactTilingSolutions.length + 1} total)`);
                     } else if (payload && payload.event === 'progressUpdate' && payload.data) {
                         // Ensure progress is between 0 and 100
                         const progress = Math.max(0, Math.min(100, payload.data.progress ?? 0));
                         setSolveProgress(progress);
                         setCombinationsChecked(payload.data.currentCount ?? 0);
                         setTotalCombinations(payload.data.totalCount ?? 0);
                     } else {
                         // Add more detailed logging to see the actual data structure
                         if (payload && payload.event === 'solutionUpdate') {
                             console.warn(`[Exact Tiling] Received 'solutionUpdate' but format is wrong. Data:`, payload.data);
                         } else if (payload && payload.event === 'progressUpdate') {
                             console.warn(`[Exact Tiling] Received 'progressUpdate' but format is wrong. Data:`, payload.data);
                         } else {
                             console.warn("[Exact Tiling] Received completely unexpected payload format from worker:", payload);
                         }
                     }
                }
            }
        );

        // Wait for the promise to resolve or reject
        const result = await currentTaskPromiseRef.current; 
        console.log("[handleUnifiedSolve] Exact Tiling task finished.", result);

        if (result.status === 'completed') {
            if (result.solutions && result.solutions.length > 0) {
                // Exact Tiling Success!
                const uniqueSolutionsMap = new Map<string, SolutionRecord>();
                result.solutions.forEach((sol: SolutionRecord) => uniqueSolutionsMap.set(sol.gridState.toString(), sol)); // Add type to sol
                const uniqueSolutions = Array.from(uniqueSolutionsMap.values());

                setExactTilingSolutions(uniqueSolutions);
                setCurrentExactTilingIndex(0);
                setIsSolving(false);
                setCurrentSolver('exact'); // Confirm solver mode
                toast.success(`Exact Tiling found ${k} shape(s) in ${uniqueSolutions.length} configuration(s).`);
                 if(uniqueSolutions.length > 0){
                   updateGridStateFromSolution(uniqueSolutions[0]); // Show first solution
                 }
            } else {
                // Exact Tiling found no solution, proceed to fallback
                console.log("[handleUnifiedSolve] Exact Tiling found no subset solution. Falling back to Maximal Placement.");
                toast.info("Exact Tiling did not find a perfect fit. Trying Maximal Placement...");
                await runMaximalPlacementSolver(potentialsToSolve, currentLockedMask); // Await the fallback
            }
        } else if (result.status === 'cancelled') {
            console.log("[handleUnifiedSolve] Exact Tiling task explicitly cancelled.");
            toast.info("Exact Tiling Cancelled.");
            setSolverError("Exact Tiling Cancelled.");
        } else {
            throw new Error(result.error || 'Unknown worker error during exact tiling.');
        }
        currentTaskPromiseRef.current = null; // Clear ref after completion/error/cancellation

      } catch (err: any) { 
        currentTaskPromiseRef.current = null; // Clear ref on error too
        if (err instanceof workerpool.Promise.CancellationError) {
            console.log("[handleUnifiedSolve] Exact Tiling task explicitly cancelled.");
            toast.info("Exact Tiling Cancelled.");
            setSolverError("Exact Tiling Cancelled.");
        } else {
            console.error("[handleUnifiedSolve] Error during Exact Tiling execution:", err);
            setSolverError(`Exact Tiling Error: ${err.message}. Trying Maximal Placement...`);
            toast.error(`Exact Tiling failed: ${err.message}. Trying Maximal Placement...`);
            // Fallback even on error
            await runMaximalPlacementSolver(potentialsToSolve, currentLockedMask);
        }
      }

                    } else {
      // Conditions for Exact Tiling not met, go directly to Maximal Placement
      console.log("[handleUnifiedSolve] Conditions not met for Exact Tiling. Running Maximal Placement directly.");
      await runMaximalPlacementSolver(potentialsToSolve, currentLockedMask);
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
      updateGridStateFromSolution(bestSolutions[currentSolutionIndex]);
    } else if (currentExactTilingIndex >= 0 && exactTilingSolutions[currentExactTilingIndex]) {
      updateGridStateFromSolution(exactTilingSolutions[currentExactTilingIndex]);
    } else if (!isSolving) {
      // Reset grid if no solution is selected and not solving
      // setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); // Avoid resetting if user is interacting
    }
  }, [currentSolutionIndex, bestSolutions, currentExactTilingIndex, exactTilingSolutions, isSolving]); // Removed updateGridStateFromSolution dependency

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
    
    // Calculate hex under cursor using correct sequence
    let hex: HexCoord | null = null;
    const worldPos = HexUtils.screenToWorld(screenX, screenY, canvas.width, canvas.height, currentOffsetRef.current, zoom);
    if (worldPos) {
        const axial = HexUtils.pixelToAxial(worldPos.x, worldPos.y);
        if (axial) {
            const rounded = HexUtils.hexRound(axial.q, axial.r);
            if (rounded) {
                hex = HexUtils.findHexByCoords(rounded.q, rounded.r) || null;
            }
        }
    }
    hoveredHexIdRef.current = hex ? hex.id : null;

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
    if (!canvas || isDragging) return; // Ignore clicks during drag

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Calculate hex under cursor using correct sequence
    let hex: HexCoord | null = null;
    const worldPos = HexUtils.screenToWorld(screenX, screenY, canvas.width, canvas.height, currentOffsetRef.current, zoom);
    if (worldPos) {
        const axial = HexUtils.pixelToAxial(worldPos.x, worldPos.y);
        if (axial) {
            const rounded = HexUtils.hexRound(axial.q, axial.r);
            if (rounded) {
                hex = HexUtils.findHexByCoords(rounded.q, rounded.r) || null;
            }
        }
    }

    if (hex && hex.id > 0 && hex.id <= Config.TOTAL_TILES) {
        if (LOCKABLE_TILE_IDS.has(hex.id)) {
            handleToggleTileLock(hex.id); // Use the dedicated handler (defined earlier)
        } else {
            if (isTileLocked(lockedTilesMask, hex.id)) {
                 toast.warning("Cannot select a locked tile.");
                 return;
             }
            setSelectedTiles((prev) => {
                const newSelection = new Set(prev);
                if (newSelection.has(hex.id)) {
                    newSelection.delete(hex.id);
      } else {
                    if (newSelection.size < 4) { 
                        newSelection.add(hex.id);
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
    handleToggleTileLock, // Dependency is now defined before usage 
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
    if (currentTaskPromiseRef.current) {
      try {
        currentTaskPromiseRef.current.cancel();
        console.log("Solver task cancellation requested.");
        toast.info("Solver task cancellation requested.");
        // Note: Worker needs to handle cancellation internally to actually stop.
        // State like isSolving will be reset when the promise rejects/resolves after cancellation.
      } catch (e) {
        console.error("Error trying to cancel task:", e);
        toast.error("Error trying to cancel solver task.");
      }
    } else {
      console.warn("Attempted to cancel, but no task promise found.");
      // Maybe reset isSolving state here just in case?
      // setIsSolving(false);
    }
  }, []); // No dependencies needed if only interacting with ref

  // --- Rendering ---
  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 overflow-hidden relative p-4 gap-4">
      {/* <CookieConsentBanner /> */} 
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Center Panel: Canvas (Now Left) */}
        <div ref={containerRef} className="w-2/3 bg-gray-800/30 rounded-lg overflow-hidden border border-border/50 relative">
          {/* Progress Overlay */} 
          {isSolving && currentSolver === 'exact' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 text-white">
                  <p className="text-xl font-semibold mb-2">Finding Exact Tilings...</p>
                  <div className="w-3/4 h-4 bg-gray-600 rounded-full overflow-hidden mb-1">
                     <div 
                         className="h-full bg-blue-500 transition-all duration-300 ease-out"
                         style={{ width: `${solveProgress}%` }}
                     ></div>
                  </div>
                  <p className="text-sm">{solveProgress}% ({combinationsChecked.toLocaleString()} / {totalCombinations > 0 ? totalCombinations.toLocaleString() : 'calculating...'} combinations)</p>
                  <Button variant="destructive" size="sm" onClick={handleUnifiedSolve} className="mt-4">
                      Cancel Search
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
            totalCombinations={totalCombinations}
            combinationsChecked={combinationsChecked}
            isExactTilingMode={currentSolver === 'exact'}
            potentialsCount={potentials.length}
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

