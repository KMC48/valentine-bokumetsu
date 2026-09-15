/** ステージ背景。周回×時間帯の実写背景があればそれを、無ければCSSの仮背景を使う。 */

import type { AreaDef } from "../data/areas";
import { STAGES } from "../data/stages";
import type { StageId } from "../types/game";
import { Signage } from "./Signage";
import { TeacherSprite } from "./Sprites";

type Props = {
  stage: StageId;
  area: AreaDef;
};

export function StageBackdrop({ stage, area }: Props) {
  const def = STAGES[stage];

  return (
    <div className={`backdrop backdrop--${def.palette}`}>
      {area.background ? (
        <>
          <img
            className="backdrop__img"
            src={area.background}
            alt=""
            style={{ objectPosition: `center ${area.focusY}%` }}
          />
          <Signage areaId={area.id} />
        </>
      ) : (
        <>
          {/* 素材未着手時の仮背景（廊下のパースを線で表現）。 */}
          <div className="backdrop__vanish" />
          <div className="backdrop__line" style={{ left: 0, top: "54%", width: "100%", height: 1 }} />
          <div
            className="backdrop__line"
            style={{ left: "50%", top: "26%", width: 1, height: "74%", transform: "rotate(22deg)" }}
          />
          <div
            className="backdrop__line"
            style={{ left: "50%", top: "26%", width: 1, height: "74%", transform: "rotate(-22deg)" }}
          />
          <div className="backdrop__floor" />
          <div className="backdrop__notice">
            お菓子の
            <br />
            持ち込み
            <br />
            禁止！
          </div>
          <div className="backdrop__banner">
            清く正しく
            <br />
            バレンタインのない学校へ
          </div>
          {/* 遠景の生徒指導教師（プレースホルダー時のみ） */}
          <div
            style={{
              position: "absolute",
              left: "60%",
              top: "30%",
              width: "13%",
              opacity: 0.85,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,.4))",
            }}
          >
            <TeacherSprite />
          </div>
        </>
      )}
    </div>
  );
}
