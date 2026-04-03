import { describe, it, expect } from 'vitest';
import { gameReducer } from '../core/reducer';
import { simpleAI } from './simpleAI';
import { analysisAI } from './analysisAI';
import type { GameState, GameAction, GameConfig } from '../core/types';
import { peekTop } from '../core/deck';
import { canMatch } from '../core/cards';

// ---------------------------------------------------------------------------
// AI Integration Tests
// Runs headless simulation loops to ensure the pure functions resolve correctly.
// ---------------------------------------------------------------------------

describe('AI vs AI Full Game Simulation', () => {
  it('runs a full round to completion using simpleAI vs analysisAI', () => {
    const config: GameConfig = {
      player1Name: 'AI 1',
      player2Name: 'AI 2',
      locale: 'en',
      maxRounds: 1,
      aiEnabled: true,
      aiStrategy: 'analysis',
    };

    let state: GameState = gameReducer(
      { phase: 'GAME_OVER' } as any, // Initial dummy state
      { type: 'START_GAME', config },
    );

    // A fail-safe to prevent infinite loops if logic is broken
    let iterations = 0;
    const MAX_ITERATIONS = 500;

    while (
      state.phase !== 'ROUND_OVER' &&
      state.phase !== 'GAME_OVER' &&
      iterations < MAX_ITERATIONS
    ) {
      iterations++;
      let action: GameAction | null = null;

      switch (state.phase) {
        case 'PARENT_CHECK_P1':
          action = {
            type: 'CARD_SELECTED',
            cardId: simpleAI.parentMove(state.table, null),
            source: 'table',
          };
          break;
        case 'PARENT_CHECK_P2':
          action = {
            type: 'CARD_SELECTED',
            cardId: analysisAI.parentMove(state.table, state.p1ParentCard),
            source: 'table',
          };
          break;
        case 'PARENT_CHECK_RESULT':
          action = { type: 'PARENT_CHECK_DELAY_ELAPSED' };
          break;
        case 'TURN_P1_HAND':
          if (state.pendingHandCard === null) {
            action = {
              type: 'CARD_SELECTED',
              cardId: simpleAI.handMove(state.player1.hand, state.table),
              source: 'p1hand',
            };
          } else {
            if (!canMatch(state.pendingHandCard, state.table)) {
              action = { type: 'DUMP' };
            } else {
              action = {
                type: 'CARD_SELECTED',
                cardId: simpleAI.matchTableCard(state.pendingHandCard, state.table),
                source: 'table',
              };
            }
          }
          break;
        case 'TURN_P1_PILE': {
          const pileTop1 = peekTop(state.pile);
          if (pileTop1 !== null) {
            const cardId = simpleAI.pileResponse(pileTop1, state.table);
            action =
              cardId === null
                ? { type: 'DUMP' }
                : { type: 'CARD_SELECTED', cardId, source: 'table' };
          }
          break;
        }
        case 'TURN_P2_HAND':
          if (state.pendingHandCard === null) {
            action = {
              type: 'CARD_SELECTED',
              cardId: analysisAI.handMove(state.player2.hand, state.table),
              source: 'p2hand',
            };
          } else {
            if (!canMatch(state.pendingHandCard, state.table)) {
              action = { type: 'DUMP' };
            } else {
              action = {
                type: 'CARD_SELECTED',
                cardId: analysisAI.matchTableCard(state.pendingHandCard, state.table),
                source: 'table',
              };
            }
          }
          break;
        case 'TURN_P2_PILE': {
          const pileTop2 = peekTop(state.pile);
          if (pileTop2 !== null) {
            const cardId = analysisAI.pileResponse(pileTop2, state.table);
            action =
              cardId === null
                ? { type: 'DUMP' }
                : { type: 'CARD_SELECTED', cardId, source: 'table' };
          }
          break;
        }
        case 'KOIKOI_P1':
          action = {
            type: 'KOIKOI_ANSWER',
            accept: simpleAI.koikoiMove(state.player1.hand, state.table),
          };
          break;
        case 'KOIKOI_P2':
          action = {
            type: 'KOIKOI_ANSWER',
            accept: analysisAI.koikoiMove(state.player2.hand, state.table),
          };
          break;
      }

      if (action) {
        state = gameReducer(state, action);
      } else {
        // Should never reach here unless phase is unhandled
        break;
      }
    }

    expect(iterations).toBeLessThan(MAX_ITERATIONS);
    expect(['ROUND_OVER', 'GAME_OVER']).toContain(state.phase);
  });
});
