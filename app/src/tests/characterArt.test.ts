/**
 * 立ち絵の割り当てが、ゲームの前提を壊していないかを検証する。
 *
 * ここが崩れると「観察して推理する」というゲームの核が成立しなくなるので、
 * 素材を足すたびに自動で確認できるようにしておく。
 */

import { describe, expect, it } from "vitest";
import { STUDENTS } from "../data/students";
import type { LoopId } from "../types/game";

/** 周回ごとに使ってよい立ち絵の接頭辞。 */
const ALLOWED_PREFIX: Record<LoopId, RegExp> = {
  1: /^assets\/characters\/girl_0(0[1-9]|10)\.png$/,
  2: /^assets\/characters\/loop2_girl_0[1-5]\.png$/,
  3: /^assets\/characters\/loop3_girl_0[1-5]\.png$/,
};

/** チョコが手に丸見えの絵。無実の生徒に使うと結果と矛盾する。 */
const OPEN_CHOCOLATE = [
  "assets/characters/girl_002.png",
  "assets/characters/loop2_girl_02.png",
  "assets/characters/loop3_girl_02.png",
];

describe("立ち絵の割り当て", () => {
  it("全生徒に立ち絵が設定されている", () => {
    for (const s of STUDENTS) {
      expect(s.image, s.id).toBeTruthy();
    }
  });

  it("学校ごとの制服を使っている（他校の制服が混ざらない）", () => {
    for (const s of STUDENTS) {
      expect(s.image ?? "", `${s.id}（${s.loop}周目）`).toMatch(ALLOWED_PREFIX[s.loop]);
    }
  });

  it("チョコが丸見えの絵は、実際に友チョコを持つ生徒にしか使わない", () => {
    for (const s of STUDENTS) {
      if (s.image && OPEN_CHOCOLATE.includes(s.image)) {
        expect(s.chocolateType, s.id).toBe("friend");
      }
    }
  });

  it("同じ立ち絵が1周回で使われすぎない（同じ顔が並ばない）", () => {
    for (const loop of [1, 2, 3] as LoopId[]) {
      const counts = new Map<string, number>();
      for (const s of STUDENTS.filter((x) => x.loop === loop)) {
        counts.set(s.image!, (counts.get(s.image!) ?? 0) + 1);
      }
      for (const [image, count] of counts) {
        expect(count, `${loop}周目の ${image}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it("同じ場所に同じ立ち絵が2人以上並ばない", () => {
    const byPlace = new Map<string, string[]>();
    for (const s of STUDENTS) {
      const key = `${s.loop}/${s.stage}/${s.area}`;
      byPlace.set(key, [...(byPlace.get(key) ?? []), s.image!]);
    }
    for (const [place, images] of byPlace) {
      const dup = images.filter((img, i) => images.indexOf(img) !== i);
      expect(dup, `${place} で重複`).toHaveLength(0);
    }
  });
});
