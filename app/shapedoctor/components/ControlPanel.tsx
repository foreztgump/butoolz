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
} from "lucide-react";

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
}) => {
  return (
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
            <ArrowLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
            onClick={handleNextSolution}
            disabled={bestSolutions.length <= 1 || isSolving}
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
  );
};

export default ControlPanel; 