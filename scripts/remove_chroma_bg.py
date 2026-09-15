# -*- coding: utf-8 -*-
"""
グリーンバック／マゼンタバックの背景を除去してアルファチャンネルにする。

【前回の市松模様版との違い】
0914追加の素材は、指示書どおり「単色背景」で納品された。
ただし生成画像なので厳密な #00FF00 / #FF00FF 一色ではなく、色にばらつきがある。
そのため完全一致ではなく、HSVの色相（hue）で許容値を持たせて判定する。

【処理の流れ】
1. HSVに変換し、キー色の色相±許容値 かつ 彩度・明度が十分あるピクセルを背景とする。
2. 画像外周からつながる領域だけを背景にする（人物内部の緑っぽい色を守る）。
3. デスピル：輪郭に残る緑かぶり（green spill）を打ち消す。
4. フェザリングでアンチエイリアス。
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter
import cv2

#: OpenCV の hue は 0〜179（=0〜360°の半分）
KEY_HUE = {"green": 60, "magenta": 150}


def remove_chroma_background(
    src_path: str,
    dst_path: str,
    *,
    key: str = "green",
    hue_tol: int = 22,
    sat_min: int = 70,
    val_min: int = 60,
    feather_px: float = 1.0,
    erode_px: int = 1,
    despill: bool = True,
    border_connected_only: bool = True,
) -> dict:
    im = Image.open(src_path).convert("RGB")
    rgb = np.array(im)
    h, w = rgb.shape[:2]

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, sat, val = hsv[..., 0].astype(np.int16), hsv[..., 1], hsv[..., 2]

    target = KEY_HUE[key]
    # 色相は循環するので、環状の距離で見る。
    hue_dist = np.minimum(np.abs(hue - target), 180 - np.abs(hue - target))
    bg_candidate = (hue_dist <= hue_tol) & (sat >= sat_min) & (val >= val_min)

    if border_connected_only:
        # 外周からつながる領域だけを背景とする（人物内部の同系色を守る）。
        num, labels = cv2.connectedComponents(bg_candidate.astype(np.uint8) * 255, connectivity=4)
        border = set(labels[0, :].tolist()) | set(labels[-1, :].tolist())
        border |= set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
        border.discard(0)
        is_bg = np.isin(labels, list(border)) if border else np.zeros((h, w), dtype=bool)
    else:
        # 線画アイコンなど、閉じた内側も背景として抜きたい場合。
        border = set()
        is_bg = bg_candidate

    fg_mask = (~is_bg).astype(np.uint8) * 255
    if erode_px > 0:
        k = np.ones((erode_px * 2 + 1, erode_px * 2 + 1), np.uint8)
        fg_mask = cv2.erode(fg_mask, k, iterations=1)

    alpha_img = Image.fromarray(fg_mask, mode="L")
    if feather_px > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather_px))
    alpha = np.array(alpha_img)

    out_rgb = rgb.astype(np.int16)
    if despill:
        # 輪郭に残るキー色のかぶりを打ち消す。
        # 例：緑なら G が R・B より突出している分を、R・Bの最大値まで引き下げる。
        if key == "green":
            limit = np.maximum(out_rgb[..., 0], out_rgb[..., 2])
            spill = np.clip(out_rgb[..., 1] - limit, 0, None)
            out_rgb[..., 1] -= spill
        else:  # magenta = R と B が突出
            limit = out_rgb[..., 1]
            for ch in (0, 2):
                spill = np.clip(out_rgb[..., ch] - limit, 0, None)
                # マゼンタは元々赤や青の絵柄もあるため、控えめに抑える。
                out_rgb[..., ch] -= (spill * 0.55).astype(np.int16)
    out_rgb = np.clip(out_rgb, 0, 255).astype(np.uint8)

    rgba = np.dstack([out_rgb, alpha])
    Image.fromarray(rgba, mode="RGBA").save(dst_path)

    return {
        "size": (w, h),
        "transparent_ratio": round(float((alpha < 8).mean()), 3),
        "border_regions": len(border),
    }


def alpha_bbox(img: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    a = np.array(img)[:, :, 3]
    ys, xs = np.where(a > threshold)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def tight_crop(src_path: str, dst_path: str, margin: int = 2) -> tuple[int, int]:
    """アルファの実体ぴったりに切り詰める。"""
    img = Image.open(src_path).convert("RGBA")
    x0, y0, x1, y1 = alpha_bbox(img)
    out = img.crop(
        (
            max(0, x0 - margin),
            max(0, y0 - margin),
            min(img.width, x1 + margin),
            min(img.height, y1 + margin),
        )
    )
    out.save(dst_path)
    return out.size


def split_by_gaps(
    src_path: str, expected: int, *, axis: str = "x", min_gap: int = 6, threshold: int = 16
) -> list[Image.Image]:
    """
    透過済みシートを、実体の“隙間”で分割する。
    均等割りだと鞄や髪が隣のセルへ食い込むため、アルファの空白列を境目にする。
    """
    img = Image.open(src_path).convert("RGBA")
    a = np.array(img)[:, :, 3]
    occupied = (a > threshold).any(axis=0 if axis == "x" else 1)

    # 連続する True の区間（＝オブジェクト）を拾う
    spans: list[tuple[int, int]] = []
    start: int | None = None
    for i, v in enumerate(occupied):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_gap:
                spans.append((start, i))
            start = None
    if start is not None:
        spans.append((start, len(occupied)))

    # 期待数より多い場合は、幅の広い順に上位を採用して位置順に戻す
    if len(spans) > expected:
        spans = sorted(sorted(spans, key=lambda s: -(s[1] - s[0]))[:expected])

    pieces = []
    for s0, s1 in spans:
        box = (s0, 0, s1, img.height) if axis == "x" else (0, s0, img.width, s1)
        piece = img.crop(box)
        bx0, by0, bx1, by1 = alpha_bbox(piece)
        pieces.append(piece.crop((max(0, bx0 - 2), max(0, by0 - 2), min(piece.width, bx1 + 2), min(piece.height, by1 + 2))))
    return pieces


if __name__ == "__main__":
    import sys

    print(remove_chroma_background(sys.argv[1], sys.argv[2], key=sys.argv[3] if len(sys.argv) > 3 else "green"))
