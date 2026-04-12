export const RUNE_TYPES = ["purple", "white", "yellow", "red", "green"] as const;
export type RuneType = typeof RUNE_TYPES[number];
export type SelectableRuneValue = RuneType | 'rainbow' | '-';

export type Results = {
  [key in RuneType]: number;
} & {
  total: number;
  filled: number;
};

export const RUNE_COLOR_CLASSES: Record<RuneType, string> = {
  purple: "bg-purple-500",
  white: "bg-gray-100 dark:bg-gray-300 border border-gray-300 dark:border-gray-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  green: "bg-green-500",
};
