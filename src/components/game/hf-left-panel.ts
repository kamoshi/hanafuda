import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CardId } from '../../core/types';
import './hf-card';

// ---------------------------------------------------------------------------
// <hf-left-panel> — replaces LeftPanel.java.
//
// Shows (top→bottom):
//   - feedback message (top)
//   - pile card: face-down while in hand phase, face-up during pile phase,
//     or empty placeholder when the pile is exhausted
//   - feedback message (bottom)
// ---------------------------------------------------------------------------

@customElement('hf-left-panel')
export class HfLeftPanel extends LitElement {
  @property() feedbackTop = '';
  @property() feedbackBottom = '';
  /** Top card of the pile; null when the pile is empty. */
  @property({ attribute: false }) pileCard: CardId | null = null;
  /** True during TURN_*_PILE phases — shows the card face. */
  @property({ type: Boolean }) pileFaceup = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      box-sizing: border-box;
    }

    .feedback {
      font-size: 0.75rem;
      text-align: center;
      word-break: break-word;
      padding: 4px 0;
    }

    .pile-slot {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pile-empty {
      width: var(--hf-card-width, 60px);
      height: var(--hf-card-height, 90px);
      border: 2px dashed #aaa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #bbb;
      font-size: 0.7rem;
    }
  `;

  render() {
    const pile =
      this.pileCard !== null
        ? html`<hf-card
            .cardId=${this.pileCard}
            ?faceup=${this.pileFaceup}
          ></hf-card>`
        : html`<div class="pile-empty">—</div>`;

    return html`
      <div class="feedback">${this.feedbackTop}</div>
      <div class="pile-slot">${pile}</div>
      <div class="feedback">${this.feedbackBottom}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-left-panel': HfLeftPanel;
  }
}
