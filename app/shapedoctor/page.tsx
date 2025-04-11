'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner'; // Ensure Toaster is imported
import {
  Puzzle, RefreshCw, HelpCircle, Save, Play, ArrowLeft, ArrowRight,
  ZoomIn, ZoomOut, Move, Trash2, XOctagon, Hand, Loader2
} from 'lucide-react';

// --- Constants & Config ---
const TOTAL_TILES = 24;
const MIN_ZOOM = 0.1; const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001; const PAN_SENSITIVITY = 1;

const HEX_COLORS = ["#8B5CF6", "#0D9488", "#DB2777", "#D97706", "#65A30D", "#0284C7"];
const DEFAULT_COLOR = "#374151"; const SELECTED_COLOR = "#A78BFA"; const HOVER_COLOR = "#4B5563";
const STROKE_COLOR_DEFAULT = "#6B7280"; const STROKE_COLOR_ACTIVE = "#D1D5DB";
const TILE_ID_COLOR_DEFAULT = "#9CA3AF"; const TILE_ID_COLOR_FILLED = "#FFFFFF";
const CANVAS_BG_DARK = "dark:bg-gray-900"; const PREVIEW_BG = "bg-background";

const HEX_SIZE = 30; const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE; const HEX_WIDTH = 2 * HEX_SIZE;

const HEX_GRID_COORDS = [ { id: 1, q: 0, r: 0 }, { id: 2, q: -1, r: 0 }, { id: 3, q: 1, r: -1 }, { id: 4, q: -2, r: 0 }, { id: 5, q: 0, r: -1 }, { id: 6, q: 2, r: -2 }, { id: 7, q: -1, r: -1 }, { id: 8, q: 1, r: -2 }, { id: 9, q: -2, r: -1 }, { id: 10, q: 0, r: -2 }, { id: 11, q: 2, r: -3 }, { id: 12, q: -1, r: -2 }, { id: 13, q: 1, r: -3 }, { id: 14, q: -2, r: -2 }, { id: 15, q: 0, r: -3 }, { id: 16, q: 2, r: -4 }, { id: 17, q: -1, r: -3 }, { id: 18, q: 1, r: -4 }, { id: 19, q: -2, r: -3 }, { id: 20, q: 0, r: -4 }, { id: 21, q: 2, r: -5 }, { id: 22, q: -1, r: -4 }, { id: 23, q: 1, r: -5 }, { id: 24, q: 0, r: -5 }, ];
const ADJACENT_LIST = [ [0, 0, 0, 0, 0, 0], [0, 0, 2, 5, 3, 0], [0, 0, 4, 7, 5, 1], [0, 1, 5, 8, 6, 0], [0, 0, 0, 9, 7, 2], [1, 2, 7, 10, 8, 3], [0, 3, 8, 11, 0, 0], [2, 4, 9, 12, 10, 5], [3, 5, 10, 13, 11, 6], [4, 0, 0, 14, 12, 7], [5, 7, 12, 15, 13, 8], [6, 8, 13, 16, 0, 0], [7, 9, 14, 17, 15, 10], [8, 10, 15, 18, 16, 11], [9, 0, 0, 19, 17, 12], [10, 12, 17, 20, 18, 13], [11, 13, 18, 21, 0, 0], [12, 14, 19, 22, 20, 15], [13, 15, 20, 23, 21, 16], [14, 0, 0, 0, 22, 17], [15, 17, 22, 24, 23, 18], [16, 18, 23, 0, 0, 0], [17, 19, 0, 0, 24, 20], [18, 20, 24, 0, 0, 21], [20, 22, 0, 0, 0, 23], ];
interface Point { x: number; y: number; }
interface HexCoord { id: number; q: number; r: number; }

export default function ShapeDoctor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const potentialCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const hoveredHexIdRef = useRef<number | null>(null);
  const currentOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);

  const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set());
  const [potentials, setPotentials] = useState<string[]>([]);
  const [solutions, setSolutions] = useState<number[][]>([]);
  const [bestSolutions, setBestSolutions] = useState<number[][]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);
  const [gridState, setGridState] = useState<number[]>(() => Array(TOTAL_TILES + 1).fill(-1));
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  const axialToPixel = useCallback((q: number, r: number): Point | null => { const x = HEX_SIZE * (3/2 * q); const y = HEX_SIZE * ( (Math.sqrt(3)/2) * q + Math.sqrt(3) * r ); if (!Number.isFinite(x) || !Number.isFinite(y)) { return null; } return { x, y }; }, []);
  const screenToWorld = useCallback((screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): Point | null => { const currentOffset = currentOffsetRef.current; const currentZoom = zoom; if (!Number.isFinite(screenX) || !Number.isFinite(screenY) || !Number.isFinite(currentOffset.x) || !Number.isFinite(currentOffset.y) || !Number.isFinite(currentZoom) || currentZoom <= 0) { return null; } const x = (screenX - canvasWidth / 2 - currentOffset.x) / currentZoom; const y = (screenY - canvasHeight / 2 - currentOffset.y) / currentZoom; if (!Number.isFinite(x) || !Number.isFinite(y)) { return null; } return { x, y }; }, [zoom]);
  const drawHexagon = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fillColor: string, lineWidth: number = 1, strokeStyle: string) => { if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0) { return; } ctx.beginPath(); for (let i = 0; i < 6; i++) { const angle = (Math.PI / 3) * i; const xPos = x + size * Math.cos(angle); const yPos = y + size * Math.sin(angle); if (!Number.isFinite(xPos) || !Number.isFinite(yPos)) { ctx.closePath(); return; } if (i === 0) ctx.moveTo(xPos, yPos); else ctx.lineTo(xPos, yPos); } ctx.closePath(); try { ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = strokeStyle; const finalLineWidth = Math.max(0.5, lineWidth / zoom); if (!Number.isFinite(finalLineWidth)) { return; } ctx.lineWidth = finalLineWidth; ctx.stroke(); } catch (e) { console.error("Canvas fill/stroke error", e); } }, [zoom]);
  const getHexAtPoint = useCallback((worldX: number, worldY: number): HexCoord | null => { if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) { return null; } let clickedHex: HexCoord | null = null; let minDistSq = Infinity; for (const hex of HEX_GRID_COORDS) { const p = axialToPixel(hex.q, hex.r); if (!p) continue; const dSq = (p.x - worldX)**2 + (p.y - worldY)**2; if (!Number.isFinite(dSq)) { continue; } if (dSq < minDistSq) { minDistSq = dSq; if (dSq <= (HEX_SIZE * 1.05)**2) { clickedHex = hex; } } } return clickedHex; }, [axialToPixel]);

  // --- Main Drawing Function ---
  const drawGrid = useCallback(() => {
    if (animationFrameIdRef.current) { cancelAnimationFrame(animationFrameIdRef.current); animationFrameIdRef.current = null; }
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const currentHoverId = hoveredHexIdRef.current; const currentOffset = currentOffsetRef.current; const currentZoom = zoom;
    const { width, height } = canvas; if (width === 0 || height === 0) { return; }
    if (!Number.isFinite(currentOffset.x) || !Number.isFinite(currentOffset.y) || !Number.isFinite(currentZoom) || currentZoom <= 0) { return; }

    try {
      ctx.clearRect(0, 0, width, height); ctx.save();
      ctx.translate(width / 2 + currentOffset.x, height / 2 + currentOffset.y); ctx.scale(currentZoom, currentZoom);

      HEX_GRID_COORDS.forEach((hex) => {
        const p = axialToPixel(hex.q, hex.r); if (!p) return; const { x, y } = p;
        let fillColor = DEFAULT_COLOR; let isHovered = hex.id === currentHoverId; let isSelected = currentSolutionIndex === -1 && selectedTiles.has(hex.id); let strokeStyle = STROKE_COLOR_DEFAULT;
        if (currentSolutionIndex !== -1 && gridState[hex.id] !== -1) { const idx = gridState[hex.id]; fillColor = HEX_COLORS[idx % HEX_COLORS.length]; strokeStyle = STROKE_COLOR_ACTIVE; }
        else if (isSelected) { fillColor = SELECTED_COLOR; strokeStyle = STROKE_COLOR_ACTIVE; }
        else if (isHovered && currentSolutionIndex === -1) { fillColor = HOVER_COLOR; }
        drawHexagon(ctx, x, y, HEX_SIZE, fillColor, 1, strokeStyle);

        // **** REMOVED TILE NUMBER DRAWING ****
        // if (Number.isFinite(x) && Number.isFinite(y)) {
        //   const textColor = (fillColor === DEFAULT_COLOR || fillColor === HOVER_COLOR) ? TILE_ID_COLOR_DEFAULT : TILE_ID_COLOR_FILLED;
        //   ctx.fillStyle = textColor;
        //   const fontSize = Math.max(8, Math.min(14, 12 / currentZoom));
        //   if (Number.isFinite(fontSize)) { ctx.font = `bold ${fontSize}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(hex.id.toString(), x, y); }
        // }
      });
      ctx.restore();
    } catch (e) { console.error("Error during drawGrid exec:", e); try { ctx.restore(); } catch (restoreError) {} }
  }, [axialToPixel, drawHexagon, currentSolutionIndex, gridState, selectedTiles, zoom]);

  // RAF Scheduler - Ensures only one draw is pending
  const scheduleDraw = useCallback(() => {
    if (!isClient) return;
    if (animationFrameIdRef.current) { cancelAnimationFrame(animationFrameIdRef.current); }
    animationFrameIdRef.current = requestAnimationFrame(drawGrid);
  }, [isClient, drawGrid]);

  // --- Effects ---
  useEffect(() => { setIsClient(true); return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); }; }, []);

  // Resize and Initial Center
  useEffect(() => { if (!isClient || !containerRef.current) return; const canvas = canvasRef.current; const container = containerRef.current; if (!canvas || !container) return; let initialOffsetSet = false; const handleResize = () => { const { width, height } = container.getBoundingClientRect(); if (width > 0 && height > 0) { canvas.width = width; canvas.height = height; } else { return; } if (!initialOffsetSet) { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; HEX_GRID_COORDS.forEach(hex => { const p = axialToPixel(hex.q, hex.r); if (p) { minX = Math.min(minX, p.x - HEX_WIDTH/2); maxX = Math.max(maxX, p.x + HEX_WIDTH/2); minY = Math.min(minY, p.y - HEX_HEIGHT/2); maxY = Math.max(maxY, p.y + HEX_HEIGHT/2); } }); if (Number.isFinite(minX) && maxX > minX && Number.isFinite(minY) && maxY > minY) { const cX = minX + (maxX-minX)/2; const cY = minY + (maxY-minY)/2; const iOffset = { x: -cX, y: -cY }; if (Number.isFinite(iOffset.x) && Number.isFinite(iOffset.y)) { currentOffsetRef.current = iOffset; initialOffsetSet = true; scheduleDraw(); return; } } } scheduleDraw(); }; const resizeObserver = new ResizeObserver(handleResize); resizeObserver.observe(container); handleResize(); return () => resizeObserver.disconnect(); }, [isClient, axialToPixel, scheduleDraw]);

  // Redraw on relevant state changes
  useEffect(() => { if (isClient) { scheduleDraw(); } }, [isClient, zoom, selectedTiles, gridState, currentSolutionIndex, scheduleDraw]);

  // Pan & Zoom Event Listeners
  useEffect(() => {
    if (!isClient) return; const canvas = canvasRef.current; if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect(); if (!rect || canvas.width === 0 || canvas.height === 0) return;
      const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
      const delta = e.deltaY * ZOOM_SENSITIVITY; if (!Number.isFinite(delta)) return;
      const currentZoom = zoom; const currentOffset = currentOffsetRef.current;
      const worldXBefore = (mouseX - canvas.width / 2 - currentOffset.x) / currentZoom;
      const worldYBefore = (mouseY - canvas.height / 2 - currentOffset.y) / currentZoom;
      if (!Number.isFinite(worldXBefore) || !Number.isFinite(worldYBefore)) return;
      let potentialNewZoom = currentZoom * (1 - delta);
      if (!Number.isFinite(potentialNewZoom) || potentialNewZoom <= 0) return;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, potentialNewZoom));
      if (newZoom === currentZoom) return;
      const worldXAfterZoom = worldXBefore * newZoom; const worldYAfterZoom = worldYBefore * newZoom;
      const newOffsetX = mouseX - canvas.width / 2 - worldXAfterZoom;
      const newOffsetY = mouseY - canvas.height / 2 - worldYAfterZoom;
      if (!Number.isFinite(newOffsetX) || !Number.isFinite(newOffsetY)) return;
      setZoom(newZoom); // Update state (triggers redraw effect)
      currentOffsetRef.current = { x: newOffsetX, y: newOffsetY }; // Update ref directly
      // scheduleDraw(); // No need, zoom state change triggers redraw
    };

    const handleMouseDown = (e: MouseEvent) => { if (e.button !== 0) return; setIsDragging(true); setDragStart({ x: e.clientX - currentOffsetRef.current.x, y: e.clientY - currentOffsetRef.current.y }); canvas.style.cursor = 'grabbing'; };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); if (!rect || canvas.width === 0 || canvas.height === 0) return;
      const mX = e.clientX - rect.left; const mY = e.clientY - rect.top; if (!Number.isFinite(mX) || !Number.isFinite(mY)) return;
      const world = screenToWorld(mX, mY, canvas.width, canvas.height);
      const hexUnderMouse = world ? getHexAtPoint(world.x, world.y) : null;
      const newHoverId = hexUnderMouse ? hexUnderMouse.id : null;
      let needsRedraw = false;
      if (newHoverId !== hoveredHexIdRef.current) { hoveredHexIdRef.current = newHoverId; needsRedraw = true; }
      if (isDragging) { const nX = (e.clientX - dragStart.x) * PAN_SENSITIVITY; const nY = (e.clientY - dragStart.y) * PAN_SENSITIVITY; if (Number.isFinite(nX) && Number.isFinite(nY)) { if(currentOffsetRef.current.x !== nX || currentOffsetRef.current.y !== nY) { currentOffsetRef.current = { x: nX, y: nY }; needsRedraw = true; } } }
      if (needsRedraw) { scheduleDraw(); }
    };

    const handleMouseUp = () => { if (isDragging) { setIsDragging(false); canvas.style.cursor = 'grab'; } };
    const handleMouseLeave = () => { if (isDragging) { setIsDragging(false); canvas.style.cursor = 'grab'; } if (hoveredHexIdRef.current !== null) { hoveredHexIdRef.current = null; scheduleDraw(); } };

    // Use Click for selection logic
    const handleClick = (e: MouseEvent) => {
        if (isDragging) return; // Ignore clicks part of a drag
        if (currentSolutionIndex !== -1) { toast.warning("Click 'Back to Edit' first.", { duration: 3000 }); return; }
        const canvas = canvasRef.current; if (!canvas || canvas.width === 0 || canvas.height === 0) return;
        const rect = canvas.getBoundingClientRect(); if(!rect) return;
        const screenX = (e.clientX - rect.left); const screenY = (e.clientY - rect.top);
        const world = screenToWorld(screenX, screenY, canvas.width, canvas.height); if (!world) return;
        const clickedHex = getHexAtPoint(world.x, world.y);
        if (clickedHex) {
            const clickedId = clickedHex.id;
            setSelectedTiles(prev => { // State update triggers redraw effect
                const newSelection = new Set(prev);
                if (newSelection.has(clickedId)) { newSelection.delete(clickedId); }
                else {
                    if (newSelection.size >= 4) { toast.warning("Max 4 tiles.", { duration: 3000 }); return prev; }
                    if (newSelection.size > 0) { const neighbors = ADJACENT_LIST[clickedId] || []; const isAdjacent = neighbors.some(neighborId => newSelection.has(neighborId)); if (!isAdjacent) { toast.warning("Tiles must be connected.", { duration: 3000 }); return prev; } }
                    newSelection.add(clickedId);
                }
                return newSelection;
            });
        }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false }); canvas.addEventListener('mousedown', handleMouseDown); canvas.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); canvas.addEventListener('mouseleave', handleMouseLeave); canvas.addEventListener('click', handleClick);
    canvas.style.cursor = 'grab';
    return () => { canvas.removeEventListener('wheel', handleWheel); canvas.removeEventListener('mousedown', handleMouseDown); canvas.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); canvas.removeEventListener('mouseleave', handleMouseLeave); canvas.removeEventListener('click', handleClick); if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [isClient, isDragging, dragStart, zoom, screenToWorld, getHexAtPoint, scheduleDraw, currentSolutionIndex]); // Dependencies


  // --- Core Solving Logic (No Changes) ---
  const countAdjacent = useCallback((tile: number, found: Set<number>, potential: string): void => { const adjacent = ADJACENT_LIST[tile]; for (const neighbor of adjacent) { if (neighbor !== 0 && potential.charAt(neighbor - 1) === '1') { if (!found.has(neighbor)) { found.add(neighbor); countAdjacent(neighbor, found, potential); } } } }, []);
  const checkPotential = useCallback((potential: string): number => { const found = new Set<number>(); for (let i = 0; i < potential.length; i++) { if (potential.charAt(i) === '1') { found.add(i + 1); countAdjacent(i + 1, found, potential); break; } } return found.size; }, [countAdjacent]);
  const fitPotential = useCallback((potentialIndex: number, currentSolution: number[], solutionOffset: number, potentialOffset: number, usedPotentialTiles: Set<number>): boolean => { const potentialString = potentials[potentialIndex]; let effectivePotentialOffset = potentialOffset; if (effectivePotentialOffset === -1) { for (let i = 0; i < potentialString.length; i++) { if (potentialString.charAt(i) === '1') { effectivePotentialOffset = i + 1; break; } } if (effectivePotentialOffset === -1) return false; } if (solutionOffset <= 0 || solutionOffset > TOTAL_TILES || currentSolution[solutionOffset] !== -1) return false; currentSolution[solutionOffset] = potentialIndex; usedPotentialTiles.add(effectivePotentialOffset); const potentialNeighbors = ADJACENT_LIST[effectivePotentialOffset]; const solutionNeighbors = ADJACENT_LIST[solutionOffset]; for (let j = 0; j < 6; j++) { const potentialNeighborTile = potentialNeighbors[j]; if (potentialNeighborTile !== 0 && potentialString.charAt(potentialNeighborTile - 1) === '1') { if (!usedPotentialTiles.has(potentialNeighborTile)) { const solutionNeighborTile = solutionNeighbors[j]; if (solutionNeighborTile === 0) return false; const result = fitPotential(potentialIndex, currentSolution, solutionNeighborTile, potentialNeighborTile, usedPotentialTiles); if (!result) return false; } } } return true; }, [potentials]);
  const solveRecursive = useCallback((currentSolution: number[], potentialIdxToTry: number, allSolutions: number[][], searchedStates: Set<string>): boolean => { const stateKey = JSON.stringify(currentSolution) + '|' + potentialIdxToTry; if (searchedStates.has(stateKey)) return false; searchedStates.add(stateKey); if (potentialIdxToTry >= potentials.length) { allSolutions.push([...currentSolution]); return true; } let placed = false, calledSub = false; for (let startTile = 1; startTile <= TOTAL_TILES; startTile++) { const temp = [...currentSolution]; const used = new Set<number>(); if (fitPotential(potentialIdxToTry, temp, startTile, -1, used)) { placed = true; calledSub = true; solveRecursive(temp, potentialIdxToTry + 1, allSolutions, searchedStates); } } calledSub = true; solveRecursive(currentSolution, potentialIdxToTry + 1, allSolutions, searchedStates); return placed || calledSub; }, [potentials, fitPotential]);

  // --- State Update Event Handlers (Single Toast Calls) ---
  const handleClearSelection = useCallback(() => { setSelectedTiles(new Set()); }, []);
  const handleSavePotential = useCallback(() => { if (selectedTiles.size !== 4) { toast.error('Select exactly 4 connected tiles.', { duration: 4000 }); return; } let potentialString = ''; for (let i = 1; i <= TOTAL_TILES; i++) { potentialString += selectedTiles.has(i) ? '1' : '0'; } if (checkPotential(potentialString) !== 4) { toast.error("Selected tiles must be connected.", { duration: 4000 }); return; } setPotentials(prev => [...prev, potentialString]); toast.success(`Potential ${potentials.length + 1} saved.`); setSelectedTiles(new Set()); }, [selectedTiles, potentials.length, checkPotential, toast]);
  const handleSolve = useCallback(() => { if (potentials.length === 0) { toast.error("Save at least one potential first.", { duration: 4000 }); return; } setIsSolving(true); setSolutions([]); setBestSolutions([]); setCurrentSolutionIndex(-1); setSelectedTiles(new Set()); setGridState(Array(TOTAL_TILES + 1).fill(-1)); toast.info("Solving...", { id: 'solving-toast' }); setTimeout(() => { const initialSolution = Array(TOTAL_TILES + 1).fill(-1); const allFound: number[][] = []; const searched = new Set<string>(); console.time('solveTime'); solveRecursive(initialSolution, 0, allFound, searched); console.timeEnd('solveTime'); setSolutions(allFound); let minEmpty = TOTAL_TILES + 1; let currentBest: number[][] = []; if (allFound.length > 0) { allFound.forEach(sol => { const empty = sol.slice(1).filter(t => t === -1).length; if (empty < minEmpty) { minEmpty = empty; currentBest = [sol]; } else if (empty === minEmpty) { if (!currentBest.some(ex => JSON.stringify(ex) === JSON.stringify(sol))) { currentBest.push(sol); } } }); } setBestSolutions(currentBest); setIsSolving(false); toast.dismiss('solving-toast'); if (currentBest.length > 0) { setCurrentSolutionIndex(0); toast.success(`Found ${currentBest.length} best solution(s).`, { duration: 5000 }); } else { toast.warning("No valid placement found.", { duration: 5000 }); } }, 50); }, [potentials, solveRecursive, toast]);
  useEffect(() => { if (currentSolutionIndex !== -1 && bestSolutions[currentSolutionIndex]) { setGridState(bestSolutions[currentSolutionIndex]); } else { setGridState(Array(TOTAL_TILES + 1).fill(-1)); } }, [currentSolutionIndex, bestSolutions]);
  const handleNextSolution = useCallback(() => { if (bestSolutions.length === 0) return; setCurrentSolutionIndex(prev => (prev + 1) % bestSolutions.length); setSelectedTiles(new Set()); }, [bestSolutions.length]);
  const handlePrevSolution = useCallback(() => { if (bestSolutions.length === 0) return; setCurrentSolutionIndex(prev => (prev - 1 + bestSolutions.length) % bestSolutions.length); setSelectedTiles(new Set()); }, [bestSolutions.length]);
  const handleBackToEdit = useCallback(() => { setSelectedTiles(new Set()); setGridState(Array(TOTAL_TILES + 1).fill(-1)); setCurrentSolutionIndex(-1); toast.info("Editing mode activated."); scheduleDraw(); }, [toast, scheduleDraw]);
  const handleReset = useCallback(() => { setSelectedTiles(new Set()); setPotentials([]); setSolutions([]); setBestSolutions([]); setCurrentSolutionIndex(-1); setGridState(Array(TOTAL_TILES + 1).fill(-1)); setIsSolving(false); let newOffset = { x: 0, y: 0 }; let newZoom = 1; const canvas = canvasRef.current; if (canvas) { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; HEX_GRID_COORDS.forEach(hex => { const p = axialToPixel(hex.q, hex.r); if (p) { minX = Math.min(minX, p.x - HEX_WIDTH/2); maxX = Math.max(maxX, p.x + HEX_WIDTH/2); minY = Math.min(minY, p.y - HEX_HEIGHT/2); maxY = Math.max(maxY, p.y + HEX_HEIGHT/2); } }); if (Number.isFinite(minX) && maxX > minX && Number.isFinite(minY) && maxY > minY) { const cX = minX + (maxX-minX)/2; const cY = minY + (maxY-minY)/2; const calculatedOffset = { x: -cX, y: -cY }; if(Number.isFinite(calculatedOffset.x) && Number.isFinite(calculatedOffset.y)) newOffset = calculatedOffset; } } currentOffsetRef.current = newOffset; // Update REF
  setZoom(newZoom); // Update zoom STATE
  toast.success("Reset complete."); potentialCanvasRefs.current.forEach(c => { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }); scheduleDraw(); }, [toast, axialToPixel, scheduleDraw]);

  // --- Potential Preview Drawing ---
  const drawPotential = useCallback((canvas: HTMLCanvasElement, potentialString: string) => { const ctx = canvas.getContext("2d"); if (!ctx) return; const { width, height } = canvas; ctx.clearRect(0, 0, width, height); const tileIds: number[] = []; for (let i = 0; i < potentialString.length; i++) { if (potentialString.charAt(i) === '1') { tileIds.push(i + 1); } } if (tileIds.length === 0) return; let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity; const potentialHexes = tileIds.map(id => { const hex = HEX_GRID_COORDS.find(h => h.id === id); if (hex) { minQ = Math.min(minQ, hex.q); maxQ = Math.max(maxQ, hex.q); minR = Math.min(minR, hex.r); maxR = Math.max(maxR, hex.r); } return hex; }).filter(Boolean) as HexCoord[]; const centerQ = (minQ + maxQ) / 2; const centerR = (minR + maxR) / 2; const previewHexSize = 8; const previewLineWidth = 0.5; const currentZoom = zoom; // Use current zoom state for calculation
  potentialHexes.forEach((hex) => { const p = axialToPixel(hex.q, hex.r); if (!p) return; const adjustedQ = hex.q - centerQ; const adjustedR = hex.r - centerR; const x = width / 2 + previewHexSize * ((3/2) * adjustedQ); const y = height / 2 + previewHexSize * ((Math.sqrt(3)/2) * adjustedQ + Math.sqrt(3) * adjustedR); // Use drawHexagon with zoom=1 logic baked in
  ctx.save(); ctx.scale(1/currentZoom, 1/currentZoom); drawHexagon(ctx, x * currentZoom, y * currentZoom, previewHexSize * currentZoom, SELECTED_COLOR, previewLineWidth * currentZoom, STROKE_COLOR_ACTIVE); ctx.restore(); }); }, [drawHexagon, zoom, axialToPixel]);
  const setPotentialCanvasRef = (index: number, element: HTMLCanvasElement | null) => { if (element) { potentialCanvasRefs.current.set(index, element); const potentialString = potentials[index]; if (potentialString) { drawPotential(element, potentialString); } } else { potentialCanvasRefs.current.delete(index); } };
  useEffect(() => { if(!isClient) return; potentials.forEach((pString, index) => { const canvas = potentialCanvasRefs.current.get(index); if (canvas) { drawPotential(canvas, pString); } }); }, [isClient, potentials, drawPotential]);
  const handleDeletePotential = useCallback((indexToDelete: number) => { setPotentials(prevPotentials => { potentialCanvasRefs.current.delete(indexToDelete); const updated = prevPotentials.filter((_, index) => index !== indexToDelete); toast.info(`Potential ${indexToDelete + 1} deleted.`); return updated; }); }, [toast]);

  // --- JSX Structure ---
  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen">
        <div className="mb-6 flex-shrink-0"> <h1 className="text-3xl font-bold tracking-tight text-white">Shape Doctor</h1> <p className="text-muted-foreground">Visualize and solve Bless Unleashed memory puzzle shapes.</p> </div>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="flex flex-col flex-grow bg-card">
              <CardHeader className="pb-3 flex-shrink-0"> <CardTitle className="text-lg flex items-center gap-2 text-card-foreground"> <Puzzle className="h-5 w-5 text-violet-400" /> Puzzle Grid </CardTitle> <CardDescription> {currentSolutionIndex !== -1 ? `Viewing solution ${currentSolutionIndex + 1} / ${bestSolutions.length}.` : "Click to select (4 max), Save, Solve. Wheel=Zoom, Drag=Pan."} </CardDescription> </CardHeader>
              <CardContent className="flex-grow p-0 overflow-hidden relative">
                <div ref={containerRef} className={`w-full h-full bg-gray-100 ${CANVAS_BG_DARK} relative rounded-b-md`}>
                  {isClient ? ( <canvas ref={canvasRef} /* onClick removed */ className="absolute top-0 left-0 w-full h-full touch-none will-change-transform rounded-b-md" /> ) : ( <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading Canvas...</div> )}
                  <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10"> <Button variant="outline" size="icon" className="h-7 w-7 bg-card/80 text-card-foreground border-border/50 backdrop-blur-sm hover:bg-card/90" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.2))} aria-label="Zoom In"> <ZoomIn className="h-4 w-4" /> </Button> <Button variant="outline" size="icon" className="h-7 w-7 bg-card/80 text-card-foreground border-border/50 backdrop-blur-sm hover:bg-card/90" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z / 1.2))} aria-label="Zoom Out"> <ZoomOut className="h-4 w-4" /> </Button> <Button variant="outline" size="icon" className="h-7 w-7 bg-card/80 text-card-foreground border-border/50 backdrop-blur-sm hover:bg-card/90" onClick={handleReset} aria-label="Reset View & Zoom"> <Move className="h-4 w-4" /> </Button> </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-center p-3 flex-shrink-0 border-t border-border/50">
                {currentSolutionIndex !== -1 ? (
                  <> <Button variant="outline" size="sm" onClick={handlePrevSolution} disabled={bestSolutions.length <= 1 || isSolving}> <ArrowLeft className="h-4 w-4 mr-1" /> Prev </Button> <Button variant="outline" size="sm" onClick={handleNextSolution} disabled={bestSolutions.length <= 1 || isSolving}> Next <ArrowRight className="h-4 w-4 ml-1" /> </Button> <Button variant="secondary" size="sm" onClick={handleBackToEdit} disabled={isSolving}> Back to Edit </Button> </>
                ) : (
                  <> <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-primary-foreground" onClick={handleSavePotential} disabled={isSolving || selectedTiles.size !== 4}> <Save className="h-4 w-4 mr-1" /> Save ({selectedTiles.size}/4) </Button> <Button variant="outline" size="sm" onClick={handleClearSelection} disabled={isSolving || selectedTiles.size === 0}> <XOctagon className="h-4 w-4 mr-1" /> Clear Selection </Button> <Button variant="default" size="sm" className="bg-violet-600 hover:bg-violet-700 text-primary-foreground min-w-[90px]" onClick={handleSolve} disabled={isSolving || potentials.length === 0} > {isSolving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />} {isSolving ? "Solving" : "Solve"} </Button> </>
                )}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4 lg:max-h-[calc(100vh-150px)]">
             <Card className="flex-shrink-0 bg-card">
               <CardHeader className="pb-3"> <CardTitle className="text-lg flex items-center gap-2 text-card-foreground"> <HelpCircle className="h-5 w-5 text-violet-400" /> Info & Status </CardTitle> </CardHeader>
               <CardContent className="space-y-4 text-sm">
                 <div> <h3 className="font-medium mb-1 text-card-foreground">How to Use</h3> <ol className="text-muted-foreground space-y-0.5 list-decimal pl-4 text-xs"> <li>Select 4 connected hexes.</li> <li>Save potential shape(s).</li> <li>Click Solve to find placements.</li> <li>Use Next/Prev to view solutions.</li> <li>Wheel=Zoom, Drag=Pan.</li> </ol> </div>
                 <div className="space-y-1 border-t border-border/50 pt-3 text-card-foreground"> <div className="flex justify-between"><span>Selected:</span><span className="font-mono text-xs ml-2 break-all text-right text-muted-foreground">{selectedTiles.size > 0 ? Array.from(selectedTiles).sort((a,b)=>a-b).join(", ") : "None"}</span></div> <div className="flex justify-between"><span>Saved Potentials:</span><span className="font-semibold">{potentials.length}</span></div> <div className="flex justify-between"><span>Best Solutions:</span><span className="font-semibold">{bestSolutions.length}</span></div> {currentSolutionIndex !== -1 && ( <> <div className="flex justify-between"><span>Viewing Solution:</span><span>{currentSolutionIndex + 1} / {bestSolutions.length}</span></div> {bestSolutions[currentSolutionIndex] && <div className="flex justify-between"><span>Empty Tiles:</span><span className="font-semibold">{bestSolutions[currentSolutionIndex].slice(1).filter(t=>t === -1).length}</span></div>} </> )} </div>
               </CardContent>
               <CardFooter className="border-t border-border/50 pt-3"> <Button variant="destructive" size="sm" className="w-full" onClick={handleReset} disabled={isSolving}> <RefreshCw className="h-4 w-4 mr-1" /> Reset Everything </Button> </CardFooter>
             </Card>
             {potentials.length > 0 && (
                <Card className="flex-grow overflow-hidden flex flex-col bg-card">
                    <CardHeader className="pb-2 flex-shrink-0"> <CardTitle className="text-base text-card-foreground">Saved Potentials ({potentials.length})</CardTitle> </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto space-y-2 pr-2 pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
                        {potentials.map((potentialString, index) => (
                            <div key={index} className="flex items-center justify-between gap-3 p-2 bg-muted/50 rounded-md border border-border/50 group">
                                <div className="flex items-center gap-2 flex-grow min-w-0"> <div className="flex-shrink-0 w-[48px] h-[48px]"> <canvas ref={(el) => setPotentialCanvasRef(index, el)} width="48" height="48" className={`border rounded ${PREVIEW_BG}`} /> </div> <div className="flex-grow min-w-0"> <div className="text-xs font-medium truncate text-card-foreground">Potential {index + 1}</div>
                                {/* **** REMOVED TILE ID LIST **** */}
                                {/* {(() => { const ids = []; for(let i=0; i<potentialString.length; i++) { if(potentialString[i] === '1') ids.push(i+1); } return <div className="text-[11px] text-muted-foreground font-mono break-all">Tiles: {ids.join(',')}</div>; })()} */}
                                </div> </div> <Button variant="ghost" size="icon" className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" onClick={() => handleDeletePotential(index)} aria-label={`Delete potential ${index + 1}`}> <Trash2 className="h-4 w-4" /> </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
             )}
          </div>
        </div>
        <footer className="text-center text-xs text-muted-foreground mt-auto pt-8 flex-shrink-0"> Special Thanks to OGWaffle for the original concept and logic! </footer>
      </div>
    </>
  );
}