import type { RuneType } from '../types';

export interface AccessoryPerk {
  readonly effect: string;
  readonly runeColor: RuneType;
  readonly requiredCount: number;
}

export interface Accessory {
  readonly id: string;
  readonly name: string;
  readonly type: 'ring' | 'necklace';
  readonly perks: readonly AccessoryPerk[];
}

export const RINGS: readonly Accessory[] = [
  {
    id: "culinary_school_graduation_ring",
    name: "Culinary School Graduation Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
    ],
  },
  {
    id: "horde_ring",
    name: "Horde Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
    ],
  },
  {
    id: "faded_ring",
    name: "Faded Ring",
    type: "ring",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 2 },
    ],
  },
  {
    id: "ring_of_avarice",
    name: "Ring of Avarice",
    type: "ring",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Gathering/Mining/Logging Speed", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "bloodlust_ring",
    name: "Bloodlust Ring",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_whispering_serpent_god",
    name: "Ring of the Whispering Serpent God",
    type: "ring",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Restores HP equal to % of damage dealt", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "dauntless_ring",
    name: "Dauntless Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "shiny_ring",
    name: "Shiny Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_black_sun",
    name: "Ring of the Black Sun",
    type: "ring",
    perks: [
      { effect: "Increased PvP Attack Power", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "cyclops_ring",
    name: "Cyclops' Ring",
    type: "ring",
    perks: [
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "gideons_ring",
    name: "Gideon's Ring",
    type: "ring",
    perks: [
      { effect: "Increased Lunchbox Buff Duration", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_arrogance",
    name: "Ring of Arrogance",
    type: "ring",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "desert_song_ring",
    name: "Desert Song Ring",
    type: "ring",
    perks: [
      { effect: "Increased Lunchbox Buff Duration", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "chief_priests_ring",
    name: "Chief Priest's Ring",
    type: "ring",
    perks: [
      { effect: "Increased Potion Buff Duration", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "holy_ring",
    name: "Holy Ring",
    type: "ring",
    perks: [
      { effect: "Increased Potion Buff Duration", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "sinister_ring",
    name: "Sinister Ring",
    type: "ring",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "lichs_ring",
    name: "Lich's Ring",
    type: "ring",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "violent_tides_ring",
    name: "Violent Tides Ring",
    type: "ring",
    perks: [
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "ring_of_the_wolf_king",
    name: "Ring of the Wolf King",
    type: "ring",
    perks: [
      { effect: "Increased Gathering/Mining/Logging Speed", runeColor: "red", requiredCount: 1 },
    ],
  },
] as const;

export const NECKLACES: readonly Accessory[] = [
  {
    id: "horde_necklace",
    name: "Horde Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Damage", runeColor: "white", requiredCount: 1 },
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "shiny_necklace",
    name: "Shiny Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Attack Power", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "crimson_necklace",
    name: "Crimson Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Soul Pyre Recovery", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "faded_necklace",
    name: "Faded Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Gold Gain", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_golden_king",
    name: "Necklace of the Golden King",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_corrupted",
    name: "Necklace of the Corrupted",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 2 },
    ],
  },
  {
    id: "necklace_of_the_dead",
    name: "Necklace of the Dead",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "violent_tides_necklace",
    name: "Violent Tides Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Critical Hit Rate", runeColor: "white", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "zealous_heart_necklace",
    name: "Zealous Heart Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
    ],
  },
  {
    id: "queens_necklace",
    name: "Queen's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased PvE Combat XP", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Potion Cooldown", runeColor: "red", requiredCount: 1 },
    ],
  },
  {
    id: "necklace_of_the_tempting_flower",
    name: "Necklace of the Tempting Flower",
    type: "necklace",
    perks: [
      { effect: "Increased PvP Damage", runeColor: "purple", requiredCount: 1 },
      { effect: "Decreased Critical Hit Damage Received", runeColor: "purple", requiredCount: 2 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "cyclops_necklace",
    name: "Cyclops' Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Potion Healing", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Max HP", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "knight_captains_necklace",
    name: "Knight Captain's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased HP Recovery from Gathering", runeColor: "green", requiredCount: 1 },
    ],
  },
  {
    id: "roisas_necklace",
    name: "Roisa's Necklace",
    type: "necklace",
    perks: [
      { effect: "Increased Defence", runeColor: "yellow", requiredCount: 1 },
      { effect: "Increased Penetration", runeColor: "red", requiredCount: 1 },
    ],
  },
] as const;
