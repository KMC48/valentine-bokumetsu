/**
 * セリフ欄の表情とセリフ。
 *
 * 表情とセリフが別々の分岐になっていると、
 * 「焦ったセリフなのに得意顔」のような食い違いがいずれ混入する。
 * 同じ状況からは必ず対の結果が出ることを固定する。
 */
import { describe, expect, it } from "vitest";

import { playerBackSrc, playerBustSrc, playerFaceSrc, playerLine, playerMood } from "../game/playerVoice";

const base = { remaining: 120, combo: 0, selectedName: null, theme: "探す" };

describe("主人公の表情", () => {
  it("平常時は normal", () => {
    expect(playerMood(base)).toBe("normal");
  });

  it("観察中は、時間や連続記録より観察を優先する", () => {
    expect(playerMood({ ...base, remaining: 5, combo: 9, selectedName: "宮園 ゆかり" })).toBe("focus");
  });

  it("残り30秒以下は焦り顔", () => {
    expect(playerMood({ ...base, remaining: 30 })).toBe("hurry");
    expect(playerMood({ ...base, remaining: 31 })).toBe("normal");
  });

  it("3連続以上は得意顔", () => {
    expect(playerMood({ ...base, combo: 3 })).toBe("confident");
  });

  it("焦りは連続記録より優先される（取りこぼしのほうが重い）", () => {
    expect(playerMood({ ...base, remaining: 10, combo: 9 })).toBe("hurry");
  });
});

describe("表情とセリフの対応", () => {
  it("観察中はその生徒の名前を呼ぶ", () => {
    expect(playerLine({ ...base, selectedName: "宮園 ゆかり" })).toContain("宮園 ゆかり");
  });

  it("得意顔でも、連続記録が伸びるとセリフが変わる", () => {
    const three = playerLine({ ...base, combo: 3 });
    const five = playerLine({ ...base, combo: 5 });
    expect(playerMood({ ...base, combo: 3 })).toBe(playerMood({ ...base, combo: 5 }));
    expect(three).not.toBe(five);
  });

  it("4つの表情すべてに顔の画像がある", () => {
    const srcs = (["normal", "focus", "confident", "hurry"] as const).map(playerFaceSrc);
    expect(new Set(srcs).size).toBe(4);
  });
});

describe("主人公の制服", () => {
  it("周回ごとに別の絵を使う（転校しているため）", () => {
    const backs = [1, 2, 3].map((l) => playerBackSrc(l as 1 | 2 | 3));
    const busts = [1, 2, 3].map((l) => playerBustSrc(l as 1 | 2 | 3));
    expect(new Set(backs).size).toBe(3);
    expect(new Set(busts).size).toBe(3);
  });
});
