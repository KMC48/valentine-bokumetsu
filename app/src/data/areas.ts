/**
 * 場所（エリア）データ。
 *
 * 自由移動の代わりに「場所を切り替える」方式にしている。
 * 各場所は1画面固定のままなので、既存のターゲット配置の仕組みがそのまま使える。
 *
 * 【移動のコスト】
 * 移動には秒数がかかる（AREA_MOVE_SECONDS）。
 * つまり「どこを、どの順で回るか」が時間配分の判断になる。
 * 机チェックと同じ“時間のリスク”の軸なので、ゲームの軸がぶれない。
 *
 * 【学校ごとの場所】
 * 追加素材0914-b で2・3周目の場所背景が揃ったため、
 * 3周回すべてで場所切り替えができる。
 * 同じ「校門」でも学校ごとに別の背景を使う（校舎の作りが違うため）。
 */

import type { FloorShape } from "./loops";
import { ASSETS } from "./assets";
import type { LoopId, StageId } from "../types/game";

export type AreaId = string;

export type AreaDef = {
  id: AreaId;
  label: string;
  /** 主人公のセリフや現在地表示に使う短い説明。 */
  hint: string;
  background: string;
  /** 背景の縦の見せ方（床が見える位置）。 */
  focusY: number;
  floor: FloorShape;
};

/** 廊下・室内の標準的な床形状。 */
const INDOOR_FLOOR: FloorShape = {
  centerX: 50,
  farHalf: 16,
  nearHalf: 60,
  farY: 50,
  nearY: 92,
};

/** 屋外（校門・中庭）は床が広い。 */
const OUTDOOR_FLOOR: FloorShape = { ...INDOOR_FLOOR, farHalf: 18, nearHalf: 64 };

/**
 * 教室の中央通路。
 *
 * 教室背景は机が通路の左右に並ぶ構図なので、立てるのは真ん中の通路だけ。
 * 廊下より狭いぶん、手前でも半幅は22%ほどしか取れない。
 * ここを広げると、生徒が机の上に立っているように見える。
 */
const CLASSROOM_AISLE: FloorShape = {
  centerX: 51,
  farY: 26,
  nearY: 96,
  farHalf: 8.7,
  nearHalf: 21.8,
};

const AREA_LIST: AreaDef[] = [
  {
    id: "gate",
    label: "校門",
    hint: "登校してくる生徒が必ず通る。持ち物が一番よく見える場所だ。",
    background: ASSETS.placeGate.src,
    focusY: 66,
    floor: OUTDOOR_FLOOR,
  },
  {
    id: "entrance",
    label: "昇降口・下駄箱",
    hint: "下駄箱に何かを仕込む奴がいる。目を離すな。",
    background: ASSETS.bgSchoolMorning.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },
  {
    id: "courtyard",
    label: "中庭",
    hint: "人目が少ない。受け渡しには絶好の場所だ。",
    background: ASSETS.placeCourtyard.src,
    focusY: 64,
    floor: OUTDOOR_FLOOR,
  },
  {
    id: "classroom",
    label: "教室",
    hint: "机の中という死角がある。人だけ見ていては足りない。",
    background: ASSETS.classroomLoop1.src,
    focusY: 15,
    floor: CLASSROOM_AISLE,
  },
  {
    id: "shop",
    label: "購買",
    hint: "混雑に紛れて渡す気だな。",
    background: ASSETS.placeShop.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },
  {
    id: "stairs",
    label: "階段の踊り場",
    hint: "教師の巡回が届かない。呼び出しに使われる。",
    background: ASSETS.placeStairs.src,
    focusY: 60,
    floor: { ...INDOOR_FLOOR, farHalf: 13, nearHalf: 48 },
  },
  {
    id: "gymBack",
    label: "体育館裏",
    hint: "告白の定番だ。ここが本丸になる。",
    background: ASSETS.bgSchoolAfter.src,
    focusY: 58,
    floor: { ...OUTDOOR_FLOOR, farHalf: 17, nearHalf: 58 },
  },
  {
    id: "rooftop",
    label: "屋上前",
    hint: "鍵を借りた奴がいる。その時点で怪しい。",
    background: ASSETS.bgRooftop.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },
  {
    id: "clubrooms",
    label: "部室棟",
    hint: "部活の名を借りて集まっている。人数が多すぎる。",
    background: ASSETS.placeClubrooms.src,
    focusY: 60,
    floor: { ...OUTDOOR_FLOOR, farHalf: 15, nearHalf: 56 },
  },
  // 放課後の校門は夕方差分を使う（朝の絵のままだと時間が巻き戻って見える）。
  {
    id: "gateAfter",
    label: "校門",
    hint: "下校の流れに紛れて持ち出す気だ。",
    background: ASSETS.placeGateAfter.src,
    focusY: 66,
    floor: OUTDOOR_FLOOR,
  },

  // ===== 2周目：私立聖蘭学院 =====
  {
    id: "l2Gate",
    label: "校門",
    hint: "門構えからして違う。だが、やることは同じだ。",
    background: ASSETS.loop2Gate.src,
    focusY: 66,
    floor: OUTDOOR_FLOOR,
  },
  {
    id: "l2Courtyard",
    label: "中庭",
    hint: "手入れの行き届いた植栽。隠す場所には事欠かない。",
    background: ASSETS.loop2Courtyard.src,
    focusY: 64,
    floor: OUTDOOR_FLOOR,
  },
  {
    id: "l2Classroom",
    label: "教室",
    hint: "机の中は、この学校でも死角のままだ。",
    background: ASSETS.classroomLoop2.src,
    focusY: 15,
    floor: CLASSROOM_AISLE,
  },
  {
    id: "l2Shop",
    label: "購買",
    hint: "カウンターの陰で何かが動いている。",
    background: ASSETS.loop2Shop.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },
  {
    id: "l2Stairs",
    label: "階段の踊り場",
    hint: "木の手すりの陰。ここも巡回が薄い。",
    background: ASSETS.loop2Stairs.src,
    focusY: 60,
    floor: { ...INDOOR_FLOOR, farHalf: 13, nearHalf: 48 },
  },
  {
    id: "l2GymBack",
    label: "体育館裏",
    hint: "学校が変わっても、告白の場所は変わらない。",
    background: ASSETS.loop2GymBack.src,
    focusY: 58,
    floor: { ...OUTDOOR_FLOOR, farHalf: 17, nearHalf: 58 },
  },
  {
    id: "l2Rooftop",
    label: "屋上前",
    hint: "鍵の管理が厳しい学校ほど、鍵を持つ奴が怪しい。",
    background: ASSETS.loop2Rooftop.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },

  // ===== 3周目：白鷺台学園 =====
  {
    id: "l3Gate",
    label: "校門",
    hint: "ここを通る生徒は、もう何も持っていない。",
    background: ASSETS.loop3Gate.src,
    focusY: 66,
    floor: { ...OUTDOOR_FLOOR, centerX: 48 },
  },
  {
    id: "l3Courtyard",
    label: "中庭",
    hint: "見通しが良すぎる。だからこそ、ここを選ぶ奴がいる。",
    background: ASSETS.loop3Courtyard.src,
    focusY: 64,
    floor: { ...OUTDOOR_FLOOR, centerX: 48 },
  },
  {
    id: "l3Classroom",
    label: "教室",
    hint: "前日のうちに仕込まれている。今日の持ち物を見ても遅い。",
    background: ASSETS.classroomLoop3.src,
    focusY: 15,
    floor: CLASSROOM_AISLE,
  },
  {
    id: "l3Shop",
    label: "カフェテリア",
    hint: "洗練された場所ほど、受け渡しは自然に見える。",
    background: ASSETS.loop3Shop.src,
    focusY: 62,
    floor: { ...INDOOR_FLOOR, centerX: 48 },
  },
  {
    id: "l3Stairs",
    label: "階段",
    hint: "ガラス張りで死角が無い。ならば、なぜここに来る。",
    background: ASSETS.loop3Stairs.src,
    focusY: 60,
    floor: { ...INDOOR_FLOOR, farHalf: 13, nearHalf: 48 },
  },
  {
    id: "l3GymBack",
    label: "体育館裏",
    hint: "見張りが立っている。それ自体が答えだ。",
    background: ASSETS.loop3GymBack.src,
    focusY: 58,
    floor: { ...OUTDOOR_FLOOR, farHalf: 17, nearHalf: 58 },
  },
  {
    id: "l3Rooftop",
    label: "屋上前",
    hint: "三日前から鍵の当番を代わっている奴がいる。",
    background: ASSETS.loop3Rooftop.src,
    focusY: 62,
    floor: INDOOR_FLOOR,
  },
];

const AREA_MAP = new Map(AREA_LIST.map((a) => [a.id, a]));

export function getArea(id: AreaId): AreaDef {
  const area = AREA_MAP.get(id);
  if (!area) throw new Error(`未定義のエリア: ${id}`);
  return area;
}

/**
 * 周回×ステージで回れる場所。
 * 1周目のみ複数エリア。2・3周目はその学校の場所背景が揃うまで単一エリア。
 */
const STAGE_AREAS: Record<LoopId, Record<StageId, AreaId[]>> = {
  1: {
    morning: ["gate", "entrance", "courtyard"],
    lunch: ["classroom", "shop", "stairs"],
    // 放課後の校門は夕方差分に差し替え、部室棟を追加。
    afterSchool: ["gymBack", "rooftop", "clubrooms", "gateAfter"],
  },
  2: {
    morning: ["l2Gate", "l2Courtyard", "l2Stairs"],
    lunch: ["l2Classroom", "l2Shop", "l2Stairs"],
    afterSchool: ["l2GymBack", "l2Rooftop", "l2Courtyard"],
  },
  3: {
    morning: ["l3Gate", "l3Courtyard", "l3Stairs"],
    lunch: ["l3Classroom", "l3Shop", "l3Stairs"],
    afterSchool: ["l3GymBack", "l3Rooftop", "l3Courtyard"],
  },
};

/**
 * 放課後に夕方の色を被せるか。
 *
 * 1周目の放課後の背景（体育館裏・屋上前・部室棟・校門）は夕焼けの絵だが、
 * 2・3周目の放課後は **昼間の青空の絵しか無い**。
 * そのまま出すと、朝・昼・放課後がすべて同じ明るさになり、
 * 時間が進んでいることが画面から読み取れなくなる。
 *
 * 夕方の絵が納品されたら、ここを false にして差し替える。
 */
export function needsDuskTint(loop: LoopId, stage: StageId): boolean {
  return stage === "afterSchool" && loop !== 1;
}

/** 定義されている場所IDの一覧。掲示物などの紐付け先の検算に使う。 */
export const AREA_IDS: string[] = AREA_LIST.map((a) => a.id);

/** そのステージで回れる場所の一覧。 */
export function areasFor(loop: LoopId, stage: StageId): AreaDef[] {
  return STAGE_AREAS[loop][stage].map(getArea);
}

/** そのステージの最初の場所。 */
export function firstAreaFor(loop: LoopId, stage: StageId): AreaId {
  return STAGE_AREAS[loop][stage][0]!;
}

/** そのステージの代表的な背景（周回選択のサムネイル、ストーリーの背景に使う）。 */
export function stageBackgroundFor(loop: LoopId, stage: StageId): string {
  return getArea(firstAreaFor(loop, stage)).background;
}

/** 場所切り替えが意味を持つか（2箇所以上あるか）。 */
export function hasMultipleAreas(loop: LoopId, stage: StageId): boolean {
  return STAGE_AREAS[loop][stage].length > 1;
}
