/** セリフ欄の文字サイズ設定（保存・旧セーブの読み込み・セーブ消去）のテスト。 */

import { beforeEach, describe, expect, it } from "vitest";
import { TEXT_SIZES, isTextSize, textScale } from "../game/textSize";
import { mergeSave, useSaveStore } from "../store/saveStore";
import type { SaveData } from "../types/game";

const current: SaveData = {
  unlockedLoop: 1,
  bestScores: {},
  endings: [],
  settings: { bgmVolume: 0.6, seVolume: 0.8, textSize: "standard" },
};

describe("文字サイズ", () => {
  beforeEach(() => {
    useSaveStore.getState().setTextSize("standard");
    useSaveStore.getState().resetSave();
  });

  it("初期値は標準で、倍率は1", () => {
    expect(useSaveStore.getState().settings.textSize).toBe("standard");
    expect(textScale("standard")).toBe(1);
  });

  it("大きい段階ほど倍率が上がる", () => {
    const scales = TEXT_SIZES.map((t) => t.scale);
    expect(scales).toEqual([...scales].sort((a, b) => a - b));
    expect(new Set(scales).size).toBe(scales.length);
  });

  it("選んだ大きさが保存され、音量は変わらない", () => {
    const before = useSaveStore.getState().settings.bgmVolume;
    useSaveStore.getState().setTextSize("xlarge");
    expect(useSaveStore.getState().settings.textSize).toBe("xlarge");
    expect(useSaveStore.getState().settings.bgmVolume).toBe(before);
  });

  it("セーブを消去しても文字サイズは残る", () => {
    useSaveStore.getState().setTextSize("large");
    useSaveStore.getState().unlockLoop(3);
    useSaveStore.getState().resetSave();
    expect(useSaveStore.getState().unlockedLoop).toBe(1);
    expect(useSaveStore.getState().settings.textSize).toBe("large");
  });

  it("文字サイズを足す前のセーブデータは、音量を保ったまま標準で読み込む", () => {
    const old = { unlockedLoop: 2, settings: { bgmVolume: 0.3, seVolume: 0.5 } };
    const merged = mergeSave(old, current);
    expect(merged.unlockedLoop).toBe(2);
    expect(merged.settings).toEqual({ bgmVolume: 0.3, seVolume: 0.5, textSize: "standard" });
  });

  it("壊れた値が保存されていたら標準に戻す", () => {
    const merged = mergeSave({ settings: { textSize: "huge" } }, current);
    expect(merged.settings.textSize).toBe("standard");
    expect(isTextSize("huge")).toBe(false);
  });

  it("保存データが無ければ初期値のまま", () => {
    expect(mergeSave(undefined, current)).toEqual(current);
  });
});
