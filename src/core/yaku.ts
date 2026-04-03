import { CARDS } from './cards';
import type { CardId, YakuDef, YakuId } from './types';

// ---------------------------------------------------------------------------
// Yaku definitions
// Mirrors Yaku.java enum. Card references use the original numeric IDs (1-48).
// ---------------------------------------------------------------------------

export const YAKUS: Record<YakuId, YakuDef> = {
  gokou: {
    id: 'gokou',
    requiredIds: [4, 12, 32, 44, 48], // crane, curtain, moon, rain, phoenix
    optionalIds: [],
    optionalMinimum: 0,
    basePoints: 10,
    bonus: false,
  },
  shikou: {
    id: 'shikou',
    requiredIds: [4, 12, 32, 48], // crane, curtain, moon, phoenix (no rain)
    optionalIds: [],
    optionalMinimum: 0,
    basePoints: 8,
    bonus: false,
  },
  ameShikou: {
    id: 'ameShikou',
    requiredIds: [44], // rain man required
    optionalIds: [4, 12, 32, 48], // need 3 of the other 4 brights
    optionalMinimum: 3,
    basePoints: 7,
    bonus: false,
  },
  sankou: {
    id: 'sankou',
    requiredIds: [],
    optionalIds: [4, 12, 32, 48], // 3 brights excluding rain
    optionalMinimum: 3,
    basePoints: 5,
    bonus: false,
  },
  inoShikaChou: {
    id: 'inoShikaChou',
    requiredIds: [24, 28, 40], // butterfly (botan4), boar (hagi4), deer (momiji4)
    optionalIds: [8, 16, 20, 31, 36, 43], // other tane: nightingale, cuckoo, bridge, geese, sake, swallow
    optionalMinimum: 0,
    basePoints: 5,
    bonus: true, // +1 per optional tane collected
  },
  tane: {
    id: 'tane',
    requiredIds: [],
    optionalIds: [8, 16, 20, 24, 28, 31, 36, 40, 43], // all 9 tane cards
    optionalMinimum: 5,
    basePoints: 1,
    bonus: true, // +1 per card beyond 5
  },
  akatan: {
    id: 'akatan',
    requiredIds: [3, 7, 11], // matsu3, ume3, sakura3 (red poem tans)
    optionalIds: [15, 19, 23, 27, 35, 39, 42], // other tan cards
    optionalMinimum: 0,
    basePoints: 5,
    bonus: true, // +1 per optional tan
  },
  aotan: {
    id: 'aotan',
    requiredIds: [23, 35, 39], // botan3, kiku3, momiji3 (blue tans)
    optionalIds: [3, 7, 11, 15, 19, 27, 42], // other tan cards
    optionalMinimum: 0,
    basePoints: 5,
    bonus: true, // +1 per optional tan
  },
  tanzaku: {
    id: 'tanzaku',
    requiredIds: [],
    optionalIds: [3, 7, 11, 15, 19, 23, 27, 35, 39, 42], // all 10 tan cards
    optionalMinimum: 5,
    basePoints: 1,
    bonus: true, // +1 per card beyond 5
  },
  kasu: {
    id: 'kasu',
    requiredIds: [],
    // 23 plain cards — yanagi1 (lightning, ID 41) is deliberately excluded
    optionalIds: [
      1, 2, 5, 6, 9, 10, 13, 14, 17, 18, 21, 22, 25, 26, 29, 30, 33, 34, 37, 38, 45, 46, 47,
    ],
    optionalMinimum: 10,
    basePoints: 1,
    bonus: true, // +1 per card beyond 10
  },
};

export const ALL_YAKU_IDS: readonly YakuId[] = Object.keys(YAKUS) as YakuId[];

// ---------------------------------------------------------------------------
// Pure helper
// ---------------------------------------------------------------------------

const hasNumericId = (collected: readonly CardId[], numericId: number): boolean =>
  collected.some((id) => CARDS[id]!.numericId === numericId);

// ---------------------------------------------------------------------------
// Core yaku-checking functions (ports of Yaku.java methods)
// ---------------------------------------------------------------------------

/** Returns true if collected satisfies a single yaku. */
export const checkYaku = (yakuId: YakuId, collected: readonly CardId[]): boolean => {
  const def = YAKUS[yakuId]!;
  if (!def.requiredIds.every((id) => hasNumericId(collected, id))) return false;
  const optionalCount = def.optionalIds.filter((id) => hasNumericId(collected, id)).length;
  return optionalCount >= def.optionalMinimum;
};

/** Returns all yakus satisfied by the collected cards. */
export const checkAllYaku = (collected: readonly CardId[]): readonly YakuId[] =>
  ALL_YAKU_IDS.filter((id) => checkYaku(id, collected));

/** Calculates points for a single yaku (0 if not satisfied). */
export const calculateScore = (yakuId: YakuId, collected: readonly CardId[]): number => {
  if (!checkYaku(yakuId, collected)) return 0;
  const def = YAKUS[yakuId]!;
  if (!def.bonus) return def.basePoints;
  const optionalCount = def.optionalIds.filter((id) => hasNumericId(collected, id)).length;
  return def.basePoints + (optionalCount - def.optionalMinimum);
};

/** Calculates the total score across all satisfied yakus. */
export const calculateTotalScore = (collected: readonly CardId[]): number =>
  ALL_YAKU_IDS.reduce((sum, id) => sum + calculateScore(id, collected), 0);

// ---------------------------------------------------------------------------
// Deal-time special hands (ports of Yaku.java static methods)
// ---------------------------------------------------------------------------

/** Teshi: hand contains 4 cards from the same month. Round is voided. */
export const checkTeshi = (hand: readonly CardId[]): boolean => {
  const counts = new Array<number>(12).fill(0);
  for (const id of hand) {
    const month = CARDS[id]!.month;
    counts[month - 1]!++;
  }
  return counts.some((c) => c === 4);
};

/** Kuttsuki: hand contains exactly 4 pairs (each pair from a different month). Round is voided. */
export const checkKuttsuki = (hand: readonly CardId[]): boolean => {
  const counts = new Array<number>(12).fill(0);
  for (const id of hand) {
    const month = CARDS[id]!.month;
    counts[month - 1]!++;
  }
  return counts.filter((c) => c === 2).length === 4;
};
