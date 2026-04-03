import { describe, expect, it } from 'vitest';
import { CARDS } from './cards';
import { INITIAL_STATE } from './initialState';
import { gameReducer } from './reducer';
import { canDump, koikoiCalledByAnyone, matchingTableCards, topOfPile } from './selectors';
import type { CardId, GameAction, GameState } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const config = {
  player1Name: 'Alice',
  player2Name: 'Bob',
  locale: 'en' as const,
  maxRounds: 3 as const,
  aiEnabled: false,
  aiStrategy: 'simple' as const,
};

const dispatch = (state: GameState, action: GameAction) => gameReducer(state, action);

const startGame = () => dispatch(INITIAL_STATE, { type: 'START_GAME', config });

const selectCard = (state: GameState, cardId: CardId, source: 'p1hand' | 'p2hand' | 'table') =>
  dispatch(state, { type: 'CARD_SELECTED', cardId, source });

const dump = (state: GameState) => dispatch(state, { type: 'DUMP' });

const koikoiAnswer = (state: GameState, accept: boolean) =>
  dispatch(state, { type: 'KOIKOI_ANSWER', accept });

// ---------------------------------------------------------------------------
// START_GAME
// ---------------------------------------------------------------------------

describe('START_GAME', () => {
  it('transitions to PARENT_CHECK_P1', () => {
    const s = startGame();
    expect(s.phase).toBe('PARENT_CHECK_P1');
  });

  it('sets player names from config', () => {
    const s = startGame();
    expect(s.player1.name).toBe('Alice');
    expect(s.player2.name).toBe('Bob');
  });

  it('uses AI name when aiEnabled', () => {
    const s = dispatch(INITIAL_STATE, {
      type: 'START_GAME',
      config: { ...config, aiEnabled: true, aiStrategy: 'simple' },
    });
    expect(s.player2.name).toBe('AI');
  });

  it('deals 8 face-down cards to table', () => {
    const s = startGame();
    expect(s.table).toHaveLength(8);
    expect(s.pile).toHaveLength(40);
  });

  it('round starts at 0 (not yet started)', () => {
    const s = startGame();
    expect(s.round).toBe(0);
  });

  it('maxRounds is set from config', () => {
    const s = startGame();
    expect(s.maxRounds).toBe(3);
  });

  it('ignores other actions in SETUP phase', () => {
    expect(INITIAL_STATE.phase).toBe('SETUP');
    const s = dispatch(INITIAL_STATE, { type: 'DUMP' });
    expect(s.phase).toBe('SETUP');
  });
});

// ---------------------------------------------------------------------------
// Parent check
// ---------------------------------------------------------------------------

describe('parent check', () => {
  it('P1 selecting a table card moves to PARENT_CHECK_P2', () => {
    const s0 = startGame();
    const firstTableCard = s0.table[0]!;
    const s1 = selectCard(s0, firstTableCard, 'table');
    expect(s1.phase).toBe('PARENT_CHECK_P2');
    expect(s1.p1ParentCard).toBe(firstTableCard);
  });

  it('P1 selecting from wrong source is a no-op', () => {
    const s0 = startGame();
    const s1 = selectCard(s0, s0.table[0]!, 'p1hand');
    expect(s1.phase).toBe('PARENT_CHECK_P1');
  });

  it('P2 cannot pick the same card as P1', () => {
    const s0 = startGame();
    const card = s0.table[0]!;
    const s1 = selectCard(s0, card, 'table'); // P1 picks
    const s2 = selectCard(s1, card, 'table'); // P2 tries same
    expect(s2.phase).toBe('PARENT_CHECK_P2'); // no change
  });

  it('P2 selecting a different table card resolves parent check', () => {
    const s0 = startGame();
    const s1 = selectCard(s0, s0.table[0]!, 'table');
    const s2 = selectCard(s1, s0.table[1]!, 'table');
    expect(s2.phase).toBe('PARENT_CHECK_RESULT');
    expect(s2.p2ParentCard).toBe(s0.table[1]!);
  });

  it('currentRoundStarter is set based on compareCards', () => {
    // compareCards(a, b) returns true if a wins (earlier month, tiebreak: higher value)
    // matsu4 (month 1, value 20) beats kiri1 (month 12, value 1)
    // Force the table to have two known cards by building a controlled state
    const s0 = startGame();
    const s1 = selectCard(s0, s0.table[0]!, 'table');
    const s2 = selectCard(s1, s0.table[1]!, 'table');
    // We don't control which card is which without fixing the deck,
    // just assert it's one of the valid options
    expect(s2.currentRoundStarter).toSatisfy((v: unknown) => v === 1 || v === 2);
  });

  describe('PARENT_CHECK_DELAY_ELAPSED', () => {
    it('deals the first round and advances to a turn phase', () => {
      const s0 = startGame();
      const s1 = selectCard(s0, s0.table[0]!, 'table');
      const s2 = selectCard(s1, s0.table[1]!, 'table');
      const s3 = dispatch(s2, { type: 'PARENT_CHECK_DELAY_ELAPSED' });
      expect(s3.phase).toMatch(/^TURN_P[12]_HAND$/);
      expect(s3.round).toBe(1);
      expect(s3.player1.hand).toHaveLength(8);
      expect(s3.player2.hand).toHaveLength(8);
      expect(s3.table).toHaveLength(8);
    });

    it('is a no-op outside PARENT_CHECK_RESULT', () => {
      const s0 = startGame();
      const s1 = dispatch(s0, { type: 'PARENT_CHECK_DELAY_ELAPSED' });
      expect(s1.phase).toBe('PARENT_CHECK_P1');
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers to reach a started round
// ---------------------------------------------------------------------------

/** Advance past parent check to the start of round 1. */
function reachRound1(starter: 1 | 2): GameState {
  // We need to get to PARENT_CHECK_RESULT with a known starter.
  // Easiest: brute-force START_GAME + select 2 table cards, then check.
  // Since we can't control the shuffle, we'll use a loop.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const s0 = startGame();
    const s1 = selectCard(s0, s0.table[0]!, 'table');
    const s2 = selectCard(s1, s0.table[1]!, 'table');
    if (s2.currentRoundStarter === starter) {
      return dispatch(s2, { type: 'PARENT_CHECK_DELAY_ELAPSED' });
    }
  }
  throw new Error(`Could not get starter=${starter} after 1000 attempts`);
}

// ---------------------------------------------------------------------------
// Normal turn — P1 goes first
// ---------------------------------------------------------------------------

describe('TURN_P1_HAND', () => {
  it('selecting a P1 hand card sets pendingHandCard', () => {
    const s = reachRound1(1);
    expect(s.phase).toBe('TURN_P1_HAND');
    const card = s.player1.hand[0]!;
    const s1 = selectCard(s, card, 'p1hand');
    expect(s1.pendingHandCard).toBe(card);
    expect(s1.phase).toBe('TURN_P1_HAND');
  });

  it('selecting a matching table card collects both and moves to pile phase', () => {
    const s = reachRound1(1);
    // Find a hand card that can match a table card
    const handCard = s.player1.hand.find((hc) =>
      s.table.some((tc) => CARDS[hc]!.month === CARDS[tc]!.month),
    );
    if (!handCard) return; // unlucky deal — skip
    const tableCard = s.table.find((tc) => CARDS[tc]!.month === CARDS[handCard]!.month)!;
    const s1 = selectCard(s, handCard, 'p1hand');
    const s2 = selectCard(s1, tableCard, 'table');
    expect(s2.phase).toBe('TURN_P1_PILE');
    expect(s2.player1.hand).not.toContain(handCard);
    expect(s2.table).not.toContain(tableCard);
    expect(s2.player1.collected).toContain(handCard);
    expect(s2.player1.collected).toContain(tableCard);
  });

  it('selecting non-matching table card is a no-op', () => {
    const s = reachRound1(1);
    const handCard = s.player1.hand[0]!;
    const nonMatching = s.table.find((tc) => CARDS[tc]!.month !== CARDS[handCard]!.month);
    if (!nonMatching) return;
    const s1 = selectCard(s, handCard, 'p1hand');
    const s2 = selectCard(s1, nonMatching, 'table');
    expect(s2.phase).toBe('TURN_P1_HAND');
    expect(s2.pendingHandCard).toBe(handCard); // card still pending
  });

  it('P2 source cards are ignored in P1 hand phase', () => {
    const s = reachRound1(1);
    const s1 = selectCard(s, s.player2.hand[0]!, 'p2hand');
    expect(s1.phase).toBe('TURN_P1_HAND');
    expect(s1.pendingHandCard).toBeNull();
  });
});

describe('DUMP from TURN_P1_HAND', () => {
  it('dumps pending hand card to table and moves to pile phase', () => {
    const s = reachRound1(1);
    // Find a hand card that cannot match any table card
    const unmatchable = s.player1.hand.find(
      (hc) => !s.table.some((tc) => CARDS[hc]!.month === CARDS[tc]!.month),
    );
    if (!unmatchable) return; // lucky deal, all match — skip
    const s1 = selectCard(s, unmatchable, 'p1hand');
    expect(canDump(s1)).toBe(true);
    const s2 = dump(s1);
    expect(s2.phase).toBe('TURN_P1_PILE');
    expect(s2.player1.hand).not.toContain(unmatchable);
    expect(s2.table).toContain(unmatchable);
    expect(s2.pendingHandCard).toBeNull();
  });

  it('dump without pendingHandCard is a no-op', () => {
    const s = reachRound1(1);
    const s1 = dump(s);
    expect(s1.phase).toBe('TURN_P1_HAND');
  });
});

// ---------------------------------------------------------------------------
// Pile phase
// ---------------------------------------------------------------------------

describe('TURN_P1_PILE', () => {
  /** Reach TURN_P1_PILE by dumping a hand card. */
  function reachPilePhase1(): GameState | null {
    for (let i = 0; i < 200; i++) {
      const s = reachRound1(1);
      const unmatchable = s.player1.hand.find(
        (hc) => !s.table.some((tc) => CARDS[hc]!.month === CARDS[tc]!.month),
      );
      if (!unmatchable) continue;
      return dump(selectCard(s, unmatchable, 'p1hand'));
    }
    return null;
  }

  it('matching pile top with table card collects both and ends P1 turn', () => {
    const s = reachPilePhase1();
    if (!s) return; // skip if we couldn't set up
    const pile = topOfPile(s)!;
    const matching = s.table.find((tc) => CARDS[tc]!.month === CARDS[pile]!.month);
    if (!matching) return; // pile can't match — would need dump
    const s1 = selectCard(s, matching, 'table');
    // Should move to P2's turn (or koikoi if yaku triggered)
    expect(['TURN_P2_HAND', 'KOIKOI_P1']).toContain(s1.phase);
    expect(s1.player1.collected).toContain(pile);
    expect(s1.player1.collected).toContain(matching);
    expect(s1.table).not.toContain(matching);
  });

  it('non-matching table card in pile phase is a no-op', () => {
    const s = reachPilePhase1();
    if (!s) return;
    const pile = topOfPile(s)!;
    const nonMatch = s.table.find((tc) => CARDS[tc]!.month !== CARDS[pile]!.month);
    if (!nonMatch) return;
    const s1 = selectCard(s, nonMatch, 'table');
    expect(s1.phase).toBe('TURN_P1_PILE');
  });

  it('dump in pile phase moves pile top to table and ends turn', () => {
    const s = reachPilePhase1();
    if (!s) return;
    const pile = topOfPile(s)!;
    const s1 = dump(s);
    expect(['TURN_P2_HAND', 'KOIKOI_P1']).toContain(s1.phase);
    expect(s1.table).toContain(pile);
    expect(topOfPile(s1)).not.toBe(pile);
  });
});

// ---------------------------------------------------------------------------
// Koi-koi
// ---------------------------------------------------------------------------

describe('KOIKOI_ANSWER', () => {
  /**
   * Build a state that has player 1 in KOIKOI_P1, by giving them all the
   * gokou bright cards in collected (5 brights = gokou = 10 pts).
   * We construct a GameState directly to avoid randomness.
   */
  function stateWithP1Koikoi(): GameState {
    // matsu4=crane, sakura4=curtain, susuki4=moon, yanagi4=rain, kiri4=phoenix
    const brightCards: CardId[] = ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'];
    // We need a valid pile-phase state with a card that just triggered gokou
    const base = reachRound1(1);
    // Override player1.collected directly — then call afterPileAction
    // by dispatching a state that looks like pile action just completed
    // with gokou cards in collected.
    // The simplest approach: craft a state manually
    return {
      ...base,
      phase: 'KOIKOI_P1',
      player1: {
        ...base.player1,
        collected: brightCards,
        passedYakuCount: 1,
      },
      overlay: {
        kind: 'koikoi',
        playerIndex: 1,
        yakuIds: ['gokou'],
        score: 10,
        interactive: true,
      },
    };
  }

  it('refusing koikoi (P1) immediately wins the round for P1', () => {
    const s0 = stateWithP1Koikoi();
    const s1 = koikoiAnswer(s0, false);
    // Should go to ROUND_OVER (or GAME_OVER if last round)
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    // P1 should have accumulated points
    expect(s1.player1.points).toBeGreaterThan(0);
  });

  it('accepting koikoi (P1) continues game with P2 turn, marks calledKoikoi', () => {
    const s0 = stateWithP1Koikoi();
    const s1 = koikoiAnswer(s0, true);
    expect(s1.player1.calledKoikoi).toBe(true);
    expect(koikoiCalledByAnyone(s1)).toBe(true);
    expect(s1.phase).toBe('TURN_P2_HAND');
    expect(s1.overlay).toBeNull();
  });

  it('refusing koikoi (P2) immediately wins for P2', () => {
    const base = reachRound1(1);
    const s0: GameState = {
      ...base,
      phase: 'KOIKOI_P2',
      player2: {
        ...base.player2,
        collected: ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
        passedYakuCount: 1,
      },
      overlay: {
        kind: 'koikoi',
        playerIndex: 2,
        yakuIds: ['gokou'],
        score: 10,
        interactive: true,
      },
    };
    const s1 = koikoiAnswer(s0, false);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    expect(s1.player2.points).toBeGreaterThan(0);
  });

  it('accepting koikoi (P2) continues game with P1 turn', () => {
    const base = reachRound1(1);
    const s0: GameState = {
      ...base,
      phase: 'KOIKOI_P2',
      player2: { ...base.player2, passedYakuCount: 1 },
      overlay: {
        kind: 'koikoi',
        playerIndex: 2,
        yakuIds: ['gokou'],
        score: 10,
        interactive: true,
      },
    };
    const s1 = koikoiAnswer(s0, true);
    expect(s1.player2.calledKoikoi).toBe(true);
    expect(s1.phase).toBe('TURN_P1_HAND');
  });

  it('KOIKOI_ANSWER is a no-op outside koikoi phases', () => {
    const s = reachRound1(1);
    const s1 = koikoiAnswer(s, true);
    expect(s1.phase).toBe('TURN_P1_HAND');
  });
});

// ---------------------------------------------------------------------------
// Round and game transitions
// ---------------------------------------------------------------------------

describe('NEW_ROUND_START', () => {
  it('is a no-op outside ROUND_OVER', () => {
    const s = reachRound1(1);
    const s1 = dispatch(s, { type: 'NEW_ROUND_START' });
    expect(s1.phase).toBe('TURN_P1_HAND');
  });

  it('from ROUND_OVER deals a new round and increments round counter', () => {
    const s0: GameState = {
      ...reachRound1(1),
      phase: 'ROUND_OVER',
      currentRoundStarter: 2,
    };
    const s1 = dispatch(s0, { type: 'NEW_ROUND_START' });
    expect(s1.phase).toBe('TURN_P2_HAND');
    expect(s1.round).toBe(2);
    expect(s1.player1.hand).toHaveLength(8);
    expect(s1.player2.hand).toHaveLength(8);
    expect(s1.table).toHaveLength(8);
    // calledKoikoi reset
    expect(s1.player1.calledKoikoi).toBe(false);
    expect(s1.player2.calledKoikoi).toBe(false);
  });

  it('preserves accumulated points across rounds', () => {
    const s0: GameState = {
      ...reachRound1(1),
      phase: 'ROUND_OVER',
      currentRoundStarter: 1,
      player1: { ...INITIAL_STATE.player1, name: 'Alice', points: 7 },
      player2: { ...INITIAL_STATE.player2, name: 'Bob', points: 3 },
    };
    const s1 = dispatch(s0, { type: 'NEW_ROUND_START' });
    expect(s1.player1.points).toBe(7);
    expect(s1.player2.points).toBe(3);
  });
});

describe('RESULTS_CLOSED', () => {
  it('clears the overlay in GAME_OVER phase', () => {
    const s0: GameState = {
      ...reachRound1(1),
      phase: 'GAME_OVER',
      overlay: {
        kind: 'results',
        player1Name: 'Alice',
        player2Name: 'Bob',
        score1: 10,
        score2: 5,
      },
    };
    const s1 = dispatch(s0, { type: 'RESULTS_CLOSED' });
    expect(s1.overlay).toBeNull();
  });

  it('is a no-op outside GAME_OVER', () => {
    const s = reachRound1(1);
    const s1 = dispatch(s, { type: 'RESULTS_CLOSED' });
    expect(s1.phase).toBe('TURN_P1_HAND');
  });
});

// ---------------------------------------------------------------------------
// Win resolution
// ---------------------------------------------------------------------------

describe('win resolution', () => {
  it('gokou (all 5 brights) earns 10 points', () => {
    const base = reachRound1(1);
    const brightCards: CardId[] = ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'];
    // Simulate state right after P1 collects the 5th bright (pile action done)
    // by constructing KOIKOI_P1 state and refusing
    const s0: GameState = {
      ...base,
      phase: 'KOIKOI_P1',
      player1: { ...base.player1, collected: brightCards, passedYakuCount: 1 },
      overlay: {
        kind: 'koikoi',
        playerIndex: 1,
        yakuIds: ['gokou'],
        score: 10,
        interactive: true,
      },
    };
    const s1 = koikoiAnswer(s0, false); // refuse → P1 wins immediately
    // All 5 brights satisfy gokou(10)+shikou(8)+ameShikou(7)+sankou(5)=30
    expect(s1.player1.points).toBe(30);
  });

  it('after last round win, phase is GAME_OVER', () => {
    const base: GameState = {
      ...reachRound1(1),
      round: 3, // maxRounds is 3
      maxRounds: 3,
      phase: 'KOIKOI_P1',
      player1: {
        ...INITIAL_STATE.player1,
        name: 'Alice',
        collected: ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
        passedYakuCount: 1,
      },
      overlay: {
        kind: 'koikoi',
        playerIndex: 1,
        yakuIds: ['gokou'],
        score: 10,
        interactive: true,
      },
    };
    const s1 = koikoiAnswer(base, false);
    expect(s1.phase).toBe('GAME_OVER');
    expect(s1.overlay?.kind).toBe('results');
  });

  it('draw (empty hands, no koikoi called) goes to ROUND_OVER with no points added', () => {
    const base = reachRound1(1);
    // Both players have empty hands → round end detected
    const s0: GameState = {
      ...base,
      phase: 'TURN_P1_PILE',
      player1: { ...base.player1, hand: [], collected: [] },
      player2: { ...base.player2, hand: [], collected: [] },
      pile: base.pile,
    };
    // Dump pile card → afterPileAction → startNextPlayerTurn(state, 2) → P2 has no hand → resolveRoundEnd
    const s1 = dump(s0);
    expect(s1.phase).toBe('ROUND_OVER');
    expect(s1.player1.points).toBe(0);
    expect(s1.player2.points).toBe(0);
    // currentRoundStarter unchanged (same player starts next round on draw)
    expect(s1.currentRoundStarter).toBe(base.currentRoundStarter);
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectors', () => {
  it('topOfPile returns last card in pile', () => {
    const s = reachRound1(1);
    const top = topOfPile(s);
    expect(top).toBe(s.pile[s.pile.length - 1]);
  });

  it('topOfPile returns null when pile is empty', () => {
    const s: GameState = { ...reachRound1(1), pile: [] };
    expect(topOfPile(s)).toBeNull();
  });

  it('matchingTableCards returns cards of same month as pendingHandCard', () => {
    const s = reachRound1(1);
    const hand = s.player1.hand[0]!;
    const s1 = selectCard(s, hand, 'p1hand');
    const matches = matchingTableCards(s1);
    for (const m of matches) {
      expect(CARDS[m]!.month).toBe(CARDS[hand]!.month);
    }
  });

  it('canDump is false when no hand card is selected', () => {
    const s = reachRound1(1);
    expect(canDump(s)).toBe(false);
  });

  it('koikoiCalledByAnyone is false at round start', () => {
    const s = reachRound1(1);
    expect(koikoiCalledByAnyone(s)).toBe(false);
  });
});
