/** ゲーム本編。探索 → 観察 → 推理 → 通報 のループがここで回る。 */

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { DebugPanel } from "../components/DebugPanel";
import { DeskConfirmModal, DeskResultModal } from "../components/DeskModals";
import { DeskTarget } from "../components/DeskTarget";
import { playerBackSrc } from "../game/playerVoice";
import { DialogueBox } from "../components/DialogueBox";
import { HUD } from "../components/HUD";
import { ObservationModal } from "../components/ObservationModal";
import { ReportResultModal } from "../components/ReportResultModal";
import { StageBackdrop } from "../components/StageBackdrop";
import { StudentTarget } from "../components/StudentTarget";
import { AreaBar } from "../components/AreaBar";
import { BinocularView } from "../components/BinocularView";
import { MobCrowd } from "../components/MobCrowd";
import { areasFor, getArea, hasMultipleAreas } from "../data/areas";
import { ASSETS } from "../data/assets";
import { getDesks } from "../data/desks";
import { LOOP_CONFIG } from "../data/loops";
import { getStudents } from "../data/students";
import { visibleHints } from "../game/difficulty";
import { STAGES } from "../data/stages";
import { stageTargetTotal, useGameStore } from "../store/gameStore";

const TICK_MS = 250;

/** 状況に応じた主人公のセリフ。 */
export function StageScreen() {
  const store = useGameStore();
  const {
    loop,
    stage,
    score,
    combo,
    timeRemaining,
    area,
    selectedStudentId,
    observing,
    lastOutcome,
    selectedDeskId,
    lastDeskOutcome,
    binocularUses,
    binocularActive,
    debug,
  } = store;

  const [menuOpen, setMenuOpen] = useState(false);

  // タイマー。観察中・結果表示中は store 側で加算が止まる。
  useEffect(() => {
    const id = window.setInterval(() => store.tick(TICK_MS / 1000), TICK_MS);
    return () => window.clearInterval(id);
    // store は zustand のシングルトンなので購読し直す必要はない。
  }, []);

  const students = store.currentStudents();
  const desks = store.currentDesks();
  const stageDef = STAGES[stage];
  const cfg = LOOP_CONFIG[loop];
  const caught = store.stageCaught();
  const currentArea = getArea(area);
  const areas = areasFor(loop, stage);
  const showAreaBar = hasMultipleAreas(loop, stage);
  const total = stageTargetTotal(loop, stage);

  // 場所ごとの「まだ処理していない対象の数」。
  // チョコ所持者の数ではなく単なる人数なので、答えは漏れない。
  const remainingByArea = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of areas) {
      const students = getStudents(loop, stage, a.id).filter(
        (st) => !store.reportedIds.includes(st.id) && !store.passedIds.includes(st.id),
      ).length;
      const desks = getDesks(loop, stage, a.id).filter(
        (d) => !store.searchedDeskIds.includes(d.id),
      ).length;
      map[a.id] = students + desks;
    }
    return map;
  }, [areas, loop, stage, store.reportedIds, store.passedIds, store.searchedDeskIds]);

  const selected = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );
  // 双眼鏡：選択中の生徒に対して使えるか
  const binocular = selected
    ? store.binocularState(selected.id)
    : { canUse: false, reason: "noHidden" as const };
  const revealedForSelected = selected ? store.revealedHints[selected.id] ?? 0 : 0;
  // 覗いた直後に「何が見えたか」を出すため、最後に開示された1件を取り出す。
  const justRevealedHint =
    selected && revealedForSelected > 0
      ? visibleHints(selected, loop, revealedForSelected).at(-1) ?? null
      : null;

  const selectedDesk = useMemo(
    () => desks.find((d) => d.id === selectedDeskId) ?? null,
    [desks, selectedDeskId],
  );

  return (
    <div className="screen stage">
      <HUD
        score={score}
        combo={combo}
        place={`${cfg.schoolName}／${stageDef.label}`}
        mission={stageDef.mission}
        caught={caught}
        total={total}
        timeRemaining={timeRemaining}
        onMenu={() => setMenuOpen(true)}
      />

      {showAreaBar && (
        <AreaBar
          areas={areas}
          currentArea={area}
          remaining={remainingByArea}
          timeRemaining={timeRemaining}
          onMove={store.moveToArea}
        />
      )}

      <div className="gamearea">
        <StageBackdrop stage={stage} area={currentArea} />

        <MobCrowd areaId={area} />

        {desks.map((d) => (
          <DeskTarget key={d.id} desk={d} debug={debug} onSelect={store.selectDesk} />
        ))}

        {students.map((s) => (
          <StudentTarget
            key={s.id}
            student={s}
            loop={loop}
            view={currentArea}
            selected={s.id === selectedStudentId}
            debug={debug}
            onSelect={store.selectStudent}
          />
        ))}

        <button
          type="button"
          className="report-btn"
          disabled={!selected}
          onClick={() => selected && store.reportStudent(selected.id)}
        >
          {ASSETS.iconMegaphone.status === "ready" && (
            <img className="report-btn__icon" src={ASSETS.iconMegaphone.src} alt="" />
          )}
          <span className="report-btn__jp">通報</span>
          <span className="report-btn__en">REPORT</span>
        </button>

        {/* ミッション達成後は待たずに次へ進める。 */}
        {total > 0 && caught >= total && (
          <button type="button" className="mission-clear" onClick={store.endStage}>
            ミッション達成！ 次へ進む ▶
          </button>
        )}

        {/* 肩越しの主人公。前景の飾りなのでタップは透過させる。 */}
        {ASSETS.playerBack.status === "ready" && (
          <img className="player-foreground" src={playerBackSrc(loop)} alt="" />
        )}

        {debug && <DebugPanel />}
      </div>

      <DialogueBox
        remaining={timeRemaining}
        combo={combo}
        selectedName={selected?.name ?? null}
        theme={cfg.theme}
      />

      <BottomNav onHome={() => setMenuOpen(true)} />

      {/* 覗いている間は観察モーダルを隠す。
          双眼鏡は「生徒を覗く」演出なので、レンズの中にモーダルが見えると不自然になる。 */}
      {selected && observing && !binocularActive && (
        <ObservationModal
          student={selected}
          loop={loop}
          revealed={revealedForSelected}
          binocularUses={binocularUses}
          binocularCanUse={binocular.canUse}
          binocularReason={binocular.reason}
          onUseBinocular={() => store.useBinocular(selected.id)}
          debug={debug}
          onReport={store.reportStudent}
          onPass={store.passStudent}
          onClose={store.closeObservation}
        />
      )}

      {lastOutcome && <ReportResultModal outcome={lastOutcome} onClose={store.dismissOutcome} />}

      {selectedDesk && !lastDeskOutcome && (
        <DeskConfirmModal
          desk={selectedDesk}
          timeRemaining={timeRemaining}
          onSearch={store.searchDesk}
          onCancel={() => store.selectDesk(null)}
        />
      )}

      {lastDeskOutcome && (
        <DeskResultModal outcome={lastDeskOutcome} onClose={store.dismissDeskOutcome} />
      )}

      {binocularActive && (
        <BinocularView revealedHint={justRevealedHint} onFinish={store.endBinocularView} />
      )}

      {menuOpen && (
        <div className="modal-overlay modal-overlay--center" onClick={() => setMenuOpen(false)}>
          <div className="modal menu-modal" onClick={(e) => e.stopPropagation()}>
            <h3>メニュー</h3>
            <button type="button" className="btn" onClick={() => setMenuOpen(false)}>
              ゲームに戻る
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setMenuOpen(false);
                store.endStage();
              }}
            >
              このステージを終了する
            </button>
            <button type="button" className="btn btn--ghost" onClick={store.goTitle}>
              タイトルへ戻る（進行は破棄）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
