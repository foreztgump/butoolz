'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css'; // Import default resizable styles
import {
  VolumeX,
  Volume2,
  Mic,
  Bell,
  X,
  Play,
  Pause, // Renamed from Stop for clarity
  RotateCcw, // Reset icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AudioMode, TimerPreset } from '../types'; // Import types

// --- Constants ---
const DEFAULT_INITIAL_SIZE = { width: 192, height: 130 };
const DEFAULT_YELLOW_THRESHOLD = 10;
const DEFAULT_RED_THRESHOLD = 5;
const INTERVAL_MS = 50; // Timer update frequency

// --- Web Audio Hook ---
const useAudio = (audioFiles: Record<string, string>, initialVolume: number) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
    const [isReady, setIsReady] = useState(false); // Track if context and gain are ready

    // Initialize AudioContext and GainNode
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                gainNodeRef.current = audioContextRef.current.createGain();
                gainNodeRef.current.connect(audioContextRef.current.destination);
                setVolume(initialVolume); // Set initial volume
                setIsReady(true);
                console.log("AudioContext and GainNode initialized.");

                // Attempt to resume context if suspended (e.g., due to browser policy)
                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume().then(() => {
                        console.log("AudioContext resumed successfully.");
                    }).catch(e => console.error("Failed to resume AudioContext:", e));
                }
            } catch (e) {
                console.error("Web Audio API is not supported or failed to initialize:", e);
            }
        }
        // Cleanup function to close the context (optional, depends on use case)
        // return () => {
        //     audioContextRef.current?.close().catch(e => console.error("Error closing AudioContext:", e));
        // };
    }, [initialVolume]); // Add initialVolume as dependency

    // Preload audio files
    useEffect(() => {
        const context = audioContextRef.current;
        if (!context || !isReady || Object.keys(audioBuffersRef.current).length === Object.keys(audioFiles).length) {
             // Don't run if context not ready or files already loaded/loading
             return;
        }

        console.log("Starting audio preloading...");
        const loadAudio = async (alias: string, url: string) => {
            if (!context || audioBuffersRef.current[alias]) return; // Already loaded or context lost
            try {
                console.log(`Fetching: ${alias} from ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                // Use Promise-based decodeAudioData
                const audioBuffer = await context.decodeAudioData(arrayBuffer);
                audioBuffersRef.current[alias] = audioBuffer;
                console.log(`Audio loaded successfully: ${alias}`);
            } catch (error) {
                console.error(`Error loading audio ${alias} (${url}):`, error);
                 // Remove failed entry? Or keep trying? For now, just log.
            }
        };

        // Clear existing buffers if audioFiles map changes fundamentally (optional)
        // audioBuffersRef.current = {};

        Object.entries(audioFiles).forEach(([alias, url]) => {
            if (!audioBuffersRef.current[alias]) { // Only load if not already loaded
                 loadAudio(alias, url);
            }
        });

    }, [audioFiles, isReady]); // Rerun if audioFiles mapping changes or context becomes ready

    // Adjust volume
    const setVolume = useCallback((vol: number) => {
        if (gainNodeRef.current && audioContextRef.current && isReady) {
            const clampedVol = Math.max(0, Math.min(1, vol)); // Ensure volume is between 0 and 1
            // Use linearRampToValueAtTime for smoother volume changes (optional)
             gainNodeRef.current.gain.setValueAtTime(clampedVol, audioContextRef.current.currentTime);
            // gainNodeRef.current.gain.linearRampToValueAtTime(clampedVol, audioContextRef.current.currentTime + 0.05); // 50ms ramp
        }
    }, [isReady]);

    // Play sound by alias
    const play = useCallback((alias: string) => {
        const context = audioContextRef.current;
        const buffer = audioBuffersRef.current[alias];
        const gainNode = gainNodeRef.current;

        if (context && buffer && gainNode && isReady) {
            // Resume context if needed (e.g., after user interaction)
            if (context.state === 'suspended') {
                context.resume().then(() => {
                    console.log(`AudioContext resumed for playing ${alias}`);
                    const source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(gainNode);
                    source.start(0);
                }).catch(e => console.error("Failed to resume AudioContext for playback", e));
            } else {
                // Context is running, play directly
                const source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(gainNode);
                source.start(0);
            }
        } else if (!buffer) {
            console.warn(`Audio buffer not ready or not found for: ${alias}`);
        } else if (!isReady) {
            console.warn(`Audio context not ready, cannot play: ${alias}`);
        }
    }, [isReady]);

    // Stop function might be needed if sounds are long - complex to implement correctly for specific instances
    const stop = (alias: string) => { console.warn(`Stop function not implemented for ${alias}`); };

    return { play, stop, setVolume, isReady };
};
// --- End Web Audio Hook ---

// --- Draggable Wrapper Component (Internal) ---
// Define interfaces for DraggableWrapper props and data
interface DraggableWrapperProps {
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  onStop?: (e: DraggableEvent, data: DraggableData) => void;
  handleClassName?: string; // Optional class name for the drag handle
}

// Placeholder types for DraggableEvent and DraggableData if react-draggable is not directly used
type DraggableEvent = MouseEvent | TouchEvent; // Basic placeholder
type DraggableData = { x: number; y: number; deltaX: number; deltaY: number; lastX: number; lastY: number }; // Basic placeholder

// Helper to get coordinates from Mouse or Touch events
function getEventCoordinates(e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): { x: number, y: number } | null {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return null; // Should not happen for supported event types
}

// Simple internal DraggableWrapper using basic state
const DraggableWrapper: React.FC<DraggableWrapperProps> = React.memo(({ children, defaultPosition = {x:0, y:0}, onStop, handleClassName }) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const posStartRef = useRef<{ x: number, y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null); // Ref for the draggable element

  // --- Unified Drag Start Logic ---
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getEventCoordinates(e);
    if (!coords) return;

    const targetElement = e.target as HTMLElement;

    // --- Prevent drag start on interactive elements AND RESIZE HANDLE ---
    let currentElement: HTMLElement | null = targetElement;
    let isHandleOrInteractive = false;
    while (currentElement && currentElement !== wrapperRef.current) {
      const tagName = currentElement.tagName.toUpperCase();
      const role = currentElement.getAttribute('role');
      const isResizeHandle = currentElement.classList.contains('react-resizable-handle');
      if (tagName === 'BUTTON' || tagName === 'INPUT' || tagName === 'A' || role === 'slider' || isResizeHandle) {
        // console.log('Clicked on interactive/resize element, preventing drag start.');
        isHandleOrInteractive = true;
        break;
      }
      currentElement = currentElement.parentElement;
    }
    if (isHandleOrInteractive) return;
    // --- End Check ---

    // Determine if the event target is within the designated handle area (if specified)
    const dragInitiatorElement = handleClassName ? wrapperRef.current?.querySelector(`.${handleClassName}`) : wrapperRef.current;
    const canStartDrag = dragInitiatorElement?.contains(targetElement);

    // Check for left mouse button on mouse events
    const isLeftMouseButton = !('touches' in e) && e.button !== 0;

    if (canStartDrag && !isLeftMouseButton) {
      setIsDragging(true);
      dragStartRef.current = coords;
      posStartRef.current = { ...position };
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      document.body.style.cursor = 'grabbing';
      e.stopPropagation(); // Prevent potential parent handlers
      // For touch events, prevent default page scroll/zoom behavior
      if ('touches' in e) {
        // e.preventDefault(); // Caution: might prevent intended scroll on handle-less elements
      }
    }
  };

  // --- Unified Drag Move Logic ---
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStartRef.current || !posStartRef.current) return;

    const coords = getEventCoordinates(e);
    if (!coords) return;

    // Prevent page scroll during touch drag
    if ('touches' in e) {
        e.preventDefault();
    }

    const deltaX = coords.x - dragStartRef.current.x;
    const deltaY = coords.y - dragStartRef.current.y;
    const newPos = {
      x: posStartRef.current.x + deltaX,
      y: posStartRef.current.y + deltaY,
    };
    setPosition(newPos);
  }, [isDragging]); // Dependency: only isDragging

  // --- Unified Drag End Logic ---
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStartRef.current || !posStartRef.current) return;

    // Get final coordinates, use dragStart if move event didn't provide coords (e.g., simple tap)
    // Note: For touch end, there are no coords in the event itself.
    // We rely on the last position calculated during touchmove.
    const lastKnownPos = position; // Use the latest state

    const deltaX = lastKnownPos.x - posStartRef.current.x;
    const deltaY = lastKnownPos.y - posStartRef.current.y;

    const data: DraggableData = {
        x: lastKnownPos.x,
        y: lastKnownPos.y,
        deltaX: deltaX,
        deltaY: deltaY,
        lastX: posStartRef.current.x,
        lastY: posStartRef.current.y
    };

    // Call onStop callback
    // Need to pass a generic or placeholder event if the original isn't suitable
    onStop?.(e as DraggableEvent, data);

    // Reset state
    setIsDragging(false);
    dragStartRef.current = null;
    posStartRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, [isDragging, onStop, position]); // Add position dependency for calculating final delta


  // --- Attach/Detach Event Listeners ---
  useEffect(() => {
    if (isDragging) {
      // Use window listeners for broader capture area
      window.addEventListener('mousemove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false }); // passive: false to allow preventDefault
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd); // Handle cancellation
    } else {
       window.removeEventListener('mousemove', handleDragMove);
       window.removeEventListener('mouseup', handleDragEnd);
       window.removeEventListener('touchmove', handleDragMove);
       window.removeEventListener('touchend', handleDragEnd);
       window.removeEventListener('touchcancel', handleDragEnd);
       // Reset styles just in case end didn't fire correctly
       document.body.style.userSelect = '';
       document.body.style.cursor = '';
    }
    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
      // Ensure styles are reset on unmount if dragging
      if (isDragging) {
         document.body.style.userSelect = '';
         document.body.style.cursor = '';
      }
    };
  }, [isDragging, handleDragMove, handleDragEnd]); // Add handlers to dependency array

  // Use useMemo for transform style to avoid recalculation on every render
  const transformStyle = useMemo(() => ({
    transform: `translate(${position.x}px, ${position.y}px)`,
    position: 'absolute' as 'absolute',
    left: 0,
    top: 0,
    cursor: isDragging ? 'grabbing' : (handleClassName ? 'grab' : 'default')
    // Apply grab cursor only if a handle is defined or if dragging
  }), [position, isDragging, handleClassName]);

  return (
    <div
      ref={wrapperRef}
      style={transformStyle}
      onMouseDown={handleDragStart} // Attach unified handler
      onTouchStart={handleDragStart} // Attach unified handler
    >
      {children}
    </div>
  );
});
DraggableWrapper.displayName = 'DraggableWrapper';
// --- End Draggable Wrapper Component ---


// --- Timer Component Props ---
interface TimerProps {
  id: string; // Unique instance ID from the store
  preset: TimerPreset; // Contains title, startTime, sound config, thresholds
  position: { x: number; y: number }; // Initial position from store
  size: { width: number; height: number }; // Initial size from store
  onClose: (id: string) => void; // Callback to remove timer from store
  onPositionChange: (id: string, pos: { x: number; y: number }) => void; // Callback to update position in store
  onSizeChange: (id: string, size: { width: number; height: number }) => void; // Callback to update size in store
  // Global settings (could come from another store/context later)
  globalVolume?: number;
  globalAudioMode?: AudioMode;
}

// --- Utility Functions ---
function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00.0';
  const secs = Math.floor(totalSeconds);
  const tenths = Math.floor((totalSeconds - secs) * 10);
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${paddedSecs}.${tenths}`;
}

// --- Main Timer Component ---
const Timer: React.FC<TimerProps> = React.memo(({
  id,
  preset,
  position,
  size: initialSizeFromStore,
  onClose,
  onPositionChange,
  onSizeChange,
  globalVolume = 0.5,
  globalAudioMode = 'voice',
}) => {
  // --- State ---
  const [timeLeft, setTimeLeft] = useState<number>(preset.initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSize, setCurrentSize] = useState(initialSizeFromStore || DEFAULT_INITIAL_SIZE);
  const [localVolume, setLocalVolume] = useState<number>(globalVolume);
  const [localAudioMode, setLocalAudioMode] = useState<AudioMode>(globalAudioMode);
  const [isMuted, setIsMuted] = useState<boolean>(globalVolume === 0);

  // --- Refs for timing and preventing sound duplicates ---
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeTimestampRef = useRef<number>(0);
  const timeElapsedBeforePauseRef = useRef<number>(0);
  const lastWholeSecondNotifiedRef = useRef<number | null>(null);
  const soundPlayedForSecondRef = useRef<Set<number>>(new Set());

  // --- Audio Setup ---
  const audioFileMap = useMemo(() => {
      const map: Record<string, string> = {};
      const { completionSound, warningSound, countdownSounds } = preset;
      if (completionSound) map[completionSound] = `/audio/${completionSound}.mp3`;
      if (warningSound) map[warningSound] = `/audio/${warningSound}.mp3`;
      if (countdownSounds) {
          Object.values(countdownSounds).forEach(alias => {
              if(alias && !map[alias]) map[alias] = `/audio/${alias}.mp3`;
          });
      }
       map['beep-short'] = '/audio/beep-short.mp3';
       map['beep-long'] = '/audio/beep-long.mp3';
      return map;
  }, [preset]);

  const { play: playSound, setVolume: setAudioVolume, isReady: isAudioReady } = useAudio(audioFileMap, localVolume);

  // --- Size Scaling Calculation ---
  const scaleFactor = useMemo(() => {
    const initialWidth = preset.initialSize?.width || DEFAULT_INITIAL_SIZE.width;
    if (!initialWidth || initialWidth === 0) return 1;
    return Math.max(0.7, Math.min(2.0, currentSize.width / initialWidth));
  }, [currentSize.width, preset.initialSize]);

  // Base sizes for UI elements
  const baseTimeFontSizeRem = 1.875;
  const baseHeaderTextSizeRem = 0.75;
  const baseIconSizePx = 14;
  const baseCloseIconSizePx = 16;
  const baseSliderWidthPx = 40;

   // --- Clear Interval Function ---
   const clearIntervalRef = useCallback(() => {
       if (intervalRef.current) {
           clearInterval(intervalRef.current);
           intervalRef.current = null;
       }
   }, []);

   // --- Timer Logic Effect ---
   useEffect(() => {
      if (!isRunning) {
          clearIntervalRef();
          startTimeTimestampRef.current = 0;
          return;
      }

      if (startTimeTimestampRef.current === 0) {
          startTimeTimestampRef.current = performance.now();
          lastWholeSecondNotifiedRef.current = Math.floor(timeLeft);
          soundPlayedForSecondRef.current.clear();
      }

      const tick = () => {
          const currentTime = performance.now();
          const startTimestamp = startTimeTimestampRef.current;

          if (startTimestamp === 0) {
              console.error(`[${id}] Timer running but startTimestamp is 0! Stopping.`);
              setIsRunning(false);
              return;
          }

          const elapsedSinceStart = (currentTime - startTimestamp) / 1000;
          const totalElapsedTime = timeElapsedBeforePauseRef.current + elapsedSinceStart;
          let newTimeLeft = preset.initialTime - totalElapsedTime;

          if (isNaN(newTimeLeft)) {
             console.error(`[${id}] newTimeLeft became NaN! Stopping timer.`);
             setIsRunning(false);
             return;
          }

          const prevWholeSecond = lastWholeSecondNotifiedRef.current;
          const newWholeSecond = Math.floor(Math.max(0, newTimeLeft));

          let soundPlayedThisTick = false;
          if (prevWholeSecond !== null && prevWholeSecond > newWholeSecond) {
              if (!soundPlayedForSecondRef.current.has(newWholeSecond)) {
                  let specificSoundAlias: string | null = null;
                  const { completionTime, completionSound, warningTime, warningSound, countdownSounds } = preset;

                  if (completionTime !== undefined && newWholeSecond === completionTime && completionSound) {
                      specificSoundAlias = completionSound;
                  } else if (warningTime !== undefined && newWholeSecond === warningTime && warningSound) {
                      specificSoundAlias = warningSound;
                  } else if (countdownSounds && typeof countdownSounds[newWholeSecond] === 'string') {
                      specificSoundAlias = countdownSounds[newWholeSecond];
                  }

                  let soundToPlay: string | null = null;
                  if (localAudioMode === 'voice') {
                      soundToPlay = specificSoundAlias;
                  } else if (localAudioMode === 'beep') {
                      if (completionTime !== undefined && newWholeSecond === completionTime) soundToPlay = 'beep-long';
                      else if (warningTime !== undefined && newWholeSecond === warningTime) soundToPlay = 'beep-short';
                      else if (countdownSounds && countdownSounds.hasOwnProperty(newWholeSecond)) soundToPlay = 'beep-short';
                  }

                  if (soundToPlay && !isMuted && isAudioReady) {
                      playSound(soundToPlay);
                      soundPlayedThisTick = true;
                      soundPlayedForSecondRef.current.add(newWholeSecond);
                  }
              }
               lastWholeSecondNotifiedRef.current = newWholeSecond;
          } else if (prevWholeSecond === null) {
               lastWholeSecondNotifiedRef.current = newWholeSecond;
          }

          if (newTimeLeft <= 0) {
              // Play final sound ONLY if completionTime > 0 AND sound for second 0 wasn't already played by countdown logic
              const playFinalSound = preset.completionTime !== undefined 
                                  && preset.completionTime > 0 
                                  && !soundPlayedForSecondRef.current.has(0) 
                                  && !isMuted 
                                  && isAudioReady;
                                  
              if (playFinalSound) {
                    let finalSoundToPlay: string | null = null;
                    // Determine sound based on mode (only needed if completionTime > 0 now)
                    if (localAudioMode === 'voice' && preset.completionSound) finalSoundToPlay = preset.completionSound;
                    else if (localAudioMode === 'beep') finalSoundToPlay = 'beep-long'; // Assuming beep mode uses beep-long for completion > 0
                    
                    if(finalSoundToPlay) playSound(finalSoundToPlay);
              }

              setTimeLeft(preset.initialTime);
              timeElapsedBeforePauseRef.current = 0;
              startTimeTimestampRef.current = performance.now();
              lastWholeSecondNotifiedRef.current = Math.floor(preset.initialTime);
              soundPlayedForSecondRef.current.clear();
          } else {
              setTimeLeft(newTimeLeft);
          }
      };

      intervalRef.current = setInterval(tick, INTERVAL_MS);

      return () => clearIntervalRef();

   }, [isRunning, preset, id, playSound, isMuted, localAudioMode, isAudioReady, timeLeft, clearIntervalRef]);


  // --- Audio Volume Effect ---
   useEffect(() => {
       setAudioVolume(isMuted ? 0 : localVolume);
   }, [localVolume, isMuted, setAudioVolume]);

  // --- Handlers ---
  const handleStart = useCallback(() => {
      if (!isRunning && timeLeft > 0) {
          startTimeTimestampRef.current = performance.now();
          lastWholeSecondNotifiedRef.current = Math.floor(timeLeft);
          soundPlayedForSecondRef.current.clear();
          setIsRunning(true);
          console.log(`[${id}] Started/Resumed. AudioMode: ${localAudioMode}`);
      }
  }, [isRunning, timeLeft, localAudioMode, id]);

  const handlePause = useCallback(() => {
      if (isRunning) {
          clearIntervalRef();
          if (startTimeTimestampRef.current > 0) {
             const elapsedSinceStart = (performance.now() - startTimeTimestampRef.current) / 1000;
             timeElapsedBeforePauseRef.current += elapsedSinceStart;
          }
          startTimeTimestampRef.current = 0;
          setIsRunning(false);
          console.log(`[${id}] Paused. Total elapsed: ${timeElapsedBeforePauseRef.current.toFixed(2)}`);
      }
  }, [isRunning, clearIntervalRef, id]);

  const handleReset = useCallback(() => {
      if (isRunning) {
          // Timer is running: Reset time tracking but keep interval running
          timeElapsedBeforePauseRef.current = 0;
          startTimeTimestampRef.current = performance.now(); // Reset start time to now
          lastWholeSecondNotifiedRef.current = Math.floor(preset.initialTime); // Reset notification tracking
          soundPlayedForSecondRef.current.clear(); // Clear played sounds for the new cycle
          // NOTE: We don't call setTimeLeft directly, the next interval tick will update it based on the reset refs.
          console.log(`[${id}] Reset while running.`);
      } else {
          // Timer is stopped: Perform the original full reset
          clearIntervalRef();
          setIsRunning(false);
          setTimeLeft(preset.initialTime);
          timeElapsedBeforePauseRef.current = 0;
          startTimeTimestampRef.current = 0;
          lastWholeSecondNotifiedRef.current = null;
          soundPlayedForSecondRef.current.clear();
          console.log(`[${id}] Reset while stopped.`);
      }
  }, [isRunning, preset.initialTime, clearIntervalRef, id]); // Add isRunning dependency

  const handleDragStop = useCallback((e: DraggableEvent, data: DraggableData) => {
     console.log(`[${id}] Drag stopped at x: ${data.x}, y: ${data.y}`);
     onPositionChange(id, { x: data.x, y: data.y });
  }, [id, onPositionChange]);

  const handleResizeStop = useCallback((event: React.SyntheticEvent, data: ResizeCallbackData) => {
      const newSize = { width: Math.round(data.size.width), height: Math.round(data.size.height) };
      setCurrentSize(newSize);
      onSizeChange(id, newSize);
      console.log(`[${id}] Resize stopped at:`, newSize);
  }, [id, onSizeChange]);

  const handleClose = useCallback(() => {
      clearIntervalRef();
      onClose(id);
  }, [id, onClose, clearIntervalRef]);

  // --- Calculate Visual Warning State ---
  const warningState = useMemo(() => {
    if (timeLeft <= 0) return 'default';
    const currentWholeSecond = Math.floor(timeLeft);
    const redT = preset.redThreshold ?? DEFAULT_RED_THRESHOLD;
    const yellowT = preset.yellowThreshold ?? DEFAULT_YELLOW_THRESHOLD;
    if (currentWholeSecond < redT) return 'red';
    if (currentWholeSecond < yellowT) return 'yellow';
    return 'default';
  }, [timeLeft, preset.redThreshold, preset.yellowThreshold]);


  // --- Animation Variants & Dynamic Classes ---
  const textBackgroundVariants = {
    default: { backgroundColor: 'rgba(0, 0, 0, 0)', transition: { duration: 0.3 } },
    yellow: { backgroundColor: ['rgba(250, 204, 21, 0.6)', 'rgba(250, 204, 21, 0.2)', 'rgba(250, 204, 21, 0.6)'], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
    red: { backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.7)'], transition: { duration: 1.0, repeat: Infinity, ease: "easeInOut" } }
  };

  const boxPulseVariants = {
    default: { scale: 1, transition: { duration: 0.3 } },
    red: { scale: [1, 1.02, 1], transition: { duration: 1.0, ease: "easeInOut", repeat: Infinity } }
  };

  // --- DEFINE NEW innerBoxClasses --- Includes styles previously on ResizableBox
  const innerBoxClasses = useMemo(() => {
      return `
        flex flex-col flex-grow h-full w-full // Layout classes
        bg-[hsl(240_10%_6%)] text-card-foreground // Re-apply explicit HSL value for dark card bg as workaround
        border rounded-lg shadow-lg overflow-hidden // Border, rounding, shadow, overflow
        transition-colors duration-300 // Smooth border color transition
        isolate // Creates new stacking context
        ${warningState === 'red' ? 'border-red-500' :
        warningState === 'yellow' ? 'border-amber-400' :
        'border-border'} // Dynamic border color
      `;
  }, [warningState]);

  return (
    <DraggableWrapper
      defaultPosition={position}
      onStop={handleDragStop}
      handleClassName="timer-drag-handle"
    >
      <ResizableBox
        width={currentSize.width}
        height={currentSize.height}
        minConstraints={[DEFAULT_INITIAL_SIZE.width * 0.7, DEFAULT_INITIAL_SIZE.height * 0.7]}
        maxConstraints={[DEFAULT_INITIAL_SIZE.width * 2.5, DEFAULT_INITIAL_SIZE.height * 2.5]}
        onResizeStop={handleResizeStop}
        className="relative shadow-lg overflow-hidden"
        axis="both"
        handle={(
            <div className="react-resizable-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-primary/20 hover:bg-primary/50 rounded-tl-md border-l border-t border-primary/50 z-10" />
        )}
      >
        <motion.div
          animate={warningState === 'red' ? 'red' : 'default'}
          variants={boxPulseVariants}
          className="relative w-full h-full"
        >
           <div className={`${innerBoxClasses} w-full h-full`}>

              {/* Header: Drag Handle, Title, Controls */}
              <div className="timer-drag-handle bg-muted/50 p-1 border-b border-border flex justify-between items-center flex-shrink-0 space-x-1">
                 {/* Title (takes available space) */}
                 <h3
                   className="font-semibold truncate flex-grow pl-1 text-foreground/80"
                   title={preset.title}
                   style={{ fontSize: `${Math.max(0.6, baseHeaderTextSizeRem * scaleFactor)}rem` }}
                 >
                     {preset.title}
                 </h3>
                 {/* Controls (fixed size icons/buttons) */}
                 <div className="flex items-center flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"} className="h-6 w-6">
                      {isMuted ?
                        <VolumeX style={{ width: `${Math.max(10, Math.round(baseIconSizePx * scaleFactor))}px`, height: 'auto' }}/> :
                        <Volume2 style={{ width: `${Math.max(10, Math.round(baseIconSizePx * scaleFactor))}px`, height: 'auto' }}/>
                      }
                    </Button>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={localVolume}
                      disabled={isMuted}
                      onChange={(e) => setLocalVolume(parseFloat(e.target.value))}
                      className="h-1.5 cursor-pointer disabled:opacity-50 accent-primary mx-1"
                      style={{ width: `${Math.max(25, Math.round(baseSliderWidthPx * scaleFactor))}px` }}
                      title={`Volume: ${Math.round(localVolume * 100)}%`}
                      role="slider"
                      aria-valuenow={localVolume}
                      aria-valuemin={0}
                      aria-valuemax={1}
                      aria-label="Volume control"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setLocalAudioMode(prev => prev === 'voice' ? 'beep' : 'voice')} title={`Switch to ${localAudioMode === 'voice' ? 'Beep' : 'Voice'} Mode`} className="h-6 w-6">
                      {localAudioMode === 'voice' ?
                        <Mic style={{ width: `${Math.max(10, Math.round(baseIconSizePx * scaleFactor))}px`, height: 'auto' }}/> :
                        <Bell style={{ width: `${Math.max(10, Math.round(baseIconSizePx * scaleFactor))}px`, height: 'auto' }}/>
                      }
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleClose} title="Close Timer" className="h-6 w-6 text-destructive hover:bg-destructive/10">
                      <X style={{ width: `${Math.max(12, Math.round(baseCloseIconSizePx * scaleFactor))}px`, height: 'auto' }}/>
                    </Button>
                 </div>
              </div>

              {/* Body: Timer Display and Action Buttons */}
              <div className="flex-grow flex flex-col justify-center items-center p-1 space-y-1 overflow-hidden">
                 {/* Timer Value with Animated Background */}
                 <motion.div
                   className="mb-1 px-2 py-0.5 rounded"
                   variants={textBackgroundVariants}
                   animate={warningState}
                   style={{ originX: 0.5, originY: 0.5 }}
                 >
                   <div
                     className="font-mono font-bold text-center text-foreground tabular-nums"
                     style={{
                       fontSize: `${Math.max(1.25, baseTimeFontSizeRem * scaleFactor)}rem`,
                       lineHeight: '1',
                       userSelect: 'none',
                       WebkitUserSelect: 'none',
                       MozUserSelect: 'none',
                     }}>
                       {formatTime(timeLeft)}
                   </div>
                 </motion.div>

                 {/* Action Buttons */}
                 <div className="flex justify-center space-x-1 flex-shrink-0">
                    {!isRunning ? (
                      <Button size="sm" onClick={handleStart} disabled={timeLeft <= 0} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 h-6" title="Start/Resume Timer">
                        <Play className="w-4 h-4 mr-1" /> Start
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handlePause} className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 h-6" title="Pause Timer">
                         <Pause className="w-4 h-4 mr-1" /> Pause
                      </Button>
                    )}
                    <Button size="sm" onClick={handleReset} variant="outline" className="px-2 py-0.5 h-6 hover:bg-blue-500 hover:text-white" title="Reset Timer">
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                 </div>
              </div>
           </div>
        </motion.div>
      </ResizableBox>
    </DraggableWrapper>
  );
});

Timer.displayName = 'Timer';

export default Timer; 