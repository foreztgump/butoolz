import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListFilter, Table2, BarChart3, LayoutGrid, Award, Swords, Sword, Clock } from "lucide-react"

export default function UIComponents() {
  return (
    <div className="space-y-8">
      {/* Buttons */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <Button className="h-4 w-4 mr-1.5 text-primary" />
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Primary Action</Button>
          <Button size="sm" variant="secondary">
            Secondary Action
          </Button>
          <Button size="sm" variant="outline">
            Reset
          </Button>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        </div>
      </section>

      {/* Dropdowns/Selects */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <ListFilter className="h-4 w-4 mr-1.5 text-primary" />
          Dropdowns/Selects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="gear-rank" className="text-sm">
              Gear Rank
            </Label>
            <Select>
              <SelectTrigger id="gear-rank" className="h-9">
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="a-gear">A Gear</SelectItem>
                <SelectItem value="s-gear">S/S+ Gear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rune-color" className="text-sm">
              Rune Color
            </Label>
            <Select>
              <SelectTrigger id="rune-color" className="h-9">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="rainbow">Rainbow</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Input Fields */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <Input className="h-4 w-4 mr-1.5 text-primary" />
          Input Fields
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="base-attack" className="text-sm">
              Base Attack
            </Label>
            <Input id="base-attack" type="number" placeholder="Enter base attack" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="crit-rate" className="text-sm">
              Crit Rate (%)
            </Label>
            <Input id="crit-rate" type="number" placeholder="Enter crit rate" className="h-9" />
          </div>
        </div>
      </section>

      {/* Tables */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <Table2 className="h-4 w-4 mr-1.5 text-primary" />
          Tables
        </h2>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type/Level</TableHead>
                <TableHead>1</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
                <TableHead>4</TableHead>
                <TableHead>5</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Buff</TableCell>
                <TableCell>3</TableCell>
                <TableCell>5</TableCell>
                <TableCell>10</TableCell>
                <TableCell>15</TableCell>
                <TableCell>20</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Utility</TableCell>
                <TableCell>1</TableCell>
                <TableCell>3</TableCell>
                <TableCell>5</TableCell>
                <TableCell>7</TableCell>
                <TableCell>9</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Damage</TableCell>
                <TableCell>1</TableCell>
                <TableCell>1</TableCell>
                <TableCell>2</TableCell>
                <TableCell>2</TableCell>
                <TableCell>3</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Result Displays */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <BarChart3 className="h-4 w-4 mr-1.5 text-primary" />
          Result Displays
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Award className="h-4 w-4 mr-1.5" />
                Total Gear Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">1,493</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Swords className="h-4 w-4 mr-1.5" />
                Average Damage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">12,547.8</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <LayoutGrid className="h-4 w-4 mr-1.5 text-primary" />
          Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Sword className="h-4 w-4 mr-1.5 text-primary" />
                Weapon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="weapon-rank" className="text-sm">
                    Gear Rank
                  </Label>
                  <Select>
                    <SelectTrigger id="weapon-rank" className="h-9">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">-</SelectItem>
                      <SelectItem value="a-gear">A Gear</SelectItem>
                      <SelectItem value="s-gear">S/S+ Gear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gear Score:</span>
                  <span className="text-lg font-medium text-primary">257</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-primary" />
                Timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-3">
                <div className="text-3xl font-bold">15.00</div>
                <div className="flex gap-2">
                  <Button size="sm">Start</Button>
                  <Button size="sm" variant="outline">
                    Stop
                  </Button>
                </div>
                <div className="w-full flex justify-between text-xs text-muted-foreground">
                  <span>Backflow</span>
                  <span>Voice: On</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
