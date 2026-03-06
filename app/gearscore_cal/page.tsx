"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sword,
  Shield,
  HardHatIcon as Helmet,
  Award,
  Shirt as Chest,
  RectangleHorizontal as Pants,
  Footprints as Boots,
  HandMetal as Gloves,
  Square as Shoulder,
  Minus as Belt,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Gear score lookup tables from the Django constants
const W_GEAR_SCORES = [
  0, 217, 221, 229, 234, 240, 246, 257, 263, 268, 274, 280, 286, 246, 251, 257, 263, 268, 274, 286, 291, 297, 303, 308,
  314,
]

const OH_GEAR_SCORES = [
  0, 46, 47, 48, 49, 51, 52, 54, 55, 57, 58, 59, 60, 52, 53, 54, 55, 57, 58, 60, 61, 62, 63, 64, 65,
]

const HEAD_GEAR_SCORES = [
  0, 123, 129, 132, 136, 139, 142, 149, 152, 155, 158, 162, 165, 142, 146, 149, 152, 155, 158, 165, 169, 172, 175, 178,
  182,
]

const CHEST_GEAR_SCORES = [
  0, 171, 176, 180, 185, 189, 194, 203, 207, 212, 216, 221, 225, 194, 198, 203, 207, 212, 216, 225, 230, 234, 239, 243,
  248,
]

const PANTS_GEAR_SCORES = [
  0, 171, 176, 180, 185, 189, 194, 203, 207, 212, 216, 221, 225, 194, 198, 203, 207, 212, 216, 225, 230, 234, 239, 243,
  248,
]

const BOOTS_GEAR_SCORES = [
  0, 114, 117, 120, 123, 126, 129, 135, 138, 141, 144, 147, 150, 129, 132, 135, 138, 141, 144, 150, 153, 156, 159, 162,
  165,
]

const GLOVES_GEAR_SCORES = [
  0, 91, 94, 96, 99, 101, 103, 108, 111, 113, 115, 118, 120, 103, 106, 108, 111, 113, 115, 120, 123, 125, 127, 130, 132,
]

const SHOULDER_GEAR_SCORES = [
  0, 91, 94, 96, 99, 101, 103, 108, 111, 113, 115, 118, 120, 103, 106, 108, 111, 113, 115, 120, 123, 125, 127, 130, 132,
]

const BELT_GEAR_SCORES = [
  0, 114, 117, 120, 123, 126, 129, 135, 138, 141, 144, 147, 150, 129, 132, 135, 138, 141, 144, 150, 153, 156, 159, 162,
  165,
]

export default function GearScoreCalculator() {
  // State for each gear piece
  const [gearValues, setGearValues] = useState({
    w_gear_rank: "0",
    w_fort_rank: "0",
    w_fort_level: "0",
    off_gear_rank: "0",
    off_fort_rank: "0",
    off_fort_level: "0",
    head_gear_rank: "0",
    head_fort_rank: "0",
    head_fort_level: "0",
    chest_gear_rank: "0",
    chest_fort_rank: "0",
    chest_fort_level: "0",
    pants_gear_rank: "0",
    pants_fort_rank: "0",
    pants_fort_level: "0",
    boots_gear_rank: "0",
    boots_fort_rank: "0",
    boots_fort_level: "0",
    gloves_gear_rank: "0",
    gloves_fort_rank: "0",
    gloves_fort_level: "0",
    shoulder_gear_rank: "0",
    shoulder_fort_rank: "0",
    shoulder_fort_level: "0",
    belt_gear_rank: "0",
    belt_fort_rank: "0",
    belt_fort_level: "0",
  })

  // State for calculated scores
  const [scores, setScores] = useState({
    w_gear_score: 0,
    oh_gear_score: 0,
    head_gear_score: 0,
    chest_gear_score: 0,
    pants_gear_score: 0,
    boots_gear_score: 0,
    gloves_gear_score: 0,
    shoulder_gear_score: 0,
    belt_gear_score: 0,
    total_score: 0,
  })

  // Handle form input changes
  const handleChange = (field: string, value: string) => {
    setGearValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Calculate gear scores (wrapped in useCallback)
  const calculateGearScores = useCallback(() => {
    // Calculate weapon gear score
    let w_gear_score = 0
    if (Number.parseInt(gearValues.w_gear_rank) === 1) {
      if (Number.parseInt(gearValues.w_fort_rank) === 1) {
        w_gear_score = W_GEAR_SCORES[Number.parseInt(gearValues.w_fort_level)]
      } else {
        w_gear_score = W_GEAR_SCORES[Number.parseInt(gearValues.w_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.w_gear_rank) === 2) {
      if (Number.parseInt(gearValues.w_fort_rank) === 1) {
        w_gear_score = W_GEAR_SCORES[Number.parseInt(gearValues.w_fort_level) + 12]
      } else {
        w_gear_score = W_GEAR_SCORES[Number.parseInt(gearValues.w_fort_level) + 18]
      }
    }

    // Calculate off-hand gear score
    let oh_gear_score = 0
    if (Number.parseInt(gearValues.off_gear_rank) === 1) {
      if (Number.parseInt(gearValues.off_fort_rank) === 1) {
        oh_gear_score = OH_GEAR_SCORES[Number.parseInt(gearValues.off_fort_level)]
      } else {
        oh_gear_score = OH_GEAR_SCORES[Number.parseInt(gearValues.off_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.off_gear_rank) === 2) {
      if (Number.parseInt(gearValues.off_fort_rank) === 1) {
        oh_gear_score = OH_GEAR_SCORES[Number.parseInt(gearValues.off_fort_level) + 12]
      } else {
        oh_gear_score = OH_GEAR_SCORES[Number.parseInt(gearValues.off_fort_level) + 18]
      }
    }

    // Calculate head gear score
    let head_gear_score = 0
    if (Number.parseInt(gearValues.head_gear_rank) === 1) {
      if (Number.parseInt(gearValues.head_fort_rank) === 1) {
        head_gear_score = HEAD_GEAR_SCORES[Number.parseInt(gearValues.head_fort_level)]
      } else {
        head_gear_score = HEAD_GEAR_SCORES[Number.parseInt(gearValues.head_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.head_gear_rank) === 2) {
      if (Number.parseInt(gearValues.head_fort_rank) === 1) {
        head_gear_score = HEAD_GEAR_SCORES[Number.parseInt(gearValues.head_fort_level) + 12]
      } else {
        head_gear_score = HEAD_GEAR_SCORES[Number.parseInt(gearValues.head_fort_level) + 18]
      }
    }

    // Calculate chest gear score
    let chest_gear_score = 0
    if (Number.parseInt(gearValues.chest_gear_rank) === 1) {
      if (Number.parseInt(gearValues.chest_fort_rank) === 1) {
        chest_gear_score = CHEST_GEAR_SCORES[Number.parseInt(gearValues.chest_fort_level)]
      } else {
        chest_gear_score = CHEST_GEAR_SCORES[Number.parseInt(gearValues.chest_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.chest_gear_rank) === 2) {
      if (Number.parseInt(gearValues.chest_fort_rank) === 1) {
        chest_gear_score = CHEST_GEAR_SCORES[Number.parseInt(gearValues.chest_fort_level) + 12]
      } else {
        chest_gear_score = CHEST_GEAR_SCORES[Number.parseInt(gearValues.chest_fort_level) + 18]
      }
    }

    // Calculate pants gear score
    let pants_gear_score = 0
    if (Number.parseInt(gearValues.pants_gear_rank) === 1) {
      if (Number.parseInt(gearValues.pants_fort_rank) === 1) {
        pants_gear_score = PANTS_GEAR_SCORES[Number.parseInt(gearValues.pants_fort_level)]
      } else {
        pants_gear_score = PANTS_GEAR_SCORES[Number.parseInt(gearValues.pants_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.pants_gear_rank) === 2) {
      if (Number.parseInt(gearValues.pants_fort_rank) === 1) {
        pants_gear_score = PANTS_GEAR_SCORES[Number.parseInt(gearValues.pants_fort_level) + 12]
      } else {
        pants_gear_score = PANTS_GEAR_SCORES[Number.parseInt(gearValues.pants_fort_level) + 18]
      }
    }

    // Calculate boots gear score
    let boots_gear_score = 0
    if (Number.parseInt(gearValues.boots_gear_rank) === 1) {
      if (Number.parseInt(gearValues.boots_fort_rank) === 1) {
        boots_gear_score = BOOTS_GEAR_SCORES[Number.parseInt(gearValues.boots_fort_level)]
      } else {
        boots_gear_score = BOOTS_GEAR_SCORES[Number.parseInt(gearValues.boots_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.boots_gear_rank) === 2) {
      if (Number.parseInt(gearValues.boots_fort_rank) === 1) {
        boots_gear_score = BOOTS_GEAR_SCORES[Number.parseInt(gearValues.boots_fort_level) + 12]
      } else {
        boots_gear_score = BOOTS_GEAR_SCORES[Number.parseInt(gearValues.boots_fort_level) + 18]
      }
    }

    // Calculate gloves gear score
    let gloves_gear_score = 0
    if (Number.parseInt(gearValues.gloves_gear_rank) === 1) {
      if (Number.parseInt(gearValues.gloves_fort_rank) === 1) {
        gloves_gear_score = GLOVES_GEAR_SCORES[Number.parseInt(gearValues.gloves_fort_level)]
      } else {
        gloves_gear_score = GLOVES_GEAR_SCORES[Number.parseInt(gearValues.gloves_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.gloves_gear_rank) === 2) {
      if (Number.parseInt(gearValues.gloves_fort_rank) === 1) {
        gloves_gear_score = GLOVES_GEAR_SCORES[Number.parseInt(gearValues.gloves_fort_level) + 12]
      } else {
        gloves_gear_score = GLOVES_GEAR_SCORES[Number.parseInt(gearValues.gloves_fort_level) + 18]
      }
    }

    // Calculate shoulder gear score
    let shoulder_gear_score = 0
    if (Number.parseInt(gearValues.shoulder_gear_rank) === 1) {
      if (Number.parseInt(gearValues.shoulder_fort_rank) === 1) {
        shoulder_gear_score = SHOULDER_GEAR_SCORES[Number.parseInt(gearValues.shoulder_fort_level)]
      } else {
        shoulder_gear_score = SHOULDER_GEAR_SCORES[Number.parseInt(gearValues.shoulder_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.shoulder_gear_rank) === 2) {
      if (Number.parseInt(gearValues.shoulder_fort_rank) === 1) {
        shoulder_gear_score = SHOULDER_GEAR_SCORES[Number.parseInt(gearValues.shoulder_fort_level) + 12]
      } else {
        shoulder_gear_score = SHOULDER_GEAR_SCORES[Number.parseInt(gearValues.shoulder_fort_level) + 18]
      }
    }

    // Calculate belt gear score
    let belt_gear_score = 0
    if (Number.parseInt(gearValues.belt_gear_rank) === 1) {
      if (Number.parseInt(gearValues.belt_fort_rank) === 1) {
        belt_gear_score = BELT_GEAR_SCORES[Number.parseInt(gearValues.belt_fort_level)]
      } else {
        belt_gear_score = BELT_GEAR_SCORES[Number.parseInt(gearValues.belt_fort_level) + 6]
      }
    } else if (Number.parseInt(gearValues.belt_gear_rank) === 2) {
      if (Number.parseInt(gearValues.belt_fort_rank) === 1) {
        belt_gear_score = BELT_GEAR_SCORES[Number.parseInt(gearValues.belt_fort_level) + 12]
      } else {
        belt_gear_score = BELT_GEAR_SCORES[Number.parseInt(gearValues.belt_fort_level) + 18]
      }
    }

    // Calculate total score
    const total_score =
      w_gear_score +
      oh_gear_score +
      head_gear_score +
      chest_gear_score +
      pants_gear_score +
      boots_gear_score +
      gloves_gear_score +
      shoulder_gear_score +
      belt_gear_score

    // Update scores state
    setScores({
      w_gear_score,
      oh_gear_score,
      head_gear_score,
      chest_gear_score,
      pants_gear_score,
      boots_gear_score,
      gloves_gear_score,
      shoulder_gear_score,
      belt_gear_score,
      total_score,
    })
  }, [gearValues]) // Dependency is gearValues state

  // Recalculate scores when gear values change
  useEffect(() => {
    calculateGearScores()
  }, [gearValues, calculateGearScores]) // Add calculateGearScores to dependencies

  // Add gear slots configuration
  const gearSlots = [
    { title: "Weapon", icon: <Sword className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "w", scoreKey: "w_gear_score" },
    { title: "Off-Hand", icon: <Shield className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "off", scoreKey: "oh_gear_score" },
    { title: "Helm", icon: <Helmet className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "head", scoreKey: "head_gear_score" },
    { title: "Chest", icon: <Chest className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "chest", scoreKey: "chest_gear_score" },
    { title: "Pants", icon: <Pants className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "pants", scoreKey: "pants_gear_score" },
    { title: "Boots", icon: <Boots className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "boots", scoreKey: "boots_gear_score" },
    { title: "Gloves", icon: <Gloves className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "gloves", scoreKey: "gloves_gear_score" },
    { title: "Shoulder", icon: <Shoulder className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "shoulder", scoreKey: "shoulder_gear_score" },
    { title: "Belt", icon: <Belt className="h-4 w-4 mr-1.5 text-violet-500" />, fieldPrefix: "belt", scoreKey: "belt_gear_score" },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Gear Score Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Calculate your total gear score based on equipment rank and fortification.
          </p>
        </div>

        {/* Replace grid with Table inside a Card */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Slot</TableHead>
                <TableHead>Gear Rank</TableHead>
                <TableHead>Fortify Rank</TableHead>
                <TableHead>Fortify Level</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gearSlots.map((slot) => {
                const gearRankKey = `${slot.fieldPrefix}_gear_rank` as keyof typeof gearValues
                const fortRankKey = `${slot.fieldPrefix}_fort_rank` as keyof typeof gearValues
                const fortLevelKey = `${slot.fieldPrefix}_fort_level` as keyof typeof gearValues
                const scoreKey = slot.scoreKey as keyof typeof scores

                return (
                  <TableRow key={slot.fieldPrefix}>
                    <TableCell className="font-medium flex items-center">{slot.icon}{slot.title}</TableCell>
                    <TableCell>
                      <Select
                        value={gearValues[gearRankKey]}
                        onValueChange={(value) => handleChange(gearRankKey, value)}
                      >
                        <SelectTrigger className="h-9 w-[110px]">
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                        <SelectContent className="z-[999] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)]">
                          <SelectItem value="0" className="hover:bg-[hsl(240_3.7%_15.9%)]">-</SelectItem>
                          <SelectItem value="1" className="hover:bg-[hsl(240_3.7%_15.9%)]">A Gear</SelectItem>
                          <SelectItem value="2" className="hover:bg-[hsl(240_3.7%_15.9%)]">S/S+ Gear</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={gearValues[fortRankKey]}
                        onValueChange={(value) => handleChange(fortRankKey, value)}
                      >
                        <SelectTrigger className="h-9 w-[120px]">
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                        <SelectContent className="z-[999] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)]">
                          <SelectItem value="0" className="hover:bg-[hsl(240_3.7%_15.9%)]">-</SelectItem>
                          <SelectItem value="1" className="hover:bg-[hsl(240_3.7%_15.9%)]">Legendary</SelectItem>
                          <SelectItem value="2" className="hover:bg-[hsl(240_3.7%_15.9%)]">Mystic</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={gearValues[fortLevelKey]}
                        onValueChange={(value) => handleChange(fortLevelKey, value)}
                      >
                        <SelectTrigger className="h-9 w-[90px]">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="z-[999] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)]">
                          <SelectItem value="0" className="hover:bg-[hsl(240_3.7%_15.9%)]">-</SelectItem>
                          <SelectItem value="1" className="hover:bg-[hsl(240_3.7%_15.9%)]">+0</SelectItem>
                          <SelectItem value="2" className="hover:bg-[hsl(240_3.7%_15.9%)]">+1</SelectItem>
                          <SelectItem value="3" className="hover:bg-[hsl(240_3.7%_15.9%)]">+2</SelectItem>
                          <SelectItem value="4" className="hover:bg-[hsl(240_3.7%_15.9%)]">+3</SelectItem>
                          <SelectItem value="5" className="hover:bg-[hsl(240_3.7%_15.9%)]">+4</SelectItem>
                          <SelectItem value="6" className="hover:bg-[hsl(240_3.7%_15.9%)]">+5</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-medium text-violet-600">{scores[scoreKey]}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Keep the Total Score Card */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <Card className="w-full max-w-xs">
            <CardContent className="pt-6 pb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Award size={24} className="text-violet-500" />
                  Total Gear Score
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-violet-600">{scores.total_score}</p>
              </CardContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
