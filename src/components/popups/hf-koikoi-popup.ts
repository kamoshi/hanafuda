import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import { t, LocaleController } from '../../i18n/i18n';
import type { TranslationKey } from '../../i18n/i18n';
import type { YakuId } from '../../core/types';

// ---------------------------------------------------------------------------
// <hf-koikoi-popup> — replaces KoikoiPopup.java.
//
// Shows when a player achieves yaku(s) and must decide whether to call
// koi-koi (keep playing for more points) or stop and take the round.
//
// Props:
//   playerName  — name of the player who scored
//   yakuIds     — list of yaku achieved this scoring event
//   score       — total points for this round so far
//   interactive — false when the AI is deciding (buttons shown but disabled)
// ---------------------------------------------------------------------------

// TranslationKey is only exported if i18n/i18n.ts re-exports it; pull from en.ts type.
// The yaku keys follow the pattern "koikoi_<yakuid.lowercase>".
function yakuLabel(id: YakuId): string {
  const key = `koikoi_${id.toLowerCase()}` as TranslationKey;
  return t(key);
}

@customElement('hf-koikoi-popup')
export class HfKoikoiPopup extends LitElement {
  private readonly _locale = new LocaleController(this);

  @property() playerName = '';
  @property({ attribute: false }) yakuIds: readonly YakuId[] = [];
  @property({ type: Number }) score = 0;
  @property({ type: Boolean }) interactive = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px 24px;
      background: #fff;
      border: 4px solid #888;
      border-radius: 8px;
      min-width: 320px;
      max-width: 420px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      box-sizing: border-box;
    }

    .question {
      font-size: 1.2rem;
      font-weight: bold;
      text-align: center;
    }

    .info {
      text-align: center;
      font-size: 0.95rem;
      color: #333;
    }

    .yaku-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    button {
      padding: 8px 24px;
      font-size: 1rem;
      border: 2px solid #888;
      border-radius: 4px;
      cursor: pointer;
      background: #f5f5f5;
    }

    button:hover:not(:disabled) {
      background: #e0e0e0;
    }

    button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .btn-yes {
      border-color: #4caf50;
      color: #2e7d32;
    }

    .btn-no {
      border-color: #e53935;
      color: #b71c1c;
    }
  `;

  private answer(accept: boolean) {
    store.dispatch({ type: 'KOIKOI_ANSWER', accept });
  }

  render() {
    const suffix = t('gameapp_points_suffix');
    return html`
      <p class="question">${t('koikoi_question')}</p>

      <div class="info">
        <strong>${this.playerName}</strong>
        <ul class="yaku-list">
          ${this.yakuIds.map((id) => html`<li>${yakuLabel(id)}</li>`)}
        </ul>
        ${this.score} ${suffix}
      </div>

      <div class="buttons">
        <button
          class="btn-yes"
          ?disabled=${!this.interactive}
          @click=${() => this.answer(true)}
        >${t('koikoi_yes')}</button>
        <button
          class="btn-no"
          ?disabled=${!this.interactive}
          @click=${() => this.answer(false)}
        >${t('koikoi_no')}</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-koikoi-popup': HfKoikoiPopup;
  }
}
