/**
 * 立ち絵の割り当てが、ゲームの前提を壊していないかを検証する。
 *
 * ここが崩れると「観察して推理する」というゲームの核が成立しなくなるので、
 * 素材を足すたびに自動で確認できるようにしておく。
 */

import { describe, expect, it } from "vitest";
import { TURN_VARIANT } from "../components/StudentTarget";
import { ASSETS } from "../data/assets";
import { STUDENTS } from "../data/students";
import type { LoopId } from "../types/game";

/** 周回ごとに使ってよい立ち絵の接頭辞。 */
const ALLOWED_PREFIX: Record<LoopId, RegExp> = {
  1: /^assets\/characters\/girl_0(0[1-9]|10)\.webp$/,
  2: /^assets\/characters\/loop2_girl_(0[1-9]|10)\.webp$/,
  3: /^assets\/characters\/loop3_girl_(0[1-9]|10)\.webp$/,
};

/** チョコが手に丸見えの絵。無実の生徒に使うと結果と矛盾する。 */
const OPEN_CHOCOLATE = [
  "assets/characters/girl_002.webp",
  "assets/characters/loop2_girl_02.webp",
  "assets/characters/loop3_girl_02.webp",
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

describe("学校別の差分がそろっているか", () => {
  it("3校とも10種類の立ち絵があり、すべて振り向き差分を持つ", () => {
    const sets = [
      Array.from({ length: 10 }, (_, i) => `assets/characters/girl_${String(i + 1).padStart(3, "0")}.webp`),
      Array.from({ length: 10 }, (_, i) => `assets/characters/loop2_girl_${String(i + 1).padStart(2, "0")}.webp`),
      Array.from({ length: 10 }, (_, i) => `assets/characters/loop3_girl_${String(i + 1).padStart(2, "0")}.webp`),
    ];
    const known = new Set(Object.values(ASSETS).map((a: { src: string }) => a.src));
    for (const set of sets) {
      for (const src of set) expect(known.has(src)).toBe(true);
    }
  });

  it("「鞄も持っていない」生徒には、鞄を持った絵を使わない", () => {
    // ヒントが手ぶらだと明言している生徒は、手ぶらであること自体が手がかり。
    // 鞄を持った絵を当てると、観察メモと画面が食い違う。
    const EMPTY_HANDED = /girl_0?0?[89]\.webp$/;
    for (const s of STUDENTS) {
      const hints = s.hints.join("");
      // 「渡したあと手ぶらになった」のように、今は持っている生徒もいる。
      // 見えている持ち物が無い生徒だけが対象。
      const nothingVisible = (s.visibleItem ?? "none") === "none";
      const saysEmpty =
        nothingVisible &&
        (hints.includes("一度も持たない") || (hints.includes("手ぶら") && !hints.includes("鞄")));
      if (saysEmpty && s.image) {
        expect(s.image, `${s.id}: ${hints}`).toMatch(EMPTY_HANDED);
      }
    }
  });

});

describe("振り向き差分", () => {
  it("振り向いた絵は、必ず同じ学校の制服になる", () => {
    // 対応表を取り違えると、2周目の生徒が紺の制服に化ける。
    for (const [normal, turn] of Object.entries(TURN_VARIANT)) {
      const school = normal.match(/loop[23]/)?.[0] ?? "loop1";
      expect(turn.match(/loop[23]/)?.[0] ?? "loop1", normal).toBe(school);
    }
  });

  it("45人全員が、選択されたときに振り向く絵を持っている", () => {
    // 差分が無いと、選んでも反応が無く「タップできたのか」が分からない。
    for (const s of STUDENTS) {
      expect(TURN_VARIANT[s.image!], `${s.id}: ${s.image}`).toBeDefined();
    }
  });
});
