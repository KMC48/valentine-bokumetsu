/**
 * 文章の末尾の数文字を改行させない。
 *
 * 日本語はどこでも改行できるので、画面幅しだいで「ぞ……。」のように
 * 1文字だけの最終行ができる。末尾の文字の間に「改行禁止」の見えない文字
 * （U+2060 WORD JOINER）を挟み、最後の行に最低 `count` 文字が残るようにする。
 *
 * 句読点・記号は数に入れない（「ぞ……。」は1文字と数える）。
 */
const JOINER = "⁠";
const PUNCTUATION = /[。、．，！？!?…・「」『』（）()\s]/;

export function keepTail(text: string, count = 4): string {
  const chars = [...text];
  let letters = 0;
  let start = chars.length;
  while (start > 0 && letters < count) {
    start -= 1;
    if (!PUNCTUATION.test(chars[start]!)) letters += 1;
  }
  // 文全体がその文字数以下なら、そもそも1文字だけの行はできないのでそのまま。
  if (start === 0 || start >= chars.length - 1) return text;
  return chars.slice(0, start).join("") + chars.slice(start).join(JOINER);
}
