/**
 * 1プレイ分のランタイム状態。永続化は saveStore が担当する。
 * 画面遷移は screen / stage / storySlot の組み合わせで表現する。
 */

import { create } from "zustand";
import { AREA_MOVE_SECONDS, BINOCULAR_SECONDS, BINOCULAR_USES_PER_STAGE } from "../data/score";
import { STAGES, UNLIMITED_TIME } from "../data/stages";
import { firstAreaFor } from "../data/areas";
import { countDeskChocolates, getDesks } from "../data/desks";
import { countChocolateHolders, getStudents } from "../data/students";
import { judgeDeskSearch } from "../game/desk";
import { hiddenHintCount } from "../game/difficulty";
import { selectEnding } from "../game/ending";
import { annihilationRate, judgeReport } from "../game/report";
import type {
  DeskOutcome,
  EndingDef,
  LoopId,
  ReportOutcome,
  RunStats,
  ScreenId,
  StageId,
  StoryScene,
  Student,
} from "../types/game";
import { useSaveStore } from "./saveStore";

/** ストーリーのどのスロットを表示中か。 */
type StorySlot = StoryScene["slot"];

type GameState = {
  screen: ScreenId;
  loop: LoopId;
  stage: StageId;
  /** 現在いる場所（data/areas.ts のID）。 */
  area: string;
  storySlot: StorySlot;

  score: number;
  combo: number;
  maxCombo: number;

  correctReports: number;
  falseReports: number;
  friendCount: number;
  honmeiCount: number;
  specialCount: number;

  /** 通報済み生徒ID（ステージから消える）。 */
  reportedIds: string[];
  /** 「見送った」生徒ID（ステージから消えるが得点に影響しない）。 */
  passedIds: string[];
  /** 調べ終わった机のID。 */
  searchedDeskIds: string[];
  /** 机でチョコを見つけた回数（撲滅率の分子に足す）。 */
  deskFinds: number;
  /** 確認ダイアログを出している机のID。 */
  selectedDeskId: string | null;
  /** 直前に調べた机の結果。 */
  lastDeskOutcome: DeskOutcome | null;

  /** 双眼鏡の残り使用回数（ステージごとに回復）。 */
  binocularUses: number;
  /** 生徒IDごとに、双眼鏡で追加開示した手がかりの件数。 */
  revealedHints: Record<string, number>;
  /** 覗き込み演出を表示中か。 */
  binocularActive: boolean;

  timeRemaining: number;
  timerFrozen: boolean;

  selectedStudentId: string | null;
  /** 観察モーダルを開いているか（開いている間はタイマーが止まる）。 */
  observing: boolean;
  lastOutcome: ReportOutcome | null;

  /** ステージ開始時のスコア（ステージ結果の差分表示用）。 */
  stageStartScore: number;
  /** ステージ開始時の摘発数。 */
  stageStartCaught: number;

  ending: EndingDef | null;
  debug: boolean;
};

type GameActions = {
  setDebug: (on: boolean) => void;
  goTitle: () => void;
  goLoopSelect: () => void;
  goSettings: () => void;

  startRun: (loop: LoopId) => void;

  /** ストーリーを読み終えた（→ 対応するステージへ）。 */
  finishStory: () => void;

  /** 場所を移動する（時間を消費する）。 */
  moveToArea: (area: string) => void;

  tick: (delta: number) => void;
  toggleTimer: () => void;

  selectStudent: (id: string | null) => void;
  closeObservation: () => void;
  reportStudent: (id: string) => void;
  /** 机を選ぶ（確認ダイアログを出す）。 */
  selectDesk: (id: string | null) => void;
  /** 机を調べる（時間を消費し、中身を判定する）。 */
  searchDesk: (id: string) => void;
  dismissDeskOutcome: () => void;

  /** 双眼鏡で手がかりを1件開示する。 */
  useBinocular: (studentId: string) => void;
  /** 覗き込み演出を閉じる。 */
  endBinocularView: () => void;
  /** その生徒に双眼鏡を使えるか（使えない理由も返す）。 */
  binocularState: (studentId: string) => {
    canUse: boolean;
    reason: "ok" | "noHidden" | "noUses" | "noTime";
  };
  /** 現在ステージの未調査の机。 */
  currentDesks: () => import("../types/game").DeskSpot[];
  /**
   * ステージ全体（全ての場所）に残っている対象の数。
   * ステージ終了判定にはこちらを使うこと。
   * currentStudents() は「今いる場所」だけなので終了判定には使えない。
   */
  stageRemaining: () => number;
  passStudent: (id: string) => void;
  dismissOutcome: () => void;

  /** タイマー切れ or 全員処理済みでステージ終了。 */
  endStage: () => void;
  /** ステージ結果 → 次のストーリー or 最終結果。 */
  advanceAfterStage: () => void;
  /** 最終結果 → エンディング（解放処理もここ）。 */
  goEnding: () => void;

  /** 現在ステージの残りターゲット。 */
  currentStudents: () => Student[];
  /** 現在ステージでチョコ所持者を何人押さえたか。 */
  stageCaught: () => number;
  stats: () => RunStats;
};

export type GameStore = GameState & GameActions;

const INITIAL_RUN = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctReports: 0,
  falseReports: 0,
  friendCount: 0,
  honmeiCount: 0,
  specialCount: 0,
  reportedIds: [] as string[],
  passedIds: [] as string[],
  searchedDeskIds: [] as string[],
  deskFinds: 0,
  selectedDeskId: null,
  lastDeskOutcome: null,
  binocularUses: BINOCULAR_USES_PER_STAGE,
  revealedHints: {} as Record<string, number>,
  binocularActive: false,
  selectedStudentId: null,
  observing: false,
  lastOutcome: null,
  stageStartScore: 0,
  stageStartCaught: 0,
  ending: null,
};

function stageTime(stage: StageId, debug: boolean): number {
  return debug ? UNLIMITED_TIME : STAGES[stage].timeLimit;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "title",
  loop: 1,
  stage: "morning",
  area: firstAreaFor(1, "morning"),
  storySlot: "opening",
  timeRemaining: STAGES.morning.timeLimit,
  timerFrozen: false,
  debug: false,
  ...INITIAL_RUN,

  setDebug: (on) => set({ debug: on }),

  goTitle: () => set({ screen: "title", ...INITIAL_RUN }),
  goLoopSelect: () => set({ screen: "loopSelect" }),
  goSettings: () => set({ screen: "settings" }),

  startRun: (loop) =>
    set({
      screen: "story",
      loop,
      stage: "morning",
      area: firstAreaFor(loop, "morning"),
      storySlot: "opening",
      timeRemaining: stageTime("morning", get().debug),
      timerFrozen: false,
      ...INITIAL_RUN,
    }),

  finishStory: () => {
    const { storySlot, debug } = get();
    const stage: StageId =
      storySlot === "opening" ? "morning" : storySlot === "interlude1" ? "lunch" : "afterSchool";
    set((s) => ({
      screen: "stage",
      stage,
      area: firstAreaFor(s.loop, stage),
      timeRemaining: stageTime(stage, debug),
      selectedStudentId: null,
      observing: false,
      lastOutcome: null,
      selectedDeskId: null,
      lastDeskOutcome: null,
      // 双眼鏡はステージごとに回復する。
      binocularUses: BINOCULAR_USES_PER_STAGE,
      binocularActive: false,
      stageStartScore: s.score,
      stageStartCaught: s.correctReports,
    }));
  },

  tick: (delta) => {
    const { timerFrozen, timeRemaining, screen, lastOutcome, observing } = get();
    const { selectedDeskId, lastDeskOutcome } = get();
    if (screen !== "stage" || timerFrozen) return;
    // 観察中・結果表示中は時間を止める（じっくり推理させる）。
    if (lastOutcome || observing || selectedDeskId || lastDeskOutcome) return;
    if (get().binocularActive) return;
    const next = Math.max(0, timeRemaining - delta);
    set({ timeRemaining: next });
    if (next === 0) get().endStage();
  },

  toggleTimer: () => set((s) => ({ timerFrozen: !s.timerFrozen })),

  selectStudent: (id) => set({ selectedStudentId: id, observing: id !== null }),

  closeObservation: () => set({ observing: false }),

  reportStudent: (id) => {
    const state = get();
    if (state.reportedIds.includes(id)) return;
    const student = getStudents(state.loop, state.stage).find((s) => s.id === id);
    if (!student) return;

    const outcome = judgeReport(student, state.combo);
    const success = outcome.success;

    set({
      score: state.score + outcome.gainedPoints,
      combo: outcome.comboAfter,
      maxCombo: Math.max(state.maxCombo, outcome.comboAfter),
      correctReports: state.correctReports + (success ? 1 : 0),
      falseReports: state.falseReports + (success ? 0 : 1),
      friendCount: state.friendCount + (outcome.chocolateType === "friend" ? 1 : 0),
      honmeiCount: state.honmeiCount + (outcome.chocolateType === "honmei" ? 1 : 0),
      specialCount: state.specialCount + (outcome.chocolateType === "honmei_special" ? 1 : 0),
      reportedIds: [...state.reportedIds, id],
      selectedStudentId: null,
      observing: false,
      lastOutcome: outcome,
    });
  },

  moveToArea: (area) => {
    const state = get();
    if (state.area === area) return;
    const next = Math.max(0, state.timeRemaining - AREA_MOVE_SECONDS);
    set({
      area,
      // 移動には時間がかかる。どこをどの順で回るかが時間配分の判断になる。
      timeRemaining: next,
      selectedStudentId: null,
      observing: false,
      selectedDeskId: null,
    });
    if (next === 0) get().endStage();
  },

  selectDesk: (id) => set({ selectedDeskId: id }),

  searchDesk: (id) => {
    const state = get();
    if (state.searchedDeskIds.includes(id)) return;
    const desk = getDesks(state.loop, state.stage).find((d) => d.id === id);
    if (!desk) return;

    const outcome = judgeDeskSearch(desk, state.combo);

    set({
      score: state.score + outcome.gainedPoints,
      combo: outcome.comboAfter,
      maxCombo: Math.max(state.maxCombo, outcome.comboAfter),
      friendCount: state.friendCount + (outcome.content === "friend" ? 1 : 0),
      honmeiCount: state.honmeiCount + (outcome.content === "honmei" ? 1 : 0),
      deskFinds: state.deskFinds + (outcome.found ? 1 : 0),
      searchedDeskIds: [...state.searchedDeskIds, id],
      // 当たり外れに関わらず時間を消費する（机の唯一のリスク）。
      timeRemaining: Math.max(0, state.timeRemaining - outcome.timeCost),
      selectedDeskId: null,
      lastDeskOutcome: outcome,
    });
  },

  binocularState: (studentId) => {
    const state = get();
    const student = getStudents(state.loop, state.stage).find((s) => s.id === studentId);
    if (!student) return { canUse: false, reason: "noHidden" as const };

    const revealed = state.revealedHints[studentId] ?? 0;
    // 読み取れる手がかりが残っていなければ使う意味がない。
    if (hiddenHintCount(student, state.loop, revealed) === 0) {
      return { canUse: false, reason: "noHidden" as const };
    }
    // 回数切れと時間不足は、プレイヤーには別の状況なので区別して返す。
    if (state.binocularUses <= 0) return { canUse: false, reason: "noUses" as const };
    if (state.timeRemaining < BINOCULAR_SECONDS) {
      return { canUse: false, reason: "noTime" as const };
    }
    return { canUse: true, reason: "ok" as const };
  },

  useBinocular: (studentId) => {
    const state = get();
    if (!state.binocularState(studentId).canUse) return;

    const next = Math.max(0, state.timeRemaining - BINOCULAR_SECONDS);
    set({
      revealedHints: {
        ...state.revealedHints,
        [studentId]: (state.revealedHints[studentId] ?? 0) + 1,
      },
      binocularUses: state.binocularUses - 1,
      timeRemaining: next,
      binocularActive: true,
    });
  },

  endBinocularView: () => {
    set({ binocularActive: false });
    // 覗いている間に時間が尽きていたらステージ終了。
    if (get().timeRemaining <= 0) get().endStage();
  },

  dismissDeskOutcome: () => {
    set({ lastDeskOutcome: null });
    if (get().timeRemaining <= 0) get().endStage();
  },

  currentDesks: () => {
    const { loop, stage, area, searchedDeskIds } = get();
    return getDesks(loop, stage, area).filter((d) => !searchedDeskIds.includes(d.id));
  },

  stageRemaining: () => {
    const { loop, stage, reportedIds, passedIds, searchedDeskIds } = get();
    // 場所を指定せず、ステージ全体から数える。
    const students = getStudents(loop, stage).filter(
      (s) => !reportedIds.includes(s.id) && !passedIds.includes(s.id),
    ).length;
    const desks = getDesks(loop, stage).filter((d) => !searchedDeskIds.includes(d.id)).length;
    return students + desks;
  },

  passStudent: (id) => {
    set((s) => ({
      passedIds: s.passedIds.includes(id) ? s.passedIds : [...s.passedIds, id],
      selectedStudentId: null,
      observing: false,
    }));
    // ステージ全体で対象が尽きたときだけ終了する。
    // （今いる場所が空になっただけでは終わらせない）
    if (get().stageRemaining() === 0) get().endStage();
  },

  dismissOutcome: () => {
    set({ lastOutcome: null });
    // ステージ全体で対象が尽きたときだけ終了する。
    if (get().stageRemaining() === 0) get().endStage();
  },

  endStage: () =>
    set({
      screen: "stageResult",
      selectedStudentId: null,
      observing: false,
      lastOutcome: null,
      selectedDeskId: null,
      lastDeskOutcome: null,
    }),

  advanceAfterStage: () => {
    const { stage } = get();
    if (stage === "morning") {
      set({ screen: "story", storySlot: "interlude1" });
    } else if (stage === "lunch") {
      set({ screen: "story", storySlot: "interlude2" });
    } else {
      set({ screen: "finalResult" });
    }
  },

  goEnding: () => {
    const state = get();
    const stats = state.stats();
    const ending = selectEnding(stats);

    const save = useSaveStore.getState();
    save.recordScore(state.loop, stats.score);
    save.recordEnding(ending.id);
    // クリアで次の周回を解放。
    if (state.loop < 3) save.unlockLoop((state.loop + 1) as LoopId);

    set({ screen: "ending", ending });
  },

  currentStudents: () => {
    const { loop, stage, area, reportedIds, passedIds } = get();
    return getStudents(loop, stage, area).filter(
      (s) => !reportedIds.includes(s.id) && !passedIds.includes(s.id),
    );
  },

  stageCaught: () => {
    const { loop, stage, reportedIds, searchedDeskIds } = get();
    const fromStudents = getStudents(loop, stage).filter(
      (s) => reportedIds.includes(s.id) && s.chocolateType !== "none",
    ).length;
    const fromDesks = getDesks(loop, stage).filter(
      (d) => searchedDeskIds.includes(d.id) && d.content !== "none",
    ).length;
    return fromStudents + fromDesks;
  },

  stats: () => {
    const s = get();
    // 撲滅率の分母・分子には机のチョコも含める。
    const total = countChocolateHolders(s.loop) + countDeskChocolates(s.loop);
    return {
      score: s.score,
      maxCombo: s.maxCombo,
      correctReports: s.correctReports,
      falseReports: s.falseReports,
      friendCount: s.friendCount,
      honmeiCount: s.honmeiCount,
      specialCount: s.specialCount,
      deskFinds: s.deskFinds,
      annihilationRate: annihilationRate(s.correctReports + s.deskFinds, total),
    };
  },
}));

/** ステージ内のチョコ所持者総数（ミッション表記 x/y の分母）。 */
export function stageTargetTotal(loop: LoopId, stage: StageId): number {
  return countChocolateHolders(loop, stage) + countDeskChocolates(loop, stage);
}
