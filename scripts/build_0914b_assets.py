# -*- coding: utf-8 -*-
"""
追加素材0914-b（画像23点）をゲーム用に加工して配置する。

- 場所背景：そのままコピー（人物なし・加工不要）
- 机／虫眼鏡：グリーンバック or マゼンタを除去 → 実体ぴったりにトリミング
- 机の中：そのままコピー（モーダルの背景として全面表示するため透過不要）

再実行可能。元素材は 追加素材0914-b/画像素材/ に残る。
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import remove_chroma_background, tight_crop  # noqa: E402

SRC = Path("追加素材0914-b/画像素材")
APP = Path("app/public/assets")
TMP = APP / "source" / "_work_b"

#: 場所背景（そのままコピー）。school_loop*_classroom は loop*_classroom と同一画像なので使わない。
BACKGROUNDS = [
    # 2周目
    "loop2_gate",
    "loop2_courtyard",
    "loop2_classroom",
    "loop2_shop",
    "loop2_stairs",
    "loop2_gym_back",
    "loop2_rooftop",
    # 3周目
    "loop3_gate",
    "loop3_courtyard",
    "loop3_classroom",
    "loop3_shop",
    "loop3_stairs",
    "loop3_gym_back",
    "loop3_rooftop",
    # 1周目の追加
    "place_clubrooms",
    "place_gate_after",
    "place_courtyard_after",
]


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)

    print("■ 場所背景（そのままコピー）")
    for name in BACKGROUNDS:
        src = SRC / f"{name}.png"
        if not src.exists():
            print(f"  !! 見つからない: {src}")
            continue
        dst = APP / "backgrounds" / f"{name}.png"
        shutil.copyfile(src, dst)
        with Image.open(dst) as im:
            print(f"  {name:24s} {im.size}")

    print("■ 机オブジェクト（グリーンバック除去）")
    tmp = TMP / "desk_keyed.png"
    info = remove_chroma_background(str(SRC / "desk_single.png"), str(tmp), key="green")
    size = tight_crop(str(tmp), str(APP / "items" / "desk_single.png"))
    print(f"  desk_single              {info['size']} → {size}  透過{info['transparent_ratio']:.0%}")

    print("■ 虫眼鏡アイコン（マゼンタ除去・線画なので内側も抜く）")
    tmp = TMP / "search_keyed.png"
    info = remove_chroma_background(
        str(SRC / "ui_search_icon.png"), str(tmp), key="magenta", border_connected_only=False
    )
    size = tight_crop(str(tmp), str(APP / "ui" / "icon_search.png"))
    print(f"  icon_search              {info['size']} → {size}  透過{info['transparent_ratio']:.0%}")

    print("■ 机の中（モーダル背景。全面表示なので透過不要）")
    dst = APP / "items" / "desk_inside_empty.png"
    shutil.copyfile(SRC / "desk_inside_empty.png", dst)
    with Image.open(dst) as im:
        print(f"  desk_inside_empty        {im.size}")

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
