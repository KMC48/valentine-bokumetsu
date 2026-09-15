# -*- coding: utf-8 -*-
"""
「男子制服・アイコン・教室修正素材」をゲーム用に加工する。

【3種類で扱いが違う】
- 男子制服（立ち絵）… グリーンバックを抜いて、実体ぴったりにトリミング。
  さらに **1周目の絵と同じ縦横比・同じ余白**に揃える。
  ストーリー画面は高さ69%で表示するので、トリミングの基準がずれると
  周回をまたいだときにキャラの大きさが跳ねる。
- アイコン … 枠を塗りつぶして使うので背景を抜かない。そのまま配置する。
- 教室背景 … 全画面に敷くので加工しない。そのまま配置する。
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import alpha_bbox, remove_chroma_background  # noqa: E402

SRC = Path("画像素材/男子制服・アイコン・教室修正素材")
CHARS = Path("app/public/assets/characters")
UI = Path("app/public/assets/ui")
BG = Path("app/public/assets/backgrounds")
TMP = Path("app/public/assets/source/_work_uic")

#: 立ち絵 → 縦横比を合わせる基準（1周目の同じ絵）。
STANDING = {
    "loop2_player_back": "player_back",
    "loop3_player_back": "player_back",
    "loop2_bust_player": "bust_player",
    "loop3_bust_player": "bust_player",
}

ICONS = [
    "player_face_normal",
    "player_face_focus",
    "player_face_confident",
    "player_face_hurry",
]

CLASSROOMS = ["classroom_loop1", "classroom_loop2", "classroom_loop3"]


def key_and_crop(path: Path, name: str) -> tuple[Image.Image, dict]:
    tmp = TMP / f"{name}_keyed.png"
    info = remove_chroma_background(str(path), str(tmp), key="green")
    img = Image.open(tmp).convert("RGBA")
    x0, y0, x1, y1 = alpha_bbox(img)
    m = 2
    return (
        img.crop(
            (max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m))
        ),
        info,
    )


def match_bust_framing(img: Image.Image, ref: Image.Image) -> Image.Image:
    """
    バストアップの「切り取る位置」を1周目の絵に合わせる。

    納品された2・3周目のバストは、1周目より下（腰のあたり）まで写っている。
    ストーリー画面は **高さ69%** で表示するので、そのまま出すと
    同じ高さに体を余分に詰め込むぶん **顔だけが小さくなる**。

    頭の位置は3枚とも画像の上端なので、**下を切って**縦横比を1周目に揃えれば、
    顔の大きさと構図がそろう。絵は伸縮させない。
    """
    want = ref.width / ref.height
    have = img.width / img.height
    if abs(want - have) < 0.005:
        return img
    if have < want:
        # 縦に長すぎる＝下まで写りすぎ。下を切る。
        return img.crop((0, 0, img.width, round(img.width / want)))
    # 横に広すぎる場合だけ、透明な余白を上に足して高さを稼ぐ。
    new_h = round(img.width / want)
    canvas = Image.new("RGBA", (img.width, new_h), (0, 0, 0, 0))
    canvas.paste(img, (0, new_h - img.height))
    return canvas


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)

    print("■ 男子制服（立ち絵）")
    for name, ref_name in STANDING.items():
        img, info = key_and_crop(SRC / "男子制服" / f"{name}.png", name)
        ref = Image.open(CHARS / f"{ref_name}.png").convert("RGBA")
        before = img.size
        img = match_bust_framing(img, ref)
        img.save(CHARS / f"{name}.png")
        print(
            f"  {name:20s} {before} -> {img.size}"
            f"  基準{ref_name} {ref.size}  透過{info['transparent_ratio']:.0%}"
        )

    print("■ アイコン（背景は抜かない）")
    UI.mkdir(parents=True, exist_ok=True)
    for name in ICONS:
        im = Image.open(SRC / "アイコン" / f"{name}.png").convert("RGB")
        im.save(UI / f"{name}.png")
        print(f"  {name:24s} {im.size}")

    print("■ 教室背景")
    for name in CLASSROOMS:
        shutil.copyfile(SRC / "教室修正" / f"{name}.png", BG / f"{name}.png")
        print(f"  {name:20s} {Image.open(BG / f'{name}.png').size}")

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
