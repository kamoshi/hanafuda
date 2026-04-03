import type { CardData, CardId } from './types';

// ---------------------------------------------------------------------------
// Card definitions
// Mirrors Card.java enum. numericId matches the original Java enum ordinal (1-48).
// Values: 1=plain, 5=poem/tan, 10=tane/animal, 20=bright
// ---------------------------------------------------------------------------

export const CARDS: Record<CardId, CardData> = {
  // January — Matsu (Pine)
  matsu1: { id: 'matsu1', numericId: 1, month: 1, value: 1 }, // plain
  matsu2: { id: 'matsu2', numericId: 2, month: 1, value: 1 }, // plain
  matsu3: { id: 'matsu3', numericId: 3, month: 1, value: 5 }, // red poem tan
  matsu4: { id: 'matsu4', numericId: 4, month: 1, value: 20 }, // crane (bright)
  // February — Ume (Plum)
  ume1: { id: 'ume1', numericId: 5, month: 2, value: 1 }, // plain
  ume2: { id: 'ume2', numericId: 6, month: 2, value: 1 }, // plain
  ume3: { id: 'ume3', numericId: 7, month: 2, value: 5 }, // red poem tan
  ume4: { id: 'ume4', numericId: 8, month: 2, value: 10 }, // nightingale
  // March — Sakura (Cherry Blossom)
  sakura1: { id: 'sakura1', numericId: 9, month: 3, value: 1 }, // plain
  sakura2: { id: 'sakura2', numericId: 10, month: 3, value: 1 }, // plain
  sakura3: { id: 'sakura3', numericId: 11, month: 3, value: 5 }, // red poem tan
  sakura4: { id: 'sakura4', numericId: 12, month: 3, value: 20 }, // curtain (bright)
  // April — Fuji (Wisteria)
  fuji1: { id: 'fuji1', numericId: 13, month: 4, value: 1 }, // plain
  fuji2: { id: 'fuji2', numericId: 14, month: 4, value: 1 }, // plain
  fuji3: { id: 'fuji3', numericId: 15, month: 4, value: 5 }, // red tan
  fuji4: { id: 'fuji4', numericId: 16, month: 4, value: 10 }, // cuckoo
  // May — Ayame (Iris)
  ayame1: { id: 'ayame1', numericId: 17, month: 5, value: 1 }, // plain
  ayame2: { id: 'ayame2', numericId: 18, month: 5, value: 1 }, // plain
  ayame3: { id: 'ayame3', numericId: 19, month: 5, value: 5 }, // red tan
  ayame4: { id: 'ayame4', numericId: 20, month: 5, value: 10 }, // bridge
  // June — Botan (Peony)
  botan1: { id: 'botan1', numericId: 21, month: 6, value: 1 }, // plain
  botan2: { id: 'botan2', numericId: 22, month: 6, value: 1 }, // plain
  botan3: { id: 'botan3', numericId: 23, month: 6, value: 5 }, // blue tan
  botan4: { id: 'botan4', numericId: 24, month: 6, value: 10 }, // butterfly
  // July — Hagi (Bush Clover)
  hagi1: { id: 'hagi1', numericId: 25, month: 7, value: 1 }, // plain
  hagi2: { id: 'hagi2', numericId: 26, month: 7, value: 1 }, // plain
  hagi3: { id: 'hagi3', numericId: 27, month: 7, value: 5 }, // red tan
  hagi4: { id: 'hagi4', numericId: 28, month: 7, value: 10 }, // boar
  // August — Susuki (Eulalia)
  susuki1: { id: 'susuki1', numericId: 29, month: 8, value: 1 }, // plain
  susuki2: { id: 'susuki2', numericId: 30, month: 8, value: 1 }, // plain
  susuki3: { id: 'susuki3', numericId: 31, month: 8, value: 10 }, // geese
  susuki4: { id: 'susuki4', numericId: 32, month: 8, value: 20 }, // moon (bright)
  // September — Kiku (Chrysanthemum)
  kiku1: { id: 'kiku1', numericId: 33, month: 9, value: 1 }, // plain
  kiku2: { id: 'kiku2', numericId: 34, month: 9, value: 1 }, // plain
  kiku3: { id: 'kiku3', numericId: 35, month: 9, value: 5 }, // blue tan
  kiku4: { id: 'kiku4', numericId: 36, month: 9, value: 10 }, // sake cup
  // October — Momiji (Maple)
  momiji1: { id: 'momiji1', numericId: 37, month: 10, value: 1 }, // plain
  momiji2: { id: 'momiji2', numericId: 38, month: 10, value: 1 }, // plain
  momiji3: { id: 'momiji3', numericId: 39, month: 10, value: 5 }, // blue tan
  momiji4: { id: 'momiji4', numericId: 40, month: 10, value: 10 }, // deer
  // November — Yanagi (Willow)
  yanagi1: { id: 'yanagi1', numericId: 41, month: 11, value: 1 }, // lightning (plain, excluded from Kasu)
  yanagi2: { id: 'yanagi2', numericId: 42, month: 11, value: 5 }, // red tan
  yanagi3: { id: 'yanagi3', numericId: 43, month: 11, value: 10 }, // swallow
  yanagi4: { id: 'yanagi4', numericId: 44, month: 11, value: 20 }, // rain man (bright)
  // December — Kiri (Paulownia)
  kiri1: { id: 'kiri1', numericId: 45, month: 12, value: 1 }, // plain
  kiri2: { id: 'kiri2', numericId: 46, month: 12, value: 1 }, // plain
  kiri3: { id: 'kiri3', numericId: 47, month: 12, value: 1 }, // plain
  kiri4: { id: 'kiri4', numericId: 48, month: 12, value: 20 }, // phoenix (bright)
};

export const ALL_CARD_IDS: readonly CardId[] = Object.keys(CARDS) as CardId[];

// ---------------------------------------------------------------------------
// Pure card utility functions
// ---------------------------------------------------------------------------

/** Returns true if a is "better" for the parent check (earlier month wins; same month → higher value wins). */
export const compareCards = (a: CardId, b: CardId): boolean => {
  const da = CARDS[a]!;
  const db = CARDS[b]!;
  if (da.month !== db.month) return da.month < db.month;
  return da.value >= db.value;
};

/** Returns true if two cards belong to the same month (can match). */
export const sameMonth = (a: CardId, b: CardId): boolean => CARDS[a]!.month === CARDS[b]!.month;

/** Returns true if card can match any card in the targets list. */
export const canMatch = (card: CardId, targets: readonly CardId[]): boolean =>
  targets.some((t) => sameMonth(card, t));

/** Returns all cards in targets that share a month with card. */
export const matchingCards = (card: CardId, targets: readonly CardId[]): readonly CardId[] =>
  targets.filter((t) => sameMonth(card, t));
