/** 背景上に % 配置される生徒ターゲット。画像が無ければ SVG 仮スプライト。 */

import { ASSETS } from "../data/assets";
import { floorX, type FloorShape } from "../data/loops";
import { isSuspicionVisible } from "../game/difficulty";
import { depthHeight } from "../game/perspective";
import type { LoopId, Student } from "../types/game";
import { GirlSprite } from "./Sprites";

type Props = {
  student: Student;
  loop: LoopId;
  /** 場所の床形状。奥行きに応じた横位置の補正に使う。 */
  view: { floor: FloorShape };
  selected: boolean;
  debug: boolean;
  onSelect: (id: string) => void;
};


/**
 * 選択中に見せる「振り向き」差分。
 * 通常の立ち絵と同じ人物・同じ足元アンカー・同じ身長なので、切り替えても大きさが飛ばない。
 *
 * 学校別の制服差分（loop2_girl_* / loop3_girl_*）には振り向きが無い。
 * ここに載せないことで、紺制服の振り向きに化けるのを防いでいる
 * （制服が変わってしまい、別人に見えるため）。
 */
export const TURN_VARIANT: Record<string, string> = {
  [ASSETS.girl001.src]: ASSETS.girl001Turn.src,
  [ASSETS.girl002.src]: ASSETS.girl002Turn.src,
  [ASSETS.girl003.src]: ASSETS.girl003Turn.src,
  [ASSETS.girl004.src]: ASSETS.girl004Turn.src,
  [ASSETS.girl005.src]: ASSETS.girl005Turn.src,
  [ASSETS.girl006.src]: ASSETS.girl006Turn.src,
  [ASSETS.girl007.src]: ASSETS.girl007Turn.src,
  [ASSETS.girl008.src]: ASSETS.girl008Turn.src,
  [ASSETS.girl009.src]: ASSETS.girl009Turn.src,
  [ASSETS.girl010.src]: ASSETS.girl010Turn.src,
  // 学校別制服の振り向き（0916追加）。以前は差分が無く、
  // 紺の制服に化けるのを防ぐためあえて登録していなかった。
  [ASSETS.loop2Girl01.src]: ASSETS.loop2Girl01Turn.src,
  [ASSETS.loop2Girl02.src]: ASSETS.loop2Girl02Turn.src,
  [ASSETS.loop2Girl03.src]: ASSETS.loop2Girl03Turn.src,
  [ASSETS.loop2Girl04.src]: ASSETS.loop2Girl04Turn.src,
  [ASSETS.loop2Girl05.src]: ASSETS.loop2Girl05Turn.src,
  [ASSETS.loop3Girl01.src]: ASSETS.loop3Girl01Turn.src,
  [ASSETS.loop3Girl02.src]: ASSETS.loop3Girl02Turn.src,
  [ASSETS.loop3Girl03.src]: ASSETS.loop3Girl03Turn.src,
  [ASSETS.loop3Girl04.src]: ASSETS.loop3Girl04Turn.src,
  [ASSETS.loop3Girl05.src]: ASSETS.loop3Girl05Turn.src,
  [ASSETS.loop2Girl06.src]: ASSETS.loop2Girl06Turn.src,
  [ASSETS.loop2Girl07.src]: ASSETS.loop2Girl07Turn.src,
  [ASSETS.loop2Girl08.src]: ASSETS.loop2Girl08Turn.src,
  [ASSETS.loop2Girl09.src]: ASSETS.loop2Girl09Turn.src,
  [ASSETS.loop2Girl10.src]: ASSETS.loop2Girl10Turn.src,
  [ASSETS.loop3Girl06.src]: ASSETS.loop3Girl06Turn.src,
  [ASSETS.loop3Girl07.src]: ASSETS.loop3Girl07Turn.src,
  [ASSETS.loop3Girl08.src]: ASSETS.loop3Girl08Turn.src,
  [ASSETS.loop3Girl09.src]: ASSETS.loop3Girl09Turn.src,
  [ASSETS.loop3Girl10.src]: ASSETS.loop3Girl10Turn.src,
};

export function StudentTarget({ student, loop, view, selected, debug, onSelect }: Props) {
  const h = depthHeight(student.position.y);
  const x = floorX(view.floor, student.position.x, student.position.y);
  const showMark = isSuspicionVisible(student, loop);
  // 狙われた生徒はこちらを振り向く。
  const image =
    selected && student.image && TURN_VARIANT[student.image]
      ? TURN_VARIANT[student.image]!
      : student.image;

  return (
    <button
      type="button"
      className="target"
      style={{
        left: `${x}%`,
        top: `${student.position.y}%`,
        height: `${h}%`,
        zIndex: Math.round(student.position.y),
      }}
      onClick={() => onSelect(student.id)}
      aria-label={`${student.name}を観察する`}
    >
      {/* 足元の接地影。これが無いと切り抜きを貼っただけのように見える。 */}
      <span className="target__ground" aria-hidden="true" />

      {image ? (
        <img className="target__img" src={image} alt="" />
      ) : (
        <span className="target__sprite">
          <GirlSprite
            hair={student.appearance?.hair}
            ribbon={student.appearance?.ribbon}
            item={student.visibleItem ?? "none"}
          />
        </span>
      )}

      {selected && <span className="reticle" />}

      <span className="target__label">
        <span className="target__nameline">
          {showMark && <span className="target__mark">!</span>}
          <span className="target__name">{student.name}</span>
        </span>
        {debug && (
          <span className="target__debug">
            {student.id} / {student.chocolateType}
          </span>
        )}
      </span>
    </button>
  );
}
