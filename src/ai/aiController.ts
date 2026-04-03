import { store } from '../store/gameStore';
import { simpleAI } from './simpleAI';
import { analysisAI } from './analysisAI';
import type { AIStrategy } from './types';
import { peekTop } from '../core/deck';
import { canMatch } from '../core/cards';
import type { GameState } from '../core/types';

// ---------------------------------------------------------------------------
// AI Controller
// Subscribes to the game store and schedules AI actions during AI turns.
// ---------------------------------------------------------------------------

const strategies: Record<string, AIStrategy> = {
  simple: simpleAI,
  analysis: analysisAI,
};

let timerId: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;

function handleStateChange(state: GameState) {
  if (!state.aiEnabled) return;

  // Cancel pending actions because state has changed
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }

  const strategy = strategies[state.aiStrategy];
  if (!strategy) return;

  const { phase } = state;

  if (phase === 'PARENT_CHECK_P2') {
    timerId = setTimeout(() => {
      timerId = null;
      const cardId = strategy.parentMove(state.table, state.p1ParentCard);
      store.dispatch({ type: 'CARD_SELECTED', cardId, source: 'table' });
    }, 1000);
  } else if (phase === 'TURN_P2_HAND') {
    timerId = setTimeout(() => {
      timerId = null;
      if (state.pendingHandCard === null) {
        const cardId = strategy.handMove(state.player2.hand, state.table);
        store.dispatch({ type: 'CARD_SELECTED', cardId, source: 'p2hand' });
      } else {
        if (!canMatch(state.pendingHandCard, state.table)) {
          store.dispatch({ type: 'DUMP' });
        } else {
          const cardId = strategy.matchTableCard(state.pendingHandCard, state.table);
          store.dispatch({ type: 'CARD_SELECTED', cardId, source: 'table' });
        }
      }
    }, 800);
  } else if (phase === 'TURN_P2_PILE') {
    timerId = setTimeout(() => {
      timerId = null;
      const pileTop = peekTop(state.pile);
      if (pileTop === null) return;

      const cardId = strategy.pileResponse(pileTop, state.table);
      if (cardId === null) {
        store.dispatch({ type: 'DUMP' });
      } else {
        store.dispatch({ type: 'CARD_SELECTED', cardId, source: 'table' });
      }
    }, 800);
  } else if (phase === 'KOIKOI_P2') {
    timerId = setTimeout(() => {
      timerId = null;
      const accept = strategy.koikoiMove(state.player2.hand, state.table);
      store.dispatch({ type: 'KOIKOI_ANSWER', accept });
    }, 1500);
  }
}

export function startAIController() {
  if (unsubscribe) return;
  unsubscribe = store.subscribe(handleStateChange);
}

export function stopAIController() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}
