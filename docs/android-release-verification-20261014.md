# Android公開用ビルド・同梱内容の検証（2026-10-14）

対象：`KMC48/valentine-bokumetsu`、調査開始時の最新main
`802237167e0de81cbaadd583ad9b791c596b7542`（2026-10-11）。

## 結論

同じソースからWebを新規ビルドしてCapacitor同期した結果、一ノ瀬ひかるの専用画像3点を含む全素材と、現行ストーリーを含む生成JavaScriptがAndroidの同梱先まで一致した。
**このローカル環境ではAAB生成は完了していない。署名済みAABや実端末の動作確認とは区別する。**

過去に利用者のPCで生成したAAB・Play Consoleへの提出履歴は取得していない。
調査時のWeb公開run `38113628112`は上記commitで成功していたが、それだけではAndroid版の更新を証明できない。

## 確認できたこと

| 項目 | 実測・結果 |
|---|---|
| 依存関係 | `npm ci`成功。lockfileは変更なし |
| 修正前の型チェック・テスト | 型チェック成功、8ファイル92テスト成功 |
| 修正後の型チェック・テスト | 型チェック成功、9ファイル95テスト成功 |
| production成果物の検査 | 2テスト成功。9ストーリー・6エンディング、計112行の台詞とタイトル、一ノ瀬の参照・ヒントを生成JSで確認 |
| 検証器の異常検知 | Python 8テスト成功。欠落・古いJS・余分なJS・AAB内改変・外部URL・署名モード違いを検出 |
| productionビルド | `npm run build`成功 |
| Capacitor同期 | `cap sync android`成功 |
| 元素材 | public内195ファイル。WebP 187点、MP3 3曲を含む |
| Web成果物 | dist内198ファイル。元素材とバイト一致 |
| Android同梱先 | 200ファイル。distの全198ファイルとSHA-256一致。追加2点はCapacitorの`cordova.js`と`cordova_plugins.js` |
| 一ノ瀬のゲームデータ | `l3-l-05`が`assets/characters/ichinose.webp`を使用。既存テストで振り向き・3周目会話画像・無実判定も成功 |
| Android設定 | appId `com.kmc48.valentinebokumetsu`、minSdk24、compile/target36、versionCode5、versionName1.0.4 |
| ローカル同梱設定 | `webDir: dist`、`server.url`なし、httpsスキーム |
| 公開用コマンドの鍵なし実行 | 想定どおり非ゼロ終了。未署名AABを公開用成功と表示しない |
| 機密情報 | 鍵・パスワードの取得、生成、登録は行っていない。Git管理対象の署名鍵・keystore.propertiesなし |

一ノ瀬3点のSHA-256（public / dist / Android同梱先で一致）：

| ファイル | SHA-256 |
|---|---|
| `ichinose.webp` | `81f2714e67bf3bd3742d358f62aa78047b92e23640da744f9a146158fa798d59` |
| `ichinose_turn.webp` | `f1444f2164f801c432dd045a256450bfce3853c08d556de4fe2b783cef100f08` |
| `bust_ichinose.webp` | `d4a7d0e05c2d6b7b333f54b3e6ac0ece0c5c19c1a3aae3b6e6bf60c0ea6cc76c` |

## 修正内容

- Windows専用のAndroidコマンドをNodeランナーに変更。Windows/macOS/LinuxのGradle呼び出しに対応。
- Androidビルド前に既存テスト・型チェック・production成果物検証を必須化。
- publicの全画像・BGM実体、現行ストーリー・エンディングの全台詞を検証。
- public → dist → Android → AABのファイル一覧とSHA-256を照合。古いJSの混入も拒否。
- 鍵なしCI用の`android:unsigned`を分離。`android:release`は署名設定がないと停止。未署名モードではローカルの鍵設定も読み込まない。
- AAB検証器はZIP内部の全WebファイルとCapacitor設定を照合し、署名エントリーの有無も検査。公開用は`jarsigner -verify`も実行。
- GitHub ActionsにJDK21・Android SDK36の未署名AAB検証を追加。GitHub Secrets不要。
- Android手順書を5 / 1.0.4に修正。現行値・次回アップロード時の採番・署名・自動検証・実機確認の手順を整理。

## 未確認・制約

| 項目 | 状況 |
|---|---|
| ローカルの実AAB生成・内部照合 | Gradle 8.14.3の初回取得で`Network is unreachable`となり停止。署名済み・未署名とも生成成功とはしていない |
| Android開発環境 | この実行環境はJDK17のみ、Android SDK未導入。プロジェクトのJava21要件を満たさない |
| 追加したCIの実行結果 | PR作成後のActions結果を参照。ローカルでのAAB生成は未完了であり、CI定義の追加だけでは成功扱いにしない |
| Windows/macOSでの実行 | ランナーは対応させたが、このLinux環境以外では未実行 |
| 署名とPlay照合 | 所有者の鍵、登録アップロード証明書、既提出の最大versionCodeは未確認 |
| AABのコンパイル済みManifest | 検証記録の版数はGradleから取得。AAB内部Manifestの版数を独立にデコードしてはいない |
| Android実機 | 描画、音声、オフライン、セーブ、端末固有挙動は未確認 |
| 既存配信版 | 既存Playアプリと最新Webの一致は未確認。今回確認したのは最新ソースから作ったWeb成果物とAndroid同梱先 |

Pythonのテスト用AABは合成ZIPであり、Androidビルド成功の証拠には含めていない。
台詞検証は現在のVite出力形式の文字列検査である。将来のminifier変更等で表現が変わった場合は検証側を見直す。

## GitHubへの反映状況

当初はGitHub連携の書き込みが403で拒否されたが、2026-10-14夜の再試行では成功した。変更はレビュー用ブランチ・PRで提示し、mainへの統合は未実施。CIの実行結果はPRのChecksで確認する。

## 所有者の環境で残る確認

1. 変更を取り込んだcommitで`npm ci`。Play Consoleの最大versionCodeを確認し、必要なら5から増やす。
2. ローカルの既存アップロード鍵で`npm run android:release`を実行。
3. 検証記録とAABハッシュを確認し、アップロード鍵証明書をPlay Consoleと照合。
4. 内部テスト配信で、一ノ瀬の3画像・3周分のストーリーと素材・音声・オフライン起動を確認。

詳細コマンドは[Android手順書](../app/android/README.md)を参照。
