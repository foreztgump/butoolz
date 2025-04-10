"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Sword,
  Shield,
  HardHatIcon as Helmet,
  Calculator,
  Award,
  HeartIcon as Chest,
  PenIcon as Pants,
  DockIcon as Boots,
  GlassesIcon as Gloves,
  HandIcon as Shoulder,
  BellIcon as Belt,
} from "lucide-react"

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
  const handleChange = (field, value) => {
    setGearValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Calculate gear scores
  const calculateGearScores = () => {
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
  }

  // Create a reusable gear item component
  const GearItem = ({ title, icon, gearRank, fortRank, fortLevel, score, onChange }) => (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${title.toLowerCase()}-gear-rank`} className="text-sm">
            Gear Rank
          </Label>
          <Select
            value={gearRank}
            onValueChange={(value) => onChange(`${title.toLowerCase().replace(" ", "_")}_gear_rank`, value)}
          >
            <SelectTrigger id={`${title.toLowerCase()}-gear-rank`} className="h-9">
              <SelectValue placeholder="Select rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">-</SelectItem>
              <SelectItem value="1">A Gear</SelectItem>
              <SelectItem value="2">S/S+ Gear</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${title.toLowerCase()}-fort-rank`} className="text-sm">
            Fortify Rank
          </Label>
          <Select
            value={fortRank}
            onValueChange={(value) => onChange(`${title.toLowerCase().replace(" ", "_")}_fort_rank`, value)}
          >
            <SelectTrigger id={`${title.toLowerCase()}-fort-rank`} className="h-9">
              <SelectValue placeholder="Select rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">-</SelectItem>
              <SelectItem value="1">Legendary</SelectItem>
              <SelectItem value="2">Mystic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${title.toLowerCase()}-fort-level`} className="text-sm">
            Fortify Level
          </Label>
          <Select
            value={fortLevel}
            onValueChange={(value) => onChange(`${title.toLowerCase().replace(" ", "_")}_fort_level`, value)}
          >
            <SelectTrigger id={`${title.toLowerCase()}-fort-level`} className="h-9">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">-</SelectItem>
              <SelectItem value="1">+0</SelectItem>
              <SelectItem value="2">+1</SelectItem>
              <SelectItem value="3">+2</SelectItem>
              <SelectItem value="4">+3</SelectItem>
              <SelectItem value="5">+4</SelectItem>
              <SelectItem value="6">+5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-1 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Gear Score:</span>
          <span className="text-lg font-medium text-primary">{score}</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Gear Score Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Calculate your total gear score based on equipment rank and fortification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Weapon */}
          <GearItem
            title="Weapon"
            icon={<Sword className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.w_gear_rank}
            fortRank={gearValues.w_fort_rank}
            fortLevel={gearValues.w_fort_level}
            score={scores.w_gear_score}
            onChange={handleChange}
          />

          {/* Off-Hand */}
          <GearItem
            title="Off-Hand"
            icon={<Shield className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.off_gear_rank}
            fortRank={gearValues.off_fort_rank}
            fortLevel={gearValues.off_fort_level}
            score={scores.oh_gear_score}
            onChange={handleChange}
          />

          {/* Helm */}
          <GearItem
            title="Helm"
            icon={<Helmet className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.head_gear_rank}
            fortRank={gearValues.head_fort_rank}
            fortLevel={gearValues.head_fort_level}
            score={scores.head_gear_score}
            onChange={handleChange}
          />

          {/* Chest */}
          <GearItem
            title="Chest"
            icon={<Chest className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.chest_gear_rank}
            fortRank={gearValues.chest_fort_rank}
            fortLevel={gearValues.chest_fort_level}
            score={scores.chest_gear_score}
            onChange={handleChange}
          />

          {/* Pants */}
          <GearItem
            title="Pants"
            icon={<Pants className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.pants_gear_rank}
            fortRank={gearValues.pants_fort_rank}
            fortLevel={gearValues.pants_fort_level}
            score={scores.pants_gear_score}
            onChange={handleChange}
          />

          {/* Boots */}
          <GearItem
            title="Boots"
            icon={<Boots className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.boots_gear_rank}
            fortRank={gearValues.boots_fort_rank}
            fortLevel={gearValues.boots_fort_level}
            score={scores.boots_gear_score}
            onChange={handleChange}
          />

          {/* Gloves */}
          <GearItem
            title="Gloves"
            icon={<Gloves className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.gloves_gear_rank}
            fortRank={gearValues.gloves_fort_rank}
            fortLevel={gearValues.gloves_fort_level}
            score={scores.gloves_gear_score}
            onChange={handleChange}
          />

          {/* Shoulder */}
          <GearItem
            title="Shoulder"
            icon={<Shoulder className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.shoulder_gear_rank}
            fortRank={gearValues.shoulder_fort_rank}
            fortLevel={gearValues.shoulder_fort_level}
            score={scores.shoulder_gear_score}
            onChange={handleChange}
          />

          {/* Belt */}
          <GearItem
            title="Belt"
            icon={<Belt className="h-4 w-4 mr-1.5 text-primary" />}
            gearRank={gearValues.belt_gear_rank}
            fortRank={gearValues.belt_fort_rank}
            fortLevel={gearValues.belt_fort_level}
            score={scores.belt_gear_score}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col items-center gap-4 mt-4">
          <Button size="sm" className="px-8 flex items-center" onClick={calculateGearScores}>
            <Calculator className="h-4 w-4 mr-1.5" />
            Calculate Gear Score
          </Button>

          <Card className="w-full max-w-xs">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground flex items-center justify-center">
                  <Award className="h-4 w-4 mr-1.5" />
                  Total Gear Score
                </p>
                <div className="text-4xl font-bold text-primary">{scores.total_score}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
