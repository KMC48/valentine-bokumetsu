/** localStorage に永続化するセーブデータ。 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoopId, SaveData } from "../types/game";

type SaveStore = SaveData & {
  unlockLoop: (loop: LoopId) => void;
  recordScore: (loop: LoopId, score: number) => void;
  recordEnding: (endingId: string) => void;
  setVolume: (kind: "bgm" | "se", value: number) => void;
  resetSave: () => void;
};

const INITIAL: SaveData = {
  unlockedLoop: 1,
  bestScores: {},
  endings: [],
  settings: { bgmVolume: 0.6, seVolume: 0.8 },
};

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

      resetSave: () => set({ ...INITIAL }),
    }),
    { name: "valentine-annihilation-save-v1" },
  ),
);
