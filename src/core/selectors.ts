import { canMatch, matchingCards as matchingCardsFn } from './cards';
import { peekTop } from './deck';
import { checkAllYaku, calculateTotalScore } from './yaku';
import type { CardId, GameState, YakuId } from './types';

// ---------------------------------------------------------------------------
// Pure selectors — derived state, no side effects
// ---------------------------------------------------------------------------

export const isP1Turn = (state: GameState): boolean =>
  state.phase === 'TURN_P1_HAND' || state.phase === 'TURN_P1_PILE' || state.phase === 'KOIKOI_P1';

export const isP2Turn = (state: GameState): boolean =>
  state.phase === 'TURN_P2_HAND' || state.phase === 'TURN_P2_PILE' || state.phase === 'KOIKOI_P2';

/** The index of the player whose action is currently expected (null if neither). */
export const activePlayer = (state: GameState): 1 | 2 | null => {
  if (isP1Turn(state)) return 1;
  if (isP2Turn(state)) return 2;
  return null;
};

/** Top card of the pile (face-up during pile phases), or null if pile is empty. */
export const topOfPile = (state: GameState): CardId | null => peekTop(state.pile);

/**
 * True when the dump action is currently valid.
 * Hand phase: a card has been selected but it cannot match any table card.
 * Pile phase: the top-of-pile card cannot match any table card.
 */
export const canDump = (state: GameState): boolean => {
  switch (state.phase) {
    case 'TURN_P1_HAND':
    case 'TURN_P2_HAND':
      return state.pendingHandCard !== null && !canMatch(state.pendingHandCard, state.table);
    case 'TURN_P1_PILE':
    case 'TURN_P2_PILE': {
      const top = peekTop(state.pile);
      return top !== null && !canMatch(top, state.table);
    }
    default:
      return false;
  }
};

/** True when it is the AI's turn to act. */
export const isAITurn = (state: GameState): boolean =>
  state.aiEnabled &&
  (state.phase === 'TURN_P2_HAND' ||
    state.phase === 'TURN_P2_PILE' ||
    state.phase === 'PARENT_CHECK_P2');

/** True once either player has called koi-koi this round. */
export const koikoiCalledByAnyone = (state: GameState): boolean =>
  state.player1.calledKoikoi || state.player2.calledKoikoi;

export const player1Yakus = (state: GameState): readonly YakuId[] =>
  checkAllYaku(state.player1.collected);

export const player2Yakus = (state: GameState): readonly YakuId[] =>
  checkAllYaku(state.player2.collected);

export const player1Score = (state: GameState): number =>
  calculateTotalScore(state.player1.collected);

export const player2Score = (state: GameState): number =>
  calculateTotalScore(state.player2.collected);

/**
 * Table cards that match the currently selected hand card.
 * Returns empty array when no hand card is pending.
 */
export const matchingTableCards = (state: GameState): readonly CardId[] => {
  if (state.pendingHandCard === null) return [];
  return matchingCardsFn(state.pendingHandCard, state.table);
};
