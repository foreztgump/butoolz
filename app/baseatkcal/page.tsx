"use client"

import { useState, useEffect } from "react"
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
  ArrowRight,
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
  Lightbulb,
} from "lucide-react"

export default function BaseAttackCalculator() {
  // State for base stats
  const [baseStats, setBaseStats] = useState({
    base_atk: 0,
    atk_bonus: 0,
    crit_rate: 0,
    crit_dmg: 0,
    all_dmg: 0,
  })

  // State for equipment piece A
  const [equipmentA, setEquipmentA] = useState({
    plus_atk_1: 0,
    plus_atk_pct_1: 0,
    plus_cr_1: 0,
    plus_cd_1: 0,
    plus_all_dmg_1: 0,
  })

  // State for equipment piece B
  const [equipmentB, setEquipmentB] = useState({
    plus_atk_2: 0,
    plus_atk_pct_2: 0,
    plus_cr_2: 0,
    plus_cd_2: 0,
    plus_all_dmg_2: 0,
  })

  // State for buffs
  const [buffs, setBuffs] = useState({
    elixir: "0",
    panacea: "0",
    food: "0",
  })

  // State for calculated results
  const [results, setResults] = useState({
    // Base results
    result_attack: 0,
    result_attack_output: 0,

    // Equipment A results
    result_attack_e_1: 0,
    result_cr_e_1: 0,
    result_cd_e_1: 0,
    result_ad_e_1: 0,
    result_attack_e_1_output: 0,

    // Equipment B results
    result_attack_e_2: 0,
    result_cr_e_2: 0,
    result_cd_e_2: 0,
    result_ad_e_2: 0,
    result_attack_e_2_output: 0,

    // Buff results
    result_attack_buff_plus: 0,
    result_cr_buff_plus: 0,
    result_cd_buff_plus: 0,
    result_attack_buff: 0,
    result_cr_buff: 0,
    result_cd_buff: 0,
    result_attack_buff_output: 0,
  })

  // Handle base stats changes
  const handleBaseStatsChange = (field, value) => {
    setBaseStats((prev) => ({
      ...prev,
      [field]: Number.parseFloat(value) || 0,
    }))
  }

  // Handle equipment A changes
  const handleEquipmentAChange = (field, value) => {
    setEquipmentA((prev) => ({
      ...prev,
      [field]: Number.parseFloat(value) || 0,
    }))
  }

  // Handle equipment B changes
  const handleEquipmentBChange = (field, value) => {
    setEquipmentB((prev) => ({
      ...prev,
      [field]: Number.parseFloat(value) || 0,
    }))
  }

  // Handle buffs changes
  const handleBuffsChange = (field, value) => {
    setBuffs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Reset all values
  const resetAll = () => {
    setBaseStats({
      base_atk: 0,
      atk_bonus: 0,
      crit_rate: 0,
      crit_dmg: 0,
      all_dmg: 0,
    })
    setEquipmentA({
      plus_atk_1: 0,
      plus_atk_pct_1: 0,
      plus_cr_1: 0,
      plus_cd_1: 0,
      plus_all_dmg_1: 0,
    })
    setEquipmentB({
      plus_atk_2: 0,
      plus_atk_pct_2: 0,
      plus_cr_2: 0,
      plus_cd_2: 0,
      plus_all_dmg_2: 0,
    })
    setBuffs({
      elixir: "0",
      panacea: "0",
      food: "0",
    })
  }

  // Calculate all results
  const calculateResults = () => {
    // Calculate base attack and output
    const result_attack = baseStats.base_atk * (1 + baseStats.atk_bonus / 100)
    const result_attack_output =
      (result_attack * (1 - baseStats.crit_rate / 100) +
        result_attack * ((baseStats.crit_rate / 100) * (baseStats.crit_dmg / 100))) *
      (1 + baseStats.all_dmg / 100)

    // Calculate equipment A results
    const result_attack_e_1 =
      (Math.abs(baseStats.base_atk) + equipmentA.plus_atk_1) *
      (1 + equipmentA.plus_atk_pct_1 / 100 + Math.abs(baseStats.atk_bonus / 100))

    const result_cr_e_1 = Math.abs(baseStats.crit_rate) + equipmentA.plus_cr_1
    const result_cd_e_1 = Math.abs(baseStats.crit_dmg) + equipmentA.plus_cd_1
    const result_ad_e_1 = baseStats.all_dmg + equipmentA.plus_all_dmg_1

    const result_attack_e_1_output =
      (result_attack_e_1 * (1 - result_cr_e_1 / 100) +
        result_attack_e_1 * ((result_cr_e_1 / 100) * (result_cd_e_1 / 100))) *
      (1 + result_ad_e_1 / 100)

    // Calculate equipment B results
    const result_attack_e_2 =
      (Math.abs(baseStats.base_atk) + equipmentB.plus_atk_2) *
      (1 + equipmentB.plus_atk_pct_2 / 100 + Math.abs(baseStats.atk_bonus / 100))

    const result_cr_e_2 = Math.abs(baseStats.crit_rate) + equipmentB.plus_cr_2
    const result_cd_e_2 = Math.abs(baseStats.crit_dmg) + equipmentB.plus_cd_2
    const result_ad_e_2 = baseStats.all_dmg + equipmentB.plus_all_dmg_2

    const result_attack_e_2_output =
      (result_attack_e_2 * (1 - result_cr_e_2 / 100) +
        result_attack_e_2 * ((result_cr_e_2 / 100) * (result_cd_e_2 / 100))) *
      (1 + result_ad_e_2 / 100)

    // Calculate buff results
    let result_attack_buff_plus = 0
    let result_cr_buff_plus = 0
    let result_cd_buff_plus = 0

    // Elixir buffs
    if (buffs.elixir === "1") {
      // Thorns III
      result_attack_buff_plus += 15
    } else if (buffs.elixir === "2") {
      // Hunter III
      result_cr_buff_plus += 4
    } else if (buffs.elixir === "3") {
      // Destruction III
      result_cd_buff_plus += 18
    }

    // Panacea buffs
    if (buffs.panacea === "1") {
      // Blade
      result_attack_buff_plus += 15
    } else if (buffs.panacea === "2") {
      // Superior Blade
      result_attack_buff_plus += 20
    } else if (buffs.panacea === "3") {
      // Destruction
      result_cd_buff_plus += 30
    } else if (buffs.panacea === "4") {
      // Superior Destruction
      result_cd_buff_plus += 36
    } else if (buffs.panacea === "5") {
      // Hunter
      result_cr_buff_plus += 6
    } else if (buffs.panacea === "6") {
      // Superior Sharpness
      result_cr_buff_plus += 7.5
    }

    // Food buffs
    if (buffs.food === "1") {
      // Beef Curry
      result_cd_buff_plus += 24
    } else if (buffs.food === "2") {
      // Tiger Shrimp
      result_cr_buff_plus += 4.5
    }

    const result_attack_buff =
      Math.abs(baseStats.base_atk) * (1 + result_attack_buff_plus / 100 + baseStats.atk_bonus / 100)
    const result_cr_buff = Math.abs(baseStats.crit_rate) + result_cr_buff_plus
    const result_cd_buff = Math.abs(baseStats.crit_dmg) + result_cd_buff_plus

    const result_attack_buff_output =
      (result_attack_buff * (1 - result_cr_buff / 100) +
        result_attack_buff * ((result_cr_buff / 100) * (result_cd_buff / 100))) *
      (1 + baseStats.all_dmg / 100)

    // Update results state
    setResults({
      result_attack: Number.parseFloat(result_attack.toFixed(1)),
      result_attack_output: Number.parseFloat(result_attack_output.toFixed(1)),

      result_attack_e_1: Number.parseFloat(result_attack_e_1.toFixed(1)),
      result_cr_e_1,
      result_cd_e_1,
      result_ad_e_1,
      result_attack_e_1_output: Number.parseFloat(result_attack_e_1_output.toFixed(1)),

      result_attack_e_2: Number.parseFloat(result_attack_e_2.toFixed(1)),
      result_cr_e_2,
      result_cd_e_2,
      result_ad_e_2,
      result_attack_e_2_output: Number.parseFloat(result_attack_e_2_output.toFixed(1)),

      result_attack_buff_plus,
      result_cr_buff_plus,
      result_cd_buff_plus,
      result_attack_buff: Number.parseFloat(result_attack_buff.toFixed(1)),
      result_cr_buff,
      result_cd_buff,
      result_attack_buff_output: Number.parseFloat(result_attack_buff_output.toFixed(1)),
    })
  }

  // Auto-calculate whenever any input changes
  useEffect(() => {
    calculateResults()
  }, [baseStats, equipmentA, equipmentB, buffs])

  // Format percentage change
  const formatChange = (newValue, baseValue) => {
    if (baseValue === 0) return { text: "N/A", isPositive: false, isNeutral: true }

    const diff = newValue - baseValue
    const percentChange = ((newValue / baseValue - 1) * 100).toFixed(1)

    if (diff > 0) {
      return {
        text: `+${diff.toFixed(1)} (+${percentChange}%)`,
        isPositive: true,
        isNeutral: false,
      }
    } else if (diff < 0) {
      return {
        text: `${diff.toFixed(1)} (${percentChange}%)`,
        isPositive: false,
        isNeutral: false,
      }
    }
    return { text: "No change", isPositive: false, isNeutral: true }
  }

  // Determine which equipment is better
  const getBetterEquipment = () => {
    if (results.result_attack_e_1_output > results.result_attack_e_2_output) {
      return "A"
    } else if (results.result_attack_e_2_output > results.result_attack_e_1_output) {
      return "B"
    }
    return "equal"
  }

  // Determine if buffs are beneficial
  const areBuffsBeneficial = () => {
    return results.result_attack_buff_output > results.result_attack_output
  }

  // Get the best overall setup
  const getBestSetup = () => {
    const options = [
      { name: "Base", value: results.result_attack_output },
      { name: "Weapon A", value: results.result_attack_e_1_output },
      { name: "Weapon B", value: results.result_attack_e_2_output },
      { name: "With Buffs", value: results.result_attack_buff_output },
    ]

    return options.reduce((prev, current) => (prev.value > current.value ? prev : current))
  }

  // Stat input component with tooltip
  const StatInput = ({ label, value, onChange, placeholder, suffix = "", tooltip = null }) => (
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
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-8"
          aria-label={label}
        />
        {suffix && <div className="flex items-center pl-2 text-sm text-muted-foreground">{suffix}</div>}
      </div>
    </div>
  )

  // Result display component
  const ResultDisplay = ({ label, value, change = null, highlight = false, icon = null }) => (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? "border-l-2 border-primary pl-2" : ""}`}>
      <span className="text-sm flex items-center gap-1">
        {icon && icon}
        {label}
      </span>
      <div className="text-right">
        <div className={`font-medium ${highlight ? "text-primary text-lg" : ""}`}>{value}</div>
        {change && (
          <div
            className={`text-xs flex items-center gap-0.5 ${
              change.isPositive ? "text-green-500" : change.isNeutral ? "text-muted-foreground" : "text-red-500"
            }`}
          >
            {change.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : change.isNeutral ? (
              <Minus className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change.text}
          </div>
        )}
      </div>
    </div>
  )

  const bestSetup = getBestSetup()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Base Attack Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Calculate your damage output based on various stats and compare different weapons and buffs.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs" onClick={resetAll}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="calculator" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              Help & FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div>
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Your Stats
                    </CardTitle>
                    <CardDescription>Enter your character's base stats</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <StatInput
                      label="Base Attack"
                      value={baseStats.base_atk}
                      onChange={(value) => handleBaseStatsChange("base_atk", value)}
                      placeholder="Enter value"
                      tooltip="Your character's base attack value without any percentage bonuses"
                    />
                    <StatInput
                      label="Attack Bonus"
                      value={baseStats.atk_bonus}
                      onChange={(value) => handleBaseStatsChange("atk_bonus", value)}
                      placeholder="Enter value"
                      suffix="%"
                      tooltip="Percentage bonus to attack from gear and other sources"
                    />
                    <StatInput
                      label="Crit Rate"
                      value={baseStats.crit_rate}
                      onChange={(value) => handleBaseStatsChange("crit_rate", value)}
                      placeholder="Enter value"
                      suffix="%"
                      tooltip="Chance to land a critical hit (0-100%)"
                    />
                    <StatInput
                      label="Crit Damage"
                      value={baseStats.crit_dmg}
                      onChange={(value) => handleBaseStatsChange("crit_dmg", value)}
                      placeholder="Enter value"
                      suffix="%"
                      tooltip="Bonus damage on critical hits (e.g., 150% means crits do 2.5x damage)"
                    />
                    <StatInput
                      label="All Damage"
                      value={baseStats.all_dmg}
                      onChange={(value) => handleBaseStatsChange("all_dmg", value)}
                      placeholder="Enter value"
                      suffix="%"
                      tooltip="Percentage bonus to all damage types"
                    />

                    <div className="pt-2 mt-2 border-t">
                      <ResultDisplay
                        label="Total Attack"
                        value={results.result_attack}
                        icon={<Sword className="h-3.5 w-3.5 text-muted-foreground" />}
                      />
                      <ResultDisplay
                        label="Average Damage Output"
                        value={results.result_attack_output}
                        highlight={true}
                        icon={<Zap className="h-3.5 w-3.5 text-primary" />}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6 transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Buffs
                    </CardTitle>
                    <CardDescription>Select active buffs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="elixir" className="flex items-center">
                        Elixir
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Elixirs provide temporary stat boosts</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Select value={buffs.elixir} onValueChange={(value) => handleBuffsChange("elixir", value)}>
                        <SelectTrigger id="elixir" className="h-8">
                          <SelectValue placeholder="Select elixir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1">Thorns III (+15% Attack)</SelectItem>
                          <SelectItem value="2">Hunter III (+4% Crit Rate)</SelectItem>
                          <SelectItem value="3">Destruction III (+18% Crit Damage)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="panacea" className="flex items-center">
                        Panacea
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Panaceas provide stronger stat boosts</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Select value={buffs.panacea} onValueChange={(value) => handleBuffsChange("panacea", value)}>
                        <SelectTrigger id="panacea" className="h-8">
                          <SelectValue placeholder="Select panacea" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1">Blade (+15% Attack)</SelectItem>
                          <SelectItem value="2">Superior Blade (+20% Attack)</SelectItem>
                          <SelectItem value="3">Destruction (+30% Crit Damage)</SelectItem>
                          <SelectItem value="4">Superior Destruction (+36% Crit Damage)</SelectItem>
                          <SelectItem value="5">Hunter (+6% Crit Rate)</SelectItem>
                          <SelectItem value="6">Superior Sharpness (+7.5% Crit Rate)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="food" className="flex items-center">
                        Food
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Food buffs provide additional stat boosts</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Select value={buffs.food} onValueChange={(value) => handleBuffsChange("food", value)}>
                        <SelectTrigger id="food" className="h-8">
                          <SelectValue placeholder="Select food" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1">Beef Curry (+24% Crit Damage)</SelectItem>
                          <SelectItem value="2">Tiger Shrimp (+4.5% Crit Rate)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(buffs.elixir !== "0" || buffs.panacea !== "0" || buffs.food !== "0") && (
                      <div className="pt-2 mt-2 border-t">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {results.result_attack_buff_plus > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{results.result_attack_buff_plus}% Attack
                            </Badge>
                          )}
                          {results.result_cr_buff_plus > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{results.result_cr_buff_plus}% Crit Rate
                            </Badge>
                          )}
                          {results.result_cd_buff_plus > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{results.result_cd_buff_plus}% Crit Damage
                            </Badge>
                          )}
                        </div>
                        <ResultDisplay
                          label="With Buffs Damage Output"
                          value={results.result_attack_buff_output}
                          change={formatChange(results.result_attack_buff_output, results.result_attack_output)}
                          highlight={areBuffsBeneficial()}
                          icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Equipment Comparison Section */}
              <div>
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sword className="h-4 w-4 text-primary" />
                      Weapon Comparison
                    </CardTitle>
                    <CardDescription>Compare two different weapons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="equipment-a" className="w-full">
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="equipment-a" className="flex items-center gap-1">
                          <Sword className="h-3.5 w-3.5" />
                          Weapon A
                        </TabsTrigger>
                        <TabsTrigger value="equipment-b" className="flex items-center gap-1">
                          <SwordIcon className="h-3.5 w-3.5" />
                          Weapon B
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="equipment-a" className="space-y-4">
                        <StatInput
                          label="Plus Attack"
                          value={equipmentA.plus_atk_1}
                          onChange={(value) => handleEquipmentAChange("plus_atk_1", value)}
                          placeholder="Enter value"
                          tooltip="Flat attack bonus from this weapon"
                        />
                        <StatInput
                          label="Plus Attack %"
                          value={equipmentA.plus_atk_pct_1}
                          onChange={(value) => handleEquipmentAChange("plus_atk_pct_1", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Percentage attack bonus from this weapon"
                        />
                        <StatInput
                          label="Plus Crit Rate"
                          value={equipmentA.plus_cr_1}
                          onChange={(value) => handleEquipmentAChange("plus_cr_1", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional crit rate from this weapon"
                        />
                        <StatInput
                          label="Plus Crit Damage"
                          value={equipmentA.plus_cd_1}
                          onChange={(value) => handleEquipmentAChange("plus_cd_1", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional crit damage from this weapon"
                        />
                        <StatInput
                          label="Plus All Damage"
                          value={equipmentA.plus_all_dmg_1}
                          onChange={(value) => handleEquipmentAChange("plus_all_dmg_1", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional all damage % from this weapon"
                        />
                      </TabsContent>

                      <TabsContent value="equipment-b" className="space-y-4">
                        <StatInput
                          label="Plus Attack"
                          value={equipmentB.plus_atk_2}
                          onChange={(value) => handleEquipmentBChange("plus_atk_2", value)}
                          placeholder="Enter value"
                          tooltip="Flat attack bonus from this weapon"
                        />
                        <StatInput
                          label="Plus Attack %"
                          value={equipmentB.plus_atk_pct_2}
                          onChange={(value) => handleEquipmentBChange("plus_atk_pct_2", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Percentage attack bonus from this weapon"
                        />
                        <StatInput
                          label="Plus Crit Rate"
                          value={equipmentB.plus_cr_2}
                          onChange={(value) => handleEquipmentBChange("plus_cr_2", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional crit rate from this weapon"
                        />
                        <StatInput
                          label="Plus Crit Damage"
                          value={equipmentB.plus_cd_2}
                          onChange={(value) => handleEquipmentBChange("plus_cd_2", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional crit damage from this weapon"
                        />
                        <StatInput
                          label="Plus All Damage"
                          value={equipmentB.plus_all_dmg_2}
                          onChange={(value) => handleEquipmentBChange("plus_all_dmg_2", value)}
                          placeholder="Enter value"
                          suffix="%"
                          tooltip="Additional all damage % from this weapon"
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium flex items-center gap-1">
                            <Sword className="h-3 w-3" /> Weapon A
                          </h3>
                          <ResultDisplay
                            label="Damage Output"
                            value={results.result_attack_e_1_output}
                            change={formatChange(results.result_attack_e_1_output, results.result_attack_output)}
                            highlight={getBetterEquipment() === "A"}
                          />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium flex items-center gap-1">
                            <SwordIcon className="h-3 w-3" /> Weapon B
                          </h3>
                          <ResultDisplay
                            label="Damage Output"
                            value={results.result_attack_e_2_output}
                            change={formatChange(results.result_attack_e_2_output, results.result_attack_output)}
                            highlight={getBetterEquipment() === "B"}
                          />
                        </div>
                      </div>

                      {(Object.values(equipmentA).some((val) => val > 0) ||
                        Object.values(equipmentB).some((val) => val > 0)) && (
                        <div className="mt-4 pt-2 border-t">
                          <div className="text-sm font-medium mb-1">Weapon Comparison</div>
                          {getBetterEquipment() === "A" ? (
                            <div className="text-sm text-green-500 flex items-center gap-1 p-2 bg-green-500/5 rounded-md">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Weapon A is better by{" "}
                              {formatChange(results.result_attack_e_1_output, results.result_attack_e_2_output).text}
                            </div>
                          ) : getBetterEquipment() === "B" ? (
                            <div className="text-sm text-green-500 flex items-center gap-1 p-2 bg-green-500/5 rounded-md">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Weapon B is better by{" "}
                              {formatChange(results.result_attack_e_2_output, results.result_attack_e_1_output).text}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 p-2 bg-muted/20 rounded-md">
                              <Minus className="h-3.5 w-3.5" /> Both weapons are equal
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Results Summary Card */}
                <Card className="mt-6 bg-muted/30 transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Results Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" /> Base Stats
                          </h3>
                          <div className="space-y-1 p-2 bg-background rounded-md border">
                            <div className="flex justify-between text-sm">
                              <span>Attack:</span>
                              <span>{results.result_attack}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Crit Rate:</span>
                              <span>{baseStats.crit_rate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Crit Damage:</span>
                              <span>{baseStats.crit_dmg}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>All Damage:</span>
                              <span>{baseStats.all_dmg}%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Lightbulb className="h-3.5 w-3.5 text-primary" /> Best Setup
                          </h3>
                          <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                            <div className="text-xs text-muted-foreground mb-1">Highest Damage Output</div>
                            <div className="text-xl font-bold text-primary">{bestSetup.value}</div>
                            <div className="text-xs mt-1 flex items-center gap-1 text-primary">
                              <ArrowRight className="h-3 w-3" /> {bestSetup.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" /> Damage Comparison
                        </h3>
                        <div className="space-y-2 p-2 bg-background rounded-md border">
                          <div className="flex justify-between text-sm items-center">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span> Base:
                            </span>
                            <span className="font-medium">{results.result_attack_output}</span>
                          </div>
                          {Object.values(equipmentA).some((val) => val > 0) && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${getBetterEquipment() === "A" ? "bg-green-500" : "bg-muted-foreground"}`}
                                ></span>{" "}
                                Weapon A:
                              </span>
                              <span
                                className={
                                  results.result_attack_e_1_output > results.result_attack_output
                                    ? "text-green-500 font-medium"
                                    : "font-medium"
                                }
                              >
                                {results.result_attack_e_1_output}
                                {results.result_attack_e_1_output > results.result_attack_output && (
                                  <span className="text-xs ml-1">
                                    (+
                                    {(
                                      (results.result_attack_e_1_output / results.result_attack_output - 1) *
                                      100
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {Object.values(equipmentB).some((val) => val > 0) && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${getBetterEquipment() === "B" ? "bg-green-500" : "bg-muted-foreground"}`}
                                ></span>{" "}
                                Weapon B:
                              </span>
                              <span
                                className={
                                  results.result_attack_e_2_output > results.result_attack_output
                                    ? "text-green-500 font-medium"
                                    : "font-medium"
                                }
                              >
                                {results.result_attack_e_2_output}
                                {results.result_attack_e_2_output > results.result_attack_output && (
                                  <span className="text-xs ml-1">
                                    (+
                                    {(
                                      (results.result_attack_e_2_output / results.result_attack_output - 1) *
                                      100
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {(buffs.elixir !== "0" || buffs.panacea !== "0" || buffs.food !== "0") && (
                            <div className="flex justify-between text-sm items-center">
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${areBuffsBeneficial() ? "bg-green-500" : "bg-muted-foreground"}`}
                                ></span>{" "}
                                With Buffs:
                              </span>
                              <span
                                className={
                                  results.result_attack_buff_output > results.result_attack_output
                                    ? "text-green-500 font-medium"
                                    : "font-medium"
                                }
                              >
                                {results.result_attack_buff_output}
                                {results.result_attack_buff_output > results.result_attack_output && (
                                  <span className="text-xs ml-1">
                                    (+
                                    {(
                                      (results.result_attack_buff_output / results.result_attack_output - 1) *
                                      100
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="w-full text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Tip: Compare different weapons to find the optimal setup for your character.
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Help & FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I use this calculator?</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Enter your character's base stats in the "Your Stats" section.</li>
                        <li>
                          If you want to compare weapons, enter the stats for each weapon in the "Weapon Comparison"
                          section.
                        </li>
                        <li>If you're using buffs, select them in the "Buffs" section.</li>
                        <li>The calculator will automatically update all results as you input values.</li>
                        <li>The "Results Summary" section shows you which setup gives the highest damage output.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>What if I want to test a combination of buffs and weapons?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm mb-2">
                        You can test combinations by entering your base stats, selecting buffs, and entering weapon
                        stats all at once. The calculator will show you the results for:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Base stats only</li>
                        <li>Base stats + Weapon A</li>
                        <li>Base stats + Weapon B</li>
                        <li>Base stats + Buffs</li>
                      </ul>
                      <p className="text-sm mt-2">
                        To see the combined effect of weapons AND buffs, you would need to add the weapon stats to your
                        base stats, then apply buffs.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>What if I have some other buff not listed here?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">
                        For buffs not listed in the dropdown, you can manually add their effects to your base stats. For
                        example, if you have a buff that gives +10% crit rate, simply add 10 to your base crit rate
                        value.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>My crit hits are huge, why should I care about average damage?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">
                        Because in the long run, it all averages out. Imagine you did 1000 hits with your attacks - your
                        crits will be extremely close to your statistical crit rate * crit damage. So, over the long
                        run, sustained attacks might be better than the odd high crit. By looking at the average, you
                        will see your true damage output.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>
                      If my average damage is higher than another player's, do I hit harder?
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">
                        Not necessarily. When comparing two players, there are many more factors to consider such as
                        blessing and skill levels, buffs given by specific skills, etc. This calculator only helps you
                        optimize your own stats and compare different weapon options for your character.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
