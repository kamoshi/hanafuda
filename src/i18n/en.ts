// English translations — canonical source of TranslationKey type.
// All other locale files must export an object with the same keys.
export const en = {
  // Launcher
  launcher_player1_label: 'Player 1:',
  launcher_player2_label: 'Player 2:',
  launcher_set_label: 'Card style:',
  launcher_rounds_label: 'Rounds:',
  launcher_language_label: 'Language:',
  launcher_play_button: 'PLAY',
  launcher_enableai_label: 'Enable AI',

  // Game app
  gameapp_window_title: 'Hanafuda Koi-Koi',
  gameapp_points_suffix: 'points',

  // Koikoi popup
  koikoi_frame_title: 'Koikoi!',
  koikoi_question: 'Would you like to call Koikoi?',
  koikoi_yes: 'Yes',
  koikoi_no: 'No',
  koikoi_gokou: 'Gokou',
  koikoi_shikou: 'Shikou',
  koikoi_ameshikou: 'Ameshikou',
  koikoi_sankou: 'Sankou',
  koikoi_inoshikachou: 'Ino-Shika-Chou',
  koikoi_tane: 'Tane',
  koikoi_akatan: 'Akatan',
  koikoi_aotan: 'Aotan',
  koikoi_tanzaku: 'Tanzaku',
  koikoi_kasu: 'Kasu',

  // In-game messages (name is prepended / appended by the component)
  game_parent_info:
    'Try to select card which is of the earlier month. Person who selects earlier card starts.',
  game_parent_first: 'Player 1 guesses first!',
  game_parent_second: 'Now, player 2 guesses.',
  game_parent_begins: 'begins!',
  game_turn_player1: "'s turn",
  game_turn_player2: "'s turn",
  game_round_win: 'has won the previous round. They start this one!',
  game_round_tie: 'TIE!',
  game_round_tie_begins: 'begins the new round.',

  // Results popup
  results_window_title: 'Results',
  results_label_win: 'has won!',
  results_label_tie: 'Game tied!',
  results_finish: 'End Game',
} as const;
