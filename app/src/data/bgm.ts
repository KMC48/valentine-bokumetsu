/**
 * BGMデータ。
 *
 * 納品資料（サウンド素材/BGM_サウンド説明資料.md）の指定に従う。
 * 全曲 4/4拍子・32小節で、導入や末尾のフェードアウトは無く、
 * 残響が次の周回へ折り返す作りになっている＝そのままループできる。
 */

export type BgmId = "pop" | "youth" | "dark";

/**
 * 使用する音声フォーマット。
 *
 * - "wav" … ループが完全に継ぎ目なし。ただし合計37MB（MP3の約7倍）。
 * - "mp3" … 軽い（合計4.9MB）が、エンコード時のパディングで
 *           環境によってはループの継ぎ目に隙間が出る。
 *
 * 納品されたWAVは「ファイル全体がぴったりループ1周分」（パディング無し、
 * 44,100Hz / 2,646,000サンプル = 60.000000秒 などを実測で確認済み）なので、
 * バッファ全体をループさせれば隙間は生じない。
 * ただしWAVは合計37MBあり、GitHub Pagesで配信するには重い。
 * Web公開版はMP3を使う（ループの継ぎ目にごく短い隙間が出ることがある）。
 * ローカルで音質を優先したい場合はここを "wav" に戻し、
 * public/assets/bgm/*.wav を置けばよい（.gitignore で除外している）。
 */
export const BGM_FORMAT: "wav" | "mp3" = "mp3";

export type BgmTrack = {
  id: BgmId;
  /** 曲名（資料の表記）。 */
  title: string;
  /** 拡張子を除いたファイル名。 */
  file: string;
  /**
   * ループの終端（秒）。資料の「原音の終了秒」。
   *
   * WAVはファイル全体がループ1周分なので、実際の再生では
   * デコード後の buffer.duration を優先する（リサンプリングによる誤差を避けるため）。
   * この値は資料との突き合わせ用。
   */
  loopEnd: number;
  /** 曲ごとの初期音量。資料の「初期Gainの目安」。 */
  gain: number;
};

export const BGM: Record<BgmId, BgmTrack> = {
  pop: {
    id: "pop",
    title: "チョコっと厳戒態勢",
    file: "01_valentine_pop",
    loopEnd: 60,
    // 操作音・通報SEが聞こえる余地を残す。
    gain: 0.25,
  },
  youth: {
    id: "youth",
    title: "放課後、まだ帰れない",
    file: "02_after_school_youth",
    loopEnd: 68.57142857142857,
    // 会話と余韻を優先。
    gain: 0.2,
  },
  dark: {
    id: "dark",
    title: "校則に書いてない感情",
    file: "03_twisted_school_rules",
    loopEnd: 80,
    // 長文を読むストーリーの背景に置く。
    gain: 0.15,
  },
};

/** 実際に読み込むパス。 */
export function bgmSrc(track: BgmTrack): string {
  // 先頭のスラッシュは付けない（GitHub Pagesのサブパス配信で404になる）。
  return `assets/bgm/${track.file}.${BGM_FORMAT}`;
}

/** 曲の切り替えにかける秒数（資料の指定：0.5〜1秒）。 */
export const BGM_CROSSFADE_SECONDS = 0.8;
