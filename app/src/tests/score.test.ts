import { describe, expect, it } from "vitest";
import { SCORE } from "../data/score";
import { calcPoints, comboMultiplier, nextCombo, rankFor } from "../game/score";

describe("得点計算", () => {
  it("友チョコ通報 → +100", () => {
    expect(calcPoints("friend", 0).points).toBe(SCORE.FRIEND_CHOCOLATE);
  });

  it("本命通報 → +500", () => {
    expect(calcPoints("honmei", 0).points).toBe(SCORE.HONMEI_CHOCOLATE);
  });

  it("告白直前の本命 → +1000", () => {
    expect(calcPoints("honmei_special", 0).points).toBe(SCORE.HONMEI_BEFORE_CONFESSION);
  });

  it("誤認通報 → -300（倍率の影響を受けない）", () => {
    expect(calcPoints("none", 9).points).toBe(SCORE.FALSE_REPORT);
    expect(calcPoints("none", 9).multiplier).toBe(1);
  });
});

describe("コンボ", () => {
  it("誤認でコンボが0に戻る", () => {
    expect(nextCombo("none", 7)).toBe(0);
  });

  it("成功でコンボが1増える", () => {
    expect(nextCombo("friend", 7)).toBe(8);
  });

  it("倍率の段階", () => {
    expect(comboMultiplier(1)).toBe(1.0);
    expect(comboMultiplier(2)).toBe(1.0);
    expect(comboMultiplier(3)).toBe(1.2);
    expect(comboMultiplier(4)).toBe(1.2);
    expect(comboMultiplier(5)).toBe(1.5);
    expect(comboMultiplier(9)).toBe(1.5);
    expect(comboMultiplier(10)).toBe(2.0);
  });

  it("3連続成功目でコンボ倍率が乗る", () => {
    // 直前まで2連続 → この通報が3連続目なので ×1.2
    expect(calcPoints("friend", 2).points).toBe(120);
    expect(calcPoints("honmei", 4).points).toBe(750); // 5連続目 ×1.5
    expect(calcPoints("honmei_special", 9).points).toBe(2000); // 10連続目 ×2.0
  });
});

describe("ランク", () => {
  it("しきい値ごとに判定される", () => {
    expect(rankFor(5000)).toBe("S");
    expect(rankFor(4999)).toBe("A");
    expect(rankFor(3500)).toBe("A");
    expect(rankFor(2500)).toBe("B");
    expect(rankFor(1500)).toBe("C");
    expect(rankFor(1499)).toBe("D");
    expect(rankFor(-900)).toBe("D");
  });
});
