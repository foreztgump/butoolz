"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle, Loader2 } from "lucide-react";
import { SolutionRecord } from '../types';

interface StatusPanelProps {
  potentialsCount: number;
  solutionsList: SolutionRecord[];
  currentSolutionIndex: number;
  isSolving: boolean;
  lockedTilesCount: number;
  availableTiles: number;
  currentSolver: 'exact' | 'maximal' | null;
  solverError: string | null;
  solveProgress: number;
  totalCombinations: number;
  combinationsChecked: number;
  isExactTilingMode: boolean;
  solverStatusMessage: string | null;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  potentialsCount,
  solutionsList,
  currentSolutionIndex,
  isSolving,
  lockedTilesCount,
  availableTiles,
  currentSolver,
  solverError,
  solveProgress,
  totalCombinations,
  combinationsChecked,
  isExactTilingMode,
  solverStatusMessage,
}) => {
  const viewingSolution = currentSolutionIndex !== -1 && solutionsList[currentSolutionIndex];

  return (
    <Card className="flex-shrink-0 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
          <HelpCircle className="h-5 w-5 text-violet-400" /> Status & Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status Display */}
        <div className="space-y-1 text-card-foreground">
          <div className="flex justify-between">
            <span>Saved Potentials:</span>
            <span className="font-semibold">{potentialsCount}</span>
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
            <>
              <div className="flex justify-between text-sm text-blue-500">
                <span>Status:</span>
                <span className="font-semibold flex items-center">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> 
                    {currentSolver === 'maximal' && solverStatusMessage 
                        ? solverStatusMessage 
                        : `Solving (${currentSolver ?? '...'})`}
                </span>
              </div>
              {isExactTilingMode && (
                  <div className="flex justify-between text-xs text-blue-400 pl-2">
                      <span>Combinations:</span>
                      <span className="font-mono">
                         {combinationsChecked.toLocaleString()} / {totalCombinations > 0 ? totalCombinations.toLocaleString() : '?'} ({solveProgress}%)
                      </span>
                  </div>
              )}
            </>
          )}
          {solverError && (
             <div className="flex justify-between text-sm text-red-500">
              <span>Solver Status:</span>
              <span className="font-semibold truncate" title={solverError}>{solverError}</span>
            </div>
          )}
          {solutionsList.length > 0 && (
            <div className="flex justify-between">
              <span>Solutions Found:</span>
              <span className="font-semibold">{solutionsList.length}</span>
            </div>
          )}
          {viewingSolution && (
            <>
              <div className="border-t border-border/50 pt-2 mt-2"></div>
              <div className="flex justify-between">
                <span>Viewing Solution:</span>
                <span>
                  {currentSolutionIndex + 1} / {solutionsList.length}
                </span>
              </div>
              {currentSolver === 'maximal' && (
                <div className="flex justify-between">
                  <span>Max Shapes (K):</span>
                  <span className="font-semibold">
                    {solutionsList[currentSolutionIndex]?.maxShapes ?? 'N/A'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Placed Shapes:</span>
                <span className="font-semibold">
                    {solutionsList[currentSolutionIndex].placements.length}
                </span>
              </div>
              <div className="flex justify-between">
                  <span>Empty Tiles:</span>
                  <span className="font-semibold">
                      {availableTiles - (solutionsList[currentSolutionIndex].placements.length * 4)}
                  </span>
              </div>
            </>
          )}
        </div>

        {/* Remove Instructions */}
        {/* 
        <div className=\"border-t border-border/50 pt-3\">
          <h3 className=\"font-medium mb-1 text-card-foreground text-sm\">
            How to Use
          </h3>
          <ol className=\"text-muted-foreground space-y-0.5 list-decimal pl-4 text-xs\">
            <li>Click tiles to select up to 4 connected hexes.</li>
            <li>Click lockable tiles (purple outline) to lock/unlock.</li>
            <li>Click \"Save (x/4)\" to save selection to \"Saved Potentials\".</li>
            <li>Or, add from \"Predefined Shapes\".</li>
            <li>Click \"Solve\" to find placements.</li>
            <li>Use Next/Prev to view solutions.</li>
            <li>Click \"Back to Edit\" to clear the solution view.</li>
            <li>Click \"Reset All\" to clear everything.</li>
            <li>Wheel=Zoom, Drag=Pan grid.</li>
          </ol>
        </div> 
        */}
      </CardContent>
    </Card>
  );
};

export default StatusPanel; 