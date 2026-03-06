import {
  setTileLock,
  clearTileLock,
  toggleTileLock,
  isTileLocked,
  TOTAL_TILES,
} from './bitmaskUtils';

describe('Tile Locking Bitmask Utilities', () => {
  describe('setTileLock', () => {
    it('should set the correct bit for a valid tile ID', () => {
      const initialMask = 0n;
      const tileId = 5;
      const expectedMask = 1n << BigInt(tileId - 1);
      expect(setTileLock(initialMask, tileId)).toBe(expectedMask);
    });

    it('should not change the mask if the bit is already set', () => {
      const tileId = 10;
      const initialMask = 1n << BigInt(tileId - 1);
      expect(setTileLock(initialMask, tileId)).toBe(initialMask);
    });

    it('should handle setting the first tile (ID 1)', () => {
      expect(setTileLock(0n, 1)).toBe(1n); // 1n << 0n
    });

    it('should handle setting the last tile (ID 44)', () => {
      expect(setTileLock(0n, TOTAL_TILES)).toBe(1n << BigInt(TOTAL_TILES - 1));
    });

    it('should return the original mask for invalid tile ID (0)', () => {
      expect(setTileLock(123n, 0)).toBe(123n);
    });

    it('should return the original mask for invalid tile ID (> TOTAL_TILES)', () => {
      expect(setTileLock(123n, TOTAL_TILES + 1)).toBe(123n);
    });
  });

  describe('clearTileLock', () => {
    it('should clear the correct bit for a valid tile ID', () => {
      const tileId = 7;
      const initialMask = 1n << BigInt(tileId - 1);
      expect(clearTileLock(initialMask, tileId)).toBe(0n);
    });

    it('should not change the mask if the bit is already clear', () => {
      const initialMask = 0n;
      const tileId = 15;
      expect(clearTileLock(initialMask, tileId)).toBe(0n);
    });

     it('should handle clearing the first tile (ID 1)', () => {
      expect(clearTileLock(1n, 1)).toBe(0n);
    });

    it('should handle clearing the last tile (ID 44)', () => {
       const initialMask = 1n << BigInt(TOTAL_TILES - 1);
      expect(clearTileLock(initialMask, TOTAL_TILES)).toBe(0n);
    });

    it('should return the original mask for invalid tile ID (0)', () => {
      expect(clearTileLock(123n, 0)).toBe(123n);
    });

    it('should return the original mask for invalid tile ID (> TOTAL_TILES)', () => {
      expect(clearTileLock(123n, TOTAL_TILES + 1)).toBe(123n);
    });
  });

  describe('toggleTileLock', () => {
    it('should set the bit if it is clear', () => {
      const initialMask = 0n;
      const tileId = 20;
      const expectedMask = 1n << BigInt(tileId - 1);
      expect(toggleTileLock(initialMask, tileId)).toBe(expectedMask);
    });

    it('should clear the bit if it is set', () => {
      const tileId = 25;
      const initialMask = 1n << BigInt(tileId - 1);
      expect(toggleTileLock(initialMask, tileId)).toBe(0n);
    });

    it('should handle toggling the first tile (ID 1)', () => {
      expect(toggleTileLock(0n, 1)).toBe(1n);
      expect(toggleTileLock(1n, 1)).toBe(0n);
    });

    it('should handle toggling the last tile (ID 44)', () => {
      const lastBitMask = 1n << BigInt(TOTAL_TILES - 1);
      expect(toggleTileLock(0n, TOTAL_TILES)).toBe(lastBitMask);
      expect(toggleTileLock(lastBitMask, TOTAL_TILES)).toBe(0n);
    });

     it('should return the original mask for invalid tile ID (0)', () => {
      expect(toggleTileLock(123n, 0)).toBe(123n);
    });

    it('should return the original mask for invalid tile ID (> TOTAL_TILES)', () => {
      expect(toggleTileLock(123n, TOTAL_TILES + 1)).toBe(123n);
    });
  });

   describe('isTileLocked', () => {
    const maskWithTile5Set = 1n << BigInt(5 - 1);

    it('should return true if the tile bit is set', () => {
      expect(isTileLocked(maskWithTile5Set, 5)).toBe(true);
    });

    it('should return false if the tile bit is clear', () => {
      expect(isTileLocked(maskWithTile5Set, 6)).toBe(false);
      expect(isTileLocked(0n, 5)).toBe(false);
    });

     it('should handle checking the first tile (ID 1)', () => {
      expect(isTileLocked(1n, 1)).toBe(true);
      expect(isTileLocked(0n, 1)).toBe(false);
    });

    it('should handle checking the last tile (ID 44)', () => {
       const lastBitMask = 1n << BigInt(TOTAL_TILES - 1);
      expect(isTileLocked(lastBitMask, TOTAL_TILES)).toBe(true);
      expect(isTileLocked(0n, TOTAL_TILES)).toBe(false);
    });

    it('should return false for invalid tile ID (0)', () => {
      expect(isTileLocked(123n, 0)).toBe(false);
    });

    it('should return false for invalid tile ID (> TOTAL_TILES)', () => {
      expect(isTileLocked(123n, TOTAL_TILES + 1)).toBe(false);
    });
  });

}); 