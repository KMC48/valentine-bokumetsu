# -*- coding: utf-8 -*-
"""
生徒データに area（場所）を割り当てる。

1周目は3エリアに分散させ、2・3周目は学校まるごと1エリアなので固定値を入れる。
1周目の分配は「奥行き（y）の小さい順に均等配分」ではなく、
各エリアに 1〜2 人ずつ散らして、どのエリアにも見るべき対象がある状態にする。
"""
import re

PATH = "app/src/data/students.ts"

# 周回×ステージごとに、生徒を順番でどの場所へ割り当てるか。
# areas.ts の STAGE_AREAS に存在する場所だけを使うこと（テストで検証される）。
AREA_PLAN = {
    1: {
        "morning": ["gate", "gate", "entrance", "entrance", "courtyard"],
        "lunch": ["classroom", "shop", "stairs"],
        "afterSchool": ["gymBack", "gymBack", "rooftop", "clubrooms", "gateAfter"],
    },
    2: {
        "morning": ["l2Gate", "l2Gate", "l2Courtyard", "l2Courtyard", "l2Stairs"],
        "lunch": ["l2Classroom", "l2Classroom", "l2Shop", "l2Shop", "l2Stairs"],
        "afterSchool": ["l2GymBack", "l2GymBack", "l2Rooftop", "l2Courtyard", "l2GymBack"],
    },
    3: {
        "morning": ["l3Gate", "l3Gate", "l3Courtyard", "l3Courtyard", "l3Stairs"],
        "lunch": ["l3Classroom", "l3Classroom", "l3Shop", "l3Shop", "l3Stairs"],
        "afterSchool": ["l3GymBack", "l3GymBack", "l3Rooftop", "l3Courtyard", "l3GymBack"],
    },
}

text = open(PATH, encoding="utf-8").read()
block_re = re.compile(r"(  \{\n(?:.*?\n)  \},\n)", re.DOTALL)
blocks = block_re.findall(text)

# (loop, stage) ごとに順番を数える
counters: dict[tuple[int, str], int] = {}
areas_for_block: list[str] = []
for b in blocks:
    loop = int(re.search(r"loop: (\d+)", b).group(1))
    stage = re.search(r'stage: "([^"]+)"', b).group(1)
    key = (loop, stage)
    idx = counters.get(key, 0)
    counters[key] = idx + 1

    plan = AREA_PLAN[loop][stage]
    areas_for_block.append(plan[idx % len(plan)])

counter = {"i": 0}


def repl(m: re.Match) -> str:
    b = m.group(1)
    i = counter["i"]
    counter["i"] += 1
    area = areas_for_block[i]
    if "area:" in b:
        return re.sub(r'area: "[^"]*",', f'area: "{area}",', b)
    # stage の直後に area を入れる
    return re.sub(r'(stage: "[^"]+",\n)', rf'\1    area: "{area}",\n', b, count=1)


text = block_re.sub(repl, text)
open(PATH, "w", encoding="utf-8").write(text)

from collections import Counter

print("割り当て結果:")
for (loop, stage), _ in sorted(counters.items()):
    idxs = [
        i for i, b in enumerate(blocks)
        if int(re.search(r"loop: (\d+)", b).group(1)) == loop
        and re.search(r'stage: "([^"]+)"', b).group(1) == stage
    ]
    dist = Counter(areas_for_block[i] for i in idxs)
    print(f"  loop{loop} {stage:11s} {dict(dist)}")
