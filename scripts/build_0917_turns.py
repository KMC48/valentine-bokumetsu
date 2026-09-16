# -*- coding: utf-8 -*-
"""
残りの振り向き差分（10点）をゲーム用に加工する。

通常の絵と実体の高さを揃える。振り向きポーズは片足が浮きやすく、
アルファの下端をそのまま基準にすると、選択した瞬間に身長が跳ねるため。
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import alpha_bbox, remove_chroma_background  # noqa: E402

SRC = Path("画像素材/残りの振り向き差分")
CHARS = Path("app/public/assets/characters")
TMP = Path("app/素材作業用/_work_0917")

NAMES = [f"loop{l}_girl_{n:02d}_turn" for l in (2, 3) for n in range(6, 11)]


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        tmp = TMP / f"{name}.png"
        remove_chroma_background(str(SRC / f"{name}.png"), str(tmp), key="green")
        img = Image.open(tmp).convert("RGBA")
        x0, y0, x1, y1 = alpha_bbox(img)
        m = 2
        img = img.crop(
            (max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m))
        )
        ref = Image.open(CHARS / f"{name[:-5]}.webp")
        if img.height != ref.height:
            scale = ref.height / img.height
            img = img.resize((max(1, round(img.width * scale)), ref.height), Image.LANCZOS)
        img.save(CHARS / f"{name}.png")
        print(f"  {name:22s} {img.size}  基準 {ref.size}")
    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
