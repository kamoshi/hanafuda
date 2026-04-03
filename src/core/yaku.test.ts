import { describe, expect, it } from 'vitest';
import { CARDS, ALL_CARD_IDS, canMatch, compareCards, matchingCards, sameMonth } from './cards';
import { buildDeck, deal, dealParentCheck, dealRound, peekTop, shuffle } from './deck';
import {
  calculateScore,
  calculateTotalScore,
  checkAllYaku,
  checkKuttsuki,
  checkTeshi,
  checkYaku,
} from './yaku';
import type { CardId } from './types';

// ---------------------------------------------------------------------------
// Helper: build a hand from specific card IDs
// ---------------------------------------------------------------------------
const cards = (...ids: CardId[]): readonly CardId[] => ids;

// ---------------------------------------------------------------------------
// cards.ts
// ---------------------------------------------------------------------------

describe('CARDS', () => {
  it('has exactly 48 cards', () => {
    expect(ALL_CARD_IDS).toHaveLength(48);
  });

  it('has numeric IDs 1-48 with no duplicates', () => {
    const numericIds = ALL_CARD_IDS.map((id) => CARDS[id]!.numericId).sort((a, b) => a - b);
    expect(numericIds).toEqual(Array.from({ length: 48 }, (_, i) => i + 1));
  });

  it('has months 1-12 with exactly 4 cards each', () => {
    const counts = new Array<number>(12).fill(0);
    for (const id of ALL_CARD_IDS) counts[CARDS[id]!.month - 1]!++;
    expect(counts).toEqual(new Array(12).fill(4));
  });

  it('has correct value distribution: 24 plains, 10 poems, 9 tane, 5 brights', () => {
    const byValue: Record<number, number> = { 1: 0, 5: 0, 10: 0, 20: 0 };
    for (const id of ALL_CARD_IDS) byValue[CARDS[id]!.value]!++;
    expect(byValue[1]).toBe(24);
    expect(byValue[5]).toBe(10);
    expect(byValue[10]).toBe(9);
    expect(byValue[20]).toBe(5);
  });

  it('kiri3 is a plain (value 1)', () => {
    expect(CARDS['kiri3']!.value).toBe(1);
  });

  it('yanagi1 (lightning) is a plain (value 1)', () => {
    expect(CARDS['yanagi1']!.value).toBe(1);
  });

  it('susuki3 (geese) is a tane (value 10)', () => {
    expect(CARDS['susuki3']!.value).toBe(10);
  });
});

describe('compareCards', () => {
  it('earlier month wins', () => {
    expect(compareCards('matsu1', 'ume1')).toBe(true);
    expect(compareCards('ume1', 'matsu1')).toBe(false);
  });

  it('same month: higher value wins', () => {
    expect(compareCards('matsu4', 'matsu1')).toBe(true);
    expect(compareCards('matsu1', 'matsu4')).toBe(false);
  });

  it('identical cards: returns true (first player wins tie)', () => {
    expect(compareCards('matsu1', 'matsu1')).toBe(true);
  });
});

describe('sameMonth / canMatch / matchingCards', () => {
  it('sameMonth: cards from same month match', () => {
    expect(sameMonth('matsu1', 'matsu4')).toBe(true);
    expect(sameMonth('matsu1', 'ume1')).toBe(false);
  });

  it('canMatch: returns true when any target shares month', () => {
    expect(canMatch('matsu1', cards('ume1', 'matsu3', 'kiku2'))).toBe(true);
    expect(canMatch('matsu1', cards('ume1', 'sakura2', 'kiku2'))).toBe(false);
  });

  it('matchingCards: returns all same-month cards', () => {
    const result = matchingCards('matsu1', cards('matsu2', 'ume1', 'matsu4'));
    expect(result).toEqual(['matsu2', 'matsu4']);
  });
});

// ---------------------------------------------------------------------------
// deck.ts
// ---------------------------------------------------------------------------

describe('buildDeck', () => {
  it('returns 48 cards', () => {
    expect(buildDeck()).toHaveLength(48);
  });

  it('returns a new array each time', () => {
    expect(buildDeck()).not.toBe(buildDeck());
  });
});

describe('shuffle', () => {
  it('returns same length', () => {
    expect(shuffle(buildDeck())).toHaveLength(48);
  });

  it('contains same elements', () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck);
    expect([...shuffled].sort()).toEqual([...deck].sort());
  });

  it('does not mutate the original', () => {
    const deck = buildDeck();
    const original = [...deck];
    shuffle(deck);
    expect([...deck]).toEqual(original);
  });
});

describe('deal', () => {
  it('takes n cards from the top (end)', () => {
    const pile: readonly CardId[] = ['matsu1', 'ume1', 'sakura1'];
    const { taken, remaining } = deal(pile, 2);
    expect(taken).toEqual(['ume1', 'sakura1']);
    expect(remaining).toEqual(['matsu1']);
  });

  it('total cards is preserved', () => {
    const pile = buildDeck();
    const { taken, remaining } = deal(pile, 8);
    expect(taken.length + remaining.length).toBe(48);
  });
});

describe('peekTop', () => {
  it('returns the last element', () => {
    expect(peekTop(['matsu1', 'ume1'])).toBe('ume1');
  });

  it('returns null for empty pile', () => {
    expect(peekTop([])).toBeNull();
  });
});

describe('dealRound', () => {
  it('deals 8 to each player and 8 to table, leaving 24 in pile', () => {
    const pile = shuffle(buildDeck());
    const result = dealRound(pile);
    expect(result.p1Hand).toHaveLength(8);
    expect(result.p2Hand).toHaveLength(8);
    expect(result.table).toHaveLength(8);
    expect(result.pile).toHaveLength(24);
  });

  it('all 48 cards are accounted for', () => {
    const pile = shuffle(buildDeck());
    const { p1Hand, p2Hand, table, pile: remaining } = dealRound(pile);
    const all = [...p1Hand, ...p2Hand, ...table, ...remaining].sort();
    expect(all).toEqual([...buildDeck()].sort());
  });
});

describe('dealParentCheck', () => {
  it('puts 8 cards on table, leaves 40 in pile', () => {
    const pile = shuffle(buildDeck());
    const result = dealParentCheck(pile);
    expect(result.table).toHaveLength(8);
    expect(result.pile).toHaveLength(40);
  });
});

// ---------------------------------------------------------------------------
// yaku.ts — checkTeshi / checkKuttsuki
// ---------------------------------------------------------------------------

describe('checkTeshi', () => {
  it('detects 4 cards from same month', () => {
    const hand = cards('matsu1', 'matsu2', 'matsu3', 'matsu4', 'ume1', 'ume2', 'sakura1', 'fuji1');
    expect(checkTeshi(hand)).toBe(true);
  });

  it('returns false when no month has 4 cards', () => {
    const hand = cards('matsu1', 'matsu2', 'matsu3', 'ume1', 'ume2', 'sakura1', 'fuji1', 'ayame1');
    expect(checkTeshi(hand)).toBe(false);
  });
});

describe('checkKuttsuki', () => {
  it('detects exactly 4 pairs from different months', () => {
    const hand = cards('matsu1', 'matsu2', 'ume1', 'ume2', 'sakura1', 'sakura2', 'fuji1', 'fuji2');
    expect(checkKuttsuki(hand)).toBe(true);
  });

  it('returns false for 3 pairs', () => {
    const hand = cards('matsu1', 'matsu2', 'ume1', 'ume2', 'sakura1', 'sakura2', 'fuji1', 'ayame1');
    expect(checkKuttsuki(hand)).toBe(false);
  });

  it('returns false when one month has 4 cards', () => {
    const hand = cards(
      'matsu1',
      'matsu2',
      'matsu3',
      'matsu4',
      'ume1',
      'ume2',
      'sakura1',
      'sakura2',
    );
    expect(checkKuttsuki(hand)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// yaku.ts — checkYaku
// ---------------------------------------------------------------------------

describe('checkYaku — Gokou (5 brights)', () => {
  const gokou = cards('matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4');

  it('satisfied with all 5 brights', () => {
    expect(checkYaku('gokou', gokou)).toBe(true);
  });

  it('not satisfied with only 4 brights', () => {
    expect(checkYaku('gokou', gokou.slice(0, 4))).toBe(false);
  });

  it('calculateScore returns 10', () => {
    expect(calculateScore('gokou', gokou)).toBe(10);
  });
});

describe('checkYaku — Shikou (4 brights, no rain)', () => {
  const shikou = cards('matsu4', 'sakura4', 'susuki4', 'kiri4');

  it('satisfied without yanagi4', () => {
    expect(checkYaku('shikou', shikou)).toBe(true);
  });

  it('not satisfied with only 3 brights', () => {
    expect(checkYaku('shikou', cards('matsu4', 'sakura4', 'susuki4'))).toBe(false);
  });

  it('calculateScore returns 8', () => {
    expect(calculateScore('shikou', shikou)).toBe(8);
  });
});

describe('checkYaku — AmeShikou (rain + 3 other brights)', () => {
  const ameShikou = cards('yanagi4', 'matsu4', 'sakura4', 'susuki4');

  it('satisfied with rain + 3 brights', () => {
    expect(checkYaku('ameShikou', ameShikou)).toBe(true);
  });

  it('not satisfied without rain', () => {
    expect(checkYaku('ameShikou', cards('matsu4', 'sakura4', 'susuki4', 'kiri4'))).toBe(false);
  });

  it('not satisfied with rain + only 2 other brights', () => {
    expect(checkYaku('ameShikou', cards('yanagi4', 'matsu4', 'sakura4'))).toBe(false);
  });

  it('calculateScore returns 7', () => {
    expect(calculateScore('ameShikou', ameShikou)).toBe(7);
  });
});

describe('checkYaku — Sankou (3 brights, no rain)', () => {
  it('satisfied with 3 non-rain brights', () => {
    expect(checkYaku('sankou', cards('matsu4', 'sakura4', 'susuki4'))).toBe(true);
  });

  it('satisfied with 4 non-rain brights', () => {
    expect(checkYaku('sankou', cards('matsu4', 'sakura4', 'susuki4', 'kiri4'))).toBe(true);
  });

  it('calculateScore returns 5', () => {
    expect(calculateScore('sankou', cards('matsu4', 'sakura4', 'susuki4'))).toBe(5);
  });
});

describe('checkYaku — InoShikaChou (boar-deer-butterfly)', () => {
  const base = cards('botan4', 'hagi4', 'momiji4');

  it('satisfied with just the three required cards', () => {
    expect(checkYaku('inoShikaChou', base)).toBe(true);
  });

  it('calculateScore: base 5 with no optional tane', () => {
    expect(calculateScore('inoShikaChou', base)).toBe(5);
  });

  it('calculateScore: +1 per optional tane', () => {
    const withTane = cards('botan4', 'hagi4', 'momiji4', 'ume4', 'fuji4');
    expect(calculateScore('inoShikaChou', withTane)).toBe(7);
  });
});

describe('checkYaku — Tane (5 tane cards)', () => {
  const fiveTane = cards('ume4', 'fuji4', 'ayame4', 'botan4', 'hagi4');

  it('satisfied with 5 tane', () => {
    expect(checkYaku('tane', fiveTane)).toBe(true);
  });

  it('not satisfied with 4 tane', () => {
    expect(checkYaku('tane', fiveTane.slice(0, 4))).toBe(false);
  });

  it('calculateScore: base 1 for exactly 5', () => {
    expect(calculateScore('tane', fiveTane)).toBe(1);
  });

  it('calculateScore: +1 for each tane beyond 5', () => {
    const sevenTane = cards('ume4', 'fuji4', 'ayame4', 'botan4', 'hagi4', 'susuki3', 'kiku4');
    expect(calculateScore('tane', sevenTane)).toBe(3);
  });
});

describe('checkYaku — Akatan (3 red poem tans)', () => {
  const base = cards('matsu3', 'ume3', 'sakura3');

  it('satisfied with 3 required red poems', () => {
    expect(checkYaku('akatan', base)).toBe(true);
  });

  it('not satisfied with only 2', () => {
    expect(checkYaku('akatan', cards('matsu3', 'ume3'))).toBe(false);
  });

  it('calculateScore: base 5', () => {
    expect(calculateScore('akatan', base)).toBe(5);
  });

  it('calculateScore: +1 per optional tan', () => {
    const withExtras = cards('matsu3', 'ume3', 'sakura3', 'fuji3', 'ayame3');
    expect(calculateScore('akatan', withExtras)).toBe(7);
  });
});

describe('checkYaku — Aotan (3 blue tans)', () => {
  const base = cards('botan3', 'kiku3', 'momiji3');

  it('satisfied with 3 required blue tans', () => {
    expect(checkYaku('aotan', base)).toBe(true);
  });

  it('calculateScore: base 5', () => {
    expect(calculateScore('aotan', base)).toBe(5);
  });

  it('calculateScore: +1 per optional tan', () => {
    const withExtras = cards('botan3', 'kiku3', 'momiji3', 'matsu3', 'ume3');
    expect(calculateScore('aotan', withExtras)).toBe(7);
  });
});

describe('checkYaku — Tanzaku (5 tan cards)', () => {
  const fiveTan = cards('matsu3', 'ume3', 'sakura3', 'fuji3', 'ayame3');

  it('satisfied with 5 tans', () => {
    expect(checkYaku('tanzaku', fiveTan)).toBe(true);
  });

  it('calculateScore: base 1 for exactly 5', () => {
    expect(calculateScore('tanzaku', fiveTan)).toBe(1);
  });

  it('calculateScore: +1 per tan beyond 5', () => {
    const sevenTan = cards('matsu3', 'ume3', 'sakura3', 'fuji3', 'ayame3', 'botan3', 'hagi3');
    expect(calculateScore('tanzaku', sevenTan)).toBe(3);
  });
});

describe('checkYaku — Kasu (10 plain cards)', () => {
  const tenPlain = cards(
    'matsu1',
    'matsu2',
    'ume1',
    'ume2',
    'sakura1',
    'sakura2',
    'fuji1',
    'fuji2',
    'ayame1',
    'ayame2',
  );

  it('satisfied with 10 plains', () => {
    expect(checkYaku('kasu', tenPlain)).toBe(true);
  });

  it('not satisfied with 9 plains', () => {
    expect(checkYaku('kasu', tenPlain.slice(0, 9))).toBe(false);
  });

  it('calculateScore: base 1 for exactly 10', () => {
    expect(calculateScore('kasu', tenPlain)).toBe(1);
  });

  it('calculateScore: +1 per plain beyond 10', () => {
    const twelvePlain = cards(
      'matsu1',
      'matsu2',
      'ume1',
      'ume2',
      'sakura1',
      'sakura2',
      'fuji1',
      'fuji2',
      'ayame1',
      'ayame2',
      'botan1',
      'botan2',
    );
    expect(calculateScore('kasu', twelvePlain)).toBe(3);
  });

  it('yanagi1 (lightning) does NOT count for kasu', () => {
    // Replace one plain with yanagi1 — should no longer satisfy kasu
    const nineRealPlusLightning = cards(
      'matsu1',
      'matsu2',
      'ume1',
      'ume2',
      'sakura1',
      'sakura2',
      'fuji1',
      'fuji2',
      'ayame1',
      'yanagi1',
    );
    expect(checkYaku('kasu', nineRealPlusLightning)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkAllYaku — combinations
// ---------------------------------------------------------------------------

describe('checkAllYaku', () => {
  it('returns empty array when no yaku', () => {
    expect(checkAllYaku(cards('matsu1', 'ume2', 'sakura1'))).toEqual([]);
  });

  it('detects multiple simultaneous yakus', () => {
    // Akatan + Aotan both satisfied, also Tanzaku (6 tans total)
    const collected = cards('matsu3', 'ume3', 'sakura3', 'botan3', 'kiku3', 'momiji3');
    const yakus = checkAllYaku(collected);
    expect(yakus).toContain('akatan');
    expect(yakus).toContain('aotan');
    expect(yakus).toContain('tanzaku');
  });
});

// ---------------------------------------------------------------------------
// calculateTotalScore
// ---------------------------------------------------------------------------

describe('calculateTotalScore', () => {
  it('returns 0 for empty collection', () => {
    expect(calculateTotalScore([])).toBe(0);
  });

  it('sums scores of all satisfied yakus', () => {
    const allBrights = cards('matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4');
    // Gokou = 10, Shikou = 8, AmeShikou = 7, Sankou = 5 — but only Gokou applies since it's the highest
    // Actually all yakus are checked independently and summed. Let's verify:
    // gokou: 10, shikou (requires matsu4,sakura4,susuki4,kiri4 but NOT yanagi4 - all present): 8
    // ameShikou (requires yanagi4 + 3 of [matsu4,sakura4,susuki4,kiri4]): 7
    // sankou (3 of [matsu4,sakura4,susuki4,kiri4]): 5
    // Note: in real game, winning by gokou supersedes others; total score is calculated differently.
    // Here we just verify the pure calculation matches:
    const total = calculateTotalScore(allBrights);
    expect(total).toBe(
      calculateScore('gokou', allBrights) +
        calculateScore('shikou', allBrights) +
        calculateScore('ameShikou', allBrights) +
        calculateScore('sankou', allBrights),
    );
  });
});
