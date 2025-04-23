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
  onSolveBacktracking: () => void;
  onFindExactTiling: () => void;
  isFindingExactTiling: boolean;
  exactTilingSolutions: SolutionRecord[];
  currentExactTilingIndex: number;
  handlePrevExactTilingSolution: () => void;
  handleNextExactTilingSolution: () => void;
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
  onSolveBacktracking,
  onFindExactTiling,
  isFindingExactTiling,
  exactTilingSolutions,
  currentExactTilingIndex,
  handlePrevExactTilingSolution,
  handleNextExactTilingSolution,
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
            className="bg-blue-600 hover:bg-blue-700 text-primary-foreground min-w-[90px] transition-colors cursor-pointer"
            onClick={onSolveBacktracking}
            disabled={isSolving || isFindingExactTiling || potentialsCount === 0}
          >
            {isSolving ? (
              <>
                <Snowflake className="h-4 w-4 mr-1 animate-spin" /> Solving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" /> Solve (Max Placement)
              </>
            )}
          </Button>
          {potentialsCount >= 11 && (
            <Button
              onClick={onFindExactTiling}
              disabled={isSolving || isFindingExactTiling || potentialsCount < 11}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white col-span-1"
              title="Find perfect tilings using exactly 11 shapes"
              aria-label="Find exact 11-shape tilings"
            >
              {isFindingExactTiling ? (
                <>
                  <SearchCode className="h-4 w-4 mr-1 animate-pulse" /> Searching...
                </>
              ) : (
                <>
                  <Puzzle className="h-4 w-4 mr-1" /> Find Exact 11-Tilings
                </>
              )}
            </Button>
          )}
        </>
      )}
    </CardFooter>
  );
};

export default ControlPanel; 