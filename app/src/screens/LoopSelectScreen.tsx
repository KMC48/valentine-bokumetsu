import { stageBackgroundFor } from "../data/areas";
import { LOOP_CONFIG, LOOP_IDS } from "../data/loops";
import { countChocolateHolders } from "../data/students";
import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";

export function LoopSelectScreen() {
  const startRun = useGameStore((s) => s.startRun);
  const goTitle = useGameStore((s) => s.goTitle);
  const unlockedLoop = useSaveStore((s) => s.unlockedLoop);
  const bestScores = useSaveStore((s) => s.bestScores);

  return (
    <div className="screen loop-screen stack">
      <h2 className="screen-heading">学校をえらぶ</h2>

      {LOOP_IDS.map((id) => {
        const cfg = LOOP_CONFIG[id];
        const locked = id > unlockedLoop;
        const best = bestScores[`loop${id}`];

        return (
          <button
            key={id}
            type="button"
            className={`panel loop-card${locked ? " loop-card--locked" : ""}`}
            disabled={locked}
            onClick={() => startRun(id)}
          >
            <img className="loop-card__thumb" src={stageBackgroundFor(id, "morning")} alt="" />
            <div className="loop-card__scrim" />
            <div className="loop-card__body">
              <div className="loop-card__top">
                <span className="loop-card__no">{id}周目</span>
                <span className="loop-card__diff">{cfg.difficultyLabel}</span>
              </div>
              <div className="loop-card__school">{locked ? "？？？（未解放）" : cfg.schoolName}</div>
              <div className="loop-card__theme">
                テーマ：「{cfg.theme}」／ ターゲット {countChocolateHolders(id)}人 ／ ヒント{cfg.hintCount}件
              </div>
              {best !== undefined && <div className="loop-card__best">ベスト {best.toLocaleString()}pt</div>}
              {locked && <div className="loop-card__theme">前の周回をクリアすると解放される</div>}
            </div>
          </button>
        );
      })}

      <button type="button" className="btn btn--ghost" onClick={goTitle} style={{ marginTop: "auto" }}>
        タイトルへ戻る
      </button>
    </div>
  );
}
