export const RUNE_TYPES = ["purple", "white", "yellow", "red", "green"] as const;
export type RuneType = typeof RUNE_TYPES[number];
export type SelectableRuneValue = RuneType | 'rainbow' | '-';

export type Results = {
  [key in RuneType]: number;
} & {
  total: number;
  filled: number;
};
