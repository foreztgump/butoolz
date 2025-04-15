'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added SelectValue
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, RefreshCw, Save, Download, Info, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

// Rune options with colors
const RUNE_OPTIONS = [
  { value: "-", label: "-", color: "bg-gray-200 dark:bg-gray-700" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "white", label: "White", color: "bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-400" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
]

// Gear pieces with their rune slots
const GEAR_PIECES = [
  { id: "main_hand", label: "Main Hand", slots: 5, icon: "⚔️" },
  { id: "off_hand", label: "Off Hand", slots: 5, icon: "🗡️" },
  { id: "head", label: "Head", slots: 5, icon: "👑" },
  { id: "chest", label: "Chest", slots: 5, icon: "🛡️" },
  { id: "pants", label: "Pants", slots: 5, icon: "👖" },
  { id: "boots", label: "Boots", slots: 5, icon: "👢" },
  { id: "gloves", label: "Gloves", slots: 5, icon: "🧤" },
  { id: "shoulder", label: "Shoulder", slots: 5, icon: "💪" },
  { id: "belt", label: "Waist", slots: 5, icon: "🧶" },
]

// Preset configurations
const PRESETS = [
  {
    id: "balanced",
    name: "Balanced Build",
    description: "Equal distribution of all rune types",
    config: {
      head_rune_1: "purple",
      head_rune_2: "white",
      head_rune_3: "yellow",
      head_rune_4: "red",
      head_rune_5: "green",
      chest_rune_1: "white",
      chest_rune_2: "yellow",
      chest_rune_3: "red",
      chest_rune_4: "green",
      chest_rune_5: "purple",
      pants_rune_1: "yellow",
      pants_rune_2: "red",
      pants_rune_3: "green",
      pants_rune_4: "purple",
      pants_rune_5: "white",
      boots_rune_1: "red",
      boots_rune_2: "green",
      boots_rune_3: "purple",
      boots_rune_4: "white",
      boots_rune_5: "yellow",
      gloves_rune_1: "green",
      gloves_rune_2: "purple",
      gloves_rune_3: "white",
      gloves_rune_4: "yellow",
      gloves_rune_5: "red",
      shoulder_rune_1: "purple",
      shoulder_rune_2: "white",
      shoulder_rune_3: "yellow",
      shoulder_rune_4: "red",
      shoulder_rune_5: "green",
      belt_rune_1: "white",
      belt_rune_2: "yellow",
      belt_rune_3: "red",
      belt_rune_4: "green",
      belt_rune_5: "purple",
      main_hand_rune_1: "yellow",
      main_hand_rune_2: "red",
      main_hand_rune_3: "green",
      main_hand_rune_4: "purple",
      main_hand_rune_5: "white",
      off_hand_rune_1: "red",
      off_hand_rune_2: "green",
      off_hand_rune_3: "purple",
      off_hand_rune_4: "white",
      off_hand_rune_5: "yellow",
    },
  },
  {
    id: "attack",
    name: "Attack Focus",
    description: "Maximizes red and yellow runes for damage",
    config: {
      head_rune_1: "red",
      head_rune_2: "red",
      head_rune_3: "yellow",
      head_rune_4: "yellow",
      head_rune_5: "purple",
      chest_rune_1: "red",
      chest_rune_2: "red",
      chest_rune_3: "yellow",
      chest_rune_4: "yellow",
      chest_rune_5: "purple",
      pants_rune_1: "red",
      pants_rune_2: "red",
      pants_rune_3: "yellow",
      pants_rune_4: "yellow",
      pants_rune_5: "white",
      boots_rune_1: "red",
      boots_rune_2: "red",
      boots_rune_3: "yellow",
      boots_rune_4: "yellow",
      boots_rune_5: "white",
      gloves_rune_1: "red",
      gloves_rune_2: "red",
      gloves_rune_3: "yellow",
      gloves_rune_4: "yellow",
      gloves_rune_5: "green",
      shoulder_rune_1: "red",
      shoulder_rune_2: "red",
      shoulder_rune_3: "yellow",
      shoulder_rune_4: "yellow",
      shoulder_rune_5: "green",
      belt_rune_1: "red",
      belt_rune_2: "red",
      belt_rune_3: "yellow",
      belt_rune_4: "yellow",
      belt_rune_5: "green",
      main_hand_rune_1: "red",
      main_hand_rune_2: "red",
      main_hand_rune_3: "yellow",
      main_hand_rune_4: "yellow",
      main_hand_rune_5: "purple",
      off_hand_rune_1: "red",
      off_hand_rune_2: "red",
      off_hand_rune_3: "yellow",
      off_hand_rune_4: "yellow",
      off_hand_rune_5: "purple",
    },
  },
  {
    id: "defense",
    name: "Defense Focus",
    description: "Maximizes green and white runes for survivability",
    config: {
      head_rune_1: "green",
      head_rune_2: "green",
      head_rune_3: "white",
      head_rune_4: "white",
      head_rune_5: "purple",
      chest_rune_1: "green",
      chest_rune_2: "green",
      chest_rune_3: "white",
      chest_rune_4: "white",
      chest_rune_5: "purple",
      pants_rune_1: "green",
      pants_rune_2: "green",
      pants_rune_3: "white",
      pants_rune_4: "white",
      pants_rune_5: "red",
      boots_rune_1: "green",
      boots_rune_2: "green",
      boots_rune_3: "white",
      boots_rune_4: "white",
      boots_rune_5: "red",
      gloves_rune_1: "green",
      gloves_rune_2: "green",
      gloves_rune_3: "white",
      gloves_rune_4: "white",
      gloves_rune_5: "yellow",
      shoulder_rune_1: "green",
      shoulder_rune_2: "green",
      shoulder_rune_3: "white",
      shoulder_rune_4: "white",
      shoulder_rune_5: "yellow",
      belt_rune_1: "green",
      belt_rune_2: "green",
      belt_rune_3: "white",
      belt_rune_4: "white",
      belt_rune_5: "yellow",
      main_hand_rune_1: "green",
      main_hand_rune_2: "green",
      main_hand_rune_3: "white",
      main_hand_rune_4: "white",
      main_hand_rune_5: "purple",
      off_hand_rune_1: "green",
      off_hand_rune_2: "green",
      off_hand_rune_3: "white",
      off_hand_rune_4: "white",
      off_hand_rune_5: "purple",
    },
  },
]

// Define types for state and handlers
type RuneValues = Record<string, string>;
type Results = {
  purple: number;
  white: number;
  yellow: number;
  red: number;
  green: number;
  total: number;
  filled: number;
};

export default function RunesDreaming() {
  // Initialize state for all rune slots
  const [runeValues, setRuneValues] = useState<RuneValues>(() => {
    const initialValues: RuneValues = {}
    GEAR_PIECES.forEach((piece) => {
      for (let i = 1; i <= piece.slots; i++) {
        initialValues[`${piece.id}_rune_${i}`] = "-"
      }
    })
    return initialValues
  })

  // State for calculated results
  const [results, setResults] = useState<Results>({
    purple: 0,
    white: 0,
    yellow: 0,
    red: 0,
    green: 0,
    total: 0,
    filled: 0,
  })

  // Handle rune selection change
  const handleRuneChange = (field: string, value: string) => {
    setRuneValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Calculate rune totals
  const calculateRunes = () => {
    const counts: Results = {
      purple: 0,
      white: 0,
      yellow: 0,
      red: 0,
      green: 0,
      total: 0,
      filled: 0,
    }

    // Count each rune type
    Object.values(runeValues).forEach((value) => {
      if (value !== "-") {
        counts[value as keyof Omit<Results, 'total' | 'filled'>]++ // Type assertion
        counts.filled++
      }
    })

    counts.total = GEAR_PIECES.reduce((acc, piece) => acc + piece.slots, 0)
    setResults(counts)
  }

  // Auto-calculate whenever rune values change
  useEffect(() => {
    calculateRunes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runeValues]) // Dependency array ensures recalculation

  // Reset all values
  const resetAll = () => {
    const resetValues: RuneValues = {}
    GEAR_PIECES.forEach((piece) => {
      for (let i = 1; i <= piece.slots; i++) {
        resetValues[`${piece.id}_rune_${i}`] = "-"
      }
    })
    setRuneValues(resetValues)
    toast("Reset Complete", {
      description: "All rune selections have been cleared.",
    })
  }

  // Apply a preset configuration
  const applyPreset = (preset: typeof PRESETS[0]) => {
    const typedConfig: RuneValues = { ...preset.config }; 
    setRuneValues(typedConfig)
    toast(`Applied ${preset.name}`, {
      description: preset.description,
    })
  }

  // Save configuration to local storage
  const saveConfiguration = () => {
    try {
      localStorage.setItem("butools_runes_config", JSON.stringify(runeValues))
      toast("Configuration Saved", {
        description: "Your rune configuration has been saved to your browser.",
      })
    } catch (error) {
      console.error("Failed to save config:", error); 
      toast.error("Save Failed", { 
        description: "Could not save your configuration. Check browser permissions?",
      })
    }
  }

  // Load configuration from local storage
  const loadConfiguration = () => {
    try {
      const savedConfig = localStorage.getItem("butools_runes_config")
      if (savedConfig) {
        const parsedConfig: RuneValues = JSON.parse(savedConfig);
        setRuneValues(parsedConfig) 
        toast("Configuration Loaded", {
          description: "Your saved rune configuration has been loaded.",
        })
      } else {
        toast.info("No Saved Configuration", { 
          description: "No previously saved configuration was found.",
        })
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      toast.error("Load Failed", { 
        description: "Could not load configuration. Saved data might be corrupted.",
      })
    }
  }

  // Fill all empty slots with a specific rune
  const fillEmptySlots = (runeType: string) => {
    const newValues: RuneValues = { ...runeValues }
    Object.keys(newValues).forEach((key) => {
      if (newValues[key] === "-") {
        newValues[key] = runeType
      }
    })
    setRuneValues(newValues)
    toast("Empty Slots Filled", {
      description: `All empty slots have been filled with ${RUNE_OPTIONS.find(r => r.value === runeType)?.label || runeType} runes.`, 
    })
  }

  // Get rune color class
  const getRuneColorClass = (runeValue: string) => {
    const rune = RUNE_OPTIONS.find((r) => r.value === runeValue)
    return rune ? rune.color : RUNE_OPTIONS[0].color
  }

  // Rune selector component with color indicator
  const RuneSelector = ({ id, value, onChange }: { id: string; value: string; onChange: (id: string, value: string) => void }) => (
    <div className="w-full">
      <Select value={value} onValueChange={(val) => onChange(id, val)}>
        <SelectTrigger id={id} className="h-9 w-full">
          {/* Use SelectValue for better accessibility and placeholder handling */}
          <SelectValue>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getRuneColorClass(value)}`}></div>
              <span>{RUNE_OPTIONS.find((r) => r.value === value)?.label || "Select rune"}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[999] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_6%)]"> {/* Apply direct styles like other pages */}
          {RUNE_OPTIONS.map((option) => (
            // Re-add explicit hover style that worked in baseatkcal
            <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-neutral-800 transition-colors duration-150">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Runes Dreaming</h1>
          <p className="text-sm text-muted-foreground">
            Calculate and optimize your rune configuration across all gear pieces.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {/* WORKAROUND: Explicit hover needed; default outline hover doesn't apply on this page */}
            <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={resetAll}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset All
            </Button>
            {/* WORKAROUND: Explicit hover needed */}
            <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={saveConfiguration}>
              <Save className="h-3 w-3 mr-1" />
              Save Config
            </Button>
            {/* WORKAROUND: Explicit hover needed */}
            <Button variant="outline" size="sm" className="text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={loadConfiguration}>
              <Download className="h-3 w-3 mr-1" />
              Load Config
            </Button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Completion:</span>
            <Badge variant={results.filled === results.total ? "default" : "outline"} className="text-xs">
              {results.filled}/{results.total} slots filled
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="configuration" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
              <Sparkles className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-1 transition-colors duration-150 hover:text-violet-200 hover:bg-violet-900/30 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 cursor-pointer">
              <CheckCircle2 className="h-4 w-4" />
              Presets & Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Rune Configuration
                </CardTitle>
                <CardDescription>Select the rune type for each slot in your gear pieces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Gear Piece</TableHead>
                        <TableHead>Slot 1</TableHead>
                        <TableHead>Slot 2</TableHead>
                        <TableHead>Slot 3</TableHead>
                        <TableHead>Slot 4</TableHead>
                        <TableHead>Slot 5</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GEAR_PIECES.map((piece) => (
                        <TableRow key={piece.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" aria-hidden="true">
                                {piece.icon}
                              </span>
                              <span>{piece.label}</span>
                            </div>
                          </TableCell>
                          {[...Array(piece.slots)].map((_, index) => (
                            <TableCell key={index}>
                              <RuneSelector
                                id={`${piece.id}_rune_${index + 1}`}
                                value={runeValues[`${piece.id}_rune_${index + 1}`]}
                                onChange={handleRuneChange}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4 text-center">Rune Distribution</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual representation */}
                    <div className="flex flex-col items-center">
                      <div className="flex flex-wrap justify-center items-end gap-4 mb-4">
                        {RUNE_OPTIONS.slice(1).map((rune) => (
                          <div key={rune.value} className="flex flex-col items-center gap-1">
                            <div
                              className="relative"
                              style={{
                                // Dynamic height based on count, with a minimum
                                height: `${Math.max(10, results[rune.value as keyof Omit<Results, 'total' | 'filled'>] * 10)}px`,
                                width: "30px", // Adjusted width
                              }}
                            >
                              <div
                                className={`absolute bottom-0 w-full ${rune.color} rounded-t-sm`} // Adjusted rounding
                                style={{ height: "100%" }}
                              ></div>
                            </div>
                            <div className="flex flex-col items-center mt-1">
                              <div className={`w-5 h-5 ${rune.color} rounded-full`}></div> {/* Adjusted size */}
                              <span className="text-base font-bold mt-0.5">{results[rune.value as keyof Omit<Results, 'total' | 'filled'>]}</span>
                              <span className="text-xs text-muted-foreground">{rune.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats and recommendations */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Rune Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Slots:</span>
                            <span>{results.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Filled Slots:</span>
                            <span>{results.filled}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Empty Slots:</span>
                            <span>{results.total - results.filled}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-medium">
                              <span>Most Common:</span>
                              <span>
                                {(() => {
                                  const counts = Object.entries(results)
                                    .filter(([key]) => ["purple", "white", "yellow", "red", "green"].includes(key))
                                    .sort(([, a], [, b]) => b - a);
                                  return counts[0]?.[1] > 0 ? (counts[0]?.[0] || "None") : "None"; // Show None if highest count is 0
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {results.filled < results.total && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Info className="h-4 w-4 text-primary" />
                            Quick Fill Empty Slots
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {RUNE_OPTIONS.slice(1).map((rune) => (
                              <Button
                                key={rune.value}
                                variant="outline"
                                size="sm"
                                // WORKAROUND: Explicit hover needed
                                className="flex items-center gap-1 text-xs cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                                onClick={() => fillEmptySlots(rune.value)}
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
              <CardFooter className="flex justify-center border-t pt-4 pb-6 px-6"> {/* Added padding */}
                <div className="text-center text-sm text-muted-foreground max-w-md">
                  <p className="italic">
                    "Don't Stop Dreaming" — Optimize your rune configuration to maximize your character's potential.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="presets">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Preset Configurations & Info
                </CardTitle>
                <CardDescription>Apply pre-made build configurations or learn about rune effects and strategies.</CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="text-base font-semibold mb-3">Apply a Preset:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRESETS.map((preset) => (
                    <Card key={preset.id} className="card-hover flex flex-col"> {/* Added flex */}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <CardDescription>{preset.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 flex-grow"> {/* Added flex-grow */}
                        <div className="flex justify-between mb-2">
                          {RUNE_OPTIONS.slice(1).map((rune) => {
                            const count = Object.values(preset.config).filter((v) => v === rune.value).length
                            return (
                              <div key={rune.value} className="flex flex-col items-center text-center">
                                <div className={`w-4 h-4 rounded-full ${rune.color}`}></div>
                                <span className="text-xs font-medium mt-1">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                      <CardFooter> {/* No pt needed if CardContent has pb */}
                        {/* WORKAROUND: Explicit hover needed */}
                        <Button variant="outline" size="sm" className="w-full cursor-pointer hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" onClick={() => applyPreset(preset)}>
                          Apply Preset
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-base font-semibold mb-3 border-t pt-6">Rune Effects & Strategy Guide:</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                        <h4 className="font-medium">Purple Runes (Magic/Crit Dmg)</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Typically enhance magical properties, critical damage multipliers, or special effects. Good for burst damage or caster builds.
                      </p>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500 flex-shrink-0"></div>
                        <h4 className="font-medium">White Runes (Utility/Balance)</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Often provide utility, balanced stats, or enhance support abilities. Versatile for filling gaps or specialized support roles.
                      </p>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 flex-shrink-0"></div>
                        <h4 className="font-medium">Yellow Runes (Speed/Crit Rate)</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Usually boost speed, critical hit chance, or precision. Ideal for builds focused on consistent damage or landing criticals.
                      </p>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0"></div>
                        <h4 className="font-medium">Red Runes (Attack/Power)</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Generally increase raw attack power, physical damage, or penetration. Core runes for melee or physical damage dealers.
                      </p>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                        <h4 className="font-medium">Green Runes (Defense/Survival)</h4>
                      </div>
                      <p className="text-muted-foreground">
                        Enhance defense, health, regeneration, or damage reduction. Essential for tanks or increasing survivability.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg mt-6 border-t pt-6">
                    <h4 className="text-base font-semibold mb-3">Rune Optimization Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                      <li><strong>Identify Core Needs:</strong> Determine the primary role (Damage, Tank, Support) and select 2-3 core rune colors that best serve that role.</li>
                      <li><strong>Synergy Matters:</strong> Look for rune combinations that amplify each other (e.g., Crit Rate from Yellow + Crit Damage from Purple).</li>
                      <li><strong>Balance Offense & Defense:</strong> Especially for general content or PvP, find a balance between damage-dealing runes (Red, Yellow, Purple) and survival runes (Green).</li>
                      <li><strong>Consider Content Type:</strong> Maximize damage (Red/Yellow/Purple) for PvE farming, but prioritize survivability (Green) for challenging bosses or PvP.</li>
                      <li><strong>White Rune Flexibility:</strong> Use White runes as versatile fillers when unsure or when specific utility bonuses are needed.</li>
                      <li><strong>External Knowledge:</strong> Refer to community guides or build simulators for specific game mechanics or advanced rune interactions not covered here.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 