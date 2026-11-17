/** アワード提出前の表示調整（v0.2.6）の回帰テスト。 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ObservationModal } from "../components/ObservationModal";
import { areasFor } from "../data/areas";
import { STAGE_ORDER } from "../data/stages";
import { getStudents } from "../data/students";
import { keepTail } from "../game/keepTail";
import { stageImageSources } from "../game/preload";
import type { LoopId } from "../types/game";

const JOINER = "⁠";

describe("文章の末尾を改行させない（1文字だけの行を作らない）", () => {
  it("末尾の4文字（句読点は数えない）の間に改行禁止の文字を挟む", () => {
    const out = keepTail("袋の色だけで決めつけない方がよさそうだぞ。");
    expect(out.replaceAll(JOINER, "")).toBe("袋の色だけで決めつけない方がよさそうだぞ。");
    // 「うだぞ。」の手前の「そ」から最後まで、文字の間がすべてつながっている。
    expect(out.endsWith(["そ", "う", "だ", "ぞ", "。"].join(JOINER))).toBe(true);
  });

  it("「ぞ……。」のような記号の連続も、文字1つとは数えない", () => {
    const out = keepTail("と言ったぞ……。");
    expect(out.endsWith(["言", "っ", "た", "ぞ", "…", "…", "。"].join(JOINER))).toBe(true);
  });

  it("短い文はそのまま", () => {
    expect(keepTail("ぞ。")).toBe("ぞ。");
  });
});

describe("場所移動の前に画像を読み込んでおく", () => {
  it.each([1, 2, 3] as LoopId[])("%i周目：各ステージの全場所の背景と、全生徒の立ち絵・振り向きを含む", (loop) => {
    for (const stage of STAGE_ORDER) {
      const srcs = stageImageSources(loop, stage);
      for (const area of areasFor(loop, stage)) expect(srcs).toContain(area.background);
      for (const student of getStudents(loop, stage)) if (student.image) expect(srcs).toContain(student.image);
      expect(new Set(srcs).size).toBe(srcs.length);
    }
  });
});

describe("観察画面のボタン", () => {
  it("通報・見送り・保留のボタンは、スクロールする読み物の外（下に固定する欄）にある", () => {
    const student = getStudents(2, "morning")[0]!;
    const html = renderToStaticMarkup(createElement(ObservationModal, {
      student, loop: 2, revealed: 0, binocularUses: 2, binocularCanUse: true, binocularReason: "ok",
      onUseBinocular: () => {}, debug: false, onReport: () => {}, onPass: () => {}, onClose: () => {},
    }));
    const scroll = html.indexOf('class="observe__scroll"');
    const footer = html.indexOf('class="observe__footer"');
    expect(scroll).toBeGreaterThan(-1);
    expect(footer).toBeGreaterThan(scroll);
    const footerHtml = html.slice(footer);
    for (const label of ["通報する", "見送る", "保留"]) expect(footerHtml).toContain(label);
  });
});
