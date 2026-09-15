/** ステージ下部の主人公セリフ欄。表情とセリフは同じ状況判定から導く。 */

import { playerFaceSrc, playerLine, playerMood, type VoiceContext } from "../game/playerVoice";

type Props = VoiceContext & {
  name?: string;
};

export function DialogueBox({ name = "俺", ...ctx }: Props) {
  const mood = playerMood(ctx);

  return (
    <div className="speech">
      <div className="speech__face">
        {/* 状況ごとに表情が変わる。key を付けて切り替わりを見せる。 */}
        <img key={mood} className="speech__face-img" src={playerFaceSrc(mood)} alt="" />
      </div>
      <div className="speech__body">
        <span className="speech__name">{name}</span>
        <div className="speech__text">{playerLine(ctx)}</div>
      </div>
    </div>
  );
}
