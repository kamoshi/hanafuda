import { CARDS, canMatch } from '../core/cards';
import type { CardId } from '../core/types';
import type { AIStrategy } from './types';

// ---------------------------------------------------------------------------
// AnalysisAI — ports AnalysisAI.java.
// Picks the hand+table pair with the highest combined point value.
// Never calls koi-koi (same as SimpleAI — both strategies are conservative).
// ---------------------------------------------------------------------------

export const analysisAI: AIStrategy = {
  parentMove(table, p1Card) {
    // Same random logic as SimpleAI (AnalysisAI.java is identical here).
    const choices = p1Card !== null ? table.filter((c) => c !== p1Card) : [...table];
    return choices[Math.floor(Math.random() * choices.length)]!;
  },

  handMove(hand, table) {
    // Among all matchable hand cards, pick the one whose pair has the highest
    // combined value. Fall back to hand[0] when nothing matches.
    let bestHand: CardId | null = null;
    let maxPoints = 0;

    for (const handCard of hand) {
      if (canMatch(handCard, table)) {
        for (const tableCard of table) {
          if (CARDS[handCard].month === CARDS[tableCard].month) {
            const combined = CARDS[handCard].value + CARDS[tableCard].value;
            if (combined > maxPoints) {
              maxPoints = combined;
              bestHand = handCard;
            }
          }
        }
      }
    }

    return bestHand ?? hand[0]!;
  },

  matchTableCard(handCard, table) {
    // Pick the highest-value table card with a matching month.
    const month = CARDS[handCard].month;
    let best: CardId | null = null;
    let maxVal = -1;
    for (const c of table) {
      if (CARDS[c].month === month && CARDS[c].value > maxVal) {
        maxVal = CARDS[c].value;
        best = c;
      }
    }
    return best!;
  },

  pileResponse(pileCard, table) {
    if (!canMatch(pileCard, table)) return null;
    // Same logic as matchTableCard: pick the highest-value matching card.
    const month = CARDS[pileCard].month;
    let best: CardId | null = null;
    let maxVal = -1;
    for (const c of table) {
      if (CARDS[c].month === month && CARDS[c].value > maxVal) {
        maxVal = CARDS[c].value;
        best = c;
      }
    }
    return best;
  },

  koikoiMove() {
    return false;
  },
};
