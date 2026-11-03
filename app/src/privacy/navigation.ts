/** 設定の中だけで使う履歴。ゲームストア・保存領域には触れない。 */
let nextSession = 0;
const KEY = "valentinePrivacySession";

export function createPrivacyNavigation(browser: Window, onChange: (open: boolean) => void) {
  const session = `${Date.now()}-${++nextSession}`;
  let isOpen = false;
  let closing = false;
  let ownsEntry = false;
  let previousState: unknown;

  const onPopState = () => {
    const active = browser.history.state?.[KEY] === session;
    closing = false;
    ownsEntry = active;
    if (isOpen !== active) {
      isOpen = active;
      onChange(active);
    }
  };
  browser.addEventListener("popstate", onPopState);

  return {
    open() {
      if (isOpen || closing) return;
      previousState = browser.history.state;
      try {
        browser.history.pushState({ ...previousState as object, [KEY]: session }, "");
        ownsEntry = true;
      } catch {
        // 履歴を利用できない環境でも、同梱本文と画面内の戻る操作は利用可能。
        ownsEntry = false;
      }
      isOpen = true;
      onChange(true);
    },
    close() {
      if (!isOpen || closing) return;
      if (ownsEntry && browser.history.state?.[KEY] === session) {
        closing = true;
        browser.history.back();
      } else {
        isOpen = false;
        onChange(false);
      }
    },
    dispose() {
      browser.removeEventListener("popstate", onPopState);
      // 再読み込みや親のアンマウントで、別の設定セッションを開かない。
      if (browser.history.state?.[KEY] === session) {
        browser.history.replaceState(previousState, "");
      }
    },
  };
}
