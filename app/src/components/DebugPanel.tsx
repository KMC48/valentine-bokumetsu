/** ?debug=true で表示される開発用パネル。 */

import { useGameStore } from "../store/gameStore";
import type { LoopId } from "../types/game";

export function DebugPanel() {
  const store = useGameStore();

  return (
    <div className="debug-panel">
      <div>
        <b>DEBUG</b> loop{store.loop} / {store.stage} / {store.screen}
      </div>
      <div>
        score {store.score} / combo {store.combo} / 残り {Math.ceil(store.timeRemaining)}s
      </div>
      <div className="row">
        <button type="button" onClick={store.toggleTimer}>
          {store.timerFrozen ? "タイマー再開" : "タイマー停止"}
        </button>
        <button type="button" onClick={() => useGameStore.setState({ score: store.score + 1000 })}>
          +1000pt
        </button>
        <button type="button" onClick={store.endStage}>
          ステージ終了
        </button>
      </div>
      <div className="row">
        {([1, 2, 3] as LoopId[]).map((l) => (
          <button key={l} type="button" onClick={() => store.startRun(l)}>
            周回{l}へ
          </button>
        ))}
      </div>
    </div>
  );
}
