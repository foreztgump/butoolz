"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import * as Config from '../shapedoctor.config'; // Adjust import path

interface ShapeCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isClient: boolean;
  isSolving: boolean;
  solveProgress: number;
  formattedProgress: string;
  zoom: number;
  setZoom: (updateFn: (currentZoom: number) => number) => void;
  handleReset: () => void; // Assuming handleReset resets zoom/pan
}

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  containerRef,
  canvasRef,
  isClient,
  isSolving,
  solveProgress,
  formattedProgress,
  zoom,
  setZoom,
  handleReset,
}) => {
  return (
    <CardContent className="flex-grow p-0 overflow-hidden relative">
      <div
        ref={containerRef}
        className={`w-full h-full min-h-[400px] bg-gray-100 ${Config.CANVAS_BG_DARK} relative rounded-b-md`}
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
        {/* Zoom/Pan Controls */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
            onClick={() =>
              setZoom((z) => Math.min(Config.MAX_ZOOM, z * 1.2))
            }
            aria-label="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
            onClick={() =>
              setZoom((z) => Math.max(Config.MIN_ZOOM, z / 1.2))
            }
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-[hsl(var(--card)_/_0.8)] text-[hsl(var(--card-foreground))] border-[hsl(var(--border)_/_0.5)] backdrop-blur-sm hover:bg-[hsl(var(--card)_/_0.9)] transition-colors cursor-pointer"
            onClick={handleReset} // Use the passed handler
            aria-label="Reset View & Zoom"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>
        {/* Solving Progress Indicator */}
        {isSolving && (
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none">
            <div className="max-w-md mx-auto text-center">
              <Progress
                value={undefined} // Use solveProgress if it's 0-1, otherwise maybe undefined for indeterminate
                className="h-2 [&>div]:bg-violet-500"
              />
              <p className="text-xs mt-1 text-slate-300 font-mono">
                Solving... Explored {formattedProgress} states
              </p>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default ShapeCanvas; 