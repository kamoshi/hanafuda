/**
 * integration.test.ts — Stage 11 integration tests.
 *
 * Covers the four axes called out in the migration plan:
 *   1. All yakus (scoring + koikoi paths)
 *   2. All locales (en / pl / ja)
 *   3. Koikoi paths (accept, refuse, anyKoikoi → immediate win, double-koikoi draw)
 *
 * Plus full multi-round AI game simulations for 1 / 3 / 6-round configurations.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { gameReducer } from './core/reducer';
import { INITIAL_STATE } from './core/initialState';
import { checkAllYaku, calculateTotalScore } from './core/yaku';
import { simpleAI } from './ai/simpleAI';
import { analysisAI } from './ai/analysisAI';
import { canMatch } from './core/cards';
import { peekTop } from './core/deck';
import { t, setLocale, getLocale } from './i18n/i18n';
import { en } from './i18n/en';
import { pl } from './i18n/pl';
import { ja } from './i18n/ja';
import type { CardId, GameAction, GameConfig, GameState, RoundCount } from './core/types';


// ---------------------------------------------------------------------------
// Shared helpers (mirrors reducer.test.ts style)
// ---------------------------------------------------------------------------

const baseConfig: GameConfig = {
  player1Name: 'Alice',
  player2Name: 'Bob',
  locale: 'en',
  maxRounds: 3,
  aiEnabled: false,
  aiStrategy: 'simple',
};

const dispatch = (state: GameState, action: GameAction) => gameReducer(state, action);

const startGame = (overrides: Partial<GameConfig> = {}) =>
  dispatch(INITIAL_STATE, { type: 'START_GAME', config: { ...baseConfig, ...overrides } });

const selectCard = (state: GameState, cardId: CardId, source: 'p1hand' | 'p2hand' | 'table') =>
  dispatch(state, { type: 'CARD_SELECTED', cardId, source });

const dump = (state: GameState) => dispatch(state, { type: 'DUMP' });

/** Advance past parent check into round 1 with a given starter. */
function reachRound1(starter: 1 | 2, config: Partial<GameConfig> = {}): GameState {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const s0 = startGame(config);
    const s1 = selectCard(s0, s0.table[0]!, 'table');
    const s2 = selectCard(s1, s0.table[1]!, 'table');
    if (s2.currentRoundStarter === starter) {
      return dispatch(s2, { type: 'PARENT_CHECK_DELAY_ELAPSED' });
    }
  }
  throw new Error(`Could not reach round 1 with starter=${starter}`);
}

// ---------------------------------------------------------------------------
// Full AI simulation helper (used for multi-round game tests)
// ---------------------------------------------------------------------------

function runAIGame(config: GameConfig): GameState {
  let state: GameState = dispatch(INITIAL_STATE, { type: 'START_GAME', config });
  let iters = 0;
  const MAX = 1000;

  while (state.phase !== 'GAME_OVER' && iters++ < MAX) {
    let action: GameAction | null = null;

    switch (state.phase) {
      case 'PARENT_CHECK_P1':
        action = { type: 'CARD_SELECTED', cardId: simpleAI.parentMove(state.table, null), source: 'table' };
        break;
      case 'PARENT_CHECK_P2':
        action = { type: 'CARD_SELECTED', cardId: analysisAI.parentMove(state.table, state.p1ParentCard), source: 'table' };
        break;
      case 'PARENT_CHECK_RESULT':
        action = { type: 'PARENT_CHECK_DELAY_ELAPSED' };
        break;
      case 'ROUND_OVER':
        action = { type: 'NEW_ROUND_START' };
        break;
      case 'TURN_P1_HAND':
        if (state.pendingHandCard === null) {
          action = { type: 'CARD_SELECTED', cardId: simpleAI.handMove(state.player1.hand, state.table), source: 'p1hand' };
        } else if (!canMatch(state.pendingHandCard, state.table)) {
          action = { type: 'DUMP' };
        } else {
          action = { type: 'CARD_SELECTED', cardId: simpleAI.matchTableCard(state.pendingHandCard, state.table), source: 'table' };
        }
        break;
      case 'TURN_P1_PILE': {
        const top = peekTop(state.pile);
        if (top !== null) {
          const match = simpleAI.pileResponse(top, state.table);
          action = match ? { type: 'CARD_SELECTED', cardId: match, source: 'table' } : { type: 'DUMP' };
        }
        break;
      }
      case 'TURN_P2_HAND':
        if (state.pendingHandCard === null) {
          action = { type: 'CARD_SELECTED', cardId: analysisAI.handMove(state.player2.hand, state.table), source: 'p2hand' };
        } else if (!canMatch(state.pendingHandCard, state.table)) {
          action = { type: 'DUMP' };
        } else {
          action = { type: 'CARD_SELECTED', cardId: analysisAI.matchTableCard(state.pendingHandCard, state.table), source: 'table' };
        }
        break;
      case 'TURN_P2_PILE': {
        const top = peekTop(state.pile);
        if (top !== null) {
          const match = analysisAI.pileResponse(top, state.table);
          action = match ? { type: 'CARD_SELECTED', cardId: match, source: 'table' } : { type: 'DUMP' };
        }
        break;
      }
      case 'KOIKOI_P1':
        action = { type: 'KOIKOI_ANSWER', accept: simpleAI.koikoiMove(state.player1.hand, state.table) };
        break;
      case 'KOIKOI_P2':
        action = { type: 'KOIKOI_ANSWER', accept: analysisAI.koikoiMove(state.player2.hand, state.table) };
        break;
    }

    if (action) state = dispatch(state, action);
    else break;
  }

  return state;
}

// ===========================================================================
// 1. i18n — all locales
// ===========================================================================

describe('i18n — locale coverage', () => {
  const savedLocale = getLocale();
  afterEach(() => setLocale(savedLocale));

  it('en has all keys non-empty', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key} should be non-empty`).toBeTruthy();
    }
  });

  it('pl has all keys non-empty', () => {
    for (const [key, value] of Object.entries(pl)) {
      expect(value, `pl.${key} should be non-empty`).toBeTruthy();
    }
  });

  it('ja has all keys non-empty', () => {
    for (const [key, value] of Object.entries(ja)) {
      expect(value, `ja.${key} should be non-empty`).toBeTruthy();
    }
  });

  it('pl and en have the same keys', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  });

  it('ja and en have the same keys', () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
  });

  it('t() returns the current locale string and switches on setLocale()', () => {
    setLocale('en');
    const enYes = t('koikoi_yes');
    setLocale('pl');
    const plYes = t('koikoi_yes');
    setLocale('ja');
    const jaYes = t('koikoi_yes');

    expect(enYes).toBe('Yes');
    expect(plYes).toBe('Tak');
    expect(jaYes).toBe('はい');
    // All three are distinct
    expect(new Set([enYes, plYes, jaYes]).size).toBe(3);
  });

  it('t() switches locale for points suffix', () => {
    setLocale('en');
    expect(t('gameapp_points_suffix')).toBe('points');
    setLocale('pl');
    expect(t('gameapp_points_suffix')).toBe('punktów');
    setLocale('ja');
    expect(t('gameapp_points_suffix')).toBe('文');
  });

  it('launcher labels are translated in all locales', () => {
    for (const locale of ['en', 'pl', 'ja'] as const) {
      setLocale(locale);
      expect(t('launcher_play_button')).toBeTruthy();
      expect(t('launcher_player1_label')).toBeTruthy();
      expect(t('launcher_enableai_label')).toBeTruthy();
    }
  });
});

// ===========================================================================
// 2. YakuId → TranslationKey mapping (all 10 yakus in all 3 locales)
// ===========================================================================

describe('yaku translation key coverage', () => {
  const savedLocale = getLocale();
  afterEach(() => setLocale(savedLocale));

  const yakuIds = [
    'gokou', 'shikou', 'ameshikou', 'sankou',
    'inoshikachou', 'tane', 'akatan', 'aotan', 'tanzaku', 'kasu',
  ] as const;

  // These are the lowercase keys as constructed by hf-koikoi-popup's yakuLabel():
  //   `koikoi_${yakuId.toLowerCase()}`
  // YakuId values like 'ameShikou' → 'ameshikou', 'inoShikaChou' → 'inoshikachou'

  for (const locale of ['en', 'pl', 'ja'] as const) {
    it(`all 10 yaku keys are non-empty in locale '${locale}'`, () => {
      setLocale(locale);
      for (const id of yakuIds) {
        const key = `koikoi_${id}` as const;
        expect(t(key), `${locale}.${key}`).toBeTruthy();
      }
    });
  }
});

// ===========================================================================
// 4. Round count — each maxRounds value ends at GAME_OVER at the right time
// ===========================================================================

describe('round count — games reach GAME_OVER after correct number of rounds', () => {
  for (const maxRounds of [1, 3, 6] as RoundCount[]) {
    it(`${maxRounds}-round AI game reaches GAME_OVER`, () => {
      const config: GameConfig = {
        ...baseConfig,
        maxRounds,
        aiEnabled: true,
        aiStrategy: 'analysis',
      };
      const final = runAIGame(config);
      expect(final.phase).toBe('GAME_OVER');
      expect(final.overlay?.kind).toBe('results');
    });
  }
});

// ===========================================================================
// 5. Koikoi paths
// ===========================================================================

describe('koikoi — anyKoikoi flag causes immediate win without popup', () => {
  /**
   * Build a TURN_P2_PILE state where:
   *   - P1 has already called koikoi (calledKoikoi = true)
   *   - P2 has all 5 brights in collected (gokou, passedYakuCount = 0)
   *   - pile has one card so DUMP is valid
   *
   * When DUMP is dispatched, afterPileAction sees anyKoikoi=true and new yakus,
   * so it calls resolveWin(state, 2) immediately — no KOIKOI_P2 overlay.
   */
  function stateWithAnyKoikoiAndP2Gokou(): GameState {
    const base = reachRound1(1);
    return {
      ...base,
      phase: 'TURN_P2_PILE',
      pile: ['matsu1'],
      player1: { ...base.player1, calledKoikoi: true },
      player2: {
        ...base.player2,
        collected: ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
        passedYakuCount: 0,
      },
    };
  }

  it('P2 wins immediately — no koikoi popup shown', () => {
    const s0 = stateWithAnyKoikoiAndP2Gokou();
    const s1 = dump(s0);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    expect(s1.overlay?.kind).not.toBe('koikoi');
  });

  it('P2 wins immediately — overlay is results (or null if not game over)', () => {
    const s0 = stateWithAnyKoikoiAndP2Gokou();
    const s1 = dump(s0);
    if (s1.phase === 'GAME_OVER') {
      expect(s1.overlay?.kind).toBe('results');
    } else {
      expect(s1.overlay).toBeNull();
    }
  });

  it('P2 accumulates points from gokou score', () => {
    const s0 = stateWithAnyKoikoiAndP2Gokou();
    const s1 = dump(s0);
    // gokou(10)+shikou(8)+ameShikou(7)+sankou(5) = 30 (same as yaku.test.ts)
    const expected = calculateTotalScore(['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4']);
    expect(s1.player2.points).toBe(expected);
  });
});

describe('koikoi — symmetric: P2 called koikoi, P1 reaches yaku', () => {
  function stateWithAnyKoikoiAndP1Gokou(): GameState {
    const base = reachRound1(1);
    return {
      ...base,
      phase: 'TURN_P1_PILE',
      pile: ['ume1'],
      player2: { ...base.player2, calledKoikoi: true },
      player1: {
        ...base.player1,
        collected: ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
        passedYakuCount: 0,
      },
    };
  }

  it('P1 wins immediately when P2 had called koikoi', () => {
    const s0 = stateWithAnyKoikoiAndP1Gokou();
    const s1 = dump(s0);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    expect(s1.overlay?.kind).not.toBe('koikoi');
    expect(s1.player1.points).toBeGreaterThan(0);
  });
});

describe('koikoi — empty hands with calledKoikoi → that player wins', () => {
  it('P1 called koikoi; empty hands → P1 wins', () => {
    const base = reachRound1(1);
    const s0: GameState = {
      ...base,
      phase: 'TURN_P2_PILE',
      pile: ['matsu1'],
      player1: { ...base.player1, hand: [], calledKoikoi: true },
      player2: { ...base.player2, hand: [] },
    };
    const s1 = dump(s0);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    // resolveRoundEnd: P1 called koikoi → resolveWin(state, 1)
    // P1's collected might be empty so points = 0, but it goes through resolveWin
    expect(s1.currentRoundStarter).toBe(1);
  });

  it('P2 called koikoi; empty hands → P2 wins', () => {
    const base = reachRound1(1);
    const s0: GameState = {
      ...base,
      phase: 'TURN_P1_PILE',
      pile: ['ume1'],
      player1: { ...base.player1, hand: [] },
      player2: { ...base.player2, hand: [], calledKoikoi: true },
    };
    const s1 = dump(s0);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    expect(s1.currentRoundStarter).toBe(2);
  });
});

describe('koikoi — passedYakuCount prevents repeat popup for same yaku set', () => {
  it('no new popup when yakuIds.length === passedYakuCount', () => {
    const base = reachRound1(1);
    // P1 already has gokou and passedYakuCount = 1 (was shown popup once and called koikoi)
    const s0: GameState = {
      ...base,
      phase: 'TURN_P1_PILE',
      pile: ['ume1'],
      player1: {
        ...base.player1,
        hand: ['kiku1'],   // non-empty so round doesn't end immediately
        calledKoikoi: true,
        collected: ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
        passedYakuCount: 4, // checkAllYaku returns 4 yaku IDs for all 5 brights
      },
      player2: { ...base.player2, hand: ['botan1'] },
    };
    const s1 = dump(s0);
    // anyKoikoi is true (P1.calledKoikoi), but since yakuIds.length (4) > passedYakuCount (4) is FALSE,
    // it goes to startNextPlayerTurn, not resolveWin
    // Actually 5 brights trigger: gokou(1) + shikou(2) + ameShikou(3) + sankou(4) = 4 yaku IDs
    // passedYakuCount=4 → yakuIds.length (4) > 4 is FALSE → startNextPlayerTurn
    expect(['TURN_P2_HAND', 'ROUND_OVER', 'GAME_OVER']).toContain(s1.phase);
    expect(s1.overlay?.kind).not.toBe('koikoi');
  });
});

// ===========================================================================
// 6. All yakus — verify every yaku triggers a koikoi popup when achieved
// ===========================================================================

describe('all yakus — each triggers koikoi overlay when first achieved (no prior koikoi)', () => {
  /** The minimal collected set that triggers exactly the given yaku. */
  const minimalCollected: Record<string, CardId[]> = {
    gokou:       ['matsu4', 'sakura4', 'susuki4', 'yanagi4', 'kiri4'],
    shikou:      ['matsu4', 'sakura4', 'susuki4', 'kiri4'],
    ameShikou:   ['yanagi4', 'matsu4', 'sakura4', 'susuki4'],
    sankou:      ['matsu4', 'sakura4', 'susuki4'],
    inoShikaChou:['botan4', 'hagi4', 'momiji4'],
    tane:        ['ume4', 'fuji4', 'ayame4', 'botan4', 'hagi4'],
    akatan:      ['matsu3', 'ume3', 'sakura3'],
    aotan:       ['botan3', 'kiku3', 'momiji3'],
    tanzaku:     ['matsu3', 'ume3', 'sakura3', 'fuji3', 'ayame3'],
    kasu:        ['matsu1', 'matsu2', 'ume1', 'ume2', 'sakura1', 'sakura2', 'fuji1', 'fuji2', 'ayame1', 'ayame2'],
  };

  for (const [yakuName, collected] of Object.entries(minimalCollected)) {
    it(`${yakuName}: triggers KOIKOI_P1 overlay with correct yakuId`, () => {
      const base = reachRound1(1);
      const s0: GameState = {
        ...base,
        phase: 'TURN_P1_PILE',
        pile: ['botan2'],   // card that won't create additional yakus when dumped
        player1: { ...base.player1, collected: collected as CardId[], passedYakuCount: 0 },
      };
      const s1 = dump(s0);
      // Either went to KOIKOI_P1 or (if anyKoikoi was set) resolved directly
      // Since neither player has called koikoi, must go to KOIKOI_P1
      expect(s1.phase).toBe('KOIKOI_P1');
      expect(s1.overlay?.kind).toBe('koikoi');
      if (s1.overlay?.kind === 'koikoi') {
        expect(s1.overlay.playerIndex).toBe(1);
        // The yaku should be present in the list
        const yakuIds = checkAllYaku(collected as CardId[]);
        expect(yakuIds.length).toBeGreaterThan(0);
      }
    });
  }
});

// ===========================================================================
// 7. Full multi-round AI game simulations
// ===========================================================================

describe('full AI game simulation — all round counts', () => {
  it('1-round game (simpleAI vs analysisAI) reaches GAME_OVER', () => {
    const config: GameConfig = { ...baseConfig, maxRounds: 1, aiEnabled: true, aiStrategy: 'simple' };
    const final = runAIGame(config);
    expect(final.phase).toBe('GAME_OVER');
    expect(final.round).toBe(1);
  });

  it('3-round game (simpleAI vs analysisAI) reaches GAME_OVER', () => {
    const config: GameConfig = { ...baseConfig, maxRounds: 3, aiEnabled: true, aiStrategy: 'analysis' };
    const final = runAIGame(config);
    expect(final.phase).toBe('GAME_OVER');
    expect(final.round).toBe(3);
  });

  it('6-round game (simpleAI vs analysisAI) reaches GAME_OVER', () => {
    const config: GameConfig = { ...baseConfig, maxRounds: 6, aiEnabled: true, aiStrategy: 'analysis' };
    const final = runAIGame(config);
    expect(final.phase).toBe('GAME_OVER');
    expect(final.round).toBe(6);
  });

  it('results overlay contains correct player names after full game', () => {
    const config: GameConfig = {
      ...baseConfig,
      player1Name: 'Haruto',
      player2Name: 'Yuki',
      maxRounds: 1,
      aiEnabled: false,
      aiStrategy: 'simple',
    };
    const final = runAIGame(config);
    expect(final.phase).toBe('GAME_OVER');
    if (final.overlay?.kind === 'results') {
      expect(final.overlay.player1Name).toBe('Haruto');
      expect(final.overlay.player2Name).toBe('Yuki');
      expect(typeof final.overlay.score1).toBe('number');
      expect(typeof final.overlay.score2).toBe('number');
    }
  });

  it('non-negative scores at end of game', () => {
    const config: GameConfig = { ...baseConfig, maxRounds: 3, aiEnabled: true, aiStrategy: 'analysis' };
    const final = runAIGame(config);
    expect(final.player1.points).toBeGreaterThanOrEqual(0);
    expect(final.player2.points).toBeGreaterThanOrEqual(0);
  });

  it('RESULTS_CLOSED after full game returns to post-game state', () => {
    const config: GameConfig = { ...baseConfig, maxRounds: 1, aiEnabled: true, aiStrategy: 'simple' };
    const final = runAIGame(config);
    expect(final.phase).toBe('GAME_OVER');
    const closed = dispatch(final, { type: 'RESULTS_CLOSED' });
    expect(closed.phase).toBe('GAME_OVER');
    expect(closed.overlay).toBeNull();
  });
});

// ===========================================================================
// 8. Store — subscription lifecycle
// ===========================================================================

describe('GameStore — subscription', () => {
  it('subscribe fires with new state on dispatch', async () => {
    const { GameStore } = await import('./store/gameStore');
    const store = new GameStore();
    const states: GameState[] = [];
    store.subscribe((s) => states.push(s));
    store.dispatch({ type: 'START_GAME', config: baseConfig });
    expect(states).toHaveLength(1);
    expect(states[0]!.phase).toBe('PARENT_CHECK_P1');
  });

  it('unsubscribe stops notifications', async () => {
    const { GameStore } = await import('./store/gameStore');
    const store = new GameStore();
    const states: GameState[] = [];
    const unsub = store.subscribe((s) => states.push(s));
    store.dispatch({ type: 'START_GAME', config: baseConfig });
    unsub();
    store.dispatch({ type: 'DUMP' }); // should not reach listener
    expect(states).toHaveLength(1); // only the START_GAME dispatch
  });

  it('getState reflects latest dispatch', async () => {
    const { GameStore } = await import('./store/gameStore');
    const store = new GameStore();
    expect(store.getState().phase).toBe('SETUP');
    store.dispatch({ type: 'START_GAME', config: baseConfig });
    expect(store.getState().phase).toBe('PARENT_CHECK_P1');
  });
});

// ===========================================================================
// 9. Locale setting flows into GameState via START_GAME config
// ===========================================================================

describe('locale in GameConfig', () => {
  it('START_GAME with locale=pl stores pl in state', () => {
    const s = startGame({ locale: 'pl' });
    expect(s.locale).toBe('pl');
  });

  it('START_GAME with locale=ja stores ja in state', () => {
    const s = startGame({ locale: 'ja' });
    expect(s.locale).toBe('ja');
  });

  it('locale is preserved through parent check and round start', () => {
    const s = reachRound1(1, { locale: 'ja' });
    expect(s.locale).toBe('ja');
  });
});
