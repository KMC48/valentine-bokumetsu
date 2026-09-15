# -*- coding: utf-8 -*-
"""
追加素材25点0915 をゲーム用に加工する。

- モブ10点 … グリーンバックを抜いて実体ぴったりにトリミング
- 背景8点   … そのまま配置（全画面に敷くので加工しない）
- 腕章修正7点 … 差し替え先の名前にして配置
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import alpha_bbox, remove_chroma_background  # noqa: E402

SRC = Path("画像素材/追加素材25点0915")
CHARS = Path("app/public/assets/characters/mob")
BG = Path("app/public/assets/backgrounds")
END = Path("app/public/assets/endings")
TMP = Path("app/public/assets/source/_work_0915")

MOBS = [
    "mob_sit_1", "mob_sit_2", "mob_sit_3", "mob_blackboard",
    "mob_talk_a1", "mob_talk_a2", "mob_talk_b1", "mob_talk_b2",
    "mob_stand_1", "mob_stand_2",
]

BACKGROUNDS = [
    "shop_loop1", "shop_loop2", "shop_loop3",
    "gym_back_loop2", "gym_back_loop3",
    "rooftop_loop2", "rooftop_loop3",
    "classroom_loop3",
]

#: 腕章を左腕に直した絵 → 差し替え先。
ARM_FIX = {
    "title_left_arm": (BG, "title_bg"),
    "ending_c_left_arm": (END, "ending_c"),
    "ending_special_left_arm": (END, "ending_special"),
    "loop2_ending_special_left_arm": (END, "loop2_ending_special"),
    "loop3_ending_c_left_arm": (END, "loop3_ending_c"),
    "loop3_ending_special_left_arm": (END, "loop3_ending_special"),
}


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    CHARS.mkdir(parents=True, exist_ok=True)

    print("■ モブ（グリーンバック除去＋トリミング）")
    for name in MOBS:
        tmp = TMP / f"{name}.png"
        info = remove_chroma_background(str(SRC / f"{name}.png"), str(tmp), key="green")
        img = Image.open(tmp).convert("RGBA")
        x0, y0, x1, y1 = alpha_bbox(img)
        m = 2
        c = img.crop((max(0, x0 - m), max(0, y0 - m), min(img.width, x1 + m), min(img.height, y1 + m)))
        c.save(CHARS / f"{name}.png")
        print(f"  {name:16s} {c.size}  透過{info['transparent_ratio']:.0%}")

    print("■ 背景")
    for name in BACKGROUNDS:
        shutil.copyfile(SRC / f"{name}.png", BG / f"{name}.png")
        print(f"  {name}")

    print("■ 腕章の修正（左腕へ）")
    for src_name, (dst_dir, dst_name) in ARM_FIX.items():
        shutil.copyfile(SRC / f"{src_name}.png", dst_dir / f"{dst_name}.png")
        print(f"  {src_name:32s} -> {dst_dir.name}/{dst_name}")

    # 主人公の正面全身は画面に出ないが、差し替えておく
    tmp = TMP / "player.png"
    remove_chroma_background(str(SRC / "player_left_arm.png"), str(tmp), key="green")
    img = Image.open(tmp).convert("RGBA")
    x0, y0, x1, y1 = alpha_bbox(img)
    img.crop((x0 - 2, y0 - 2, x1 + 2, y1 + 2)).save("app/public/assets/characters/player.png")
    print("  player_left_arm                  -> characters/player")

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
