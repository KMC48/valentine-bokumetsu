/**
 * 掲示物の配置が、実在する場所に紐付いているかを守る。
 *
 * 以前 `loop2` / `loop3` という存在しない場所IDで横断幕を登録しており、
 * 2・3周目では一度も表示されていなかった。
 * 場所IDの打ち間違いは画面を見ても「ただ何も出ない」だけなので気づきにくい。
 */
import { describe, expect, it } from "vitest";

import { SIGNAGE_AREA_IDS } from "../components/Signage";
import { AREA_IDS } from "../data/areas";

describe("掲示物の配置", () => {
  it("すべて実在する場所IDに紐付いている", () => {
    const unknown = SIGNAGE_AREA_IDS.filter((id) => !AREA_IDS.includes(id));
    expect(unknown).toEqual([]);
  });

  it("3校すべての校門に横断幕が出る", () => {
    for (const id of ["gate", "gateAfter", "l2Gate", "l3Gate"]) {
      expect(SIGNAGE_AREA_IDS).toContain(id);
    }
  });
});
