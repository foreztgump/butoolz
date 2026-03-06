"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Sword,
  SwordIcon,
  Info,
  Zap,
  BarChart3,
  Sparkles,
  HelpCircle,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Crosshair,
} from "lucide-react"

const VIOLET_ACCENT = "text-violet-600"
const VIOLET_ICON = "text-violet-500"
const VIOLET_BADGE = "bg-violet-100 text-violet-800 border-violet-300"

// Define interface for the change object
interface ChangeInfo {
  text: string
  isPositive: boolean
  isNeutral: boolean
}

// Define props interface for StatInput
interface StatInputProps {
  label: string
  value: number | string // Allow string for initial/empty state if needed
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
  tooltip?: string | null
  isInvalid?: boolean
  maxIntegerDigits?: number
  maxDecimalDigits?: number
}

// Input component with label, suffix, and tooltip
const StatInput: React.FC<StatInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  tooltip,
  isInvalid = false,
  maxIntegerDigits,
  maxDecimalDigits,
}) => {
  // Input change handler to filter input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Basic pattern: Allow empty or non-negative digits/decimal
    const validPattern = /^(|\d*\.?\d*)$/;

    if (validPattern.test(rawValue)) {
      // Check length constraints if the basic pattern is valid
      const parts = rawValue.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Check integer part length
      if (maxIntegerDigits !== undefined && integerPart.length > maxIntegerDigits) {
        return; // Prevent update if integer part is too long
      }

      // Check decimal part length
      if (maxDecimalDigits !== undefined && decimalPart !== undefined && decimalPart.length > maxDecimalDigits) {
        // Special case: If maxDecimalDigits is 0, prevent typing the decimal point itself
        if (maxDecimalDigits === 0 && rawValue.includes('.')) {
           return;
        }
        if (maxDecimalDigits > 0) { // Only prevent if limit is > 0 and exceeded
             return; // Prevent update if decimal part is too long
        }
      }

      // If all checks pass, update the state
      onChange(rawValue);
    }
    // If the basic pattern doesn't match, do nothing, preventing the invalid input.
  };

  return (
  <div className="flex items-center space-x-2">
    <div className="w-1/2 flex items-center">
      <Label className="text-sm">{label}</Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <div className="w-1/2 flex">
      <Input
          type="text"
          inputMode="decimal"
          pattern="\\d*(\\.\\d*)?$"
          min="0"
          value={value}
          onChange={handleInputChange}
        placeholder={placeholder}
        className="h-8"
        aria-label={label}
          aria-invalid={isInvalid}
      />
      {suffix && <div className="flex items-center pl-2 text-sm text-muted-foreground">{suffix}</div>}
    </div>
  </div>
)
}

// Define props interface for ResultDisplay
interface ResultDisplayProps {
  label: string
  value: number
  change?: ChangeInfo | null
  highlight?: boolean
  icon?: React.ReactNode
}

// Result Display Component
const ResultDisplay: React.FC<ResultDisplayProps> = ({
  label,
  value,
  change = null,
  highlight = false,
  icon = null,
}) => (
  <div className={`flex items-center justify-between ${highlight ? "font-bold" : ""}`}>
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-4">
      {icon && <span className={VIOLET_ICON}>{icon}</span>}
      {label}
    </div>
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className={highlight ? VIOLET_ACCENT : ""}>{value.toFixed(2)}</span>
      {change && (
        <span
          className={`flex items-center text-xs ${
            change.isPositive ? "text-green-600" : change.isNeutral ? "text-gray-500" : "text-red-600"
          }`}
        >
          {change.isPositive ? (
            <TrendingUp size={12} />
          ) : change.isNeutral ? (
            <Minus size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span className="ml-0.5">{change.text}</span>
        </span>
      )}
    </div>
  </div>
)

// Helper function to safely parse float, defaulting to 0
const safeParseFloat = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === "") return 0
  const parsed = Number.parseFloat(value.toString())
  return Number.isNaN(parsed) ? 0 : parsed
}

// Helper function to validate numeric inputs (allow empty or non-negative numbers)
const isValidNumberInput = (value: string): boolean => {
  if (value === "") return true; // Empty is considered valid (treated as 0)
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
};

export default function BaseAttackCalculator() {
  // State for base stats (store as strings)
  const [baseStats, setBaseStats] = useState({
    base_atk: "",
    atk_bonus: "",
    crit_rate: "",
    crit_dmg: "",
    all_dmg: "",
    def_pen: "",
  })

  // State for Target Stats (store as strings)
  const [targetStats, setTargetStats] = useState({
    defense: "",
    level: "",
  })

  // State for equipment piece A (store as strings)
  const [equipmentA, setEquipmentA] = useState({
    plus_atk_1: "",
    plus_atk_pct_1: "",
    plus_cr_1: "",
    plus_cd_1: "",
    plus_all_dmg_1: "",
    plus_def_pen_1: "",
  })

  // State for equipment piece B (store as strings)
  const [equipmentB, setEquipmentB] = useState({
    plus_atk_2: "",
    plus_atk_pct_2: "",
    plus_cr_2: "",
    plus_cd_2: "",
    plus_all_dmg_2: "",
    plus_def_pen_2: "",
  })

  // State for buffs
  const [buffs, setBuffs] = useState({
    elixir: "0",
    panacea: "0",
    food: "0",
  })

  // State for calculated results (refactored structure)
  const [results, setResults] = useState({
    // Base results
    base: {
      totalAttack: 0,
      avgDamageOutput: 0,
      mitigationFactor: 0,
      finalDamage: 0,
    },
    // Equipment A results
    equipmentA: {
      totalAttack: 0,
      critRate: 0,
      critDamage: 0,
      allDamage: 0,
      defPen: 0,
      avgDamageOutput: 0,
      mitigationFactor: 0,
      finalDamage: 0,
    },
    // Equipment B results
    equipmentB: {
      totalAttack: 0,
      critRate: 0,
      critDamage: 0,
      allDamage: 0,
      defPen: 0,
      avgDamageOutput: 0,
      mitigationFactor: 0,
      finalDamage: 0,
    },
    // Buff results (applied to BASE stats for now)
    buffs: {
      atkBonus: 0,
      crBonus: 0,
      cdBonus: 0,
      totalAttack: 0,
      critRate: 0,
      critDamage: 0,
      allDamage: 0,
      defPen: 0,
      avgDamageOutput: 0,
      mitigationFactor: 0,
      finalDamage: 0,
    },
  })

  // State for validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Handle base stats changes (store raw string)
  const handleBaseStatsChange = (field: keyof typeof baseStats, value: string) => {
    setBaseStats((prev) => ({ ...prev, [field]: value }))
  }

  // Handle Target stats changes (store raw string)
  const handleTargetStatsChange = (field: keyof typeof targetStats, value: string) => {
    setTargetStats((prev) => ({ ...prev, [field]: value }))
  }

  // Handle equipment A changes (store raw string)
  const handleEquipmentAChange = (field: keyof typeof equipmentA, value: string) => {
    setEquipmentA((prev) => ({ ...prev, [field]: value }))
  }

  // Handle equipment B changes (store raw string)
  const handleEquipmentBChange = (field: keyof typeof equipmentB, value: string) => {
    setEquipmentB((prev) => ({ ...prev, [field]: value }))
  }

  // Handle buffs changes
  const handleBuffsChange = (field: string, value: string) => {
    setBuffs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Reset all values
  const resetAll = () => {
    setBaseStats({
      base_atk: "",
      atk_bonus: "",
      crit_rate: "",
      crit_dmg: "",
      all_dmg: "",
      def_pen: "",
    })
    setTargetStats({
      defense: "",
      level: "",
    })
    setEquipmentA({
      plus_atk_1: "",
      plus_atk_pct_1: "",
      plus_cr_1: "",
      plus_cd_1: "",
      plus_all_dmg_1: "",
      plus_def_pen_1: "",
    })
    setEquipmentB({
      plus_atk_2: "",
      plus_atk_pct_2: "",
      plus_cr_2: "",
      plus_cd_2: "",
      plus_all_dmg_2: "",
      plus_def_pen_2: "",
    })
    setBuffs({
      elixir: "0",
      panacea: "0",
      food: "0",
    })
    // Results reset automatically via useEffect
  }

  // --- Calculation Logic ---
  const BASE_CRIT_MULTIPLIER = 1.5 // Assume 150% base crit damage (Adjust if known)

  // 1. Calculate Total Attack
  const calculateTotalAttack = useCallback((baseAtk: number, atkBonusPct: number, flatAtkBonus: number = 0, pctAtkBonus: number = 0): number => {
    // Apply percentage bonuses first, then flat bonus
    const totalPctBonus = (safeParseFloat(atkBonusPct) + safeParseFloat(pctAtkBonus)) / 100
    return (safeParseFloat(baseAtk) * (1 + totalPctBonus)) + safeParseFloat(flatAtkBonus)
  }, []);

  // 2. Calculate Average Damage Output (Pre-Mitigation)
  const calculateAverageDamageOutput = useCallback((totalAttack: number, critRate: number, critDmgBonus: number, allDmg: number): number => {
    const cr = safeParseFloat(critRate) / 100
    const cdBonus = safeParseFloat(critDmgBonus) / 100
    const ad = safeParseFloat(allDmg) / 100

    const nonCritDamage = totalAttack * (1 - cr)
    const critDamage = totalAttack * (BASE_CRIT_MULTIPLIER + cdBonus) * cr // Add bonus CD to base multiplier
    const totalAverageDamage = (nonCritDamage + critDamage) * (1 + ad)

    return totalAverageDamage
  }, [BASE_CRIT_MULTIPLIER]);

  // 4. Calculate Mitigation Factor
  const calculateMitigationFactor = useCallback((targetDef: number, targetLvl: number, attackerDefPen: number): number => {
    const tDef = safeParseFloat(targetDef)
    const tLvl = safeParseFloat(targetLvl)
    const pen = safeParseFloat(attackerDefPen) / 100

    if (tDef <= 0 || tLvl <= 0) return 0 // Avoid division by zero or nonsensical results

    // Example mitigation formula (Needs verification for Bless Unleashed specific formula!)
    // This is a common RPG formula structure, adjust as needed.
    const effectiveDefense = Math.max(0, tDef * (1 - pen)) // Ensure defense doesn't go below 0
    const mitigation = effectiveDefense / (effectiveDefense + (tLvl * 50)) // Level scaling factor (50 is arbitrary, adjust!)

    return Math.min(1, Math.max(0, mitigation)) // Clamp between 0% and 100% reduction
  }, []);

  // 5. Calculate Final Damage (Post-Mitigation)
  const calculateFinalDamage = useCallback((avgDamageOutput: number, mitigationFactor: number): number => {
    return safeParseFloat(avgDamageOutput) * (1 - safeParseFloat(mitigationFactor))
  }, []);

  // 3. Apply Buffs (returns calculated stats with buffs)
  const applyBuffs = useCallback((currentStats: { 
    base_atk: number; 
    atk_bonus: number; 
    crit_rate: number; 
    crit_dmg: number; 
    all_dmg: number; 
    def_pen: number; 
  }): { 
    atkBonus: number; 
    crBonus: number; 
    cdBonus: number; 
    totalAttack: number; 
    critRate: number; 
    critDamage: number; 
    allDamage: number; 
    defPen: number; 
    avgDamageOutput: number; 
    mitigationFactor: number; 
    finalDamage: number; 
  } => {
    let atkBuff = 0
    let crBuff = 0
    let cdBuff = 0

    // Elixir
    if (buffs.elixir === "1") atkBuff += 15 // Thorns III (Assuming ATK%?) - Verify!
    else if (buffs.elixir === "2") crBuff += 4 // Hunter III
    else if (buffs.elixir === "3") cdBuff += 18 // Destruction III

    // Panacea
    if (buffs.panacea === "1") atkBuff += 15 // Blade (Assuming ATK%?) - Verify!
    else if (buffs.panacea === "2") atkBuff += 20 // Superior Blade (Assuming ATK%?) - Verify!
    else if (buffs.panacea === "3") cdBuff += 30 // Destruction
    else if (buffs.panacea === "4") cdBuff += 36 // Superior Destruction
    else if (buffs.panacea === "5") crBuff += 6 // Hunter
    else if (buffs.panacea === "6") crBuff += 7.5 // Superior Sharpness

    // Food
    if (buffs.food === "1") cdBuff += 24 // Beef Curry
    else if (buffs.food === "2") crBuff += 4.5 // Tiger Shrimp

    const buffedAtkBonus = currentStats.atk_bonus + atkBuff
    const buffedCritRate = currentStats.crit_rate + crBuff
    const buffedCritDamage = currentStats.crit_dmg + cdBuff
    const buffedAllDamage = currentStats.all_dmg
    const buffedDefPen = currentStats.def_pen

    const buffedTotalAttack = calculateTotalAttack(currentStats.base_atk, buffedAtkBonus)
    const buffedAvgDamage = calculateAverageDamageOutput(buffedTotalAttack, buffedCritRate, buffedCritDamage, buffedAllDamage);
    const buffedMitigation = calculateMitigationFactor(safeParseFloat(targetStats.defense), safeParseFloat(targetStats.level), buffedDefPen);
    const buffedFinalDamage = calculateFinalDamage(buffedAvgDamage, buffedMitigation);

    return {
      atkBonus: atkBuff,
      crBonus: crBuff,
      cdBonus: cdBuff,
      totalAttack: buffedTotalAttack,
      critRate: buffedCritRate,
      critDamage: buffedCritDamage,
      allDamage: buffedAllDamage,
      defPen: buffedDefPen,
      avgDamageOutput: buffedAvgDamage,
      mitigationFactor: buffedMitigation,
      finalDamage: buffedFinalDamage,
    }
  }, [buffs, targetStats, calculateTotalAttack, calculateAverageDamageOutput, calculateMitigationFactor, calculateFinalDamage]);

  // Effect to recalculate whenever inputs change, including validation
  useEffect(() => {
    // --- Input Validation --- 
    const validateAllInputs = (): Record<string, boolean> => {
      const newErrors: Record<string, boolean> = {}
      const checkField = (obj: Record<string, string>, key: string) => {
        if (!isValidNumberInput(obj[key])) {
          newErrors[key] = true;
        }
      }

      Object.keys(baseStats).forEach(key => checkField(baseStats, key));
      Object.keys(targetStats).forEach(key => checkField(targetStats, key));
      Object.keys(equipmentA).forEach(key => checkField(equipmentA, key));
      Object.keys(equipmentB).forEach(key => checkField(equipmentB, key));

      return newErrors;
    }

    const validationErrors = validateAllInputs();
    setErrors(validationErrors);

    // If there are errors, reset results and stop calculation
    if (Object.values(validationErrors).some(isError => isError)) {
    setResults({
        base: { totalAttack: 0, avgDamageOutput: 0, mitigationFactor: 0, finalDamage: 0 },
        equipmentA: { totalAttack: 0, critRate: 0, critDamage: 0, allDamage: 0, defPen: 0, avgDamageOutput: 0, mitigationFactor: 0, finalDamage: 0 },
        equipmentB: { totalAttack: 0, critRate: 0, critDamage: 0, allDamage: 0, defPen: 0, avgDamageOutput: 0, mitigationFactor: 0, finalDamage: 0 },
        buffs: { atkBonus: 0, crBonus: 0, cdBonus: 0, totalAttack: 0, critRate: 0, critDamage: 0, allDamage: 0, defPen: 0, avgDamageOutput: 0, mitigationFactor: 0, finalDamage: 0 },
      });
      return; // Stop calculation if inputs are invalid
    }

    // --- Calculations (Proceed only if validation passes) ---
    // Safely parse all values needed for calculations
    const parsedBase = {
      base_atk: safeParseFloat(baseStats.base_atk),
      atk_bonus: safeParseFloat(baseStats.atk_bonus),
      crit_rate: safeParseFloat(baseStats.crit_rate),
      crit_dmg: safeParseFloat(baseStats.crit_dmg),
      all_dmg: safeParseFloat(baseStats.all_dmg),
      def_pen: safeParseFloat(baseStats.def_pen),
    };
    const parsedTarget = {
      defense: safeParseFloat(targetStats.defense),
      level: safeParseFloat(targetStats.level),
    };
    const parsedEquipA = {
      plus_atk_1: safeParseFloat(equipmentA.plus_atk_1),
      plus_atk_pct_1: safeParseFloat(equipmentA.plus_atk_pct_1),
      plus_cr_1: safeParseFloat(equipmentA.plus_cr_1),
      plus_cd_1: safeParseFloat(equipmentA.plus_cd_1),
      plus_all_dmg_1: safeParseFloat(equipmentA.plus_all_dmg_1),
      plus_def_pen_1: safeParseFloat(equipmentA.plus_def_pen_1),
    };
    const parsedEquipB = {
      plus_atk_2: safeParseFloat(equipmentB.plus_atk_2),
      plus_atk_pct_2: safeParseFloat(equipmentB.plus_atk_pct_2),
      plus_cr_2: safeParseFloat(equipmentB.plus_cr_2),
      plus_cd_2: safeParseFloat(equipmentB.plus_cd_2),
      plus_all_dmg_2: safeParseFloat(equipmentB.plus_all_dmg_2),
      plus_def_pen_2: safeParseFloat(equipmentB.plus_def_pen_2),
    };

    // Calculate Base Stats Results using parsed values
    const baseTotalAttack = calculateTotalAttack(parsedBase.base_atk, parsedBase.atk_bonus);
    const baseAvgDamage = calculateAverageDamageOutput(baseTotalAttack, parsedBase.crit_rate, parsedBase.crit_dmg, parsedBase.all_dmg);
    const baseMitigation = calculateMitigationFactor(parsedTarget.defense, parsedTarget.level, parsedBase.def_pen);
    const baseFinalDamage = calculateFinalDamage(baseAvgDamage, baseMitigation);

    // Calculate Equipment A Results using parsed values
    const eqATotalAttack = calculateTotalAttack(parsedBase.base_atk, parsedBase.atk_bonus, parsedEquipA.plus_atk_1, parsedEquipA.plus_atk_pct_1);
    const eqACritRate = parsedBase.crit_rate + parsedEquipA.plus_cr_1;
    const eqACritDamage = parsedBase.crit_dmg + parsedEquipA.plus_cd_1; // Bonus
    const eqAAllDamage = parsedBase.all_dmg + parsedEquipA.plus_all_dmg_1;
    const eqADefPen = parsedBase.def_pen + parsedEquipA.plus_def_pen_1;
    const eqAAvgDamage = calculateAverageDamageOutput(eqATotalAttack, eqACritRate, eqACritDamage, eqAAllDamage);
    const eqAMitigation = calculateMitigationFactor(parsedTarget.defense, parsedTarget.level, eqADefPen);
    const eqAFinalDamage = calculateFinalDamage(eqAAvgDamage, eqAMitigation);

    // Calculate Equipment B Results using parsed values
    const eqBTotalAttack = calculateTotalAttack(parsedBase.base_atk, parsedBase.atk_bonus, parsedEquipB.plus_atk_2, parsedEquipB.plus_atk_pct_2);
    const eqBCritRate = parsedBase.crit_rate + parsedEquipB.plus_cr_2;
    const eqBCritDamage = parsedBase.crit_dmg + parsedEquipB.plus_cd_2; // Bonus
    const eqBAllDamage = parsedBase.all_dmg + parsedEquipB.plus_all_dmg_2;
    const eqBDefPen = parsedBase.def_pen + parsedEquipB.plus_def_pen_2;
    const eqBAvgDamage = calculateAverageDamageOutput(eqBTotalAttack, eqBCritRate, eqBCritDamage, eqBAllDamage);
    const eqBMitigation = calculateMitigationFactor(parsedTarget.defense, parsedTarget.level, eqBDefPen);
    const eqBFinalDamage = calculateFinalDamage(eqBAvgDamage, eqBMitigation);

    // Calculate Buff Results (Applied to Base Stats) using parsed values
    // Need to pass parsed base stats to applyBuffs if it uses them internally (assuming it does)
    const buffedStats = applyBuffs(parsedBase); // Pass parsed base stats
    const buffAvgDamage = calculateAverageDamageOutput(buffedStats.totalAttack, buffedStats.critRate, buffedStats.critDamage, buffedStats.allDamage);
    const buffMitigation = calculateMitigationFactor(parsedTarget.defense, parsedTarget.level, buffedStats.defPen);
    const buffFinalDamage = calculateFinalDamage(buffAvgDamage, buffMitigation);

    setResults({
      base: {
        totalAttack: baseTotalAttack,
        avgDamageOutput: baseAvgDamage,
        mitigationFactor: baseMitigation,
        finalDamage: baseFinalDamage,
      },
      equipmentA: {
        totalAttack: eqATotalAttack,
        critRate: eqACritRate,
        critDamage: eqACritDamage,
        allDamage: eqAAllDamage,
        defPen: eqADefPen,
        avgDamageOutput: eqAAvgDamage,
        mitigationFactor: eqAMitigation,
        finalDamage: eqAFinalDamage,
      },
      equipmentB: {
        totalAttack: eqBTotalAttack,
        critRate: eqBCritRate,
        critDamage: eqBCritDamage,
        allDamage: eqBAllDamage,
        defPen: eqBDefPen,
        avgDamageOutput: eqBAvgDamage,
        mitigationFactor: eqBMitigation,
        finalDamage: eqBFinalDamage,
      },
      buffs: {
        atkBonus: buffedStats.atkBonus,
        crBonus: buffedStats.crBonus,
        cdBonus: buffedStats.cdBonus,
        totalAttack: buffedStats.totalAttack,
        critRate: buffedStats.critRate,
        critDamage: buffedStats.critDamage,
        allDamage: buffedStats.allDamage,
        defPen: buffedStats.defPen,
        avgDamageOutput: buffAvgDamage,
        mitigationFactor: buffMitigation,
        finalDamage: buffFinalDamage,
      },
    })
  }, [baseStats, targetStats, equipmentA, equipmentB, buffs, applyBuffs, calculateTotalAttack, calculateAverageDamageOutput, calculateMitigationFactor, calculateFinalDamage]) // Recalculate when any input changes

  // Helper to format change percentage/value
  const formatChange = (newValue: number, baseValue: number): ChangeInfo | null => {
    const nv = safeParseFloat(newValue); // Ensure numbers
    const bv = safeParseFloat(baseValue);

    // If base is zero or both are zero/negligible
    if (bv === 0 || (Math.abs(nv) < 0.01 && Math.abs(bv) < 0.01)) {
        // Return null to hide the change indicator entirely in this case
        return null; 
    }

    const diff = nv - bv;
    const percentage = (diff / bv) * 100;
    const sign = diff >= 0 ? "+" : "";
    const percentageSign = percentage >= 0 ? "+" : "";

    // Avoid showing -0.0% for tiny negative differences
    const displayPercentage = Math.abs(percentage) < 0.01 && percentage < 0 ? 0 : percentage;

      return {
      text: `${sign}${diff.toFixed(1)} (${percentageSign}${displayPercentage.toFixed(1)}%)`,
      isPositive: diff > 0.05, // Add a small tolerance for floating point issues
      isNeutral: Math.abs(diff) <= 0.05
    }
  }

  // Determine which equipment piece is better based on FINAL damage
  const getBetterEquipment = () => {
    const dmgA = results.equipmentA.finalDamage;
    const dmgB = results.equipmentB.finalDamage;

    // If both results are effectively zero, inputs are likely missing/invalid
    if (Math.abs(dmgA) < 0.01 && Math.abs(dmgB) < 0.01) {
      return { winner: "None", text: "(Enter Stats)" }; // Indicate need for input
    }

    const diff = dmgA - dmgB;
    if (Math.abs(diff) < 0.01) return { winner: "None", text: "(Identical Performance)" } // Consider them equal if very close
    if (diff > 0) return { winner: "A", text: <span className={VIOLET_ACCENT}>(Equip A Wins)</span> } // Style winner
    return { winner: "B", text: <span className={VIOLET_ACCENT}>(Equip B Wins)</span> } // Style winner
  }

  // Determine if current buffs are beneficial compared to BASE stats
  const areBuffsBeneficial = () => {
    const diff = results.buffs.finalDamage - results.base.finalDamage
    if (Math.abs(diff) < 0.01) return { beneficial: "Neutral", text: "(No Change)" } // Neutral if very close
    if (diff > 0) return { beneficial: "Yes", text: "(Buffs Help)" }
    return { beneficial: "No", text: "(Buffs Hurt)" }
  }

  // Determine the best setup (Base vs Equip A vs Equip B vs Buffs on Base)
  // Note: This doesn't compare Equip A+Buffs vs Equip B+Buffs yet
  const getBestSetup = () => {
    const setups = [
      { name: "Base", damage: results.base.finalDamage },
      { name: "Equip A", damage: results.equipmentA.finalDamage },
      { name: "Equip B", damage: results.equipmentB.finalDamage },
      { name: "Base+Buffs", damage: results.buffs.finalDamage },
    ]

    setups.sort((a, b) => b.damage - a.damage) // Sort descending by damage

    if (setups[0].damage <= 0) return "No Damage" // Handle case where all damage is 0 or negative

    return setups[0].name
  }

  // Constants for dropdown options (using value/label pairs)
  const ELIXIR_CHOICES = [
    { value: "0", label: "- None -" },
    { value: "1", label: "Thorns III (+15% ATK)" }, // Verify ATK%
    { value: "2", label: "Hunter III (+4% Crit Rate)" },
    { value: "3", label: "Destruction III (+18% Crit Damage)" },
  ]
  const PANACEA_CHOICES = [
    { value: "0", label: "- None -" },
    { value: "1", label: "Blade (+15% ATK)" }, // Verify ATK%
    { value: "2", label: "Superior Blade (+20% ATK)" }, // Verify ATK%
    { value: "3", label: "Destruction (+30% Crit Damage)" },
    { value: "4", label: "Superior Destruction (+36% Crit Damage)" },
    { value: "5", label: "Hunter (+6% Crit Rate)" },
    { value: "6", label: "Superior Sharpness (+7.5% Crit Rate)" },
  ]
  const FOOD_CHOICES = [
    { value: "0", label: "- None -" },
    { value: "1", label: "Beef Curry (+24% Crit Damage)" },
    { value: "2", label: "Tiger Shrimp (+4.5% Crit Rate)" },
  ]

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="text-violet-600" /> Bless Unleashed Damage Calculator
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Inputs (Base, Target, Buffs) */}
        <div className="space-y-6">
          {/* Base Stats Card */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star size={18} className={VIOLET_ICON} /> Your Base Stats
                    </CardTitle>
              <CardDescription>Enter your character's core stats without temporary buffs or gear bonuses.</CardDescription>
                  </CardHeader>
            <CardContent className="space-y-3 pt-2">
                    <StatInput
                      label="Base Attack"
                      value={baseStats.base_atk}
                onChange={(v) => handleBaseStatsChange("base_atk", v)}
                placeholder="e.g., 4000"
                tooltip="Your character's attack value shown in the stats window, without gear or temporary buff bonuses."
                isInvalid={errors.base_atk}
                maxIntegerDigits={7} maxDecimalDigits={0}
                    />
                    <StatInput
                      label="Attack Bonus"
                      value={baseStats.atk_bonus}
                onChange={(v) => handleBaseStatsChange("atk_bonus", v)}
                placeholder="e.g., 15"
                      suffix="%"
                tooltip="Permanent Attack % increases (e.g., from passive skills, titles). Do not include temporary buffs here."
                isInvalid={errors.atk_bonus}
                maxIntegerDigits={3} maxDecimalDigits={1}
                    />
                    <StatInput
                      label="Crit Rate"
                      value={baseStats.crit_rate}
                onChange={(v) => handleBaseStatsChange("crit_rate", v)}
                placeholder="e.g., 25"
                      suffix="%"
                tooltip="Your base chance to land a critical hit."
                isInvalid={errors.crit_rate}
                maxIntegerDigits={3} maxDecimalDigits={1}
                    />
                    <StatInput
                label="Crit Damage Bonus"
                      value={baseStats.crit_dmg}
                onChange={(v) => handleBaseStatsChange("crit_dmg", v)}
                placeholder="e.g., 50"
                      suffix="%"
                tooltip={`Bonus damage added on top of the base critical multiplier (${(BASE_CRIT_MULTIPLIER * 100).toFixed(0)}%). Enter only the additional percentage.`}
                isInvalid={errors.crit_dmg}
                maxIntegerDigits={3} maxDecimalDigits={1}
                    />
                    <StatInput
                      label="All Damage"
                      value={baseStats.all_dmg}
                onChange={(v) => handleBaseStatsChange("all_dmg", v)}
                placeholder="e.g., 10"
                      suffix="%"
                tooltip="General damage increases that apply to all damage dealt (e.g., from certain passives or titles)."
                isInvalid={errors.all_dmg}
                maxIntegerDigits={3} maxDecimalDigits={1}
              />
              <StatInput
                label="Defense Penetration"
                value={baseStats.def_pen}
                onChange={(v) => handleBaseStatsChange("def_pen", v)}
                placeholder="e.g., 5"
                suffix="%"
                tooltip="How much of the target's defense is ignored by your attacks."
                isInvalid={errors.def_pen}
                maxIntegerDigits={3} maxDecimalDigits={1}
              />
            </CardContent>
          </Card>

          {/* Target Stats Card */}
          <Card className="bg-card/50 border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crosshair size={18} className={VIOLET_ICON} /> Target Stats
              </CardTitle>
              <CardDescription>Enter the stats of the target you are attacking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <StatInput
                label="Target Defense"
                value={targetStats.defense}
                onChange={(v) => handleTargetStatsChange("defense", v)}
                placeholder="e.g., 5000"
                tooltip="The defense value of the enemy or player you are targeting."
                isInvalid={errors.defense}
                maxIntegerDigits={7} maxDecimalDigits={0}
              />
              <StatInput
                label="Target Level"
                value={targetStats.level}
                onChange={(v) => handleTargetStatsChange("level", v)}
                placeholder="e.g., 45"
                tooltip="The level of the enemy or player. Used in mitigation calculation."
                isInvalid={errors.level}
                maxIntegerDigits={3} maxDecimalDigits={0}
              />
                  </CardContent>
                </Card>

          {/* Buffs Card */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap size={18} className={VIOLET_ICON} /> Active Buffs
                    </CardTitle>
              <CardDescription>Select active consumables. These apply to your BASE stats.</CardDescription>
                  </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Label className="w-1/2">Elixir</Label>
                <Select value={buffs.elixir} onValueChange={(v) => handleBuffsChange("elixir", v)}>
                  <SelectTrigger className="w-1/2 h-8">
                    <SelectValue placeholder="Select Elixir" />
                        </SelectTrigger>
                  <SelectContent className="z-[999] bg-[hsl(240_10%_6%)] text-popover-foreground border border-[hsl(240_3.7%_15.9%)] shadow-md">
                    {ELIXIR_CHOICES.map((choice) => (
                      <SelectItem key={choice.value} value={choice.value} className="hover:bg-neutral-800 transition-colors duration-150">
                        {choice.label}
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
                    </div>
              <div className="flex items-center space-x-2">
                <Label className="w-1/2">Panacea</Label>
                <Select value={buffs.panacea} onValueChange={(v) => handleBuffsChange("panacea", v)}>
                  <SelectTrigger className="w-1/2 h-8">
                    <SelectValue placeholder="Select Panacea" />
                        </SelectTrigger>
                  <SelectContent className="z-[999] bg-[hsl(240_10%_6%)] text-popover-foreground border border-[hsl(240_3.7%_15.9%)] shadow-md">
                    {PANACEA_CHOICES.map((choice) => (
                      <SelectItem key={choice.value} value={choice.value} className="hover:bg-neutral-800 transition-colors duration-150">
                        {choice.label}
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
                    </div>
              <div className="flex items-center space-x-2">
                <Label className="w-1/2">Food</Label>
                <Select value={buffs.food} onValueChange={(v) => handleBuffsChange("food", v)}>
                  <SelectTrigger className="w-1/2 h-8">
                    <SelectValue placeholder="Select Food" />
                        </SelectTrigger>
                  <SelectContent className="z-[999] bg-[hsl(240_10%_6%)] text-popover-foreground border border-[hsl(240_3.7%_15.9%)] shadow-md">
                    {FOOD_CHOICES.map((choice) => (
                      <SelectItem key={choice.value} value={choice.value} className="hover:bg-neutral-800 transition-colors duration-150">
                        {choice.label}
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
                    </div>
              {/* Display Total Buffs Applied */}
              {(results.buffs.crBonus > 0 || results.buffs.cdBonus > 0 || results.buffs.atkBonus > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {results.buffs.atkBonus > 0 && <Badge variant="outline" className={VIOLET_BADGE}>+{results.buffs.atkBonus.toFixed(1)}% ATK</Badge>}
                  {results.buffs.crBonus > 0 && <Badge variant="outline" className={VIOLET_BADGE}>+{results.buffs.crBonus.toFixed(1)}% Crit Rate</Badge>}
                  {results.buffs.cdBonus > 0 && <Badge variant="outline" className={VIOLET_BADGE}>+{results.buffs.cdBonus.toFixed(1)}% Crit Dmg</Badge>}
                      </div>
                    )}
                  </CardContent>
                </Card>

          <Button onClick={resetAll} variant="outline" className="w-full">
            <RefreshCw size={16} className="mr-2" /> Reset All Inputs
          </Button>
              </div>

        {/* Column 2: Equipment Comparison */}
        <div className="space-y-6">
          <Tabs defaultValue="equipment-a">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="equipment-a"
                className="flex items-center gap-1 cursor-pointer data-[state=inactive]:text-muted-foreground hover:bg-red-500 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 transition-colors duration-150 rounded-md"
              >
                <SwordIcon size={16} className="mr-1" /> Equipment A
                        </TabsTrigger>
              <TabsTrigger
                value="equipment-b"
                className="flex items-center gap-1 cursor-pointer data-[state=inactive]:text-muted-foreground hover:bg-red-500 data-[state=active]:text-violet-300 data-[state=active]:shadow-inner data-[state=active]:bg-violet-900/50 transition-colors duration-150 rounded-md"
              >
                <SwordIcon size={16} className="mr-1" /> Equipment B
                        </TabsTrigger>
                      </TabsList>
            <TabsContent value="equipment-a">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Equipment Piece A Stats</CardTitle>
                  <CardDescription>Enter the stats provided *by this specific piece*.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <StatInput label="Plus Attack" value={equipmentA.plus_atk_1} onChange={(v) => handleEquipmentAChange("plus_atk_1", v)} placeholder="Flat attack" isInvalid={errors.plus_atk_1} maxIntegerDigits={6} maxDecimalDigits={0}/>
                  <StatInput label="Plus Attack %" value={equipmentA.plus_atk_pct_1} onChange={(v) => handleEquipmentAChange("plus_atk_pct_1", v)} suffix="%" isInvalid={errors.plus_atk_pct_1} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Crit Rate %" value={equipmentA.plus_cr_1} onChange={(v) => handleEquipmentAChange("plus_cr_1", v)} suffix="%" isInvalid={errors.plus_cr_1} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Crit Dmg %" value={equipmentA.plus_cd_1} onChange={(v) => handleEquipmentAChange("plus_cd_1", v)} suffix="%" isInvalid={errors.plus_cd_1} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus All Damage %" value={equipmentA.plus_all_dmg_1} onChange={(v) => handleEquipmentAChange("plus_all_dmg_1", v)} suffix="%" isInvalid={errors.plus_all_dmg_1} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Def Pen %" value={equipmentA.plus_def_pen_1} onChange={(v) => handleEquipmentAChange("plus_def_pen_1", v)} suffix="%" isInvalid={errors.plus_def_pen_1} maxIntegerDigits={3} maxDecimalDigits={1}/>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground pt-4">
                  (Compared vs Equip B below)
                </CardFooter>
              </Card>
                      </TabsContent>
            <TabsContent value="equipment-b">
              <Card className="bg-card/50 border-border/60">
                <CardHeader>
                  <CardTitle>Equipment Piece B Stats</CardTitle>
                  <CardDescription>Enter the stats provided *by this specific piece*.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <StatInput label="Plus Attack" value={equipmentB.plus_atk_2} onChange={(v) => handleEquipmentBChange("plus_atk_2", v)} placeholder="Flat attack" isInvalid={errors.plus_atk_2} maxIntegerDigits={6} maxDecimalDigits={0}/>
                  <StatInput label="Plus Attack %" value={equipmentB.plus_atk_pct_2} onChange={(v) => handleEquipmentBChange("plus_atk_pct_2", v)} suffix="%" isInvalid={errors.plus_atk_pct_2} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Crit Rate %" value={equipmentB.plus_cr_2} onChange={(v) => handleEquipmentBChange("plus_cr_2", v)} suffix="%" isInvalid={errors.plus_cr_2} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Crit Dmg %" value={equipmentB.plus_cd_2} onChange={(v) => handleEquipmentBChange("plus_cd_2", v)} suffix="%" isInvalid={errors.plus_cd_2} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus All Damage %" value={equipmentB.plus_all_dmg_2} onChange={(v) => handleEquipmentBChange("plus_all_dmg_2", v)} suffix="%" isInvalid={errors.plus_all_dmg_2} maxIntegerDigits={3} maxDecimalDigits={1}/>
                  <StatInput label="Plus Def Pen %" value={equipmentB.plus_def_pen_2} onChange={(v) => handleEquipmentBChange("plus_def_pen_2", v)} suffix="%" isInvalid={errors.plus_def_pen_2} maxIntegerDigits={3} maxDecimalDigits={1}/>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground pt-4">
                  (Compared vs Equip A above)
                </CardFooter>
              </Card>
                      </TabsContent>
                    </Tabs>

          {/* Comparison Result Card */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 size={18} className={VIOLET_ICON} /> Equipment Comparison
              </CardTitle>
              <CardDescription>Compares final mitigated damage between Equip A and Equip B.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                          <ResultDisplay
                label="Equip A Final Dmg" 
                value={results.equipmentA.finalDamage} 
                change={formatChange(results.equipmentA.finalDamage, results.equipmentB.finalDamage)}
              />
                          <ResultDisplay
                label="Equip B Final Dmg"
                value={results.equipmentB.finalDamage}
                change={formatChange(results.equipmentB.finalDamage, results.equipmentA.finalDamage)}
              />
              <div className="text-center pt-2 font-semibold">
                {getBetterEquipment().text}
                    </div>
                  </CardContent>
                </Card>

        </div>

        {/* Column 3: Results Summary */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles size={18} className={VIOLET_ICON} /> Damage Summary
                    </CardTitle>
              <CardDescription>Calculated average damage output per hit.</CardDescription>
                  </CardHeader>
            <CardContent className="space-y-1 pt-2">
              {/* Base Stats Results Block */}
              <div className="p-3 rounded-md bg-background/30 border border-border/30 my-2">
                <h4 className="font-semibold text-sm mb-2">Base Stats Only:</h4>
                <div className="space-y-1.5">
                  <ResultDisplay label="Total Attack" value={results.base.totalAttack} icon={<Sword size={14}/>} />
                  <ResultDisplay label="Avg Dmg Output (Pre-Mitigation)" value={results.base.avgDamageOutput} icon={<Zap size={14}/>}/>
                  <ResultDisplay label="Target Mitigation" value={results.base.mitigationFactor * 100} icon={<Shield size={14}/>}/>
                  <div className="p-1.5 rounded bg-muted/40 mt-1">
                    <ResultDisplay label="Final Damage (Avg per Hit)" value={results.base.finalDamage} icon={<ShieldCheck size={14}/>} highlight/>
                            </div>
                            </div>
                            </div>

              {/* Equipment A Results Block */}
              <div className="p-3 rounded-md bg-muted/20 border border-border/30 my-2">
                <h4 className="font-semibold text-sm mb-2">With Equipment A:</h4>
                <div className="space-y-1.5">
                  <ResultDisplay label="Total Attack" value={results.equipmentA.totalAttack} icon={<Sword size={14}/>} change={formatChange(results.equipmentA.totalAttack, results.base.totalAttack)}/>
                  <ResultDisplay label="Avg Dmg Output (Pre-Mitigation)" value={results.equipmentA.avgDamageOutput} icon={<Zap size={14}/>} change={formatChange(results.equipmentA.avgDamageOutput, results.base.avgDamageOutput)}/>
                  <ResultDisplay label="Target Mitigation" value={results.equipmentA.mitigationFactor * 100} icon={<Shield size={14}/>} change={formatChange(results.equipmentA.mitigationFactor*100, results.base.mitigationFactor*100)}/>
                  <div className="p-1.5 rounded bg-muted/40 mt-1">
                    <ResultDisplay label="Final Damage (Avg per Hit)" value={results.equipmentA.finalDamage} icon={<ShieldCheck size={14}/>} highlight change={formatChange(results.equipmentA.finalDamage, results.base.finalDamage)}/>
                            </div>
                          </div>
                        </div>

              {/* Equipment B Results Block */}
              <div className="p-3 rounded-md bg-background/30 border border-border/30 my-2">
                <h4 className="font-semibold text-sm mb-2">With Equipment B:</h4>
                <div className="space-y-1.5">
                  <ResultDisplay label="Total Attack" value={results.equipmentB.totalAttack} icon={<Sword size={14}/>} change={formatChange(results.equipmentB.totalAttack, results.base.totalAttack)}/>
                  <ResultDisplay label="Avg Dmg Output (Pre-Mitigation)" value={results.equipmentB.avgDamageOutput} icon={<Zap size={14}/>} change={formatChange(results.equipmentB.avgDamageOutput, results.base.avgDamageOutput)}/>
                  <ResultDisplay label="Target Mitigation" value={results.equipmentB.mitigationFactor * 100} icon={<Shield size={14}/>} change={formatChange(results.equipmentB.mitigationFactor*100, results.base.mitigationFactor*100)}/>
                  <div className="p-1.5 rounded bg-muted/40 mt-1">
                    <ResultDisplay label="Final Damage (Avg per Hit)" value={results.equipmentB.finalDamage} icon={<ShieldCheck size={14}/>} highlight change={formatChange(results.equipmentB.finalDamage, results.base.finalDamage)}/>
                          </div>
                        </div>
                      </div>

              {/* Buffs Results Block */}
              <div className="p-3 rounded-md bg-muted/20 border border-border/30 my-2">
                <h4 className="font-semibold text-sm mb-2">Base Stats + Buffs:</h4>
                <div className="space-y-1.5">
                  <ResultDisplay label="Total Attack" value={results.buffs.totalAttack} icon={<Sword size={14}/>} change={formatChange(results.buffs.totalAttack, results.base.totalAttack)}/>
                  <ResultDisplay label="Avg Dmg Output (Pre-Mitigation)" value={results.buffs.avgDamageOutput} icon={<Zap size={14}/>} change={formatChange(results.buffs.avgDamageOutput, results.base.avgDamageOutput)}/>
                  <ResultDisplay label="Target Mitigation" value={results.buffs.mitigationFactor * 100} icon={<Shield size={14}/>} change={formatChange(results.buffs.mitigationFactor*100, results.base.mitigationFactor*100)}/>
                  <div className="p-1.5 rounded bg-muted/40 mt-1">
                    <ResultDisplay label="Final Damage (Avg per Hit)" value={results.buffs.finalDamage} icon={<ShieldCheck size={14}/>} highlight change={formatChange(results.buffs.finalDamage, results.base.finalDamage)}/>
                          </div>
                  <div className="text-center pt-2 font-semibold text-sm">
                    {areBuffsBeneficial().text}
                            </div>
                      </div>
                    </div>
                  </CardContent>
            {/* Add horizontal and bottom padding to footer */}
            <CardFooter className="pt-4 px-6 pb-6">
              <p className="text-xs text-center text-muted-foreground w-full">Best Overall Setup (Final Dmg): <span className="font-bold text-violet-600">{getBestSetup()}</span></p>
                  </CardFooter>
                </Card>

          {/* FAQ / Info Card */}
          <Card className="bg-card/50 border-border/60">
              <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info size={18} className={VIOLET_ICON} /> Information & FAQ
              </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What is 'Final Damage (Avg per Hit)'?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      This is the estimated average damage you will deal with a single hit *after* considering your stats, critical hit chance/damage, and the target&apos;s defense mitigation based on the provided inputs. It represents your theoretical sustained damage output.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Why is Crit Damage Bonus important?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      Critical hits deal significantly more damage. The base multiplier is assumed to be {BASE_CRIT_MULTIPLIER * 100}%. The &apos;Crit Damage Bonus&apos; stat adds *on top* of this base. Higher Crit Rate and Crit Damage Bonus greatly increase your average damage.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How does Defense Penetration work?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      Defense Penetration allows your attacks to ignore a percentage of the target&apos;s defense, resulting in higher damage, especially against heavily armored targets. The exact mitigation formula for Bless Unleashed might vary, but this calculator uses a common RPG structure.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>How are buffs applied?</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      Currently, the selected Elixir, Panacea, and Food buffs are applied directly to your *Base Stats* for the &apos;Base Stats + Buffs&apos; calculation. They are *not* automatically added to the Equipment A/B calculations in this version. Future updates might allow comparing (Equip A + Buffs) vs (Equip B + Buffs).
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Disclaimer</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      This calculator is based on observed formulas and common RPG mechanics. The exact formulas used by Bless Unleashed PC may differ slightly. Use this tool as a guide for comparison and optimization. Values like the base crit multiplier and mitigation scaling might need adjustments based on specific game data.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
