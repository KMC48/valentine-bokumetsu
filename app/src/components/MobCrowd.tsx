/**
 * 奥を歩くモブ生徒。
 *
 * 「校内の賑わい」と奥行きを出すための背景要素。
 * タップ対象にはしない（pointer-events: none）ので、通報や集計には一切関わらない。
 * 場所IDをもとに配置を決めるので、同じ場所なら毎回同じ並びになる（ちらつき防止）。
 */

import { ASSETS } from "../data/assets";
import { atmosphericFade, depthHeight } from "../game/perspective";

const MOBS = [
  ASSETS.mobBoy1.src,
  ASSETS.mobGirl1.src,
  ASSETS.mobBoy2.src,
  ASSETS.mobGirl2.src,
  ASSETS.mobBoy3.src,
  ASSETS.mobGirl3.src,
];

/**
 * モブの立ち位置。y は足元（ゲームエリアの上から%）。
 * 大きさは指定しない——生徒とまったく同じ遠近計算から求める。
 * ここで独自の大きさを持つと、同じ校舎にいるのにモブだけ縮尺が狂う。
 */
type MobSlot = { x: number; y: number; flip?: boolean };

/**
 * モブの立ち位置。
 *
 * 【yの決め方】
 * 生徒は y=64〜78 に立つ。モブを y=40 台に置くと、床の上では
 * すぐ後ろに見えるのに **身長が生徒の半分**になり、合成に見える。
 * 「生徒より少し奥」に見える範囲として y=54〜60 に収めている。
 *
 * 【場所IDについて】
 * 以前は loop2 / loop3 という存在しないIDで登録していたため、
 * 2・3周目にはモブが一人も出ていなかった。IDは areas.ts と同じものを使う。
 */
const OUTDOOR3: MobSlot[] = [
  { x: 40, y: 58 },
  { x: 57, y: 55, flip: true },
  { x: 48, y: 53 },
];
const OUTDOOR2: MobSlot[] = [
  { x: 41, y: 57 },
  { x: 59, y: 54, flip: true },
];
const INDOOR2: MobSlot[] = [
  { x: 43, y: 57 },
  { x: 58, y: 54, flip: true },
];
const INDOOR1: MobSlot[] = [{ x: 56, y: 56 }];

// 教室は当面モブを出さない。
// いまある絵は「鞄を持って下校する後ろ姿」しか無く、授業の合間の教室には合わない。
// 室内で立っている／座っているモブが納品されたら戻す。
const SLOTS_BY_AREA: Record<string, MobSlot[]> = {
  gate: OUTDOOR3,
  gateAfter: OUTDOOR2,
  entrance: INDOOR2,
  courtyard: OUTDOOR2,
  shop: OUTDOOR3,
  stairs: INDOOR1,
  gymBack: INDOOR1,
  clubrooms: OUTDOOR2,
  rooftop: [],
  classroom: [],

  l2Gate: OUTDOOR3,
  l2Courtyard: OUTDOOR2,
  l2Shop: OUTDOOR3,
  l2Stairs: INDOOR1,
  l2GymBack: INDOOR1,
  l2Rooftop: [],
  l2Classroom: [],

  l3Gate: OUTDOOR3,
  l3Courtyard: OUTDOOR2,
  l3Shop: OUTDOOR3,
  l3Stairs: INDOOR1,
  l3GymBack: INDOOR1,
  l3Rooftop: [],
  l3Classroom: [],
};

/** モブを登録している場所ID。実在する場所かをテストで突き合わせる。 */
export const MOB_AREA_IDS = Object.keys(SLOTS_BY_AREA);

/** 場所IDから決まる並び（毎回同じになるよう、文字列から決定的に選ぶ）。 */
function mobIndexFor(areaId: string, slot: number): number {
  let hash = 0;
  for (const ch of areaId) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return (hash + slot * 3) % MOBS.length;
}

export function MobCrowd({ areaId }: { areaId: string }) {
  const slots = SLOTS_BY_AREA[areaId] ?? [];
  if (slots.length === 0) return null;

  return (
    <>
      {slots.map((slot, i) => (
        <img
          key={i}
          className="mob"
          src={MOBS[mobIndexFor(areaId, i)]}
          alt=""
          style={{
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            height: `${depthHeight(slot.y)}%`,
            transform: `translate(-50%, -100%)${slot.flip ? " scaleX(-1)" : ""}`,
            zIndex: Math.round(slot.y),
            // 奥ほどわずかに霞ませて背景になじませる（空気遠近）。
            // 効かせすぎると半透明の幽霊のように見えてしまうので控えめにする。
            opacity: 1 - atmosphericFade(slot.y) * 0.1,
            filter: `saturate(${1 - atmosphericFade(slot.y) * 0.18}) brightness(${
              1 - atmosphericFade(slot.y) * 0.06
            }) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35))`,
          }}
        />
      ))}
    </>
  );
}
