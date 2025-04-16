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

      {/* Tip Section */}
      <div className="mb-6 p-3 border border-dashed rounded-md bg-accent/50 text-accent-foreground">
        <p className="text-sm italic">
          <strong>Tip:</strong> Don't have a second monitor? Open this web page on your phone! The web timers work great on mobile OR use the desktop app on your main screen over the game.
        </p>
      </div>

      {/* How to Use Section */}
      <div className="mb-6 p-4 border rounded-md bg-card text-card-foreground">
        <h2 className="text-lg font-semibold mb-2">How to Use BuTools-Timer (Desktop Version)</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            asChild
            variant="default"
            size="sm"
            className="border border-[#7F00FF] bg-[#000000] text-primary-foreground transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
          >
            <a
              href="https://github.com/foreztgump/butools-timer-desktop/releases/download/v1.1.1/BuTools-Timer.Setup.1.1.1.exe"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Desktop App (Windows)
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border border-input bg-background text-foreground transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] cursor-pointer"
          >
            <a
              href="https://github.com/foreztgump/butools-timer-desktop"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source Code
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Current Release: BuTools-Timer v1.1.1 (4/16/25)</p>
        <ul className="list-disc list-outside pl-5 space-y-1.5 text-sm">
          <li><strong>Launcher:</strong> Open the app to see the main control window.</li>
          <li><strong>Add Timer:</strong> Click `(+) Add Timer` {'->'} Choose a preset (e.g., Backflow) to open its timer window.</li>
          <li><strong>Control Timer Window:</strong> Use Play/Pause/Reset buttons. Manage audio (mute, volume, sound type). Border changes color near end. Close with 'X'. Drag top bar to move, resize from corners (position saved per preset).</li>
          <li><strong>Manage in Launcher:</strong> View active timers. Click 'Focus' to bring a timer forward or 'X' to close it. Use global audio controls for all timers.</li>
          <li><strong>Shortcuts (Cmd/Ctrl + Shift + Key):</strong> `B` Backflow, `F` Fire, `L` Lightning, `R` Reflect, `S` Fuse Storm.</li>
          <li><strong>Shortcuts (Timer Control):</strong> Cycle timers with `Ctrl+Shift+Left/Right`. Start focused timer with `Ctrl+Shift+Up`. Pause focused timer with `Ctrl+Shift+Down`. Reset focused timer with `Ctrl+Shift+End`.</li>
          <li><strong>Help/Support:</strong> Use the FAQ and Donate buttons in the Launcher.</li>
        </ul>
      </div>

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