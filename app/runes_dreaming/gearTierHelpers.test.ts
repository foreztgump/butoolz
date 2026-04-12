import { generateInitialGearTiers, sanitizeGearTiers, isSlotLocked } from './gearTierHelpers'

const TEST_GEAR_IDS = [
  'main_hand', 'off_hand', 'head', 'chest',
  'pants', 'boots', 'gloves', 'shoulder', 'belt',
] as const

describe('generateInitialGearTiers', () => {
  it('returns all provided gear pieces set to mythic', () => {
    const tiers = generateInitialGearTiers(TEST_GEAR_IDS)

    expect(Object.keys(tiers)).toHaveLength(TEST_GEAR_IDS.length)
    Object.values(tiers).forEach((tier) => {
      expect(tier).toBe('mythic')
    })
  })

  it('includes all provided gear piece IDs', () => {
    const tiers = generateInitialGearTiers(TEST_GEAR_IDS)

    TEST_GEAR_IDS.forEach((id) => {
      expect(tiers[id]).toBeDefined()
    })
  })
})

describe('isSlotLocked', () => {
  const allMythic = generateInitialGearTiers(TEST_GEAR_IDS)

  it('unlocks all 5 slots at mythic tier', () => {
    for (let slot = 1; slot <= 5; slot++) {
      expect(isSlotLocked('head', slot, allMythic)).toBe(false)
    }
  })

  it('locks slots 2-4 at rare tier', () => {
    const tiers = { ...allMythic, head: 'rare' as const }

    expect(isSlotLocked('head', 1, tiers)).toBe(false)
    expect(isSlotLocked('head', 2, tiers)).toBe(true)
    expect(isSlotLocked('head', 3, tiers)).toBe(true)
    expect(isSlotLocked('head', 4, tiers)).toBe(true)
    expect(isSlotLocked('head', 5, tiers)).toBe(false)
  })

  it('locks slots 3-4 at epic tier', () => {
    const tiers = { ...allMythic, head: 'epic' as const }

    expect(isSlotLocked('head', 1, tiers)).toBe(false)
    expect(isSlotLocked('head', 2, tiers)).toBe(false)
    expect(isSlotLocked('head', 3, tiers)).toBe(true)
    expect(isSlotLocked('head', 4, tiers)).toBe(true)
    expect(isSlotLocked('head', 5, tiers)).toBe(false)
  })

  it('locks only slot 4 at legendary tier', () => {
    const tiers = { ...allMythic, head: 'legendary' as const }

    expect(isSlotLocked('head', 1, tiers)).toBe(false)
    expect(isSlotLocked('head', 2, tiers)).toBe(false)
    expect(isSlotLocked('head', 3, tiers)).toBe(false)
    expect(isSlotLocked('head', 4, tiers)).toBe(true)
    expect(isSlotLocked('head', 5, tiers)).toBe(false)
  })

  it('slot 5 is never locked regardless of tier', () => {
    const tierValues = ['rare', 'epic', 'legendary', 'mythic'] as const

    tierValues.forEach((tier) => {
      const tiers = { ...allMythic, head: tier }
      expect(isSlotLocked('head', 5, tiers)).toBe(false)
    })
  })

  it('defaults to mythic for unknown gear piece ID', () => {
    expect(isSlotLocked('unknown_piece', 1, allMythic)).toBe(false)
    expect(isSlotLocked('unknown_piece', 4, allMythic)).toBe(false)
  })

  it('returns false for invalid tier value (defensive)', () => {
    const badTiers = { head: 'common' as any }
    expect(isSlotLocked('head', 1, badTiers)).toBe(false)
  })
})

describe('sanitizeGearTiers', () => {
  it('returns defaults when raw is null', () => {
    const tiers = sanitizeGearTiers(null, TEST_GEAR_IDS)

    Object.values(tiers).forEach((tier) => {
      expect(tier).toBe('mythic')
    })
  })

  it('preserves valid tier values', () => {
    const raw = { head: 'rare', chest: 'epic' }
    const tiers = sanitizeGearTiers(raw, TEST_GEAR_IDS)

    expect(tiers.head).toBe('rare')
    expect(tiers.chest).toBe('epic')
    expect(tiers.boots).toBe('mythic')
  })

  it('replaces invalid tier values with default', () => {
    const raw = { head: 'common', chest: 42, pants: undefined }
    const tiers = sanitizeGearTiers(raw, TEST_GEAR_IDS)

    expect(tiers.head).toBe('mythic')
    expect(tiers.chest).toBe('mythic')
    expect(tiers.pants).toBe('mythic')
  })
})
