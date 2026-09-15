/** 画面ルーター。screen の値だけで表示を切り替える。 */

import { useEffect } from "react";
import { EndingScreen } from "../screens/EndingScreen";
import { FinalResultScreen } from "../screens/FinalResultScreen";
import { LoopSelectScreen } from "../screens/LoopSelectScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { StageResultScreen } from "../screens/StageResultScreen";
import { StageScreen } from "../screens/StageScreen";
import { StoryScreen } from "../screens/StoryScreen";
import { TitleScreen } from "../screens/TitleScreen";
import { firstAreaFor } from "../data/areas";
import { playBgm, setBgmVolume, unlockOnFirstGesture } from "../game/audioEngine";
import { bgmForScreen } from "../game/bgmSelect";
import { useSaveStore } from "../store/saveStore";
import { STAGES } from "../data/stages";
import { useGameStore } from "../store/gameStore";
import type { LoopId } from "../types/game";

export function App() {
  const screen = useGameStore((s) => s.screen);
  const stage = useGameStore((s) => s.stage);
  const setDebug = useGameStore((s) => s.setDebug);
  const bgmVolume = useSaveStore((s) => s.settings.bgmVolume);

  // ブラウザの自動再生制限があるので、最初の操作を拾って音を解禁する。
  useEffect(() => unlockOnFirstGesture(), []);

  // 画面と時間帯だけで曲を決める（残り人数などで変えると情報が漏れる）。
  useEffect(() => {
    void playBgm(bgmForScreen(screen, stage));
  }, [screen, stage]);

  useEffect(() => {
    setBgmVolume(bgmVolume);
  }, [bgmVolume]);

  // ?debug=true でデバッグモード。
  // ?loop=2&stage=lunch でステージへ直行。?loop=2&story=opening でストーリーへ直行。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "true") {
      setDebug(true);
      // デバッグ時のみ、動作確認用にストアをwindowへ公開する。
      (window as unknown as Record<string, unknown>).__gameStoreForQA = useGameStore;
    }

    const story = params.get("story");
    if (story === "opening" || story === "interlude1" || story === "interlude2") {
      const loop = Number(params.get("loop") ?? 1);
      const loopId = (loop === 2 || loop === 3 ? loop : 1) as LoopId;
      useGameStore.getState().startRun(loopId);
      useGameStore.setState({ screen: "story", storySlot: story });
      return;
    }

    const stage = params.get("stage");
    if (stage === "morning" || stage === "lunch" || stage === "afterSchool") {
      const loop = Number(params.get("loop") ?? 1);
      const store = useGameStore.getState();
      const loopId = (loop === 2 || loop === 3 ? loop : 1) as LoopId;
      store.startRun(loopId);
      store.finishStory();
      useGameStore.setState({
        stage,
        // ステージを直接指定したときは、現在地もそのステージの最初の場所に合わせる。
        area: firstAreaFor(loopId, stage),
        timeRemaining: STAGES[stage].timeLimit,
      });
    }
  }, [setDebug]);

  return (
    <div className="app-root">
      <div className="app-frame">
        {screen === "title" && <TitleScreen />}
        {screen === "loopSelect" && <LoopSelectScreen />}
        {screen === "settings" && <SettingsScreen />}
        {screen === "story" && <StoryScreen />}
        {screen === "stage" && <StageScreen />}
        {screen === "stageResult" && <StageResultScreen />}
        {screen === "finalResult" && <FinalResultScreen />}
        {screen === "ending" && <EndingScreen />}
      </div>
    </div>
  );
}
