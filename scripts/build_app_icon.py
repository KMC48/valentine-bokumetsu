# -*- coding: utf-8 -*-
"""
Androidアプリのアイコンと、Google Play 掲載用の画像を作る。

【何を元にしているか】
ゲーム中の「お菓子の持ち込み禁止」ポスターに描かれた**赤い禁止マーク**を切り出し、
濃紺の下地に乗せている。主人公の腕章と同じ意匠なので、
アプリ一覧に並んだときも中身が想像できる。

【暫定であること】
既存の絵からの切り出しなので、アイコン専用に描かれた絵ではない。
きちんと作るなら 画像素材/追加画像素材_制作指示書_アプリアイコン.md を参照。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

RES = Path("app/android/app/src/main/res")
STORE = Path("ストア掲載用")
SIGN = Path("app/public/assets/signage/sign_no_sweets.webp")
TITLE = Path("app/public/assets/backgrounds/title_background.webp")

#: 下地の色。ゲームのUIと同じ濃紺。
NAVY = (12, 18, 34, 255)

#: ランチャーアイコンの密度別サイズ。
DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def symbol() -> Image.Image:
    """ポスターから禁止マークだけを抜き出す（紙の白を透明にする）。"""
    poster = Image.open(SIGN).convert("RGBA")
    # 上部の、禁止マークが描かれている範囲。
    mark = poster.crop((25, 15, 325, 260))

    px = mark.load()
    for y in range(mark.height):
        for x in range(mark.width):
            r, g, b, a = px[x, y]
            # 紙は「明るくて色味が無い」。赤い輪とチョコは残す。
            if r > 185 and g > 185 and b > 185 and max(r, g, b) - min(r, g, b) < 34:
                px[x, y] = (r, g, b, 0)
    return mark.crop(mark.getbbox())


def on_navy(mark: Image.Image, size: int, fill: float) -> Image.Image:
    """濃紺の正方形の中央に、指定した占有率でマークを置く。"""
    canvas = Image.new("RGBA", (size, size), NAVY)
    w = round(size * fill)
    h = round(w * mark.height / mark.width)
    if h > size * fill:
        h = round(size * fill)
        w = round(h * mark.width / mark.height)
    resized = mark.resize((w, h), Image.LANCZOS)
    canvas.paste(resized, ((size - w) // 2, (size - h) // 2), resized)
    return canvas


def rounded(img: Image.Image) -> Image.Image:
    """円形に切り抜く（ic_launcher_round 用）。"""
    from PIL import ImageDraw

    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, img.width - 1, img.height - 1), fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


def main() -> None:
    mark = symbol()
    print(f"禁止マークを抽出: {mark.size}")

    for name, size in DENSITIES.items():
        d = RES / f"mipmap-{name}"
        d.mkdir(parents=True, exist_ok=True)
        icon = on_navy(mark, size, 0.68)
        icon.save(d / "ic_launcher.png")
        rounded(icon).save(d / "ic_launcher_round.png")
        # 適応アイコンの前景は、外周が切り落とされる前提で中央に小さく置く。
        on_navy(mark, size * 2, 0.42).save(d / "ic_launcher_foreground.png")
        print(f"  mipmap-{name}: {size}px")

    STORE.mkdir(exist_ok=True)
    on_navy(mark, 512, 0.68).convert("RGB").save(STORE / "アプリアイコン_512.png")
    print("  ストア用アイコン 512px")

    # フィーチャーグラフィック（1024×500）。タイトルCGの人物あたりを使う。
    title = Image.open(TITLE).convert("RGB")
    # 横長に切り出す。人物の顔が入る高さを選ぶ。
    top = round(title.height * 0.18)
    crop = title.crop((0, top, title.width, top + round(title.width * 500 / 1024)))
    feature = crop.resize((1024, 500), Image.LANCZOS)
    feature.save(STORE / "フィーチャーグラフィック_1024x500.png")
    print("  フィーチャーグラフィック 1024×500")


if __name__ == "__main__":
    main()
