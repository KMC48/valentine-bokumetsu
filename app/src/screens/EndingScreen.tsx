/** エンディング。結末CG＋セリフを表示し、読み終わると周回解放の告知を出してタイトルへ。 */

import { useState } from "react";
import { ENDING_CG } from "../data/endings";
import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";
import type { LoopId } from "../types/game";

export function EndingScreen() {
  const ending = useGameStore((s) => s.ending);
  const loop = useGameStore((s) => s.loop);
  const startRun = useGameStore((s) => s.startRun);
  const goTitle = useGameStore((s) => s.goTitle);
  const unlockedLoop = useSaveStore((s) => s.unlockedLoop);

  const [index, setIndex] = useState(0);

  if (!ending) {
    return (
      <div className="screen ending-screen" onClick={goTitle}>
        <div className="story-screen__box">
          <p className="story-screen__text">（エンディングデータなし）タップでタイトルへ</p>
        </div>
      </div>
    );
  }

  const cg = ENDING_CG[ending.id];
  const line = ending.lines[Math.min(index, ending.lines.length - 1)]!;
  const finished = index >= ending.lines.length;
  const nextLoop = (loop + 1) as LoopId;
  const unlockedNext = loop < 3 && unlockedLoop >= nextLoop;

  const background =
    cg?.src ? (
      <img
        className={`ending-screen__cg ending-screen__cg--${cg.fit}`}
        src={cg.src}
        alt=""
      />
    ) : (
      <div className="ending-screen__cg ending-screen__cg--fallback" />
    );

  if (finished) {
    return (
      <div className="screen ending-screen stack" style={{ justifyContent: "flex-end", padding: "1.2em" }}>
        {background}
        <div className="ending-screen__scrim" />
        <div className="center" style={{ marginBottom: "1.2em", position: "relative", zIndex: 2 }}>
          <div className="ending-screen__kicker" style={{ position: "static" }}>
            ENDING
          </div>
          <div className="ending-screen__title" style={{ position: "static" }}>
            {ending.title}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          {unlockedNext && (
            <div className="ending-screen__unlock">
              ▶ {nextLoop}周目「{nextLoop === 2 ? "私立進学校" : "超難関エリート校"}」が解放された！
            </div>
          )}
          {loop === 3 && (
            <div className="ending-screen__unlock">▶ 全周回クリア。委員会の活動は来年も続く。</div>
          )}

          <div className="result-screen__actions" style={{ marginTop: 0 }}>
            {unlockedNext && (
              <button type="button" className="btn btn--primary" onClick={() => startRun(nextLoop)}>
                {nextLoop}周目へ進む
              </button>
            )}
            <button type="button" className="btn" onClick={() => startRun(loop)}>
              この学校をやり直す
            </button>
            <button type="button" className="btn btn--ghost" onClick={goTitle}>
              タイトルへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen ending-screen story-screen" onClick={() => setIndex((i) => i + 1)}>
      {background}
      <div className="ending-screen__kicker">ENDING</div>
      <div className="ending-screen__title">{ending.title}</div>

      <div className="story-screen__box" style={{ position: "relative", zIndex: 2 }}>
        {line.speaker && <span className="story-screen__speaker">{line.speaker}</span>}
        <p className="story-screen__text">{line.text}</p>
        <span className="story-screen__progress">
          {index + 1} / {ending.lines.length}
        </span>
        <span className="story-screen__next">▼ NEXT</span>
      </div>
    </div>
  );
}
