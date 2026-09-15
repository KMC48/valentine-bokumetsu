# -*- coding: utf-8 -*-
"""
生成AI画像に焼き込まれた「市松模様（透過っぽく見える偽の格子柄）」を検出し、
実際のアルファチャンネルへ変換するスクリプト。

方式：
1. 明るいグレースケール系（R≈G≈B かつ明度が高い）のピクセルを背景候補とする。
2. 背景候補のうち、画像の外周から4連結でたどり着ける領域を「背景」とする。
3. 外周とつながっていない“閉じた”候補領域（例：上げた腕と頭の間、脚の間、
   後れ毛の裏）は、市松模様かどうかで判定する。
   - 市松模様は明・暗2トーンが同程度の割合で混在する（二峰性）。
   - 白いシャツや紙は単一トーンなので、この判定で人物側に残る。
4. 背景マスクをぼかしてフェザリングし、アルファチャンネルとして書き出す。

CLIとしても使える：
    python scripts/remove_checker_bg.py <入力.png> <出力.png>
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter
import cv2


def _dominant_tones(values: np.ndarray) -> tuple[float, float]:
    """背景の明トーン・暗トーンを推定する。"""
    if values.size == 0:
        return 255.0, 255.0
    hi = float(np.percentile(values, 85))
    lo = float(np.percentile(values, 15))
    return hi, lo


def _is_checker_region(
    lightness: np.ndarray,
    mask: np.ndarray,
    hi: float,
    lo: float,
    tone_tol: float,
    min_share: float,
    min_tiles: int = 2,
) -> bool:
    """
    領域が市松模様かどうか。

    「明暗2トーンが混在している」だけでは不十分（白い腕章＋影なども該当してしまう）。
    市松模様は明タイルが**格子状に多数**並ぶので、明トーンの塊の数でも判定する。
    """
    if abs(hi - lo) < 12:
        # そもそも背景が単色なら、この判定は使えない。
        return False

    vals = lightness[mask]
    if vals.size == 0:
        return False
    near_hi = float(np.mean(np.abs(vals - hi) <= tone_tol))
    near_lo = float(np.mean(np.abs(vals - lo) <= tone_tol))
    if near_hi < min_share or near_lo < min_share:
        return False

    # 明暗の境界が急峻か（市松＝タイルの境目だけが中間値＝中間の割合が小さい）。
    # 白い腕章＋影のようなグラデーションは中間値が多くなるので、ここで弾ける。
    mid = (vals > lo + tone_tol) & (vals < hi - tone_tol)
    mid_share = float(np.mean(mid))
    if mid_share > 0.3:
        return False

    # 明トーンの塊が格子状にいくつあるか数える（市松＝複数、腕章や紙＝1個）。
    hi_mask = (mask & (np.abs(lightness - hi) <= tone_tol)).astype(np.uint8)
    tiles, tile_labels = cv2.connectedComponents(hi_mask, connectivity=4)
    if tiles <= 1:
        return False
    areas = np.bincount(tile_labels.ravel())[1:]
    significant = int((areas >= 8).sum())
    return significant >= min_tiles


def remove_checkerboard_background(
    src_path: str,
    dst_path: str,
    *,
    lightness_min: int = 195,
    channel_spread_max: int = 14,
    feather_px: float = 1.2,
    erode_px: int = 1,
    enclosed_min_area: int = 120,
    tone_tol: float = 18.0,
    min_tone_share: float = 0.18,
) -> dict:
    im = Image.open(src_path).convert("RGB")
    arr = np.array(im).astype(np.int16)
    h, w = arr.shape[:2]

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    lightness = (r + g + b) / 3.0
    spread = np.maximum(np.maximum(np.abs(r - g), np.abs(g - b)), np.abs(r - b))

    bg_candidate = (lightness >= lightness_min) & (spread <= channel_spread_max)
    bg_candidate_u8 = (bg_candidate.astype(np.uint8)) * 255

    num_labels, labels = cv2.connectedComponents(bg_candidate_u8, connectivity=4)
    border_labels = set(labels[0, :].tolist()) | set(labels[-1, :].tolist())
    border_labels |= set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    border_labels.discard(0)

    is_bg = np.isin(labels, list(border_labels)) if border_labels else np.zeros((h, w), dtype=bool)

    # 外周側の背景から、市松模様の明暗トーンを推定する。
    hi, lo = _dominant_tones(lightness[is_bg])

    # 閉じた領域のうち、市松模様のものだけ追加で背景にする。
    enclosed_added = 0
    for label in range(1, num_labels):
        if label in border_labels:
            continue
        region = labels == label
        area = int(region.sum())
        if area < enclosed_min_area:
            continue
        if _is_checker_region(lightness, region, hi, lo, tone_tol, min_tone_share):
            is_bg |= region
            enclosed_added += 1

    # 背景を数ピクセル侵食して、縁の滲み（ハロー）を人物側から削る。
    fg_mask = (~is_bg).astype(np.uint8) * 255
    if erode_px > 0:
        kernel = np.ones((erode_px * 2 + 1, erode_px * 2 + 1), np.uint8)
        fg_mask = cv2.erode(fg_mask, kernel, iterations=1)

    alpha_img = Image.fromarray(fg_mask, mode="L")
    if feather_px > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather_px))
    alpha_out = np.array(alpha_img)

    rgba = np.dstack([np.array(im), alpha_out])
    Image.fromarray(rgba, mode="RGBA").save(dst_path)

    return {
        "size": (w, h),
        "transparent_ratio": float((alpha_out < 8).mean()),
        "border_regions": len(border_labels),
        "enclosed_holes_removed": enclosed_added,
        "tones": (round(hi, 1), round(lo, 1)),
    }


if __name__ == "__main__":
    import sys

    print(remove_checkerboard_background(sys.argv[1], sys.argv[2]))
