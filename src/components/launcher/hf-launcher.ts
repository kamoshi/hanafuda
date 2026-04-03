import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import { t, setLocale, getLocale, LocaleController } from '../../i18n/i18n';
import { resRoot } from '../../config';
import type { Locale, AIStrategyId, RoundCount } from '../../core/types';

// ---------------------------------------------------------------------------
// <hf-launcher> — replaces Launcher.java.
//
// Config form: player names, card set, AI toggle + strategy, rounds, locale.
// Dispatches START_GAME when the player clicks Play.
//
// Resolution is intentionally omitted — replaced by CSS custom properties.
// ---------------------------------------------------------------------------

@customElement('hf-launcher')
export class HfLauncher extends LitElement {
  private readonly _locale = new LocaleController(this);

  @state() private _p1name = '';
  @state() private _p2name = '';
  @state() private _aiEnabled = false;
  @state() private _aiStrategy: AIStrategyId = 'simple';
  @state() private _rounds: RoundCount = 3;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 24px;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 28px 32px;
      background: #fff;
      border: 3px solid #aaa;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 340px;
      box-sizing: border-box;
    }

    .logo {
      display: flex;
      justify-content: center;
    }

    .logo img {
      width: 80px;
      height: auto;
    }

    .field {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .field label {
      min-width: 100px;
      font-size: 0.9rem;
    }

    .field input[type='text'],
    .field select {
      flex: 1;
      max-width: 140px;
      font-size: 0.9rem;
      padding: 3px 6px;
      border: 1px solid #bbb;
      border-radius: 3px;
    }

    .field input[type='text']:disabled {
      background: #f0f0f0;
      color: #999;
    }

    .ai-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .ai-row label {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      min-width: 100px;
    }

    .ai-row select {
      max-width: 140px;
      font-size: 0.9rem;
      padding: 3px 6px;
      border: 1px solid #bbb;
      border-radius: 3px;
    }

    .rounds-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rounds-row span {
      min-width: 100px;
      font-size: 0.9rem;
    }

    .rounds-group {
      display: flex;
      gap: 8px;
    }

    .rounds-group label {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 0.9rem;
      cursor: pointer;
    }

    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 0;
    }

    .play-btn {
      align-self: stretch;
      padding: 10px;
      font-size: 1.1rem;
      font-weight: bold;
      letter-spacing: 0.05em;
      border: 2px solid #555;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
    }

    .play-btn:hover {
      background: #e0e0e0;
    }
  `;

  private _onLocaleChange(e: Event) {
    const locale = (e.target as HTMLSelectElement).value as Locale;
    setLocale(locale);
  }

  private _onAIToggle(e: Event) {
    this._aiEnabled = (e.target as HTMLInputElement).checked;
  }

  private _onRoundChange(e: Event) {
    this._rounds = Number((e.target as HTMLInputElement).value) as RoundCount;
  }

  private _play() {
    const p1 = this._p1name.trim() || 'Player 1';
    const p2 = this._aiEnabled
      ? this._aiStrategy === 'simple'
        ? 'SimpleAI'
        : 'AnalysisAI'
      : this._p2name.trim() || 'Player 2';

    store.dispatch({
      type: 'START_GAME',
      config: {
        player1Name: p1,
        player2Name: p2,
        locale: getLocale(),
        maxRounds: this._rounds,
        aiEnabled: this._aiEnabled,
        aiStrategy: this._aiStrategy,
      },
    });
  }

  render() {
    const currentLocale = getLocale();

    return html`
      <div class="card">
        <div class="logo">
          <img src=${`${resRoot()}cards/susuki4.svg`} alt="Hanafuda Koi-Koi" />
        </div>

        <!-- Player 1 -->
        <div class="field">
          <label for="p1name">${t('launcher_player1_label')}</label>
          <input
            id="p1name"
            type="text"
            .value=${this._p1name}
            @input=${(e: Event) => { this._p1name = (e.target as HTMLInputElement).value; }}
          />
        </div>

        <!-- Player 2 -->
        <div class="field">
          <label for="p2name">${t('launcher_player2_label')}</label>
          <input
            id="p2name"
            type="text"
            .value=${this._p2name}
            ?disabled=${this._aiEnabled}
            @input=${(e: Event) => { this._p2name = (e.target as HTMLInputElement).value; }}
          />
        </div>

        <!-- AI toggle + strategy -->
        <div class="ai-row">
          <label>
            <input
              type="checkbox"
              .checked=${this._aiEnabled}
              @change=${this._onAIToggle}
            />
            ${t('launcher_enableai_label')}
          </label>
          <select
            .value=${this._aiStrategy}
            ?disabled=${!this._aiEnabled}
            @change=${(e: Event) => { this._aiStrategy = (e.target as HTMLSelectElement).value as AIStrategyId; }}
          >
            <option value="simple">SimpleAI</option>
            <option value="analysis">AnalysisAI</option>
          </select>
        </div>

        <!-- Rounds -->
        <div class="rounds-row">
          <span>${t('launcher_rounds_label')}</span>
          <div class="rounds-group">
            ${([1, 3, 6] as RoundCount[]).map((n) => html`
              <label>
                <input
                  type="radio"
                  name="rounds"
                  value=${n}
                  .checked=${this._rounds === n}
                  @change=${this._onRoundChange}
                />
                ${n}
              </label>
            `)}
          </div>
        </div>

        <hr />

        <!-- Language -->
        <div class="field">
          <label for="lang">${t('launcher_language_label')}</label>
          <select id="lang" .value=${currentLocale} @change=${this._onLocaleChange}>
            <option value="en">English</option>
            <option value="pl">Polski</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <!-- Play -->
        <button class="play-btn" @click=${this._play}>
          ${t('launcher_play_button')}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-launcher': HfLauncher;
  }
}
