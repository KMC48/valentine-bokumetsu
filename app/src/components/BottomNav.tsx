/** 下部ナビ。MVPでは HOME / ストーリー のみ機能し、他は将来拡張用の枠。 */

type Props = {
  onHome: () => void;
  onStory?: () => void;
};

const FUTURE = [
  { icon: "👥", label: "生徒図鑑" },
  { icon: "📋", label: "ミッション" },
  { icon: "🛒", label: "ショップ" },
];

export function BottomNav({ onHome, onStory }: Props) {
  return (
    <nav className="bottomnav">
      <button type="button" className="is-active" onClick={onHome}>
        <span className="icon">🏠</span>
        ホーム
      </button>
      <button type="button" onClick={onStory} disabled={!onStory}>
        <span className="icon">📖</span>
        ストーリー
      </button>
      {FUTURE.map((f) => (
        <button key={f.label} type="button" disabled title="今後実装予定">
          <span className="icon">{f.icon}</span>
          {f.label}
        </button>
      ))}
    </nav>
  );
}
