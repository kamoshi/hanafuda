import { CARDS, canMatch } from '../core/cards';
import type { AIStrategy } from './types';

// ---------------------------------------------------------------------------
// SimpleAI — ports SimpleAI.java.
// Plays the first matching pair it finds; never calls koi-koi.
// ---------------------------------------------------------------------------

export const simpleAI: AIStrategy = {
  parentMove(table, p1Card) {
    const choices = p1Card !== null ? table.filter((c) => c !== p1Card) : [...table];
    return choices[Math.floor(Math.random() * choices.length)]!;
  },

  handMove(hand, table) {
    // Play the first hand card that can match a table card; otherwise hand[0].
    for (const card of hand) {
      if (canMatch(card, table)) return card;
    }
    return hand[0]!;
  },

  matchTableCard(handCard, table) {
    // First table card with the same month as the chosen hand card.
    const month = CARDS[handCard].month;
    return table.find((c) => CARDS[c].month === month)!;
  },

  pileResponse(pileCard, table) {
    if (!canMatch(pileCard, table)) return null;
    const month = CARDS[pileCard].month;
    return table.find((c) => CARDS[c].month === month) ?? null;
  },

  koikoiMove() {
    return false;
  },
};
