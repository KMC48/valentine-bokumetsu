# アプリ内プライバシーポリシー閲覧（2026年11月3日）

## 対象・既存PRとの関係

- 作業ブランチ：`codex/in-app-privacy-policy-20261103`
- 確認したmain：`427e09e68256cb72330ae7b8f7eb654993fdf502`
- 土台：PR #3の先端 `95c95cbbf3fbb50cd57c57ee12bc668b5d788249`。PR #3自体は変更していない。
- `app/public/privacy.html` はPR #3とバイト一致。本文修正をコピーして別の原本を作る方式ではない。
- PR #2のストア掲載画像・撮影スクリプト・READMEには変更なし。ゲーム画面、App.tsx、gameStore、saveStore、音声、画像も変更なし。
- mainへのマージ、GitHub Pages公開、ストア申告・アップロードは未実施。mainへのpushでPages公開が自動実行されるため、後日のマージには公開の承認も必要。

## 利用者の操作

タイトル → 設定 →「プライバシーポリシー」で本文を表示する。上部の「設定へ戻る」は本文スクロール中も固定表示。設定項目が縦に収まらない画面はスクロールできる。

- Web：ブラウザの戻る・進むにも対応。同じページの履歴を使い、アプリを再読み込みしない。
- Android：Capacitor公式 `@capacitor/app` 8.1.2の戻るイベントを閲覧中だけ有効化。設定へ戻る際に解除する。その他の画面では従来のOSの戻る動作を維持するため、初期設定は `disableBackButtonHandler: true`。
- iOS：画面内の「設定へ戻る」を使う。iOS固有のスワイプ戻りは今回追加していない。
- ポリシーは設定内の一時的な表示として扱う。Zustandのゲーム画面状態も `settings` のままであり、BGMの選曲・プレイ状態・保存設定に変更を加えない。
- 戻る際はポリシーボタンにキーボードフォーカスを戻す。二重タップで履歴を重複追加・重複消費しない。

## オフライン・本文の原本

Viteの `?raw` importで `app/public/privacy.html` をビルド時にJSへ取り込み、sandbox付きiframeの `srcDoc` に表示する。表示時のfetch・外部フォント・外部ブラウザは不要。Android/iOSではJSもHTMLも同梱される。

同じファイルは従来どおり `dist/privacy.html` にも出力され、ストア掲載用URLの原本として維持される。将来の本文更新はこのファイルを編集してWebビルド・Capacitor sync・ネイティブ再ビルドを行う。インストール済みアプリの本文更新にはアプリ更新が必要。

iframeではスクリプト、同一オリジン権限、フォーム、親画面遷移を許可していない。既存の外部サイト・メールリンクは新しい閲覧先で開くためのbase targetを表示時だけ加える。原本の文言・URLは変更しない。外部サイトやメールには通信・対応アプリが必要だが、本文閲覧には不要。

Webはゲーム本体の初回読み込みに通信が必要。今回はService WorkerやPWAキャッシュを追加していないため、オフラインでのWebの新規起動・再読み込みを保証するものではない。

## 実施した検証

| 検証 | 結果 |
| --- | --- |
| Vitest | 116件成功（PR #3の108件＋今回8件） |
| TypeScript検査・Vite本番ビルド | 成功 |
| Web梱包検証 | 3件成功。公開HTMLと原本の一致、JS中の全文、外部リソース不要を確認 |
| Android梱包検証の異常系 | 8件成功 |
| `cap sync android` / `cap sync ios` | 成功。公式Appプラグインを検出し、Gradle/SPM構成を更新 |
| Androidコピー後の既存検証 | 成功。public 192ファイル、dist 196ファイルを確認 |
| iOS/Androidコピー後の全ファイル比較 | distの196ファイルすべてが両プラットフォームでバイト一致 |
| ChromiumでのWeb操作 | 320×568、390×844、430×932、1280×900の4サイズで成功 |
| 通信停止後の初回ポリシー表示 | 全10章・更新日・末尾の問い合わせまで表示。開閉・スクロール・戻るによる新規リクエスト0 |
| ブラウザ履歴 | 戻る・進む・4回の反復開閉・戻る二重クリックを確認。履歴の増殖なし |
| セーブ保全 | 解放3周・最高得点・エンディング・BGM/SE音量・文字特大を設定。開閉後の保存JSONが完全一致、Storage書き込み0、再読み込み後も維持 |
| 進行中データ | 単体テストで得点・残り時間・通報済みID等を保持し、ゲームストアの参照も不変 |
| Android戻るイベント | モックで戻る、解除、遅延登録後の解除、素早い再表示を確認。実機確認とは別 |
| `git diff --check` | 成功 |

ポリシーのSHA-256：`7b15c65fe2bac9325a32991d1799a487c39220c8d89000cdf1cc363a7b17abed`

ブラウザ検証はLinux Chromium（@sparticuz/chromium 153.0.0）とPlaywright 1.62.1。日本語表示の目視確認にはNoto Sans CJK JPを検証環境へ追加。iPhoneの画面サイズを使った検証も、iOS/WKWebView実機検証ではない。

### 再現コマンド

```sh
cd app
npm ci
npm test
npm run build
npm run verify:web
npm run test:packaging
npx cap sync android
npx cap sync ios
node scripts/android-build.mjs verify
```

Webの操作検証はPlaywrightとChromiumを用意して `node scripts/privacy-browser.mjs`。Playwrightを別ディレクトリに入れた場合は `PLAYWRIGHT_MODULE_PATH` にその `index.mjs` の絶対パス、ブラウザ実行ファイルは任意で `CHROMIUM_PATH` を指定。`QA_SCREENSHOTS_DIR` 指定時のみ検証画像を出力する。開発用依存関係としてPlaywrightを本リポジトリへ追加する必要はない。

## 未検証・リリース前の実機確認

1. Android実機の最新OS/WebView：機内モードでアプリを新規起動 → 設定 → 本文末尾 → OSの戻るボタンとジェスチャーで設定へ戻る。反復してアプリが終了しないこと、設定以外の戻る動作も確認。
2. iPhone実機の最新iOS：機内モードの新規起動、全文スクロール、ノッチ/Safe Area、VoiceOver、「設定へ戻る」を確認。
3. 両実機で外部GitHubリンクとメールリンクを開き、アプリへ戻っても本文・設定・記録が維持されることを確認。メール未設定時の挙動も確認。今回メール送信はしていない。
4. 署名済みAAB/IPA、実機インストール、Xcode/SPMのネイティブコンパイル、TalkBack/VoiceOverの読み上げは未検証。WebKit/Safariのブラウザ実行も未検証。
5. PR #3と本変更の承認後、公開URLのポリシー本文を確認してApp Store Connect / Play ConsoleのURL欄とデータ申告を見直す。

## 参照した要件

- [Apple App Review Guidelines 5.1.1(i)](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)：ストアメタデータと、アプリ内の容易にアクセスできる場所からプライバシーポリシーへアクセス可能にする。
- [Google Play ユーザーデータポリシー](https://support.google.com/googleplay/android-developer/answer/10144311)：Play Consoleのリンクに加え、アプリ内にリンクまたは本文を設ける。公開URLも引き続き必要。
- [Capacitor App API](https://capacitorjs.com/docs/apis/app)：AndroidのbackButtonリスナーとtoggleBackButtonHandler。

本変更はアプリ内の閲覧導線を補うもの。ストア申告内容や実機動作を含めた審査合格を保証するものではない。
