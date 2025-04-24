"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Library, Save, Trash2 } from "lucide-react";
import * as Config from '../shapedoctor.config'; // Adjust import path

interface ResultsTabsProps {
  isClient: boolean;
  potentials: string[];
  isSolving: boolean;
  setPredefinedCanvasRef: (
    index: number,
    element: HTMLCanvasElement | null
  ) => void;
  setPotentialCanvasRef: (
    index: number,
    element: HTMLCanvasElement | null
  ) => void;
  handleAddPredefinedPotential: (shapeString: string) => void;
  handleDeletePotential: (indexToDelete: number) => void;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({
  isClient,
  potentials,
  isSolving,
  setPredefinedCanvasRef,
  setPotentialCanvasRef,
  handleAddPredefinedPotential,
  handleDeletePotential,
}) => {
  return (
    <Tabs defaultValue="predefined" className="flex-grow min-h-0 flex flex-col">
      <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mb-4">
        <TabsTrigger
          value="predefined"
          className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer"
        >
          <Library className="h-4 w-4 mr-1" /> Predefined
        </TabsTrigger>
        <TabsTrigger
          value="saved"
          className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer"
        >
          <Save className="h-4 w-4 mr-1" /> Saved ({potentials.length})
        </TabsTrigger>
      </TabsList>

      {/* Predefined Shapes Tab */}
      <TabsContent
        value="predefined"
        className="flex-grow min-h-0 overflow-y-auto mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-3 bg-card border border-border scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent"
      >
        <div className="grid grid-cols-5 gap-2">
          {isClient &&
            Config.PREDEFINED_SHAPES.map((shapeString, index) => (
              <Button
                key={`predefined-${index}`}
                variant="ghost"
                size="icon"
                className="w-20 h-20 p-0 bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md cursor-pointer transition-colors duration-150"
                onClick={() => handleAddPredefinedPotential(shapeString)}
                disabled={isSolving}
                aria-label={`Add predefined shape ${index + 1}`}
              >
                <canvas
                  ref={(el) => setPredefinedCanvasRef(index, el)}
                  width="72"
                  height="72"
                  className="rounded-sm"
                />
              </Button>
            ))}
          {!isClient &&
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`skel-predefined-${i}`}
                className="w-20 h-20 bg-muted/50 rounded animate-pulse"
              ></div>
            ))}
        </div>
      </TabsContent>

      {/* Saved Potentials Tab */}
      <TabsContent
        value="saved"
        className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-3 bg-card border border-border"
      >
        {potentials.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 max-h-[calc(7*(48px+theme(spacing.2)))] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent pr-1">
            {potentials.map((potentialString, index) => (
              <div
                key={`saved-${index}`}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md border border-border/50 group flex-shrink-0"
              >
                <div className="flex-shrink-0 w-[48px] h-[48px]">
                  <canvas
                    ref={(el) => setPotentialCanvasRef(index, el)}
                    width="48"
                    height="48"
                    className={`border rounded ${Config.PREVIEW_BG}`}
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
  );
};

export default ResultsTabs; 