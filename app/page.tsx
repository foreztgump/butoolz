import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Calculator, Clock, Flame, Shield, Sparkles, Award, Coffee } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col gap-8 max-w-8xl mx-auto">
      <section className="py-8 md:py-12">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
            Welcome to BuTools
          </h1>
          <p className="mx-auto max-w-[600px] text-zinc-400 text-base">
            Tools and calculators to enhance your Bless Unleashed PC experience
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="h-5 w-5 text-blue-400" />
                Calculators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Calculate gear scores and base attack values to maximize your character's potential.
                </p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" asChild variant="default" className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                    <Link href="/gearscore_cal">Gear Scores</Link>
                  </Button>
                  <Button size="sm" asChild variant="default" className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                    <Link href="/baseatkcal">Base Attack</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-fuchsia-400" />
                Runes Dreaming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Track and optimize your rune configurations across all gear pieces.
                </p>
                <Button size="sm" asChild className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                  <Link href="/runes_dreaming">Open Runes Dreaming</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-orange-400" />
                Timers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Interactive timers for Backflow, Reflect, Fire, Lightning, and Fuse Storm abilities.
                </p>
                <Button size="sm" asChild className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                  <Link href="/timers">Open Timers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-emerald-400" />
                Shape Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Solve shape puzzles efficiently with this interactive tool.
                </p>
                <Button size="sm" asChild className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                  <Link href="/shapedoctor">Open Shape Doctor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-red-400" />
                Skill Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  View detailed information about skill level progression for different skill types.
                </p>
                <Button size="sm" asChild className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                  <Link href="/skill_level_progression">View Progression</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Donate Card */}
          <Card className="card-hover bg-zinc-800/25 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Coffee className="h-5 w-5 text-yellow-600" />
                Support BuTools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  If you find these tools helpful, consider supporting the development and maintenance.
                </p>
                <Button size="sm" asChild className="bg-zinc-800 hover:bg-zinc-700 hover:border hover:border-violet-500 group-hover:bg-black group-hover:border group-hover:border-primary transition-all">
                  {/* TODO: Replace # with your actual donation link */}
                  <Link href="#" target="_blank" rel="noopener noreferrer">Donate</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-4">
        <Card className="border-dashed bg-zinc-900/30">
          <CardContent className="pt-4">
            <div className="text-center space-y-3">
              <h2 className="text-lg font-medium flex items-center justify-center">
                <Award className="h-5 w-5 mr-2 text-yellow-400" />
                Special Thanks
              </h2>
              <p className="text-zinc-400 text-sm">This project wouldn't be possible without:</p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span className="text-sm">nodamagesquad guild</span>
                <span className="text-sm">OGWaffle</span>
                <span className="text-sm">ffsquirrel</span>
                <span className="text-sm">Gomar</span>
                <span className="text-sm">Quaxko</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
