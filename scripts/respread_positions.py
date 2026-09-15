# -*- coding: utf-8 -*-
"""
生徒の x 座標を、重ならないように割り当て直す。

【なぜ必要か】
床は奥ほど狭い台形なので、奥にいる生徒は画面中央付近にしか立てない。
一方、手前の生徒は画面端まで行ける。
旧データは全員が同じ 0〜100 のつもりで x を持っていたため、
「奥の生徒が中央へ引き寄せられて、手前の生徒と重なる」ことが起きていた。

【方針】
手前の生徒ほど画面端に、奥の生徒ほど中央に配置する（実際の廊下の見え方と同じ）。
ステージごとに5人を y（奥行き）でソートし、
手前から順に 左端 → 右端 → 左中 → 右中 → 中央 の画面位置を割り当てる。
そのうえで floorX() の逆算でデータ側の x を求める。
"""
import re

PATH = "app/src/data/students.ts"

# loops.ts の FloorShape と同じ値を持つ（ここを変えたら loops.ts も合わせること）
CORRIDOR = dict(centerX=50, farHalf=16, nearHalf=60, farY=50, nearY=92)
FLOORS = {
    (1, "morning"): CORRIDOR,
    (1, "lunch"): {**CORRIDOR, "centerX": 58, "farHalf": 14, "nearHalf": 46},
    (1, "afterSchool"): {**CORRIDOR, "farHalf": 17, "nearHalf": 58},
    (2, "morning"): CORRIDOR,
    (2, "lunch"): CORRIDOR,
    (2, "afterSchool"): CORRIDOR,
    (3, "morning"): {**CORRIDOR, "centerX": 46},
    (3, "lunch"): {**CORRIDOR, "centerX": 46},
    (3, "afterSchool"): {**CORRIDOR, "centerX": 46},
}

#: 手前から順に割り当てる画面上の目標位置（%）
SCREEN_SLOTS = [17, 83, 33, 67, 50]


def half_at(floor: dict, y: float) -> float:
    t = min(1.0, max(0.0, (y - floor["farY"]) / (floor["nearY"] - floor["farY"])))
    return floor["farHalf"] + (floor["nearHalf"] - floor["farHalf"]) * t


def data_x_for(floor: dict, screen_x: float, y: float) -> int:
    """画面上の目標位置から、データ側の x を逆算する。"""
    half = half_at(floor, y)
    if half <= 0:
        return 50
    offset = (screen_x - floor["centerX"]) / half  # -1 〜 1 が有効範囲
    offset = min(1.0, max(-1.0, offset))
    return int(round(50 + offset * 50))


text = open(PATH, encoding="utf-8").read()
block_re = re.compile(r"(  \{\n(?:.*?\n)  \},\n)", re.DOTALL)
blocks = block_re.findall(text)

# (loop, stage) ごとにまとめ、奥行き順に並べる
groups: dict[tuple[int, str], list[tuple[int, int, int]]] = {}
for i, b in enumerate(blocks):
    loop = int(re.search(r"loop: (\d+)", b).group(1))
    stage = re.search(r'stage: "([^"]+)"', b).group(1)
    x, y = re.search(r"position: \{ x: (-?\d+), y: (-?\d+) \}", b).groups()
    groups.setdefault((loop, stage), []).append((i, int(x), int(y)))

new_x: dict[int, int] = {}
for key, members in groups.items():
    floor = FLOORS[key]
    # y が大きい（手前）ほど先に、画面端のスロットを割り当てる
    members.sort(key=lambda m: -m[2])
    for slot_i, (idx, _old_x, y) in enumerate(members):
        target = SCREEN_SLOTS[slot_i % len(SCREEN_SLOTS)]
        new_x[idx] = data_x_for(floor, target, y)
    print(
        f"loop{key[0]} {key[1]:11s} "
        + " ".join(f"y{y}->x{new_x[i]}(画面{SCREEN_SLOTS[s % 5]}%)" for s, (i, _, y) in enumerate(members))
    )

counter = {"i": 0}


def repl(m: re.Match) -> str:
    b = m.group(1)
    i = counter["i"]
    counter["i"] += 1
    return re.sub(
        r"position: \{ x: (-?\d+), y: (-?\d+) \}",
        lambda pm: f"position: {{ x: {new_x[i]}, y: {pm.group(2)} }}",
        b,
    )


text = block_re.sub(repl, text)
open(PATH, "w", encoding="utf-8").write(text)
print("\n更新完了:", PATH)
