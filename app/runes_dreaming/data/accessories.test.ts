import { RINGS, NECKLACES, type Accessory } from './accessories';
import { RUNE_TYPES } from '../types';

const VALID_RUNE_COLORS = new Set(RUNE_TYPES);

function validateAccessories(accessories: readonly Accessory[], expectedType: 'ring' | 'necklace') {
  const ids = new Set<string>();

  for (const accessory of accessories) {
    expect(ids.has(accessory.id)).toBe(false);
    ids.add(accessory.id);

    expect(accessory.type).toBe(expectedType);
    expect(accessory.name.length).toBeGreaterThan(0);
    expect(accessory.perks.length).toBeGreaterThan(0);

    for (const perk of accessory.perks) {
      expect(VALID_RUNE_COLORS.has(perk.runeColor)).toBe(true);
      expect(perk.requiredCount).toBeGreaterThan(0);
      expect(Number.isInteger(perk.requiredCount)).toBe(true);
      expect(perk.effect.length).toBeGreaterThan(0);
    }
  }
}

describe('accessories data', () => {
  test('RINGS exports a non-empty array of valid ring accessories', () => {
    expect(RINGS.length).toBeGreaterThan(0);
    validateAccessories(RINGS, 'ring');
  });

  test('NECKLACES exports a non-empty array of valid necklace accessories', () => {
    expect(NECKLACES.length).toBeGreaterThan(0);
    validateAccessories(NECKLACES, 'necklace');
  });

  test('all accessory IDs are globally unique', () => {
    const allIds = [...RINGS, ...NECKLACES].map(a => a.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
