import { useState } from "react";
import { AREA_MOVE_SECONDS, BINOCULAR_SECONDS, BINOCULAR_USES_PER_STAGE, DESK_SEARCH_SECONDS } from "../data/score";

const EXAMPLES = [
  {
    level: 75,
    thought: "ピンクの紙袋を隠しているな。でも開いた口から見えたのは、図書館の返却票つきの本だ。向かう先も返却カウンターか……。袋の色だけで決めつけない方がよさそうだぞ。",
    answer: "pass",
    feedback: "中身は返却する本だった。怪しさレベルが高くても、チョコの証拠とは限らない。持ち物と行動を合わせて見よう。",
  },
  {
    level: 35,
    thought: "落ち着いて歩いているな。ただ、鞄からは同じリボンの小袋がいくつも見える。友達に渡しながら『チョコ、溶ける前に食べてね』と言ったぞ……。",
    answer: "report",
    feedback: "小袋は友チョコだった。落ち着いた態度でも校則違反はあり得る。数値より、見えた物と会話が判断の決め手だ。",
  },
] as const;

/** 本編と独立した2問の練習。得点・解放状況・保存データには触れない。 */
export function HowToPlay({ onClose, startAfter = false }: { onClose: () => void; startAfter?: boolean }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const example = EXAMPLES[step];
  const done = step >= EXAMPLES.length;
  return (
    <div className="modal-overlay modal-overlay--center">
      <div className="modal help-modal" role="dialog" aria-modal="true" aria-label="遊び方">
        <div className="modal__header">
          <div className="modal__header-text"><div className="modal__kicker">HOW TO PLAY</div><h2>遊び方</h2></div>
          <button type="button" className="modal__close" onClick={onClose} aria-label={startAfter ? "説明をスキップして本編へ" : "説明を閉じる"}>×</button>
        </div>
        <p>生徒をタップして観察し、持ち物・言葉・行動からチョコの持ち込みを見抜こう。</p>
        <ul className="help-rules">
          <li><b>通報</b>：チョコを発見すると得点。誤認は−300pt、コンボが途切れる。</li>
          <li><b>保留</b>：あとで再び観察できる。<b>見送る</b>とその生徒の調査は終了。</li>
          <li>観察・双眼鏡の文章・メニュー・この説明を読んでいる間は、時間が止まる。</li>
        </ul>
        {!done && example && <section className="help-practice">
          <div className="thought__speaker">判断の練習 {step + 1} / 2（本編の得点には影響しない）</div>
          <div className="observe__level"><span>怪しさレベル</span><strong>{example.level}<small> / 100</small></strong></div>
          <div className="thought"><span className="thought__speaker">俺の推理</span><p>{example.thought}</p></div>
          {!answer ? <div className="observe__actions">
            <button className="btn btn--ghost" type="button" onClick={() => setAnswer("pass")}>見送る</button>
            <button className="btn btn--primary" type="button" onClick={() => setAnswer("report")}>通報する</button>
          </div> : <div className="help-feedback" role="status">
            <strong>{answer === example.answer ? "その判断でよさそうだ！" : "ここで判断の理由を確かめよう。"}</strong>
            <p>{example.feedback}</p>
            <button className="btn btn--gold" type="button" onClick={() => { setStep(step + 1); setAnswer(null); }}>{step === 0 ? "次の練習へ" : "練習を終える"}</button>
          </div>}
        </section>}
        {done && <p className="help-feedback">準備完了。気になる生徒を観察し、印象と証拠を分けて判断しよう。</p>}
        <details className="deduction-review">
          <summary>移動・机の捜索・双眼鏡</summary>
          <p>場所の移動は{AREA_MOVE_SECONDS}秒、机の捜索は{DESK_SEARCH_SECONDS}秒を使う。机は調べる前の推理を読んで選ぼう。空でも減点はない。</p>
          <p>2・3周目は、双眼鏡で推理の続きを読める。1回{BINOCULAR_SECONDS}秒、各ステージ{BINOCULAR_USES_PER_STAGE}回まで。文章は確認ボタンを押すまで消えない。</p>
          <p>朝・昼休み・放課後の3ステージ。巡回後には、見送った判断の答え合わせも確認できる。</p>
        </details>
        <button className={`btn ${done ? "btn--primary" : "btn--ghost"}`} type="button" onClick={onClose}>
          {startAfter ? (done ? "本編をはじめる" : "練習をスキップして本編へ") : "ゲームに戻る"}
        </button>
      </div>
    </div>
  );
}
