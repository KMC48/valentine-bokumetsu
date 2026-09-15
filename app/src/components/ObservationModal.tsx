/** 観察モーダル。ここで得た情報だけで友チョコ/本命/無実を推理する。 */

import { hiddenHintCount, visibleHints } from "../game/difficulty";
import { BinocularButton, type BinocularReason } from "./BinocularButton";
import type { LoopId, Student, VisibleItem } from "../types/game";
import { GirlSprite } from "./Sprites";
import { playerFaceSrc } from "../game/playerVoice";

const ITEM_LABEL: Record<VisibleItem, string> = {
  none: "持ち物なし（手ぶら）",
  paper_bag: "紙袋",
  decoy_bag: "紙袋",
  lunch_box: "弁当箱",
  book_case: "教科書ケース",
  pouch: "ポーチ",
  sports_bag: "部活バッグ",
};

type Props = {
  student: Student;
  loop: LoopId;
  /** 双眼鏡で追加開示した件数。 */
  revealed: number;
  /** 双眼鏡の残り回数。 */
  binocularUses: number;
  binocularCanUse: boolean;
  binocularReason: BinocularReason;
  onUseBinocular: () => void;
  debug: boolean;
  onReport: (id: string) => void;
  onPass: (id: string) => void;
  onClose: () => void;
};

export function ObservationModal({
  student,
  loop,
  revealed,
  binocularUses,
  binocularCanUse,
  binocularReason,
  onUseBinocular,
  debug,
  onReport,
  onPass,
  onClose,
}: Props) {
  const hints = visibleHints(student, loop, revealed);
  const hidden = hiddenHintCount(student, loop, revealed);
  const item = student.visibleItem ?? "none";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          {/* 「いま見定めている」という主人公の表情。
              観察中はモーダルが画面下のセリフ欄を覆ってしまうので、ここに出す。 */}
          <img className="modal__face" src={playerFaceSrc("focus")} alt="" />
          <div className="modal__header-text">
            <div className="modal__kicker">OBSERVATION</div>
            <div className="modal__name">{student.name}</div>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="observe__body">
          <div className="observe__portrait">
            {student.image ? (
              <img
                src={student.image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
              />
            ) : (
              <GirlSprite
                hair={student.appearance?.hair}
                ribbon={student.appearance?.ribbon}
                item={item}
              />
            )}
          </div>

          <div className="observe__meta">
            <div className="observe__chips">
              <span className="chip">所持品：{ITEM_LABEL[item]}</span>
              {student.behavior?.[0] && <span className="chip">仕草：{student.behavior[0]}</span>}
              {debug && <span className="chip chip--danger">{student.chocolateType}</span>}
            </div>

            <div className="observe__suspicion">
              <span>怪しさ {student.suspicionLevel}</span>
              <div className="gauge">
                <div className="gauge__fill" style={{ width: `${student.suspicionLevel}%` }} />
              </div>
            </div>

            {student.dialogue?.[0] && <div className="observe__quote">「{student.dialogue[0]}」</div>}
          </div>
        </div>

        <div className="hint-title">
          ■ 観察メモ
          {hidden > 0 && (
            <span className="hint-title__locked">
              （読み取れたのは {hints.length} 件／あと {hidden} 件ある）
            </span>
          )}
        </div>
        <ul className="hint-list">
          {hints.map((h, i) => (
            <li key={h}>
              <span className="no">{i + 1}.</span>
              <span>{h}</span>
            </li>
          ))}
          {Array.from({ length: hidden }, (_, i) => (
            <li key={`hidden-${i}`} className="is-hidden">
              <span className="no">?</span>
              <span>まだ読み取れない手がかりがある。遠すぎて見えない。</span>
            </li>
          ))}
        </ul>

        {(hidden > 0 || binocularUses < 2) && (
          <BinocularButton
            canUse={binocularCanUse}
            reason={binocularReason}
            remainingUses={binocularUses}
            onUse={onUseBinocular}
          />
        )}

        <div className="observe__actions">
          <button type="button" className="btn btn--ghost" onClick={() => onPass(student.id)}>
            見送る
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onReport(student.id)}>
            通報する
          </button>
        </div>
      </div>
    </div>
  );
}
