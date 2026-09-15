# -*- coding: utf-8 -*-
"""
生徒45人に立ち絵を割り当て直す。

【原則】
1. 学校が違えば制服も違う。周回ごとにその学校の制服画像を使う。

2. 立ち絵は **visibleItem（見えている持ち物）だけ** で決める。
   chocolateType（チョコの種類）では決めない。
   → これを守らないと「箱を隠している絵＝本命」のような対応ができてしまい、
     観察せずに絵だけで正解が分かってしまう。
   唯一の例外は「チョコが手に丸見えの絵」で、これは実際に友チョコを持つ生徒にだけ使う
     （無実の生徒に使うと「チョコは見つからなかった」と矛盾するため）。

3. 同じ持ち物でも複数の絵を順番に使い、同じ顔が固まらないようにする。

【素材の制約】
新規の girl_006〜010（弁当箱・部活バッグ・スマホ・手ぶら・ポーチ）は
1周目の紺制服しかない。2・3周目ではその学校の5種類で代用する。
"""
import re
from collections import Counter, defaultdict

PATH = "app/src/data/students.ts"

#: 役割 → 周回ごとのファイル名。None は「その周回には無い」。
ROLE_FILES = {
    #             1周目        2周目             3周目
    "bagPink":   ("girl_001", "loop2_girl_01", "loop3_girl_01"),
    "openChoco": ("girl_002", "loop2_girl_02", "loop3_girl_02"),
    "hiding":    ("girl_003", "loop2_girl_03", "loop3_girl_03"),
    "books":     ("girl_004", "loop2_girl_04", "loop3_girl_04"),
    "satchel":   ("girl_005", "loop2_girl_05", "loop3_girl_05"),
    "lunchbox":  ("girl_006", None, None),
    "sportsBag": ("girl_007", None, None),
    "phone":     ("girl_008", None, None),
    "emptyHands":("girl_009", None, None),
    "pouch":     ("girl_010", None, None),
}

#: 2・3周目に無い役割の代役。
FALLBACK = {
    "lunchbox": "books",       # どちらも布に包んだ物を抱えている
    "sportsBag": "satchel",    # 鞄を持っている
    "pouch": "hiding",         # 小さな物を手元に隠している
    "phone": "satchel",
    "emptyHands": "satchel",
}

#: 持ち物 → 使ってよい役割（順番に回して顔を散らす）。
ITEM_ROLES = {
    "paper_bag": ["bagPink", "openChoco"],
    "decoy_bag": ["bagPink"],
    "book_case": ["books"],
    "lunch_box": ["lunchbox", "books"],
    "sports_bag": ["sportsBag", "satchel"],
    "pouch": ["pouch", "hiding"],
    # 「手ぶら」は鞄の有無で分かれる（下の choose_none_roles で判定）
    "none": ["satchel", "books", "hiding"],
}

#: 鞄すら持たないと明記されている生徒に使える役割。
NONE_EMPTY_ROLES = ["emptyHands", "phone"]


def is_explicitly_empty(hints: list[str]) -> bool:
    """ヒントが「鞄も持っていない」と明言しているか。"""
    joined = "".join(hints)
    if "一度も持たない" in joined:
        return True
    # 「手ぶら」でも、同時に鞄に言及していれば通学鞄は持っている。
    if "手ぶら" in joined and "鞄" not in joined:
        return True
    return False


text = open(PATH, encoding="utf-8").read()
block_re = re.compile(r"(  \{\n(?:.*?\n)  \},\n)", re.DOTALL)
blocks = block_re.findall(text)

# 周回ごとに、役割の使用回数を数えながら一番少ないものを選ぶ
used: dict[int, Counter] = defaultdict(Counter)
#: (周回, 役割, 無実かどうか) ごとの使用回数。絵と正解の対応ができないように散らす。
used_by_cat: dict[int, Counter] = defaultdict(Counter)
assigned: list[str] = []
compromises: list[str] = []


#: 場所ごとに使った役割。同じ画面に同じ顔が並ばないようにする。
used_in_place: dict[tuple, set] = defaultdict(set)


def pick(loop: int, candidates: list[str], is_innocent: bool, place: tuple) -> str:
    """
    候補を次の優先順で選ぶ。

    1) その場所にまだ並んでいない（同じ画面に同じ顔を出さない。最優先）
    2) その周回でまだ使われていない
    3) 同じチョコ種別にまだ使われていない
       （これが無いと「この絵はいつもチョコ持ち」という手がかりが絵だけで成立してしまう）
    """
    return min(
        candidates,
        key=lambda r: (
            1 if r in used_in_place[place] else 0,
            used[loop][r],
            used_by_cat[loop][(r, is_innocent)],
            candidates.index(r),
        ),
    )


for b in blocks:
    loop = int(re.search(r"loop: (\d+)", b).group(1))
    sid = re.search(r'id: "([^"]+)"', b).group(1)
    choco = re.search(r'chocolateType: "([^"]+)"', b).group(1)
    m = re.search(r'visibleItem: "([^"]+)"', b)
    item = m.group(1) if m else "none"
    hm = re.search(r"hints: \[(.*?)\],\n", b, re.DOTALL)
    hints = re.findall(r'"([^"]*)"', hm.group(1)) if hm else []

    if item == "none" and is_explicitly_empty(hints):
        candidates = list(NONE_EMPTY_ROLES)
    else:
        candidates = list(ITEM_ROLES[item])

    # チョコが丸見えの絵は、実際に友チョコを持っている生徒にだけ。
    if choco != "friend" and "openChoco" in candidates:
        candidates.remove("openChoco")

    stage = re.search(r'stage: "([^"]+)"', b).group(1)
    area = re.search(r'area: "([^"]+)"', b).group(1)
    place = (loop, stage, area)

    is_innocent = choco == "none"
    role = pick(loop, candidates, is_innocent, place)
    used[loop][role] += 1
    used_by_cat[loop][(role, is_innocent)] += 1
    used_in_place[place].add(role)

    file = ROLE_FILES[role][loop - 1]
    if file is None:
        fb = FALLBACK[role]
        file = ROLE_FILES[fb][loop - 1]
        if role in ("emptyHands", "phone"):
            compromises.append(
                f"  {sid}: 鞄を持たない設定だが、{loop}周目に該当する制服差分が無いため"
                f" {file} で代用"
            )
    assigned.append(file)

counter = {"i": 0}


def repl(m: re.Match) -> str:
    b = m.group(1)
    i = counter["i"]
    counter["i"] += 1
    return re.sub(r'image: "[^"]*",', f'image: "/assets/characters/{assigned[i]}.png",', b, count=1)


text = block_re.sub(repl, text)
open(PATH, "w", encoding="utf-8").write(text)

lines = ["■ 使い回しの回数"]
by_loop = defaultdict(Counter)
for b, f in zip(blocks, assigned):
    by_loop[int(re.search(r"loop: (\d+)", b).group(1))][f] += 1
for loop in (1, 2, 3):
    worst = by_loop[loop].most_common(1)[0]
    lines.append(f"  loop{loop}: {len(by_loop[loop])}種類 / 最大{worst[1]}人")
    for f, c in sorted(by_loop[loop].items()):
        lines.append(f"      {f:16s} {c}人")

# 絵から正解が漏れていないか検算
lines.append("■ 検算：同じ絵が無実にも有罪にも使われているか")
img_by_choco = defaultdict(set)
for b, f in zip(blocks, assigned):
    choco = re.search(r'chocolateType: "([^"]+)"', b).group(1)
    img_by_choco[f].add("無実" if choco == "none" else "チョコ持ち")
for f in sorted(img_by_choco):
    kinds = img_by_choco[f]
    mark = "OK（両方に使われている）" if len(kinds) > 1 else f"※{list(kinds)[0]}のみ"
    lines.append(f"      {f:16s} {mark}")

lines.append("■ 検算：同じ場所に同じ絵が並んでいないか")
place_imgs = defaultdict(list)
for b, f in zip(blocks, assigned):
    loop = int(re.search(r"loop: (\d+)", b).group(1))
    stage = re.search(r'stage: "([^"]+)"', b).group(1)
    area = re.search(r'area: "([^"]+)"', b).group(1)
    place_imgs[(loop, stage, area)].append(f)
dups = [(p, v) for p, v in place_imgs.items() if len(v) != len(set(v))]
lines.append(f"      重複のある場所: {len(dups)}件" + ("" if dups else "（問題なし）"))
for p, v in dups:
    lines.append(f"      ! {p}: {v}")

if compromises:
    lines.append("■ 素材不足による妥協")
    lines.extend(compromises)

open("scripts/_assign_report.txt", "w", encoding="utf-8").write("\n".join(lines))
print("\n".join(lines).encode("utf-8", "replace").decode("utf-8", "replace"))
