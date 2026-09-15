# -*- coding: utf-8 -*-
"""
立ち絵の加工パイプライン。

生成AI原稿（市松模様入りRGB）から、ゲームで使う2種類の画像を作る。

1. 全身（standing）: アルファの実体ぴったりにトリミング。
   → 画像の箱＝キャラの実体になるので、%配置と足元アンカーが素直に効く。
      （元画像は左右の余白が不均等で、同じ left:50% でもキャラがずれて見えていた）

2. バストアップ（bust）: 頭〜胸のあたりで切り出し、頭の中心で水平方向を合わせる。
   → ストーリー画面（ノベルゲーム風）用。

元画像は 画像素材/ に残っているので、このスクリプトはいつでも再実行できる。
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_checker_bg import remove_checkerboard_background  # noqa: E402

RAW_DIR = Path("画像素材")
OUT_DIR = Path("app/public/assets/characters")

# 原稿ファイル名 → 出力名
SOURCES = {
    "player": "ChatGPT Image 2026年9月14日 00_50_09 (7).png",
    "teacher": "ChatGPT Image 2026年9月14日 00_50_10 (8).png",
    "boy_001": "ChatGPT Image 2026年9月14日 00_50_10 (9).png",
    "girl_001": "ChatGPT Image 2026年9月14日 00_50_11 (10).png",
    "girl_002": "ChatGPT Image 2026年9月14日 00_50_11 (11).png",
    "girl_003": "ChatGPT Image 2026年9月14日 00_50_12 (12).png",
    "girl_004": "ChatGPT Image 2026年9月14日 00_50_12 (13).png",
    "girl_005": "ChatGPT Image 2026年9月14日 00_50_13 (14).png",
}

#: バストアップで残す範囲（全身の高さに対する割合）。頭頂から下へ。
BUST_RATIO = 0.46
#: バストアップの横幅（頭幅に対する倍率）。肩が入る程度。
BUST_WIDTH_BY_HEAD = 3.4


def alpha_bbox(img: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    a = np.array(img)[:, :, 3]
    ys, xs = np.where(a > threshold)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def head_metrics(img: Image.Image, threshold: int = 16) -> tuple[int, int]:
    """頭部の水平中心と頭幅を返す。上から数十行のアルファ分布から推定する。"""
    a = np.array(img)[:, :, 3]
    ys, _ = np.where(a > threshold)
    top = int(ys.min())
    # 頭頂から画像高さの8%ぶんを頭部とみなす。
    band = a[top : top + max(8, int(a.shape[0] * 0.08))]
    cols = np.where(band.max(axis=0) > threshold)[0]
    center = int((cols.min() + cols.max()) / 2)
    width = int(cols.max() - cols.min() + 1)
    return center, width


def build(name: str, raw_path: Path) -> dict:
    tmp = OUT_DIR / f"_tmp_{name}.png"
    remove_checkerboard_background(str(raw_path), str(tmp))
    img = Image.open(tmp).convert("RGBA")

    # ---- 1. 全身（実体ぴったり） ----
    x0, y0, x1, y1 = alpha_bbox(img)
    margin = 2
    standing = img.crop(
        (max(0, x0 - margin), max(0, y0 - margin), min(img.width, x1 + margin), min(img.height, y1 + margin))
    )
    standing.save(OUT_DIR / f"{name}.png")

    # ---- 2. バストアップ ----
    head_cx, head_w = head_metrics(img)
    bust_h = int((y1 - y0) * BUST_RATIO)
    bust_w = int(head_w * BUST_WIDTH_BY_HEAD)
    bx0 = max(0, head_cx - bust_w // 2)
    bx1 = min(img.width, head_cx + bust_w // 2)
    by0 = max(0, y0 - margin)
    by1 = min(img.height, y0 + bust_h)
    bust = img.crop((bx0, by0, bx1, by1))

    # 左右の余白を詰める（余白が残っていると、表示サイズを指定しても
    # キャラの見た目の大きさがキャラごとにばらつくため）。
    bxx0, byy0, bxx1, byy1 = alpha_bbox(bust)
    bust = bust.crop(
        (max(0, bxx0 - margin), 0, min(bust.width, bxx1 + margin), bust.height)
    )
    bust.save(OUT_DIR / f"bust_{name}.png")

    tmp.unlink()
    return {
        "standing": standing.size,
        "bust": bust.size,
        "head_center": head_cx,
        "head_width": head_w,
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, filename in SOURCES.items():
        raw = RAW_DIR / filename
        if not raw.exists():
            print(f"!! 原稿が見つからない: {raw}")
            continue
        info = build(name, raw)
        print(f"{name:10s} standing={info['standing']} bust={info['bust']}")


if __name__ == "__main__":
    main()
