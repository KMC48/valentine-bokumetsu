/**
 * 画像素材が入るまでの仮描画（SVG）。
 * 本番素材が来たら data 側の image / background にパスを入れるだけで差し替わるので、
 * ここはあくまでフォールバック。
 */

import type { VisibleItem } from "../types/game";

type GirlProps = {
  hair?: string;
  ribbon?: string;
  item?: VisibleItem;
  className?: string;
};

/** 持ち物アイコン（手元に描く）。 */
function Item({ item }: { item: VisibleItem }) {
  switch (item) {
    case "paper_bag":
      return (
        <g>
          <rect x="66" y="92" width="24" height="28" rx="2" fill="#ff9ec0" stroke="#d15f8a" />
          <path d="M70 92 q6 -8 12 0" fill="none" stroke="#d15f8a" strokeWidth="2" />
          <path d="M74 103 l4 4 4 -4 -4 -4z" fill="#fff" opacity="0.9" />
        </g>
      );
    case "decoy_bag":
      return (
        <g>
          <rect x="66" y="92" width="24" height="28" rx="2" fill="#ffc9dc" stroke="#d1a0b4" />
          <path d="M70 92 q6 -8 12 0" fill="none" stroke="#d1a0b4" strokeWidth="2" />
        </g>
      );
    case "lunch_box":
      return (
        <g>
          <rect x="64" y="98" width="26" height="18" rx="3" fill="#8fd3c7" stroke="#3f7c72" />
          <rect x="64" y="103" width="26" height="3" fill="#3f7c72" opacity="0.5" />
          <path d="M72 98 q5 -7 10 0" fill="none" stroke="#3f7c72" strokeWidth="2" />
        </g>
      );
    case "book_case":
      return (
        <g>
          <rect x="30" y="86" width="40" height="26" rx="2" fill="#e8e2d2" stroke="#8d8574" />
          <rect x="30" y="86" width="40" height="6" fill="#b9b1a0" />
        </g>
      );
    case "pouch":
      return (
        <g>
          <rect x="66" y="100" width="20" height="14" rx="6" fill="#f5c26b" stroke="#b98b32" />
          <circle cx="76" cy="107" r="2" fill="#fff" />
        </g>
      );
    case "sports_bag":
      return (
        <g>
          <rect x="60" y="94" width="32" height="20" rx="7" fill="#5a7fd6" stroke="#31518f" />
          <path d="M68 94 q8 -8 16 0" fill="none" stroke="#31518f" strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

/** 女子生徒の仮スプライト。 */
export function GirlSprite({ hair = "#3a2f2a", ribbon = "#ff6f91", item = "none", className }: GirlProps) {
  return (
    <svg viewBox="0 0 100 150" className={className} width="100%" height="100%" aria-hidden="true">
      {/* 脚 */}
      <rect x="41" y="112" width="7" height="30" rx="3" fill="#1d2433" />
      <rect x="52" y="112" width="7" height="30" rx="3" fill="#1d2433" />
      <rect x="39" y="138" width="11" height="6" rx="2" fill="#2b2118" />
      <rect x="50" y="138" width="11" height="6" rx="2" fill="#2b2118" />
      {/* スカート */}
      <path d="M34 90 L66 90 L72 116 L28 116 Z" fill="#3c4a63" />
      <path d="M44 90 L46 116 M54 90 L56 116" stroke="#2a3549" strokeWidth="2" />
      {/* 上半身 */}
      <path d="M36 54 q14 -6 28 0 l5 38 q-19 6 -38 0 z" fill="#1f2a40" />
      <path d="M50 56 l-7 12 l7 8 l7 -8 z" fill="#f2f5fb" />
      <path d="M50 62 l-6 6 l6 4 l6 -4 z" fill={ribbon} />
      {/* 腕 */}
      <path d="M36 58 q-6 18 -4 34" stroke="#1f2a40" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M64 58 q6 18 4 34" stroke="#1f2a40" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* 顔 */}
      <ellipse cx="50" cy="36" rx="15" ry="17" fill="#f7dcc7" />
      <path d="M35 34 q15 -24 30 0 q2 -22 -15 -22 q-17 0 -15 22z" fill={hair} />
      <path d="M34 32 q-3 20 1 30 q-8 -12 -1 -30z" fill={hair} />
      <path d="M66 32 q3 20 -1 30 q8 -12 1 -30z" fill={hair} />
      <circle cx="44" cy="38" r="2.2" fill="#2b2118" />
      <circle cx="56" cy="38" r="2.2" fill="#2b2118" />
      <path d="M46 45 q4 3 8 0" stroke="#c98b83" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Item item={item} />
    </svg>
  );
}

/** 主人公（顔アイコン用）。 */
export function PlayerFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} width="100%" height="100%" aria-hidden="true">
      <rect width="60" height="60" fill="#16233a" />
      <path d="M12 60 q4 -16 18 -16 q14 0 18 16z" fill="#1f2a40" />
      <ellipse cx="30" cy="28" rx="13" ry="15" fill="#f0d3bb" />
      <path d="M17 26 q13 -22 26 0 q3 -20 -13 -20 q-16 0 -13 20z" fill="#1b1f2a" />
      <rect x="18" y="26" width="10" height="7" rx="2" fill="none" stroke="#2b3a52" strokeWidth="1.5" />
      <rect x="32" y="26" width="10" height="7" rx="2" fill="none" stroke="#2b3a52" strokeWidth="1.5" />
      <path d="M28 29 h4" stroke="#2b3a52" strokeWidth="1.5" />
      <path d="M25 40 q5 2 10 0" stroke="#a97b6d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** 教師（生徒指導）。 */
export function TeacherSprite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 150" className={className} width="100%" height="100%" aria-hidden="true">
      <rect x="40" y="110" width="8" height="32" rx="3" fill="#22262f" />
      <rect x="52" y="110" width="8" height="32" rx="3" fill="#22262f" />
      <path d="M34 52 q16 -7 32 0 l6 60 q-22 7 -44 0z" fill="#2b303b" />
      <path d="M50 52 l-6 14 l6 6 l6 -6z" fill="#d8dde6" />
      <path d="M50 58 l-4 6 l4 4 l4 -4z" fill="#8b1e2d" />
      <ellipse cx="50" cy="34" rx="15" ry="16" fill="#e8c7a8" />
      <path d="M35 30 q15 -20 30 0 q1 -20 -15 -20 q-16 0 -15 20z" fill="#20242c" />
      <rect x="38" y="32" width="10" height="6" rx="1.5" fill="none" stroke="#3a4252" strokeWidth="1.5" />
      <rect x="52" y="32" width="10" height="6" rx="1.5" fill="none" stroke="#3a4252" strokeWidth="1.5" />
      <path d="M44 44 q6 -2 12 0" stroke="#8a5f52" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** タイトルの禁止マーク（チョコ＋斜線）。 */
export function NoChocoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} width="100%" height="100%" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#12192b" stroke="#ff2d6a" strokeWidth="7" />
      <g transform="rotate(-12 50 50)">
        <rect x="28" y="34" width="44" height="32" rx="3" fill="#5a3220" stroke="#3a1f12" strokeWidth="2" />
        <path d="M39 34 v32 M50 34 v32 M61 34 v32" stroke="#3a1f12" strokeWidth="2" />
        <path d="M28 45 h44 M28 56 h44" stroke="#3a1f12" strokeWidth="2" />
      </g>
      <path d="M20 80 L80 20" stroke="#ff2d6a" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
