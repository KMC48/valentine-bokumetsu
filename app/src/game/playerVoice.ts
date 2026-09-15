/**
 * 画面下のセリフ欄に出す、主人公の表情とセリフ。
 *
 * 【なぜ1か所にまとめるのか】
 * 表情とセリフを別々に分岐させると、「焦ったセリフなのに得意顔」のような
 * 食い違いがいずれ必ず起きる。どちらも同じ `playerMood()` から導く。
 */

import { ASSETS } from "../data/assets";
import type { LoopId } from "../types/game";

export type PlayerMood = "normal" | "focus" | "confident" | "hurry";

/** 残り時間がこれ以下になったら焦り顔にする（秒）。 */
const HURRY_SECONDS = 30;
/** これ以上連続で的中したら得意顔にする。 */
const CONFIDENT_COMBO = 3;

export type VoiceContext = {
  remaining: number;
  combo: number;
  selectedName: string | null;
  theme: string;
};

/**
 * いまの状況に対応する表情。
 *
 * 誰かを観察している間は、時間や連続記録より「見定めている」が優先。
 * プレイヤーが今いちばん集中している対象に表情を合わせるため。
 */
export function playerMood(ctx: Pick<VoiceContext, "remaining" | "combo" | "selectedName">): PlayerMood {
  if (ctx.selectedName) return "focus";
  if (ctx.remaining <= HURRY_SECONDS) return "hurry";
  if (ctx.combo >= CONFIDENT_COMBO) return "confident";
  return "normal";
}

/** 表情に対応する顔アイコン。 */
export function playerFaceSrc(mood: PlayerMood): string {
  switch (mood) {
    case "focus":
      return ASSETS.faceFocus.src;
    case "confident":
      return ASSETS.faceConfident.src;
    case "hurry":
      return ASSETS.faceHurry.src;
    default:
      return ASSETS.faceNormal.src;
  }
}

/** セリフ。表情と同じ分岐から導く。 */
export function playerLine(ctx: VoiceContext): string {
  switch (playerMood(ctx)) {
    case "focus":
      return `${ctx.selectedName}……。所持品と行動を照合する。判断を誤れば、こちらが罰せられる。`;
    case "hurry":
      return "時間がない。取りこぼしは、来年への負債になる。";
    case "confident":
      // 連続記録が伸びるほど強気にする。表情は同じでも言葉で差をつける。
      return ctx.combo >= 5
        ? "止まらない。校則が、俺の味方をしている。"
        : "いい流れだ。この調子で甘い空気を一掃する。";
    default:
      return `バレンタインなど存在しない…。この学園から、甘い浮かれた空気を一掃するんだ！（今回のテーマ：${ctx.theme}）`;
  }
}

/** 肩越しの主人公（ステージ前景）。転校しているので学校ごとに制服が違う。 */
export function playerBackSrc(loop: LoopId): string {
  if (loop === 2) return ASSETS.loop2PlayerBack.src;
  if (loop === 3) return ASSETS.loop3PlayerBack.src;
  return ASSETS.playerBack.src;
}

/** ストーリー画面のバストアップ。 */
export function playerBustSrc(loop: LoopId): string {
  if (loop === 2) return ASSETS.loop2BustPlayer.src;
  if (loop === 3) return ASSETS.loop3BustPlayer.src;
  return ASSETS.bustPlayer.src;
}
