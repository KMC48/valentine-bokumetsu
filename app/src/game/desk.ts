/** 机を調べたときの判定。UIから独立した純粋関数（テスト対象）。 */

import { DESK_SEARCH_SECONDS } from "../data/score";
import type { DeskContent, DeskOutcome, DeskSpot } from "../types/game";
import { calcPoints, nextCombo } from "./score";

const HEADLINE: Record<DeskContent, string> = {
  friend: "机の中から友チョコを発見！",
  honmei: "机の中に本命チョコが隠されていた！",
  none: "この机は空振りだ……",
};

const DEFAULT_DETAIL: Record<DeskContent, string> = {
  friend: "持ち込まれた友チョコを押収した。",
  honmei: "厳重に隠された本命チョコを押収した。",
  none: "チョコは入っていなかった。時間だけを失った。",
};

/**
 * 机1つ分の結果を計算する。
 *
 * 机には誤認通報が無いので、空振りでもコンボは切れず減点もしない。
 * 代わりに、当たり外れに関係なく必ず時間を消費する。
 */
export function judgeDeskSearch(desk: DeskSpot, comboBefore: number): DeskOutcome {
  const found = desk.content !== "none";
  const { points, multiplier } = found
    ? calcPoints(desk.content, comboBefore)
    : { points: 0, multiplier: 1 };

  const outcome: DeskOutcome = {
    deskId: desk.id,
    label: desk.label,
    content: desk.content,
    found,
    gainedPoints: points,
    comboAfter: found ? nextCombo(desk.content, comboBefore) : comboBefore,
    multiplier,
    timeCost: DESK_SEARCH_SECONDS,
    headline: HEADLINE[desk.content],
    detail: desk.resultText || DEFAULT_DETAIL[desk.content],
  };
  if (desk.clue) outcome.clue = desk.clue;
  return outcome;
}
