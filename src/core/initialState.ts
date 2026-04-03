import type { GameState, PlayerState } from './types';

// ---------------------------------------------------------------------------
// Initial / blank state
// Used as the starting point before START_GAME is dispatched.
// ---------------------------------------------------------------------------

const emptyPlayer = (name: string): PlayerState => ({
  name,
  hand: [],
  collected: [],
  points: 0,
  calledKoikoi: false,
  passedYakuCount: 0,
});

export const INITIAL_STATE: GameState = {
  phase: 'SETUP',
  round: 0,
  maxRounds: 3,
  currentRoundStarter: null,
  player1: emptyPlayer('Player 1'),
  player2: emptyPlayer('Player 2'),
  table: [],
  pile: [],
  pendingHandCard: null,
  p1ParentCard: null,
  p2ParentCard: null,
  locale: 'en',
  aiEnabled: false,
  aiStrategy: 'simple',
  feedback: ['', ''],
  overlay: null,
};
