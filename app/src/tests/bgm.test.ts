/** BGMの選曲ロジック。音を鳴らす処理とは分離してあるのでここだけテストできる。 */

import { describe, expect, it } from "vitest";
import { BGM, BGM_FORMAT, bgmSrc, type BgmId } from "../data/bgm";
import { bgmForScreen } from "../game/bgmSelect";
import type { ScreenId, StageId } from "../types/game";

describe("BGMデータ", () => {
  it("3曲とも定義され、ループ終端と音量が設定されている", () => {
    const ids: BgmId[] = ["pop", "youth", "dark"];
    for (const id of ids) {
      const track = BGM[id];
      expect(bgmSrc(track)).toBe(`assets/bgm/${track.file}.${BGM_FORMAT}`);
      expect(track.loopEnd).toBeGreaterThan(0);
      expect(track.gain).toBeGreaterThan(0);
      expect(track.gain).toBeLessThanOrEqual(1);
    }
  });

  // Web公開版はMP3。WAVは合計37MBあり配信に重いため、リポジトリにも入れていない。
  // ここを "wav" に戻すときは public/assets/bgm/*.wav を置き直すこと。
  it("配信形式はMP3", () => {
    expect(BGM_FORMAT).toBe("mp3");
  });

  it("素材パスの先頭にスラッシュを付けない（GitHub Pagesのサブパスで壊れるため）", () => {
    for (const id of ["pop", "youth", "dark"] as BgmId[]) {
      expect(bgmSrc(BGM[id]).startsWith("/")).toBe(false);
    }
  });

  it("ループ終端は納品資料の値と一致する", () => {
    expect(BGM.pop.loopEnd).toBe(60);
    expect(BGM.youth.loopEnd).toBeCloseTo(68.5714285, 5);
    expect(BGM.dark.loopEnd).toBe(80);
  });
});

describe("画面ごとの選曲", () => {
  it("タイトル・周回選択・設定は①", () => {
    for (const screen of ["title", "loopSelect", "settings"] as ScreenId[]) {
      expect(bgmForScreen(screen, "morning")).toBe("pop");
    }
  });

  it("ストーリーは③（主人公の独白）", () => {
    expect(bgmForScreen("story", "morning")).toBe("dark");
    expect(bgmForScreen("story", "afterSchool")).toBe("dark");
  });

  it("探索は朝・昼が①、放課後は②", () => {
    expect(bgmForScreen("stage", "morning")).toBe("pop");
    expect(bgmForScreen("stage", "lunch")).toBe("pop");
    expect(bgmForScreen("stage", "afterSchool")).toBe("youth");
  });

  it("ステージ結果は直前のステージの曲を引き継ぐ（頭出しを避ける）", () => {
    expect(bgmForScreen("stageResult", "lunch")).toBe(bgmForScreen("stage", "lunch"));
    expect(bgmForScreen("stageResult", "afterSchool")).toBe(bgmForScreen("stage", "afterSchool"));
  });

  it("最終結果とエンディングは②（余韻）", () => {
    expect(bgmForScreen("finalResult", "afterSchool")).toBe("youth");
    expect(bgmForScreen("ending", "afterSchool")).toBe("youth");
  });

  it("同じ画面・同じ時間帯なら必ず同じ曲になる（場所移動で曲が変わらない）", () => {
    const stages: StageId[] = ["morning", "lunch", "afterSchool"];
    for (const stage of stages) {
      const first = bgmForScreen("stage", stage);
      for (let i = 0; i < 5; i++) expect(bgmForScreen("stage", stage)).toBe(first);
    }
  });
});
