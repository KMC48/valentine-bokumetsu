# プライバシーポリシー修正・ストア申告案

確認日：2026年11月2日（日本時間）  
対象：バレンタイン撲滅委員会／KMC Creative Lab（ロベルトKMC）  
基準：`main` の `427e09e68256cb72330ae7b8f7eb654993fdf502`  
作業ブランチ：`codex/privacy-policy-alignment-20261102`

**承認待ちの変更案。ストアへの申告・申請、mainへの統合、公開は行っていない。** ポリシー本文は [app/public/privacy.html](../app/public/privacy.html)。ゲームソース・設定画面・保存キー・ネイティブ設定・依存関係・画像は変更していない。PR #2の21変更ファイルとも重複しない。

## 1. 保存・消去の実装との対応

根拠：[saveStore.ts](../app/src/store/saveStore.ts)、[SaveData](../app/src/types/game.ts)、[SettingsScreen.tsx](../app/src/screens/SettingsScreen.tsx)、[gameStore.ts](../app/src/store/gameStore.ts)。

| 保存項目 | 保存フィールド | 用途 | 「セーブデータを消去」実行後 |
| --- | --- | --- | --- |
| 解放済みの周回 | `unlockedLoop` | 選べる学校・周回の上限 | `1`（1周目のみ） |
| 周回別の最高得点 | `bestScores` | `loop1`～`loop3`の最高得点 | 空のオブジェクト |
| 到達済みエンディング | `endings` | 到達記録 | 空の配列 |
| BGM・SE音量 | `settings.bgmVolume` / `seVolume` | 音量値の保持 | `0.6` / `0.8` |
| セリフの文字サイズ | `settings.textSize` | 読みやすさの保持 | 消去直前の値を維持 |

- Zustand `persist` の保存先はWebView／ブラウザの`localStorage`、キーは`valentine-annihilation-save-v1`。JSONの`state`とミドルウェアの`version: 0`を保存する。個人ID等は付与していない。
- `resetSave()`はキー削除や`localStorage.clear()`ではない。初期化後の値を同じキーに書き戻す。他のサイトデータは消去しない。
- 設定画面の確認ダイアログでキャンセルした場合は`resetSave()`を呼ばない。表示文言・条件・ハンドラーは変更していない。
- SE音量は保存されるが、現在はSE素材がなく、設定画面のSE音量操作も非表示。「SEを調整できる」とは案内しない。
- 現在プレイ中の場面・残り時間・デバッグ状態等は`gameStore`のメモリ上の状態。中断位置の再開機能や独自クラウド同期はない。「続きから遊べる」という旧ポリシーの表現を修正した。
- 旧セーブには`mergeSave()`が文字サイズの初期値を補う。互換処理も変更していない。

## 2. Android・iOS・Webの差異

| 項目 | Android | iOS | Web（GitHub Pages） |
| --- | --- | --- | --- |
| ゲームの保存処理 | 共通の`saveStore.ts` | 同左 | 同左 |
| 保存場所 | Android WebViewのlocalStorage | WKWebViewのlocalStorage | 閲覧ブラウザのlocalStorage |
| 画像・音声・JS等 | `dist`をアプリへ同梱 | `dist`をアプリへ同梱 | 配信サーバーから取得 |
| ゲーム記録の開発者への送信 | 該当処理なし | 該当処理なし | 該当処理なし |
| OS等のバックアップ | `allowBackup="true"`。実データの対象範囲は未実証 | 端末バックアップ・移行に含まれる可能性。対象範囲は未実証 | ブラウザ・端末の移行／バックアップ方式次第 |
| 保存領域の削除方法 | OSのストレージ／データ消去、またはアンインストール | 「Appを削除」。「Appを取り除く」はデータを保持 | 配信サイトのサイトデータ削除 |
| Web配信のアクセス記録 | 通常プレイではGitHub Pagesを読み込まない | 同左 | GitHubがセキュリティ目的でIPを記録 |

### コード・依存関係で確認した範囲

- [capacitor.config.ts](../app/capacitor.config.ts)：`webDir: "dist"`。外部ページを読み込む`server.url`はない。`androidScheme: "https"`は端末内配信のスキームであり、外部通信の証拠ではない。
- [audioEngine.ts](../app/src/game/audioEngine.ts)の`fetch()`は[bgm.ts](../app/src/data/bgm.ts)から組み立てる同梱BGMへの相対パス。画像も[assets.ts](../app/src/data/assets.ts)のローカル相対パス。Web版では同じ資産を配信元から取得する。
- `app/src`、`app/index.html`、CSS、Capacitor設定、ネイティブ起動コード、`package.json`とlockfileを確認。広告・解析・独自バックエンドへの送信処理、外部フォント取得、外部SDKの初期化は見つからない。依存関係はReact、Zustand、Capacitor等。新機能の追加はしていない。
- Android：[Manifest](../app/android/app/src/main/AndroidManifest.xml)には`INTERNET`権限があるが、権限があること自体は収集を意味しない。独自`backupAgent`、`fullBackupContent`、`dataExtractionRules`指定・除外ルールはない。インストール済みのCapacitor Android 8.5.2でも追加のバックアップルールはなく、DOM Storageが有効。Gradle中のGoogle Servicesはテンプレートの条件分岐であり、該当JSONや収集SDKの導入を示すものではない。
- iOS：[AppDelegate](../app/ios/App/App/AppDelegate.swift)、[SceneDelegate](../app/ios/App/App/SceneDelegate.swift)、[SPM](../app/ios/App/CapApp-SPM/Package.swift)、Info.plist、プロジェクト設定を確認。独自のCloudKit／iCloud同期・保存領域のバックアップ除外処理はない。Capacitorの標準WKWebView設定を使用している。
- [PrivacyInfo.xcprivacy](../app/ios/App/App/PrivacyInfo.xcprivacy)は追跡なし、収集データ型なし、UserDefaultsの理由`CA92.1`。これはApp Privacyの回答とは別の申告であり、マニフェストだけで収集の有無を判定していない。今回は変更しない。
- ゲームが書き込む5項目と、WebView／Capacitor／OSが内部管理するキャッシュ・設定ファイルは区別する。

### バックアップについて確定していない点

`allowBackup=true`だけでは、特定端末のWebView localStorageが実際にバックアップされるとは確定できない。AndroidのOS・WebView・メーカー・バックアップ転送先・サイズ制限、iOSのOS・保存先・バックアップ方式に依存する。**Android/iOSの実機バックアップ・復元は本作業では未実施。** ポリシーは「対象になる場合がある」「復元を保証しない」とし、「絶対に端末外へ出ない」「必ず全件復元できる」のいずれも記載しない。

開発者の収集・独自クラウド保存と、OSサービスによるバックアップは分けて説明する。アプリ内消去はOSバックアップを消去せず、復元で古い状態が戻る可能性がある。アプリがバックアップ暗号化を実装したとの申告もしない。

## 3. ストア申告案（現行ネイティブ版向け）

以下はソース調査に基づく**入力候補**。最終の署名済みAAB／IPA、配信中の別ビルド、組み込みSDKがこのコードと一致することを確認してから確定する。ストア管理画面の現状や回答は変更していない。

| 入力項目 | 回答案 | 根拠・注意 |
| --- | --- | --- |
| App Store Connect：データを収集するか | **いいえ／データの収集なし** | ゲーム記録・設定は端末内処理で、開発者・組込パートナーが取得する送信処理なし |
| App Privacy：追跡 | **なし** | 広告ID・広告SDK・追跡処理なし。収集なしの分岐で個別項目が出なければ追加選択不要 |
| App Privacy：Gameplay Content、Product Interaction等 | **収集データとして追加しない案** | ゲーム記録が存在するだけでは収集とはならない。端末外への送信を追加したら再評価 |
| Google Play：対象となるユーザーデータを収集または共有するか | **いいえ** | 現行ゲームに該当する送信・共有処理がないという判断。OSバックアップを自動的に「開発者が収集」と扱うものではない |
| Google Play：広告を含む | **いいえ** | 広告表示・広告SDKなし |
| アカウント作成 | **なし** | ログイン・アカウント・開発者サーバー上の会員情報なし |
| アカウント削除 | **アカウントなしに対応する選択** | ローカルセーブの消去を「アカウント削除」とは記載しない。フォームの表示条件に従う |
| 転送時暗号化・収集データの削除等 | **「収集なし」の回答後に表示される設問に従う** | 非表示の設問に架空の回答を作らない。OSバックアップの有無を根拠にアプリの暗号化を「はい」としない |
| 両ストア：プライバシーポリシーURL | `https://kmc48.github.io/valentine-bokumetsu/privacy.html` | 既存公開構成からの候補。承認後の公開・到達確認が必要。GitHubのソース表示URLを代用しない |
| Apple：Privacy Choices URL（任意） | 同URLの`#deletion` | 消去方法の節へのリンク。オンライン削除サービスではない |

Appleの公式ガイドは「端末内のみの処理」と収集を区別し、Apple自身が収集する情報の申告責任も分けている。Google Playも端末内処理を収集対象から除外している。上表は、この定義と実装を照合した判断であり、ストアが本アプリの回答を承認済みという意味ではない。Google Playの自分の外部ドライブへの直接アップロードの例を、本アプリの全バックアップ方式に無条件で当てはめない。

**Web版の留意点：** GitHub PagesのIPログを「Web版でも情報が一切記録されない」と説明しない。ネイティブ版はそのWebサイトをラップして読み込む構成ではないため、Web配信ログをそのままネイティブ版の収集項目に転記しない。将来`server.url`や外部WebView・外部ポリシー表示を導入する場合は、表示方式と通信先も再評価する。

**問い合わせメール：** 任意のメールでは開発者が送信元・本文等を受け取るので、ポリシー全体を「個人情報を一切受け取らない」としない。現行ゲームに問い合わせ送信フォーム・自動添付はなく、外部メールでの対応を別記した。アプリ内フォームや自動ログ送信を追加する場合は、AppleのCustomer Support／Contact Info、Googleの該当データ型と開示条件を再確認する。Appleの任意開示は全条件を満たす場合だけで、問い合わせなら常に除外されるわけではない。第7節の保管・削除方針は実際の窓口運用でも守ること。

### 審査メモ用の説明文案

> 本アプリは、画像・音声を同梱したオフライン対応ゲームで、アカウント登録・ログイン、開発者のバックエンド、広告・解析SDKはありません。解放済み周回、周回別最高得点、到達済みエンディング、BGM・SE音量、セリフ文字サイズを端末内のlocalStorageに保存します。「設定」→「セーブデータを消去」を確定すると、ゲーム記録と音量を初期化し、読みやすさのため文字サイズだけを保持します。OSのバックアップ・復元は開発者による収集とは別で、機種・OS・設定により保存データが復元される場合があります。アプリ内消去ではOSバックアップは削除されません。プライバシーポリシーに保存内容と消去方法を記載しています。

これは説明文案であり、下記のアプリ内導線が未対応のまま「アプリ内から閲覧できる」と審査メモへ追加しない。

## 4. 公開前に残る確認事項

1. **アプリ内のポリシー閲覧導線。** 現行のTitleScreen、SettingsScreen、Appにリンク・表示機能がなく、ファイル同梱だけの状態。Apple 5.1.1(i)とGoogle Play User Dataはアプリ内での閲覧を求める。今回の「動作を変更しない」範囲では導線を追加していない。別変更で、設定・進行を壊さず同梱HTMLを表示して戻れる導線を用意し、スクリーンショットへの影響も確認する。**本修正だけで審査準備完了とはしない。**
2. 承認後にポリシーを公開し、候補URLで最新本文がログイン不要・地域制限なしで表示されることを確認する。連絡先メール・運営者表記を実際のストア情報／窓口運用と照合する。
3. 更新したWeb資産をAndroid・iOSへコピーしてから最終ビルドを作成する。公開済みWebページだけ変更しても、既存AAB／IPA内のHTMLは更新されない。署名済み成果物とSDK・プライバシーマニフェストの一致を確認する。
4. 実機で下記の消去・再起動・バックアップ確認を行う。必要な実機・署名環境は本作業環境にはない。
5. `.github/workflows/deploy.yml`は**mainへのpushでPagesを自動公開**する。後日「統合のみ」の承認なら、そのままマージせず公開許可の範囲も確認する。今回、mainのpush・workflow_dispatchは実施していない。

## 5. 回帰確認の結果

Node 24.22.1／npm 11.9.0、lockfileから`npm ci`で導入。依存ファイルは未変更。

| 確認 | 結果 |
| --- | --- |
| `npm test` | **108件成功**（既存102件＋新規6件） |
| `npm run build` | **成功**（TypeScript検査を含む） |
| `npm run verify:web` | **2件成功**（全ストーリー・エンディング、一ノ瀬データの梱包） |
| `npm run test:packaging` | **8件成功**（梱包検証の失敗検出） |
| `npx cap copy android` / `npx cap copy ios` | **成功** |
| `python3 scripts/verify_android_content.py` | **成功**。public 192、dist 195、Android 197ファイル |
| iOSへコピーした全Web資産の比較 | **dist 195ファイルと完全一致**（Cordovaの追加2ファイルのみ除外） |
| main基準と修正後のビルド成果物比較 | **195中194ファイルがバイト一致。差はprivacy.htmlだけ**。ゲームJS・CSS・画像・音声・index.htmlは一致 |
| ポリシーの4箇所比較 | public／dist／Android同梱／iOS同梱のSHA-256一致 |
| `git diff --check` | **成功** |
| GitHub Actions：未署名Android AAB | **成功**。[実行41333254387](https://github.com/KMC48/valentine-bokumetsu/actions/runs/41333254387)で`9a5641b`のテスト・ビルド・実AAB内容一致を確認。署名・公開はしていない |

ポリシーSHA-256：`7b15c65fe2bac9325a32991d1799a487c39220c8d89000cdf1cc363a7b17abed`

[新規テスト](../app/src/tests/savePersistence.test.ts)は、Node上のStorage代替をグローバルに用意し、実際のZustand persistとJSON保存・再読込を通す。persistのmockや本番コードの変更はしていない。OSのStorageやバックアップを実証するテストではない。

- 全保存項目の往復、最高得点の更新条件、解放上限、エンディング重複除外。
- 文字サイズ3段階それぞれで、消去後の初期値と文字サイズ保持、他の保存キーの維持、再起動相当の再読込。
- 文字サイズ導入前のJSONの互換読込と再保存。
- 保存キー削除後の再起動相当で、文字サイズも初期値に戻ること。

未署名AABは上記CIでビルド・梱包検証済み（SHA-256：`931b4b1ff0245e3fd4ab0ac02d8b7ec678ea72ce41243225157e3475f4996145`）。この結果追記は文書のみの変更。以降のCI状態は[PR #3](https://github.com/KMC48/valentine-bokumetsu/pull/3)のChecksで確認できる。

署名済みAAB／IPAのビルド、実機操作、通信キャプチャ、OSバックアップ復元は未実施。ブラウザの画面操作・目視確認も未実施（テスト用Chromiumのダウンロードが失敗）。ゲームの画面動作の維持は、既存テストとビルド成果物のバイト一致で確認した。文面の静的レビューと動作テストを混同しない。

### 再実行

リポジトリの`app`で実行する。コピー対象はgitignoreされた生成物で、設定や署名を変更しない。

```sh
npm ci
npm test
npm run build
npm run verify:web
npm run test:packaging
npx cap copy android
npx cap copy ios
python3 scripts/verify_android_content.py
```

AndroidとiOSのHTMLが本文と同じことを確認する：

```sh
sha256sum public/privacy.html dist/privacy.html android/app/src/main/assets/public/privacy.html ios/App/App/public/privacy.html
```

### 実機確認手順（未実施）

| 手順 | 期待値／記録する点 |
| --- | --- |
| 学校解放・得点・エンディングを獲得し、BGMと文字サイズを変更。アプリを終了して再起動 | 記録・設定が復元される。途中ステージへの自動再開はしない |
| 消去ダイアログをキャンセル | 全記録・設定が保持される |
| 消去を確定して再起動 | 1周目のみ、最高得点・エンディング空、BGM60%、SE内部値80%、文字サイズ維持 |
| 「標準」を選択して再起動 | 文字サイズが標準になり、他の値に影響しない |
| Androidのアプリデータ消去／iOSのApp削除、バックアップを復元しない新規起動 | 文字サイズを含む初期値。iOSのOffloadとは区別 |
| データを作成し、OSバックアップを取得、テスト端末へ復元 | OS・WebView・端末・アプリ版・バックアップ方式を記録し、各保存項目を実測。対象外なら対象外として記録 |
| 消去前バックアップと消去後バックアップをそれぞれ復元 | 古い記録が戻るか、初期化後の状態と文字サイズが戻るかを分けて記録。手元の本番データは使わない |
| Webの再読込／サイトデータ消去 | 保存／初期化を確認。同一配信元の他アプリへの影響に注意 |
| ネイティブ版の初回起動・各周回・設定・消去をオフラインで操作 | 同梱資産でプレイ可能。通信監視ではOS通信とアプリ起因の外部通信を区別 |
| ポリシー本文を小さい画面・文字拡大で表示 | 読めること、メールリンク・消去節のアンカー、戻る操作を確認 |

## 6. 参照した公式資料

2026年11月2日確認。OSの一般仕様と、本アプリで実証した範囲は分けて扱う。

- [Android Auto Backup](https://developer.android.com/identity/data/autobackup)：対象・除外・復元・OS依存の説明。
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)：収集の定義、端末内処理、Apple自身の収集、任意開示、公開URL。
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)：収集・共有・端末内処理・WebViewの扱い。
- [Google Play User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)：公開ポリシー、アプリ内導線、保存・削除説明。
- [Apple App Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/#privacy)：アプリ内でアクセス可能なポリシー。
- [iCloudバックアップの対象](https://support.apple.com/ja-jp/108770)：アプリデータのバックアップ。
- [iPhone／iPadのストレージ](https://support.apple.com/en-la/108429)：OffloadとApp削除の違い。
- [GitHub Pagesのデータ収集](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)：セキュリティ目的のIP記録。
- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)：Web配信元の取り扱い。
