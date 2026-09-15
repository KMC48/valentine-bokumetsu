/** 通報結果の演出。教師登場→確認→判定公開の順で見せる。種別ごとに小物画像が変わる。 */

import { ASSETS } from "../data/assets";
import type { ReportOutcome } from "../types/game";

const TEACHER_LINE: Record<ReportOutcome["chocolateType"], string> = {
  friend: "生徒指導・鬼頭「……確かに校則違反だな。預かっておく」",
  honmei: "生徒指導・鬼頭「本命か。こいつは……まあ、規則は規則だ」",
  honmei_special: "生徒指導・鬼頭「渡す直前で押さえたのか。お前、恐ろしい奴だな」",
  none: "生徒指導・鬼頭「何も出てないぞ。次から確証を持ってこい」",
};

/** チョコ種別 → 摘発品の画像。誤認（none）は小物なし（本人の無実の持ち物は observe 側で見せている）。 */
const ITEM_IMAGE: Partial<Record<ReportOutcome["chocolateType"], string>> = {
  friend: ASSETS.itemChocolateFriend.status === "ready" ? ASSETS.itemChocolateFriend.src : undefined,
  honmei: ASSETS.itemChocolateHonmei.status === "ready" ? ASSETS.itemChocolateHonmei.src : undefined,
  honmei_special:
    ASSETS.itemChocolateSpecial.status === "ready" ? ASSETS.itemChocolateSpecial.src : undefined,
};

type Props = {
  outcome: ReportOutcome;
  onClose: () => void;
};

export function ReportResultModal({ outcome, onClose }: Props) {
  const cls = outcome.success ? "result-modal--success" : "result-modal--fail";
  const sign = outcome.gainedPoints >= 0 ? "+" : "";
  const teacherSrc = ASSETS.teacher.status === "ready" ? ASSETS.teacher.src : null;
  const itemSrc = ITEM_IMAGE[outcome.chocolateType];

  return (
    <div className="modal-overlay modal-overlay--center" onClick={onClose}>
      <div className={`modal result-modal ${cls}`} onClick={(e) => e.stopPropagation()}>
        <div className="result-modal__stamp">REPORT RESULT</div>
        <h2 className="result-modal__headline">{outcome.headline}</h2>

        {itemSrc && (
          <img className="result-modal__item" src={itemSrc} alt="" />
        )}

        <div className="result-modal__points" style={{ color: outcome.success ? "var(--gold)" : "var(--danger)" }}>
          {sign}
          {outcome.gainedPoints.toLocaleString()}
          <span style={{ fontSize: "0.4em" }}>pt</span>
        </div>

        {outcome.success ? (
          <div className="result-modal__mult">
            {outcome.multiplier > 1
              ? `コンボ ${outcome.comboAfter} ×${outcome.multiplier.toFixed(1)} 適用`
              : `コンボ ${outcome.comboAfter}`}
          </div>
        ) : (
          <div className="result-modal__mult" style={{ color: "var(--danger)" }}>
            誤認通報！ コンボリセット
          </div>
        )}

        <p className="result-modal__detail">{outcome.detail}</p>

        <div className="result-modal__teacher-row">
          {teacherSrc && <img className="result-modal__teacher-face" src={teacherSrc} alt="" />}
          <p className="result-modal__teacher">{TEACHER_LINE[outcome.chocolateType]}</p>
        </div>

        <button type="button" className="btn btn--gold" onClick={onClose} autoFocus>
          次のターゲットへ
        </button>
      </div>
    </div>
  );
}
