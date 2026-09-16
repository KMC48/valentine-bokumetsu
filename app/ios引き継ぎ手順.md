# iOS版のビルド手順（Mac側で作業する人へ）

作成日：2026-09-17

このゲームは React + Vite で作った**Webアプリ**です。
それを Capacitor で包んで、iPhone アプリとして出します。
Android版はすでに Windows 側で動いています。**iOS版だけが未着手です。**

**Webの中身をアプリに同梱するので、通信なしで遊べます。**

---

## Mac側に必要なもの

| | 備考 |
|---|---|
| macOS | Xcode が動くバージョン |
| **Xcode 16 以降** | App Store は新しいSDKでのビルドを要求します。App Store から入れてください |
| **CocoaPods** | `sudo gem install cocoapods` または `brew install cocoapods` |
| **Node.js 20 以降** | 22 で動作確認しています |
| **Apple Developer Program** | 年 $99。これが無いと実機にも入れられません |

Xcode を入れたら、一度起動してライセンスに同意し、コマンドラインツールを入れてください。

```bash
sudo xcode-select --install
sudo xcodebuild -license accept
```

---

## 手順

### 1. 取ってくる

```bash
git clone https://github.com/KMC48/valentine-bokumetsu.git
cd valentine-bokumetsu/app
npm ci
```

> **フォルダ名について**
> リポジトリ名は英数字ですが、Windows側では `バレンタイン撲滅委員会` という
> 日本語フォルダの中で作業しています。
> **Android では日本語パスが原因でビルドが止まりました**（回避策を入れてあります）。
> Mac では通常問題になりませんが、もし不可解なエラーが出たら
> **英数字だけのパスに置いて試してください。**

### 2. Webをビルドする

```bash
npm run build
```

`app/dist/` ができます。**これがアプリの中身になります。**

### 3. iOSプロジェクトを作る

```bash
npx cap add ios
```

`app/ios/` に Xcode プロジェクトができ、`pod install` まで走ります。
（`@capacitor/ios` は `package.json` に入れてあるので、追加インストールは不要です）

### 4. 中身を同期する

```bash
npx cap sync ios
```

**Webを直したら、毎回 `npm run build` → `npx cap sync ios` が必要です。**

### 5. Xcode で開く

```bash
npx cap open ios
```

---

## Xcode で設定すること

`App` ターゲットを選んで、以下を確認してください。

### Signing & Capabilities

- **Team**：自分の Apple Developer アカウントを選ぶ
- **Bundle Identifier**：`com.kmc48.valentinebokumetsu`
  （Androidと同じです。App Store Connect でも同じIDでアプリを作ります）
- Automatically manage signing にチェック

### General → Identity

- **Display Name**：`バレンタイン撲滅委員会`
- **Version**：`1.0.1`（Android版と合わせています）
- **Build**：`2`（アップロードのたびに +1。ここを上げ忘れると弾かれます）

### General → Deployment Info

- **iPhone のみ**にする（iPad は対象外）
  Supported Destinations から iPad を外してください
- **Device Orientation**：**Portrait だけにチェック**
  Landscape Left / Right / Upside Down は外す

> **縦持ち固定は必須です。**
> このゲームは縦画面で作ってあり、横にすると画面が崩れます。
> Android 側も `screenOrientation="portrait"` で固定しています。

### アプリアイコン

`ストア掲載用/iOS/アプリアイコン_1024.png`（1024×1024）を使います。

1. Xcode 左のツリーから `App` → `Assets.xcassets` → `AppIcon` を開く
2. 1024×1024 の枠にこのPNGをドラッグする

> **透過は入れないでください。** App Store は透過のあるアイコンを弾きます。
> 用意してあるファイルは透過なし（RGB）で書き出してあります。
> 角丸もOS側で付くので、四角のままで正しいです。

---

## Info.plist に足すもの

`App/App/Info.plist` を開いて、次の2つを足してください。

### 1. 暗号化の申告

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

これを入れておくと、**アップロードのたびに聞かれる輸出コンプライアンスの質問を省けます。**
このアプリは通信も暗号化もしていないので `false` で正しいです。

### 2. アプリ名（日本語）

```xml
<key>CFBundleDisplayName</key>
<string>バレンタイン撲滅委員会</string>
```

---

## プライバシーマニフェスト

Apple は 2024年から、`UserDefaults` などの
「理由の申告が必要なAPI」を使うアプリに宣言ファイルを求めています。
Capacitor は内部で `UserDefaults` を使うので、**用意が必要です。**

Xcode で `File > New > File` → `App Privacy` を選び、
`App/App/PrivacyInfo.xcprivacy` として作ってから、中身を以下にしてください。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

- `NSPrivacyTracking` は `false`（広告も追跡もありません）
- `NSPrivacyCollectedDataTypes` は空（**利用者のデータを一切集めていません**）
- `CA92.1` は「自分のアプリの中だけで使う」という理由コードです

---

## アップロードする

1. Xcode 上部のデバイス選択で **Any iOS Device (arm64)** を選ぶ
2. メニューの **Product → Archive**
3. 終わったら Organizer が開くので **Distribute App → App Store Connect → Upload**

App Store Connect 側では、先に同じ Bundle ID でアプリを作っておいてください。

---

## 掲載に使うもの（用意済み）

| | 場所 |
|---|---|
| アプリアイコン 1024×1024 | `ストア掲載用/iOS/アプリアイコン_1024.png` |
| スクリーンショット 6.7インチ（1290×2796）8点 | `ストア掲載用/iOS/スクリーンショット_6.7インチ/` |
| 説明文・カテゴリ・年齢制限の下書き | `ストア掲載用/README.md` |

> **スクリーンショットの大きさについて**
> このゲームは論理 430×932 で作ってあり、これは **iPhone 6.7インチと同じ**です。
> そのため3倍で撮ると 1290×2796 ちょうどになり、App Store の要求サイズに一致します。
> 撮り直したい場合は、Windows側の `capture.mjs` を
> `deviceScaleFactor:3` にして流せば同じものが出ます。

### App Store の審査で聞かれること

`ストア掲載用/README.md` の内容がそのまま使えます。要点だけ。

- **年齢制限**：4+（暴力・性的表現・課金・広告いずれも無し）
- **データ収集**：**なし**。通信機能を持ちません
- **プライバシーポリシーのURL**：Apple は必須です。**まだ用意していません**
- **サードパーティのコンテンツ**：なし

---

## Webを直したときの流れ

セリフや画像を直したら、**3つとも別々に更新が要ります。**

| | 手順 | 反映まで |
|---|---|---|
| ブラウザ版 | `git push` | 数分（GitHub Actions） |
| Android版 | `versionCode` +1 → `npm run android:release` → Play にアップロード | 審査あり |
| **iOS版** | **Build** +1 → `npm run build` → `npx cap sync ios` → Archive → Upload | 審査あり |

---

## できたら共有してほしいもの

Windows側でも状態を追えるように、次のものをコミットして push してください。

```bash
git add app/ios
git commit -m "iOSプロジェクトを追加"
git push
```

`ios/App/Pods/` などは Capacitor が用意する `.gitignore` で自動的に除外されます。
**署名の証明書や秘密鍵はコミットしないでください。**

---

## 詰まりそうなところ

| 症状 | 対処 |
|---|---|
| `pod install` が失敗する | `cd ios/App && pod repo update && pod install` |
| 画面が真っ白 | `npm run build` を忘れていないか。`app/dist/index.html` があるか確認 |
| 画像が出ない | 素材のパスは先頭にスラッシュを付けていません（`assets/…`）。ここを絶対パスに直すと壊れます |
| 横向きになる | Deployment Info の Portrait 以外のチェックを外す |
| アイコンが弾かれる | 透過が入っていないか確認。用意したPNGは透過なしです |
