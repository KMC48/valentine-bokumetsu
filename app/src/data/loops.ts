/** 周回ごとの難易度設定。数値を触るだけで難易度バランスを変えられる。 */

import type { LoopConfig, LoopId } from "../types/game";

export const LOOP_CONFIG: Record<LoopId, LoopConfig> = {
  1: {
    id: 1,
    schoolName: "県立 桜庭高等学校",
    theme: "探す",
    difficultyLabel: "NORMAL",
    suspicionVisibility: 1.0,
    fakeRate: 0.1,
    hintCount: 3,
  },
  2: {
    id: 2,
    schoolName: "私立 聖蘭学院",
    theme: "見破る",
    difficultyLabel: "HARD",
    suspicionVisibility: 0.7,
    fakeRate: 0.3,
    hintCount: 2,
  },
  3: {
    id: 3,
    schoolName: "白鷺台学園（超難関エリート校）",
    theme: "推理する",
    difficultyLabel: "VERY HARD",
    suspicionVisibility: 0.4,
    fakeRate: 0.5,
    hintCount: 1,
  },
};

export const LOOP_IDS: LoopId[] = [1, 2, 3];

/**
 * 床の有効範囲（パースの台形）。
 *
 * 廊下や教室は奥に行くほど床の幅が狭くなるので、
 * 「奥に居る生徒を画面端に置く」と壁や机の上に立っているように見えてしまう。
 * 生徒データの x は「床の左端0〜右端100」の相対値として扱い、
 * 描画時にこの台形へマッピングする。
 */
export type FloorShape = {
  /** 床の中心線（画面幅に対する%）。左に机がある教室などは中心をずらす。 */
  centerX: number;
  /** 奥（farY）での床の半幅（%）。 */
  farHalf: number;
  /** 手前（nearY）での床の半幅（%）。 */
  nearHalf: number;
  /** 台形の奥側・手前側の基準Y（ゲームエリアに対する%）。 */
  farY: number;
  nearY: number;
};

/**
 * 生徒データの x（床の左端0〜右端100）を、奥行きに応じた実際の画面X（%）へ変換する。
 * 奥にいるほど床が狭いので、同じ x でも画面中央寄りに描かれる。
 */
export function floorX(floor: FloorShape, x: number, y: number): number {
  const { centerX, farHalf, nearHalf, farY, nearY } = floor;
  const t = Math.min(1, Math.max(0, (y - farY) / (nearY - farY)));
  const half = farHalf + (nearHalf - farHalf) * t;
  const offset = (Math.min(100, Math.max(0, x)) - 50) / 50; // -1 〜 1
  return centerX + offset * half;
}
