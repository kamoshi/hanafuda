import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import { t, LocaleController } from '../../i18n/i18n';

// ---------------------------------------------------------------------------
// <hf-results-popup> — replaces ResultsPopup.java.
//
// Shown at game over with both players' final scores and the winner/tie
// verdict. "End Game" dispatches RESULTS_CLOSED so hf-app can route back
// to the launcher.
//
// Props mirror the 'results' overlay state slice (passed by hf-game).
// ---------------------------------------------------------------------------

/** Truncate names longer than 10 chars, matching Java's ResultsPopup. */
function truncate(name: string): string {
  return name.length > 10 ? name.substring(0, 10) + '…' : name;
}

@customElement('hf-results-popup')
export class HfResultsPopup extends LitElement {
  private readonly _locale = new LocaleController(this);

  @property() player1Name = '';
  @property() player2Name = '';
  @property({ type: Number }) score1 = 0;
  @property({ type: Number }) score2 = 0;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px 28px;
      background: #fff;
      border: 4px solid #888;
      border-radius: 8px;
      min-width: 360px;
      max-width: 460px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      box-sizing: border-box;
    }

    .title {
      font-size: 1.6rem;
      font-weight: bold;
      text-align: center;
    }

    .scores {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
    }

    .player {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .player-name {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .player-score {
      font-size: 1rem;
      color: #555;
    }

    .divider {
      width: 1px;
      align-self: stretch;
      background: #ccc;
    }

    .footer {
      display: flex;
      justify-content: center;
    }

    button {
      padding: 8px 28px;
      font-size: 1rem;
      border: 2px solid #888;
      border-radius: 4px;
      cursor: pointer;
      background: #f5f5f5;
    }

    button:hover {
      background: #e0e0e0;
    }
  `;

  private close() {
    store.dispatch({ type: 'RESULTS_CLOSED' });
  }

  render() {
    const p1 = truncate(this.player1Name);
    const p2 = truncate(this.player2Name);
    const suffix = t('gameapp_points_suffix');

    const title =
      this.score1 > this.score2
        ? `${p1} ${t('results_label_win')}`
        : this.score1 < this.score2
          ? `${p2} ${t('results_label_win')}`
          : t('results_label_tie');

    return html`
      <div class="title">${title}</div>

      <div class="scores">
        <div class="player">
          <span class="player-name">${p1}</span>
          <span class="player-score">${this.score1} ${suffix}</span>
        </div>
        <div class="divider"></div>
        <div class="player">
          <span class="player-name">${p2}</span>
          <span class="player-score">${this.score2} ${suffix}</span>
        </div>
      </div>

      <div class="footer">
        <button @click=${this.close}>${t('results_finish')}</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-results-popup': HfResultsPopup;
  }
}
