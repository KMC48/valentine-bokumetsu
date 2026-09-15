# -*- coding: utf-8 -*-
"""
生徒の足元Y座標を、実写背景の「床が見える範囲」に合わせて割り当て直す。

旧データは仮背景（CSSグラデーション）前提で y=44〜72 に置いていたが、
実写背景に差し替えたことで床の見える範囲が変わったため、
y=50（奥・消失点付近）〜 y=88（手前）へ線形に引き伸ばす。

y は「足元が、ゲームエリアの上から何%の位置か」を表す。
"""
import re

PATH = "app/src/data/students.ts"
NEW_FAR, NEW_NEAR = 50.0, 88.0

text = open(PATH, encoding="utf-8").read()

pos_re = re.compile(r"position: \{ x: (-?\d+), y: (-?\d+) \}")
ys = [int(m.group(2)) for m in pos_re.finditer(text)]
old_far, old_near = min(ys), max(ys)
print(f"旧レンジ y={old_far}〜{old_near} ({len(ys)}件) → 新レンジ y={NEW_FAR:.0f}〜{NEW_NEAR:.0f}")


def remap(m: re.Match) -> str:
    x = int(m.group(1))
    y = int(m.group(2))
    t = (y - old_far) / (old_near - old_far)
    new_y = round(NEW_FAR + (NEW_NEAR - NEW_FAR) * t)
    return f"position: {{ x: {x}, y: {new_y} }}"


text = pos_re.sub(remap, text)
open(PATH, "w", encoding="utf-8").write(text)

ys_after = [int(m.group(2)) for m in pos_re.finditer(text)]
print("変更後の分布:", sorted(set(ys_after)))
