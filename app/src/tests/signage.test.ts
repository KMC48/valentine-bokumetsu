/**
 * 掲示物の配置が、実在する場所に紐付いているかを守る。
 *
 * 以前 `loop2` / `loop3` という存在しない場所IDで横断幕を登録しており、
 * 2・3周目では一度も表示されていなかった。
 * 場所IDの打ち間違いは画面を見ても「ただ何も出ない」だけなので気づきにくい。
 */
import { describe, expect, it } from "vitest";

import { MOB_AREA_IDS } from "../components/MobCrowd";
import { SIGNAGE_AREA_IDS } from "../components/Signage";
import { AREA_IDS, needsDuskTint } from "../data/areas";

describe("掲示物の配置", () => {
  it("すべて実在する場所IDに紐付いている", () => {
    const unknown = SIGNAGE_AREA_IDS.filter((id) => !AREA_IDS.includes(id));
    expect(unknown).toEqual([]);
  });

  it("モブの配置も実在する場所IDに紐付いている", () => {
    expect(MOB_AREA_IDS.filter((id) => !AREA_IDS.includes(id))).toEqual([]);
  });

  it("3校すべての校門にモブが出る（以前は1周目だけだった）", () => {
    for (const id of ["gate", "l2Gate", "l3Gate"]) {
      expect(MOB_AREA_IDS).toContain(id);
    }
  });

  it("3校すべての校門に横断幕が出る", () => {
    for (const id of ["gate", "gateAfter", "l2Gate", "l3Gate"]) {
      expect(SIGNAGE_AREA_IDS).toContain(id);
    }
  });
});

describe("放課後の時間帯", () => {
  it("2・3周目だけ夕方の色を被せる（昼間の絵しか無いため）", () => {
    expect(needsDuskTint(1, "afterSchool")).toBe(false);
    expect(needsDuskTint(2, "afterSchool")).toBe(true);
    expect(needsDuskTint(3, "afterSchool")).toBe(true);
  });

  it("朝と昼には被せない", () => {
    for (const loop of [1, 2, 3] as const) {
      expect(needsDuskTint(loop, "morning")).toBe(false);
      expect(needsDuskTint(loop, "lunch")).toBe(false);
    }
  });
});
