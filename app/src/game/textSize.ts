/** セリフ欄の文字の大きさ。設定画面で選び、CSS 変数 --text-scale で効かせる。 */

import type { TextSize } from "../types/game";

/**
 * 選べる大きさ。「標準」は iPhone で本文が約17pt（Apple の推奨本文サイズ）。
 * 「特大」でも、ストーリーの最長28文字のセリフが2行に収まる上限にしてある。
 */
export const TEXT_SIZES: ReadonlyArray<{ id: TextSize; label: string; scale: number }> = [
  { id: "standard", label: "標準", scale: 1 },
  { id: "large", label: "大", scale: 1.15 },
  { id: "xlarge", label: "特大", scale: 1.3 },
];

export function isTextSize(value: unknown): value is TextSize {
  return TEXT_SIZES.some((t) => t.id === value);
}

export function textScale(size: TextSize): number {
  return TEXT_SIZES.find((t) => t.id === size)?.scale ?? 1;
}
