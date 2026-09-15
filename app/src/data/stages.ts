/** ステージ定義。制限時間もここで調整する。 */

import type { StageDef, StageId } from "../types/game";

export const STAGE_ORDER: StageId[] = ["morning", "lunch", "afterSchool"];

export const STAGES: Record<StageId, StageDef> = {
  morning: {
    id: "morning",
    label: "朝：登校",
    mission: "チョコを持ち込んだ生徒を通報せよ！",
    timeLimit: 210,
    background: null,
    palette: "morning",
    locations: ["校門", "昇降口", "廊下", "下駄箱"],
  },
  lunch: {
    id: "lunch",
    label: "昼休み",
    mission: "受け渡し前にチョコを押さえろ！",
    timeLimit: 210,
    background: null,
    palette: "lunch",
    locations: ["教室", "廊下", "階段", "購買", "中庭"],
  },
  afterSchool: {
    id: "afterSchool",
    label: "放課後",
    mission: "本命チョコの受け渡しを阻止せよ！",
    timeLimit: 270,
    background: null,
    palette: "after",
    locations: ["体育館裏", "屋上前", "部室棟", "中庭", "校門"],
  },
};

/** デバッグ時の無制限タイマー用の値。 */
export const UNLIMITED_TIME = 9999;
