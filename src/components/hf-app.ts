import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { store } from '../store/gameStore';
import { setResRoot } from '../config';
import type { GameState } from '../core/types';
import './launcher/hf-launcher';
import './game/hf-game';
import './game/hf-toaster';

// ---------------------------------------------------------------------------
// <hf-app> — root component.
//
// Routes between the launcher (SETUP or post-game) and the game screen.
// No logic lives here — it just reads phase from the store and renders
// the appropriate child.
// ---------------------------------------------------------------------------

function showLauncher(gs: GameState): boolean {
  return gs.phase === 'SETUP' || (gs.phase === 'GAME_OVER' && gs.overlay === null);
}

@customElement('hf-app')
export class HfApp extends LitElement {
  @property({ attribute: 'res-root' }) resRoot = '/';
  @state() private gs: GameState = store.getState();
  private unsub?: () => void;

  connectedCallback() {
    super.connectedCallback();
    setResRoot(this.resRoot);
    this.unsub = store.subscribe((s) => {
      this.gs = s;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100%;

      --hf-card-width: 40px;
      --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);
      --hf-left-width: 80px;
      --hf-right-width: 140px;
    }

    @media (min-width: 768px) {
      :host {
        --hf-card-width: 52px;
        --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);
        --hf-left-width: 96px;
        --hf-right-width: 170px;
      }
    }

    @media (min-width: 1024px) {
      :host {
        --hf-card-width: 60px;
        --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);
        --hf-left-width: 110px;
        --hf-right-width: 200px;
      }
    }

    @media (min-width: 1280px) {
      :host {
        --hf-card-width: 70px;
        --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);
        --hf-left-width: 120px;
        --hf-right-width: 230px;
      }
    }

    @media (min-width: 1536px) {
      :host {
        --hf-card-width: 80px;
        --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);
        --hf-left-width: 130px;
        --hf-right-width: 260px;
      }
    }

    hf-launcher,
    hf-game {
      flex: 1;
    }
  `;

  render() {
    return html`
      ${showLauncher(this.gs)
        ? html`<hf-launcher></hf-launcher>`
        : html`<hf-game></hf-game>`}
      <hf-toaster></hf-toaster>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-app': HfApp;
  }
}
