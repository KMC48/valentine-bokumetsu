/**
 * 場所の切り替えバー。
 *
 * 表示するのは「その場所に残っている人数」だけで、
 * 「チョコを持っている人数」は出さない（それを出すと推理が不要になる）。
 */

import { AREA_MOVE_SECONDS } from "../data/score";
import type { AreaDef } from "../data/areas";

type Props = {
  areas: AreaDef[];
  currentArea: string;
  /** 場所ID → まだ処理していない生徒＋机の数。 */
  remaining: Record<string, number>;
  timeRemaining: number;
  onMove: (area: string) => void;
};

export function AreaBar({ areas, currentArea, remaining, timeRemaining, onMove }: Props) {
  const cannotMove = timeRemaining < AREA_MOVE_SECONDS;

  return (
    <div className="areabar">
      <div className="areabar__label">
        移動<span className="areabar__cost">-{AREA_MOVE_SECONDS}秒</span>
      </div>
      <div className="areabar__list">
        {areas.map((area) => {
          const isHere = area.id === currentArea;
          const left = remaining[area.id] ?? 0;
          return (
            <button
              key={area.id}
              type="button"
              className={`areabar__chip${isHere ? " is-here" : ""}`}
              disabled={isHere || cannotMove}
              onClick={() => onMove(area.id)}
              title={area.hint}
            >
              <span className="areabar__name">{area.label}</span>
              <span className={`areabar__count${left === 0 ? " is-empty" : ""}`}>{left}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
