'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { RUNE_TYPES, type RuneType, type SelectableRuneValue, type Results } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Sparkles, RefreshCw, Copy, ClipboardPaste, Info, CircleCheck, Lock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  type GearTier, type GearTiers,
  TIER_OPTIONS, DEFAULT_TIER,
  generateInitialGearTiers, sanitizeGearTiers, isSlotLocked,
} from "./gearTierHelpers"

interface RuneOption {
  value: SelectableRuneValue;
  label: string;
  color: string;
}

// Define RUNE_OPTIONS using the types
const RUNE_OPTIONS: Readonly<RuneOption[]> = [
  { value: "-", label: "-", color: "bg-gray-200 dark:bg-gray-700" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "white", label: "White", color: "bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-400" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "rainbow", label: "Rainbow", color: "bg-gradient-to-r from-purple-500 via-yellow-400 to-green-500" },
] as const; // Readonly for safety

// Create a map for quick color lookup
const RUNE_COLOR_MAP = RUNE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.color;
  return acc;
}, {} as Record<SelectableRuneValue, string>);

interface GearPiece {
  id: string;
  label: string;
  slots: number;
  icon: string;
}

const GEAR_PIECES: Readonly<GearPiece[]> = [
  { id: "main_hand", label: "Main Hand", slots: 5, icon: "⚔️" },
  { id: "off_hand", label: "Off Hand", slots: 5, icon: "🗡️" },
  { id: "head", label: "Head", slots: 5, icon: "👑" },
  { id: "chest", label: "Chest", slots: 5, icon: "🛡️" },
  { id: "pants", label: "Pants", slots: 5, icon: "👖" },
  { id: "boots", label: "Boots", slots: 5, icon: "👢" },
  { id: "gloves", label: "Gloves", slots: 5, icon: "🧤" },
  { id: "shoulder", label: "Shoulder", slots: 5, icon: "💪" },
  { id: "belt", label: "Waist", slots: 5, icon: "🧶" },
] as const;

const GEAR_PIECE_IDS = GEAR_PIECES.map(p => p.id);

// Define Presets type
interface Preset {
  id: string;
  name: string;
  description: string;
  config: Record<string, SelectableRuneValue>; // Use SelectableRuneValue
}

// Example Presets (Ensure config values match SelectableRuneValue)
// NOTE: Replace with actual preset configs from original code if needed
const PRESETS: Readonly<Preset[]> = [
  {
    id: "balanced",
    name: "Balanced Build",
    description: "Equal distribution of all rune types",
    config: {
        head_rune_1: "purple", head_rune_2: "white", head_rune_3: "yellow", head_rune_4: "red", head_rune_5: "green",
        chest_rune_1: "white", chest_rune_2: "yellow", chest_rune_3: "red", chest_rune_4: "green", chest_rune_5: "purple",
        pants_rune_1: "yellow", pants_rune_2: "red", pants_rune_3: "green", pants_rune_4: "purple", pants_rune_5: "white",
        boots_rune_1: "red", boots_rune_2: "green", boots_rune_3: "purple", boots_rune_4: "white", boots_rune_5: "yellow",
        gloves_rune_1: "green", gloves_rune_2: "purple", gloves_rune_3: "white", gloves_rune_4: "yellow", gloves_rune_5: "red",
        shoulder_rune_1: "purple", shoulder_rune_2: "white", shoulder_rune_3: "yellow", shoulder_rune_4: "red", shoulder_rune_5: "green",
        belt_rune_1: "white", belt_rune_2: "yellow", belt_rune_3: "red", belt_rune_4: "green", belt_rune_5: "purple",
        main_hand_rune_1: "yellow", main_hand_rune_2: "red", main_hand_rune_3: "green", main_hand_rune_4: "purple", main_hand_rune_5: "white",
        off_hand_rune_1: "red", off_hand_rune_2: "green", off_hand_rune_3: "purple", off_hand_rune_4: "white", off_hand_rune_5: "yellow",
    },
  },
  {
    id: "attack",
    name: "Attack Focus",
    description: "Maximizes red and yellow runes for damage",
    config: {
        head_rune_1: "red", head_rune_2: "red", head_rune_3: "yellow", head_rune_4: "yellow", head_rune_5: "purple",
        chest_rune_1: "red", chest_rune_2: "red", chest_rune_3: "yellow", chest_rune_4: "yellow", chest_rune_5: "purple",
        pants_rune_1: "red", pants_rune_2: "red", pants_rune_3: "yellow", pants_rune_4: "yellow", pants_rune_5: "white",
        boots_rune_1: "red", boots_rune_2: "red", boots_rune_3: "yellow", boots_rune_4: "yellow", boots_rune_5: "white",
        gloves_rune_1: "red", gloves_rune_2: "red", gloves_rune_3: "yellow", gloves_rune_4: "yellow", gloves_rune_5: "green",
        shoulder_rune_1: "red", shoulder_rune_2: "red", shoulder_rune_3: "yellow", shoulder_rune_4: "yellow", shoulder_rune_5: "green",
        belt_rune_1: "red", belt_rune_2: "red", belt_rune_3: "yellow", belt_rune_4: "yellow", belt_rune_5: "green",
        main_hand_rune_1: "red", main_hand_rune_2: "red", main_hand_rune_3: "yellow", main_hand_rune_4: "yellow", main_hand_rune_5: "purple",
        off_hand_rune_1: "red", off_hand_rune_2: "red", off_hand_rune_3: "yellow", off_hand_rune_4: "yellow", off_hand_rune_5: "purple",
    },
  },
  {
    id: "defense",
    name: "Defense Focus",
    description: "Maximizes green and white runes for survivability",
    config: {
        head_rune_1: "green", head_rune_2: "green", head_rune_3: "white", head_rune_4: "white", head_rune_5: "purple",
        chest_rune_1: "green", chest_rune_2: "green", chest_rune_3: "white", chest_rune_4: "white", chest_rune_5: "purple",
        pants_rune_1: "green", pants_rune_2: "green", pants_rune_3: "white", pants_rune_4: "white", pants_rune_5: "red",
        boots_rune_1: "green", boots_rune_2: "green", boots_rune_3: "white", boots_rune_4: "white", boots_rune_5: "red",
        gloves_rune_1: "green", gloves_rune_2: "green", gloves_rune_3: "white", gloves_rune_4: "white", gloves_rune_5: "yellow",
        shoulder_rune_1: "green", shoulder_rune_2: "green", shoulder_rune_3: "white", shoulder_rune_4: "white", shoulder_rune_5: "yellow",
        belt_rune_1: "green", belt_rune_2: "green", belt_rune_3: "white", belt_rune_4: "white", belt_rune_5: "yellow",
        main_hand_rune_1: "green", main_hand_rune_2: "green", main_hand_rune_3: "white", main_hand_rune_4: "white", main_hand_rune_5: "purple",
        off_hand_rune_1: "green", off_hand_rune_2: "green", off_hand_rune_3: "white", off_hand_rune_4: "white", off_hand_rune_5: "purple",
    },
  },
] as const;

const RUNES_CONFIG_STORAGE_KEY = "butools_runes_config";
const AUTOSAVE_DEBOUNCE_MS = 500;
const VALID_RUNE_VALUES = new Set<string>(RUNE_OPTIONS.map(o => o.value));

// Define types for state and results
type RuneValues = Record<string, SelectableRuneValue>;

// Initial state generation helper
const generateInitialRuneValues = (): RuneValues => {
  const initialValues: RuneValues = {};
  GEAR_PIECES.forEach((piece) => {
    for (let i = 1; i <= piece.slots; i++) {
      initialValues[`${piece.id}_rune_${i}`] = "-";
    }
  });
  return initialValues;
};

const LEGACY_MOUNT_BONUS_KEY = "butools_runes_mount_bonus";

// Load saved config from localStorage with backward compatibility
const loadSavedConfig = (): { runeValues: RuneValues; mountBonusEnabled: boolean; gearTiers: GearTiers } => {
  const defaults = { runeValues: generateInitialRuneValues(), mountBonusEnabled: false, gearTiers: generateInitialGearTiers(GEAR_PIECE_IDS) };
  if (typeof window === "undefined") return defaults;
  try {
    const saved = localStorage.getItem(RUNES_CONFIG_STORAGE_KEY);
    if (!saved) {
      // Migrate legacy mount bonus key for users who never clicked "Save Config"
      const legacyMount = localStorage.getItem(LEGACY_MOUNT_BONUS_KEY);
      if (legacyMount === "true") {
        return { ...defaults, mountBonusEnabled: true };
      }
      return defaults;
    }

    const parsed = JSON.parse(saved);
    const rawRunes = ("runeValues" in parsed) ? parsed.runeValues : parsed;
    // New format stores mountBonusEnabled inline; old flat format may have it in the legacy key
    const mountBonus = ("runeValues" in parsed)
      ? Boolean(parsed.mountBonusEnabled)
      : localStorage.getItem(LEGACY_MOUNT_BONUS_KEY) === "true";

    // Validate: keep only known keys with valid rune values
    const validatedRunes = generateInitialRuneValues();
    for (const key of Object.keys(validatedRunes)) {
      if (key in rawRunes && VALID_RUNE_VALUES.has(rawRunes[key])) {
        validatedRunes[key] = rawRunes[key];
      }
    }
    return { runeValues: validatedRunes, mountBonusEnabled: mountBonus, gearTiers: sanitizeGearTiers(parsed.gearTiers, GEAR_PIECE_IDS) };
  } catch {
    return defaults;
  }
};

// Debounce hook — delays value updates by the specified ms
function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debouncedValue;
}

// Memoized RuneSelector Component
const RuneSelector = React.memo(({ field, value, onChange }: {
    field: string;
    value: SelectableRuneValue;
    onChange: (field: string, value: SelectableRuneValue) => void;
}) => (
    <Select value={value} onValueChange={(v) => onChange(field, v as SelectableRuneValue)}>
        <SelectTrigger className="h-8 w-full py-1 px-2 text-xs focus:ring-1 focus:ring-violet-500">
            <SelectValue placeholder="-" />
        </SelectTrigger>
        <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
            {RUNE_OPTIONS.map((option) => (
                <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-[hsl(240_3.7%_15.9%)] text-xs px-2 py-1.5"
                >
                    <div className="flex items-center space-x-1.5">
                        <span className={`inline-block w-3 h-3 rounded-sm ${option.color}`} />
                        <span>{option.label}</span>
                    </div>
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
));
RuneSelector.displayName = 'RuneSelector';

const TierSelector = React.memo(({ gearPieceId, value, onChange }: {
  gearPieceId: string;
  value: GearTier;
  onChange: (gearPieceId: string, tier: GearTier) => void;
}) => (
  <Select value={value} onValueChange={(v) => onChange(gearPieceId, v as GearTier)}>
    <SelectTrigger className="h-8 w-[110px] py-1 px-2 text-xs focus:ring-1 focus:ring-violet-500">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
      {TIER_OPTIONS.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          className="hover:bg-[hsl(240_3.7%_15.9%)] text-xs px-2 py-1.5"
        >
          <div className="flex items-center space-x-1.5">
            <span className={cn("inline-block w-3 h-3 rounded-sm", option.color)} />
            <span>{option.label}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
));
TierSelector.displayName = 'TierSelector';

export default function RunesDreaming() {
  // Load once — useState preserves the value across re-renders
  const [initialConfig] = useState(loadSavedConfig);
  const [runeValues, setRuneValues] = useState<RuneValues>(initialConfig.runeValues);
  const [mountBonusEnabled, setMountBonusEnabled] = useState<boolean>(initialConfig.mountBonusEnabled);
  const [gearTiers, setGearTiers] = useState<GearTiers>(initialConfig.gearTiers);

  const handleTierChange = useCallback((gearPieceId: string, tier: GearTier) => {
    setGearTiers((prev) => ({ ...prev, [gearPieceId]: tier }));
  }, []);

  // Auto-save: debounce the config, then persist on change (skip initial mount write)
  const configToSave = useMemo(() => ({ runeValues, mountBonusEnabled, gearTiers }), [runeValues, mountBonusEnabled, gearTiers]);
  const debouncedConfig = useDebounce(configToSave, AUTOSAVE_DEBOUNCE_MS);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(RUNES_CONFIG_STORAGE_KEY, JSON.stringify(debouncedConfig));
    } catch (error) {
      console.error("Failed to auto-save rune config:", error);
    }
  }, [debouncedConfig]);

  // Calculate results using useMemo to avoid recalculating on every render unless runeValues changes
  const results = useMemo<Results>(() => {
    const counts: Omit<Results, 'total' | 'filled'> = {
      purple: 0, white: 0, yellow: 0, red: 0, green: 0,
    };
    let filled = 0;
    let unlockedTotal = 0;

    GEAR_PIECES.forEach((piece) => {
      for (let slotNum = 1; slotNum <= piece.slots; slotNum++) {
        if (isSlotLocked(piece.id, slotNum, gearTiers)) continue;

        unlockedTotal++;
        const value = runeValues[`${piece.id}_rune_${slotNum}`];
        if (value === "-" || !value) continue;

        filled++;

        if (value === "rainbow") {
          RUNE_TYPES.forEach(color => { counts[color]++; });
        } else if (RUNE_TYPES.includes(value as RuneType)) {
          counts[value as RuneType]++;
        }
      }
    });

    if (mountBonusEnabled) {
      RUNE_TYPES.forEach(color => { counts[color]++; });
    }

    return { ...counts, total: unlockedTotal, filled };
  }, [runeValues, mountBonusEnabled, gearTiers]);

  // Stable handlers using useCallback
  const handleRuneChange = useCallback((field: string, value: SelectableRuneValue) => {
    setRuneValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []); // Empty dependency array as setRuneValues is stable

  const resetAll = useCallback(() => {
    setRuneValues(generateInitialRuneValues());
    setGearTiers(generateInitialGearTiers(GEAR_PIECE_IDS));
    setMountBonusEnabled(false);
    toast("Reset Complete", {
      description: "All rune selections and gear tiers have been cleared.",
    });
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    // Ensure the preset config aligns with the RuneValues type
    const typedConfig: RuneValues = { ...generateInitialRuneValues(), ...preset.config };
    setRuneValues(typedConfig);
    toast(`Applied ${preset.name}`, {
      description: preset.description,
    });
  }, []);

  const exportConfiguration = useCallback(async () => {
    try {
      const configJson = JSON.stringify({ runeValues, mountBonusEnabled, gearTiers }, null, 2);
      await navigator.clipboard.writeText(configJson);
      toast("Configuration Exported", {
        description: "Copied to clipboard — paste it somewhere safe or share it.",
      });
    } catch (error) {
      console.error("Failed to export config:", error);
      toast.error("Export Failed", {
        description: "Could not copy to clipboard. Your browser may not support this feature.",
      });
    }
  }, [runeValues, mountBonusEnabled, gearTiers]);

  const importConfiguration = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsed = JSON.parse(clipboardText);

      let importedRunes: RuneValues;
      let importedMountBonus = false;

      if ("runeValues" in parsed && typeof parsed.runeValues === "object" && parsed.runeValues !== null) {
        importedRunes = parsed.runeValues;
        importedMountBonus = Boolean(parsed.mountBonusEnabled);
      } else if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        importedRunes = parsed;
      } else {
        toast.error("Invalid Format", { description: "Clipboard does not contain a valid rune configuration." });
        return;
      }

      // Merge with defaults: fill missing keys, drop unknown keys, reject invalid values
      const defaults = generateInitialRuneValues();
      const validConfig: RuneValues = {};
      for (const key of Object.keys(defaults)) {
        const imported = importedRunes[key];
        validConfig[key] = VALID_RUNE_VALUES.has(imported) ? imported : defaults[key];
      }
      setRuneValues(validConfig);
      setMountBonusEnabled(importedMountBonus);
      setGearTiers(sanitizeGearTiers(parsed.gearTiers, GEAR_PIECE_IDS));
      toast("Configuration Imported", {
        description: "Rune configuration loaded from clipboard.",
      });
    } catch (error) {
      console.error("Failed to import config:", error);
      const isPermissionError = error instanceof DOMException && error.name === "NotAllowedError";
      toast.error("Import Failed", {
        description: isPermissionError
          ? "Clipboard access denied. Please allow clipboard permissions."
          : "Clipboard does not contain valid JSON. Copy a valid config first.",
      });
    }
  }, []);

  const fillEmptySlots = useCallback((runeType: SelectableRuneValue) => {
    if (runeType === "-") {
      toast.info("Please select a rune type to fill empty slots.");
      return;
    }

    const updatedValues = { ...runeValues };
    let filledCount = 0;

    GEAR_PIECES.forEach((piece) => {
      for (let slotNum = 1; slotNum <= piece.slots; slotNum++) {
        if (isSlotLocked(piece.id, slotNum, gearTiers)) continue;

        const key = `${piece.id}_rune_${slotNum}`;
        if (updatedValues[key] === "-") {
          updatedValues[key] = runeType;
          filledCount++;
        }
      }
    });

    if (filledCount === 0) {
      toast.info("No empty unlocked slots found to fill.");
      return;
    }

    setRuneValues(updatedValues);
    const selectedRuneLabel = RUNE_OPTIONS.find(o => o.value === runeType)?.label || runeType;
    toast.success(`Filled ${filledCount} empty slots with ${selectedRuneLabel} runes.`);
  }, [runeValues, gearTiers]);

  // Derived value for the most common rune (using useMemo)
  const mostCommonRune = useMemo(() => {
     const counts = RUNE_TYPES.map(type => ({ type, count: results[type] }))
                             .sort((a, b) => b.count - a.count);
     return counts[0]?.count > 0 ? (RUNE_OPTIONS.find(o => o.value === counts[0].type)?.label || "None") : "None";
  }, [results]); // Depends on results

  // JSX remains largely the same, but uses optimized handlers/values
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6"> {/* Added padding */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Runes Dreaming</h1>
          <p className="text-sm text-muted-foreground">
            Calculate and optimize your rune configuration.
          </p>
        </div>

        {/* Action Buttons & Completion Badge */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
             {/* Using optimized handlers */}
            <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={resetAll}>
              <RefreshCw className="h-3 w-3 mr-1" /> Reset All
            </Button>
            <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={exportConfiguration}>
              <Copy className="h-3 w-3 mr-1" /> Export
            </Button>
             <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={importConfiguration}>
              <ClipboardPaste className="h-3 w-3 mr-1" /> Import
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Completion:</span>
            <Badge variant={results.filled === results.total ? "default" : "outline"} className="text-xs"> {/* Use default variant for success state */}
              {results.filled}/{results.total} slots filled
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
             {/* Tab Triggers - Added common styles */} 
             <TabsTrigger value="configuration" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
               <Sparkles className="h-4 w-4" /> Configuration
             </TabsTrigger>
             <TabsTrigger value="presets" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
               <CircleCheck className="h-4 w-4" /> Presets & Tools
             </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */} 
          <TabsContent value="configuration">
            <Card>
              <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center gap-2"> <Sparkles className="h-4 w-4 text-primary" /> Rune Configuration </CardTitle>
                 <CardDescription>Select runes for each slot.</CardDescription>
              </CardHeader>
              <CardContent>
                 {/* Rune Table */} 
                 <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Gear Piece</TableHead>
                        <TableHead className="w-[110px]">Tier</TableHead>
                        {[...Array(5)].map((_, i) => <TableHead key={i}>Slot {i + 1}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GEAR_PIECES.map((piece) => (
                        <TableRow key={piece.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" aria-hidden="true">{piece.icon}</span>
                              <span>{piece.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <TierSelector
                              gearPieceId={piece.id}
                              value={gearTiers[piece.id] ?? DEFAULT_TIER}
                              onChange={handleTierChange}
                            />
                          </TableCell>
                          {[...Array(piece.slots)].map((_, index) => {
                            const slotNumber = index + 1;
                            const locked = isSlotLocked(piece.id, slotNumber, gearTiers);
                            return (
                              <TableCell key={index}>
                                {locked ? (
                                  <div
                                    className="flex items-center justify-center h-8 w-full rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 opacity-40"
                                    aria-label={`Slot ${slotNumber} locked — requires higher tier`}
                                  >
                                    <Lock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                  </div>
                                ) : (
                                  <RuneSelector
                                    field={`${piece.id}_rune_${slotNumber}`}
                                    value={runeValues[`${piece.id}_rune_${slotNumber}`]}
                                    onChange={handleRuneChange}
                                  />
                                )}
                              </TableCell>
                            );
                          })}
                          {[...Array(Math.max(0, 5 - piece.slots))].map((_, i) => <TableCell key={`empty-${i}`} />)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                 {/* Mount Collection Bonus Toggle */}
                 <div className={`mt-6 rounded-lg p-px transition-all duration-500 ${
                   mountBonusEnabled
                     ? 'rainbow-border rainbow-border-shimmer shadow-lg shadow-purple-500/10'
                     : 'bg-border hover:bg-muted-foreground/30'
                 }`}>
                   <div
                     className={`flex items-center justify-between p-4 rounded-[calc(var(--radius)-1px)] cursor-pointer transition-all duration-300 ${
                       mountBonusEnabled
                         ? 'bg-card hover:bg-card/80'
                         : 'bg-muted/30 hover:bg-muted/50'
                     }`}
                     onClick={() => setMountBonusEnabled(prev => !prev)}
                   >
                     <div className="flex items-center gap-3">
                       <div className="flex gap-0.5">
                         {RUNE_TYPES.map((type) => (
                           <div
                             key={type}
                             className={`w-2 h-2 rounded-full transition-all duration-300 ${
                               mountBonusEnabled ? 'opacity-100 scale-100' : 'opacity-30 scale-75'
                             } ${RUNE_COLOR_MAP[type]}`}
                           />
                         ))}
                       </div>
                       <div className="flex flex-col gap-0.5">
                         <span className={`text-sm font-medium transition-colors duration-300 ${
                           mountBonusEnabled ? 'text-foreground' : 'text-muted-foreground'
                         }`}>
                           Mount Collection Rainbow Rune
                         </span>
                         <span className="text-xs text-muted-foreground">
                           4 legendary mounts reward — adds +1 to all colors
                         </span>
                       </div>
                     </div>
                     <Switch
                       id="mount-bonus-toggle"
                       checked={mountBonusEnabled}
                       onCheckedChange={setMountBonusEnabled}
                       onClick={(e: React.MouseEvent) => e.stopPropagation()}
                     />
                   </div>
                 </div>

                 {/* Rune Distribution Section */}
                 <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-center">Rune Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Visual Bars */} 
                       <div className="flex flex-col items-center">
                          <div className="flex flex-wrap justify-center items-end gap-4 mb-4">
                            {RUNE_TYPES.map((type) => (
                              <div key={type} className="flex flex-col items-center gap-1">
                                <div className="relative" style={{ height: `${Math.max(10, results[type] * 10)}px`, width: "30px" }}>
                                   <div className={`absolute bottom-0 w-full ${RUNE_COLOR_MAP[type]} rounded-t-sm`} style={{ height: "100%" }}></div>
                                </div>
                                <div className="flex flex-col items-center mt-1">
                                  <div className={`w-5 h-5 ${RUNE_COLOR_MAP[type]} rounded-full`}></div>
                                  <span className="text-base font-bold mt-0.5">
                                    {results[type]}
                                    {mountBonusEnabled && <span className="text-xs font-normal text-primary ml-0.5">(+1)</span>}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{RUNE_OPTIONS.find(o => o.value === type)?.label}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                       {/* Stats Box */} 
                       <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                             <h4 className="text-sm font-medium mb-2">Rune Stats</h4>
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Total Slots:</span><span>{results.total}</span></div>
                                <div className="flex justify-between"><span>Filled Slots:</span><span>{results.filled}</span></div>
                                <div className="flex justify-between"><span>Empty Slots:</span><span>{results.total - results.filled}</span></div>
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between font-medium">
                                     <span>Most Common:</span>
                                     <span>{mostCommonRune}</span> {/* Use derived value */} 
                                  </div>
                                </div>
                             </div>
                          </div>
                          {/* Quick Fill Box */} 
                          {results.filled < results.total && (
                             <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                   <Info className="h-4 w-4 text-primary" /> Quick Fill Empty Slots
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                   {RUNE_OPTIONS.filter(o => o.value !== '-').map((rune) => (
                                     <Button
                                       key={`${rune.value}-fill`}
                                       variant="outline"
                                       size="sm"
                                       className="flex items-center gap-1 text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" 
                                       onClick={() => fillEmptySlots(rune.value)} // Use stable handler
                                     >
                                       <div className={`w-3 h-3 rounded-full ${rune.color}`}></div>
                                       Fill w/ {rune.label}
                                     </Button>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4 pb-6 px-6">
                 <p className="italic text-center text-sm text-muted-foreground max-w-md">"Don't Stop Dreaming"</p>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Presets Tab */} 
          <TabsContent value="presets">
            <Card>
              <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center gap-2"> <CircleCheck className="h-4 w-4 text-primary" /> Preset Configurations & Info</CardTitle>
                 <CardDescription>Apply pre-made builds or learn about runes.</CardDescription>
              </CardHeader>
              <CardContent>
                 <h3 className="text-base font-semibold mb-3">Apply a Preset:</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESETS.map((preset) => (
                       <Card key={preset.id} className="card-hover flex flex-col">
                          <CardHeader className="pb-2">
                             <CardTitle className="text-base">{preset.name}</CardTitle>
                             <CardDescription>{preset.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2 flex-grow">
                             <div className="flex justify-between mb-2">
                                {RUNE_TYPES.map((runeType) => {
                                   const count = Object.values(preset.config).filter((v) => v === runeType).length;
                                   return (
                                     <div key={runeType} className="flex flex-col items-center text-center">
                                       <div className={`w-4 h-4 rounded-full ${RUNE_COLOR_MAP[runeType]}`}></div>
                                       <span className="text-xs font-medium mt-1">{count}</span>
                                     </div>
                                   );
                                })}
                             </div>
                          </CardContent>
                          <CardFooter>
                             <Button variant="outline" size="sm" className="w-full cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={() => applyPreset(preset)}>Apply Preset</Button>
                          </CardFooter>
                       </Card>
                    ))} 
                 </div>
                 {/* Rune Strategy Guide */} 
                 <div className="mt-8 space-y-4">
                    <h3 className="text-base font-semibold mb-3 border-t pt-6">Rune Effects & Strategy Guide:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Strategy Content - Keep existing structure */}
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                         <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0"></div><h4 className="font-medium">Purple Runes</h4></div>
                         <p className="text-muted-foreground">Enhance magical properties, crit damage, etc.</p>
                      </div>
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                         <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500 flex-shrink-0"></div><h4 className="font-medium">White Runes</h4></div>
                         <p className="text-muted-foreground">Provide utility, balance, or support.</p>
                      </div>
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                         <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-400 flex-shrink-0"></div><h4 className="font-medium">Yellow Runes</h4></div>
                         <p className="text-muted-foreground">Boost speed, crit rate, or precision.</p>
                      </div>
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                         <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0"></div><h4 className="font-medium">Red Runes</h4></div>
                         <p className="text-muted-foreground">Increase attack power or physical damage.</p>
                      </div>
                      <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                         <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div><h4 className="font-medium">Green Runes</h4></div>
                         <p className="text-muted-foreground">Enhance defense, health, or survival.</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg mt-6 border-t pt-6">
                       <h4 className="text-base font-semibold mb-3">Rune Optimization Tips:</h4>
                       <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                          {/* Keep existing list items */}
                          <li>Identify Core Needs: Determine primary role.</li>
                          <li>Synergy Matters: Look for combinations.</li>
                          <li>Balance Offense & Defense.</li>
                          <li>Consider Content Type.</li>
                          <li>White Rune Flexibility.</li>
                          <li>External Knowledge: Refer to guides.</li>
                       </ul>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 