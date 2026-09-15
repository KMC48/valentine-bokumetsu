/** エンディングデータ。分岐条件は game/ending.ts が判定する。 */

import { ASSETS } from "./assets";
import type { EndingDef } from "../types/game";

/**
 * 学校別のエンディングCG。
 *
 * エンディングは1周ごとに流れるので、その学校の制服のCGが要る。
 * 見つからない場合だけ1周目の絵で代用する。
 */
const BY_LOOP: Record<string, string> = {
  "2:ending-s": ASSETS.loop2EndingS.src,
  "2:ending-a": ASSETS.loop2EndingA.src,
  "2:ending-b": ASSETS.loop2EndingB.src,
  "2:ending-c": ASSETS.loop2EndingC.src,
  "2:ending-special": ASSETS.loop2EndingSpecial.src,
  "3:ending-s": ASSETS.loop3EndingS.src,
  "3:ending-a": ASSETS.loop3EndingA.src,
  "3:ending-b": ASSETS.loop3EndingB.src,
  "3:ending-c": ASSETS.loop3EndingC.src,
  "3:ending-special": ASSETS.loop3EndingSpecial.src,
};

/** その周回・そのエンディングで使うCG。 */
export function endingCg(id: string, loop: number): { src: string | null; fit: "cover" | "contain" } {
  const base = ENDING_CG[id] ?? { src: null, fit: "cover" as const };
  return { ...base, src: BY_LOOP[`${loop}:${id}`] ?? base.src };
}

/** エンディングID → 結末CG。特殊エンドのみ手が切れないよう contain 表示にする。 */
export const ENDING_CG: Record<string, { src: string | null; fit: "cover" | "contain" }> = {
  "ending-s": { src: ASSETS.endingS.status === "ready" ? ASSETS.endingS.src : null, fit: "cover" },
  "ending-a": { src: ASSETS.endingA.status === "ready" ? ASSETS.endingA.src : null, fit: "cover" },
  "ending-b": { src: ASSETS.endingB.status === "ready" ? ASSETS.endingB.src : null, fit: "cover" },
  "ending-c": { src: ASSETS.endingC.status === "ready" ? ASSETS.endingC.src : null, fit: "cover" },
  "ending-special": {
    src: ASSETS.endingSpecial.status === "ready" ? ASSETS.endingSpecial.src : null,
    fit: "contain",
  },
};

export const ENDINGS: EndingDef[] = [
  {
    id: "ending-s",
    title: "バレンタイン完全撲滅",
    rank: "S",
    lines: [
      { speaker: "", text: "その日、校内からチョコレートが消えた。" },
      { speaker: "", text: "紙袋も、リボンも、甘い匂いも、すべて。" },
      { speaker: "生徒指導・鬼頭", text: "……お前、本当にやりきったな。" },
      { speaker: "俺", text: "校則が守られただけです。当然のことです。" },
      { speaker: "", text: "廊下は静まり返っていた。誰も目を合わせようとしない。" },
      { speaker: "俺", text: "これで……この学校に平和が戻った。" },
      { speaker: "", text: "――その静けさが平和なのかどうかは、誰も答えなかった。" },
    ],
  },
  {
    id: "ending-a",
    title: "生徒指導の右腕",
    rank: "A",
    lines: [
      { speaker: "生徒指導・鬼頭", text: "おい委員会。来年も頼むわ。" },
      { speaker: "俺", text: "……それは、褒めてるんですか。" },
      { speaker: "生徒指導・鬼頭", text: "俺が一年で一番忙しい日を、お前が半分持っていったんだ。" },
      { speaker: "生徒指導・鬼頭", text: "感謝してるよ。他の誰もしてないだろうがな。" },
      { speaker: "", text: "職員室の隅に、彼専用のパイプ椅子が置かれた。" },
      { speaker: "俺", text: "……居場所ができてしまった。" },
    ],
  },
  {
    id: "ending-b",
    title: "そこそこ撲滅",
    rank: "B",
    lines: [
      { speaker: "", text: "取り締まりは、それなりの成果を上げた。" },
      { speaker: "", text: "だが放課後の校舎には、まだ甘い匂いが残っていた。" },
      { speaker: "俺", text: "……全部は無理か。" },
      { speaker: "生徒指導・鬼頭", text: "全部やろうとする方がおかしいんだよ。" },
      { speaker: "俺", text: "来年は、もっと精度を上げます。" },
      { speaker: "生徒指導・鬼頭", text: "来年もやるのか、お前。" },
    ],
  },
  {
    id: "ending-c",
    title: "バレンタイン防衛成功",
    rank: "C",
    lines: [
      { speaker: "", text: "――女子生徒たちの完全勝利だった。" },
      { speaker: "女子生徒A", text: "今年も無事に終わったね！" },
      { speaker: "女子生徒B", text: "委員会くん、ずっと違う方向見てたもん。" },
      { speaker: "俺", text: "……囮に三回引っかかった。" },
      { speaker: "俺", text: "校則違反は、確かにこの学校に存在した。" },
      { speaker: "俺", text: "俺が証明できなかっただけだ。" },
    ],
  },
  {
    id: "ending-d",
    title: "委員会、解散",
    rank: "D",
    lines: [
      { speaker: "生徒指導・鬼頭", text: "お前、誤認通報が多すぎる。" },
      { speaker: "俺", text: "……疑わしきは報告せよ、という方針でして。" },
      { speaker: "生徒指導・鬼頭", text: "疑わしきは罰せず、だ。腕章を置いていけ。" },
      { speaker: "", text: "腕章は職員室の引き出しに封印された。" },
      { speaker: "俺", text: "……来年、また作ればいい。" },
      { speaker: "", text: "反省の色は、どこにもなかった。" },
    ],
  },
  {
    id: "ending-special",
    title: "証拠品",
    rank: "special",
    lines: [
      { speaker: "", text: "すべての取り締まりが終わり、校舎には誰もいなくなった。" },
      { speaker: "", text: "昇降口で靴を履き替えていると、背後に足音がした。" },
      { speaker: "？？？", text: "おつかれさま。委員会くん。" },
      { speaker: "俺", text: "……まだ残っていたのか。校則違反なら、もう受け付けない。" },
      { speaker: "？？？", text: "うん。だから、これ。" },
      { speaker: "", text: "差し出されたのは、小さな箱だった。リボンがかかっている。" },
      { speaker: "俺", text: "……これは……校則違反だ。" },
      { speaker: "？？？", text: "じゃあ返して。" },
      { speaker: "俺", text: "いや……証拠品として預かる。" },
      { speaker: "？？？", text: "ふふ。来年も、ちゃんと取り締まりに来てね。" },
      { speaker: "", text: "――バレンタイン撲滅委員会の活動は、来年も続く。" },
    ],
  },
];

export function getEnding(id: string): EndingDef | undefined {
  return ENDINGS.find((e) => e.id === id);
}
