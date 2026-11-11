/** 各ステージ終了時のリザルト。 */

import { STAGES } from "../data/stages";
import { getStudents } from "../data/students";
import { stageTargetTotal, useGameStore } from "../store/gameStore";

export function StageResultScreen() {
  const { loop, stage, score, stageStartScore, correctReports, stageStartCaught, maxCombo, passedIds } =
    useGameStore();
  const advance = useGameStore((s) => s.advanceAfterStage);
  // 数値を返すセレクタなので再描画ループにはならない。
  const stageCaught = useGameStore((s) => s.stageCaught());

  const def = STAGES[stage];
  const gained = score - stageStartScore;
  const total = stageTargetTotal(loop, stage);
  const nextLabel = stage === "afterSchool" ? "最終結果へ" : "次のパートへ";
  const passed = getStudents(loop, stage).filter((s) => passedIds.includes(s.id));
  const correctPasses = passed.filter((s) => s.chocolateType === "none").length;

  return (
    <div className="screen result-screen stack">
      <div className="result-screen__stage">STAGE CLEAR — {def.label}</div>

      <div className="panel result-screen__total">
        <div className="result-screen__total-label">STAGE SCORE</div>
        <div className="result-screen__total-value">
          {gained >= 0 ? "+" : ""}
          {gained.toLocaleString()}
        </div>
        <div className="muted" style={{ fontSize: "0.7em" }}>
          累計 {score.toLocaleString()}pt
        </div>
      </div>

      <div className="stat-list">
        <div className="stat-row"><span>無実を正しく見送った</span><b>{correctPasses}人</b></div>
        <div className="stat-row"><span>チョコ所持者を見送った</span><b>{passed.length - correctPasses}人</b></div>
        <div className="stat-row">
          <span>摘発したチョコ</span>
          <b>
            {stageCaught} / {total}
          </b>
        </div>
        <div className="stat-row">
          <span>このステージの通報成功</span>
          <b>{correctReports - stageStartCaught}</b>
        </div>
        <div className="stat-row stat-row--highlight">
          <span>最大コンボ</span>
          <b>{maxCombo}</b>
        </div>
      </div>

      {passed.length > 0 && <details className="deduction-review">
        <summary>見送った判断の答え合わせ</summary>
        <p>巡回後に分かったことを振り返ろう。見送りによる得点の増減はない。</p>
        {passed.map((s) => <div className="deduction-review__student" key={s.id}>
          <strong>{s.name}：{s.chocolateType === "none" ? "チョコ所持なし" : "チョコ所持"}</strong>
          <p>{s.hints.join("")}</p>
        </div>)}
      </details>}

      <div className="panel" style={{ padding: "0.7em" }}>
        <div className="muted" style={{ fontSize: "0.68em", lineHeight: 1.6 }}>
          {stageCaught >= total
            ? "このステージのチョコは全て押収した。完璧な仕事だ。"
            : "取り逃がした分は、校内のどこかで渡されている。次で取り返せ。"}
        </div>
      </div>

      <div className="result-screen__actions">
        <button type="button" className="btn btn--primary" onClick={advance}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
