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

const isSafeNumber = HexUtils.isSafeNumber;

// Remove Poolifier ref
// const poolManagerRef = useRef<SolverPool | null>(null);

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
  const [bestSolutions, setBestSolutions] = useState<number[][]>([]);
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

  // Add formattedProgress derivation
  const formattedProgress = `${Math.round(solveProgress)}%`;

  // Initialize workerpool Pool
  useEffect(() => {
    console.log('Initializing workerpool...');
    if (typeof window !== 'undefined') {
      const workerPath = '/workers/solver.worker.js';
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
      selectedTiles // Pass selectedTiles here
    );

    // Continue the animation loop
    animationFrameIdRef.current = requestAnimationFrame(drawMainCanvas);
  }, [zoom, gridState, selectedTiles]);

  // Revert back to useCallback
  const drawPotentialShapes = useCallback(() => {
    potentials.forEach((shape, index) => {
      const canvas = potentialCanvasRefs.current.get(index);
      if (canvas) {
        HexUtils.drawPreviewGrid(canvas, shape, index);
      }
    });
  }, [potentials]); // Dependency on drawPreviewGrid (now HexUtils.drawPreviewGrid) is implicit

  const drawPredefinedShapes = useCallback(() => {
    Config.PREDEFINED_SHAPES.forEach((shape, index) => {
      const canvas = predefinedCanvasRefs.current.get(index);
      if (canvas) {
        HexUtils.drawPreviewGrid(canvas, shape, index);
      }
    });
  }, []); // Dependency on drawPreviewGrid (now HexUtils.drawPreviewGrid) is implicit

  // --- Event Handlers ---
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || canvasRef.current?.width === 0 || canvasRef.current?.height === 0) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY * Config.ZOOM_SENSITIVITY;
    if (!isSafeNumber(delta)) return;
    const currentZoom = zoom;
    const currentOffset = currentOffsetRef.current;
    const worldXBefore =
      (mouseX - rect.width / 2 - currentOffset.x) / currentZoom;
    const worldYBefore =
      (mouseY - rect.height / 2 - currentOffset.y) / currentZoom;
    if (!isSafeNumber(worldXBefore) || !isSafeNumber(worldYBefore)) return;
    let potentialNewZoom = currentZoom * (1 - delta);
    if (!isSafeNumber(potentialNewZoom) || potentialNewZoom <= 0) return;
    const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, potentialNewZoom));
    if (newZoom === currentZoom) return;
    const worldXAfterZoom = worldXBefore * newZoom;
    const worldYAfterZoom = worldYBefore * newZoom;
    const newOffsetX = mouseX - rect.width / 2 - worldXAfterZoom;
    const newOffsetY = mouseY - rect.height / 2 - worldYAfterZoom;
    if (!isSafeNumber(newOffsetX) || !isSafeNumber(newOffsetY)) return;
    setZoom(newZoom);
    currentOffsetRef.current = { x: newOffsetX, y: newOffsetY };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const canvas = canvasRef.current; // Get canvas ref
    if (!canvas) return; // Check canvas ref

    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentOffsetRef.current.x,
      y: e.clientY - currentOffsetRef.current.y,
    });
    canvas.style.cursor = "grabbing"; // Assign directly after checking ref
  };

  const getHexUnderCursor = useCallback(
    (e: MouseEvent): HexCoord | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const worldPos = HexUtils.screenToWorld(
        screenX,
        screenY,
        canvas.width,
        canvas.height,
        currentOffsetRef.current,
        zoom
      );
      if (!worldPos) return null;

      const axial = HexUtils.pixelToAxial(worldPos.x, worldPos.y);
      if (!axial) return null;

      const rounded = HexUtils.hexRound(axial.q, axial.r);
      if (!rounded) return null;

      return HexUtils.findHexByCoords(rounded.q, rounded.r) || null;
    },
    [zoom] // Dependencies updated
  );

  const handleMouseMove = (e: MouseEvent) => {
    // Handle dragging (updates ref directly, needs explicit redraw)
    if (isDragging) {
      const nX = (e.clientX - dragStart.x) * Config.PAN_SENSITIVITY;
      const nY = (e.clientY - dragStart.y) * Config.PAN_SENSITIVITY;
      if (isSafeNumber(nX) && isSafeNumber(nY)) {
        if (
          currentOffsetRef.current.x !== nX ||
          currentOffsetRef.current.y !== nY
        ) {
          currentOffsetRef.current = { x: nX, y: nY };
          // No state update here, draw loop handles redraw
        }
      }
    } else {
      // Update hover state (updates ref directly, needs explicit redraw)
      const hex = getHexUnderCursor(e);
      if (hoveredHexIdRef.current !== (hex ? hex.id : null)) {
        hoveredHexIdRef.current = hex ? hex.id : null;
        // No state update here, draw loop handles redraw
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleMouseLeave = () => {
    // Clear hover state when mouse leaves canvas
    if (hoveredHexIdRef.current !== null) {
      hoveredHexIdRef.current = null;
      // No state update, draw loop handles redraw
    }
    // Stop dragging if mouse leaves while dragging
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (isDragging) return; // Don't process click if it was end of drag

    const clickedHex = getHexUnderCursor(e);

    if (clickedHex && !isSolving) {
      const clickedId = clickedHex.id;
      setSelectedTiles((prev) => {
        const newSelection = new Set(prev);
        let isAdding = false;
        if (newSelection.has(clickedId)) {
          newSelection.delete(clickedId);
        } else {
          newSelection.add(clickedId);
          isAdding = true;
        }

        // Check connectivity only if adding a tile to an existing selection
        if (isAdding && newSelection.size > 1) {
          const neighbors = Config.ADJACENT_LIST[clickedId] || [];
          const isAdjacent = neighbors.some((neighborId: number) =>
            prev.has(neighborId)
          );
          if (!isAdjacent) {
            toast.warning("Selected tiles must be connected.");
            newSelection.delete(clickedId); // Revert the addition
            return prev; // Return original set
          }
        }

        // Clear solutions when selection changes
        setPotentials([]);
        setBestSolutions([]);
        setCurrentSolutionIndex(-1);
        setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
        return newSelection;
      });
    }
  };

  // Add event listeners
  const handleResize = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current; // Get canvas ref
    if (!container || !canvas) return; // Check both refs

    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      // Check canvas ref before assigning
      canvas.width = width;
      canvas.height = height;
    }
  };

  const handleWindowResize = () => {
    handleResize();
    drawMainCanvas();
    drawPotentialShapes();
    drawPredefinedShapes();
  };

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    return () => {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []); // Runs once
  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let initialOffsetSet = false;
    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
      } else {
        return;
      }
      if (!initialOffsetSet) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        Config.HEX_GRID_COORDS.forEach((hex) => {
          const p = HexUtils.axialToPixel(hex.q, hex.r);
          if (p) {
            minX = Math.min(minX, p.x - Config.HEX_WIDTH / 2);
            maxX = Math.max(maxX, p.x + Config.HEX_WIDTH / 2);
            minY = Math.min(minY, p.y - Config.HEX_HEIGHT / 2);
            maxY = Math.max(maxY, p.y + Config.HEX_HEIGHT / 2);
          }
        });
        if (
          isSafeNumber(minX) &&
          maxX > minX &&
          isSafeNumber(minY) &&
          maxY > minY
        ) {
          const cX = minX + (maxX - minX) / 2;
          const cY = minY + (maxY - minY) / 2;
          const iOffset = { x: -cX, y: -cY };
          if (isSafeNumber(iOffset.x) && isSafeNumber(iOffset.y)) {
            currentOffsetRef.current = iOffset;
            initialOffsetSet = true;
            drawMainCanvas();
            return;
          }
        }
      }
      drawMainCanvas();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    return () => resizeObserver.disconnect();
  }, [isClient, drawMainCanvas]); // Dependencies seem correct
  useEffect(() => {
    if (isClient) {
      drawMainCanvas();
    }
  }, [
    isClient,
    zoom,
    selectedTiles,
    gridState,
    currentSolutionIndex,
    drawMainCanvas,
  ]); // Redraw on these changes
  useEffect(() => {
    // Interaction listeners effect
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (!rect || canvas.width === 0 || canvas.height === 0) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY * Config.ZOOM_SENSITIVITY;
      if (!isSafeNumber(delta)) return;
      const currentZoom = zoom;
      const currentOffset = currentOffsetRef.current;
      const worldXBefore =
        (mouseX - canvas.width / 2 - currentOffset.x) / currentZoom;
      const worldYBefore =
        (mouseY - canvas.height / 2 - currentOffset.y) / currentZoom;
      if (!isSafeNumber(worldXBefore) || !isSafeNumber(worldYBefore)) return;
      let potentialNewZoom = currentZoom * (1 - delta);
      if (!isSafeNumber(potentialNewZoom) || potentialNewZoom <= 0) return;
      const newZoom = Math.max(Config.MIN_ZOOM, Math.min(Config.MAX_ZOOM, potentialNewZoom));
      if (newZoom === currentZoom) return;
      const worldXAfterZoom = worldXBefore * newZoom;
      const worldYAfterZoom = worldYBefore * newZoom;
      const newOffsetX = mouseX - canvas.width / 2 - worldXAfterZoom;
      const newOffsetY = mouseY - canvas.height / 2 - worldYAfterZoom;
      if (!isSafeNumber(newOffsetX) || !isSafeNumber(newOffsetY)) return;
      setZoom(newZoom);
      currentOffsetRef.current = { x: newOffsetX, y: newOffsetY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - currentOffsetRef.current.x,
        y: e.clientY - currentOffsetRef.current.y,
      });
      canvas.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect || canvas.width === 0 || canvas.height === 0) return;
      const mX = e.clientX - rect.left;
      const mY = e.clientY - rect.top;
      if (!isSafeNumber(mX) || !isSafeNumber(mY)) return;
      let needsManualRedraw = false; // Use a flag for redraws not covered by state changes

      // Update hover state (doesn't use state, directly uses ref and schedules draw if needed)
      const world = HexUtils.screenToWorld(
        mX,
        mY,
        canvas.width,
        canvas.height,
        currentOffsetRef.current,
        zoom
      );
      const hexUnderMouse = world ? getHexUnderCursor(e) : null;
      const newHoverId = hexUnderMouse ? hexUnderMouse.id : null;
      if (newHoverId !== hoveredHexIdRef.current) {
        hoveredHexIdRef.current = newHoverId;
        needsManualRedraw = true; // Hover change needs explicit redraw
      }

      // Handle dragging (updates ref directly, needs explicit redraw)
      if (isDragging) {
        const nX = (e.clientX - dragStart.x) * Config.PAN_SENSITIVITY;
        const nY = (e.clientY - dragStart.y) * Config.PAN_SENSITIVITY;
        if (isSafeNumber(nX) && isSafeNumber(nY)) {
          if (
            currentOffsetRef.current.x !== nX ||
            currentOffsetRef.current.y !== nY
          ) {
            currentOffsetRef.current = { x: nX, y: nY };
            needsManualRedraw = true; // Offset change needs explicit redraw
          }
        }
      }

      if (needsManualRedraw) {
        drawMainCanvas(); // Schedule draw only if hover or offset changed
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        canvas.style.cursor = "grab";
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        canvas.style.cursor = "grab";
      }
      if (hoveredHexIdRef.current !== null) {
        hoveredHexIdRef.current = null;
        drawMainCanvas(); // Schedule draw needed to clear hover effect
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Check if dragging occurred between mousedown and mouseup
      // Simple check: if mouse moved significantly, consider it a drag
      const movedSignificantly =
        Math.abs(e.clientX - (dragStart.x + currentOffsetRef.current.x)) > 5 ||
        Math.abs(e.clientY - (dragStart.y + currentOffsetRef.current.y)) > 5;

      if (isDragging && movedSignificantly) return; // Ignore click if it was likely a drag

      if (currentSolutionIndex !== -1) {
        toast.warning("Click 'Back to Edit' first.", { duration: 3000 });
        return;
      }
      const currentCanvas = canvasRef.current;
      if (
        !currentCanvas ||
        currentCanvas.width === 0 ||
        currentCanvas.height === 0
      )
        return;
      const rect = currentCanvas.getBoundingClientRect();
      if (!rect) return;
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = HexUtils.screenToWorld(
        screenX,
        screenY,
        currentCanvas.width,
        currentCanvas.height,
        currentOffsetRef.current,
        zoom
      );
      if (!world) return;
      const clickedHex = getHexUnderCursor(e);
      if (clickedHex) {
        const clickedId = clickedHex.id;
        setSelectedTiles((prev) => {
          const newSelection = new Set(prev);
          if (newSelection.has(clickedId)) {
            newSelection.delete(clickedId);
          } else {
            if (newSelection.size >= 4) {
              toast.warning("Max 4 tiles.", { duration: 3000 });
              return prev; // Return previous state if max reached
            }
            // Check connectivity only if adding a tile to an existing selection
            if (newSelection.size > 0) {
              const neighbors = Config.ADJACENT_LIST[clickedId] || [];
              const isAdjacent = neighbors.some(
                (neighborId: number) =>
                  neighborId !== 0 && newSelection.has(neighborId)
              );
              if (!isAdjacent) {
                toast.warning("Tiles must be connected.", { duration: 3000 });
                return prev; // Return previous state if not adjacent
              }
            }
            newSelection.add(clickedId);
          }
          return newSelection; // Return the modified set
        });
      }
    };

    // Add listeners
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    // Use window for mouseup to catch drags ending outside canvas
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);
    canvas.style.cursor = "grab";

    // Cleanup function
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp); // Remove from window
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [
    // Dependencies for interaction effect
    isClient,
    zoom,
    setZoom,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart, // State used directly in handlers
    drawMainCanvas, // Dependency added
    currentSolutionIndex,
    setSelectedTiles, // State/Setters used in click handler
    // Config.ADJACENT_LIST is constant
    // toast is stable library function
    // Refs (canvasRef, currentOffsetRef, hoveredHexIdRef) don't need to be deps
  ]);

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
  const handleSavePotential = useCallback(() => {
    if (selectedTiles.size === 0) {
      toast.error("Select tiles first.", { duration: 3000 });
      return;
    }
    // Allow saving shapes of size 1 to 4
    if (selectedTiles.size > 4) {
      toast.error("Select maximum 4 tiles.", { duration: 3000 });
      return;
    }

    let potentialString = "";
    for (let i = 1; i <= Config.TOTAL_TILES; i++) {
      potentialString += selectedTiles.has(i) ? "1" : "0";
    }

    // Check connectivity using the checkPotential function
    const numberOfOnes = Array.from(potentialString).filter(
      (c) => c === "1"
    ).length;
    if (checkPotential(potentialString) !== numberOfOnes) {
      // This check might be redundant if the click handler prevents non-adjacent selections, but good safeguard.
      toast.error("Selected tiles must form a single connected shape.", {
        duration: 4000,
      });
      return;
    }

    setPotentials((prev) => [...prev, potentialString]);
    toast.success(`Potential ${potentials.length + 1} saved.`);
    setSelectedTiles(new Set()); // Clear selection after saving
  }, [
    selectedTiles,
    potentials,
    checkPotential,
    setPotentials,
    setSelectedTiles,
  ]); // Dependencies seem correct

  // REVISED handleSolveClick to process saved potentials
  const handleSolveClick = async () => {
    // Check potentials array instead of selectedTiles
    if (potentials.length === 0) {
      toast.error("Please save potential shapes first.");
      return;
    }

    setIsSolving(true);
    setSolveProgress(0);
    setBestSolutions([]); // Clear previous solutions
    setCurrentSolutionIndex(-1);
    toast.info(`Starting solver for ${potentials.length} potential shapes...`);

    const pool = workerPoolRef.current;
    if (!pool) {
      console.error("Workerpool not initialized.");
      toast.error("Solver pool not ready. Please refresh.");
      setIsSolving(false);
      return;
    }

    try {
      const totalTasks = potentials.length;
      let completedTasks = 0;

      const taskPromises = potentials.map((potentialString, index) => {
        const taskData = { potentialShapeString: potentialString };
        console.log(`Submitting task ${index + 1}/${totalTasks} to workerpool:`, taskData);
        // Call the registered 'findPlacements' function
        return pool.exec('findPlacements', [taskData]) 
          .then((result: any) => { // TODO: Replace 'any' with SolverResultPayload type
            completedTasks++;
            setSolveProgress(Math.round((completedTasks / totalTasks) * 100));
            // Note: 'result' should now match SolverResultPayload { solutions: string[], error?: string }
            console.log(`Task ${index + 1}/${totalTasks} completed. Result:`, result);
            // TODO: Adjust logic below to handle the new result structure (result.solutions)
            return result;
          })
          .catch((error: any) => {
            completedTasks++;
            setSolveProgress(Math.round((completedTasks / totalTasks) * 100));
            console.error(`Error solving potential ${index}:`, error);
            toast.error(`Error processing shape ${index + 1}.`);
            // Return a consistent null/error structure if needed
            return { solutions: [], error: error.message || 'Worker execution failed' }; 
          });
      });

      const allResults = await Promise.all(taskPromises);
      console.log("All worker tasks finished. Raw results:", allResults);

      // TODO: MAJOR REFACTOR NEEDED HERE
      // The worker now returns { solutions: string[] }. 
      // The page currently expects { bestSolutions: number[][] } (based on old logic).
      // We need to adapt this aggregation logic.

      const aggregatedSolutions: string[] = []; // Store string keys for now
      allResults.forEach((result: any, index: number) => {
        // Check for the new 'solutions' property
        if (result && result.solutions && Array.isArray(result.solutions)) { 
            if (result.error) {
                 console.warn(`Task ${index + 1} completed with error: ${result.error}`);
                 // Optionally toast.warn or handle specific errors
            } else {
                console.log(`Aggregating ${result.solutions.length} solution keys from potential ${index}`);
                aggregatedSolutions.push(...result.solutions);
            }
        } else if (result && result.error) {
            // Handle cases where the entire task failed (caught in .catch block)
            console.error(`Task ${index + 1} failed entirely: ${result.error}`);
        } else {
            console.warn(`Unexpected result structure from task ${index + 1}:`, result);
        }
      });

      // Now, `aggregatedSolutions` is string[]. We need number[][] for setBestSolutions.
      // Convert string keys ("1,5,12") back to number arrays ([1, 5, 12])
      const solutionsAsNumbers: number[][] = aggregatedSolutions.map(key => 
        key.split(',').map(Number)
      );

      setBestSolutions(solutionsAsNumbers);
      setCurrentSolutionIndex(solutionsAsNumbers.length > 0 ? 0 : -1);
      setSolveProgress(100); // Ensure progress hits 100%

      if (solutionsAsNumbers.length === 0) {
        toast.info("Solving complete. No valid placements found for the saved potentials.");
      } else {
        toast.success(`Solving complete! Found ${solutionsAsNumbers.length} total placements.`);
      }

    } catch (error) {
      console.error("Error during batch solve execution:", error);
      toast.error("An error occurred during the solving process.");
      setSolveProgress(100); // Still mark as complete for UI consistency
    } finally {
      setIsSolving(false);
    }
  };

  useEffect(() => {
    // Effect to update grid when solution changes
    if (currentSolutionIndex !== -1 && bestSolutions[currentSolutionIndex]) {
      const solutionToApply = bestSolutions[currentSolutionIndex];
      setGridState(solutionToApply);
    } else {
      // Ensure grid resets if we go back to edit mode or have no solutions
      setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
    }
  }, [currentSolutionIndex, bestSolutions, setGridState]); // Dependencies seem correct

  const handleNextSolution = useCallback(() => {
    if (bestSolutions.length === 0) return;
    setCurrentSolutionIndex((prev) => (prev + 1) % bestSolutions.length);
    setSelectedTiles(new Set());
  }, [bestSolutions.length, setCurrentSolutionIndex, setSelectedTiles]);
  const handlePrevSolution = useCallback(() => {
    if (bestSolutions.length === 0) return;
    setCurrentSolutionIndex(
      (prev) => (prev - 1 + bestSolutions.length) % bestSolutions.length
    );
    setSelectedTiles(new Set());
  }, [bestSolutions.length, setCurrentSolutionIndex, setSelectedTiles]);
  const handleBackToEdit = useCallback(() => {
    setSelectedTiles(new Set());
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
    setCurrentSolutionIndex(-1);
    toast.info(
      "Editing mode activated."
    ); /* scheduleDraw(); // scheduleDraw called by useEffect reacting to state changes */
  }, [setSelectedTiles, setGridState, setCurrentSolutionIndex]); // Removed scheduleDraw, it's handled by useEffect
  const handleResetSelection = useCallback(() => {
    setSelectedTiles(new Set());
    setPotentials([]);
    setBestSolutions([]);
    setCurrentSolutionIndex(-1);
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
    setSolveProgress(0);
    currentOffsetRef.current = { x: 0, y: 0 }; // Reset pan
    setZoom(1); // Reset zoom
    toast.info("Selection and results cleared.");
  }, []);

  const handleDeletePotential = useCallback(
    (indexToDelete: number) => {
      setPotentials((prevPotentials) => {
        // Check if index is valid
        if (indexToDelete < 0 || indexToDelete >= prevPotentials.length)
          return prevPotentials;

        // Delete the canvas ref *before* updating state
        potentialCanvasRefs.current.delete(indexToDelete);
        // Adjust keys for remaining refs AFTER the deleted one (important!)
        const newRefs = new Map<number, HTMLCanvasElement>();
        potentialCanvasRefs.current.forEach((canvas, key) => {
          if (key > indexToDelete) {
            newRefs.set(key - 1, canvas); // Decrement key
          } else if (key < indexToDelete) {
            newRefs.set(key, canvas); // Keep same key
          }
        });
        potentialCanvasRefs.current = newRefs; // Update the refs map

        const updated = prevPotentials.filter(
          (_, index) => index !== indexToDelete
        );
        toast.info(`Potential ${indexToDelete + 1} deleted.`);
        return updated;
      });
    },
    [setPotentials]
  ); // Dependency is correct

  // --- Potential Preview Drawing ---
  // Using the corrected version from previous step
  const drawPotential = useCallback(
    (canvasElement: HTMLCanvasElement, shapeString: string) => {
      const ctx = canvasElement.getContext("2d");
      if (!ctx) return;
      const { width, height } = canvasElement;
      ctx.clearRect(0, 0, width, height);
      const tileIds: number[] = [];
      for (let i = 0; i < shapeString.length; i++) {
        if (shapeString.charAt(i) === "1") {
          tileIds.push(i + 1);
        }
      }
      if (tileIds.length === 0) return;

      let minQ = Infinity,
        maxQ = -Infinity,
        minR = Infinity,
        maxR = -Infinity;
      const potentialHexes = tileIds
        .map((id) => {
          const hex = Config.HEX_GRID_COORDS.find((h) => h.id === id);
          if (hex) {
            minQ = Math.min(minQ, hex.q);
            maxQ = Math.max(maxQ, hex.q);
            minR = Math.min(minR, hex.r);
            maxR = Math.max(maxR, hex.r);
          }
          return hex;
        })
        .filter((hex): hex is HexCoord => !!hex);

      if (potentialHexes.length === 0) return;

      const centerQ = (minQ + maxQ) / 2;
      const centerR = (minR + maxR) / 2;
      const previewHexSize = 8; // Base size
      const previewLineWidth = 0.5;

      const previewDrawHexagon = (
        x: number,
        y: number,
        size: number,
        fillColor: string,
        strokeStyle: string
      ) => {
        if (
          !isSafeNumber(x) ||
          !isSafeNumber(y) ||
          !isSafeNumber(size) ||
          size <= 0
        ) {
          return;
        }
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const xPos = x + size * Math.cos(angle);
          const yPos = y + size * Math.sin(angle);
          if (!isSafeNumber(xPos) || !isSafeNumber(yPos)) {
            ctx.closePath();
            return;
          }
          if (i === 0) ctx.moveTo(xPos, yPos);
          else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();
        try {
          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = previewLineWidth; // Revert to fixed line width
          ctx.stroke();
        } catch (e) {
          console.error("Error drawing preview hex:", e);
        }
      };

      potentialHexes.forEach((hex) => {
        const adjustedQ = hex.q - centerQ;
        const adjustedR = hex.r - centerR;
        const x = width / 2 + previewHexSize * ((3 / 2) * adjustedQ);
        const y =
          height / 2 +
          previewHexSize *
            ((Math.sqrt(3) / 2) * adjustedQ + Math.sqrt(3) * adjustedR);
        previewDrawHexagon(
          x,
          y,
          previewHexSize,
          Config.SELECTED_COLOR,
          Config.STROKE_COLOR_ACTIVE
        );
      });
    },
    []
  ); // Still self-contained, empty array is correct

  // Ref setter for SAVED potentials
  const setPotentialCanvasRef = useCallback(
    (index: number, element: HTMLCanvasElement | null) => {
      if (element) {
        potentialCanvasRefs.current.set(index, element);
        // Immediately draw potential if it exists in state
        const potentialString = potentials[index];
        if (potentialString) {
          drawPotential(element, potentialString);
        }
      } else {
        potentialCanvasRefs.current.delete(index);
      }
    },
    [potentials, drawPotential]
  ); // Needs potentials and drawPotential as deps

  // Effect to draw SAVED potentials (This might be redundant if setPotentialCanvasRef draws immediately)
  // Let's keep it for ensuring redraws if potentials array itself changes externally
  useEffect(() => {
    if (!isClient) return;
    potentials.forEach((pString, index) => {
      const canvas = potentialCanvasRefs.current.get(index);
      if (canvas) {
        drawPotential(canvas, pString);
      }
    });
  }, [isClient, potentials, drawPotential]); // Dependencies are correct

  // Ref setter for PREDEFINED shapes
  const setPredefinedCanvasRef = useCallback(
    (index: number, element: HTMLCanvasElement | null) => {
      if (element) {
        predefinedCanvasRefs.current.set(index, element);
        // Immediately draw predefined shape
        const shapeString = Config.PREDEFINED_SHAPES[index];
        if (shapeString) {
          drawPotential(element, shapeString);
        }
      } else {
        predefinedCanvasRefs.current.delete(index);
      }
    },
    [drawPotential]
  ); // Depends on drawPotential (PREDEFINED_SHAPES is constant)

  // --- Handler to Add Predefined Shape ---
  const handleAddPredefinedPotential = useCallback(
    (shapeString: string) => {
      if (isSolving) {
        toast.warning("Cannot add potentials while solving.", {
          duration: 3000,
        });
        return;
      }
      setPotentials((prevPotentials) => {
        toast.success(`Shape added to potentials.`);
        return [...prevPotentials, shapeString];
      });
    },
    [isSolving, setPotentials]
  ); // Dependencies are correct

  // --- UI Rendering - RESTORED STRUCTURE ---
  return (
    // Outer container from old layout
    <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen bg-background text-foreground">
      {/* Header (Optional - Re-add if needed) */}
      {/* <div className="mb-6 flex-shrink-0"> ... </div> */}

      {/* Main Layout Grid (Restored) */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Column: Canvas and Controls (Restored Structure) */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <Card className="flex flex-col flex-grow bg-card">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                  <Puzzle className="h-5 w-5 text-violet-400" /> Puzzle Grid
                </CardTitle>
                {/* Reset button needs handleResetSelection */}
                <Button variant="outline" size="sm" className="text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] cursor-pointer" onClick={handleResetSelection} disabled={isSolving}>
                   <RefreshCw className="h-4 w-4 mr-1" /> Reset All
                 </Button>
              </div>
              <CardDescription className="pt-1 text-xs text-muted-foreground">
                {currentSolutionIndex !== -1
                  ? `Viewing solution ${currentSolutionIndex + 1} / ${bestSolutions.length}.`
                  : "Click tiles (max 4), Save, then Solve saved potentials. Wheel=Zoom, Drag=Pan."}
              </CardDescription>
            </CardHeader>
            
            {/* ShapeCanvas (Restored Placement) */}
            <div ref={containerRef} className="flex-grow relative bg-muted/40 min-h-[300px]"> {/* Added min-h for visibility */}
              <ShapeCanvas 
                canvasRef={canvasRef} 
                containerRef={containerRef}
                isClient={isClient}
                isSolving={isSolving}
                solveProgress={solveProgress} // Pass raw progress
                formattedProgress={formattedProgress} // Pass formatted string
                zoom={zoom}
                setZoom={setZoom}
                handleReset={handleResetSelection}
              />
            </div>

            {/* ControlPanel (Restored Placement) */}
            <ControlPanel
              currentSolutionIndex={currentSolutionIndex}
              bestSolutions={bestSolutions}
              isSolving={isSolving}
              selectedTiles={selectedTiles}
              potentials={potentials}
              handleSavePotential={handleSavePotential}
              handleClearSelection={handleClearSelection}
              handleSolve={handleSolveClick} // Use the revised handler
              handlePrevSolution={handlePrevSolution}
              handleNextSolution={handleNextSolution}
              handleBackToEdit={handleBackToEdit}
            />
          </Card>
        </div>

        {/* Right Column: Status and Tabs (Restored Structure) */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          {/* StatusPanel (Restored Placement) */}
          <StatusPanel
            potentials={potentials}
            bestSolutions={bestSolutions}
            currentSolutionIndex={currentSolutionIndex}
            isSolving={isSolving}
            handleSolve={handleSolveClick} // Can still trigger solve from here if needed
          />
          {/* ResultsTabs (Restored Placement) */}
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

      {/* Footer (Optional - Re-add if needed) */}
      {/* <footer className="text-center text-xs text-muted-foreground mt-auto pt-8 flex-shrink-0"> ... </footer> */}
    </div>
  );
}
