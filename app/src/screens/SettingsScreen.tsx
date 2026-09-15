/** 設定。音量はMVPでは値の保存のみ（BGM/SE は優先度B）。 */

import { useGameStore } from "../store/gameStore";
import { useSaveStore } from "../store/saveStore";

export function SettingsScreen() {
  const goTitle = useGameStore((s) => s.goTitle);
  const debug = useGameStore((s) => s.debug);
  const setDebug = useGameStore((s) => s.setDebug);
  const settings = useSaveStore((s) => s.settings);
  const setVolume = useSaveStore((s) => s.setVolume);
  const resetSave = useSaveStore((s) => s.resetSave);
  const unlockedLoop = useSaveStore((s) => s.unlockedLoop);
  const endings = useSaveStore((s) => s.endings);

  return (
    <div className="screen settings-screen stack">
      <h2 className="screen-heading">設定</h2>

      <div className="panel settings-row">
        <label htmlFor="bgm">
          BGM音量：{Math.round(settings.bgmVolume * 100)}%
          {settings.bgmVolume === 0 && <span className="settings-muted">（ミュート）</span>}
        </label>
        <input
          id="bgm"
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.bgmVolume * 100)}
          onChange={(e) => setVolume("bgm", Number(e.target.value) / 100)}
        />
      </div>

      <div className="panel settings-row">
        <label htmlFor="se">SE音量：{Math.round(settings.seVolume * 100)}%</label>
        <input
          id="se"
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.seVolume * 100)}
          onChange={(e) => setVolume("se", Number(e.target.value) / 100)}
        />
      </div>

      <div className="panel settings-row">
        <label htmlFor="debug">
          <input
            id="debug"
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            style={{ marginRight: "0.5em" }}
          />
          デバッグモード（生徒IDとチョコ種別を表示／タイマー無制限）
        </label>
        <p className="settings-note">URLに ?debug=true を付けても有効になる。</p>
      </div>

      <div className="panel settings-row">
        <label>セーブデータ</label>
        <p className="settings-note">
          解放済み：{unlockedLoop}周目まで ／ 到達エンディング：{endings.length}種
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            if (window.confirm("セーブデータを消去する？ 解放した周回も戻る。")) resetSave();
          }}
        >
          セーブデータを消去
        </button>
      </div>

      <button type="button" className="btn" onClick={goTitle} style={{ marginTop: "auto" }}>
        タイトルへ戻る
      </button>
    </div>
  );
}
