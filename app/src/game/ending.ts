/** エンディング分岐。 */

import { ENDINGS } from "../data/endings";
import { SPECIAL_ENDING_CONDITION } from "../data/score";
import type { EndingDef, RunStats } from "../types/game";
import { rankFor } from "./score";

/** 特殊エンディングの条件を満たすか。 */
export function meetsSpecialEnding(stats: RunStats): boolean {
  const honmeiTotal = stats.honmeiCount + stats.specialCount;
  return (
    honmeiTotal >= SPECIAL_ENDING_CONDITION.minHonmeiReports &&
    stats.falseReports <= SPECIAL_ENDING_CONDITION.maxFalseReports
  );
}

/** 集計からエンディングを1件決める。特殊条件が最優先。 */
export function selectEnding(stats: RunStats): EndingDef {
  if (meetsSpecialEnding(stats)) {
    const special = ENDINGS.find((e) => e.rank === "special");
    if (special) return special;
  }
  const rank = rankFor(stats.score);
  const byRank = ENDINGS.find((e) => e.rank === rank);
  // データ不備でも落とさない。
  return byRank ?? ENDINGS[ENDINGS.length - 1]!;
}
