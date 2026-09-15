# バレンタイン撲滅委員会

**▶ 遊ぶ：https://kmc48.github.io/valentine-bokumetsu/**

2月14日の校内で、チョコを持ち込んだ生徒を見つけ出す観察ゲーム。
スマホの縦画面向けのブラウザゲームです。

生徒をタップして、持ち物と行動の食い違いから
「本命」「友チョコ」「無実」を見分けます。
間違えて通報すると減点されるので、**確信が持てるまで見送る**判断が要ります。

3つの学校を順に回り、周回が進むほど手がかりが減ります。

| 周回 | 学校 | テーマ | 見えるヒント |
|---|---|---|---|
| 1 | 県立 桜庭高等学校 | 探す | 3件 |
| 2 | 私立 聖蘭学院 | 見破る | 2件（囮が3割） |
| 3 | 白鷺台学園 | 推理する | 1件（囮が5割） |

---

## 動かす

```bash
cd app
npm install
npm run dev
```

`ゲームを起動する.bat` をダブルクリックしても起動します。

### 検証

```bash
cd app
npx tsc --noEmit   # 型
npx vitest run     # テスト
npm run build      # 本番ビルド
```

`main` に push すると GitHub Actions が上の3つを通してから公開します
（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）。

---

## 構成

| 場所 | 中身 |
|---|---|
| [app/src/data/](app/src/data/) | ゲームの中身（生徒45人、場所、机、スコア、BGM、素材の一覧） |
| [app/src/game/](app/src/game/) | 判定ロジック。画面に依存しないのでテストできる |
| [app/src/components/](app/src/components/) · [screens/](app/src/screens/) | 表示 |
| [app/src/store/](app/src/store/) | Zustand のストア |
| [app/src/tests/](app/src/tests/) | テスト |
| [scripts/](scripts/) | 納品された素材を加工する Python スクリプト |
| [画像素材/](画像素材/) | 画像生成AI向けの制作指示書（MDのみ） |

**内容を足すときは `app/src/data/` を触るだけで済みます。**
生徒を1人増やすなら [students.ts](app/src/data/students.ts) に1件足します。

### 設計で守っていること

- **立ち絵は「見えている持ち物」だけで決め、チョコの種類では決めない。**
  これを崩すと、絵を覚えるだけで正解が分かる（＝観察が要らない）ゲームになります。
  [characterArt.test.ts](app/src/tests/characterArt.test.ts) で固定しています。
- **生徒もモブも、大きさは同じ遠近計算から求める**（[perspective.ts](app/src/game/perspective.ts)）。
  別々に持つと、同じ校舎にいるのにモブだけ縮尺が狂います。
- **素材のパスは先頭にスラッシュを付けない。**
  GitHub Pages はサブパス配信なので、`/assets/…` だと全画像が404になります。

---

## 素材について

背景・立ち絵・UI・BGMは画像生成AIと音楽生成AIで制作し、
[scripts/](scripts/) でグリーンバック除去とトリミングをしてから組み込んでいます。

納品された生の素材（合計200MB超）はこのリポジトリには含めていません。
どんな指示で作ったかは [画像素材/](画像素材/) の制作指示書に残してあります。

未着手の素材と既知の不一致は
[app/public/assets/README.md](app/public/assets/README.md) にまとめています。
