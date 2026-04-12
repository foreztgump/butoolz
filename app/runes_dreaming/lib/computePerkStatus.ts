import type { Accessory } from '../data/accessories';
import type { Results, RuneType } from '../types';

export interface PerkStatus {
  readonly effect: string;
  readonly runeColor: RuneType;
  readonly requiredCount: number;
  readonly currentCount: number;
  readonly activated: boolean;
  readonly deficit: number;
}

export function computePerkStatus(
  accessory: Accessory | null,
  results: Results,
): PerkStatus[] {
  if (!accessory) return [];

  return accessory.perks.map((perk) => {
    const currentCount = results[perk.runeColor];
    const activated = currentCount >= perk.requiredCount;
    const deficit = activated ? 0 : perk.requiredCount - currentCount;

    return {
      effect: perk.effect,
      runeColor: perk.runeColor,
      requiredCount: perk.requiredCount,
      currentCount,
      activated,
      deficit,
    };
  });
}
