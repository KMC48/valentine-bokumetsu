# -*- coding: utf-8 -*-
"""
追加キャラ素材（20点）をゲーム用に加工する。

- グリーンバックを除去（厳密な #00FF00 ではないので色相で許容幅を持たせる）
- 実体ぴったりにトリミング（申し送りどおり、学校別差分は足元に5〜24pxの余白がある）

【振り向き差分の足元について】
申し送りの指摘どおり、振り向きポーズは片足が浮く。
アルファの下端をそのまま使うと「接地している靴底」ではなく
「浮いた靴底」が基準になり、通常↔選択で身長が跳ねる。

そこで、通常画像と振り向き画像で**実体の高さを揃える**。
足元は接地している側に合わせ、頭頂の位置が変わらないようにする。
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import alpha_bbox, remove_chroma_background  # noqa: E402

SRC = Path("画像素材/追加キャラ素材/画像素材")
OUT = Path("app/public/assets/characters")
TMP = Path("app/public/assets/source/_work_char")

#: 新規5人（1周目の紺制服）。振り向き差分あり。
NEW_GIRLS = [f"girl_{n:03d}" for n in range(6, 11)]
#: 学校別の制服差分。振り向き差分は無い。
SCHOOL_VARIANTS = [f"loop{loop}_girl_{n:02d}" for loop in (2, 3) for n in range(1, 6)]


def key_and_crop(name: str) -> tuple[Image.Image, dict]:
    tmp = TMP / f"{name}_keyed.png"
    info = remove_chroma_background(str(SRC / f"{name}.png"), str(tmp), key="green")
    img = Image.open(tmp).convert("RGBA")
    x0, y0, x1, y1 = alpha_bbox(img)
    m = 2
    cropped = img.crop(
        (max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m))
    )
    return cropped, info


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{name}.png")


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)

    print("■ 新規5人（通常＋振り向き。高さを揃える）")
    for base in NEW_GIRLS:
        normal, info_n = key_and_crop(base)
        turn, info_t = key_and_crop(f"{base}_turn")

        # 振り向きは片足が浮くため、通常画像と同じ高さになるよう縦だけ合わせる。
        # （横は元の比率のまま。足元＝画像下端の規約は維持される）
        target_h = normal.height
        if turn.height != target_h:
            scale = target_h / turn.height
            turn = turn.resize((max(1, round(turn.width * scale)), target_h), Image.LANCZOS)

        save(normal, base)
        save(turn, f"{base}_turn")
        print(f"  {base:16s} {normal.size}  / turn {turn.size}  透過{info_n['transparent_ratio']:.0%}")

    print("■ 学校別の制服差分（足元の余白を削る）")
    for name in SCHOOL_VARIANTS:
        img, info = key_and_crop(name)
        save(img, name)
        print(f"  {name:16s} {img.size}  透過{info['transparent_ratio']:.0%}")

    import shutil

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
