import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudentTarget, TURN_VARIANT } from "../components/StudentTarget";
import { ASSETS } from "../data/assets";
import { getStory } from "../data/stories";
import { STUDENTS } from "../data/students";
import { calcPoints, isSuccess, nextCombo } from "../game/score";
import { characterFor } from "../screens/StoryScreen";

const ichinose = STUDENTS.find((s) => s.id === "l3-l-05")!;

describe("一ノ瀬ひかるの専用画像", () => {
  it("通常表示と選択時に同一人物の専用画像を描画する", () => {
    for (const selected of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(StudentTarget, { student: ichinose, loop: 3,
          view: { floor: { centerX: 50, farHalf: 30, nearHalf: 50, farY: 40, nearY: 90 } },
          selected, debug: false, onSelect: () => {} }),
      );
      const expected = selected ? ASSETS.ichinoseTurn.src : ASSETS.ichinose.src;
      expect(html).toContain(`src="${expected}"`);
      expect(html).not.toContain("loop3_girl_01");
    }
    expect(TURN_VARIANT[ichinose.image!]).toBe(ASSETS.ichinoseTurn.src);
  });

  it("専用画像をほかの生徒に流用しない", () => {
    const dedicated = [ASSETS.ichinose.src, ASSETS.ichinoseTurn.src, ASSETS.bustIchinose.src];
    for (const s of STUDENTS.filter((s) => s.id !== ichinose.id)) {
      expect(dedicated).not.toContain(s.image);
    }
  });

  it("既存シナリオの一ノ瀬の台詞でバストアップを選択する", () => {
    const lines = getStory(3, "interlude1")!.lines.filter((l) => l.speaker === "生徒会長・一ノ瀬");
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.character ?? characterFor(line.speaker, 3)).toBe(ASSETS.bustIchinose.src);
    }
    expect(characterFor("生徒会長・一ノ瀬", 1)).toBeNull();
    expect(characterFor("生徒会長・一ノ瀬", 2)).toBeNull();
    expect(characterFor("", 3)).toBeNull();
    expect(characterFor("謎の女子生徒", 2)).toBeNull();
    expect(characterFor("俺", 3)).toBe("assets/characters/loop3_bust_player.webp");
    expect(characterFor("生徒指導・鬼頭", 3)).toBe(ASSETS.bustTeacher.src);
    expect(characterFor("男子生徒", 3)).toBe(ASSETS.bustBoy001.src);
  });

  it("資料の紙袋は無実で、通報すると従来どおり減点・コンボ解除になる", () => {
    expect(ichinose.loop).toBe(3);
    expect(ichinose.stage).toBe("lunch");
    expect(ichinose.visibleItem).toBe("paper_bag");
    expect(ichinose.chocolateType).toBe("none");
    expect(isSuccess(ichinose.chocolateType)).toBe(false);
    expect(calcPoints(ichinose.chocolateType, 9)).toEqual({ points: -300, multiplier: 1 });
    expect(nextCombo(ichinose.chocolateType, 9)).toBe(0);
  });
});
