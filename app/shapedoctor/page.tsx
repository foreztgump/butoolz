"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
    isTileLocked
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

  // --- Solver Logic ---
  const handleUnifiedSolve = async () => {
    console.log("[handleUnifiedSolve] Initiating solve...");
    setSolverError(null); 
    setIsSolving(true); 
    setCurrentSolver(null); 
    setBestSolutions([]); 
    setCurrentSolutionIndex(-1);
    setExactTilingSolutions([]);
    setCurrentExactTilingIndex(-1);
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); 

    if (!workerPoolRef.current) {
      toast.error("Worker pool not initialized.");
      setIsSolving(false);
      return;
    }
    
    // Filter potentials first by LENGTH
    const validLengthPotentials = potentials.filter(p => {
        if (typeof p !== 'string' || p.length !== Config.TOTAL_TILES) {
             console.warn(`[handleUnifiedSolve] Filtering out potential with invalid length ${p?.length ?? 'undefined'}: ${p?.substring(0, 20)}...`);
             return false;
        }
        return true;
    });

    // Filter potentials AGAIN by TILE COUNT (must be 4)
    const validFourTilePotentials = validLengthPotentials.filter(p => {
        const tileCount = countSetBitsFromString(p);
        if (tileCount !== 4) {
             console.warn(`[handleUnifiedSolve] Filtering out potential with invalid tile count (${tileCount}): ${p.substring(0,20)}...`);
             return false;
        }
        return true;
    });

    // Report filtering actions
    const lengthExcludedCount = potentials.length - validLengthPotentials.length;
    const tileCountExcludedCount = validLengthPotentials.length - validFourTilePotentials.length;
    if (lengthExcludedCount > 0) {
         toast.warning(`Excluded ${lengthExcludedCount} potential shape(s) due to incorrect length.`);
    }
     if (tileCountExcludedCount > 0) {
         toast.warning(`Excluded ${tileCountExcludedCount} potential shape(s) because they did not contain exactly 4 tiles.`);
    }

    // Use the final filtered list for solving
    const potentialsToSolve = validFourTilePotentials;

    if (potentialsToSolve.length === 0) {
         toast.error("No valid 4-tile potential shapes to solve.");
        setIsSolving(false);
        return;
    }

    // calculate availableTileCount, numSelectedShapes, numShapesNeeded using potentialsToSolve.length
    const currentLockedMask = lockedTilesMask;
    const availableTileCount = Config.TOTAL_TILES - countSetBits(currentLockedMask);
    // Use potentialsToSolve.length here
    const numSelectedShapes = potentialsToSolve.length;
    const numShapesNeeded = availableTileCount > 0 && availableTileCount % 4 === 0 
                            ? availableTileCount / 4 
                            : -1;

    console.log(`[handleUnifiedSolve] Available Tiles: ${availableTileCount}, Selected 4-Tile Shapes: ${numSelectedShapes}, Shapes Needed for Exact: ${numShapesNeeded}`); // Updated log

    const tryExactTilingFirst = 
        availableTileCount > 0 && 
        availableTileCount % 4 === 0 && 
        numShapesNeeded === numSelectedShapes;
        
    let finalResult: SolverResultPayloadBacktracking | null = null;
    let ranExactTiling = false;

    try {
      if (tryExactTilingFirst) {
        console.log(`[handleUnifiedSolve] Condition met. Attempting Exact Tiling with ${numShapesNeeded} shapes...`);
        setCurrentSolver('exact'); 
        ranExactTiling = true;
        toast.info(`Attempting Exact Tiling with ${numShapesNeeded} shapes...`); 
        
        // Use potentialsToSolve here
        const exactTilingTaskData: SolverExecDataExactTiling & { k: number; shapesToTileWith: { id: string }[] } = {
          allPotentialsData: potentialsToSolve.map((shapeString, index) => {
             const baseMask = shapeStringToBitmask(shapeString);
             const originalIndex = potentials.indexOf(shapeString); // Find original index for ID consistency
             const uniqueId = `${originalIndex >= 0 ? originalIndex : index}::${shapeString}`;
             return { uniqueId: uniqueId, baseMaskString: baseMask.toString() };
          }),
          initialGridState: "0",
          lockedTilesMask: currentLockedMask.toString(),
          k: numShapesNeeded,
          // Use potentialsToSolve here
          shapesToTileWith: potentialsToSolve.map((shapeString, index) => {
              const originalIndex = potentials.indexOf(shapeString);
              const uniqueId = `${originalIndex >= 0 ? originalIndex : index}::${shapeString}`;
              return { id: uniqueId };
          }),
        };

        // Add logging before exact tiling worker call if needed for deep debug
        // console.log("[handleUnifiedSolve] Data for Exact Tiling Worker:", JSON.stringify(exactTilingTaskData));
        try {
             finalResult = await workerPoolRef.current.exec(
          'runCombinatorialExactTiling',
          [exactTilingTaskData]
        );
             // console.log("[handleUnifiedSolve] Worker result for Exact Tiling:", finalResult);
        } catch (workerError) {
             console.error("[handleUnifiedSolve] Error EXECUTING Exact Tiling worker task:", workerError);
             setSolverError(`Worker execution error (Exact Tiling): ${workerError instanceof Error ? workerError.message : String(workerError)}`);
             finalResult = null;
        }
      }

      if (!finalResult || finalResult.maxShapes === 0) {
        if (ranExactTiling) {
            console.log("[handleUnifiedSolve] Exact Tiling returned no solution. Falling back to Maximal Placement...");
            toast.info("Exact Tiling failed, trying Maximal Placement (Backtracking)...");
        } else {
            console.log("[handleUnifiedSolve] Condition not met for Exact Tiling. Proceeding directly to Maximal Placement (Backtracking)...");
            toast.info("Attempting Maximal Placement (Backtracking)...");
        }
        setCurrentSolver('maximal'); 
        
        // Use potentialsToSolve here
        const maximalPlacementTaskData: SolverExecDataBacktracking = {
          shapesToPlace: potentialsToSolve.map((shapeString, index) => {
              const originalIndex = potentials.indexOf(shapeString);
              const uniqueId = `${originalIndex >= 0 ? originalIndex : index}::${shapeString}`;
              return { id: uniqueId };
          }),
          initialGridState: "0", 
          lockedTilesMask: currentLockedMask.toString(),
        };

        // Log Input
        console.log("[handleUnifiedSolve] Data for Maximal Placement Worker:", JSON.stringify(maximalPlacementTaskData.shapesToPlace));
        maximalPlacementTaskData.shapesToPlace.forEach(shape => {
            const tileCount = countSetBitsFromString(shape.id.split('::')[1]);
            if (tileCount !== 4) {
                console.error(`[handleUnifiedSolve] ERROR: Sending non-4-tile shape (${tileCount} tiles) to worker:`, shape.id);
            }
        });
        // ----------------------------- //

        console.log("[handleUnifiedSolve] Executing worker for runMaximalPlacementBacktracking...");
         try {
            finalResult = await workerPoolRef.current.exec(
                'runMaximalPlacementBacktracking',
                [maximalPlacementTaskData],
                {
                    on: (payload: any) => { /* ... streaming handler ... */
                        if (payload && payload.event === 'solutionUpdate' && payload.data) {
                            console.log("[handleUnifiedSolve] Received streamed solution update:", payload.data);
                            const { maxShapes, solution } = payload.data as { maxShapes: number; solution: SolutionRecord };
                            setBestSolutions([solution]);
                            setCurrentSolutionIndex(0);
                            updateGridStateFromSolution(solution); 
                            toast.info(`Solver found solution with ${maxShapes} shapes...`, { id: 'solver-progress-toast' });
                            setExactTilingSolutions([]);
                            setCurrentExactTilingIndex(-1);
                        } 
                     }
                }
            );
            
            // Log Output from Worker (with null checks)
            console.log("[handleUnifiedSolve] Worker FINAL result for Maximal Placement (Backtracking):", finalResult);
            if (finalResult && finalResult.solutions && finalResult.solutions.length > 0) {
                console.log("--- Checking Solution Placement Masks ---");
                finalResult.solutions.forEach((sol, solIndex) => {
                    console.log(`  Solution ${solIndex + 1}:`);
                    if (sol.placements) {
                        sol.placements.forEach((pl, plIndex) => {
                            const mask = pl.placementMask;
                            const tiles = typeof mask === 'bigint' ? bitmaskToTileIds(mask) : []; 
                            console.log(`    Placement ${plIndex + 1} (ShapeId: ${pl.shapeId}): Mask=${mask?.toString()}, Tiles=[${tiles.join(',')}] (Count: ${tiles.length})`);
                            if (tiles.length !== 4) {
                                console.error(`    ERROR: Placement mask resulted in ${tiles.length} tiles!`);
                            }
                        });
                    } else {
                        console.warn(`    Solution ${solIndex + 1} has no placements array.`);
                    }
                });
                console.log("---------------------------------------");
            }
            // ------------------------------------------------- //

         } catch (workerError) {
             console.error("[handleUnifiedSolve] Error EXECUTING Maximal Placement (Backtracking) worker task:", workerError);
             setSolverError(`Worker execution error (Maximal Placement - Backtracking): ${workerError instanceof Error ? workerError.message : String(workerError)}`);
             finalResult = null;
             toast.dismiss('solver-progress-toast');
         }
      }

      // --- Process Final Result --- 
      toast.dismiss('solver-progress-toast'); 
      if (finalResult && finalResult.solutions && finalResult.solutions.length > 0) {
          if (!bestSolutions || bestSolutions.length === 0 || finalResult.maxShapes > (bestSolutions[0]?.placements?.length ?? 0)) {
              console.log("[handleUnifiedSolve] Final result is better than last streamed, updating state."); 
              setBestSolutions(finalResult.solutions);
              setCurrentSolutionIndex(0);
              if (finalResult.solutions[0]) updateGridStateFromSolution(finalResult.solutions[0]);
          }
          toast.success(`Finished. Found ${finalResult.solutions.length} solution(s) using ${finalResult.maxShapes} shapes (${currentSolver} mode).`);
      } else if (finalResult && finalResult.error) {
          toast.error(`Solver Error (${currentSolver}): ${finalResult.error}`);
          setSolverError(`Solver Error (${currentSolver}): ${finalResult.error}`);
      } else if (!finalResult && !solverError) { 
          toast.error(`Solver (${currentSolver}) returned no result or an unexpected format.`);
          setSolverError(`Solver (${currentSolver}) returned no result.`);
      } else if (!ranExactTiling && (!finalResult || finalResult.solutions?.length === 0)) {
          toast.info(`No solution found (${currentSolver} mode).`); 
      } else if (ranExactTiling && (!finalResult || finalResult.solutions?.length === 0)) {
          toast.info(`Exact tiling failed, and no solution found via maximal placement.`);
      }

    } catch (error) {
        console.error("[handleUnifiedSolve] Error during solve process:", error);
        toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
        setSolverError(`Client-side error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsSolving(false); 
      console.log("[handleUnifiedSolve] Solve process finished.");
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
        // Avoid adding duplicates?
        if (potentials.includes(shapeString)) {
            toast.info("Shape already saved.");
            return;
        }
        // Validate length
        if (shapeString.length !== Config.TOTAL_TILES) {
             toast.error(`Cannot add predefined shape: Invalid length (${shapeString.length}). Expected ${Config.TOTAL_TILES}.`);
             console.error("Invalid predefined shape string:", shapeString);
             return;
        }
        setPotentials((prev) => [...prev, shapeString]);
        toast.success("Predefined shape added to saved potentials.");
    },
    [potentials] // Add potentials to dependency array
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

  // --- Rendering ---
  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 overflow-hidden relative p-4 gap-4">
      {/* <CookieConsentBanner /> */} 
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Center Panel: Canvas (Now Left) */}
        <div ref={containerRef} className="w-2/3 bg-gray-800/30 rounded-lg overflow-hidden border border-border/50 relative">
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
            currentSolutionIndex={currentSolutionIndex}
            bestSolutions={bestSolutions.map(sol => [])}
            selectedTiles={selectedTiles}
            potentials={potentials}
            handlePrevSolution={()=>{}}
            handleNextSolution={()=>{}}
            handleBackToEdit={()=>{}}
            potentialsCount={potentials.length}
            isFindingExactTiling={isFindingExactTiling}
            exactTilingSolutions={exactTilingSolutions}
            currentExactTilingIndex={currentExactTilingIndex}
            handlePrevExactTilingSolution={()=>{}}
            handleNextExactTilingSolution={()=>{}}
            lockedTilesMask={lockedTilesMask}
          />
          {/* Status */}
          <StatusPanel
            potentials={potentials}
            bestSolutions={bestSolutions}
            currentSolutionIndex={currentSolutionIndex}
            isSolving={isSolving}
            handleSolve={handleUnifiedSolve}
            lockedTilesCount={countSetBits(lockedTilesMask)}
            availableTiles={Config.TOTAL_TILES - countSetBits(lockedTilesMask)}
            currentSolver={currentSolver}
            solverError={solverError}
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

