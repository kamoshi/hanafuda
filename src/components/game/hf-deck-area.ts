import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { CardId, CardSource } from '../../core/types';
import './hf-card';

// ---------------------------------------------------------------------------
// <hf-deck-area> — replaces DeckPanel.java.
// Renders a player's hand as a row of <hf-card> elements.
//
// Props:
//   cards        — the hand to display
//   faceup       — false for P2's hidden hand, true for P1's visible hand
//   interactive  — true when it is this player's turn to select a hand card
//   source       — card zone identifier sent with CARD_SELECTED ('p1hand'|'p2hand')
//   selectedCard — the pending hand card (shown with selected highlight)
//   dimmed       — true when it is the other player's turn (visual de-emphasis)
// ---------------------------------------------------------------------------

@customElement('hf-deck-area')
export class HfDeckArea extends LitElement {
  @property({ attribute: false }) cards: readonly CardId[] = [];
  @property({ type: Boolean }) faceup = true;
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean, reflect: true }) dimmed = false;
  @property() source: CardSource = 'p1hand';
  @property({ attribute: false }) selectedCard: CardId | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 6px;
      justify-content: center;
      min-height: calc(var(--hf-card-height, 90px) + 16px);
      box-sizing: border-box;
      transition: opacity 0.2s;
    }

    :host([dimmed]) {
      opacity: 0.4;
    }
  `;

  render() {
    return repeat(
      this.cards,
      (c) => c,
      (c) => html`
        <hf-card
          .cardId=${c}
          ?faceup=${this.faceup}
          ?interactive=${this.interactive}
          .source=${this.source}
          ?selected=${c === this.selectedCard}
        ></hf-card>
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-deck-area': HfDeckArea;
  }
}
