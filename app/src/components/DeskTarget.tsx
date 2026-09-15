/** 教室の机（調べられるスポット）。背景に机が描かれている場所では枠だけを重ねる。 */

import { ASSETS } from "../data/assets";
import type { DeskSpot } from "../types/game";

type Props = {
  desk: DeskSpot;
  onSelect: (id: string) => void;
  debug: boolean;
};

export function DeskTarget({ desk, onSelect, debug }: Props) {
  return (
    <button
      type="button"
      className="desk"
      style={{
        left: `${desk.position.x}%`,
        top: `${desk.position.y}%`,
        height: `${desk.size}%`,
        // 机は背景の備品なので、生徒（zIndex = position.y）より奥に置く。
        zIndex: Math.max(1, Math.round(desk.position.y) - 2),
      }}
      onClick={() => onSelect(desk.id)}
      aria-label={`${desk.label}の机を調べる`}
    >
      {desk.image ? (
        <img className="desk__img" src={desk.image} alt="" />
      ) : (
        <span className="desk__frame" aria-hidden="true" />
      )}
      <span className="desk__icon" aria-hidden="true">
        {ASSETS.iconSearch.status === "ready" ? (
          <img src={ASSETS.iconSearch.src} alt="" />
        ) : (
          "🔍"
        )}
      </span>
      <span className="desk__label">机を調べる</span>
      {debug && <span className="desk__debug">{desk.id} / {desk.content}</span>}
    </button>
  );
}
