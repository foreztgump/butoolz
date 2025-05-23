import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Calculator, Clock, Flame, Shield, Sparkles, Award, Coffee, Map, Puzzle } from "lucide-react"
import SupporterList from "@/components/SupporterList"

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
          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="h-5 w-5 text-blue-400" />
                Calculators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Calculate gear scores and base attack values to maximize your character's potential.
                </p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" asChild variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                    <Link href="/gearscore_cal">Gear Scores</Link>
                  </Button>
                  <Button size="sm" asChild variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                    <Link href="/baseatkcal">Base Attack</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-fuchsia-400" />
                Runes Dreaming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Track and optimize your rune configurations across all gear pieces.
                </p>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                  <Link href="/runes_dreaming">Open Runes Dreaming</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-orange-400" />
                Timers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Interactive timers for Backflow, Reflect, Fire, Lightning, and Fuse Storm abilities.
                </p>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                  <Link href="/timers">Open Timers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-emerald-400" />
                Shape Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Solve shape puzzles efficiently with this interactive tool.
                </p>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                  <Link href="/shapedoctor">Open Shape Doctor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Map className="h-5 w-5 text-green-500" />
                Interactive Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Explore the interactive map of Bless Unleashed with locations, markers, and filters.
                </p>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                  <Link href="/map">View Map</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover group border bg-zinc-800/25">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Coffee className="h-5 w-5 text-yellow-600" />
                Support BuTools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  If you find these tools helpful, consider supporting the development and maintenance.
                </p>
                <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-zinc-800 dark:text-secondary-foreground dark:hover:bg-zinc-700 group-hover:dark:bg-black group-hover:dark:border group-hover:dark:border-primary transition-all">
                  <Link href="/donate">Donate</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Combined Supporters and Special Thanks Section */}
      <section className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporter List Card (will be updated next) */}
        <SupporterList />

        {/* Special Thanks Card */}
        <Card className="border-dashed bg-zinc-900/30 h-full"> {/* Add h-full for consistent height */}
          <CardContent className="pt-4 flex flex-col justify-center h-full"> {/* Center content vertically */}
            <div className="text-center space-y-3">
              <h2 className="text-lg font-medium flex items-center justify-center text-zinc-200"> {/* Match text color */}
                <Award className="h-5 w-5 mr-2 text-yellow-400" />
                Special Thanks
              </h2>
              <p className="text-muted-foreground text-sm">This project wouldn't be possible without:</p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span className="text-sm text-muted-foreground">nodamagesquad guild</span>
                <span className="text-sm text-muted-foreground">OGWaffle</span>
                <span className="text-sm text-muted-foreground">ffsquirrel</span>
                <span className="text-sm text-muted-foreground">Gomar</span>
                <span className="text-sm text-muted-foreground">Quaxko</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
