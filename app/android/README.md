# Android版（Google Play 用）

Web版と同じ `app/src/` と `app/public/` をproductionビルドし、CapacitorでAndroidに同梱します。
Webの更新だけではインストール済みAndroidアプリは更新されません。変更後は再ビルド・再提出が必要です。

| 設定 | 現行値 |
|---|---|
| パッケージ名 | `com.kmc48.valentinebokumetsu` |
| 対応Android | 7.0以上（minSdk 24） |
| compileSdk / targetSdk | 36 / 36 |
| versionCode / versionName | **5 / 1.0.4**（`app/android/app/build.gradle`が正本） |
| 画面 | 縦持ち固定 |

## 必要な環境

- Node.js 22以上、npm（依存関係は`npm ci`でlockfileどおりにインストール）
- JDK **21**。`java -version`と`JAVA_HOME`を確認
- Android SDK Platform 36、Build Tools 35.0.0、SDKライセンスへの同意
- Python 3（標準ライブラリだけでAAB内部を検証）。Windowsは`python`、macOS/Linuxは`python3`で起動可能にする
- Git

Gradle 8.14.3とAndroid Gradle Plugin 8.13.0はプロジェクトの設定を使用します。
初回はGradle・Maven依存関係を取得できるネットワークが必要です。
SDKは`ANDROID_HOME`、またはGit管理外の`app/android/local.properties`で指定します。

```properties
sdk.dir=C:\\Users\\<ユーザー名>\\AppData\\Local\\Android\\Sdk
```

以降、特記しないコマンドはリポジトリの **`app/` ディレクトリ**で実行します。
Windows・macOS・Linuxとも同じnpmコマンドを使えます。

## 公開用・署名済みAABを作る

### 1. ソースとバージョンを確認

```bash
git switch main
git pull --ff-only
git rev-parse HEAD
npm ci
```

`app/android/app/build.gradle`（`app/`からは`android/app/build.gradle`）の現行値は以下です。

```gradle
versionCode 5
versionName "1.0.4"
```

**次に使うversionCodeは、Play Consoleに過去アップロードした最大値より大きくします。**
5が未使用なら現在の5を使えます。5が使用済みなら6以上に上げてください。
ローカルで検証し直すだけなら毎回上げる必要はありません。versionNameは利用者向けの表記です。

### 2. ローカルの署名設定を用意

既存のアップロード鍵と`keystore.properties`を **`app/android/`** に置きます。
新しい鍵への置き換えは行わず、Play Consoleに登録した鍵を使ってください。
`storeFile`は`app/android/`からの相対パス、または絶対パスです。

```properties
storeFile=upload-keystore.jks
storePassword=<ローカルのパスワード>
keyAlias=<既存の鍵のエイリアス>
keyPassword=<ローカルのパスワード>
```

これらは`.gitignore`の対象です。**鍵・パスワード・署名設定はGitHubにもGitHub Secretsにも登録しません。**
安全な別の場所にもバックアップしてください。ログや画面共有にもパスワードを載せないでください。

### 3. ビルド・検証

```bash
npm run android:release
```

次を順番に実行し、1つでも失敗したら停止します。

1. 署名設定の存在確認
2. 既存テストと素材の実体検査
3. 型チェックとproductionビルド（`npm run build`）
4. 現行ストーリー・エンディング全台詞、一ノ瀬の専用画像参照を生成JSで検証
5. `cap sync android`
6. `public → dist → Android`のファイル一覧・SHA-256照合
7. `:app:bundleRelease`とAAB内部の全Webファイル・Capacitor設定照合
8. 署名エントリーの存在確認と`jarsigner -verify`

出力先：

- AAB：`app/android/app/build/outputs/bundle/release/app-release.aab`
- 検証記録：`app/android/build/content-verification.json`（ソースcommit、Gradleの版数、各ファイルのハッシュ、AABハッシュ）

検証記録の版数はGradleから読んだ値です。AABのコンパイル済みManifestの版数を独立に読み取る検証は行いません。
`jarsigner`は署名の整合性を調べますが、Play Consoleに登録されたアップロード鍵との一致までは確認しません。
登録証明書との照合と、Play Consoleに表示されるパッケージ名・版数の確認は提出時に行ってください。

## 鍵を使わずに検証する／CI

```bash
npm ci
npm run test:packaging
npm run android:unsigned
```

公開用と同じビルド・同梱検証を実行し、Gradleに`-PunsignedRelease=true`を渡します。
このモードではローカルに署名設定があっても読み込みません。**生成物は未署名なのでGoogle Playに提出できません。**
公開用と未署名用のAAB出力先は同じです。提出するときは最後に`android:release`を成功させてください。
直接Gradleでreleaseを作る場合も、鍵がなければ明示的な`-PunsignedRelease=true`指定が必要です。

`.github/workflows/android.yml`はmainへのpush・PR・手動実行で次を自動確認します。
型チェック、テスト、全台詞検証、Capacitor同期、未署名release AAB生成、AAB内部照合。
成功時は未署名AABと検証記録を7日間のActions成果物として保存します。署名鍵は使いません。
Web公開ワークフローとは独立したチェックです。

## 部分的に検証する

```bash
npm run android:prepare     # SDK不要：テスト・型・Webビルド・同梱コピーまで
npm run verify:web         # 直前に生成したdistの台詞・一ノ瀬参照を確認
npm run test:packaging     # 欠落・改変・古いファイル・署名モードの検知テスト
npm run android:verify-aab # 現在のdist/同期結果と標準出力先のAABを照合
```

別のAABは`npm run android:verify-aab -- "絶対パス/対象.aab"`で指定できます。
この照合だけではビルドをやり直しません。必ず意図したソースで`android:prepare`を先に成功させてください。

## 端末で確認・Playへ提出

```bash
npm run android:debug
npm run android:open
```

デバッグAPKは`app/android/app/build/outputs/apk/debug/app-debug.apk`です。
署名済みAABはまずPlay Consoleの内部テストなどで、配信されるアプリを確認します。

- オフライン起動、BGM・効果音、セーブ、画面遷移
- 3周目・昼の一ノ瀬ひかるの通常画像と選択時の振り向き画像
- 3周目・昼前ストーリーの一ノ瀬のバストアップと最新台詞
- 3周分の背景・生徒・エンディング・ゲーム内素材
- パッケージ名、versionCode / versionName、アップロード鍵証明書

自動照合の成功だけでは、Android端末の描画・操作・音声再生やPlay審査通過を保証しません。

## ビルドが止まったとき

- Javaのバージョンエラー：JDK21と`JAVA_HOME`を確認します。
- Gradle取得失敗：ネットワーク・プロキシとGradle/Mavenへの接続を確認します。
- `Cannot snapshot ... not a regular file`：OneDrive等の同期を完了し、`npm run android:prepare`を再実行します。
- 古いファイルの混入が報告された場合：生成先`android/app/src/main/assets/public/`を削除し、`npm run android:prepare`で作り直します。元の`public/`は削除しません。
- WindowsでGradleを直接起動する場合は`.\gradlew.bat`、macOS/Linuxでは`sh ./gradlew`を使います。npmコマンドはOSを自動判別します。
- 日本語パスの警告には`android.overridePathCheck=true`を設定済みです。問題が続く場合は英数字のパスに移してください。

## Web版との対応

mainへのpushはWeb版を更新します。Androidの既存配信版は変更されません。
同じcommitを用いて再ビルドしたAABを提出して、両方の内容を揃えます。
この検証はリポジトリから新たに作る成果物を対象にし、過去に手元で作ったAABや既存のPlay配信版は読み取っていません。
