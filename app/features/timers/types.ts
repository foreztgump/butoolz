// src/features/timers/types.ts

// Define Timer Preset Interface
export interface TimerPreset {
  idPrefix: string;
  title: string;
  icon?: string; // Add optional icon property
  initialTime: number; // Starting time in seconds
  completionSound?: string; // Sound alias to play when timer reaches completionTime
  completionTime?: number; // Time remaining (seconds) when completionSound plays (e.g., 0 for end, 5 for 5s left)
  countdownSounds?: { [key: number]: string }; // Map of time remaining (seconds) -> sound alias
  initialSize?: { width: number; height: number }; // Default size
  warningSound?: string; // Sound alias for warning state transition
  warningTime?: number;  // Time remaining (seconds) when warningSound plays
  // Visual Warning Thresholds (time remaining in seconds)
  yellowThreshold?: number; // Enters yellow state below this time
  redThreshold?: number;    // Enters red state below this time
}

// Type for the audio mode selection
export type AudioMode = 'voice' | 'beep'; 