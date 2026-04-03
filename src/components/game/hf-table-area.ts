import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { store } from '../../store/gameStore';
import type { CardId } from '../../core/types';
import './hf-card';

// ---------------------------------------------------------------------------
// <hf-table-area> — replaces TablePanel.java.
// Renders table cards and the dump button.
//
// Props:
//   cards         — cards currently on the table
//   interactive   — true when the human player may click table cards
//   facedown      — when true all cards render face-down (parent-check picking)
//   revealedCards — cards that are always face-up even when facedown=true
//   matchingCards — subset of `cards` that are valid match targets;
//                   when non-empty only these cards become interactive and
//                   highlighted; when empty all cards are interactive
//                   (parent-check phase) if interactive=true
//   showDump      — show and enable the dump button
// ---------------------------------------------------------------------------

@customElement('hf-table-area')
export class HfTableArea extends LitElement {
  @property({ attribute: false }) cards: readonly CardId[] = [];
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) facedown = false;
  @property({ attribute: false }) revealedCards: readonly CardId[] = [];
  @property({ attribute: false }) matchingCards: readonly CardId[] = [];
  @property({ type: Boolean }) showDump = false;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      min-height: calc(2 * var(--hf-card-height, 90px) + 36px);
      box-sizing: border-box;
    }

    .cards {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-content: center;
      justify-content: flex-start;
      max-width: calc(10 * var(--hf-card-width, 60px) + 9 * 6px);
    }

    .dump-btn {
      width: var(--hf-card-width, 60px);
      height: var(--hf-card-height, 90px);
      border: 2px dashed #888;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.06);
      cursor: pointer;
      font-size: 1.8rem;
      color: #777;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dump-btn:hover {
      border-color: #555;
      background: rgba(0, 0, 0, 0.12);
      color: #444;
    }
  `;

  private handleDump() {
    store.dispatch({ type: 'DUMP' });
  }

  render() {
    const revealSet = new Set(this.revealedCards);
    const matchSet = new Set(this.matchingCards);
    // When matchSet is empty all cards are interactive (parent-check);
    // when non-empty only matching cards are interactive.
    const anyMatch = matchSet.size > 0;

    return html`
      <div class="cards">
        ${repeat(
          this.cards,
          (c) => c,
          (c) => html`
            <hf-card
              .cardId=${c}
              ?faceup=${!this.facedown || revealSet.has(c)}
              ?interactive=${this.interactive && (!anyMatch || matchSet.has(c))}
              ?highlighted=${matchSet.has(c)}
              source="table"
            ></hf-card>
          `
        )}
        ${this.showDump
          ? html`<button class="dump-btn" @click=${this.handleDump}>+</button>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-table-area': HfTableArea;
  }
}
