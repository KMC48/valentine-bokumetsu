/**
 * 奥を歩くモブ生徒。
 *
 * 「校内の賑わい」と奥行きを出すための背景要素。
 * タップ対象にはしない（pointer-events: none）ので、通報や集計には一切関わらない。
 * 場所IDをもとに配置を決めるので、同じ場所なら毎回同じ並びになる（ちらつき防止）。
 */

import { ASSETS } from "../data/assets";
import { atmosphericFade, depthHeight } from "../game/perspective";
import type { LoopId } from "../types/game";

/**
 * 歩き去る後ろ姿（屋外・廊下の通行人）。
 * 学校が変われば制服も変わるので、周回ごとに持つ。
 */
const WALKING: Record<LoopId, string[]> = {
  1: [ASSETS.mobBoy1.src, ASSETS.mobGirl1.src, ASSETS.mobBoy2.src, ASSETS.mobGirl2.src, ASSETS.mobBoy3.src, ASSETS.mobGirl3.src],
  2: [ASSETS.loop2MobBoy1.src, ASSETS.loop2MobGirl1.src, ASSETS.loop2MobBoy2.src, ASSETS.loop2MobGirl2.src, ASSETS.loop2MobBoy3.src, ASSETS.loop2MobGirl3.src],
  3: [ASSETS.loop3MobBoy1.src, ASSETS.loop3MobGirl1.src, ASSETS.loop3MobBoy2.src, ASSETS.loop3MobGirl2.src, ASSETS.loop3MobBoy3.src, ASSETS.loop3MobGirl3.src],
};

/**
 * モブの立ち位置。
 *
 * 【yの決め方】
 * 生徒は y=64〜78 に立つ。モブを y=40 台に置くと、床の上では
 * すぐ後ろに見えるのに **身長が生徒の半分**になり、合成に見える。
 * 「生徒より少し奥」に見える範囲として y=54〜60 に収めている。
 *
 * 【scale について】
 * 座っているモブは、机と椅子ごと1枚の絵になっている。
 * 頭のてっぺんは立っている人より低いので、同じ遠近計算のままでは大きすぎる。
 * 立っている人の身長に対する「座ったときの頭の高さ」の比を掛ける。
 *
 * 【場所IDについて】
 * 以前は loop2 / loop3 という存在しないIDで登録していたため、
 * 2・3周目にはモブが一人も出ていなかった。IDは areas.ts と同じものを使う。
 */
type MobSlot = { x: number; y: number; flip?: boolean; src?: string; scale?: number };

/** 座ったときの頭の高さ ÷ 立ったときの身長。 */
const SEATED = 0.78;

const OUTDOOR3: MobSlot[] = [
  { x: 40, y: 58 },
  { x: 57, y: 55, flip: true },
  { x: 48, y: 53 },
];
const OUTDOOR2: MobSlot[] = [
  { x: 41, y: 57 },
  { x: 59, y: 54, flip: true },
];
// 立ち話の2人。向かい合う向きになるよう、左右の並びを固定する。
const TALKING: MobSlot[] = [
  { x: 36, y: 58, src: ASSETS.mobTalkB1.src },
  { x: 52, y: 57, src: ASSETS.mobTalkB2.src },
];
const STANDING2: MobSlot[] = [
  { x: 30, y: 57, src: ASSETS.mobStand1.src },
  { x: 62, y: 55, src: ASSETS.mobStand2.src },
];
const INDOOR1: MobSlot[] = [{ x: 56, y: 56, src: ASSETS.mobStand2.src }];

/**
 * 教室。
 *
 * 座っているモブは通路の左右の席に、黒板消しは黒板の前に置く。
 * x は床の台形を通さない画面上の位置なので、背景の机の列に直接合わせている。
 */
const CLASSROOM: MobSlot[] = [
  { x: 15, y: 47, src: ASSETS.mobSit1.src, scale: SEATED },
  { x: 74, y: 42, src: ASSETS.mobSit2.src, scale: SEATED, flip: true },
  { x: 28, y: 38, src: ASSETS.mobSit3.src, scale: SEATED },
  { x: 62, y: 33, src: ASSETS.mobBlackboard.src },
];

const SLOTS_BY_AREA: Record<string, MobSlot[]> = {
  gate: OUTDOOR3,
  gateAfter: OUTDOOR2,
  entrance: OUTDOOR2,
  courtyard: TALKING,
  shop: OUTDOOR3,
  stairs: INDOOR1,
  gymBack: STANDING2,
  clubrooms: TALKING,
  rooftop: [],
  classroom: CLASSROOM,

  l2Gate: OUTDOOR3,
  l2Courtyard: TALKING,
  l2Shop: OUTDOOR3,
  l2Stairs: INDOOR1,
  l2GymBack: STANDING2,
  l2Rooftop: [],
  l2Classroom: CLASSROOM,

  l3Gate: OUTDOOR3,
  l3Courtyard: TALKING,
  l3Shop: OUTDOOR3,
  l3Stairs: INDOOR1,
  l3GymBack: STANDING2,
  l3Rooftop: [],
  l3Classroom: CLASSROOM,
};

/** モブを登録している場所ID。実在する場所かをテストで突き合わせる。 */
export const MOB_AREA_IDS = Object.keys(SLOTS_BY_AREA);

/** 場所IDから決まる並び（毎回同じになるよう、文字列から決定的に選ぶ）。 */
function mobIndexFor(areaId: string, slot: number): number {
  let hash = 0;
  for (const ch of areaId) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return (hash + slot * 3) % 6;
}

export function MobCrowd({ areaId, loop }: { areaId: string; loop: LoopId }) {
  const slots = SLOTS_BY_AREA[areaId] ?? [];
  const walking = WALKING[loop];
  if (slots.length === 0) return null;

  return (
    <>
      {slots.map((slot, i) => (
        <img
          key={i}
          className="mob"
          src={slot.src ?? walking[mobIndexFor(areaId, i)]}
          alt=""
          style={{
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            height: `${depthHeight(slot.y) * (slot.scale ?? 1)}%`,
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
