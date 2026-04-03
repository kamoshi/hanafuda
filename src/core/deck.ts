import { ALL_CARD_IDS } from './cards';
import type { CardId } from './types';

// ---------------------------------------------------------------------------
// Pure deck / pile functions
// Mirrors the relevant parts of Tabletop.java, without mutation.
// The "top" of the pile is the last element of the array (same as Java).
// ---------------------------------------------------------------------------

/** Returns a fresh unshuffled deck containing all 48 cards. */
export const buildDeck = (): readonly CardId[] => [...ALL_CARD_IDS];

/** Returns a new array with elements in a random order (Fisher-Yates). */
export const shuffle = (deck: readonly CardId[]): readonly CardId[] => {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
};

/** Takes n cards from the top (end) of the pile. Returns taken cards and the remaining pile. */
export const deal = (
  pile: readonly CardId[],
  n: number,
): { readonly taken: readonly CardId[]; readonly remaining: readonly CardId[] } => ({
  taken: pile.slice(-n),
  remaining: pile.slice(0, -n),
});

/**
 * Deals cards for a full round start (mirrors Tabletop.prepareGame).
 * Alternates 2-card deals: p1 hand, p2 hand, table — repeated 4 times.
 * Returns new state of pile, both hands, and table.
 */
export const dealRound = (
  pile: readonly CardId[],
): {
  readonly pile: readonly CardId[];
  readonly p1Hand: readonly CardId[];
  readonly p2Hand: readonly CardId[];
  readonly table: readonly CardId[];
} => {
  let remaining = pile;
  let p1Hand: readonly CardId[] = [];
  let p2Hand: readonly CardId[] = [];
  let table: readonly CardId[] = [];

  for (let i = 0; i < 4; i++) {
    const p1Deal = deal(remaining, 2);
    remaining = p1Deal.remaining;
    p1Hand = [...p1Hand, ...p1Deal.taken];

    const p2Deal = deal(remaining, 2);
    remaining = p2Deal.remaining;
    p2Hand = [...p2Hand, ...p2Deal.taken];

    const tableDealt = deal(remaining, 2);
    remaining = tableDealt.remaining;
    table = [...table, ...tableDealt.taken];
  }

  return { pile: remaining, p1Hand, p2Hand, table };
};

/**
 * Deals 8 cards to the table for the parent check (mirrors Tabletop.prepareParentCheck).
 */
export const dealParentCheck = (
  pile: readonly CardId[],
): { readonly pile: readonly CardId[]; readonly table: readonly CardId[] } => {
  const { taken, remaining } = deal(pile, 8);
  return { pile: remaining, table: taken };
};

/** Returns the top card of the pile without removing it (for display). */
export const peekTop = (pile: readonly CardId[]): CardId | null =>
  pile.length > 0 ? pile[pile.length - 1]! : null;
