/** 画面上部のタイトルバー＋スコア/コンボ/ミッション/タイマー。 */

import { comboMultiplier } from "../game/score";
import { NoChocoMark } from "./Sprites";

type Props = {
  score: number;
  combo: number;
  /** 「県立 桜庭高等学校／朝：登校」など。 */
  place: string;
  mission: string;
  caught: number;
  total: number;
  timeRemaining: number;
  onMenu: () => void;
};

function formatTime(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function HUD({ score, combo, place, mission, caught, total, timeRemaining, onMenu }: Props) {
  const mult = comboMultiplier(combo);

  return (
    <>
      <div className="titlebar">
        <div className="titlebar__logo">
          <div style={{ width: "2.2em", height: "2.2em", flex: "0 0 auto" }}>
            <NoChocoMark />
          </div>
          <div>
            <div className="titlebar__name">
              バレンタイン<em>撲滅</em>委員会
            </div>
            <div className="titlebar__sub">甘い世界を、終わらせろ。</div>
          </div>
        </div>
        <div className="titlebar__spacer" />
        <button type="button" className="menu-btn" onClick={onMenu} aria-label="メニュー">
          <span />
          <span />
          <span />
          MENU
        </button>
      </div>

      <div className="hud">
        <div className="hud__box">
          <div className="hud__label">SCORE</div>
          <div className="hud__score">
            {score.toLocaleString()}
            <small>pt</small>
          </div>
          <div className="hud__combo">
            コンボ <b>{combo}</b>
            {mult > 1 && <span className="mult">×{mult.toFixed(1)}</span>}
          </div>
        </div>

        <div className="hud__box hud__mission">
          <div className="hud__label">
            MISSION<span className="hud__place">{place}</span>
          </div>
          <div className="hud__mission-text">
            {mission} <span className="hud__mission-count">{caught}/{total}</span>
          </div>
        </div>

        <div className="hud__box" style={{ textAlign: "right" }}>
          <div className="hud__label">残り時間</div>
          <div className={`hud__timer${timeRemaining <= 30 ? " is-warning" : ""}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </>
  );
}
