import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { CARDS } from '../../core/cards';
import type { CardId } from '../../core/types';
import './hf-card';

// ---------------------------------------------------------------------------
// <hf-collected-area> — replaces CollectedPanel.java.
// Displays a player's collected cards grouped into four value rows:
//   20 (brights) / 10 (animals) / 5 (tanzaku) / 1 (plains)
// All cards are passive (face-up, non-interactive).
// Cards start spaced normally; overlap increases automatically as more are
// added so they always fit within the available width.
// ---------------------------------------------------------------------------

// hf-card renders at 36px (--hf-card-width) + 3px border each side = 42px actual layout width.
// Shadow DOM does not inherit the global box-sizing:border-box reset, so the button inside
// hf-card uses content-box, making the host element 6px wider than the image alone.
const CARD_W = 42;
const LABEL_W = 20; // row-label min-width (14px) + margin-right (2px) + a little extra

@customElement('hf-collected-area')
export class HfCollectedArea extends LitElement {
  @property({ attribute: false }) cards: readonly CardId[] = [];
  @property({ type: Boolean, reflect: true }) bottom = false;

  @state() private hostWidth = 0;

  private ro?: ResizeObserver;

  connectedCallback() {
    super.connectedCallback();
    this.ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) this.hostWidth = entry.contentRect.width;
    });
    this.ro.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px;
      overflow: hidden;
    }

    :host([bottom]) {
      justify-content: flex-end;
    }

    .row {
      --hf-card-width: 36px;
      --hf-card-height: calc(var(--hf-card-width) * 1600 / 976);

      display: flex;
      align-items: center;
      height: calc(var(--hf-card-height) + 4px);
      box-sizing: border-box;
    }

    .row hf-card {
      flex-shrink: 0;
      transition: transform 0.1s;
    }

    .row hf-card:hover {
      transform: translateY(-4px);
      z-index: 1;
    }

    .row-label {
      font-size: 0.6rem;
      color: #888;
      margin-right: 2px;
      min-width: 14px;
      flex-shrink: 0;
      text-align: right;
    }
  `;

  /**
   * Returns the margin-left value (px string) for non-first cards in a row.
   * Positive (2px gap) when cards fit naturally; negative (overlap) otherwise.
   */
  private overlapFor(n: number): string {
    if (n <= 1) return '0px';
    // contentRect.width already excludes our padding, so available = hostWidth - label
    const available = this.hostWidth - LABEL_W;
    // Space needed with a 2px natural gap
    const natural = CARD_W + (n - 1) * (CARD_W + 2);
    if (available > 0 && natural <= available) return '2px';
    // Solve: CARD_W + (n-1)(CARD_W + m) = available  →  m = (available - CARD_W)/(n-1) - CARD_W
    const m = (available - CARD_W) / (n - 1) - CARD_W;
    // Never overlap so much that less than 5px of each card is visible
    return `${Math.max(m, -(CARD_W - 5))}px`;
  }

  render() {
    const by = (v: number) => this.cards.filter((c) => CARDS[c].value === v);

    const row = (value: number) => {
      const cards = by(value);
      const overlap = this.overlapFor(cards.length);
      return html`
        <div class="row">
          <span class="row-label">${value}</span>
          ${repeat(
            cards,
            (c) => c,
            (c, i) => html`
              <hf-card
                .cardId=${c}
                faceup
                style=${styleMap({ marginLeft: i === 0 ? '0px' : overlap })}
              ></hf-card>
            `
          )}
        </div>
      `;
    };

    return html`${row(20)}${row(10)}${row(5)}${row(1)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-collected-area': HfCollectedArea;
  }
}
