import { ASSETS } from "../data/assets";
import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";

export function TitleScreen() {
  const goLoopSelect = useGameStore((s) => s.goLoopSelect);
  const goSettings = useGameStore((s) => s.goSettings);
  const startRun = useGameStore((s) => s.startRun);
  const unlockedLoop = useSaveStore((s) => s.unlockedLoop);
  const endings = useSaveStore((s) => s.endings);

  const bg = ASSETS.titleBackground.status === "ready" ? ASSETS.titleBackground.src : null;

  return (
    <div className="screen title-screen">
      {/* 完成CG（主人公・女子生徒・教師込み）をそのまま使用。上に追加の立ち絵は重ねない。 */}
      {bg ? (
        <img className="title-screen__bg" src={bg} alt="" />
      ) : (
        <div className="title-screen__bg title-screen__bg--fallback" />
      )}
      <div className="title-screen__scrim-top" />
      <div className="title-screen__scrim-bottom" />

      <div className="title-screen__logo">
        <h1 className="title-screen__main">
          バレンタイン<em>撲滅</em>委員会
        </h1>
        <p className="title-screen__tagline">甘い世界を、終わらせろ。</p>
      </div>

      <div className="title-screen__menu">
        <button type="button" className="btn btn--primary" onClick={() => startRun(1)}>
          はじめから（1周目）
        </button>
        <button type="button" className="btn" onClick={goLoopSelect}>
          学校をえらぶ（解放 {unlockedLoop}/3）
        </button>
        <button type="button" className="btn btn--ghost" onClick={goSettings}>
          設定
        </button>
        <p className="title-screen__footer">
          到達エンディング {endings.length} 種 ／ 校則第12条：菓子類の持ち込みを禁ずる
        </p>
      </div>
    </div>
  );
}
