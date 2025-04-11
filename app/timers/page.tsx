'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import useTimersStore from '../features/timers/store/timersStore';
import { timerPresets } from '../features/timers/data/timerPresets'; // Import the game-specific presets
import Timer from '../features/timers/components/Timer'; // Import the new Timer component
import type { TimerPreset } from '../features/timers/types'; // Keep TimerPreset type import

// Placeholder for the actual timer display component
// import ActiveTimerDisplay from '../features/timers/components/ActiveTimerDisplay';

export default function TimersPage() {
  // Get state and actions from the Zustand store
  const {
    activeTimers,
    addTimer,
    removeTimer,
    updateTimerPosition,
    updateTimerSize,
  } = useTimersStore();

  // TODO: Add global controls for volume, audio mode, night mode later if needed

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Timers</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Add timers for game mechanics. Drag to move, resize from the bottom-right corner. Audio alerts included.
      </p>

      {/* Buttons to add timers based on presets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {timerPresets.map((preset: TimerPreset) => (
          <Button
             key={preset.idPrefix}
             onClick={() => addTimer(preset)}
             variant="outline"
             size="sm"
             className="transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
             aria-label={`Add ${preset.title} timer`}
           >
            Add {preset.title}
          </Button>
        ))}
         {/* Optional: Add a button to clear all timers */}
         {activeTimers.length > 0 && (
             <Button
               onClick={() => activeTimers.forEach(t => removeTimer(t.instanceId))}
               variant="destructive"
               size="sm"
               className="transition-colors hover:bg-[hsl(var(--destructive))] cursor-pointer"
             >
                 Remove All
             </Button>
         )}
      </div>

      {/* Container for active timers - Relative positioning allows absolute positioning of timers within */}
      {/* Ensure it has enough height or grows */}
      <div className="relative min-h-[500px] border border-dashed border-border rounded-md p-2 bg-background/50">
        {activeTimers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
            <p>Add timers using the buttons above.</p>
          </div>
        )}
        {activeTimers.map(timer => (
          <Timer
            key={timer.instanceId}
            id={timer.instanceId}
            preset={timer.preset}
            position={timer.position}
            size={timer.size}
            onPositionChange={updateTimerPosition}
            onSizeChange={updateTimerSize}
            onClose={removeTimer}
            // Pass global settings if they exist, otherwise Timer uses defaults
            // globalVolume={/* global volume state */}
            // globalAudioMode={/* global audio mode state */}
          />
        ))}
      </div>
    </div>
  );
}

// export default TimersPage; 