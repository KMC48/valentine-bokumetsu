/**
 * 校内掲示物（禁止ポスター）を壁に重ねる。
 *
 * 背景画像に描き込むのではなく別レイヤーにしてあるので、
 * どの場所の背景にも同じ掲示物を貼れる。場所ごとに出す物と位置を変える。
 */

import { ASSETS } from "../data/assets";

type SignPlacement = {
  src: string;
  /** ゲームエリアに対する%。 */
  left: number;
  top: number;
  width: number;
  /** 壁の向きに合わせた傾き。 */
  rotate: number;
  opacity?: number;
};

/** 教室の黒板に貼る禁止ポスター。3校とも黒板の写り方が同じなので共有する。 */
const CLASSROOM_SIGNS: SignPlacement[] = [
  // 高さは幅の約1.6倍になる。黒板は縦0〜12%なので、幅5%（縦8%）までに抑える。
  { src: ASSETS.signNoSweets.src, left: 28, top: 2, width: 5, rotate: 0 },
];

/** 場所ごとの掲示物の配置。 */
const PLACEMENTS: Record<string, SignPlacement[]> = {
  // 横断幕は全エリアから撤去。教室の禁止ポスターだけを残す。
  classroom: CLASSROOM_SIGNS,
  l2Classroom: CLASSROOM_SIGNS,
  l3Classroom: CLASSROOM_SIGNS,
};

/** 掲示物を登録している場所ID。実在する場所かどうかをテストで突き合わせる。 */
export const SIGNAGE_AREA_IDS = Object.keys(PLACEMENTS);

export function Signage({ areaId }: { areaId: string }) {
  const placements = PLACEMENTS[areaId];
  if (!placements || ASSETS.signNoSweets.status !== "ready") return null;

  return (
    <>
      {placements.map((p, i) => (
        <img
          key={i}
          className="signage"
          src={p.src}
          alt=""
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.width}%`,
            transform: `rotate(${p.rotate}deg)`,
            opacity: p.opacity ?? 0.95,
          }}
        />
      ))}
    </>
  );
}
