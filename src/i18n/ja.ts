// Japanese translations (from strings_ja.properties)
import type { en } from './en';

export const ja: Record<keyof typeof en, string> = {
  // Launcher
  launcher_player1_label: 'プレイヤー１:',
  launcher_player2_label: 'プレイヤー２:',
  launcher_set_label: '札のスタイル：',
  launcher_rounds_label: 'ラウンド:',
  launcher_language_label: '言語',
  launcher_play_button: 'プレイ',
  launcher_enableai_label: 'AIを利用',

  // Game app
  gameapp_window_title: '花札こいこい！',
  gameapp_points_suffix: '文',

  // Koikoi popup
  koikoi_frame_title: 'こいこい！',
  koikoi_question: 'こいこいにしますか？',
  koikoi_yes: 'はい',
  koikoi_no: 'いいえ',
  koikoi_gokou: '五光',
  koikoi_shikou: '四光',
  koikoi_ameshikou: '雨四光',
  koikoi_sankou: '三光',
  koikoi_inoshikachou: '猪鹿蝶',
  koikoi_tane: 'タネ',
  koikoi_akatan: '赤短',
  koikoi_aotan: '青短',
  koikoi_tanzaku: '短冊',
  koikoi_kasu: 'カス',

  // In-game messages
  game_parent_info: '最も早い月を選んでみて下さい。もっと早い月の札を選んだ人が始まります！',
  game_parent_first: 'プレイヤー１が始まります！',
  game_parent_second: '今プレイヤー２、選んでください',
  game_parent_begins: 'が始まります！',
  game_turn_player1: 'の番です',
  game_turn_player2: 'の番です',
  game_round_win: 'が前のラウンドには勝ったから、始まります！',
  game_round_tie: '同点！',
  game_round_tie_begins: 'が次のラウンドには始まります。',

  // Results popup
  results_window_title: '結果',
  results_label_win: 'が勝った',
  results_label_tie: '同点！',
  results_finish: '完了',
};
