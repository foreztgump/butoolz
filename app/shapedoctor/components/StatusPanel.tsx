"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import * as Config from '../shapedoctor.config'; // Adjust import path
import { SolutionRecord } from '../types';

interface StatusPanelProps {
  potentials: string[];
  bestSolutions: SolutionRecord[];
  currentSolutionIndex: number;
  isSolving: boolean;
  handleSolve: (testPotentials?: string[]) => void; // Accepts optional test set
  lockedTilesCount: number;
  availableTiles: number;
  currentSolver: 'exact' | 'maximal' | null;
  solverError: string | null;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  potentials,
  bestSolutions,
  currentSolutionIndex,
  isSolving,
  handleSolve,
  lockedTilesCount,
  availableTiles,
  currentSolver,
  solverError,
}) => {
  return (
    <Card className="flex-shrink-0 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
          <HelpCircle className="h-5 w-5 text-violet-400" /> Status & Actions
        </CardTitle>
        <CardDescription className="text-xs">
          Current status, instructions, and global reset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Status Display */}
        <div className="space-y-1 text-card-foreground">
          <div className="flex justify-between">
            <span>Saved Potentials:</span>
            <span className="font-semibold">{potentials.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Available Tiles:</span>
            <span className="font-semibold">{availableTiles}</span>
          </div>
          <div className="flex justify-between">
            <span>Locked Tiles:</span>
            <span className="font-semibold">{lockedTilesCount}</span>
          </div>
          {isSolving && (
            <div className="flex justify-between text-sm text-blue-500">
              <span>Solving Status:</span>
              <span className="font-semibold">{currentSolver ? `Running ${currentSolver} solver...` : 'Initiating...'}</span>
            </div>
          )}
          {solverError && (
             <div className="flex justify-between text-sm text-red-500">
              <span>Solver Error:</span>
              <span className="font-semibold truncate" title={solverError}>{solverError}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Best Solutions:</span>
            <span className="font-semibold">{bestSolutions.length}</span>
          </div>
          {currentSolutionIndex !== -1 && bestSolutions[currentSolutionIndex] && (
            <>
              <div className="flex justify-between">
                <span>Viewing Solution:</span>
                <span>
                  {currentSolutionIndex + 1} / {bestSolutions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Placed Shapes:</span>
                <span className="font-semibold">
                    {bestSolutions[currentSolutionIndex].placements.length}
                </span>
              </div>
              <div className="flex justify-between">
                  <span>Empty Tiles:</span>
                  <span className="font-semibold">
                      {availableTiles - (bestSolutions[currentSolutionIndex].placements.length * 4)}
                  </span>
              </div>
            </>
          )}
        </div>

        {/* Profiling Buttons */}
        <div className="border-t border-border/50 pt-3">
          <h3 className="font-medium mb-2 text-card-foreground text-sm">
            Run Solver Profile
          </h3>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 25].map((num) => (
              <Button
                key={`profile-${num}`}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const testSet = Config.PREDEFINED_SHAPES.slice(0, num);
                  if (testSet.length < num) {
                    toast.error(
                      `Not enough predefined shapes for ${num} test.`
                    );
                  } else {
                    handleSolve(testSet); // Call handleSolve with the test set
                  }
                }}
                disabled={isSolving}
              >
                Profile {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t border-border/50 pt-3">
          <h3 className="font-medium mb-1 text-card-foreground text-sm">
            How to Use
          </h3>
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
  );
};

export default StatusPanel; 