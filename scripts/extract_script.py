# -*- coding: utf-8 -*-
"""stories.ts と endings.ts から台本データを抽出し、JSONへ書き出す。"""
import json
import re

STR_RE = r'"((?:[^"\\]|\\.)*)"'


def parse_scenes(path, block_key):
    text = open(path, encoding="utf-8").read()
    # 各シーン/エンディングの { id: "...", ... lines: [ {...}, {...} ] }, ブロックを抽出。
    scene_re = re.compile(r"  \{\n    id: " + STR_RE + r",\n(.*?)\n  \},\n", re.DOTALL)
    line_re = re.compile(
        r"\{ speaker: " + STR_RE + r", text: " + STR_RE + r"( ?)\}"
    )

    scenes = []
    for sm in scene_re.finditer(text):
        sid = sm.group(1)
        body = sm.group(2)

        def field(name):
            m = re.search(name + r": " + STR_RE, body)
            return m.group(1) if m else None

        loop_m = re.search(r"loop: (\d+)", body)
        slot_m = re.search(r'slot: "([^"]+)"', body)
        rank_m = re.search(r'rank: "([^"]+)"', body)

        lines_m = re.search(r"lines: \[(.*?)\n    \],", body, re.DOTALL)
        lines = []
        if lines_m:
            for lm in line_re.finditer(lines_m.group(1)):
                lines.append({"speaker": lm.group(1), "text": lm.group(2)})

        scenes.append(
            {
                "id": sid,
                "loop": int(loop_m.group(1)) if loop_m else None,
                "slot": slot_m.group(1) if slot_m else None,
                "rank": rank_m.group(1) if rank_m else None,
                "title": field("title"),
                "lines": lines,
            }
        )
    return scenes


stories = parse_scenes("app/src/data/stories.ts", "SCENES")
endings = parse_scenes("app/src/data/endings.ts", "ENDINGS")

print("stories:", len(stories), "endings:", len(endings))
for s in stories:
    print(" ", s["id"], s["loop"], s["slot"], len(s["lines"]), "lines")
for e in endings:
    print(" ", e["id"], e["rank"], e["title"], len(e["lines"]), "lines")

json.dump(
    {"stories": stories, "endings": endings},
    open("scripts/_script_extracted.json", "w", encoding="utf-8"),
    ensure_ascii=False,
    indent=2,
)
