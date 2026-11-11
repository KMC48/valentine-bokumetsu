/** 机を調べる確認ダイアログと、その結果表示。 */

import { ASSETS } from "../data/assets";
import { DESK_SEARCH_SECONDS } from "../data/score";
import type { DeskOutcome, DeskSpot } from "../types/game";

/** 中身に対応する小物画像（空振りは画像なし）。 */
const ITEM_IMAGE: Partial<Record<DeskOutcome["content"], string>> = {
  friend: ASSETS.itemChocolateFriend.status === "ready" ? ASSETS.itemChocolateFriend.src : undefined,
  honmei: ASSETS.itemChocolateHonmei.status === "ready" ? ASSETS.itemChocolateHonmei.src : undefined,
};

type ConfirmProps = {
  desk: DeskSpot;
  timeRemaining: number;
  onSearch: (id: string) => void;
  onCancel: () => void;
};

export function DeskConfirmModal({ desk, timeRemaining, onSearch, onCancel }: ConfirmProps) {
  const notEnoughTime = timeRemaining < DESK_SEARCH_SECONDS;

  return (
    <div className="modal-overlay modal-overlay--center" onClick={onCancel}>
      <div className="modal desk-modal" role="dialog" aria-modal="true" aria-label="机を調べる" onClick={(e) => e.stopPropagation()}>
        <div className="modal__kicker">DESK SEARCH</div>
        <h3 className="desk-modal__title">{desk.label}</h3>
        <div className="thought"><span className="thought__speaker">俺の推理</span><p>{desk.searchThought}</p></div>
        <p className="desk-modal__lead">
          机の中を調べる。人を疑うわけではないので<b>誤認のリスクは無い</b>が、
          <b className="desk-modal__cost">{DESK_SEARCH_SECONDS}秒</b>を消費する。
        </p>
        {notEnoughTime && (
          <p className="desk-modal__warn">調べるには、あと{DESK_SEARCH_SECONDS - Math.floor(timeRemaining)}秒必要だ。</p>
        )}
        <div className="observe__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            やめる
          </button>
          <button type="button" className="btn btn--primary" disabled={notEnoughTime} onClick={() => onSearch(desk.id)}>
            調べる（-{DESK_SEARCH_SECONDS}秒）
          </button>
        </div>
      </div>
    </div>
  );
}

type ResultProps = {
  outcome: DeskOutcome;
  onClose: () => void;
};

export function DeskResultModal({ outcome, onClose }: ResultProps) {
  const cls = outcome.found ? "result-modal--success" : "result-modal--fail";
  const itemSrc = ITEM_IMAGE[outcome.content];

  return (
    <div className="modal-overlay modal-overlay--center" onClick={onClose}>
      <div className={`modal result-modal ${cls}`} role="dialog" aria-modal="true" aria-label="机の捜索結果" onClick={(e) => e.stopPropagation()}>
        <div className="result-modal__stamp">DESK SEARCH — {outcome.label}</div>
        <h2 className="result-modal__headline">{outcome.headline}</h2>

        {/* 机の中を覗いた絵。当たりのときは、その上にチョコを重ねる。 */}
        <div className="desk-inside">
          {ASSETS.deskInsideEmpty.status === "ready" && (
            <img className="desk-inside__bg" src={ASSETS.deskInsideEmpty.src} alt="" />
          )}
          {itemSrc && <img className="desk-inside__item" src={itemSrc} alt="" />}
        </div>

        {outcome.found ? (
          <>
            <div className="result-modal__points" style={{ color: "var(--gold)" }}>
              +{outcome.gainedPoints.toLocaleString()}
              <span style={{ fontSize: "0.4em" }}>pt</span>
            </div>
            <div className="result-modal__mult">
              {outcome.multiplier > 1
                ? `コンボ ${outcome.comboAfter} ×${outcome.multiplier.toFixed(1)} 適用`
                : `コンボ ${outcome.comboAfter}`}
            </div>
          </>
        ) : (
          <div className="result-modal__mult" style={{ color: "var(--muted)" }}>
            得点の増減なし（コンボは切れない）
          </div>
        )}

        <div className="thought"><span className="thought__speaker">俺</span><p>{outcome.detail}</p></div>

        <p className="desk-modal__time">捜索に {outcome.timeCost} 秒を消費した。</p>

        <button type="button" className="btn btn--gold" onClick={onClose} autoFocus>
          {outcome.found ? "報告して巡回に戻る" : "巡回に戻る"}
        </button>
      </div>
    </div>
  );
}
