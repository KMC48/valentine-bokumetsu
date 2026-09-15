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

const SLOTS_BY_AREA: Record<string, MobSlot[]> = {
  gate: [
    { x: 40, y: 44 },
    { x: 56, y: 42, flip: true },
    { x: 48, y: 40 },
  ],
  entrance: [
    { x: 44, y: 43 },
    { x: 55, y: 41, flip: true },
  ],
  courtyard: [
    { x: 38, y: 43 },
    { x: 60, y: 41 },
  ],
  classroom: [{ x: 66, y: 42 }],
  shop: [
    { x: 42, y: 44 },
    { x: 58, y: 42, flip: true },
    { x: 50, y: 40 },
  ],
  stairs: [{ x: 55, y: 42 }],
  gymBack: [{ x: 58, y: 42 }],
  rooftop: [],
  loop2: [
    { x: 44, y: 43 },
    { x: 57, y: 41, flip: true },
  ],
  loop2Lunch: [{ x: 50, y: 42 }],
  loop2After: [{ x: 46, y: 42 }],
  loop3: [
    { x: 42, y: 43 },
    { x: 58, y: 41, flip: true },
  ],
  loop3Lunch: [{ x: 52, y: 42 }],
  loop3After: [{ x: 47, y: 42 }],
};

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
