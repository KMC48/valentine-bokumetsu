import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Google Play 向けのAndroidアプリ設定。
 *
 * 【なぜ中身を丸ごとアプリに入れるのか】
 * 公開中のWebページを読みに行く作り（TWA）にもできるが、
 * その場合は通信が無いと遊べず、Google Play の審査でも
 * 「オフラインで何も表示されない」点を指摘されやすい。
 * 素材をWebPにしたことで全部入れても十数MBに収まるので、
 * アプリ内に同梱してオフラインで完結させる。
 *
 * 【セリフを直したとき】
 * 中身を同梱しているので、文言を変えたら再ビルドと再アップロードが要る。
 * 手順は android/README.md を参照。
 */
const config: CapacitorConfig = {
  appId: "com.kmc48.valentinebokumetsu",
  appName: "バレンタイン撲滅委員会",
  webDir: "dist",
  android: {
    // 縦持ち専用のゲームなので、横向きには追従しない。
    // 実際の固定は AndroidManifest.xml の screenOrientation で行う。
    allowMixedContent: false,
  },
  server: {
    // 端末内のファイルをそのまま読む（外部サーバーに依存しない）。
    androidScheme: "https",
  },
};

export default config;
