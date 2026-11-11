/** 周回ごとの難易度適用ロジック。 */

import { LOOP_CONFIG } from "../data/loops";
import type { LoopId, Student } from "../types/game";

/**
 * 観察モーダルで開示するヒント。
 * hints は有力な順に並んでいるので、先頭から hintCount 件だけ見せる。
 *
 * `revealed` は双眼鏡で追加開示した件数。周回の制限に上乗せする。
 */
export function visibleHints(student: Student, loop: LoopId, revealed = 0): string[] {
  const { hintCount } = LOOP_CONFIG[loop];
  return student.hints.slice(0, Math.max(1, hintCount) + Math.max(0, revealed));
}

/** まだ隠されているヒント数（双眼鏡で続きを読める）。 */
export function hiddenHintCount(student: Student, loop: LoopId, revealed = 0): number {
  return Math.max(0, student.hints.length - visibleHints(student, loop, revealed).length);
}

