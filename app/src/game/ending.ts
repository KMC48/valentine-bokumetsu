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

/** ランクに応じた結末。行動と矛盾する固定の誤認回数・全滅表現は使わない。 */
export function selectEnding(stats: RunStats): EndingDef {
  const rank = rankFor(stats.score);
  const ending = ENDINGS.find((e) => e.rank === rank)!;
  if (rank === "D" && stats.falseReports < 3) {
    return {
      ...ending,
      title: "委員会、出直し",
      lines: [
        { speaker: "生徒指導・鬼頭", text: stats.falseReports === 0
          ? "誤認通報はなかった。だが、取り締まりの成果はまだ足りないな。"
          : `誤認通報は${stats.falseReports}件。証拠を確かめるところからやり直そう。` },
        { speaker: "俺", text: stats.correctPasses > 0
          ? `無実の${stats.correctPasses}人は見送れました。次は、隠されたチョコも見抜いてみせます。`
          : "……次は、持ち物と行動をもっとよく見ます。" },
        { speaker: "生徒指導・鬼頭", text: "怪しいという印象と、確かな証拠は違う。そこを忘れるな。" },
        { speaker: "", text: "腕章をしまい、今日の判断を思い返す。" },
        { speaker: "俺", text: "このままでは終われない。委員会の活動は、まだ続く。" },
      ],
    };
  }
  // チョコを全部押さえたのに B・C になるのは、誤認通報で点を失ったときだけ。
  // 「チョコが残った」「女子生徒の勝ち」と語る通常の結末は、撲滅率100%の成績と食い違うので使わない。
  const everythingSeized = stats.annihilationRate >= 1;
  if (rank === "C" && everythingSeized && stats.falseReports >= 3) {
    // 誤認の多さを叱られる結末（Dランクと同じ話）を、ランク表示は C のまま見せる。
    return { ...ENDINGS.find((e) => e.rank === "D")!, rank: "C" };
  }
  if (rank === "B" && everythingSeized && stats.falseReports > 0) {
    return { ...ending, lines: [
      { speaker: "", text: "校内に持ち込まれたチョコは、すべて押収された。" },
      { speaker: "", text: `だが報告書には、誤認通報が${stats.falseReports}件、消えずに残っていた。` },
      { speaker: "俺", text: "……全部押さえても、これでは胸を張れないか。" },
      ...ending.lines.slice(3),
    ] };
  }
  if (rank === "C") {
    return { ...ending, lines: ending.lines.map((line, i) => i === 3
      ? { speaker: "俺", text: stats.falseReports > 0
        ? `……誤認通報は${stats.falseReports}件。見えている物の意味を、考え直さないとな。`
        : "……誤認は避けられた。だが、見抜けなかった仕掛けがまだあった。" }
      : line) };
  }
  if (rank === "S" && stats.annihilationRate < 1) {
    return { ...ending, title: "静まり返る校舎", lines: [
      { speaker: "", text: "その日、委員会の取り締まりは校内を震え上がらせた。" },
      { speaker: "", text: "すべてを見つけたわけではない。それでも、紙袋を堂々と掲げる者はいなくなった。" },
      ...ending.lines.slice(2),
    ] };
  }
  return ending;
}

/** 特殊条件は通常の結末を上書きせず、その後に読める後日談にする。 */
export function specialEpilogue(stats: RunStats): EndingDef | null {
  return meetsSpecialEnding(stats) ? ENDINGS.find((e) => e.rank === "special") ?? null : null;
}
