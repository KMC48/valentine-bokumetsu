/** localStorage に永続化するセーブデータ。 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isTextSize } from "../game/textSize";
import type { LoopId, SaveData, TextSize } from "../types/game";

type SaveStore = SaveData & {
  unlockLoop: (loop: LoopId) => void;
  recordScore: (loop: LoopId, score: number) => void;
  recordEnding: (endingId: string) => void;
  setVolume: (kind: "bgm" | "se", value: number) => void;
  setTextSize: (size: TextSize) => void;
  resetSave: () => void;
};

const INITIAL: SaveData = {
  unlockedLoop: 1,
  bestScores: {},
  endings: [],
  settings: { bgmVolume: 0.6, seVolume: 0.8, textSize: "standard" },
};

/**
 * 保存済みのデータを初期値に重ねる。
 *
 * 標準の重ね方は1段目だけなので、文字サイズを足す前のセーブデータを読むと
 * settings ごと置き換わって textSize が消える。settings も1段深く重ねて補う。
 */
export function mergeSave<T extends SaveData>(persisted: unknown, current: T): T {
  const saved = (persisted ?? {}) as Partial<SaveData>;
  const settings = { ...current.settings, ...saved.settings };
  if (!isTextSize(settings.textSize)) settings.textSize = current.settings.textSize;
  return { ...current, ...saved, settings };
}

export const useSaveStore = create<SaveStore>()(
  persist(
    (set) => ({
      ...INITIAL,

      unlockLoop: (loop) =>
        set((s) => ({ unlockedLoop: (Math.max(s.unlockedLoop, loop) as LoopId) })),

      recordScore: (loop, score) =>
        set((s) => {
          const key = `loop${loop}` as const;
          const best = s.bestScores[key] ?? Number.NEGATIVE_INFINITY;
          if (score <= best) return s;
          return { bestScores: { ...s.bestScores, [key]: score } };
        }),

      recordEnding: (endingId) =>
        set((s) => (s.endings.includes(endingId) ? s : { endings: [...s.endings, endingId] })),

      setVolume: (kind, value) =>
        set((s) => ({
          settings: {
            ...s.settings,
            [kind === "bgm" ? "bgmVolume" : "seVolume"]: Math.min(1, Math.max(0, value)),
          },
        })),

      setTextSize: (size) => set((s) => ({ settings: { ...s.settings, textSize: size } })),

      // 文字の大きさは進行状況ではなく読みやすさの設定なので、消去しても残す。
      // 目の悪い人がセーブを消した途端に文字が小さく戻ると、設定画面すら読めなくなる。
      resetSave: () =>
        set((s) => ({ ...INITIAL, settings: { ...INITIAL.settings, textSize: s.settings.textSize } })),
    }),
    { name: "valentine-annihilation-save-v1", merge: mergeSave },
  ),
);
