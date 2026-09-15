/**
 * 教室の机（調べられるスポット）データ。
 *
 * 【人物ターゲットとの違い】
 * - 机には「誤認通報」が無い（人を疑うわけではないので減点しない）。
 * - 代わりに、調べるのに時間がかかる。空振りすると持ち時間だけが減る。
 * → 人物＝得点のリスク、机＝時間のリスク、という別軸の駆け引きになる。
 *
 * 【背景に机が描かれている】
 * 教室背景そのものに机が並んでいるので、机の絵を重ねると二重になる。
 * 調べられる机は、背景の机の上に枠を重ねて示す（image: null）。
 *
 * 【座標について】
 * position は生徒と違い、床の台形マッピングを通さないゲームエリア上の直接の%。
 * 机は「床に立つ人」ではなく背景に描かれた備品なので、見た目に合わせて直接置く。
 *
 * 【拡張】
 * 2・3周目にも机を置く場合は、先に教室背景の素材が必要
 * （現状 2・3周目の昼は廊下背景を流用しているため、机を置くと絵が破綻する）。
 * → 画像素材/追加画像素材_制作指示書_机チェック.md を参照。
 */

import type { DeskSpot, LoopId, StageId } from "../types/game";

export const DESKS: DeskSpot[] = [
  // ---------- 1周目 / 昼休み（教室） ----------
  {
    id: "l1-l-desk-01",
    loop: 1,
    stage: "lunch",
    area: "classroom",
    label: "窓際・後ろから2番目の席",
    position: { x: 82, y: 58 },
    size: 15,
    content: "friend",
    resultText: "机の奥から、リボンの掛かった小袋が4つ出てきた。持ち主は昼休みの間ずっと席を外している。",
    clue: "同じラッピングの袋を、この教室の誰かが配って回っている。",
    image: null,
  },
  {
    id: "l1-l-desk-02",
    loop: 1,
    stage: "lunch",
    area: "classroom",
    label: "廊下側・前から3番目の席",
    position: { x: 32, y: 55 },
    size: 13,
    content: "none",
    resultText: "教科書とプリントの束、干からびた消しゴム。チョコの気配はない。",
    clue: "この席の主は今日、購買のパンしか買っていない。",
    image: null,
  },
];

/** 指定した周回・ステージ（・場所）の机を返す。 */
export function getDesks(loop: number, stage: string, area?: string): DeskSpot[] {
  return DESKS.filter(
    (d) => d.loop === loop && d.stage === stage && (area === undefined || d.area === area),
  );
}

/** 指定した周回（・ステージ）でチョコが入っている机の数。撲滅率の分母に足す。 */
export function countDeskChocolates(loop: number, stage?: string): number {
  return DESKS.filter(
    (d) => d.loop === loop && (stage === undefined || d.stage === stage) && d.content !== "none",
  ).length;
}

/** その周回・ステージに机があるか（UIの出し分け用）。 */
export function hasDesks(loop: LoopId, stage: StageId): boolean {
  return getDesks(loop, stage).length > 0;
}
