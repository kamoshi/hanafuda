// Polish translations (corrected from strings_pl.properties which had encoding issues)
import type { en } from './en';

export const pl: Record<keyof typeof en, string> = {
  // Launcher
  launcher_player1_label: 'Gracz 1:',
  launcher_player2_label: 'Gracz 2:',
  launcher_set_label: 'Styl kart:',
  launcher_rounds_label: 'Rundy:',
  launcher_language_label: 'Język:',
  launcher_play_button: 'GRAJ',
  launcher_enableai_label: 'Włącz SI',

  // Game app
  gameapp_window_title: 'Hanafuda Koi-Koi',
  gameapp_points_suffix: 'punktów',

  // Koikoi popup
  koikoi_frame_title: 'Koikoi!',
  koikoi_question: 'Czy chciałbyś zadeklarować koikoi?',
  koikoi_yes: 'Tak',
  koikoi_no: 'Nie',
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

  // In-game messages
  game_parent_info:
    'Spróbuj wybrać kartę z wcześniejszego miesiąca. Osoba która wybierze najwcześniejszy miesiąc zaczyna grę!',
  game_parent_first: 'Gracz 1 zgaduje pierwszy!',
  game_parent_second: 'Teraz zgaduje gracz 2.',
  game_parent_begins: 'zaczyna!',
  game_turn_player1: 'wybiera teraz kartę',
  game_turn_player2: 'wybiera teraz kartę',
  game_round_win: 'wygrał/a poprzednią rundę. Ruch należy do nich!',
  game_round_tie: 'REMIS!',
  game_round_tie_begins: 'zaczyna nową rundę.',

  // Results popup
  results_window_title: 'Wyniki',
  results_label_win: 'wygrał/a!',
  results_label_tie: 'Remis!',
  results_finish: 'Zakończ Grę',
};
