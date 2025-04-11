'use client';

import React from 'react';
import { timerPresets } from '../data/timerPresets';
import useTimersStore from '../store/timersStore';
import { Button } from '@/components/ui/button'; // Assuming shadcn Button
import type { TimerPreset } from '../types';

const TimerPresetSelector = () => {
  const addTimer = useTimersStore((state) => state.addTimer);

  const handleAddTimer = (preset: TimerPreset) => {
    addTimer(preset);
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-card shadow">
      <h2 className="text-lg font-semibold mb-3">Add Timer Presets</h2>
      <div className="flex flex-wrap gap-2">
        {timerPresets.map((preset: TimerPreset) => (
          <Button
            key={preset.idPrefix}
            variant="outline"
            size="sm"
            onClick={() => handleAddTimer(preset)}
            aria-label={`Add ${preset.title} timer`}
          >
            {preset.icon && <span className="mr-2">{preset.icon}</span>}
            {preset.title}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimerPresetSelector; 