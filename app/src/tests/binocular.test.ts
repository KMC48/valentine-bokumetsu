/** 双眼鏡アイテム：手がかりの追加開示と、使用可否の判定。 */

import { beforeEach, describe, expect, it } from "vitest";
import { BINOCULAR_SECONDS, BINOCULAR_USES_PER_STAGE } from "../data/score";
import { getStudents } from "../data/students";
import { hiddenHintCount, visibleHints } from "../game/difficulty";
import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";
import type { LoopId } from "../types/game";

function firstStudent(loop: LoopId) {
  return getStudents(loop, "morning")[0]!;
}

describe("手がかりの開示数", () => {
  it("双眼鏡を使った分だけ読める件数が増える", () => {
    const s = firstStudent(3); // 3周目は1件しか読めない
    expect(visibleHints(s, 3, 0)).toHaveLength(1);
    expect(visibleHints(s, 3, 1)).toHaveLength(2);
    expect(visibleHints(s, 3, 2)).toHaveLength(3);
    // 全部読んだらそれ以上は増えない
    expect(visibleHints(s, 3, 5)).toHaveLength(3);
  });

  it("隠れている件数がその分だけ減る", () => {
    const s = firstStudent(3);
    expect(hiddenHintCount(s, 3, 0)).toBe(2);
    expect(hiddenHintCount(s, 3, 1)).toBe(1);
    expect(hiddenHintCount(s, 3, 2)).toBe(0);
  });

  it("1周目は元々全部読めるので、開示しても変わらない", () => {
    const s = firstStudent(1);
    expect(hiddenHintCount(s, 1, 0)).toBe(0);
    expect(visibleHints(s, 1, 2)).toHaveLength(3);
  });
});

describe("双眼鏡の使用可否", () => {
  const g = () => useGameStore.getState();

  beforeEach(() => {
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(3); // 隠れた手がかりがある3周目で試す
    g().finishStory();
  });

  it("ステージ開始時は規定回数が使える", () => {
    expect(g().binocularUses).toBe(BINOCULAR_USES_PER_STAGE);
  });

  it("隠れた手がかりがある生徒には使える", () => {
    const s = g().currentStudents()[0]!;
    expect(g().binocularState(s.id).canUse).toBe(true);
  });

  it("使うと手がかりが1件増え、回数と時間が減る", () => {
    const s = g().currentStudents()[0]!;
    const before = g().timeRemaining;

    g().useBinocular(s.id);

    expect(g().revealedHints[s.id]).toBe(1);
    expect(g().binocularUses).toBe(BINOCULAR_USES_PER_STAGE - 1);
    expect(g().timeRemaining).toBe(before - BINOCULAR_SECONDS);
    expect(g().binocularActive).toBe(true);
  });

  it("読み取るものが無くなったら使えない（理由もそう返る）", () => {
    const s = g().currentStudents()[0]!;
    g().useBinocular(s.id);
    g().endBinocularView();
    g().useBinocular(s.id);
    g().endBinocularView();

    const state = g().binocularState(s.id);
    expect(state.canUse).toBe(false);
    expect(state.reason).toBe("noHidden");
  });

  it("回数を使い切ったら使えない（時間不足とは区別される）", () => {
    // 現在地ではなくステージ全体から取る（1つの場所には2人しかいないことがある）
    const students = getStudents(3, "morning");
    // 別々の生徒に使って回数だけを消費する
    g().useBinocular(students[0]!.id);
    g().endBinocularView();
    g().useBinocular(students[1]!.id);
    g().endBinocularView();

    expect(g().binocularUses).toBe(0);
    const state = g().binocularState(students[2]!.id);
    expect(state.canUse).toBe(false);
    expect(state.reason).toBe("noUses");
  });

  it("残り時間が足りなければ使えない", () => {
    const s = g().currentStudents()[0]!;
    useGameStore.setState({ timeRemaining: BINOCULAR_SECONDS - 1 });
    const state = g().binocularState(s.id);
    expect(state.canUse).toBe(false);
    expect(state.reason).toBe("noTime");
  });

  it("使えない状態で呼んでも何も起きない", () => {
    const s = g().currentStudents()[0]!;
    useGameStore.setState({ binocularUses: 0 });
    const before = g().timeRemaining;

    g().useBinocular(s.id);

    expect(g().revealedHints[s.id]).toBeUndefined();
    expect(g().timeRemaining).toBe(before);
  });

  it("ステージが変わると回数が回復する", () => {
    const s = g().currentStudents()[0]!;
    g().useBinocular(s.id);
    g().endBinocularView();
    expect(g().binocularUses).toBe(BINOCULAR_USES_PER_STAGE - 1);

    g().endStage();
    g().advanceAfterStage();
    g().finishStory();

    expect(g().binocularUses).toBe(BINOCULAR_USES_PER_STAGE);
  });

  it("覗いている間はタイマーが止まる", () => {
    const s = g().currentStudents()[0]!;
    g().useBinocular(s.id);
    const before = g().timeRemaining;
    g().tick(5);
    expect(g().timeRemaining).toBe(before);
    g().endBinocularView();
    g().tick(5);
    expect(g().timeRemaining).toBe(before - 5);
  });
});
