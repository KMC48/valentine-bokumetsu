/** ステージ下部の主人公セリフ欄。表情とセリフは同じ状況判定から導く。 */

import { playerFaceSrc, playerLine, playerMood, type VoiceContext } from "../game/playerVoice";
import { useEffect, useRef } from "react";

type Props = VoiceContext & {
  name?: string;
  notice?: string | null;
};

export function DialogueBox({ name = "俺", notice, ...ctx }: Props) {
  const mood = playerMood(ctx);
  const line = notice ?? playerLine(ctx);
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (textRef.current) textRef.current.scrollTop = 0;
  }, [line]);

  return (
    <div className="speech">
      <div className="speech__face">
        {/* 状況ごとに表情が変わる。key を付けて切り替わりを見せる。 */}
        <img key={mood} className="speech__face-img" src={playerFaceSrc(mood)} alt="" />
      </div>
      <div className="speech__body">
        <span className="speech__name">{name}</span>
        <div ref={textRef} className="speech__text" role="region" aria-live="polite" tabIndex={0} aria-label="主人公のセリフ">{line}</div>
      </div>
    </div>
  );
}
