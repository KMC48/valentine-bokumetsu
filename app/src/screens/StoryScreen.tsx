/** ADVパート。タップで次へ（MVPの必須要件）＋スキップ。 */

import { useEffect, useState } from "react";
import { ASSETS } from "../data/assets";
import { stageBackgroundFor } from "../data/areas";
import { getStory } from "../data/stories";
import { useGameStore } from "../store/gameStore";
import type { LoopId, StageId, StoryScene } from "../types/game";
import { playerBustSrc } from "../game/playerVoice";

/** ストーリーのスロット→対応ステージ（背景選択・gameStore.finishStory と揃える）。 */
function stageForSlot(slot: StoryScene["slot"]): StageId {
  if (slot === "opening") return "morning";
  if (slot === "interlude1") return "lunch";
  return "afterSchool";
}

/**
 * 話者名 → バストアップ立ち絵（ノベルゲーム風）。
 * ここに無い話者（ナレーションや脇役）は立ち絵なしで進行する。
 */
function characterFor(speaker: string, loop: LoopId): string | null {
  if (speaker === "俺") return ASSETS.bustPlayer.status === "ready" ? playerBustSrc(loop) : null;
  if (speaker.startsWith("生徒指導")) {
    return ASSETS.bustTeacher.status === "ready" ? ASSETS.bustTeacher.src : null;
  }
  if (speaker.includes("男子")) {
    return ASSETS.bustBoy001.status === "ready" ? ASSETS.bustBoy001.src : null;
  }
  return null;
}

export function StoryScreen() {
  const loop = useGameStore((s) => s.loop);
  const storySlot = useGameStore((s) => s.storySlot);
  const finishStory = useGameStore((s) => s.finishStory);

  const scene = getStory(loop, storySlot);
  const [index, setIndex] = useState(0);
  const background = stageBackgroundFor(loop, stageForSlot(storySlot));

  // シーンが変わったら先頭から。
  useEffect(() => {
    setIndex(0);
  }, [scene?.id]);

  if (!scene || scene.lines.length === 0) {
    // データが無くても進行を止めない。
    return (
      <div className="screen story-screen" onClick={finishStory}>
        <div className="story-screen__box">
          <div className="story-screen__text">（シナリオ未実装）タップで次へ</div>
        </div>
      </div>
    );
  }

  const line = scene.lines[Math.min(index, scene.lines.length - 1)]!;
  const isLast = index >= scene.lines.length - 1;
  const character = line.character ?? characterFor(line.speaker, loop);

  const next = () => {
    if (isLast) finishStory();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="screen story-screen" onClick={next}>
      <img className="story-screen__bg-img" src={line.background ?? background} alt="" />
      <div className="story-screen__scrim" />
      <div className="story-screen__title">{scene.title}</div>

      <button
        type="button"
        className="btn btn--ghost story-screen__skip"
        onClick={(e) => {
          e.stopPropagation();
          finishStory();
        }}
      >
        スキップ ▶▶
      </button>

      {character && <img className="story-screen__character" src={character} alt="" />}

      <div className="story-screen__box">
        {line.speaker && <span className="story-screen__speaker">{line.speaker}</span>}
        <p className="story-screen__text">{line.text}</p>
        <span className="story-screen__progress">
          {index + 1} / {scene.lines.length}
        </span>
        <span className="story-screen__next">{isLast ? "▼ 開始" : "▼ NEXT"}</span>
      </div>
    </div>
  );
}
