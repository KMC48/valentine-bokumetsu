# -*- coding: utf-8 -*-
"""
0916追加（32点）をゲーム用に加工する。

- 女子生徒の学校別制服 10点（手ぶら4・持ち物6）
- 学校別制服の振り向き差分 10点
- 背景モブの学校別制服 12点

【振り向き差分の高さを揃える理由】
振り向きポーズは片足が浮きやすく、アルファの下端をそのまま使うと
「接地している靴底」ではなく「浮いた靴底」が基準になる。
通常↔選択で身長が跳ねるので、対応する通常画像と実体の高さを揃える。
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import alpha_bbox, remove_chroma_background  # noqa: E402

SRC = Path("画像素材/0916追加")
CHARS = Path("app/public/assets/characters")
MOBS = CHARS / "mob"
TMP = Path("app/public/assets/source/_work_0916")

GIRLS = [f"loop{l}_girl_{n:02d}" for l in (2, 3) for n in (6, 7, 8, 9, 10)]
TURNS = [f"loop{l}_girl_{n:02d}_turn" for l in (2, 3) for n in range(1, 6)]
MOB_FILES = [f"loop{l}_mob_{k}_{n}" for l in (2, 3) for k in ("boy", "girl") for n in (1, 2, 3)]


def find(name: str) -> Path:
    hits = list(SRC.rglob(f"{name}.png"))
    if not hits:
        raise FileNotFoundError(name)
    return hits[0]


def key_and_crop(name: str) -> Image.Image:
    tmp = TMP / f"{name}.png"
    remove_chroma_background(str(find(name)), str(tmp), key="green")
    img = Image.open(tmp).convert("RGBA")
    x0, y0, x1, y1 = alpha_bbox(img)
    m = 2
    return img.crop(
        (max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m))
    )


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)

    print("■ 女子生徒の学校別制服")
    for name in GIRLS:
        img = key_and_crop(name)
        img.save(CHARS / f"{name}.png")
        print(f"  {name:20s} {img.size}")

    print("■ 振り向き差分（通常の絵と高さを揃える）")
    for name in TURNS:
        img = key_and_crop(name)
        ref = Image.open(CHARS / f"{name[:-5]}.webp")
        if img.height != ref.height:
            scale = ref.height / img.height
            img = img.resize((max(1, round(img.width * scale)), ref.height), Image.LANCZOS)
        img.save(CHARS / f"{name}.png")
        print(f"  {name:20s} {img.size}  基準 {ref.size}")

    print("■ 背景モブの学校別制服")
    for name in MOB_FILES:
        img = key_and_crop(name)
        img.save(MOBS / f"{name}.png")
        print(f"  {name:20s} {img.size}")

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
