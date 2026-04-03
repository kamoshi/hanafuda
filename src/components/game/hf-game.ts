import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../../store/gameStore';
import { startAIController, stopAIController } from '../../ai/aiController';
import {
  matchingTableCards,
  topOfPile,
  canDump,
  isP1Turn,
  isP2Turn,
} from '../../core/selectors';
import { matchingCards } from '../../core/cards';
import type { GameState } from '../../core/types';
import './hf-left-panel';
import './hf-player-info';
import './hf-deck-area';
import './hf-table-area';
import './hf-collected-area';
import '../popups/hf-koikoi-popup';
import '../popups/hf-results-popup';

// ---------------------------------------------------------------------------
// <hf-game> — replaces GameFrame.java.
// Subscribes to the store, derives per-zone props, and assembles the game
// layout.  Popups (overlay state) are handled in Stage 7.
//
// Layout mirrors GameFrame's BorderLayout:
//   left   | p2-deck / table / p1-deck   | right (infos + collected)
// ---------------------------------------------------------------------------

@customElement('hf-game')
export class HfGame extends LitElement {
  @state() private gs: GameState = store.getState();
  private unsub?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.unsub = store.subscribe((s) => {
      this.gs = s;
    });
    startAIController();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
    stopAIController();
  }

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--hf-left-width, 110px) 1fr var(--hf-right-width, 160px);
      grid-template-rows: 1fr;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    hf-left-panel {
      grid-column: 1;
      grid-row: 1;
    }

    .center {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
    }

    .right {
      grid-column: 3;
      grid-row: 1;
      display: flex;
      flex-direction: column;
    }

    hf-deck-area.p2 {
      flex-shrink: 0;
    }

    hf-table-area {
      flex: 1;
    }

    hf-deck-area.p1 {
      flex-shrink: 0;
    }

    hf-player-info.p2 {
      flex-shrink: 0;
    }

    hf-collected-area {
      flex: 1;
      overflow: hidden;
    }

    hf-player-info.p1 {
      flex-shrink: 0;
    }

    .overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 100;
    }
  `;

  private renderOverlay() {
    const ov = this.gs.overlay;
    if (ov === null) return '';

    if (ov.kind === 'koikoi') {
      const playerName =
        ov.playerIndex === 1 ? this.gs.player1.name : this.gs.player2.name;
      return html`
        <hf-koikoi-popup
          .playerName=${playerName}
          .yakuIds=${ov.yakuIds}
          .score=${ov.score}
          ?interactive=${ov.interactive}
        ></hf-koikoi-popup>
      `;
    }

    // kind === 'results'
    return html`
      <hf-results-popup
        .player1Name=${ov.player1Name}
        .player2Name=${ov.player2Name}
        .score1=${ov.score1}
        .score2=${ov.score2}
      ></hf-results-popup>
    `;
  }

  render() {
    const gs = this.gs;
    const phase = gs.phase;

    // ---- Pile ---------------------------------------------------------------
    const pileTop = topOfPile(gs);
    const pileFaceup = phase === 'TURN_P1_PILE' || phase === 'TURN_P2_PILE';

    // ---- Table matching cards (for highlighting + interactive filtering) -----
    // During pile phases: matching is based on the revealed pile card.
    // During hand phases: based on the pending hand card (may be null → []).
    const matchForTable: readonly string[] =
      (phase === 'TURN_P1_PILE' || phase === 'TURN_P2_PILE') && pileTop !== null
        ? matchingCards(pileTop, gs.table)
        : matchingTableCards(gs);

    // ---- P1 hand ------------------------------------------------------------
    const p1HandInteractive = phase === 'TURN_P1_HAND';

    // ---- P2 hand (human only in two-player mode) ----------------------------
    const p2HandInteractive = phase === 'TURN_P2_HAND' && !gs.aiEnabled;

    // ---- Table --------------------------------------------------------------
    // Parent-check P1: all 8 cards clickable, no highlighting.
    // Parent-check P2 (human): same — all remaining cards clickable.
    // Hand match / pile match: only matching cards clickable + highlighted.
    const tableInteractive =
      phase === 'PARENT_CHECK_P1' ||
      (phase === 'PARENT_CHECK_P2' && !gs.aiEnabled) ||
      (phase === 'TURN_P1_HAND' &&
        gs.pendingHandCard !== null &&
        matchForTable.length > 0) ||
      (phase === 'TURN_P1_PILE' && matchForTable.length > 0) ||
      (!gs.aiEnabled &&
        phase === 'TURN_P2_HAND' &&
        gs.pendingHandCard !== null &&
        matchForTable.length > 0) ||
      (!gs.aiEnabled && phase === 'TURN_P2_PILE' && matchForTable.length > 0);

    // During parent check there is no pending card → no highlights needed.
    const tableMatchingCards =
      phase === 'PARENT_CHECK_P1' || phase === 'PARENT_CHECK_P2'
        ? ([] as readonly string[])
        : matchForTable;

    // During parent check reveal cards already selected so they flip face-up.
    const tableRevealedCards = [gs.p1ParentCard, gs.p2ParentCard].filter(
      (c): c is NonNullable<typeof c> => c !== null,
    );

    // ---- Hand dimming -------------------------------------------------------
    const p1Turn =
      phase === 'TURN_P1_HAND' || phase === 'TURN_P1_PILE';
    const p2Turn =
      phase === 'TURN_P2_HAND' || phase === 'TURN_P2_PILE';
    const p1HandDimmed = p2Turn;
    const p2HandDimmed = p1Turn;

    // ---- Dump button --------------------------------------------------------
    const showDump = canDump(gs) && (isP1Turn(gs) || (!gs.aiEnabled && isP2Turn(gs)));

    // ---- Feedback -----------------------------------------------------------
    const [feedbackTop, feedbackBottom] = gs.feedback;

    return html`
      <!-- Left: pile + feedback -->
      <hf-left-panel
        .feedbackTop=${feedbackTop}
        .feedbackBottom=${feedbackBottom}
        .pileCard=${pileTop}
        ?pileFaceup=${pileFaceup}
      ></hf-left-panel>

      <!-- Center: P2 hand / table / P1 hand -->
      <div class="center">
        <hf-deck-area
          class="p2"
          .cards=${gs.player2.hand}
          source="p2hand"
          ?interactive=${p2HandInteractive}
          ?dimmed=${p2HandDimmed}
          .selectedCard=${gs.pendingHandCard}
        ></hf-deck-area>

        <hf-table-area
          .cards=${gs.table}
          ?facedown=${phase === 'PARENT_CHECK_P1' || phase === 'PARENT_CHECK_P2'}
          .revealedCards=${tableRevealedCards}
          ?interactive=${tableInteractive}
          .matchingCards=${tableMatchingCards}
          ?showDump=${showDump}
        ></hf-table-area>

        <hf-deck-area
          class="p1"
          .cards=${gs.player1.hand}
          faceup
          ?interactive=${p1HandInteractive}
          ?dimmed=${p1HandDimmed}
          source="p1hand"
          .selectedCard=${gs.pendingHandCard}
        ></hf-deck-area>
      </div>

      <!-- Right: player info + collected areas -->
      <div class="right">
        <hf-player-info
          class="p2"
          .name=${gs.player2.name}
          .points=${gs.player2.points}
          reverse
        ></hf-player-info>

        <hf-collected-area
          .cards=${gs.player2.collected}
        ></hf-collected-area>

        <hf-collected-area
          .cards=${gs.player1.collected}
          bottom
        ></hf-collected-area>

        <hf-player-info
          class="p1"
          .name=${gs.player1.name}
          .points=${gs.player1.points}
        ></hf-player-info>
      </div>

      <!-- Overlay: koikoi decision or end-of-game results -->
      ${gs.overlay !== null
        ? html`<div class="overlay">${this.renderOverlay()}</div>`
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hf-game': HfGame;
  }
}
