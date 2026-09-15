# -*- coding: utf-8 -*-
"""
ゲームが読み込む画像を WebP に変換する。

【なぜ必要か】
背景は1枚あたり平均2MBのPNGだった。
場所を切り替えるたびにこれを1枚取りに行くので、
スマホの回線では切り替えのたびに数秒待たされる。

WebP（品質88）にすると、見た目はそのままで **1〜2割の容量**になる。
アルファ（切り抜き）も保持されるので、立ち絵にもそのまま使える。

【使い方】
納品素材を build_*.py で加工したあと、最後にこれを流す。
PNGは変換後に削除する（原本は 画像素材/ 側にある）。

    python scripts/optimize_assets.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path("app/public/assets")

#: 変換しないもの。
#: - source / reference … 作業用。ゲームからは読まない
#: - bgm … 音声
SKIP_DIRS = {"source", "reference", "bgm"}

#: 品質。88 は原本と見分けがつかず、容量は1〜2割になる。
QUALITY = 88


def main() -> None:
    total_before = total_after = 0
    converted = 0

    for png in sorted(ROOT.rglob("*.png")):
        if SKIP_DIRS & set(png.relative_to(ROOT).parts):
            continue

        before = png.stat().st_size
        img = Image.open(png)
        # アルファが無いものは RGB にしておく（無駄なチャンネルを持たせない）。
        if img.mode == "RGBA" and img.getchannel("A").getextrema() == (255, 255):
            img = img.convert("RGB")

        webp = png.with_suffix(".webp")
        img.save(webp, "WEBP", quality=QUALITY, method=6)
        after = webp.stat().st_size

        png.unlink()
        total_before += before
        total_after += after
        converted += 1

    mb = 1024 * 1024
    print(f"{converted}枚を変換")
    print(f"  変換前 {total_before / mb:7.1f} MB")
    print(f"  変換後 {total_after / mb:7.1f} MB  ({total_after / total_before * 100:.0f}%)")


if __name__ == "__main__":
    main()
