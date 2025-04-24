"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import {
  Save,
  XOctagon,
  Play,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trash2,
  SearchCode,
  Snowflake,
  Sparkles,
  Puzzle,
} from "lucide-react";
import { SolutionRecord } from "../types";

interface ControlPanelProps {
  currentSolutionIndex: number;
  bestSolutions: number[][];
  isSolving: boolean;
  selectedTiles: Set<number>;
  potentials: string[];
  handleSavePotential: () => void;
  handleClearSelection: () => void;
  handleSolve: () => void;
  handlePrevSolution: () => void;
  handleNextSolution: () => void;
  handleBackToEdit: () => void;
  selectedTilesCount: number;
  potentialsCount: number;
  isFindingExactTiling: boolean;
  exactTilingSolutions: SolutionRecord[];
  currentExactTilingIndex: number;
  handlePrevExactTilingSolution: () => void;
  handleNextExactTilingSolution: () => void;
  lockedTilesMask: bigint;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentSolutionIndex,
  bestSolutions,
  isSolving,
  selectedTiles,
  potentials,
  handleSavePotential,
  handleClearSelection,
  handleSolve,
  handlePrevSolution,
  handleNextSolution,
  handleBackToEdit,
  selectedTilesCount,
  potentialsCount,
  isFindingExactTiling,
  exactTilingSolutions,
  currentExactTilingIndex,
  handlePrevExactTilingSolution,
  handleNextExactTilingSolution,
  lockedTilesMask,
}) => {
  const isViewingBacktrackingSolution = currentSolutionIndex !== -1;
  const isViewingExactTilingSolution = currentExactTilingIndex !== -1;
  const isViewingAnySolution = isViewingBacktrackingSolution || isViewingExactTilingSolution;

  const activeSolutionIndex = isViewingBacktrackingSolution ? currentSolutionIndex : currentExactTilingIndex;
  const activeSolutionsCount = isViewingBacktrackingSolution ? bestSolutions.length : exactTilingSolutions.length;
  const handlePrev = isViewingBacktrackingSolution ? handlePrevSolution : handlePrevExactTilingSolution;
  const handleNext = isViewingBacktrackingSolution ? handleNextSolution : handleNextExactTilingSolution;
  const solutionTypeLabel = isViewingBacktrackingSolution ? "Max Placement" : "Exact Tiling";

  return (
    <CardFooter className="flex flex-wrap gap-2 justify-center p-3 flex-shrink-0 border-t border-border/50">
      {isViewingAnySolution ? (
        <>
          <span className="text-sm text-muted-foreground px-2">
            {solutionTypeLabel} Solution: {activeSolutionIndex + 1} / {activeSolutionsCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handlePrev}
            disabled={activeSolutionsCount <= 1 || isSolving || isFindingExactTiling}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handleNext}
            disabled={activeSolutionsCount <= 1 || isSolving || isFindingExactTiling}
          >
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] transition-colors hover:bg-[hsl(var(--primary)_/_0.9)] cursor-pointer"
            onClick={handleBackToEdit}
            disabled={isSolving || isFindingExactTiling}
          >
            Back to Edit
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
            <Save className="h-4 w-4 mr-1" /> Save ({selectedTiles.size}/4)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handleClearSelection}
            disabled={isSolving || selectedTiles.size === 0}
          >
            <XOctagon className="h-4 w-4 mr-1" /> Clear Sel.
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary-foreground min-w-[90px] transition-colors cursor-pointer shadow-md"
            onClick={handleSolve}
            disabled={isSolving || isFindingExactTiling || potentialsCount === 0}
          >
            {isSolving || isFindingExactTiling ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Solving...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> Solve
              </>
            )}
          </Button>
        </>
      )}
    </CardFooter>
  );
};

export default ControlPanel; 