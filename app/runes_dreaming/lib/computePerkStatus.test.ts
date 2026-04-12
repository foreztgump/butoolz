import { computePerkStatus, type PerkStatus } from './computePerkStatus';
import type { Accessory } from '../data/accessories';
import type { Results } from '../types';

const makeResults = (overrides: Partial<Results> = {}): Results => ({
  purple: 0, white: 0, yellow: 0, red: 0, green: 0,
  total: 45, filled: 0,
  ...overrides,
});

const testAccessory: Accessory = {
  id: "test_ring",
  name: "Test Ring",
  type: "ring",
  perks: [
    { effect: "Increased Attack Power", runeColor: "red", requiredCount: 3 },
    { effect: "Increased Max HP", runeColor: "green", requiredCount: 2 },
  ],
};

describe('computePerkStatus', () => {
  test('returns empty array when accessory is null', () => {
    const result = computePerkStatus(null, makeResults());
    expect(result).toEqual([]);
  });

  test('marks perk as activated when count meets requirement', () => {
    const results = makeResults({ red: 5, green: 3 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toEqual({
      effect: "Increased Attack Power",
      runeColor: "red",
      requiredCount: 3,
      currentCount: 5,
      activated: true,
      deficit: 0,
    });
  });

  test('marks perk as inactive with correct deficit', () => {
    const results = makeResults({ red: 1, green: 0 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses[0]).toEqual({
      effect: "Increased Attack Power",
      runeColor: "red",
      requiredCount: 3,
      currentCount: 1,
      activated: false,
      deficit: 2,
    });
    expect(statuses[1]).toEqual({
      effect: "Increased Max HP",
      runeColor: "green",
      requiredCount: 2,
      currentCount: 0,
      activated: false,
      deficit: 2,
    });
  });

  test('perk is activated when count exactly equals requirement', () => {
    const results = makeResults({ red: 3 });
    const statuses = computePerkStatus(testAccessory, results);

    expect(statuses[0].activated).toBe(true);
    expect(statuses[0].deficit).toBe(0);
  });
});
