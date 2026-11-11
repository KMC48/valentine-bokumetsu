"""Restore enclosed chroma gaps without redrawing or recompressing sprite RGB.

Run from the repository root after extracting the source packs listed in
docs/character-alpha-audit-20261112.json into one directory:
    python scripts/repair_character_alpha.py --sources /path/to/alpha-sources

Only reviewed records with exact source/input hashes are eligible. Existing
repaired files are skipped. Missing or changed inputs fail before any writes.
Requires Pillow, numpy and opencv-python-headless (as existing asset scripts do).
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import struct
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/character-alpha-audit-20261112.json"
CHARACTERS = ROOT / "app/public/assets/characters"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_alphas(path: Path) -> tuple[Image.Image, Image.Image]:
    rgb = np.array(Image.open(path).convert("RGB"))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, sat, val = hsv.transpose(2, 0, 1)
    background = (abs(hue.astype(int) - 60) <= 22) & (sat >= 70) & (val >= 60)
    _, labels = cv2.connectedComponents(background.astype("uint8"), connectivity=4)
    border = np.unique(np.r_[labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    outside = np.isin(labels, border[border > 0])
    def alpha(mask: np.ndarray) -> Image.Image:
        eroded = cv2.erode((~mask).astype("uint8") * 255, np.ones((3, 3), "uint8"))
        return Image.fromarray(eroded).filter(ImageFilter.GaussianBlur(1))
    return alpha(outside), alpha(background)


def repair_alpha(rgba: np.ndarray, expected: np.ndarray, cleared: np.ndarray) -> np.ndarray:
    if rgba.shape[:2] != expected.shape or expected.shape != cleared.shape:
        raise ValueError("Source/target dimensions differ")
    old = rgba[:, :, 3]
    if np.abs(old.astype(int) - expected.astype(int)).mean() >= 0.06:
        raise ValueError("Source silhouette does not match the existing sprite")
    # Limit changes to enclosed gaps. Preserve the existing exterior edge exactly.
    strong = old.astype(int) - cleared.astype(int) > 100
    local = cv2.dilate(strong.astype("uint8"), np.ones((11, 11), "uint8")).astype(bool)
    result = rgba.copy()
    result[:, :, 3] = np.where(local, np.minimum(old, cleared), old)
    return result


def webp_chunks(data: bytes) -> list[tuple[bytes, bytes]]:
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("Expected WebP RIFF container")
    parts, position = [], 12
    while position < len(data):
        length = struct.unpack_from("<I", data, position + 4)[0]
        parts.append((data[position:position + 4], data[position + 8:position + 8 + length]))
        position += 8 + length + (length & 1)
    if position != len(data):
        raise ValueError("Truncated WebP chunk")
    return parts


def encode_alpha_only(original: bytes, rgba: np.ndarray) -> bytes:
    """Replace ALPH; retain the existing compressed VP8 color stream verbatim."""
    parts = webp_chunks(original)
    if not {b"ALPH", b"VP8 "}.issubset(dict(parts)):
        raise ValueError("Expected reviewed VP8 + ALPH sprite; refusing color recompression")
    dummy = np.zeros_like(rgba)
    dummy[:, :, 3] = rgba[:, :, 3]
    buffer = io.BytesIO()
    Image.fromarray(dummy).save(buffer, format="WEBP", quality=0, method=6, lossless=False)
    alpha = dict(webp_chunks(buffer.getvalue()))[b"ALPH"]
    body = b"WEBP"
    for tag, data in parts:
        if tag == b"ALPH":
            data = alpha
        body += tag + struct.pack("<I", len(data)) + data + (b"\0" if len(data) & 1 else b"")
    encoded = b"RIFF" + struct.pack("<I", len(body)) + body
    decoded = np.array(Image.open(io.BytesIO(encoded)).convert("RGBA"))
    if not np.array_equal(decoded, rgba):
        raise ValueError("Alpha-only WebP round-trip failed")
    return encoded


def prepare(record: dict, sources: Path) -> tuple[Path, np.ndarray]:
    path = CHARACTERS / record["file"]
    if digest(path) != record["before_sha256"]:
        raise ValueError(f"Existing sprite has changed: {path}")
    source = sources / record["source"]
    if digest(source) != record["source_sha256"]:
        raise ValueError(f"Source has changed: {source}")
    current = Image.open(path).convert("RGBA")
    old, new = (a.crop(record["box"]) for a in source_alphas(source))
    if record["mode"] == "resize":
        old, new = (a.resize(current.size, Image.Resampling.LANCZOS) for a in (old, new))
    elif record["mode"] == "crop":
        old, new = (a.crop((0, 0, current.width, current.height)) for a in (old, new))
    else:
        raise ValueError("Unknown source transform")
    return path, repair_alpha(np.array(current), np.array(old), np.array(new))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, required=True)
    args = parser.parse_args()
    records = json.loads(MANIFEST.read_text())["assets"]
    pending = []
    # Validate all inputs first, so a missing pack cannot cause partial updates.
    for record in records:
        if record["status"] != "repaired":
            continue
        path = CHARACTERS / record["file"]
        if digest(path) == record["after_sha256"]:
            continue
        pending.append(prepare(record, args.sources))
    for path, rgba in pending:
        temporary = path.with_suffix(".alpha-repair.webp")
        try:
            temporary.write_bytes(encode_alpha_only(path.read_bytes(), rgba))
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    print(f"Repaired {len(pending)} sprites; previously repaired files are unchanged.")


if __name__ == "__main__":
    main()
