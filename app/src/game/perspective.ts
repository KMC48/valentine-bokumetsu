/**
 * ステージ上の遠近（パース）計算。
 *
 * 生徒もモブも「同じ校舎に立っている同じ人間」なので、
 * 大きさの決め方は共通でなければならない。
 * ここを共有していないと、モブだけミニチュアのように見えてしまう。
 */

/**
 * 奥行きによる身長。
 *
 * y は足元の位置（ゲームエリアの上から%）。
 * nearY/farY の外側も線形に延長するので、消失点付近（y < farY）の
 * モブも自然に小さくなる。
 */
const DEPTH = { nearY: 88, farY: 50, nearH: 68, farH: 33 } as const;

/** 極端に小さく／大きくなりすぎないための下限・上限。 */
const MIN_HEIGHT = 7;
const MAX_HEIGHT = 80;

export function depthHeight(y: number): number {
  const t = (y - DEPTH.farY) / (DEPTH.nearY - DEPTH.farY);
  const h = DEPTH.farH + (DEPTH.nearH - DEPTH.farH) * t;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h));
}

/** 奥にいるほど空気遠近で霞ませる量（0〜1）。モブを背景になじませるのに使う。 */
export function atmosphericFade(y: number): number {
  const t = (y - DEPTH.farY) / (DEPTH.nearY - DEPTH.farY);
  return Math.min(1, Math.max(0, 1 - t));
}
