import { buildDeck, dealParentCheck, dealRound, peekTop, shuffle } from './deck';
import { compareCards, sameMonth } from './cards';
import { calculateTotalScore, checkAllYaku } from './yaku';
import { INITIAL_STATE } from './initialState';
import type { GameAction, GameConfig, GameState, OverlayState, PlayerState } from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getPlayer(state: GameState, p: 1 | 2): PlayerState {
  return p === 1 ? state.player1 : state.player2;
}

function setPlayer(state: GameState, p: 1 | 2, plr: PlayerState): GameState {
  return p === 1 ? { ...state, player1: plr } : { ...state, player2: plr };
}

/** Reset per-round player fields; preserve name and accumulated points. */
function freshPlayer(p: PlayerState): PlayerState {
  return {
    ...p,
    hand: [],
    collected: [],
    calledKoikoi: false,
    passedYakuCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Round resolution
// ---------------------------------------------------------------------------

function resolveGameOver(state: GameState): GameState {
  return {
    ...state,
    phase: 'GAME_OVER',
    overlay: {
      kind: 'results',
      player1Name: state.player1.name,
      player2Name: state.player2.name,
      score1: state.player1.points,
      score2: state.player2.points,
    } satisfies OverlayState,
  };
}

function resolveWin(state: GameState, winner: 1 | 2): GameState {
  const winnerState = getPlayer(state, winner);
  const score = calculateTotalScore(winnerState.collected);
  const stateWithPoints = setPlayer({ ...state, currentRoundStarter: winner }, winner, {
    ...winnerState,
    points: winnerState.points + score,
  });
  if (stateWithPoints.round >= stateWithPoints.maxRounds) {
    return resolveGameOver(stateWithPoints);
  }
  return { ...stateWithPoints, phase: 'ROUND_OVER', overlay: null };
}

/** Called when hands are empty; determines whether someone wins or it's a draw. */
function resolveRoundEnd(state: GameState): GameState {
  if (state.player1.calledKoikoi) return resolveWin(state, 1);
  if (state.player2.calledKoikoi) return resolveWin(state, 2);
  // Draw — no points awarded; same player starts the next round
  if (state.round >= state.maxRounds) {
    return resolveGameOver(state);
  }
  return { ...state, phase: 'ROUND_OVER', overlay: null };
}

/** Transition to the next player's hand phase, or end the round if hands empty. */
function startNextPlayerTurn(state: GameState, next: 1 | 2): GameState {
  const nextPlr = getPlayer(state, next);
  if (nextPlr.hand.length === 0) {
    return resolveRoundEnd(state);
  }
  return {
    ...state,
    phase: next === 1 ? 'TURN_P1_HAND' : 'TURN_P2_HAND',
    pendingHandCard: null,
    overlay: null,
  };
}

/**
 * Called after a pile action (match or dump) completes.
 * Checks for newly satisfied yakus and either:
 *  – shows the koi-koi overlay (first new yaku set this round),
 *  – resolves an immediate win (koi-koi was already called by anyone), or
 *  – starts the next player's turn.
 */
function afterPileAction(state: GameState, player: 1 | 2): GameState {
  const plrState = getPlayer(state, player);
  const yakuIds = checkAllYaku(plrState.collected);
  const anyKoikoi = state.player1.calledKoikoi || state.player2.calledKoikoi;

  if (yakuIds.length > plrState.passedYakuCount) {
    if (anyKoikoi) {
      return resolveWin(state, player);
    }
    const score = calculateTotalScore(plrState.collected);
    const stateWithCount = setPlayer(state, player, {
      ...plrState,
      passedYakuCount: yakuIds.length,
    });
    return {
      ...stateWithCount,
      phase: player === 1 ? 'KOIKOI_P1' : 'KOIKOI_P2',
      overlay: {
        kind: 'koikoi',
        playerIndex: player,
        yakuIds,
        score,
        // Buttons are non-interactive when the AI owns this decision
        interactive: !(state.aiEnabled && player === 2),
      } satisfies OverlayState,
    };
  }

  return startNextPlayerTurn(state, player === 1 ? 2 : 1);
}

// ---------------------------------------------------------------------------
// Deal helpers
// ---------------------------------------------------------------------------

function buildParentCheckState(config: GameConfig): GameState {
  const shuffled = shuffle(buildDeck());
  const { pile, table } = dealParentCheck(shuffled);
  const p1Name = config.player1Name.trim() || 'Player 1';
  const p2Name = config.aiEnabled ? 'AI' : config.player2Name.trim() || 'Player 2';
  return {
    ...INITIAL_STATE,
    phase: 'PARENT_CHECK_P1',
    maxRounds: config.maxRounds,
    locale: config.locale,
    aiEnabled: config.aiEnabled,
    aiStrategy: config.aiStrategy,
    player1: { ...INITIAL_STATE.player1, name: p1Name },
    player2: { ...INITIAL_STATE.player2, name: p2Name },
    pile,
    table,
  };
}

function dealNextRound(state: GameState, starter: 1 | 2): GameState {
  const shuffled = shuffle(buildDeck());
  const dealt = dealRound(shuffled);
  return {
    ...state,
    round: state.round + 1,
    currentRoundStarter: starter,
    player1: { ...freshPlayer(state.player1), hand: dealt.p1Hand },
    player2: { ...freshPlayer(state.player2), hand: dealt.p2Hand },
    table: dealt.table,
    pile: dealt.pile,
    pendingHandCard: null,
    p1ParentCard: null,
    p2ParentCard: null,
    overlay: null,
    phase: starter === 1 ? 'TURN_P1_HAND' : 'TURN_P2_HAND',
  };
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handleStartGame(action: Extract<GameAction, { type: 'START_GAME' }>): GameState {
  return buildParentCheckState(action.config);
}

function handleParentCheckDelayElapsed(state: GameState): GameState {
  if (state.phase !== 'PARENT_CHECK_RESULT') return state;
  return dealNextRound(state, state.currentRoundStarter ?? 1);
}

function handleNewRoundStart(state: GameState): GameState {
  if (state.phase !== 'ROUND_OVER') return state;
  return dealNextRound(state, state.currentRoundStarter ?? 1);
}

function handleResultsClosed(state: GameState): GameState {
  if (state.phase !== 'GAME_OVER') return state;
  return { ...state, overlay: null };
}

function handleCardSelected(
  state: GameState,
  action: Extract<GameAction, { type: 'CARD_SELECTED' }>,
): GameState {
  const { cardId, source } = action;

  switch (state.phase) {
    // ── Parent check ────────────────────────────────────────────────────────
    case 'PARENT_CHECK_P1': {
      if (source !== 'table') return state;
      return { ...state, phase: 'PARENT_CHECK_P2', p1ParentCard: cardId };
    }

    case 'PARENT_CHECK_P2': {
      if (source !== 'table') return state;
      if (cardId === state.p1ParentCard) return state; // same card, ignore
      const p1Card = state.p1ParentCard!;
      // compareCards(a, b) → true if a is the "better" card (earlier month wins)
      const starter: 1 | 2 = compareCards(p1Card, cardId) ? 1 : 2;
      return {
        ...state,
        phase: 'PARENT_CHECK_RESULT',
        p2ParentCard: cardId,
        currentRoundStarter: starter,
      };
    }

    // ── Player 1 hand phase ─────────────────────────────────────────────────
    case 'TURN_P1_HAND': {
      if (source === 'p1hand') {
        // Deselect if same card clicked again, otherwise select / re-select
        return { ...state, pendingHandCard: cardId === state.pendingHandCard ? null : cardId };
      }
      if (source === 'table' && state.pendingHandCard !== null) {
        if (!sameMonth(state.pendingHandCard, cardId)) return state;
        const pending = state.pendingHandCard;
        return {
          ...state,
          phase: 'TURN_P1_PILE',
          pendingHandCard: null,
          player1: {
            ...state.player1,
            hand: state.player1.hand.filter((id) => id !== pending),
            collected: [...state.player1.collected, pending, cardId],
          },
          table: state.table.filter((id) => id !== cardId),
        };
      }
      return state;
    }

    // ── Player 1 pile phase ─────────────────────────────────────────────────
    case 'TURN_P1_PILE': {
      if (source !== 'table') return state;
      const pileTop = peekTop(state.pile);
      if (pileTop === null || !sameMonth(pileTop, cardId)) return state;
      return afterPileAction(
        {
          ...state,
          player1: {
            ...state.player1,
            collected: [...state.player1.collected, pileTop, cardId],
          },
          table: state.table.filter((id) => id !== cardId),
          pile: state.pile.slice(0, -1),
        },
        1,
      );
    }

    // ── Player 2 hand phase ─────────────────────────────────────────────────
    case 'TURN_P2_HAND': {
      if (source === 'p2hand') {
        return { ...state, pendingHandCard: cardId === state.pendingHandCard ? null : cardId };
      }
      if (source === 'table' && state.pendingHandCard !== null) {
        if (!sameMonth(state.pendingHandCard, cardId)) return state;
        const pending = state.pendingHandCard;
        return {
          ...state,
          phase: 'TURN_P2_PILE',
          pendingHandCard: null,
          player2: {
            ...state.player2,
            hand: state.player2.hand.filter((id) => id !== pending),
            collected: [...state.player2.collected, pending, cardId],
          },
          table: state.table.filter((id) => id !== cardId),
        };
      }
      return state;
    }

    // ── Player 2 pile phase ─────────────────────────────────────────────────
    case 'TURN_P2_PILE': {
      if (source !== 'table') return state;
      const pileTop = peekTop(state.pile);
      if (pileTop === null || !sameMonth(pileTop, cardId)) return state;
      return afterPileAction(
        {
          ...state,
          player2: {
            ...state.player2,
            collected: [...state.player2.collected, pileTop, cardId],
          },
          table: state.table.filter((id) => id !== cardId),
          pile: state.pile.slice(0, -1),
        },
        2,
      );
    }

    default:
      return state;
  }
}

function handleDump(state: GameState): GameState {
  switch (state.phase) {
    case 'TURN_P1_HAND': {
      const pending = state.pendingHandCard;
      if (pending === null) return state;
      return {
        ...state,
        phase: 'TURN_P1_PILE',
        pendingHandCard: null,
        player1: {
          ...state.player1,
          hand: state.player1.hand.filter((id) => id !== pending),
        },
        table: [...state.table, pending],
      };
    }
    case 'TURN_P1_PILE': {
      const pileTop = peekTop(state.pile);
      if (pileTop === null) return state;
      return afterPileAction(
        {
          ...state,
          table: [...state.table, pileTop],
          pile: state.pile.slice(0, -1),
        },
        1,
      );
    }
    case 'TURN_P2_HAND': {
      const pending = state.pendingHandCard;
      if (pending === null) return state;
      return {
        ...state,
        phase: 'TURN_P2_PILE',
        pendingHandCard: null,
        player2: {
          ...state.player2,
          hand: state.player2.hand.filter((id) => id !== pending),
        },
        table: [...state.table, pending],
      };
    }
    case 'TURN_P2_PILE': {
      const pileTop = peekTop(state.pile);
      if (pileTop === null) return state;
      return afterPileAction(
        {
          ...state,
          table: [...state.table, pileTop],
          pile: state.pile.slice(0, -1),
        },
        2,
      );
    }
    default:
      return state;
  }
}

function handleKoikoiAnswer(
  state: GameState,
  action: Extract<GameAction, { type: 'KOIKOI_ANSWER' }>,
): GameState {
  const { accept } = action;

  if (state.phase === 'KOIKOI_P1') {
    if (!accept) return resolveWin(state, 1); // refused → P1 claims their points now
    return startNextPlayerTurn(
      { ...state, player1: { ...state.player1, calledKoikoi: true }, overlay: null },
      2,
    );
  }

  if (state.phase === 'KOIKOI_P2') {
    if (!accept) return resolveWin(state, 2);
    return startNextPlayerTurn(
      { ...state, player2: { ...state.player2, calledKoikoi: true }, overlay: null },
      1,
    );
  }

  return state;
}

// ---------------------------------------------------------------------------
// Root reducer
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return handleStartGame(action);
    case 'CARD_SELECTED':
      return handleCardSelected(state, action);
    case 'DUMP':
      return handleDump(state);
    case 'KOIKOI_ANSWER':
      return handleKoikoiAnswer(state, action);
    case 'PARENT_CHECK_DELAY_ELAPSED':
      return handleParentCheckDelayElapsed(state);
    case 'NEW_ROUND_START':
      return handleNewRoundStart(state);
    case 'RESULTS_CLOSED':
      return handleResultsClosed(state);
  }
}
