/**
 * 校内掲示物（禁止ポスター・横断幕・教室プレート）を壁に重ねる。
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

const src = (a: { src: string; status: string }) => (a.status === "ready" ? a.src : null);

/**
 * 校門の横断幕。
 *
 * 3校とも校舎の写り方がほぼ同じなので、位置と大きさは共通。
 * 布と書体だけが学校ごとに違うので、絵だけ差し替える。
 *
 * 以前は `loop2` / `loop3` という場所IDで登録していたが、
 * 実際の場所IDは `l2Gate` / `l3Gate` なので一度も表示されていなかった。
 */
function gateBanner(src: string): SignPlacement[] {
  // 画面いっぱいに広げると「門に渡した幕」に見えてしまう。
  // 校舎の壁面に貼られた掲示物として、奥の校舎の上部に小さく置く。
  return [{ src, left: 34, top: 2, width: 32, rotate: 0, opacity: 0.95 }];
}

/** 教室の黒板に貼る禁止ポスター。3校とも黒板の写り方が同じなので共有する。 */
const CLASSROOM_SIGNS: SignPlacement[] = [
  // 高さは幅の約1.6倍になる。黒板は縦0〜12%なので、幅5%（縦8%）までに抑える。
  { src: ASSETS.signNoSweets.src, left: 28, top: 2, width: 5, rotate: 0 },
];

/** 場所ごとの掲示物の配置。 */
const PLACEMENTS: Record<string, SignPlacement[]> = {
  // 昇降口は横断幕だけ。禁止ポスターは教室の黒板にだけ貼る。
  entrance: [{ src: ASSETS.bannerLoop1.src, left: 30, top: 3, width: 40, rotate: 0, opacity: 0.95 }],
  // 室名札（2-1）は廊下側に掛かるものなので、教室の中には出さない。
  // 禁止ポスターは奥の黒板に貼る。
  // 新しい教室背景は真正面からの構図なので、傾けない。
  // 黒板は横21〜78%・縦0〜12%に写っているので、その中に収める。
  classroom: CLASSROOM_SIGNS,
  l2Classroom: CLASSROOM_SIGNS,
  l3Classroom: CLASSROOM_SIGNS,
  // 横断幕は「校舎の壁に掛かっている物」なので、手前ではなく奥の校舎面に合わせる。
  // 校門の絵では校舎が画面のいちばん上（〜15%）に写っているので、そこへ寄せる。
  gate: gateBanner(ASSETS.bannerLoop1.src),
  gateAfter: gateBanner(ASSETS.bannerLoop1.src),
  l2Gate: gateBanner(ASSETS.bannerLoop2.src),
  l3Gate: gateBanner(ASSETS.bannerLoop3.src),
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

// src ヘルパーは将来 status を見る用（現状すべて ready）。
void src;
