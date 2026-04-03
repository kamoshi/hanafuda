import type { CardId } from '../core/types';

// ---------------------------------------------------------------------------
// AIStrategy — pure interface implemented by simpleAI and analysisAI.
// Every method receives only the data it needs and returns a decision value.
// The AIController is responsible for scheduling and dispatching.
// ---------------------------------------------------------------------------

export interface AIStrategy {
  /**
   * PARENT_CHECK_P2: choose any table card that is not P1's already-chosen card.
   */
  parentMove(table: readonly CardId[], p1Card: CardId | null): CardId;

  /**
   * TURN_P2_HAND (no pending card yet): choose a card from P2's hand.
   */
  handMove(hand: readonly CardId[], table: readonly CardId[]): CardId;

  /**
   * TURN_P2_HAND (hand card is pending and has table matches):
   * choose which matching table card to collect.
   */
  matchTableCard(handCard: CardId, table: readonly CardId[]): CardId;

  /**
   * TURN_P2_PILE: choose a matching table card to collect, or null to dump.
   */
  pileResponse(pileCard: CardId, table: readonly CardId[]): CardId | null;

  /**
   * KOIKOI_P2: return true to call koi-koi (keep playing), false to stop.
   */
  koikoiMove(hand: readonly CardId[], table: readonly CardId[]): boolean;
}
