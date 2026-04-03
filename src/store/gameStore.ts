import { gameReducer } from '../core/reducer';
import { INITIAL_STATE } from '../core/initialState';
import type { GameAction, GameState } from '../core/types';

// ---------------------------------------------------------------------------
// Minimal observable store — wraps the pure reducer with subscriptions and
// automatic timer-driven actions for phase transitions that need a delay.
// ---------------------------------------------------------------------------

type Listener = (state: GameState) => void;

/**
 * Injectable scheduler for testing: pass `(fn, ms) => fn()` to make all
 * auto-actions synchronous.
 */
export type Scheduler = (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;

export class GameStore {
  private state: GameState = INITIAL_STATE;
  private readonly listeners = new Set<Listener>();
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private readonly schedule: Scheduler;

  constructor(schedule: Scheduler = (fn, ms) => setTimeout(fn, ms)) {
    this.schedule = schedule;
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(action: GameAction): void {
    // Cancel any pending auto-action; the new state may change what's needed.
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.state = gameReducer(this.state, action);
    for (const l of this.listeners) l(this.state);
    this.scheduleAuto();
  }

  /**
   * Schedules automatic follow-up actions for phases that advance on a timer
   * rather than waiting for explicit user input.
   *
   * PARENT_CHECK_RESULT  – both parent cards are visible; wait 1.5 s then deal.
   * ROUND_OVER           – round summary is shown; wait 2 s then deal next round.
   */
  private scheduleAuto(): void {
    const { phase } = this.state;
    if (phase === 'PARENT_CHECK_RESULT') {
      this.timerId = this.schedule(() => {
        this.timerId = null;
        this.dispatch({ type: 'PARENT_CHECK_DELAY_ELAPSED' });
      }, 1500);
    } else if (phase === 'ROUND_OVER') {
      this.timerId = this.schedule(() => {
        this.timerId = null;
        this.dispatch({ type: 'NEW_ROUND_START' });
      }, 2000);
    }
  }
}

/** Singleton store instance used by the application. */
export const store = new GameStore();
