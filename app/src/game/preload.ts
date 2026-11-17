/**
 * ステージの画像の先読み。
 *
 * 場所を移動するたびに背景・生徒・モブの画像を読み込むと、
 * 移動直後に絵が一瞬遅れて出る（特に回線の遅いスマホで目立つ）。
 * ステージに入る前（直前のストーリー中）に、そのステージの全場所の画像を読み込み、
 * 表示できる状態（decode 済み）にしておく。
 *
 * 1ステージ分だけを読むので、通信量は「そのステージで遅かれ早かれ見る画像」と同じ。
 */

import { areasFor } from "../data/areas";
import { getStudents } from "../data/students";
import { mobSourcesFor } from "../components/MobCrowd";
import { TURN_VARIANT } from "../components/StudentTarget";
import type { LoopId, StageId } from "../types/game";

/** そのステージで表示しうる画像（背景・生徒と振り向き差分・モブ）。 */
export function stageImageSources(loop: LoopId, stage: StageId): string[] {
  const srcs = new Set<string>();
  for (const area of areasFor(loop, stage)) {
    if (area.background) srcs.add(area.background);
    for (const mob of mobSourcesFor(area.id, loop)) srcs.add(mob);
  }
  for (const student of getStudents(loop, stage)) {
    if (!student.image) continue;
    srcs.add(student.image);
    const turn = TURN_VARIANT[student.image];
    if (turn) srcs.add(turn);
  }
  return [...srcs];
}

/** 読み込みを始めた画像。同じ画像を二度読まないため、また参照を保って破棄されないようにするため。 */
const started = new Map<string, HTMLImageElement>();

/** 画像を読み込み、表示できる状態まで準備する。失敗してもゲームは止めない。 */
export function preloadImages(srcs: string[]): void {
  if (typeof Image === "undefined") return;
  for (const src of srcs) {
    if (started.has(src)) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    started.set(src, img);
    img.decode?.().catch(() => {});
  }
}

export function preloadStage(loop: LoopId, stage: StageId): void {
  preloadImages(stageImageSources(loop, stage));
}
