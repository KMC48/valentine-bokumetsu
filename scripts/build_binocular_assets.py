# -*- coding: utf-8 -*-
"""
双眼鏡素材をゲーム用に加工する。

【視界フレーム】
納品されたのは「参考_未完成」の原稿。形は正しいが、
外側の黒まで半透明（アルファ180〜240）で、要件の「内側完全透明・外側完全不透明」を満たさない。
申し送りどおり、アルファを数値的に補正して本番用にする。

  - アルファを smoothstep で [LO, HI] → [0, 255] に伸ばす
  - これで 180〜240 の“濁り”は 255（完全不透明）に、内側の 0〜1 は 0（完全透明）になる
  - 元のぼけた縁はそのまま残るので、ソフトエッジは失われない

【ボタン枠・使用不可アイコン】
マゼンタ背景のRGB画像。クロマキーで抜き、512×512へ縮小する。
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from remove_chroma_bg import remove_chroma_background, tight_crop  # noqa: E402

SRC = Path("画像素材/双眼鏡素材")
APP = Path("app/public/assets")
TMP = APP / "source" / "_work_bino"

#: この値より小さいアルファを「穴（覗いている部分）の候補」とみなす。
HOLE_THRESHOLD = 60
#: 穴のふちをぼかす量（px）。ソフトエッジ用。
EDGE_BLUR = 5


def fix_view_frame(src_path: Path, dst_path: Path) -> dict:
    """
    原稿のアルファは、外側にも 100〜240 程度のムラが散っている。
    しきい値を引くだけだと、そのムラが半透明のまま残って背景が透けてしまう。

    そこで「穴」を**連結領域として1つだけ**取り出し、それ以外は問答無用で
    完全不透明にする。こうすれば外側にムラが残る余地が無い。
    """
    import cv2

    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    alpha = arr[..., 3]

    # 穴の候補 → 連結成分のうち最大のものだけを本物の穴とする
    候補 = (alpha < HOLE_THRESHOLD).astype(np.uint8)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(候補, connectivity=8)
    if num > 1:
        # 背景ラベル0を除いて、面積が最大のものを選ぶ
        largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        hole = labels == largest
    else:
        hole = 候補.astype(bool)

    fixed = np.where(hole, 0.0, 255.0).astype(np.uint8)
    # ふちだけ柔らかくする
    fixed = cv2.GaussianBlur(fixed, (0, 0), EDGE_BLUR).astype(np.float32)

    # 不透明になる部分のRGBは、覗いていない領域なので純黒にそろえる。
    # （原稿は薄い灰色の濁りが乗っている）
    rgb = arr[..., :3]
    opaque = fixed > 250
    # シアンのリングと照準線は残したいので、彩度のある画素は触らない。
    max_c = rgb.max(axis=2)
    min_c = rgb.min(axis=2)
    is_gray = (max_c - min_c) < 24
    flatten = opaque & is_gray
    rgb[flatten] = 0.0

    out = np.dstack([rgb, fixed]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst_path)

    return {
        "size": im.size,
        "完全透明の割合": round(float((fixed < 4).mean()), 3),
        "完全不透明の割合": round(float((fixed > 251).mean()), 3),
        "中間の割合": round(float(((fixed >= 4) & (fixed <= 251)).mean()), 3),
    }


def key_and_resize(name: str, out_name: str, size: int = 512) -> None:
    tmp = TMP / f"{out_name}_keyed.png"
    info = remove_chroma_background(
        str(SRC / "画像素材" / f"{name}.png"), str(tmp), key="magenta", border_connected_only=False
    )
    cropped = TMP / f"{out_name}_crop.png"
    tight_crop(str(tmp), str(cropped))

    im = Image.open(cropped).convert("RGBA")
    # 正方形の中央に収めてから縮小する（他のアイコンと中心を揃えるため）。
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    canvas = canvas.resize((size, size), Image.LANCZOS)
    canvas.save(APP / "ui" / f"{out_name}.png")
    print(f"  {out_name:26s} {info['size']} → ({size}, {size})  透過{info['transparent_ratio']:.0%}")


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    (APP / "ui").mkdir(parents=True, exist_ok=True)

    print("■ 覗き込みフレーム（アルファを補正）")
    info = fix_view_frame(
        SRC / "参考_未完成" / "binocular_view_frame_draft.png",
        APP / "ui" / "binocular_view_frame.png",
    )
    print(f"  binocular_view_frame       {info['size']}")
    print(f"    完全透明 {info['完全透明の割合']:.0%} / 完全不透明 {info['完全不透明の割合']:.0%} / 中間 {info['中間の割合']:.0%}")

    print("■ ボタン枠・使用不可アイコン（マゼンタ除去＋512pxへ縮小）")
    key_and_resize("ui_item_button_frame", "item_button_frame")
    key_and_resize("icon_binoculars_empty", "icon_binoculars_empty")

    import shutil

    shutil.rmtree(TMP, ignore_errors=True)
    print("完了")


if __name__ == "__main__":
    main()
