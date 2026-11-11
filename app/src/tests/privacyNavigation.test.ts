import { afterEach, describe, expect, it, vi } from "vitest";
import { createPrivacyNavigation } from "../privacy/navigation";

function browserHistory() {
  const events = new EventTarget();
  const entries: unknown[] = [{ unrelated: "keep" }];
  let index = 0;
  const history = {
    get state() { return entries[index]; },
    pushState: vi.fn((value: unknown) => { entries.splice(++index); entries[index] = value; }),
    replaceState: vi.fn((value: unknown) => { entries[index] = value; }),
    back: vi.fn(), // popstate is asynchronous in a browser; tests deliver it separately.
  };
  return {
    window: Object.assign(events, { history }) as unknown as Window,
    history, entries,
    back() { index--; events.dispatchEvent(new Event("popstate")); },
    forward() { index++; events.dispatchEvent(new Event("popstate")); },
  };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("設定内のポリシー閲覧", () => {
  it("二重タップで履歴を増やさず、ボタン・戻る・進むで正しい表示にする", () => {
    const browser = browserHistory();
    const change = vi.fn();
    const nav = createPrivacyNavigation(browser.window, change);
    nav.open(); nav.open();
    expect(browser.entries).toHaveLength(2);
    expect(browser.history.state).toMatchObject({ unrelated: "keep" });
    expect(change).toHaveBeenLastCalledWith(true);
    nav.close(); nav.close();
    expect(browser.history.back).toHaveBeenCalledTimes(1);
    browser.back();
    expect(change).toHaveBeenLastCalledWith(false);
    browser.forward();
    expect(change).toHaveBeenLastCalledWith(true);
    browser.back(); // ブラウザ／Androidからの戻るはボタンを経由しない。
    expect(change).toHaveBeenLastCalledWith(false);
    nav.open(); nav.close(); browser.back();
    expect(browser.entries).toHaveLength(2);
    expect(browser.history.state).toEqual({ unrelated: "keep" });
    nav.dispose();
  });

  it("設定を離れた後の古い進む履歴でポリシーを再表示しない", () => {
    const browser = browserHistory();
    const oldChange = vi.fn();
    const nav = createPrivacyNavigation(browser.window, oldChange);
    nav.open(); browser.back(); nav.dispose();
    const change = vi.fn();
    const next = createPrivacyNavigation(browser.window, change);
    browser.forward();
    expect(change).not.toHaveBeenCalled();
    expect(oldChange).toHaveBeenCalledTimes(2);
    next.dispose();
  });

  it("履歴が利用できなくても本文を開き、画面内ボタンで戻れる", () => {
    const browser = browserHistory();
    browser.history.pushState.mockImplementation(() => { throw new Error("unavailable"); });
    const change = vi.fn();
    const nav = createPrivacyNavigation(browser.window, change);
    nav.open(); nav.close();
    expect(change.mock.calls).toEqual([[true], [false]]);
    expect(browser.history.back).not.toHaveBeenCalled();
    nav.dispose();
  });

  it("進行中の状態、全セーブ項目、保存JSONに一切書き込まない", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
      removeItem: vi.fn((key: string) => { values.delete(key); }),
    };
    vi.stubGlobal("localStorage", storage);
    vi.resetModules();
    const { useSaveStore } = await import("../store/saveStore");
    const { useGameStore } = await import("../store/gameStore");
    const save = useSaveStore.getState();
    save.unlockLoop(3); save.recordScore(1, 420); save.recordEnding("ending-a");
    save.setVolume("bgm", 0.2); save.setVolume("se", 0.4); save.setTextSize("xlarge");
    useGameStore.getState().startRun(2);
    useGameStore.getState().finishStory();
    useGameStore.setState({ score: 1234, timeRemaining: 87, reportedIds: ["test-id"] });
    useGameStore.getState().goSettings();
    const beforeGame = useGameStore.getState();
    const beforeSave = useSaveStore.getState();
    const beforeStorage = [...values];
    storage.setItem.mockClear();
    const browser = browserHistory();
    const nav = createPrivacyNavigation(browser.window, () => {});
    for (let i = 0; i < 3; i++) { nav.open(); nav.close(); browser.back(); }
    nav.dispose();
    expect(useGameStore.getState()).toBe(beforeGame);
    expect(useSaveStore.getState()).toBe(beforeSave);
    expect([...values]).toEqual(beforeStorage);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
