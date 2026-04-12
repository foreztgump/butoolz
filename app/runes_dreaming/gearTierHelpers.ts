// Gear tier system — slots unlock progressively by tier
export const GEAR_TIER_VALUES = ['rare', 'epic', 'legendary', 'mythic'] as const;
export type GearTier = typeof GEAR_TIER_VALUES[number];
export type GearTiers = Record<string, GearTier>;

export const DEFAULT_TIER: GearTier = 'mythic';

export interface TierOption {
  value: GearTier;
  label: string;
  color: string;
}

export const TIER_OPTIONS: Readonly<TierOption[]> = [
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'legendary', label: 'Legendary', color: 'bg-amber-500' },
  { value: 'mythic', label: 'Mythic', color: 'bg-red-500' },
] as const;

// Maps tier → set of 1-indexed slot numbers that are unlocked. Slot 5 always unlocked.
export const TIER_UNLOCKED_SLOTS: Readonly<Record<GearTier, ReadonlySet<number>>> = {
  rare: new Set([1, 5]),
  epic: new Set([1, 2, 5]),
  legendary: new Set([1, 2, 3, 5]),
  mythic: new Set([1, 2, 3, 4, 5]),
} as const;

const isValidGearTier = (value: unknown): value is GearTier =>
  typeof value === 'string' && GEAR_TIER_VALUES.includes(value as GearTier);

export const generateInitialGearTiers = (gearPieceIds: readonly string[]): GearTiers => {
  const tiers: GearTiers = {};
  gearPieceIds.forEach((id) => {
    tiers[id] = DEFAULT_TIER;
  });
  return tiers;
};

export const sanitizeGearTiers = (raw: unknown, gearPieceIds: readonly string[]): GearTiers => {
  if (!raw || typeof raw !== 'object') return generateInitialGearTiers(gearPieceIds);
  const tiers: GearTiers = {};
  gearPieceIds.forEach((id) => {
    const value = (raw as Record<string, unknown>)[id];
    tiers[id] = isValidGearTier(value) ? value : DEFAULT_TIER;
  });
  return tiers;
};

export const isSlotLocked = (gearPieceId: string, slotNumber: number, gearTiers: GearTiers): boolean => {
  const tier = gearTiers[gearPieceId] ?? DEFAULT_TIER;
  const unlockedSlots = TIER_UNLOCKED_SLOTS[tier];
  if (!unlockedSlots) return false;
  return !unlockedSlots.has(slotNumber);
};
