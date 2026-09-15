/** 3ステージ終了後の最終結果。 */

import { useMemo } from "react";
import { LOOP_CONFIG } from "../data/loops";
import { rankFor } from "../game/score";
import { useGameStore } from "../store/gameStore";

export function FinalResultScreen() {
  const loop = useGameStore((s) => s.loop);
  const score = useGameStore((s) => s.score);
  const goEnding = useGameStore((s) => s.goEnding);
  // stats() は毎回新しいオブジェクトを返すのでセレクタで直接呼ばない
  // （zustand のスナップショット比較が壊れて無限再描画になる）。
  const stats = useMemo(() => useGameStore.getState().stats(), [score]);

  const rank = rankFor(stats.score);
  const cfg = LOOP_CONFIG[loop];
  const ratePercent = Math.round(stats.annihilationRate * 100);

  return (
    <div className="screen result-screen stack">
      <div className="result-screen__stage">FINAL RESULT — {cfg.schoolName}</div>

      <div className="panel result-screen__total">
        <div className="result-screen__total-label">TOTAL SCORE</div>
        <div className="result-screen__total-value">{stats.score.toLocaleString()}</div>
        <div style={{ marginTop: "0.5em" }}>
          <span className={`rank-badge${rank === "C" || rank === "D" ? " rank-badge--low" : ""}`}>
            {rank}
          </span>
        </div>
      </div>

      <div>
        <div className="stat-row" style={{ background: "none", padding: "0 0 0.3em" }}>
          <span>撲滅率</span>
          <b style={{ color: "var(--gold)" }}>{ratePercent}%</b>
        </div>
        <div className="gauge">
          <div className="gauge__fill" style={{ width: `${ratePercent}%` }} />
        </div>
      </div>

      <div className="stat-list">
        <div className="stat-row">
          <span>通報成功数</span>
          <b>{stats.correctReports}</b>
        </div>
        <div className="stat-row">
          <span>友チョコ摘発</span>
          <b>{stats.friendCount}</b>
        </div>
        <div className="stat-row">
          <span>本命チョコ摘発</span>
          <b>{stats.honmeiCount}</b>
        </div>
        <div className="stat-row stat-row--highlight">
          <span>告白直前阻止</span>
          <b>{stats.specialCount}</b>
        </div>
        <div className="stat-row">
          <span>机から発見</span>
          <b>{stats.deskFinds}</b>
        </div>
        <div className="stat-row">
          <span>誤認通報</span>
          <b style={{ color: stats.falseReports > 0 ? "var(--danger)" : undefined }}>
            {stats.falseReports}
          </b>
        </div>
        <div className="stat-row">
          <span>最大コンボ</span>
          <b>{stats.maxCombo}</b>
        </div>
      </div>

      <div className="result-screen__actions">
        <button type="button" className="btn btn--primary" onClick={goEnding}>
          エンディングへ
        </button>
      </div>
    </div>
  );
}
