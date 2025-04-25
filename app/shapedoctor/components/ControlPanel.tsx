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
  Ban,
} from "lucide-react";
import { SolutionRecord } from "../types";

interface ControlPanelProps {
  currentSolutionIndex: number;
  solutionsList: SolutionRecord[];
  isSolving: boolean;
  selectedTiles: Set<number>;
  potentialsCount: number;
  handleSavePotential: () => void;
  handleClearSelection: () => void;
  handleResetAll: () => void;
  handleSolve: () => void;
  handlePrevSolution: () => void;
  handleNextSolution: () => void;
  handleBackToEdit: () => void;
  selectedTilesCount: number;
  handleCancelSolve: () => void;
  solveProgress: number;
  currentSolver: string | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentSolutionIndex,
  solutionsList,
  isSolving,
  selectedTiles,
  potentialsCount,
  handleSavePotential,
  handleClearSelection,
  handleResetAll,
  handleSolve,
  handlePrevSolution,
  handleNextSolution,
  handleBackToEdit,
  selectedTilesCount,
  handleCancelSolve,
  solveProgress,
  currentSolver,
}) => {
  const isViewingAnySolution = currentSolutionIndex !== -1 && solutionsList.length > 0;
  const solutionTypeLabel = currentSolver === 'exact' ? "Exact Tiling" : "Max Placement";

  return (
    <CardFooter className="flex flex-wrap gap-2 justify-center p-3 flex-shrink-0 border-t border-border/50">
      {isViewingAnySolution ? (
        <>
          <span className="text-sm text-muted-foreground px-2">
            {solutionTypeLabel} Solution: {currentSolutionIndex + 1} / {solutionsList.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handlePrevSolution}
            disabled={solutionsList.length <= 1 || isSolving}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handleNextSolution}
            disabled={solutionsList.length <= 1 || isSolving}
          >
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] transition-colors hover:bg-[hsl(var(--primary)_/_0.9)] cursor-pointer"
            onClick={handleBackToEdit}
            disabled={isSolving}
          >
            Back to Edit
          </Button>
        </>
      ) : isSolving ? (
        <>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelSolve}
            className="min-w-[90px] bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
          >
            <Ban className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <span className="text-sm text-muted-foreground px-2 flex items-center">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Solving ({currentSolver ?? '...'})
          </span>
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
            <Save className="h-4 w-4 mr-1" /> Save ({selectedTilesCount}/4)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handleClearSelection}
            disabled={selectedTilesCount === 0}
          >
            <XOctagon className="h-4 w-4 mr-1" /> Clear Sel.
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="text-[hsl(var(--destructive-foreground))] transition-colors hover:bg-[hsl(var(--destructive)_/_0.9)] cursor-pointer"
            onClick={handleResetAll}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset All
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary-foreground min-w-[90px] transition-colors cursor-pointer shadow-md"
            onClick={handleSolve}
            disabled={potentialsCount === 0}
          >
            <>
              <Play className="h-4 w-4 mr-1" /> Solve
            </>
          </Button>
        </>
      )}
    </CardFooter>
  );
};

export default ControlPanel; 