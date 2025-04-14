"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X, Calculator, FileText, Sparkles, Clock, Puzzle, Heart, Map } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-[1010] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center">
        <div className="mr-4">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.webp" 
              alt="BuTools Logo" 
              width={20}
              height={20}
              className="mr-1.5"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
              BuTools
            </span>
          </Link>
        </div>

        {/* Group navigation links for centering */}
        <nav className="hidden md:flex flex-1 justify-center items-center space-x-1">
          {/* Calculators Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <Calculator className="h-4 w-4 mr-1.5" />
                Calculators
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem asChild>
                <Link href="/gearscore_cal">Gear Scores</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/baseatkcal">Base Attack</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Info Dropdown */} 
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-1.5" />
                Info
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem asChild>
                <Link href="/skill_level_progression">Skill Level Progression</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#" className="text-muted-foreground">
                  Useful Recipes
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Direct Links */} 
          <Button variant="ghost" size="sm" asChild>
            <Link href="/runes_dreaming">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Runes
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/timers">
              <Clock className="h-4 w-4 mr-1.5" />
              Timers
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/shapedoctor">
              <Puzzle className="h-4 w-4 mr-1.5" />
              Shape Doctor
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/map">
              <Map className="h-4 w-4 mr-1.5" />
              Map
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/donate">
              <Heart className="h-4 w-4 mr-1.5" />
              Donate
            </Link>
          </Button>
        </nav>

        {/* Right side elements */} 
        <div className="ml-auto flex items-center">
          {/* <ModeToggle /> */}
        </div>

        {/* Mobile menu button */} 
        <Button variant="ghost" size="icon" className="md:hidden ml-auto" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-[hsl(240_10%_3.9%)] border-b border-[hsl(240_3.7%_15.9%)] md:hidden z-[2000]">
            <div className="container py-3 flex flex-col gap-2">

              {/* Calculators Section */}
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Calculators</div>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start pl-6">
                <Link href="/gearscore_cal">
                  <Calculator className="h-4 w-4 mr-1.5" />
                  Gear Scores
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start pl-6">
                <Link href="/baseatkcal">
                  <Calculator className="h-4 w-4 mr-1.5" />
                  Base Attack
                </Link>
              </Button>

              {/* Info Section */}
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Info</div>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start pl-6">
                <Link href="/skill_level_progression">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Skill Level Progression
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="w-full justify-start pl-6 text-muted-foreground">
                <Link href="#">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Useful Recipes
                </Link>
              </Button>

              {/* Direct Links Separator (Optional) */}
              {/* <div className="border-t my-2"></div> */}

              {/* Direct Links (Keep original styling/icons) */}
              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/runes_dreaming">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Runes
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/timers">
                  <Clock className="h-4 w-4 mr-1.5" />
                  Timers
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/shapedoctor">
                  <Puzzle className="h-4 w-4 mr-1.5" />
                  Shape Doctor
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/map">
                  <Map className="h-4 w-4 mr-1.5" />
                  Map
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/donate">
                  <Heart className="h-4 w-4 mr-1.5" />
                  Donate
                </Link>
              </Button>

              {/* <div className="flex justify-end pt-2">
                <ModeToggle />
              </div> */}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
