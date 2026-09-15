/** 得点・コンボ・ランクの純粋関数。副作用を持たせないこと（テスト対象）。 */

import { BASE_POINTS, COMBO_TIERS, RANK_THRESHOLDS } from "../data/score";
import type { ChocolateType, Rank } from "../types/game";

/** チョコ種別の基礎点。 */
export function basePointsFor(type: ChocolateType): number {
  return BASE_POINTS[type];
}

/** 現在のコンボ数に対する倍率。 */
export function comboMultiplier(combo: number): number {
  for (const tier of COMBO_TIERS) {
    if (combo >= tier.threshold) return tier.multiplier;
  }
  return 1.0;
}

/** 通報が成功扱いか（チョコを持っていたか）。 */
export function isSuccess(type: ChocolateType): boolean {
  return type !== "none";
}

/**
 * 得点を計算する。
 * 成功時はコンボ倍率を適用、誤認時は倍率を適用せず固定のマイナス。
 * comboBefore は「この通報の直前まで」のコンボ数。
 */
export function calcPoints(type: ChocolateType, comboBefore: number): { points: number; multiplier: number } {
  const base = basePointsFor(type);
  if (!isSuccess(type)) {
    return { points: base, multiplier: 1.0 };
  }
  // 通報成立後のコンボ数で倍率を決める（3連続目で ×1.2 が乗る）。
  const multiplier = comboMultiplier(comboBefore + 1);
  return { points: Math.round(base * multiplier), multiplier };
}

/** 通報後のコンボ数。 */
export function nextCombo(type: ChocolateType, comboBefore: number): number {
  return isSuccess(type) ? comboBefore + 1 : 0;
}

/** スコアからランクを求める。 */
export function rankFor(score: number): Rank {
  for (const tier of RANK_THRESHOLDS) {
    if (score >= tier.min) return tier.rank;
  }
  return "D";
}
