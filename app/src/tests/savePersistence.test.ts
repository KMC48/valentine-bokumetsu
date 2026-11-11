/** 実際の永続化ミドルウェアを通し、保存内容・消去・再起動時の復元を確認する。 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TextSize } from "../types/game";

const KEY = "valentine-annihilation-save-v1";

// Node環境でStorageを用意する。ストアをimportする前に差し込み、persist自体はmockしない。
function makeStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}

async function loadStore() {
  vi.resetModules();
  return (await import("../store/saveStore")).useSaveStore;
}

describe("セーブデータの保存・初期化契約", () => {
  beforeEach(() => {
    const storage = makeStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { localStorage: storage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("5種類の記録・設定を保存し、新しいストアの起動時に復元する", async () => {
    const store = await loadStore();
    const actions = store.getState();
    actions.unlockLoop(3);
    actions.unlockLoop(2);
    actions.recordScore(1, 420);
    actions.recordScore(1, 100);
    actions.recordScore(2, -20);
    actions.recordScore(3, 720);
    actions.recordEnding("ending-a");
    actions.recordEnding("ending-a");
    actions.recordEnding("ending-b");
    actions.setVolume("bgm", 0.2);
    actions.setVolume("se", 0.4);
    actions.setTextSize("xlarge");
    const state = {
      unlockedLoop: 3,
      bestScores: { loop1: 420, loop2: -20, loop3: 720 },
      endings: ["ending-a", "ending-b"],
      settings: { bgmVolume: 0.2, seVolume: 0.4, textSize: "xlarge" },
    };
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ state, version: 0 });
    expect(localStorage.length).toBe(1);
    const restarted = await loadStore();
    expect(restarted.getState()).toMatchObject(state);
    expect(restarted.persist.hasHydrated()).toBe(true);
  });

  it.each<TextSize>(["standard", "large", "xlarge"])(
    "消去後は文字サイズ%sだけを保持し、再起動後も記録と音量は初期値になる",
    async (textSize) => {
      const store = await loadStore();
      const actions = store.getState();
      actions.unlockLoop(3);
      actions.recordScore(1, 420);
      actions.recordScore(2, 500);
      actions.recordScore(3, 720);
      actions.recordEnding("ending-a");
      actions.setVolume("bgm", 0.1);
      actions.setVolume("se", 0.3);
      actions.setTextSize(textSize);
      localStorage.setItem("unrelated-site-data", "keep");
      actions.resetSave();
      const state = {
        unlockedLoop: 1,
        bestScores: {},
        endings: [],
        settings: { bgmVolume: 0.6, seVolume: 0.8, textSize },
      };
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ state, version: 0 });
      expect(localStorage.getItem("unrelated-site-data")).toBe("keep");
      expect((await loadStore()).getState()).toMatchObject(state);
    },
  );

  it("文字サイズ導入前の保存JSONでも成績と音量を復元し、文字サイズを標準で補う", async () => {
    const old = {
      unlockedLoop: 2,
      bestScores: { loop1: 120 },
      endings: ["ending-a"],
      settings: { bgmVolume: 0.25, seVolume: 0.5 },
    };
    localStorage.setItem(KEY, JSON.stringify({ state: old, version: 0 }));
    const store = await loadStore();
    expect(store.getState()).toMatchObject({ ...old, settings: { ...old.settings, textSize: "standard" } });
    store.getState().setTextSize("large");
    expect(JSON.parse(localStorage.getItem(KEY)!).state).toEqual({
      ...old, settings: { ...old.settings, textSize: "large" },
    });
  });

  it("保存領域を削除してから再起動すると文字サイズも初期値に戻る", async () => {
    const store = await loadStore();
    store.getState().setTextSize("xlarge");
    store.getState().unlockLoop(3);
    localStorage.removeItem(KEY);
    expect((await loadStore()).getState()).toMatchObject({
      unlockedLoop: 1, bestScores: {}, endings: [],
      settings: { bgmVolume: 0.6, seVolume: 0.8, textSize: "standard" },
    });
  });
});
