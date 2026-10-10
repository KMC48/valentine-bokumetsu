"""専用画像と他の42人を守る回帰テスト。原稿・本番データは変更しない。"""
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDENTS = ROOT / "app/src/data/students.ts"


class DedicatedArtTest(unittest.TestCase):
    def test_assignment_is_repeatable_and_repairs_generic_ichinose(self):
        expected = STUDENTS.read_text(encoding="utf-8")
        # 汎用画像へ戻された場合も専用画像を復元できることを確認する。
        legacy = expected.replace(
            'image: "assets/characters/ichinose.webp"',
            'image: "assets/characters/loop3_girl_01.webp"',
        )
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            data = root / "app/src/data/students.ts"
            data.parent.mkdir(parents=True)
            (root / "scripts").mkdir()
            data.write_text(legacy, encoding="utf-8")
            for _ in range(2):
                subprocess.run(
                    [sys.executable, str(ROOT / "scripts/assign_character_images.py")],
                    cwd=root, check=True, capture_output=True,
                )
                # 全文一致＝他の42人の画像・全員の判定データ・ヒントを保持。
                self.assertEqual(data.read_text(encoding="utf-8"), expected)
            self.assertEqual(len(re.findall(r'    id: "', expected)), 43)


if __name__ == "__main__":
    unittest.main()
