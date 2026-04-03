// ---------------------------------------------------------------------------
// Card types
// ---------------------------------------------------------------------------

export type CardId =
  | 'matsu1'
  | 'matsu2'
  | 'matsu3'
  | 'matsu4'
  | 'ume1'
  | 'ume2'
  | 'ume3'
  | 'ume4'
  | 'sakura1'
  | 'sakura2'
  | 'sakura3'
  | 'sakura4'
  | 'fuji1'
  | 'fuji2'
  | 'fuji3'
  | 'fuji4'
  | 'ayame1'
  | 'ayame2'
  | 'ayame3'
  | 'ayame4'
  | 'botan1'
  | 'botan2'
  | 'botan3'
  | 'botan4'
  | 'hagi1'
  | 'hagi2'
  | 'hagi3'
  | 'hagi4'
  | 'susuki1'
  | 'susuki2'
  | 'susuki3'
  | 'susuki4'
  | 'kiku1'
  | 'kiku2'
  | 'kiku3'
  | 'kiku4'
  | 'momiji1'
  | 'momiji2'
  | 'momiji3'
  | 'momiji4'
  | 'yanagi1'
  | 'yanagi2'
  | 'yanagi3'
  | 'yanagi4'
  | 'kiri1'
  | 'kiri2'
  | 'kiri3'
  | 'kiri4';

export interface CardData {
  readonly id: CardId;
  /** Original 1-48 numeric ID from the Java enum, used in yaku definitions */
  readonly numericId: number;
  readonly month: number; // 1-12
  readonly value: number; // 1 | 5 | 10 | 20
}

// ---------------------------------------------------------------------------
// Yaku types
// ---------------------------------------------------------------------------

export type YakuId =
  | 'gokou'
  | 'shikou'
  | 'ameShikou'
  | 'sankou'
  | 'inoShikaChou'
  | 'tane'
  | 'akatan'
  | 'aotan'
  | 'tanzaku'
  | 'kasu';

export interface YakuDef {
  readonly id: YakuId;
  /** All of these numeric IDs must be present */
  readonly requiredIds: readonly number[];
  /** Cards from this set that count toward optionalMinimum */
  readonly optionalIds: readonly number[];
  /** Minimum number of optionalIds that must be present */
  readonly optionalMinimum: number;
  readonly basePoints: number;
  /** Award +1 point for each optional card beyond the minimum */
  readonly bonus: boolean;
}

// ---------------------------------------------------------------------------
// Configuration types (from launcher)
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'pl' | 'ja';
export type AIStrategyId = 'simple' | 'analysis';
export type RoundCount = 1 | 3 | 6;

export interface GameConfig {
  readonly player1Name: string;
  readonly player2Name: string;
  readonly locale: Locale;
  readonly maxRounds: RoundCount;
  readonly aiEnabled: boolean;
  readonly aiStrategy: AIStrategyId;
}

// ---------------------------------------------------------------------------
// Game state types
// ---------------------------------------------------------------------------

export interface PlayerState {
  readonly name: string;
  readonly hand: readonly CardId[];
  readonly collected: readonly CardId[];
  readonly points: number;
  readonly calledKoikoi: boolean;
  readonly passedYakuCount: number;
}

/** Where a card click originated — replaces the context integer (1/2/3) */
export type CardSource = 'p1hand' | 'p2hand' | 'table';

export type OverlayState =
  | {
      readonly kind: 'koikoi';
      readonly playerIndex: 1 | 2;
      readonly yakuIds: readonly YakuId[];
      readonly score: number;
      /** False when it's the AI's turn — buttons are shown but disabled */
      readonly interactive: boolean;
    }
  | {
      readonly kind: 'results';
      readonly player1Name: string;
      readonly player2Name: string;
      readonly score1: number;
      readonly score2: number;
    };

export type GamePhase =
  | 'SETUP'
  | 'PARENT_CHECK_P1' // P1 selects from 8 face-up table cards
  | 'PARENT_CHECK_P2' // P2 selects (may be AI)
  | 'PARENT_CHECK_RESULT' // Both cards shown; short delay before round starts
  | 'TURN_P1_HAND' // P1 plays a card from hand (may match table card)
  | 'TURN_P1_PILE' // P1 draws from pile (may match table card)
  | 'TURN_P2_HAND'
  | 'TURN_P2_PILE'
  | 'KOIKOI_P1' // Awaiting P1 koikoi decision
  | 'KOIKOI_P2'
  | 'ROUND_OVER'
  | 'GAME_OVER';

export interface GameState {
  readonly phase: GamePhase;
  readonly round: number;
  readonly maxRounds: number;
  /** Which player starts each round; null before the parent check resolves */
  readonly currentRoundStarter: 1 | 2 | null;
  readonly player1: PlayerState;
  readonly player2: PlayerState;
  readonly table: readonly CardId[];
  readonly pile: readonly CardId[];
  /** Card selected from hand awaiting a table match selection */
  readonly pendingHandCard: CardId | null;
  /** Cards shown face-up during parent check */
  readonly p1ParentCard: CardId | null;
  readonly p2ParentCard: CardId | null;
  readonly locale: Locale;
  readonly aiEnabled: boolean;
  readonly aiStrategy: AIStrategyId;
  /** [top message, bottom message] shown in the left panel */
  readonly feedback: readonly [string, string];
  readonly overlay: OverlayState | null;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type GameAction =
  | { readonly type: 'START_GAME'; readonly config: GameConfig }
  | { readonly type: 'CARD_SELECTED'; readonly cardId: CardId; readonly source: CardSource }
  | { readonly type: 'DUMP' }
  | { readonly type: 'KOIKOI_ANSWER'; readonly accept: boolean }
  | { readonly type: 'PARENT_CHECK_DELAY_ELAPSED' }
  | { readonly type: 'NEW_ROUND_START' }
  | { readonly type: 'RESULTS_CLOSED' };
