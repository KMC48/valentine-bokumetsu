import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { ObservationModal } from "../components/ObservationModal";
import { DeskConfirmModal, DeskResultModal } from "../components/DeskModals";
import { Signage } from "../components/Signage";
import { StudentTarget } from "../components/StudentTarget";
import { getArea } from "../data/areas";
import { DESKS } from "../data/desks";
import { STUDENTS, getStudents } from "../data/students";
import { BINOCULAR_SECONDS, DESK_SEARCH_SECONDS } from "../data/score";
import { judgeDeskSearch } from "../game/desk";
import { selectEnding } from "../game/ending";
import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";

const g = () => useGameStore.getState();
const noop = () => {};

beforeEach(() => {
  g().goTitle();
  g().setDebug(false);
  useSaveStore.getState().resetSave();
});

describe("観察で推理するための情報の境界", () => {
  it.each([1, 2, 3])("%i周目は同じ怪しさレベルに所持者と無実が混在する", (loop) => {
    const students = STUDENTS.filter((s) => s.loop === loop);
    for (const level of new Set(students.map((s) => s.suspicionLevel))) {
      const outcomes = new Set(students.filter((s) => s.suspicionLevel === level).map((s) => s.chocolateType !== "none"));
      expect(outcomes.size, `loop ${loop}, level ${level}`).toBe(2);
    }
  });

  it("独白にまとめても、未開示の推理は先に表示しない", () => {
    const student = getStudents(3, "morning")[0]!;
    const props = { student, loop: student.loop, revealed: 0, binocularUses: 2, binocularCanUse: true,
      binocularReason: "ok" as const, onUseBinocular: noop, debug: false, onReport: noop, onPass: noop, onClose: noop };
    const initial = renderToStaticMarkup(createElement(ObservationModal, props));
    expect(initial).toContain(student.hints[0]);
    expect(initial).not.toContain(student.hints[1]);
    expect(initial).not.toContain(student.hints[2]);
    const revealed = renderToStaticMarkup(createElement(ObservationModal, { ...props, revealed: 1 }));
    expect(revealed).toContain(student.hints.slice(0, 2).join(""));
    expect(revealed).not.toContain(student.hints[2]);
    expect(initial).toContain("怪しさレベル");
    expect(initial).toContain("保留して戻る");
  });

  it("通報前に読めた推理だけを結果の振り返りに保存する", () => {
    g().startRun(3); g().finishStory();
    const student = getStudents(3, "morning")[0]!;
    g().reportStudent(student.id);
    expect(g().lastOutcome?.observedThought).toBe(student.hints[0]);
    expect(g().lastOutcome?.observedThought).not.toContain(student.hints[1]);
  });

  it("生徒の正解によらずビックリマークは出ない", () => {
    for (const student of STUDENTS) {
      const html = renderToStaticMarkup(createElement(StudentTarget, {
        student, loop: student.loop, view: getArea(student.area), selected: false, debug: false, onSelect: noop,
      }));
      expect(html).not.toContain("target__mark");
    }
  });

  it("全校の横断幕を消し、教室の掲示物を残す", () => {
    for (const areaId of ["gate", "gateAfter", "entrance", "l2Gate", "l3Gate"]) {
      expect(renderToStaticMarkup(createElement(Signage, { areaId }))).toBe("");
    }
    expect(renderToStaticMarkup(createElement(Signage, { areaId: "classroom" }))).toContain("signage");
  });

  it("机は選択前の推理と発見後の反応を分ける", () => {
    for (const desk of DESKS) {
      const before = renderToStaticMarkup(createElement(DeskConfirmModal, { desk, timeRemaining: 100, onSearch: noop, onCancel: noop }));
      expect(before).toContain(desk.searchThought);
      expect(before).not.toContain(desk.resultText);
      const after = renderToStaticMarkup(createElement(DeskResultModal, { outcome: judgeDeskSearch(desk, 0), onClose: noop }));
      expect(after).toContain(desk.resultText);
      expect(after).not.toContain("［手がかり］");
      expect(after).not.toContain(desk.searchThought);
    }
  });
});

describe("読書中の時間と調査の確定", () => {
  it.each(["menu", "help", "hidden"] as const)("%sで止め、閉じると時間が進む", (reason) => {
    g().startRun(1); g().finishStory();
    const time = g().timeRemaining;
    g().setPaused(reason, true); g().tick(30);
    expect(g().timeRemaining).toBe(time);
    g().setPaused(reason, false); g().tick(1);
    expect(g().timeRemaining).toBe(time - 1);
  });

  it("メニューを閉じても他の停止理由や手動停止を解除しない", () => {
    g().startRun(1); g().finishStory();
    const time = g().timeRemaining;
    g().setPaused("menu", true); g().setPaused("hidden", true);
    g().setPaused("menu", false); g().tick(30);
    expect(g().timeRemaining).toBe(time);
    g().toggleTimer(); g().setPaused("hidden", false); g().tick(30);
    expect(g().timeRemaining).toBe(time);
    g().goTitle(); g().startRun(1); g().finishStory(); g().tick(1);
    expect(g().timeRemaining).toBe(time - 1);
  });

  it("保留した生徒は再観察でき、見送った生徒は二重判定できない", () => {
    g().startRun(1); g().finishStory();
    const student = getStudents(1, "morning").find((s) => s.chocolateType === "none")!;
    g().moveToArea(student.area);
    g().selectStudent(student.id); g().closeObservation();
    expect(g().currentStudents()).toContain(student);
    expect(g().passedIds).toEqual([]);
    g().selectStudent(student.id); g().passStudent(student.id);
    g().passStudent(student.id); g().reportStudent(student.id);
    expect(g().currentStudents()).not.toContain(student);
    expect(g().stats().correctPasses).toBe(1);
    expect(g().stats().missedPasses).toBe(0);
    expect(g().falseReports).toBe(0);
    expect(g().score).toBe(0);
  });

  it("双眼鏡の文章表示中は30秒以上進めても追加の時間を消費しない", () => {
    g().startRun(3); g().finishStory();
    const id = getStudents(3, "morning")[0]!.id;
    g().selectStudent(id);
    const time = g().timeRemaining;
    g().useBinocular(id); g().tick(30);
    expect(g().binocularActive).toBe(true);
    expect(g().timeRemaining).toBe(time - BINOCULAR_SECONDS);
    g().endBinocularView();
    expect(g().binocularActive).toBe(false);
    expect(g().observing).toBe(true);
  });

  it("机の捜索時間が足りなければ結果・得点を確定しない", () => {
    g().startRun(1); g().finishStory();
    useGameStore.setState({ stage: "lunch", area: "classroom", timeRemaining: DESK_SEARCH_SECONDS - 1 });
    g().searchDesk(DESKS[0]!.id);
    expect(g().lastDeskOutcome).toBeNull();
    expect(g().score).toBe(0);
    expect(g().searchedDeskIds).toEqual([]);
  });

  it("最後の対象が机でも、結果を読み終えるとステージを終える", () => {
    g().startRun(1); g().finishStory();
    useGameStore.setState({ stage: "lunch", area: "classroom" });
    for (const student of getStudents(1, "lunch")) g().passStudent(student.id);
    for (const desk of DESKS) {
      g().searchDesk(desk.id);
      expect(g().screen).toBe("stage");
      g().dismissDeskOutcome();
    }
    expect(g().screen).toBe("stageResult");
  });
});

describe("プレイ内容と結末の整合", () => {
  it("低スコアでも誤認0なら誤認を責めず、正しい見送りを認める", () => {
    const ending = selectEnding({ ...g().stats(), score: 100, correctReports: 1, correctPasses: 2 });
    const text = ending.lines.map((l) => l.text).join("");
    expect(ending.rank).toBe("D");
    expect(text).toContain("誤認通報はなかった");
    expect(text).toContain("無実の2人");
    expect(text).not.toContain("多すぎる");
  });

  it("誤認1件を多数の誤認と描写しない", () => {
    const text = selectEnding({ ...g().stats(), falseReports: 1 }).lines.map((l) => l.text).join("");
    expect(text).toContain("誤認通報は1件");
    expect(text).not.toContain("多すぎる");
  });

  it("Sランクの結末を表示したあとに特殊後日談を追加し、両方記録する", () => {
    g().startRun(3);
    useGameStore.setState({ score: 6000, honmeiCount: 3 });
    g().goEnding();
    expect(g().ending?.id).toBe("ending-s");
    expect(g().epilogue?.id).toBe("ending-special");
    expect(useSaveStore.getState().endings).toEqual(["ending-s"]);
    g().showEpilogue();
    expect(g().ending?.id).toBe("ending-special");
    expect(g().epilogue).toBeNull();
    expect(useSaveStore.getState().endings).toEqual(["ending-s", "ending-special"]);
  });
});
