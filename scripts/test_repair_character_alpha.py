"""Safety tests for the selective alpha repair; run with unittest discovery."""
import tempfile
import unittest
import io
from pathlib import Path

import numpy as np
from PIL import Image

from repair_character_alpha import encode_alpha_only, repair_alpha, source_alphas, webp_chunks


class AlphaRepairTests(unittest.TestCase):
    def test_enclosed_green_removed_black_artwork_preserved(self):
        rgb = np.full((80, 80, 3), (0, 255, 0), dtype="uint8")
        rgb[10:70, 10:70] = (8, 8, 8)  # black clothing, not background
        rgb[28:52, 28:52] = (0, 255, 0)  # enclosed background
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "source.png"
            Image.fromarray(rgb).save(path)
            old, new = map(np.array, source_alphas(path))
        rgba = np.dstack([rgb, old])
        result = repair_alpha(rgba, old, new)
        self.assertEqual(int(result[40, 40, 3]), 0)
        self.assertEqual(int(result[20, 20, 3]), 255)
        np.testing.assert_array_equal(result[:, :, :3], rgba[:, :, :3])
        np.testing.assert_array_equal(result[:10], rgba[:10])
        self.assertTrue(np.all(result[:, :, 3] <= rgba[:, :, 3]))

    def test_mismatched_source_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "silhouette"):
            repair_alpha(np.full((20, 20, 4), 255, dtype="uint8"),
                         np.zeros((20, 20), dtype="uint8"), np.zeros((20, 20), dtype="uint8"))

    def test_different_dimensions_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "dimensions"):
            repair_alpha(np.zeros((10, 10, 4), dtype="uint8"),
                         np.zeros((20, 20), dtype="uint8"), np.zeros((20, 20), dtype="uint8"))

    def test_webp_color_stream_is_preserved_verbatim(self):
        rgba = np.full((40, 40, 4), 255, dtype="uint8")
        rgba[:, :, :3] = (40, 50, 60)
        rgba[:5, :, 3] = 0
        buffer = io.BytesIO()
        Image.fromarray(rgba).save(buffer, format="WEBP", quality=88)
        original = buffer.getvalue()
        decoded = np.array(Image.open(io.BytesIO(original)).convert("RGBA"))
        decoded[15:25, 15:25, 3] = 0
        result = encode_alpha_only(original, decoded)
        self.assertEqual(dict(webp_chunks(original))[b"VP8 "], dict(webp_chunks(result))[b"VP8 "])
        np.testing.assert_array_equal(np.array(Image.open(io.BytesIO(result))), decoded)


if __name__ == "__main__":
    unittest.main()
