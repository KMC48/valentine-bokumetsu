import { statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ASSETS } from "../data/assets";
import { BGM, bgmSrc } from "../data/bgm";
import { STUDENTS } from "../data/students";
import { STORIES } from "../data/stories";
import { ENDINGS } from "../data/endings";

function exists(src: string) {
  expect(src).toMatch(/^assets\//);
  expect(src.split("/")).not.toContain("..");
  const stat = statSync(`public/${src}`);
  expect(stat.isFile(), src).toBe(true);
  expect(stat.size, src).toBeGreaterThan(0);
}

describe("同梱する画像・音声の実体", () => {
  it("readyの全画像と全生徒の画像がpublicに存在する", () => {
    for (const asset of Object.values(ASSETS)) if (asset.status === "ready") exists(asset.src);
    for (const student of STUDENTS) exists(student.image!);
  });
  it("実際に使用する形式のBGM全曲が存在する", () => {
    for (const track of Object.values(BGM)) exists(bgmSrc(track));
  });
  it("ストーリー・エンディングで個別指定された画像が存在する", () => {
    for (const scene of [...STORIES, ...ENDINGS]) {
      for (const line of scene.lines) {
        if (line.character) exists(line.character);
        if (line.background) exists(line.background);
      }
    }
  });
});
