/** 得点・コンボ・ランクの調整値。数値はすべてここに集約する（コード中に散らさない）。 */

import type { ChocolateType, Rank } from "../types/game";

export const SCORE: Record<"FRIEND_CHOCOLATE" | "HONMEI_CHOCOLATE" | "HONMEI_BEFORE_CONFESSION" | "FALSE_REPORT", number> = {
  FRIEND_CHOCOLATE: 100,
  HONMEI_CHOCOLATE: 500,
  HONMEI_BEFORE_CONFESSION: 1000,
  FALSE_REPORT: -300,
};

/** チョコ種別 → 基礎点。 */
export const BASE_POINTS: Record<ChocolateType, number> = {
  none: SCORE.FALSE_REPORT,
  friend: SCORE.FRIEND_CHOCOLATE,
  honmei: SCORE.HONMEI_CHOCOLATE,
  honmei_special: SCORE.HONMEI_BEFORE_CONFESSION,
};

/** コンボ倍率。threshold は「その連続数以上」で適用。降順に評価される。 */
export const COMBO_TIERS: ReadonlyArray<{ threshold: number; multiplier: number }> = [
  { threshold: 10, multiplier: 2.0 },
  { threshold: 5, multiplier: 1.5 },
  { threshold: 3, multiplier: 1.2 },
  { threshold: 1, multiplier: 1.0 },
];

/** ランク基準（以上）。降順に評価される。 */
export const RANK_THRESHOLDS: ReadonlyArray<{ rank: Rank; min: number }> = [
  { rank: "S", min: 5000 },
  { rank: "A", min: 3500 },
  { rank: "B", min: 2500 },
  { rank: "C", min: 1500 },
  { rank: "D", min: Number.NEGATIVE_INFINITY },
];

/** 机を1つ調べるのにかかる秒数。空振りでも消費する（机の唯一のリスク）。 */
export const DESK_SEARCH_SECONDS = 12;

/** 場所を移動するのにかかる秒数。 */
export const AREA_MOVE_SECONDS = 8;

/** 双眼鏡で手がかりを1件開示するのにかかる秒数。 */
export const BINOCULAR_SECONDS = 15;

/** 1ステージあたりの双眼鏡の使用回数。ステージが変わると回復する。 */
export const BINOCULAR_USES_PER_STAGE = 2;

/** 特殊エンディングの発生条件。 */
export const SPECIAL_ENDING_CONDITION = {
  minHonmeiReports: 3,
  maxFalseReports: 0,
};
