/** 実際に使える操作だけを表示する。 */
export function BottomNav({ onMenu, onHelp }: { onMenu: () => void; onHelp: () => void }) {
  return (
    <nav className="bottomnav" aria-label="ゲームの操作">
      <button type="button" onClick={onMenu}><span className="icon" aria-hidden="true">☰</span>メニュー</button>
      <button type="button" onClick={onHelp}><span className="icon" aria-hidden="true">？</span>遊び方</button>
    </nav>
  );
}
