import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import { resRoot } from '../../config';
import type { CardId, CardSource } from '../../core/types';

// ---------------------------------------------------------------------------
// <hf-card> — replaces ActiveCard.java + PassiveCard.java + ICard.java.
//
// Props:
//   cardId      — which card (used for image filename and CARD_SELECTED dispatch)
//   faceup      — show card face; false → show back (default false)
//   interactive — clicking dispatches CARD_SELECTED (ActiveCard); false = PassiveCard
//   source      — zone dispatched with CARD_SELECTED ('p1hand' | 'p2hand' | 'table')
//   selected    — outline: card is the pending hand card awaiting a table match
//   highlighted — outline: card is a valid match target for the pending hand card
// ---------------------------------------------------------------------------

@customElement('hf-card')
export class HfCard extends LitElement {
  @property() cardId: CardId = 'matsu1';
  @property({ type: Boolean }) faceup = false;
  @property({ type: Boolean }) interactive = false;
  @property() source: CardSource = 'table';
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) highlighted = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      display: block;
      padding: 0;
      margin: 0;
      border: none;
      background: none;
      cursor: pointer;
      line-height: 0;
      transition: border-color 0.1s, box-shadow 0.1s;
    }

    button:disabled {
      cursor: default;
    }

    button.selected {
      border-color: #f5c518;
      box-shadow: 0 0 6px 2px #f5c518aa;
    }

    button.highlighted {
      border-color: #4caf50;
      box-shadow: 0 0 6px 2px #4caf5099;
    }

    img {
      display: block;
      width: var(--hf-card-width, 60px);
      height: var(--hf-card-height, 90px);
      object-fit: cover;
      border-radius: 2px;
      pointer-events: none;
    }
  `;

  private handleClick() {
    if (!this.interactive) return;
    store.dispatch({ type: 'CARD_SELECTED', cardId: this.cardId, source: this.source });
  }

  render() {
    const src = this.faceup
      ? `${resRoot()}cards/${this.cardId}.svg`
      : `${resRoot()}cards/cardback.svg`;

    const cls = this.selected ? 'selected' : this.highlighted ? 'highlighted' : '';

    return html`
      <button
        class=${cls}
        ?disabled=${!this.interactive}
        aria-label=${this.faceup ? this.cardId : 'card'}
        @click=${this.handleClick}
      >
        <img src=${src} alt=${this.faceup ? this.cardId : 'card back'} />
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-card': HfCard;
  }
}
