# Android版（Google Play 用）

Webで動いているゲームを、そのまま中身ごとアプリに包んだものです（Capacitor）。
**通信なしで遊べます。**

| | |
|---|---|
| パッケージ名 | `com.kmc48.valentinebokumetsu` |
| 対応Android | 7.0 以上（minSdk 24） |
| 画面 | 縦持ち固定 |
| AABの大きさ | 約25MB |

---

## セリフや素材を直したあとの手順

**中身をアプリに同梱しているので、文言を1文字変えただけでも再ビルドが要ります。**

### 1. バージョンを上げる

`app/build.gradle` の2行を編集します。**ここを上げ忘れるとPlayが受け付けません。**

```gradle
versionCode 1        // 半角数字。アップロードのたびに必ず +1
versionName "1.0"    // 利用者に見える表記。1.0.1 など好きに
```

### 2. ビルド

プロジェクト直下（`app/`）で1行です。

```bash
npm run android:release
```

中で `vite build` → `cap sync` → `gradlew bundleRelease` を順に流しています。

### 3. できあがり

```
app/android/app/build/outputs/bundle/release/app-release.aab
```

これを Play Console の「製品版」→「新しいリリースを作成」からアップロードします。

---

## 署名について

`keystore.properties` と `upload-keystore.jks` が署名情報です。
**どちらもGitに入れていません**（`.gitignore` で除外済み）。

- **この2つのファイルは必ず別の場所にも控えを取ってください。**
- 失うと、同じ鍵でのアプリ更新ができなくなります。
- ただし Play App Signing を使っていれば、アップロード鍵はGoogleに申請して再発行できます。

新しい端末で作業するときは、この2ファイルを `app/android/` に置けばそのままビルドできます。

---

## 初回だけ必要な設定

### local.properties

Android SDK の場所を書いたファイルです。端末ごとに違うのでGitに入れていません。

```properties
sdk.dir=C:\\Users\\<ユーザー名>\\AppData\\Local\\Android\\Sdk
```

※ バックスラッシュは2つ重ねます。

### プロジェクトのパスについて

このプロジェクトはパスに日本語（`バレンタイン撲滅委員会`）を含みます。
Android のビルドツールはこれを警告して止めるので、
`gradle.properties` に次の1行を入れて明示的に許可しています。

```properties
android.overridePathCheck=true
```

いまのところ問題なくビルドできていますが、
将来ビルドツールを上げたときに不可解なエラーが出たら、
**まずプロジェクトを英数字だけのパスに移して試してください。**

---

## ビルドが止まったとき

### 「Cannot snapshot ... not a regular file」

このプロジェクトは OneDrive の中にあります。
同期の都合で、`android/app/src/main/assets/public/` に残った古いファイルが
実体を持たない状態になり、Gradle が読めなくなることがあります。

同期先を作り直せば直ります。

```bash
rm -rf android/app/src/main/assets/public
npx cap sync android
```

### 「'gradlew.bat' は認識されていません」

この環境の cmd は、実行ファイルを現在のディレクトリから探しません。
`npm run android:release` では `.\gradlew.bat` と書いて回避しています。
手で叩くときも `.\gradlew.bat` または Git Bash で `./gradlew` としてください。

---

## 動作確認

### 実機で試す

```bash
npm run android:debug   # デバッグAPKを作る
```

できた `app/android/app/build/outputs/apk/debug/app-debug.apk` を端末に入れます。

### Android Studio で開く

```bash
npx cap open android
```

---

## Webだけ直したいとき

Play版とは別に、ブラウザ版は `main` へpushすれば
数分で https://kmc48.github.io/valentine-bokumetsu/ に反映されます。
Play版はそれとは独立しているので、**両方に反映したいときは push とアプリの再ビルドの両方**が要ります。
