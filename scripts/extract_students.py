# -*- coding: utf-8 -*-
"""students.ts から観察メモ用データを抽出し、JSONとして書き出す。"""
import json
import re

SRC = "app/src/data/students.ts"
OUT = "scripts/_students_extracted.json"

text = open(SRC, encoding="utf-8").read()
block_re = re.compile(r"  \{\n((?:.*?\n))  \},\n", re.DOTALL)

STR_RE = r'"((?:[^"\\]|\\.)*)"'


def get_str(field, block):
    m = re.search(field + r': ' + STR_RE, block)
    return m.group(1) if m else None


def get_list(field, block):
    m = re.search(field + r": \[(.*?)\],\n", block, re.DOTALL)
    if not m:
        return []
    return re.findall(STR_RE, m.group(1))


def get_num(field, block):
    m = re.search(field + r": (-?\d+)", block)
    return int(m.group(1)) if m else None


def get_pos(block):
    m = re.search(r"position: \{ x: (-?\d+), y: (-?\d+) \}", block)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


rows = []
for m in block_re.finditer(text):
    b = m.group(1)
    x, y = get_pos(b)
    rows.append(
        {
            "id": get_str("id", b),
            "name": get_str("name", b),
            "chocolateType": get_str("chocolateType", b),
            "loop": get_num("loop", b),
            "stage": get_str("stage", b),
            "x": x,
            "y": y,
            "suspicion": get_num("suspicionLevel", b),
            "item": get_str("visibleItem", b),
            "isDecoy": "isDecoy: true" in b,
            "hints": get_list("hints", b),
            "dialogue": get_list("dialogue", b),
            "behavior": get_list("behavior", b),
            "result": get_str("reportResultText", b),
        }
    )

print(len(rows), "rows parsed")
json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
