# -*- coding: utf-8 -*-
"""
0914追加素材（18枚）をゲーム用に加工して配置する。

- 人物・掲示物：グリーンバックを除去 → 実体ぴったりにトリミング
- UIシート：マゼンタバックを除去 → 個別アイコンに分割
- 背景：そのままコピー（加工不要）

再実行可能。元素材は 画像素材/0914追加/画像素材/ に残る。
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import remove_chroma_background, split_by_gaps, tight_crop  # noqa: E402

SRC = Path("画像素材/0914追加/画像素材")
APP = Path("app/public/assets")
TMP = APP / "source" / "_work"


def log(msg: str) -> None:
    print(msg)


def process_person(name: str, out_name: str) -> None:
    """人物1体（グリーンバック）→ 透過＋実体トリミング。"""
    tmp = TMP / f"{out_name}_keyed.png"
    info = remove_chroma_background(str(SRC / f"{name}.png"), str(tmp), key="green")
    size = tight_crop(str(tmp), str(APP / "characters" / f"{out_name}.png"))
    log(f"  {out_name:28s} {info['size']} → {size}  透過{info['transparent_ratio']:.0%}")


def process_sheet(
    name: str, count: int, out_dir: Path, out_names: list[str], key: str, *, line_art: bool = False
) -> None:
    """シート（複数オブジェクト）→ 透過して個別に切り出し。"""
    tmp = TMP / f"{name}_keyed.png"
    info = remove_chroma_background(
        str(SRC / f"{name}.png"), str(tmp), key=key, border_connected_only=not line_art
    )
    pieces = split_by_gaps(str(tmp), expected=count)
    log(f"  {name:28s} {info['size']} → {len(pieces)}個に分割（期待{count}）")
    out_dir.mkdir(parents=True, exist_ok=True)
    for piece, out_name in zip(pieces, out_names):
        piece.save(out_dir / f"{out_name}.png")
        log(f"      {out_name:24s} {piece.size}")
    if len(pieces) != count:
        log(f"      !! 分割数が期待と違う。min_gap の調整が必要かもしれない")


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)

    log("■ 背景（そのままコピー）")
    for name in (
        "school_loop2_lunch",
        "school_loop2_after",
        "school_loop3_lunch",
        "school_loop3_after",
        "place_gate",
        "place_courtyard",
        "place_stairs",
        "place_shop",
    ):
        dst = APP / "backgrounds" / f"{name}.png"
        shutil.copyfile(SRC / f"{name}.png", dst)
        with Image.open(dst) as im:
            log(f"  {name:28s} {im.size}")

    log("■ 人物（グリーンバック除去）")
    process_person("player_back_over_shoulder", "player_back")
    for n in range(1, 6):
        process_person(f"girl_00{n}_turn", f"girl_00{n}_turn")

    log("■ モブ生徒（6体に分割）")
    process_sheet(
        "mob_students_sheet",
        6,
        APP / "characters" / "mob",
        ["mob_boy_1", "mob_boy_2", "mob_boy_3", "mob_girl_1", "mob_girl_2", "mob_girl_3"],
        key="green",
    )

    log("■ 校内掲示物（3点に分割）")
    process_sheet(
        "school_signage_sheet",
        3,
        APP / "signage",
        ["sign_no_sweets", "sign_banner", "sign_classroom_plate"],
        key="green",
    )

    log("■ UIアイコン（2×2）")
    tmp = TMP / "ui_icons_keyed.png"
    remove_chroma_background(
        str(SRC / "ui_icons_sheet.png"), str(tmp), key="magenta", border_connected_only=False
    )
    img = Image.open(tmp).convert("RGBA")
    w, h = img.size
    quads = {
        "icon_megaphone": (0, 0, w // 2, h // 2),
        "icon_binoculars": (w // 2, 0, w, h // 2),
        "icon_handbook": (0, h // 2, w // 2, h),
        "icon_clipboard": (w // 2, h // 2, w, h),
    }
    (APP / "ui").mkdir(parents=True, exist_ok=True)
    for out_name, box in quads.items():
        piece_path = TMP / f"{out_name}_raw.png"
        img.crop(box).save(piece_path)
        size = tight_crop(str(piece_path), str(APP / "ui" / f"{out_name}.png"))
        log(f"  {out_name:28s} {size}")

    log("■ ナビアイコン（5個に分割）")
    process_sheet(
        "ui_nav_icons_sheet",
        5,
        APP / "ui",
        ["nav_home", "nav_story", "nav_encyclopedia", "nav_mission", "nav_shop"],
        key="magenta",
        # 白い線画アイコンなので、閉じた内側（家の中など）も抜く。
        line_art=True,
    )

    shutil.rmtree(TMP, ignore_errors=True)
    log("完了")


if __name__ == "__main__":
    main()
