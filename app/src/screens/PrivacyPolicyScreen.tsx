import { useEffect, useRef } from "react";
import policyHtml from "../../public/privacy.html?raw";
import "../styles/privacy.css";

// 単一の原本をビルド時に取り込むため、表示時のfetchや外部フォントは不要。
// 外部サイト・メールは別ウィンドウで開き、本文と戻るボタンを残す。
const policyDocument = policyHtml.replace("<head>", '<head><base target="_blank">');

export function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { backButton.current?.focus(); }, []);
  return (
    <section className="screen privacy-screen" aria-label="プライバシーポリシー">
      <header className="privacy-screen__header">
        <button ref={backButton} type="button" className="btn" onClick={onBack}>
          設定へ戻る
        </button>
      </header>
      <iframe
        className="privacy-screen__document"
        title="プライバシーポリシー本文"
        srcDoc={policyDocument}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
