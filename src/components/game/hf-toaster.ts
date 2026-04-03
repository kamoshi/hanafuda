import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import type { GamePhase, GameState } from '../../core/types';

// ---------------------------------------------------------------------------
// <hf-toaster> — stacking toast notifications anchored top-left.
//
// Self-contained: subscribes to the store, derives messages from phase
// transitions, and manages its own dismiss timers.
// ---------------------------------------------------------------------------

interface Toast {
  id: number;
  message: string;
}

let nextId = 0;

@customElement('hf-toaster')
export class HfToaster extends LitElement {
  @state() private toasts: Toast[] = [];
  private unsub?: () => void;
  private prevPhase: GamePhase | null = null;

  static styles = css`
    :host {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .toast {
      background: rgba(30, 30, 30, 0.82);
      color: #fff;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      animation: slide-in 0.18s ease-out;
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.prevPhase = store.getState().phase;
    this.unsub = store.subscribe((s) => this.onStateChange(s));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  private onStateChange(s: GameState) {
    const phase = s.phase;
    if (phase === this.prevPhase) return;
    const prev = this.prevPhase;
    this.prevPhase = phase;

    const msg = this.messageFor(s, prev, phase);
    if (msg) this.push(msg);
  }

  private messageFor(s: GameState, prev: GamePhase | null, phase: GamePhase): string | null {
    switch (phase) {
      case 'PARENT_CHECK_P1':
        return 'Pick a card to decide who goes first';

      case 'PARENT_CHECK_RESULT': {
        const name = s.currentRoundStarter === 1 ? s.player1.name : s.player2.name;
        return `${name} goes first!`;
      }

      case 'TURN_P1_HAND':
      case 'TURN_P2_HAND':
        if (prev === 'PARENT_CHECK_RESULT' || prev === 'ROUND_OVER') {
          const starter = phase === 'TURN_P1_HAND' ? s.player1.name : s.player2.name;
          return `Round ${s.round} — ${starter} starts`;
        }
        return null;

      case 'KOIKOI_P1':
        return `${s.player1.name} completed a yaku!`;

      case 'KOIKOI_P2':
        return `${s.player2.name} completed a yaku!`;

      case 'ROUND_OVER':
        // Refusal: player said no to koikoi and collects immediately
        if (prev === 'KOIKOI_P1') return `${s.player1.name} wins the round!`;
        if (prev === 'KOIKOI_P2') return `${s.player2.name} wins the round!`;
        // Hands emptied after koikoi was called
        if (s.player1.calledKoikoi) return `${s.player1.name} wins the round!`;
        if (s.player2.calledKoikoi) return `${s.player2.name} wins the round!`;
        // Neither player called koikoi — genuine draw
        return "Round over — it's a draw";

      case 'GAME_OVER':
        return 'Game over!';

      default:
        return null;
    }
  }

  private push(message: string) {
    const id = nextId++;
    this.toasts = [...this.toasts, { id, message }];
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 2000);
  }

  render() {
    return html`
      ${this.toasts.map((t) => html`<div class="toast">${t.message}</div>`)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-toaster': HfToaster;
  }
}
