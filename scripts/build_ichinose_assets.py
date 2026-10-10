"""一ノ瀬の原稿3枚を透過PNGへ加工。最後に optimize_assets.py を実行する。

依存: Pillow, numpy, opencv-python-headless
実行場所: リポジトリ直下。原稿は整理済みの「使用」フォルダに保持する。
"""
from pathlib import Path

from PIL import Image

from remove_chroma_bg import remove_chroma_background, tight_crop

SOURCE = Path("画像素材/使用")
DEST = Path("app/public/assets/characters")
SOURCES = {
    "ichinose": SOURCE / "06_女子生徒の立ち絵/ichinose.png",
    "ichinose_turn": SOURCE / "06_女子生徒の立ち絵/ichinose_turn.png",
    "bust_ichinose": SOURCE / "02_ストーリー画面のバストアップ/bust_ichinose.png",
}


def main() -> None:
    # 不足した原稿で一部だけ更新することを防ぐ。
    for source in SOURCES.values():
        with Image.open(source) as im:
            if im.size != (1024, 1536):
                raise ValueError(f"原稿サイズが不正: {source}: {im.size}")
    DEST.mkdir(parents=True, exist_ok=True)
    for name, source in SOURCES.items():
        target = DEST / f"{name}.png"
        # 髪・腕・紙袋の持ち手で囲まれた緑も抜く。
        # この3原稿には緑色の衣装・持ち物・瞳はない。
        remove_chroma_background(
            str(source), str(target), key="green", border_connected_only=False,
            erode_px=0, feather_px=0.5,
        )
        # StudentTargetは高さ指定＋足元アンカー。上下の余白を除き、
        # 通常と振り向きで見た目の身長と足元が一致するようにする。
        size = tight_crop(str(target), str(target), margin=2)
        print(f"{name}: {size}")


if __name__ == "__main__":
    main()
