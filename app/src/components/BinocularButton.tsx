/**
 * 双眼鏡ボタン（観察モーダル内）。
 *
 * 使えない理由は3種類あり、プレイヤーにとって意味が違うので文言を分ける。
 * - noHidden … そもそも読み取れる手がかりが残っていない（使う必要がない）
 * - noUses   … このステージの回数を使い切った（次のステージで回復する）
 * - noTime   … 残り時間が足りない（時間を作れば使える）
 */

import { ASSETS } from "../data/assets";
import { BINOCULAR_SECONDS } from "../data/score";

export type BinocularReason = "ok" | "noHidden" | "noUses" | "noTime";

const MESSAGE: Record<BinocularReason, string> = {
  ok: `双眼鏡で覗くと、手がかりを1件読み取れる（-${BINOCULAR_SECONDS}秒）`,
  noHidden: "この生徒からは、これ以上読み取るものが無い。",
  noUses: "このステージではもう覗けない。次の時間帯まで持たない。",
  noTime: `残り時間が足りない。覗くには${BINOCULAR_SECONDS}秒かかる。`,
};

type Props = {
  canUse: boolean;
  reason: BinocularReason;
  remainingUses: number;
  onUse: () => void;
};

export function BinocularButton({ canUse, reason, remainingUses, onUse }: Props) {
  const outOfUses = remainingUses <= 0;
  const iconAsset = outOfUses ? ASSETS.iconBinocularsEmpty : ASSETS.iconBinoculars;

  return (
    <div className="binocular">
      <button
        type="button"
        className={`binocular__btn${canUse ? "" : " is-disabled"}`}
        disabled={!canUse}
        onClick={onUse}
        aria-label="双眼鏡で覗く"
      >
        {ASSETS.itemButtonFrame.status === "ready" && (
          <img className="binocular__frame" src={ASSETS.itemButtonFrame.src} alt="" />
        )}
        <img className="binocular__icon" src={iconAsset.src} alt="" />
        <span className={`binocular__count${outOfUses ? " is-empty" : ""}`}>{remainingUses}</span>
      </button>
      <p className={`binocular__note${canUse ? "" : " is-muted"}`}>{MESSAGE[reason]}</p>
    </div>
  );
}
