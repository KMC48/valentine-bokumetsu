/**
 * 双眼鏡の覗き込み演出。
 *
 * 画面全体に視界フレームを重ねる。
 * フレームは「内側が透明・外側が不透明の黒」なので、
 * 覗いている部分だけゲーム画面が見える。
 *
 * 納品原稿は外側まで半透明だったため、
 * scripts/build_binocular_assets.py でアルファを補正して本番用にしている。
 */

import { useEffect } from "react";
import { ASSETS } from "../data/assets";

/** 演出を出しておく時間（ミリ秒）。 */
const VIEW_DURATION_MS = 1400;

type Props = {
  /** 開示された手がかりの文面。覗いた先に見えたもの。 */
  revealedHint: string | null;
  onFinish: () => void;
};

export function BinocularView({ revealedHint, onFinish }: Props) {
  useEffect(() => {
    const id = window.setTimeout(onFinish, VIEW_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [onFinish]);

  return (
    <div className="binocular-view" onClick={onFinish}>
      {ASSETS.binocularViewFrame.status === "ready" && (
        <img className="binocular-view__frame" src={ASSETS.binocularViewFrame.src} alt="" />
      )}
      {revealedHint && (
        <p className="binocular-view__hint">
          <span className="binocular-view__label">見えた</span>
          {revealedHint}
        </p>
      )}
    </div>
  );
}
