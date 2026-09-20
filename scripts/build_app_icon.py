# -*- coding: utf-8 -*-
"""
アプリアイコンと、ストア掲載用の画像を書き出す。

【元にする絵】
`画像素材/アイコン候補/` の中から CHOSEN のファイルを使う。
差し替えたくなったら CHOSEN を変えて流し直すだけでよい。

【なぜ出力ごとに扱いを変えるのか】
Androidの「適応アイコン」だけは、外周を大きく削られる。
確実に残るのは内側66%ほどで、絵を枠いっぱいに描いていると
**赤い禁止マークが切り落とされて、ただの茶色い塊になる**。

一方 iOS とストア掲載用は角を丸めるだけなので、絵をそのまま使える。
全部まとめて縮めると、切られない場所まで無駄に小さくなる。
そのため、適応アイコンの前景だけ縮小版を用意する。
"""
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageDraw

CANDIDATES = Path("画像素材/アイコン候補")
#: 採用した候補（ファイル名の一部で指定）。
CHOSEN = "(2)"

RES = Path("app/android/app/src/main/res")
STORE = Path("ストア掲載用")
TITLE = Path("app/public/assets/backgrounds/title_background.webp")

#: ランチャーアイコン（従来形式）の密度別サイズ。
DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
#: 適応アイコンは 108dp 四方。密度ごとの実ピクセル。
ADAPTIVE = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
#: 適応アイコンの前景に置く絵の大きさ（108dp に対する割合）。
#: 内側66%が安全域なので、そこに収まるよう 0.62 にしている。
ADAPTIVE_FILL = 0.62


def source() -> Image.Image:
    hits = [p for p in CANDIDATES.glob("*.png") if CHOSEN in p.name]
    if not hits:
        raise FileNotFoundError(f"{CANDIDATES} に {CHOSEN} を含むPNGがありません")
    return Image.open(hits[0]).convert("RGB")


def circular(img: Image.Image) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, img.width - 1, img.height - 1), fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def background_color(img: Image.Image) -> str:
    """適応アイコンの下地。絵の上辺（空）の平均色を使う。"""
    top = img.crop((0, 0, img.width, img.height // 12)).resize((1, 1), Image.LANCZOS)
    r, g, b = top.getpixel((0, 0))
    return f"#{r:02X}{g:02X}{b:02X}"


def main() -> None:
    art = source()
    print(f"元の絵: {art.size}")

    print("■ Android・従来形式のランチャーアイコン（絵はそのまま）")
    for name, size in DENSITIES.items():
        d = RES / f"mipmap-{name}"
        d.mkdir(parents=True, exist_ok=True)
        icon = art.resize((size, size), Image.LANCZOS)
        icon.save(d / "ic_launcher.png")
        circular(icon).save(d / "ic_launcher_round.png")

    print("■ Android・適応アイコンの前景（安全域に収まるよう縮める）")
    for name, size in ADAPTIVE.items():
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        k = round(size * ADAPTIVE_FILL)
        canvas.paste(art.resize((k, k), Image.LANCZOS), ((size - k) // 2, (size - k) // 2))
        canvas.save(RES / f"mipmap-{name}" / "ic_launcher_foreground.png")

    color = background_color(art)
    io.open(RES / "values" / "ic_launcher_background.xml", "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        "    <!-- 適応アイコンの下地。絵の空の色を取っている。 -->\n"
        f'    <color name="ic_launcher_background">{color}</color>\n'
        "</resources>\n"
    )
    print(f"  下地の色: {color}")

    print("■ ストア掲載用")
    STORE.mkdir(exist_ok=True)
    art.resize((512, 512), Image.LANCZOS).save(STORE / "アプリアイコン_512.png")
    (STORE / "iOS").mkdir(exist_ok=True)
    # App Store のアイコンは透過を含められない。角丸もOS側で付く。
    art.resize((1024, 1024), Image.LANCZOS).save(STORE / "iOS" / "アプリアイコン_1024.png")

    title = Image.open(TITLE).convert("RGB")
    top = round(title.height * 0.18)
    crop = title.crop((0, top, title.width, top + round(title.width * 500 / 1024)))
    crop.resize((1024, 500), Image.LANCZOS).save(STORE / "フィーチャーグラフィック_1024x500.png")
    print("  512 / 1024 / フィーチャーグラフィック")


if __name__ == "__main__":
    main()
