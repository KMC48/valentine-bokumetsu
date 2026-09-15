/** 通報判定・難易度・エンディング分岐・周回進行の結合テスト。 */

import { beforeEach, describe, expect, it } from "vitest";
import { areasFor, firstAreaFor, hasMultipleAreas } from "../data/areas";
import { AREA_MOVE_SECONDS } from "../data/score";
import { DESKS, countDeskChocolates, getDesks } from "../data/desks";
import { STUDENTS, countChocolateHolders, getStudents } from "../data/students";
import { judgeDeskSearch } from "../game/desk";
import { DESK_SEARCH_SECONDS } from "../data/score";
import { visibleHints } from "../game/difficulty";
import { meetsSpecialEnding, selectEnding } from "../game/ending";
import { annihilationRate, judgeReport } from "../game/report";
import { stageTargetTotal, useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";
import type { LoopId, RunStats, StageId, Student } from "../types/game";

const baseStats: RunStats = {
  score: 0,
  maxCombo: 0,
  correctReports: 0,
  falseReports: 0,
  friendCount: 0,
  honmeiCount: 0,
  specialCount: 0,
  deskFinds: 0,
  annihilationRate: 0,
};

function findByType(loop: LoopId, stage: StageId, type: Student["chocolateType"]): Student {
  const s = getStudents(loop, stage).find((x) => x.chocolateType === type);
  if (!s) throw new Error(`loop${loop}/${stage} に ${type} がいない`);
  return s;
}

describe("生徒データの健全性", () => {
  it("IDが重複していない", () => {
    const ids = STUDENTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("各周回・各ステージのターゲットは5つ（生徒＋机）", () => {
    for (const loop of [1, 2, 3] as LoopId[]) {
      for (const stage of ["morning", "lunch", "afterSchool"] as StageId[]) {
        const targets = getStudents(loop, stage).length + getDesks(loop, stage).length;
        expect(targets).toBe(5);
      }
    }
  });

  it("各周回に特殊本命が1人いる", () => {
    for (const loop of [1, 2, 3] as LoopId[]) {
      const specials = STUDENTS.filter((s) => s.loop === loop && s.chocolateType === "honmei_special");
      expect(specials).toHaveLength(1);
    }
  });

  it("位置は % 指定の範囲に収まっている", () => {
    for (const s of STUDENTS) {
      expect(s.position.x).toBeGreaterThanOrEqual(0);
      expect(s.position.x).toBeLessThanOrEqual(100);
      expect(s.position.y).toBeGreaterThanOrEqual(0);
      expect(s.position.y).toBeLessThanOrEqual(100);
    }
  });
});

describe("通報判定", () => {
  it("チョコ所持者の通報は成功、無実は誤認になる", () => {
    const friend = findByType(1, "morning", "friend");
    const innocent = findByType(1, "morning", "none");

    expect(judgeReport(friend, 0).success).toBe(true);
    expect(judgeReport(friend, 0).gainedPoints).toBe(100);
    expect(judgeReport(innocent, 0).success).toBe(false);
    expect(judgeReport(innocent, 0).gainedPoints).toBe(-300);
    expect(judgeReport(innocent, 5).comboAfter).toBe(0);
  });

  it("固有の結果テキストが使われる", () => {
    const s = findByType(1, "morning", "honmei");
    expect(judgeReport(s, 0).detail).toBe(s.reportResultText);
  });

  it("撲滅率は 0〜1 に収まる", () => {
    expect(annihilationRate(0, 10)).toBe(0);
    expect(annihilationRate(5, 10)).toBe(0.5);
    expect(annihilationRate(20, 10)).toBe(1);
    expect(annihilationRate(3, 0)).toBe(1);
  });
});

describe("周回ごとの難易度", () => {
  it("周回が進むほど見えるヒントが減る", () => {
    const s1 = getStudents(1, "morning")[0]!;
    const s2 = getStudents(2, "morning")[0]!;
    const s3 = getStudents(3, "morning")[0]!;
    expect(visibleHints(s1, 1).length).toBe(3);
    expect(visibleHints(s2, 2).length).toBe(2);
    expect(visibleHints(s3, 3).length).toBe(1);
  });
});

describe("エンディング分岐", () => {
  it("スコアに応じてランクEDが選ばれる", () => {
    expect(selectEnding({ ...baseStats, score: 6000, honmeiCount: 1 }).rank).toBe("S");
    expect(selectEnding({ ...baseStats, score: 3600, honmeiCount: 1 }).rank).toBe("A");
    expect(selectEnding({ ...baseStats, score: 2600, honmeiCount: 1 }).rank).toBe("B");
    expect(selectEnding({ ...baseStats, score: 1600, honmeiCount: 1 }).rank).toBe("C");
    expect(selectEnding({ ...baseStats, score: 0, honmeiCount: 1 }).rank).toBe("D");
  });

  it("本命3件以上かつ誤認0なら特殊ED", () => {
    const stats = { ...baseStats, score: 1000, honmeiCount: 2, specialCount: 1, falseReports: 0 };
    expect(meetsSpecialEnding(stats)).toBe(true);
    expect(selectEnding(stats).id).toBe("ending-special");
  });

  it("誤認があれば特殊EDにならない", () => {
    const stats = { ...baseStats, score: 1000, honmeiCount: 3, falseReports: 1 };
    expect(meetsSpecialEnding(stats)).toBe(false);
  });
});

describe("ゲーム進行（ストア）", () => {
  beforeEach(() => {
    useSaveStore.getState().resetSave();
    useGameStore.getState().goTitle();
  });

  it("ストーリー → 朝 → 昼 → 放課後 → 最終結果 と進む", () => {
    const g = () => useGameStore.getState();

    g().startRun(1);
    expect(g().screen).toBe("story");
    expect(g().storySlot).toBe("opening");

    g().finishStory();
    expect(g().screen).toBe("stage");
    expect(g().stage).toBe("morning");
    expect(g().timeRemaining).toBe(210);

    g().endStage();
    expect(g().screen).toBe("stageResult");

    g().advanceAfterStage();
    expect(g().storySlot).toBe("interlude1");
    g().finishStory();
    expect(g().stage).toBe("lunch");

    g().endStage();
    g().advanceAfterStage();
    g().finishStory();
    expect(g().stage).toBe("afterSchool");
    expect(g().timeRemaining).toBe(270);

    g().endStage();
    g().advanceAfterStage();
    expect(g().screen).toBe("finalResult");
  });

  it("通報でスコアとコンボが加算され、誤認でリセットされる", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();

    const friend = findByType(1, "morning", "friend");
    g().reportStudent(friend.id);
    expect(g().score).toBe(100);
    expect(g().combo).toBe(1);
    expect(g().friendCount).toBe(1);
    // 通報済みの生徒はステージから消える
    expect(g().currentStudents().some((s) => s.id === friend.id)).toBe(false);
    g().dismissOutcome();

    const honmei = findByType(1, "morning", "honmei");
    g().reportStudent(honmei.id);
    expect(g().score).toBe(600);
    expect(g().honmeiCount).toBe(1);
    g().dismissOutcome();

    const innocent = findByType(1, "morning", "none");
    g().reportStudent(innocent.id);
    expect(g().score).toBe(300);
    expect(g().combo).toBe(0);
    expect(g().falseReports).toBe(1);
    expect(g().maxCombo).toBe(2);
  });

  it("タイマーが0になるとステージが終了する", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();
    useGameStore.setState({ timeRemaining: 1 });
    g().tick(1);
    expect(g().timeRemaining).toBe(0);
    expect(g().screen).toBe("stageResult");
  });

  it("観察中はタイマーが止まる", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();
    const before = g().timeRemaining;
    g().selectStudent(getStudents(1, "morning")[0]!.id);
    g().tick(5);
    expect(g().timeRemaining).toBe(before);
    g().closeObservation();
    g().tick(5);
    expect(g().timeRemaining).toBe(before - 5);
  });

  it("摘発率は周回全体のチョコ所持者数を分母にする", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();
    const total = countChocolateHolders(1) + countDeskChocolates(1);
    expect(total).toBe(10);
    g().reportStudent(findByType(1, "morning", "friend").id);
    expect(g().stats().annihilationRate).toBeCloseTo(1 / total);
  });
});

describe("机を調べる", () => {
  it("机のIDが重複していない", () => {
    const ids = DESKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("チョコ入りの机は得点になり、コンボも伸びる", () => {
    const desk = DESKS.find((d) => d.content === "friend")!;
    const outcome = judgeDeskSearch(desk, 2);
    expect(outcome.found).toBe(true);
    expect(outcome.gainedPoints).toBe(120); // 3連続目なので ×1.2
    expect(outcome.comboAfter).toBe(3);
    expect(outcome.timeCost).toBe(DESK_SEARCH_SECONDS);
  });

  it("空の机は減点もコンボリセットも無い（時間だけ失う）", () => {
    const desk = DESKS.find((d) => d.content === "none")!;
    const outcome = judgeDeskSearch(desk, 4);
    expect(outcome.found).toBe(false);
    expect(outcome.gainedPoints).toBe(0);
    expect(outcome.comboAfter).toBe(4); // 誤認と違いコンボが切れない
    expect(outcome.timeCost).toBe(DESK_SEARCH_SECONDS);
  });

  it("机を調べるとその分だけ持ち時間が減る", () => {
    const g = () => useGameStore.getState();
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(1);
    g().finishStory();
    useGameStore.setState({ stage: "lunch" });

    const desk = getDesks(1, "lunch")[0]!;
    const before = g().timeRemaining;
    g().searchDesk(desk.id);
    expect(g().timeRemaining).toBe(before - DESK_SEARCH_SECONDS);
    // 調べ終わった机はステージから消える
    expect(g().currentDesks().some((d) => d.id === desk.id)).toBe(false);
  });

  it("机で見つけたチョコも撲滅率に数えられる", () => {
    const g = () => useGameStore.getState();
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(1);
    g().finishStory();
    useGameStore.setState({ stage: "lunch" });

    const chocolateDesk = getDesks(1, "lunch").find((d) => d.content !== "none")!;
    g().searchDesk(chocolateDesk.id);
    expect(g().deskFinds).toBe(1);
    expect(g().stats().deskFinds).toBe(1);
    expect(g().stats().annihilationRate).toBeCloseTo(1 / 10);
  });
});

describe("場所の切り替え", () => {
  it("全周回・全ステージで複数の場所を回れる", () => {
    for (const loop of [1, 2, 3] as LoopId[]) {
      for (const stage of ["morning", "lunch", "afterSchool"] as StageId[]) {
        expect(areasFor(loop, stage).length).toBeGreaterThanOrEqual(3);
        expect(hasMultipleAreas(loop, stage)).toBe(true);
      }
    }
  });

  it("学校ごとに別の場所背景を使う（同じ絵を使い回していない）", () => {
    const backgroundsOf = (loop: LoopId) =>
      new Set(
        (["morning", "lunch", "afterSchool"] as StageId[]).flatMap((st) =>
          areasFor(loop, st).map((a) => a.background),
        ),
      );
    const l1 = backgroundsOf(1);
    const l2 = backgroundsOf(2);
    const l3 = backgroundsOf(3);
    for (const bg of l2) expect(l1.has(bg)).toBe(false);
    for (const bg of l3) expect(l1.has(bg)).toBe(false);
    for (const bg of l3) expect(l2.has(bg)).toBe(false);
  });

  it("全生徒が、そのステージに存在する場所に割り当てられている", () => {
    for (const s of STUDENTS) {
      const ids = areasFor(s.loop, s.stage).map((a) => a.id);
      expect(ids).toContain(s.area);
    }
  });

  it("移動すると時間を消費し、その場所の生徒だけが見える", () => {
    const g = () => useGameStore.getState();
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(1);
    g().finishStory();

    expect(g().area).toBe(firstAreaFor(1, "morning"));
    const here = g().currentStudents();
    expect(here.every((s) => s.area === g().area)).toBe(true);

    const before = g().timeRemaining;
    const next = areasFor(1, "morning")[1]!;
    g().moveToArea(next.id);
    expect(g().area).toBe(next.id);
    expect(g().timeRemaining).toBe(before - AREA_MOVE_SECONDS);
    expect(g().currentStudents().every((s) => s.area === next.id)).toBe(true);
  });

  it("同じ場所へ移動しても時間は減らない", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();
    const before = g().timeRemaining;
    g().moveToArea(g().area);
    expect(g().timeRemaining).toBe(before);
  });

  it("【回帰】ある場所の生徒を全員見送っても、他の場所に残っていればステージは終わらない", () => {
    const g = () => useGameStore.getState();
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(1);
    g().finishStory();

    // 中庭は1人だけ。その1人を見送っても、校門・昇降口にはまだ生徒がいる。
    g().moveToArea("courtyard");
    const here = g().currentStudents();
    expect(here.length).toBeGreaterThan(0);
    for (const s of here) g().passStudent(s.id);

    expect(g().currentStudents()).toHaveLength(0); // この場所は空になった
    expect(g().stageRemaining()).toBeGreaterThan(0); // でもステージ全体では残っている
    expect(g().screen).toBe("stage"); // なのでステージは続く
  });

  it("ステージ全体の対象が尽きたらステージ終了", () => {
    const g = () => useGameStore.getState();
    useSaveStore.getState().resetSave();
    g().goTitle();
    g().startRun(1);
    g().finishStory();

    // 全ての場所の生徒を見送る
    for (const a of areasFor(1, "morning")) {
      g().moveToArea(a.id);
      for (const s of g().currentStudents()) g().passStudent(s.id);
    }
    expect(g().stageRemaining()).toBe(0);
    expect(g().screen).toBe("stageResult");
  });

  it("ミッションの分母はステージ全体（場所をまたいで数える）", () => {
    const g = () => useGameStore.getState();
    g().startRun(1);
    g().finishStory();
    // 朝ステージのチョコ所持者は3人。どの場所にいても分母は変わらない。
    expect(stageTargetTotal(1, "morning")).toBe(3);
  });
});

describe("周回解放とセーブ", () => {
  beforeEach(() => {
    useSaveStore.getState().resetSave();
    useGameStore.getState().goTitle();
  });

  it("1周目クリアで2周目、2周目クリアで3周目が解放される", () => {
    const g = () => useGameStore.getState();
    expect(useSaveStore.getState().unlockedLoop).toBe(1);

    g().startRun(1);
    useGameStore.setState({ score: 4000 });
    g().goEnding();
    expect(useSaveStore.getState().unlockedLoop).toBe(2);
    expect(useSaveStore.getState().bestScores.loop1).toBe(4000);

    g().startRun(2);
    useGameStore.setState({ score: 1000 });
    g().goEnding();
    expect(useSaveStore.getState().unlockedLoop).toBe(3);

    g().startRun(3);
    useGameStore.setState({ score: 100 });
    g().goEnding();
    // 3周目より先は無い
    expect(useSaveStore.getState().unlockedLoop).toBe(3);
  });

  it("ベストスコアは更新時のみ書き換わる", () => {
    const save = useSaveStore.getState();
    save.recordScore(1, 1000);
    save.recordScore(1, 500);
    expect(useSaveStore.getState().bestScores.loop1).toBe(1000);
    save.recordScore(1, 2000);
    expect(useSaveStore.getState().bestScores.loop1).toBe(2000);
  });

  it("到達エンディングは重複しない", () => {
    const save = useSaveStore.getState();
    save.recordEnding("ending-s");
    save.recordEnding("ending-s");
    save.recordEnding("ending-a");
    expect(useSaveStore.getState().endings).toEqual(["ending-s", "ending-a"]);
  });
});
