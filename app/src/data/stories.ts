/**
 * ストーリー（ADV）データ。
 * slot が "opening" → 朝ステージ前、"interlude1" → 昼前、"interlude2" → 放課後前。
 * background / character に画像パスを入れれば差し替わる。
 */

import type { LoopId, StoryScene } from "../types/game";

const SCENES: StoryScene[] = [
  // ================= 1周目 =================
  {
    id: "l1-opening",
    loop: 1,
    slot: "opening",
    title: "2月14日、午前7時40分",
    lines: [
      { speaker: "", text: "――県立桜庭高等学校、校則第12条。" },
      { speaker: "", text: "「学校への菓子類の持ち込みを禁ずる」" },
      { speaker: "俺", text: "明文化されている。議論の余地はない。" },
      { speaker: "俺", text: "だが毎年、2月14日だけはこの条文が死ぬ。" },
      { speaker: "俺", text: "女子生徒たちは平然と、紙袋にチョコを詰めて登校してくる。" },
      { speaker: "俺", text: "……誰も何も言わない。おかしいだろう。" },
      { speaker: "俺", text: "俺は嫉妬しているわけではない。断じて違う。" },
      { speaker: "俺", text: "ただ、校則違反を取り締まっているだけだ。" },
      { speaker: "俺", text: "今日から名乗らせてもらう。" },
      { speaker: "俺", text: "――バレンタイン撲滅委員会。活動を開始する。" },
      { speaker: "生徒指導・鬼頭", text: "おい。その腕章、誰が許可した。" },
      { speaker: "俺", text: "先生。校則違反を見つけたら、報告すればいいんですね？" },
      { speaker: "生徒指導・鬼頭", text: "……まあ、事実なら対応はする。事実ならな。" },
      { speaker: "俺", text: "十分です。それだけ聞ければいい。" },
    ],
  },
  {
    id: "l1-interlude1",
    loop: 1,
    slot: "interlude1",
    title: "昼休み、12時25分",
    lines: [
      { speaker: "俺", text: "朝の巡回で分かったことがある。" },
      { speaker: "俺", text: "奴らは隠す気がない。紙袋を堂々と提げている。" },
      { speaker: "俺", text: "だが昼は違う。教室に入れば、机の下という死角が生まれる。" },
      { speaker: "生徒指導・鬼頭", text: "おい委員会。朝から何件持ってきた。" },
      { speaker: "俺", text: "報告した分だけです。虚偽はありません。" },
      { speaker: "生徒指導・鬼頭", text: "……ほどほどにしろよ。恨まれるぞ。" },
      { speaker: "俺", text: "恨まれるのは、校則を破った側であるべきです。" },
    ],
  },
  {
    id: "l1-interlude2",
    loop: 1,
    slot: "interlude2",
    title: "放課後、15時50分",
    lines: [
      { speaker: "俺", text: "放課後。ここからが本番だ。" },
      { speaker: "俺", text: "友チョコは昼までに片付く。だが本命は違う。" },
      { speaker: "俺", text: "本命チョコは、人目のない場所と時間を選ぶ。" },
      { speaker: "俺", text: "体育館裏。屋上前。部室棟。" },
      { speaker: "俺", text: "……そして、渡す直前が最も無防備だ。" },
      { speaker: "俺", text: "俺は嫉妬しているわけではない。断じて違う。" },
      { speaker: "俺", text: "ただ、校則違反を取り締まっているだけだ。" },
    ],
  },

  // ================= 2周目 =================
  {
    id: "l2-opening",
    loop: 2,
    slot: "opening",
    title: "私立聖蘭学院、2月14日",
    lines: [
      { speaker: "", text: "――前の学校での実績が、妙な形で評価された。" },
      { speaker: "俺", text: "転校先は私立聖蘭学院。偏差値の高い進学校だ。" },
      { speaker: "俺", text: "……だが、校門を見て確信した。ここは前の学校より厄介だ。" },
      { speaker: "俺", text: "紙袋を持った生徒が、一人もいない。" },
      { speaker: "俺", text: "いや違う。持っていないんじゃない。" },
      { speaker: "俺", text: "頭がいい奴らは、隠し方も上手いというだけだ。" },
      { speaker: "俺", text: "教科書ケース。弁当箱。友人への預け合い。囮の紙袋。" },
      { speaker: "俺", text: "見た目では判断できない。行動を見るしかない。" },
      { speaker: "俺", text: "――バレンタイン撲滅委員会、第二次活動を開始する。" },
    ],
  },
  {
    id: "l2-interlude1",
    loop: 2,
    slot: "interlude1",
    title: "昼休み",
    lines: [
      { speaker: "俺", text: "朝の時点で気づいた。この学校には運び屋がいる。" },
      { speaker: "俺", text: "自分では持たず、他人に持たせる。捕まっても証拠が出ない。" },
      { speaker: "俺", text: "昼休みは受け渡しの時間だ。動きを追え。" },
      { speaker: "謎の女子生徒", text: "ねえ、委員会くん。楽しい？" },
      { speaker: "俺", text: "……誰だ。" },
      { speaker: "謎の女子生徒", text: "さあ。放課後になれば分かるんじゃない？" },
    ],
  },
  {
    id: "l2-interlude2",
    loop: 2,
    slot: "interlude2",
    title: "放課後",
    lines: [
      { speaker: "俺", text: "昼までに分かったことを整理する。" },
      { speaker: "俺", text: "一、見た目の持ち物は当てにならない。" },
      { speaker: "俺", text: "二、囮が必ず混ざっている。" },
      { speaker: "俺", text: "三、本命を持つ奴は、必ず時間を気にする。" },
      { speaker: "俺", text: "……あとは、それを証明するだけだ。" },
    ],
  },

  // ================= 3周目 =================
  {
    id: "l3-opening",
    loop: 3,
    slot: "opening",
    title: "白鷺台学園、2月14日",
    lines: [
      { speaker: "", text: "――最後の学校は、想像を超えていた。" },
      { speaker: "俺", text: "白鷺台学園。この国の上澄みが集まる場所。" },
      { speaker: "俺", text: "校門を抜けて、五分で理解した。" },
      { speaker: "俺", text: "この学校の女子生徒は、当日にチョコを持ち歩かない。" },
      { speaker: "俺", text: "前日のうちにロッカーへ入れる。第三者を経由させる。" },
      { speaker: "俺", text: "偽の呼び出しで俺を誘導し、その隙に受け渡しを済ませる。" },
      { speaker: "俺", text: "男子生徒まで見張りに立っている。組織的だ。" },
      { speaker: "俺", text: "見えるものは何一つ証拠にならない。" },
      { speaker: "俺", text: "……上等だ。ならば、行動から逆算して推理するまでだ。" },
      { speaker: "俺", text: "――バレンタイン撲滅委員会、最終活動を開始する。" },
    ],
  },
  {
    id: "l3-interlude1",
    loop: 3,
    slot: "interlude1",
    title: "昼休み",
    lines: [
      { speaker: "俺", text: "朝の時点で、俺は三度誘導された。" },
      { speaker: "俺", text: "偽の情報、偽の紙袋、偽の呼び出し。" },
      { speaker: "生徒会長・一ノ瀬", text: "委員会の活動、盛況ですね。" },
      { speaker: "俺", text: "……あんたが裏で回してるのか。" },
      { speaker: "生徒会長・一ノ瀬", text: "まさか。私は校則を守る側ですよ。合法的にね。" },
      { speaker: "俺", text: "その言い方が一番信用できない。" },
    ],
  },
  {
    id: "l3-interlude2",
    loop: 3,
    slot: "interlude2",
    title: "放課後",
    lines: [
      { speaker: "俺", text: "残るは放課後だけだ。" },
      { speaker: "俺", text: "この学校の本命は、三日前から準備を始めている。" },
      { speaker: "俺", text: "鍵の当番、手紙の経路、見張りの配置。" },
      { speaker: "俺", text: "全部が繋がったとき、答えが一つに絞られる。" },
      { speaker: "俺", text: "……ここまで来て、一つだけ分からないことがある。" },
      { speaker: "俺", text: "俺はなぜ、こんなに必死なんだろうな。" },
    ],
  },
];

/** 指定の周回・スロットのシーンを返す。無ければ undefined。 */
export function getStory(loop: LoopId, slot: StoryScene["slot"]): StoryScene | undefined {
  return SCENES.find((s) => s.loop === loop && s.slot === slot);
}

export const STORIES = SCENES;
