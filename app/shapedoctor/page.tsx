"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Puzzle,
  RefreshCw,
  HelpCircle,
  Save,
  Play,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  XOctagon,
  Hand,
  Loader2,
  Library,
  PlusCircle, // Import new icons
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Constants & Config ---
const TOTAL_TILES = 24;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1;

// Colors and Styles
const HEX_COLORS = [
  "#8B5CF6",
  "#0D9488",
  "#DB2777",
  "#D97706",
  "#65A30D",
  "#0284C7",
];
const DEFAULT_COLOR = "#374151"; // gray-700
const SELECTED_COLOR = "#A78BFA"; // violet-400
const HOVER_COLOR = "#4B5563"; // gray-600
const STROKE_COLOR_DEFAULT = "#6B7280"; // gray-500
const STROKE_COLOR_ACTIVE = "#D1D5DB"; // gray-300
const CANVAS_BG_DARK = "dark:bg-gray-900";
const PREVIEW_BG = "bg-background";

const HEX_SIZE = 30;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;
const HEX_WIDTH = 2 * HEX_SIZE;

const PREDEFINED_SHAPES = [
  "111010000000000000000000",
  "110100100000000000000000",
  "110100001000000000000000",
  "110010100000000000000000",
  "110010010000000000000000",
  "110010000100000000000000",
  "110000101000000000000000",
  "110000100100000000000000",
  "110000100001000000000000",
  "101011000000000000000000",
  "101010010000000000000000",
  "101001010000000000000000",
  "101001000010000000000000",
  "101000010100000000000000",
  "101000010010000000000000",
  "101000010000100000000000",
  "100110100000000000000000",
  "100011010000000000000000",
  "100010101000000000000000",
  "100010100100000000000000",
  "100010100001000000000000",
  "100010010100000000000000",
  "100010010010000000000000",
  "100010010000100000000000",
  "100010000101000000000000",
  "100010000100100000000000",
  "100010000100001000000000",
  "011011000000000000000000",
  "011010100000000000000000",
  "011010010000000000000000",
  "010011010000000000000000",
  "010010010010000000000000",
  "001110100000000000000000",
  "001010101000000000000000",
];

const HEX_GRID_COORDS = [
  { id: 1, q: 0, r: 0 },
  { id: 2, q: -1, r: 0 },
  { id: 3, q: 1, r: -1 },
  { id: 4, q: -2, r: 0 },
  { id: 5, q: 0, r: -1 },
  { id: 6, q: 2, r: -2 },
  { id: 7, q: -1, r: -1 },
  { id: 8, q: 1, r: -2 },
  { id: 9, q: -2, r: -1 },
  { id: 10, q: 0, r: -2 },
  { id: 11, q: 2, r: -3 },
  { id: 12, q: -1, r: -2 },
  { id: 13, q: 1, r: -3 },
  { id: 14, q: -2, r: -2 },
  { id: 15, q: 0, r: -3 },
  { id: 16, q: 2, r: -4 },
  { id: 17, q: -1, r: -3 },
  { id: 18, q: 1, r: -4 },
  { id: 19, q: -2, r: -3 },
  { id: 20, q: 0, r: -4 },
  { id: 21, q: 2, r: -5 },
  { id: 22, q: -1, r: -4 },
  { id: 23, q: 1, r: -5 },
  { id: 24, q: 0, r: -5 },
];
const ADJACENT_LIST = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 2, 5, 3, 0],
  [0, 0, 4, 7, 5, 1],
  [0, 1, 5, 8, 6, 0],
  [0, 0, 0, 9, 7, 2],
  [1, 2, 7, 10, 8, 3],
  [0, 3, 8, 11, 0, 0],
  [2, 4, 9, 12, 10, 5],
  [3, 5, 10, 13, 11, 6],
  [4, 0, 0, 14, 12, 7],
  [5, 7, 12, 15, 13, 8],
  [6, 8, 13, 16, 0, 0],
  [7, 9, 14, 17, 15, 10],
  [8, 10, 15, 18, 16, 11],
  [9, 0, 0, 19, 17, 12],
  [10, 12, 17, 20, 18, 13],
  [11, 13, 18, 21, 0, 0],
  [12, 14, 19, 22, 20, 15],
  [13, 15, 20, 23, 21, 16],
  [14, 0, 0, 0, 22, 17],
  [15, 17, 22, 24, 23, 18],
  [16, 18, 23, 0, 0, 0],
  [17, 19, 0, 0, 24, 20],
  [18, 20, 24, 0, 0, 21],
  [20, 22, 0, 0, 0, 23],
];
interface Point {
  x: number;
  y: number;
}
interface HexCoord {
  id: number;
  q: number;
  r: number;
}
const isSafeNumber = (num: unknown): num is number =>
  typeof num === "number" && Number.isFinite(num);

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
    Array(TOTAL_TILES + 1).fill(-1)
  );
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [solveProgress, setSolveProgress] = useState<number>(0);

  // --- Coordinate Conversion & Drawing ---
  const axialToPixel = useCallback((q: number, r: number): Point | null => {
    const x = HEX_SIZE * ((3 / 2) * q);
    const y = HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    if (!isSafeNumber(x) || !isSafeNumber(y)) {
      return null;
    }
    return { x, y };
  }, []);
  const screenToWorld = useCallback(
    (
      screenX: number,
      screenY: number,
      canvasWidth: number,
      canvasHeight: number
    ): Point | null => {
      const currentOffset = currentOffsetRef.current;
      const currentZoom = zoom;
      if (
        !isSafeNumber(screenX) ||
        !isSafeNumber(screenY) ||
        !isSafeNumber(currentOffset.x) ||
        !isSafeNumber(currentOffset.y) ||
        !isSafeNumber(currentZoom) ||
        currentZoom <= 0 ||
        canvasWidth <= 0 ||
        canvasHeight <= 0
      ) {
        return null;
      }
      const x = (screenX - canvasWidth / 2 - currentOffset.x) / currentZoom;
      const y = (screenY - canvasHeight / 2 - currentOffset.y) / currentZoom;
      if (!isSafeNumber(x) || !isSafeNumber(y)) {
        return null;
      }
      return { x, y };
    },
    [zoom]
  );
  const drawHexagon = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      fillColor: string,
      lineWidth: number = 1,
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
        const finalLineWidth = Math.max(0.5, lineWidth / zoom);
        if (!isSafeNumber(finalLineWidth)) {
          ctx.lineWidth = 1; /* Fallback */
        } else {
          ctx.lineWidth = finalLineWidth;
        }
        ctx.stroke();
      } catch (e) {
        console.error("Error during hex draw:", e);
      }
    },
    [zoom]
  ); // Added basic error log
  const getHexAtPoint = useCallback(
    (worldX: number, worldY: number): HexCoord | null => {
      if (!isSafeNumber(worldX) || !isSafeNumber(worldY)) {
        return null;
      }
      let clickedHex: HexCoord | null = null;
      let minDistSq = Infinity;
      for (const hex of HEX_GRID_COORDS) {
        const p = axialToPixel(hex.q, hex.r);
        if (!p) continue;
        const dSq = (p.x - worldX) ** 2 + (p.y - worldY) ** 2;
        if (!isSafeNumber(dSq)) {
          continue;
        }
        if (dSq < minDistSq) {
          minDistSq = dSq;
          if (dSq <= (HEX_SIZE * 1.05) ** 2) {
            // Allow slightly larger click area
            clickedHex = hex;
          }
        }
      }
      return clickedHex;
    },
    [axialToPixel]
  ); // axialToPixel is stable

  // --- Main Drawing Function ---
  const drawGrid = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    if (!ctx || width === 0 || height === 0) {
      return;
    }
    const currentHoverId = hoveredHexIdRef.current;
    const currentOffset = currentOffsetRef.current;
    const currentZoom = zoom;
    if (
      !isSafeNumber(currentOffset.x) ||
      !isSafeNumber(currentOffset.y) ||
      !isSafeNumber(currentZoom) ||
      currentZoom <= 0
    ) {
      return;
    }

    try {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + currentOffset.x, height / 2 + currentOffset.y);
      ctx.scale(currentZoom, currentZoom);

      HEX_GRID_COORDS.forEach((hex) => {
        const p = axialToPixel(hex.q, hex.r);
        if (!p) return;
        const { x, y } = p;
        let fillColor = DEFAULT_COLOR;
        let isHovered = hex.id === currentHoverId;
        let isSelected =
          currentSolutionIndex === -1 && selectedTiles.has(hex.id);
        let strokeStyle = STROKE_COLOR_DEFAULT;

        const colorIndex = gridState[hex.id];
        if (
          colorIndex !== -1 &&
          colorIndex >= 0 &&
          colorIndex < HEX_COLORS.length
        ) {
          fillColor = HEX_COLORS[colorIndex];
          strokeStyle = STROKE_COLOR_ACTIVE;
        } else if (isSelected) {
          fillColor = SELECTED_COLOR;
          strokeStyle = STROKE_COLOR_ACTIVE;
        } else if (isHovered && currentSolutionIndex === -1) {
          fillColor = HOVER_COLOR;
        }

        drawHexagon(ctx, x, y, HEX_SIZE, fillColor, 1, strokeStyle);
      });
      ctx.restore();
    } catch (e) {
      console.error("Error during drawGrid exec:", e);
      try {
        ctx.restore();
      } catch (restoreError) {
        console.error(
          "Failed to restore context after drawGrid error:",
          restoreError
        );
      }
    }
  }, [
    axialToPixel,
    drawHexagon,
    currentSolutionIndex,
    gridState,
    selectedTiles,
    zoom,
  ]); // Dependencies seem correct

  // --- RAF Scheduler ---
  const scheduleDraw = useCallback(() => {
    if (!isClient) return;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    animationFrameIdRef.current = requestAnimationFrame(drawGrid);
  }, [isClient, drawGrid]); // drawGrid is stable

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
        HEX_GRID_COORDS.forEach((hex) => {
          const p = axialToPixel(hex.q, hex.r);
          if (p) {
            minX = Math.min(minX, p.x - HEX_WIDTH / 2);
            maxX = Math.max(maxX, p.x + HEX_WIDTH / 2);
            minY = Math.min(minY, p.y - HEX_HEIGHT / 2);
            maxY = Math.max(maxY, p.y + HEX_HEIGHT / 2);
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
            scheduleDraw();
            return;
          }
        }
      }
      scheduleDraw();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    return () => resizeObserver.disconnect();
  }, [isClient, axialToPixel, scheduleDraw]); // Dependencies seem correct
  useEffect(() => {
    if (isClient) {
      scheduleDraw();
    }
  }, [
    isClient,
    zoom,
    selectedTiles,
    gridState,
    currentSolutionIndex,
    scheduleDraw,
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
      const delta = e.deltaY * ZOOM_SENSITIVITY;
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
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, potentialNewZoom));
      if (newZoom === currentZoom) return;
      const worldXAfterZoom = worldXBefore * newZoom;
      const worldYAfterZoom = worldYBefore * newZoom;
      const newOffsetX = mouseX - canvas.width / 2 - worldXAfterZoom;
      const newOffsetY = mouseY - canvas.height / 2 - worldYAfterZoom;
      if (!isSafeNumber(newOffsetX) || !isSafeNumber(newOffsetY)) return;
      setZoom(newZoom);
      currentOffsetRef.current = { x: newOffsetX, y: newOffsetY };
      // scheduleDraw(); // Draw is handled by the main scheduleDraw effect reacting to zoom change
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
      const world = screenToWorld(mX, mY, canvas.width, canvas.height);
      const hexUnderMouse = world ? getHexAtPoint(world.x, world.y) : null;
      const newHoverId = hexUnderMouse ? hexUnderMouse.id : null;
      if (newHoverId !== hoveredHexIdRef.current) {
        hoveredHexIdRef.current = newHoverId;
        needsManualRedraw = true; // Hover change needs explicit redraw
      }

      // Handle dragging (updates ref directly, needs explicit redraw)
      if (isDragging) {
        const nX = (e.clientX - dragStart.x) * PAN_SENSITIVITY;
        const nY = (e.clientY - dragStart.y) * PAN_SENSITIVITY;
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
        scheduleDraw(); // Schedule draw only if hover or offset changed
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
        scheduleDraw(); // Schedule draw needed to clear hover effect
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
      const world = screenToWorld(
        screenX,
        screenY,
        currentCanvas.width,
        currentCanvas.height
      );
      if (!world) return;
      const clickedHex = getHexAtPoint(world.x, world.y);
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
              const neighbors = ADJACENT_LIST[clickedId] || [];
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
    screenToWorld,
    getHexAtPoint,
    scheduleDraw, // Stable callbacks
    currentSolutionIndex,
    setSelectedTiles, // State/Setters used in click handler
    // ADJACENT_LIST is constant
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
      const neighbors = ADJACENT_LIST[currentTile] || [];
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
  }, []); // ADJACENT_LIST is constant

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
    for (let i = 1; i <= TOTAL_TILES; i++) {
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

  const handleSolve = useCallback(() => {
    if (potentials.length === 0) {
      toast.error("Save or add at least one potential shape first.", {
        duration: 3000,
      });
      return;
    }
    // Ensure all saved potentials are valid 4-tile shapes before solving
    const invalidPotential = potentials.find(
      (p) => Array.from(p).filter((c) => c === "1").length !== 4
    );
    if (invalidPotential) {
      toast.error(
        "Solver currently only works with 4-tile potential shapes. Please remove shapes that are not size 4.",
        { duration: 6000 }
      );
      return;
    }

    solverWorkerRef.current?.terminate(); // Terminate previous worker if any
    setIsSolving(true);
    setBestSolutions([]);
    setCurrentSolutionIndex(-1);
    setSelectedTiles(new Set()); // Clear selection when solving starts
    setGridState(Array(TOTAL_TILES + 1).fill(-1)); // Reset grid visually
    setSolveProgress(0);
    toast.info("Solving in background...", {
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
        console.log(
          `[Main] Worker finished. Searched: ${searchedCount}. Found ${
            coloredBestSolutions?.length || 0
          } best.`
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
    solverWorkerRef.current.postMessage({ potentials });
  }, [
    potentials,
    setIsSolving,
    setBestSolutions,
    setCurrentSolutionIndex,
    setSelectedTiles,
    setGridState,
    setSolveProgress,
  ]); // Dependencies seem correct

  useEffect(() => {
    // Effect to update grid when solution changes
    if (currentSolutionIndex !== -1 && bestSolutions[currentSolutionIndex]) {
      setGridState(bestSolutions[currentSolutionIndex]);
    } else {
      // Ensure grid resets if we go back to edit mode or have no solutions
      setGridState(Array(TOTAL_TILES + 1).fill(-1));
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
    setGridState(Array(TOTAL_TILES + 1).fill(-1));
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
    setGridState(Array(TOTAL_TILES + 1).fill(-1));
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
      HEX_GRID_COORDS.forEach((hex) => {
        const p = axialToPixel(hex.q, hex.r);
        if (p) {
          minX = Math.min(minX, p.x - HEX_WIDTH / 2);
          maxX = Math.max(maxX, p.x + HEX_WIDTH / 2);
          minY = Math.min(minY, p.y - HEX_HEIGHT / 2);
          maxY = Math.max(maxY, p.y + HEX_HEIGHT / 2);
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
    axialToPixel,
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
    (canvas: HTMLCanvasElement, potentialString: string) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const tileIds: number[] = [];
      for (let i = 0; i < potentialString.length; i++) {
        if (potentialString.charAt(i) === "1") {
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
          const hex = HEX_GRID_COORDS.find((h) => h.id === id);
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
      const previewHexSize = 8;
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
          ctx.lineWidth = previewLineWidth;
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
          SELECTED_COLOR,
          STROKE_COLOR_ACTIVE
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
        const shapeString = PREDEFINED_SHAPES[index];
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

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Shape Doctor
          </h1>
          <p className="text-muted-foreground">
            "Ain't nobody got time for that!"
          </p>
        </div>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
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
                    ? `Viewing solution ${currentSolutionIndex + 1} / ${
                        bestSolutions.length
                      }.`
                    : "Click to select (max 4), Save, Solve. Wheel=Zoom, Drag=Pan."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-0 overflow-hidden relative">
                <div
                  ref={containerRef}
                  className={`w-full h-full min-h-[400px] bg-gray-100 ${CANVAS_BG_DARK} relative rounded-b-md`}
                >
                  {isClient ? (
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full touch-none will-change-transform rounded-b-md"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Loading Canvas...
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
                      onClick={() =>
                        setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))
                      }
                      aria-label="Zoom In"
                    >
                      {" "}
                      <ZoomIn className="h-4 w-4" />{" "}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
                      onClick={() =>
                        setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))
                      }
                      aria-label="Zoom Out"
                    >
                      {" "}
                      <ZoomOut className="h-4 w-4" />{" "}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
                      onClick={handleReset}
                      aria-label="Reset View & Zoom"
                    >
                      {" "}
                      <Move className="h-4 w-4" />{" "}
                    </Button>
                  </div>
                  {isSolving && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none">
                      <div className="max-w-md mx-auto text-center">
                        <Progress
                          value={undefined}
                          className="h-2 [&>div]:bg-violet-500"
                        />
                        <p className="text-xs mt-1 text-slate-300 font-mono">
                          {" "}
                          Solving... Explored {formattedProgress} states{" "}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-center p-3 flex-shrink-0 border-t border-border/50">
                {currentSolutionIndex !== -1 ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
                      onClick={handlePrevSolution}
                      disabled={bestSolutions.length <= 1 || isSolving}
                    >
                      {" "}
                      <ArrowLeft className="h-4 w-4 mr-1" /> Prev{" "}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
                      onClick={handleNextSolution}
                      disabled={bestSolutions.length <= 1 || isSolving}
                    >
                      {" "}
                      Next <ArrowRight className="h-4 w-4 ml-1" />{" "}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] transition-colors hover:bg-[hsl(var(--primary)_/_0.9)] cursor-pointer"
                      onClick={handleBackToEdit}
                      disabled={isSolving}
                    >
                      {" "}
                      Back to Edit{" "}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)_/_0.9)] transition-colors cursor-pointer"
                      onClick={handleSavePotential}
                      disabled={
                        isSolving ||
                        selectedTiles.size === 0 ||
                        selectedTiles.size > 4
                      }
                    >
                      {" "}
                      <Save className="h-4 w-4 mr-1" /> Save (
                      {selectedTiles.size}/4){" "}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
                      onClick={handleClearSelection}
                      disabled={isSolving || selectedTiles.size === 0}
                    >
                      {" "}
                      <XOctagon className="h-4 w-4 mr-1" /> Clear Sel.{" "}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-primary-foreground min-w-[90px] transition-colors cursor-pointer"
                      onClick={handleSolve}
                      disabled={isSolving || potentials.length === 0}
                    >
                      {isSolving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      {isSolving ? "Solving..." : "Solve"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
             <Card className="flex-shrink-0 bg-card">
               <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
                     <HelpCircle className="h-5 w-5 text-violet-400" /> Status & Actions
                  </CardTitle>
                   <CardDescription className="text-xs">Current status, instructions, and global reset.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 text-sm">
                  <div className="space-y-1 text-card-foreground">
                      <div className="flex justify-between">
                          <span>Saved Potentials:</span>
                          <span className="font-semibold">{potentials.length}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Best Solutions:</span>
                          <span className="font-semibold">{bestSolutions.length}</span>
                      </div>
                      {currentSolutionIndex !== -1 && (
                          <>
                              <div className="flex justify-between">
                                  <span>Viewing Solution:</span>
                                  <span>{currentSolutionIndex + 1} / {bestSolutions.length}</span>
                              </div>
                              {bestSolutions[currentSolutionIndex] && (
                                  <div className="flex justify-between">
                                      <span>Empty Tiles:</span>
                                      <span className="font-semibold">
                                          {bestSolutions[currentSolutionIndex].slice(1).filter(t => t === -1).length}
                                      </span>
                                  </div>
                              )}
                          </>
                      )}
                  </div>
                  <div className="border-t border-border/50 pt-3">
                      <h3 className="font-medium mb-1 text-card-foreground text-sm">How to Use</h3>
                      <ol className="text-muted-foreground space-y-0.5 list-decimal pl-4 text-xs">
                          <li>Select up to 4 connected hexes OR browse "Predefined Shapes" tab.</li>
                          <li>Manually selected shapes: Click "Save Potential".</li>
                          <li>Added/Saved shapes appear in "Saved Potentials" tab.</li>
                          <li>Click "Solve" to find placements for saved potentials.</li>
                          <li>Use Next/Prev to view solutions on the grid.</li>
                          <li>Wheel=Zoom, Drag=Pan grid.</li>
                      </ol>
                   </div>
               </CardContent>
             </Card>
             <Tabs defaultValue="predefined" className="flex-grow min-h-0 flex flex-col">
               <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4">
                 <TabsTrigger value="predefined" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
                   <Library className="h-4 w-4 mr-1" /> Predefined
                 </TabsTrigger>
                 <TabsTrigger value="saved" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
                   <Save className="h-4 w-4 mr-1" /> Saved ({potentials.length})
                 </TabsTrigger>
               </TabsList>

               <TabsContent
                 value="predefined"
                 className="flex-grow min-h-0 overflow-y-auto mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-3 bg-card border border-border scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent"
               >
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                     {isClient && PREDEFINED_SHAPES.map((shapeString, index) => (
                         <Button
                            key={`predefined-${index}`}
                            variant="outline"
                            size="icon"
                            className="w-14 h-14 p-1 border-[hsl(var(--border)_/_0.5)] text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--primary))] cursor-pointer"
                            onClick={() => handleAddPredefinedPotential(shapeString)}
                            disabled={isSolving}
                            aria-label={`Add predefined shape ${index + 1}`}
                        >
                            <canvas
                                ref={(el) => setPredefinedCanvasRef(index, el)}
                                width="48"
                                height="48"
                                className={`border-none rounded-sm ${PREVIEW_BG}`}
                            />
                        </Button>
                     ))}
                      {!isClient && Array.from({ length: 12 }).map((_, i) => (
                         <div key={`skel-predefined-${i}`} className="w-14 h-14 bg-muted/50 rounded animate-pulse"></div>
                     ))}
                 </div>
               </TabsContent>

               <TabsContent
                 value="saved"
                 className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-3 bg-card border border-border"
               >
                 {potentials.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-[calc(7*(48px+theme(spacing.2)))] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent pr-1">
                        {potentials.map((potentialString, index) => (
                            <div key={`saved-${index}`} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border/50 group flex-shrink-0">
                                <div className="flex-shrink-0 w-[48px] h-[48px]">
                                    <canvas
                                        ref={(el) => setPotentialCanvasRef(index, el)}
                                        width="48"
                                        height="48"
                                        className={`border rounded ${PREVIEW_BG}`}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0 h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)_/_0.1)] opacity-50 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity transition-colors cursor-pointer"
                                    onClick={() => handleDeletePotential(index)}
                                    disabled={isSolving}
                                    aria-label={`Delete potential ${index + 1}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                         No potentials saved yet. Select tiles or add from "Predefined".
                    </div>
                 )}
               </TabsContent>
             </Tabs>
          </div>
        </div>
        <footer className="text-center text-xs text-muted-foreground mt-auto pt-8 flex-shrink-0">
          Special Thanks to OGWaffle for the original concept and logic!
        </footer>
      </div>
    </>
  );
}
