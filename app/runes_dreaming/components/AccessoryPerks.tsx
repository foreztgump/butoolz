'use client'

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Gem } from "lucide-react";
import { RINGS, NECKLACES, type Accessory } from "../data/accessories";
import { computePerkStatus, type PerkStatus } from "../lib/computePerkStatus";
import { RUNE_COLOR_CLASSES, type Results } from "../types";

export const ACCESSORY_STORAGE_KEY = "butools_runes_accessories";
const NONE_VALUE = "none";

function findAccessory(id: string | null, list: readonly Accessory[]): Accessory | null {
  if (!id || id === NONE_VALUE) return null;
  return list.find((a) => a.id === id) ?? null;
}

function loadPersistedSelection(): { ringId: string | null; necklaceId: string | null } {
  try {
    const saved = localStorage.getItem(ACCESSORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ringId: parsed.ringId ?? null,
        necklaceId: parsed.necklaceId ?? null,
      };
    }
  } catch {
    // localStorage unavailable or corrupted — use defaults
  }
  return { ringId: null, necklaceId: null };
}

function PerkStatusRow({ perk }: { perk: PerkStatus }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-md ${perk.activated ? "bg-green-500/10" : "bg-muted/50 opacity-70"}`}>
      {perk.activated
        ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        : <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-sm">{perk.effect}</span>
        {!perk.activated && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${RUNE_COLOR_CLASSES[perk.runeColor]}`} />
            <span className="text-xs text-muted-foreground">
              {perk.deficit} more {perk.runeColor} {perk.deficit === 1 ? "rune" : "runes"} needed
            </span>
          </div>
        )}
      </div>
      <Badge variant="outline" className="flex items-center gap-1 text-xs flex-shrink-0">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${RUNE_COLOR_CLASSES[perk.runeColor]}`} />
        {perk.currentCount}/{perk.requiredCount}
      </Badge>
    </div>
  );
}

function AccessoryCard({ accessory, perkStatuses }: { accessory: Accessory; perkStatuses: PerkStatus[] }) {
  const activatedCount = perkStatuses.filter((p) => p.activated).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{accessory.name}</CardTitle>
        <CardDescription>
          {activatedCount}/{perkStatuses.length} perks activated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {perkStatuses.map((perk) => (
          <PerkStatusRow key={`${perk.runeColor}-${perk.effect}`} perk={perk} />
        ))}
      </CardContent>
    </Card>
  );
}

export function AccessoryPerks({ results }: { results: Results }) {
  const [selectedRingId, setSelectedRingId] = useState<string | null>(() => loadPersistedSelection().ringId);
  const [selectedNecklaceId, setSelectedNecklaceId] = useState<string | null>(() => loadPersistedSelection().necklaceId);

  const selectedRing = useMemo(() => findAccessory(selectedRingId, RINGS), [selectedRingId]);
  const selectedNecklace = useMemo(() => findAccessory(selectedNecklaceId, NECKLACES), [selectedNecklaceId]);

  const ringPerkStatuses = useMemo(() => computePerkStatus(selectedRing, results), [selectedRing, results]);
  const necklacePerkStatuses = useMemo(() => computePerkStatus(selectedNecklace, results), [selectedNecklace, results]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCESSORY_STORAGE_KEY, JSON.stringify({
        ringId: selectedRingId,
        necklaceId: selectedNecklaceId,
      }));
    } catch {
      // localStorage unavailable — silently skip
    }
  }, [selectedRingId, selectedNecklaceId]);

  const handleRingChange = useCallback((value: string) => {
    setSelectedRingId(value === NONE_VALUE ? null : value);
  }, []);

  const handleNecklaceChange = useCallback((value: string) => {
    setSelectedNecklaceId(value === NONE_VALUE ? null : value);
  }, []);

  const hasSelection = selectedRing || selectedNecklace;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Gem className="h-5 w-5 text-primary" /> Accessory Perks
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Select your equipped accessories to see which perks your rune configuration activates. Data sourced from community wikis.
      </p>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Ring</label>
          <Select value={selectedRingId ?? NONE_VALUE} onValueChange={handleRingChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a ring..." />
            </SelectTrigger>
            <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {RINGS.map((ring) => (
                <SelectItem key={ring.id} value={ring.id}>{ring.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Necklace</label>
          <Select value={selectedNecklaceId ?? NONE_VALUE} onValueChange={handleNecklaceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a necklace..." />
            </SelectTrigger>
            <SelectContent className="z-[100] border border-[hsl(240_3.7%_15.9%)] bg-[hsl(240_10%_4%)] max-h-60 overflow-y-auto">
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {NECKLACES.map((necklace) => (
                <SelectItem key={necklace.id} value={necklace.id}>{necklace.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Perk Status Cards */}
      {hasSelection ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedRing && <AccessoryCard accessory={selectedRing} perkStatuses={ringPerkStatuses} />}
          {selectedNecklace && <AccessoryCard accessory={selectedNecklace} perkStatuses={necklacePerkStatuses} />}
        </div>
      ) : (
        <div className="text-center p-6 border border-dashed border-muted-foreground/25 rounded-lg">
          <Gem className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Select a ring or necklace above to see which perks your runes activate.
          </p>
        </div>
      )}
    </div>
  );
}
