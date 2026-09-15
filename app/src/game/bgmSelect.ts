/**
 * 「今どの曲を鳴らすべきか」を決める純粋関数。
 *
 * 音を鳴らす処理（Web Audio）とは分離してあるので、ここだけテストできる。
 *
 * 【重要な制約】
 * 残り人数やチョコ所持の有無で曲を変えてはいけない。
 * それをすると、まだ見つけていない情報を音で漏らすことになる。
 * 曲は「画面」と「時間帯」だけで決める。
 */

import type { BgmId } from "../data/bgm";
import type { ScreenId, StageId } from "../types/game";

export function bgmForScreen(screen: ScreenId, stage: StageId): BgmId | null {
  switch (screen) {
    case "title":
    case "loopSelect":
    case "settings":
      return "pop";

    // ストーリーは主人公の独白・疑い・作戦が中心。
    case "story":
      return "dark";

    // 探索は朝・昼が軽快な①、放課後は②へ切り替える。
    case "stage":
    case "stageResult":
      return stage === "afterSchool" ? "youth" : "pop";

    // 総括と結末は、取り締まりの曲ではなく余韻のある②。
    case "finalResult":
    case "ending":
      return "youth";

    default:
      return null;
  }
}
