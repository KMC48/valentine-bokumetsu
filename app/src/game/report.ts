/** 通報の判定。UI から独立した純粋関数にしておく（テスト対象）。 */

import type { ChocolateType, ReportOutcome, Student } from "../types/game";
import { calcPoints, isSuccess, nextCombo } from "./score";

const HEADLINE: Record<ChocolateType, string> = {
  friend: "友チョコを発見！",
  honmei: "本命チョコを摘発！",
  honmei_special: "告白直前を阻止！",
  none: "チョコは見つからなかった……",
};

const DEFAULT_DETAIL: Record<ChocolateType, string> = {
  friend: "所持品から友チョコが発見された。校則違反である。",
  honmei: "厳重に隠された本命チョコを押収した。",
  honmei_special: "受け渡しの直前だった。最大の戦果である。",
  none: "誤認通報。信用度が下がり、コンボは0に戻った。",
};

/** 生徒1人への通報結果を計算する。 */
export function judgeReport(student: Student, comboBefore: number): ReportOutcome {
  const type = student.chocolateType;
  const { points, multiplier } = calcPoints(type, comboBefore);
  const success = isSuccess(type);

  return {
    chocolateType: type,
    success,
    basePoints: points === 0 ? 0 : Math.round(points / multiplier),
    gainedPoints: points,
    comboBefore,
    comboAfter: nextCombo(type, comboBefore),
    multiplier,
    headline: HEADLINE[type],
    detail: student.reportResultText ?? DEFAULT_DETAIL[type],
  };
}

/** 摘発率（0〜1）。分母が0なら1とみなす。 */
export function annihilationRate(caught: number, total: number): number {
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, caught / total));
}
