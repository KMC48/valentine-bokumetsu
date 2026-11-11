import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TURN_VARIANT } from "../components/StudentTarget";
import { getArea } from "../data/areas";
import { floorX } from "../data/loops";
import { STUDENTS } from "../data/students";
import { depthHeight } from "../game/perspective";

// 実際の透過WebPの縦横比で検査。振り向き差分も含め、絵の幅の変更を見逃さない。
function aspectRatio(src: string): number {
  const data = readFileSync(resolve(process.cwd(), "public", src));
  for (let offset = 12; offset + 8 <= data.length;) {
    const type = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (type === "VP8X") {
      return (data.readUIntLE(offset + 12, 3) + 1) / (data.readUIntLE(offset + 15, 3) + 1);
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`透過WebPの寸法を取得できません: ${src}`);
}

// スマホ縦画面でゲーム領域を十分に広げた場合まで確認する（高さ/幅）。
const SCENE_ASPECT = 1.15;
const PLAYER_RIGHT = 26; // 主人公の幅33%、左-7%。上半身だけでなく持ち物も隠さない。
const bounds = STUDENTS.map((student) => {
  const { x, y } = student.position;
  const center = floorX(getArea(student.area).floor, x, y);
  const ratios = student.image
    ? [student.image, TURN_VARIANT[student.image]].filter((src): src is string => !!src).map(aspectRatio)
    : [0.4];
  const width = depthHeight(y) * SCENE_ASPECT * Math.max(...ratios);
  return { student, left: center - width / 2, right: center + width / 2 };
});

describe("観察対象の見える配置", () => {
  it("全員の頭上に名前の余白を確保し、拡大前より人物を大きく保つ", () => {
    for (const student of STUDENTS) {
      const y = student.position.y;
      const oldHeight = Math.min(80, Math.max(7, 33 + (68 - 33) * (y - 50) / (88 - 50)));
      expect(y - depthHeight(y), student.id).toBeGreaterThanOrEqual(8);
      expect(depthHeight(y), student.id).toBeGreaterThan(oldHeight * 1.15);
    }
  });

  it("通常・振り向きの全身が主人公と画面端の間に収まる", () => {
    for (const { student, left, right } of bounds) {
      expect(left, `${student.id}: 主人公との重なり`).toBeGreaterThan(PLAYER_RIGHT);
      expect(right, `${student.id}: 右端の見切れ`).toBeLessThan(99);
    }
  });

  it("同じ場面の生徒同士が重ならない", () => {
    for (const a of bounds) {
      for (const b of bounds) {
        if (a.student.id >= b.student.id || a.student.loop !== b.student.loop ||
          a.student.stage !== b.student.stage || a.student.area !== b.student.area) continue;
        const gap = Math.max(b.left - a.right, a.left - b.right);
        expect(gap, `${a.student.id} / ${b.student.id}`).toBeGreaterThan(0);
      }
    }
  });
});
