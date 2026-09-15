# -*- coding: utf-8 -*-
"""
画像素材フォルダを「使用」「未使用」に整理する。

【判定のしかた】
納品時のフォルダ名ではなく、**実際にゲームが読み込んでいるか**で振り分ける。
app/public/assets/ に同じ名前のWebPがあれば「使用」、無ければ「未使用」。

加工の途中でファイル名を変えたものがあるので、そのぶんは RENAMED で補う。

制作指示書（.md）は画像素材フォルダの直下に残す。
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

SRC = Path("画像素材")
IMPL = Path("app/public/assets")
EXT = {".png", ".jpg", ".jpeg", ".webp"}

#: 納品名 → 実装名（加工時に改名したもの）。
RENAMED = {
    "shop_loop1": "place_shop",
    "shop_loop2": "loop2_shop",
    "shop_loop3": "loop3_shop",
    "gym_back_loop2": "loop2_gym_back",
    "gym_back_loop3": "loop3_gym_back",
    "rooftop_loop2": "loop2_rooftop",
    "rooftop_loop3": "loop3_rooftop",
    "title_left_arm": "title_background",
    "player_left_arm": "player",
    "ending_c_left_arm": "ending_c",
    "ending_special_left_arm": "ending_special",
    "loop2_ending_special_left_arm": "loop2_ending_special",
    "loop3_ending_c_left_arm": "loop3_ending_c",
    "loop3_ending_special_left_arm": "loop3_ending_special",
    "player_back_over_shoulder": "player_back",
}

#: 実装名の特徴 → 使用シーンのフォルダ名。上から順に当てはめる。
SCENES: list[tuple[str, str]] = [
    ("title_background", "01_タイトル画面"),
    ("bust_", "02_ストーリー画面のバストアップ"),
    ("ending_", "03_エンディングCG"),
    ("mob_", "07_モブ生徒"),
    ("girl_", "06_女子生徒の立ち絵"),
    ("player", "05_主人公・教師・男子生徒"),
    ("teacher", "05_主人公・教師・男子生徒"),
    ("boy_", "05_主人公・教師・男子生徒"),
    ("banner_", "08_掲示物（横断幕・ポスター）"),
    ("sign_", "08_掲示物（横断幕・ポスター）"),
    ("icon_", "09_UI・アイコン"),
    ("nav_", "09_UI・アイコン"),
    ("desk_", "10_アイテム（机の中・双眼鏡）"),
    ("item_", "10_アイテム（机の中・双眼鏡）"),
    ("binocular", "10_アイテム（机の中・双眼鏡）"),
    ("choco", "10_アイテム（机の中・双眼鏡）"),
]

#: 背景は周回ごとに分ける。
BG_SCENES = {
    "loop2": "04_背景_2周目（私立聖蘭学院）",
    "loop3": "04_背景_3周目（白鷺台学園）",
}
BG_DEFAULT = "04_背景_1周目（県立桜庭高等学校）"

UNUSED_SHEET = "未使用/01_複数枚を1枚にまとめたシート"
UNUSED_NAMELESS = "未使用/02_名前が付いていない納品原本"
UNUSED_DRAFT = "未使用/03_下書き・参考用"
UNUSED_OLD = "未使用/04_差し替え前の旧版"


def implemented() -> dict[str, Path]:
    """実装済みのWebP（拡張子なしの名前 → パス）。"""
    out: dict[str, Path] = {}
    for p in IMPL.rglob("*.webp"):
        if {"source", "reference"} & set(p.parts):
            continue
        out[p.stem] = p
    return out


def scene_for(impl_path: Path, stem: str) -> str:
    if impl_path.parent.name == "backgrounds":
        for key, folder in BG_SCENES.items():
            if stem.startswith(key):
                return folder
        return BG_DEFAULT
    # loop2_ / loop3_ は「どの学校版か」を表すだけなので、種類の判定には使わない。
    base = re.sub(r"^loop[23]_", "", stem)
    for prefix, folder in SCENES:
        if base.startswith(prefix):
            return folder
    return "11_その他"


def unused_bucket(path: Path, stem: str) -> str:
    if stem.endswith("_sheet"):
        return UNUSED_SHEET
    if stem.startswith("ChatGPT Image"):
        return UNUSED_NAMELESS
    if "参考" in str(path) or "draft" in stem or "下書き" in str(path):
        return UNUSED_DRAFT
    return UNUSED_OLD


def main() -> None:
    impl = implemented()
    files = [p for p in SRC.rglob("*") if p.is_file() and p.suffix.lower() in EXT]

    moves: list[tuple[Path, Path]] = []
    for p in files:
        # 過去の実行で付いた区別用の接尾辞を外してから判定する。
        stem = p.stem.split("--")[0]
        key = RENAMED.get(stem, stem)
        hit = impl.get(key)
        if hit is not None:
            dest = SRC / "使用" / scene_for(hit, key) / p.name
        else:
            dest = SRC / unused_bucket(p, stem) / p.name
        moves.append((p, dest))

    for old, new in moves:
        if old.resolve() == new.resolve():
            continue  # すでに正しい場所にある
        new.parent.mkdir(parents=True, exist_ok=True)
        # 別の場所から来た同名ファイルは、納品フォルダ名を足して区別する。
        if new.exists():
            new = new.with_name(f"{new.stem}--{old.parent.name}{new.suffix}")
        shutil.move(str(old), str(new))

    # 空になった納品フォルダを片付ける
    for d in sorted((p for p in SRC.rglob("*") if p.is_dir()), key=lambda p: -len(p.parts)):
        if d.name in ("使用", "未使用"):
            continue
        if "使用" in d.parts:
            continue
        if not any(d.iterdir()):
            # OneDrive が掴んでいて消せないことがある。残っても実害はない。
            try:
                d.rmdir()
            except OSError:
                pass

    used = sum(1 for _, n in moves if "使用" == n.parts[1])
    print(f"使用 {used}枚 / 未使用 {len(moves) - used}枚")
    for d in sorted((SRC / "使用").iterdir()):
        print(f"  使用/{d.name:40s} {len(list(d.iterdir()))}枚")
    for d in sorted((SRC / "未使用").iterdir()):
        print(f"  未使用/{d.name:40s} {len(list(d.iterdir()))}枚")


if __name__ == "__main__":
    main()
