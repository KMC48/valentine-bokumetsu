/**
 * ランクと結末が、実際に遊べる範囲と噛み合っているか。
 *
 * 実際に起きた不具合：
 * - Sランクの基準（5,000点）が理論上の最高点（4,870点）より高く、誰もSに届かなかった。
 * - 全員を通報して撲滅率100%にしても、「女子生徒たちの完全勝利」の結末が出た。
 */

import { describe, expect, it } from "vitest";
import { DESKS } from "../data/desks";
import { ENDINGS } from "../data/endings";
import { RANK_THRESHOLDS } from "../data/score";
import { STAGE_ORDER } from "../data/stages";
import { STUDENTS } from "../data/students";
import { selectEnding } from "../game/ending";
import { calcPoints, rankFor } from "../game/score";
import type { ChocolateType, LoopId, RunStats } from "../types/game";

/** その周回のチョコを、ステージ順に並べる（ステージ内の順番は order で決める）。 */
function chocolatesInPlayOrder(loop: LoopId, order: "bestFirst" | "bestLast"): ChocolateType[] {
  return STAGE_ORDER.flatMap((stage) => {
    const types: ChocolateType[] = [
      ...STUDENTS.filter((s) => s.loop === loop && s.stage === stage).map((s) => s.chocolateType),
      ...DESKS.filter((d) => d.loop === loop && d.stage === stage).map((d) => d.content),
    ].filter((t) => t !== "none");
    const byPoints = types.sort((a, b) => calcPoints(a, 0).points - calcPoints(b, 0).points);
    return order === "bestLast" ? byPoints : byPoints.reverse();
  });
}

/** 誤認なしで、並べた順に全部押さえたときの得点。 */
function perfectScore(types: ChocolateType[]): number {
  return types.reduce((score, type, combo) => score + calcPoints(type, combo).points, 0);
}

const S_MIN = RANK_THRESHOLDS.find((t) => t.rank === "S")!.min;

function stats(over: Partial<RunStats>): RunStats {
  return {
    score: 0, maxCombo: 0, correctReports: 0, falseReports: 0, correctPasses: 0, missedPasses: 0,
    friendCount: 0, honmeiCount: 0, specialCount: 0, deskFinds: 0, annihilationRate: 0, ...over,
  };
}
const textOf = (s: RunStats) => selectEnding(s).lines.map((l) => l.text).join("");

describe("Sランクに届くか", () => {
  it.each([1, 2, 3] as LoopId[])("%i周目：全部押さえて誤認ゼロなら、いちばん損な順番でもS", (loop) => {
    // 倍率は連続数が増えるほど上がるので、高得点のチョコを先に通報するのがいちばん損。
    const worst = perfectScore(chocolatesInPlayOrder(loop, "bestFirst"));
    const best = perfectScore(chocolatesInPlayOrder(loop, "bestLast"));
    expect(best).toBeGreaterThanOrEqual(worst);
    expect(worst, `${loop}周目の完璧プレイ（最低 ${worst}点）がSの基準 ${S_MIN}点 に届かない`).toBeGreaterThanOrEqual(S_MIN);
    expect(rankFor(worst)).toBe("S");
  });

  it("どのランクにも結末が用意されている", () => {
    for (const { rank } of RANK_THRESHOLDS) {
      expect(ENDINGS.some((e) => e.rank === rank), rank).toBe(true);
    }
  });
});

describe("撲滅率100%のときの結末", () => {
  // 全員を通報したとき（3周目で実際に出た成績）。
  const reportedEveryone = stats({ score: 1800, correctReports: 10, falseReports: 5, annihilationRate: 1 });

  it("Cランクでも「女子生徒の勝ち」とは語らず、誤認の多さを叱る", () => {
    const ending = selectEnding(reportedEveryone);
    expect(ending.rank).toBe("C");
    expect(textOf(reportedEveryone)).not.toContain("完全勝利");
    expect(textOf(reportedEveryone)).not.toContain("無事に終わった");
    expect(textOf(reportedEveryone)).toContain("誤認通報が多すぎる");
  });

  it("Bランクでも「チョコが残った」とは語らず、誤認の件数に触れる", () => {
    const s = stats({ score: 2800, correctReports: 10, falseReports: 2, annihilationRate: 1 });
    expect(selectEnding(s).rank).toBe("B");
    expect(textOf(s)).not.toContain("甘い匂いが残っていた");
    expect(textOf(s)).not.toContain("全部は無理か");
    expect(textOf(s)).toContain("すべて押収された");
    expect(textOf(s)).toContain("誤認通報が2件");
  });

  it("取り逃がしがあるときは、これまでどおりの結末", () => {
    const c = stats({ score: 1800, correctReports: 5, annihilationRate: 0.5 });
    expect(textOf(c)).toContain("完全勝利");
    const b = stats({ score: 2800, correctReports: 7, annihilationRate: 0.7 });
    expect(textOf(b)).toContain("甘い匂いが残っていた");
  });
});
