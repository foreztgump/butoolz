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

const isSafeNumber = HexUtils.isSafeNumber;

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
  const solverWorkerRef = useRef<Worker | null>(null);

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
      solverWorkerRef.current?.terminate();
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

  const handleSolve = useCallback(
    (testPotentials?: string[]) => { // Allow optional test potentials
      const potentialsToSolve = testPotentials || potentials; // Use test potentials if provided
      if (potentialsToSolve.length === 0) {
        toast.error("Save or add at least one potential shape first.", {
          duration: 3000,
        });
        return;
      }
      // Ensure all saved potentials are valid 4-tile shapes before solving
      const invalidPotential = potentialsToSolve.find(
        (p) => Array.from(p).filter((c) => c === "1").length !== 4
      );
      if (invalidPotential) {
        toast.error(
          "Solver currently only works with 4-tile potential shapes. Please remove/replace shapes that are not size 4.",
          { duration: 6000 }
        );
        return;
      }

      solverWorkerRef.current?.terminate(); // Terminate previous worker if any
      setIsSolving(true);
      setBestSolutions([]);
      setCurrentSolutionIndex(-1);
      setSelectedTiles(new Set()); // Clear selection when solving starts
      setGridState(Array(Config.TOTAL_TILES + 1).fill(-1)); // Reset grid visually
      setSolveProgress(0);
      const solveStartTime = performance.now(); // --- Record start time ---
      const numPotentialsForRun = potentialsToSolve.length; // --- Store number of potentials ---

      toast.info(`Solving with ${numPotentialsForRun} potentials...`, {
        id: "solving-toast",
        duration: 10000,
      }); // Longer duration maybe

      // Initialize worker
      // Use new URL() syntax for proper module worker handling in Next.js/Webpack
      solverWorkerRef.current = new Worker(
        new URL("./solver.worker.ts", import.meta.url)
      );

      solverWorkerRef.current.onmessage = (event: MessageEvent) => {
        const {
          type,
          bestSolutions: coloredBestSolutions,
          message,
          count,
          searchedCount,
        } = event.data;
        if (type === "result") {
          const solveEndTime = performance.now(); // --- Record end time ---
          const duration = solveEndTime - solveStartTime; // --- Calculate duration ---
          console.log(
            `[Main] Worker finished. Potentials: ${numPotentialsForRun}. Duration: ${duration.toFixed(
              2
            )}ms. Searched: ${searchedCount}. Found ${
              coloredBestSolutions?.length || 0
            } best.`
          );
          // --- Log result ---
          toast.info(
            `Solved ${numPotentialsForRun} potentials in ${duration.toFixed(0)}ms`,
            { duration: 5000 }
          );

          setBestSolutions(coloredBestSolutions || []);
          setIsSolving(false);
          setSolveProgress(0);
          toast.dismiss("solving-toast");
          if (coloredBestSolutions && coloredBestSolutions.length > 0) {
            setCurrentSolutionIndex(0); // Show the first solution
            toast.success(
              `Found ${coloredBestSolutions.length} best solution(s).`,
              { duration: 5000 }
            );
          } else {
            toast.warning(
              "No valid placement found for the given potential(s).",
              { duration: 5000 }
            );
          }
          solverWorkerRef.current?.terminate(); // Terminate after use
          solverWorkerRef.current = null;
        } else if (type === "error") {
          console.error("[Main] Worker error:", message);
          setIsSolving(false);
          setSolveProgress(0);
          toast.dismiss("solving-toast");
          toast.error(`Solver error: ${message}`, { duration: 6000 });
          solverWorkerRef.current?.terminate();
          solverWorkerRef.current = null;
        } else if (type === "progress") {
          setSolveProgress(count); // Update progress
        }
      };
      solverWorkerRef.current.onerror = (error) => {
        console.error("[Main] Worker onerror:", error);
        setIsSolving(false);
        setSolveProgress(0);
        toast.dismiss("solving-toast");
        toast.error(`Worker error: ${error.message}`, { duration: 6000 });
        solverWorkerRef.current?.terminate();
        solverWorkerRef.current = null;
      };
      // Post message *after* setting up handlers
      solverWorkerRef.current.postMessage({ potentials: potentialsToSolve }); // Use potentialsToSolve
    },
    [
      potentials, // Keep original potentials dependency
      setIsSolving,
      setBestSolutions,
      setCurrentSolutionIndex,
      setSelectedTiles,
      setGridState,
      setSolveProgress,
    ]
  ); // Dependencies seem correct

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
  const handleReset = useCallback(() => {
    setSelectedTiles(new Set());
    setPotentials([]);
    setBestSolutions([]);
    setCurrentSolutionIndex(-1);
    setGridState(Array(Config.TOTAL_TILES + 1).fill(-1));
    setIsSolving(false);
    solverWorkerRef.current?.terminate();
    solverWorkerRef.current = null;
    setSolveProgress(0);
    let newOffset = { x: 0, y: 0 };
    let newZoom = 1;
    const canvas = canvasRef.current;
    // Recalculate initial offset
    if (canvas && containerRef.current) {
      // Check containerRef too
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
        const calculatedOffset = { x: -cX, y: -cY };
        if (
          isSafeNumber(calculatedOffset.x) &&
          isSafeNumber(calculatedOffset.y)
        )
          newOffset = calculatedOffset;
      }
    }
    currentOffsetRef.current = newOffset;
    setZoom(newZoom); // Trigger redraw via useEffect
    toast.success("Reset complete.");
    // Clear previews manually (although state changes should handle this)
    potentialCanvasRefs.current.forEach((c) => {
      const ctx = c.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    });
    predefinedCanvasRefs.current.forEach((c) => {
      const ctx = c.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    });
    // scheduleDraw(); // Let useEffect handle redraw based on state changes (zoom, gridState etc)
  }, [
    setZoom,
    setSelectedTiles,
    setPotentials,
    setBestSolutions,
    setCurrentSolutionIndex,
    setGridState,
    setIsSolving,
    setSolveProgress,
  ]); // Added setZoom

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

  // Format progress count
  const formattedProgress = isSolving ? solveProgress.toLocaleString() : "0";

  // --- UI Rendering ---
  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen">
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Shape Doctor
          </h1>
          <p className="text-muted-foreground">
            "Ain't nobody got time for that!"
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Left Column: Canvas and Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <Card className="flex flex-col flex-grow bg-card">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                    <Puzzle className="h-5 w-5 text-violet-400" /> Puzzle Grid
                  </CardTitle>
                  <Button variant="outline" size="sm" className="text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] cursor-pointer" onClick={handleReset} disabled={isSolving}>
                     <RefreshCw className="h-4 w-4 mr-1" /> Reset All
                   </Button>
                </div>
                <CardDescription className="pt-1">
                  {currentSolutionIndex !== -1
                    ? `Viewing solution ${currentSolutionIndex + 1} / ${bestSolutions.length}.`
                    : "Click to select (max 4), Save, Solve. Wheel=Zoom, Drag=Pan."}
                </CardDescription>
              </CardHeader>

              {/* === Use ShapeCanvas Component === */}
              <ShapeCanvas
                containerRef={containerRef}
                canvasRef={canvasRef}
                isClient={isClient}
                isSolving={isSolving}
                solveProgress={solveProgress}
                formattedProgress={formattedProgress}
                zoom={zoom}
                setZoom={setZoom}
                handleReset={handleReset} // Pass reset specifically for zoom/pan part
              />

              {/* === Use ControlPanel Component === */}
              <ControlPanel
                currentSolutionIndex={currentSolutionIndex}
                bestSolutions={bestSolutions}
                isSolving={isSolving}
                selectedTiles={selectedTiles}
                potentials={potentials}
                handleSavePotential={handleSavePotential}
                handleClearSelection={handleClearSelection}
                handleSolve={() => handleSolve()} // Ensure handleSolve is wrapped if it needs args later
                handlePrevSolution={handlePrevSolution}
                handleNextSolution={handleNextSolution}
                handleBackToEdit={handleBackToEdit}
              />
            </Card>
          </div>

          {/* Right Column: Status and Tabs */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
            {/* === Use StatusPanel Component === */}
            <StatusPanel
              potentials={potentials}
              bestSolutions={bestSolutions}
              currentSolutionIndex={currentSolutionIndex}
              isSolving={isSolving}
              handleSolve={handleSolve} // Pass handleSolve for profiling buttons
            />

            {/* === Use ResultsTabs Component === */}
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

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-auto pt-8 flex-shrink-0">
          Special Thanks to OGWaffle for the original concept and logic!
        </footer>
      </div>
    </>
  );
}
