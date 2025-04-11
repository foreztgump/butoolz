import { create, StateCreator } from 'zustand';
import type { TimerPreset } from '../types'; // Import shared type

// Interface for a single active timer instance in the store
interface ActiveTimer {
    instanceId: string; // Unique ID for this instance
    preset: TimerPreset; // The preset configuration used
    position: { x: number, y: number }; // Current position on screen
    size: { width: number, height: number }; // Current size
    // Add other instance-specific state if needed later (e.g., volume, audioMode could be stored here)
}

// Define the store state and actions
interface TimersState {
    activeTimers: ActiveTimer[];
    addTimer: (preset: TimerPreset) => void;
    removeTimer: (instanceId: string) => void;
    updateTimerPosition: (instanceId: string, pos: { x: number, y: number }) => void;
    updateTimerSize: (instanceId: string, size: { width: number, height: number }) => void;
    // Potentially add actions to update instance-specific settings like volume/mode later
}

// Default size if not provided in preset
const DEFAULT_TIMER_SIZE = { width: 192, height: 130 };

// Define the state creator function with explicit types
const timerStateCreator: StateCreator<TimersState> = (set) => ({
    activeTimers: [],

    addTimer: (preset: TimerPreset) => set((state: TimersState) => {
        const instanceId = `${preset.idPrefix}-${Date.now()}`;
        // Basic staggering of initial positions
        const initialX = (state.activeTimers.length % 5) * 20;
        const initialY = Math.floor(state.activeTimers.length / 5) * 20;
        const newTimer: ActiveTimer = {
            instanceId,
            preset,
            position: { x: initialX, y: initialY },
            size: preset.initialSize || DEFAULT_TIMER_SIZE,
        };
        console.log(`Adding timer: ${instanceId}`, newTimer);
        return { activeTimers: [...state.activeTimers, newTimer] };
    }),

    removeTimer: (instanceId: string) => set((state: TimersState) => {
        console.log(`Removing timer: ${instanceId}`);
        return {
            activeTimers: state.activeTimers.filter((timer: ActiveTimer) => timer.instanceId !== instanceId),
        };
    }),

    // Updates position, typically called on drag stop
    updateTimerPosition: (instanceId: string, pos: { x: number, y: number }) => set((state: TimersState) => {
         console.log(`Updating position for ${instanceId}:`, pos);
        return {
            activeTimers: state.activeTimers.map((timer: ActiveTimer) =>
                timer.instanceId === instanceId ? { ...timer, position: pos } : timer
            ),
        };
    }),

    // Updates size, typically called on resize stop
    updateTimerSize: (instanceId: string, size: { width: number, height: number }) => set((state: TimersState) => {
        console.log(`Updating size for ${instanceId}:`, size);
        return {
            activeTimers: state.activeTimers.map((timer: ActiveTimer) =>
                timer.instanceId === instanceId ? { ...timer, size: size } : timer
            ),
        };
    }),
});

// Create the Zustand store using the state creator function
const useTimersStore = create<TimersState>(timerStateCreator);

export default useTimersStore; 