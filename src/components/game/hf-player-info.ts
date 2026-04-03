import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t, LocaleController } from '../../i18n/i18n';

// ---------------------------------------------------------------------------
// <hf-player-info> — replaces PlayerPanel.java.
// Shows player name and accumulated points.
// When `reverse` is true (player 2 panel) points appear above the name.
// ---------------------------------------------------------------------------

@customElement('hf-player-info')
export class HfPlayerInfo extends LitElement {
  private readonly _locale = new LocaleController(this);

  @property() name = '';
  @property({ type: Number }) points = 0;
  @property({ type: Boolean }) reverse = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 4px;
    }

    .name {
      font-weight: bold;
      font-size: 1rem;
    }

    .points {
      font-size: 0.85rem;
      color: #555;
    }
  `;

  render() {
    const nameEl = html`<span class="name">${this.name}</span>`;
    const pointsEl = html`<span class="points">${this.points} ${t('gameapp_points_suffix')}</span>`;
    return this.reverse
      ? html`${pointsEl}${nameEl}`
      : html`${nameEl}${pointsEl}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-player-info': HfPlayerInfo;
  }
}
