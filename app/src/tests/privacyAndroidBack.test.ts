import { beforeEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({
  platform: "android",
  addListener: vi.fn(),
  toggle: vi.fn(async () => {}),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => native.platform } }));
vi.mock("@capacitor/app", () => ({ App: {
  addListener: native.addListener, toggleBackButtonHandler: native.toggle,
} }));

beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); native.platform = "android"; });

describe("Androidの戻るリスナー", () => {
  it.each(["web", "ios"])("%sではAndroid APIを呼ばない", async (platform) => {
    native.platform = platform;
    const { listenForPrivacyBack } = await import("../privacy/androidBack");
    listenForPrivacyBack(vi.fn())();
    expect(native.addListener).not.toHaveBeenCalled();
    expect(native.toggle).not.toHaveBeenCalled();
  });

  it("閲覧中だけ有効化し、戻った後はリスナーとハンドラーを解除する", async () => {
    const remove = vi.fn(async () => {});
    native.addListener.mockResolvedValue({ remove });
    const close = vi.fn();
    const { listenForPrivacyBack } = await import("../privacy/androidBack");
    const dispose = listenForPrivacyBack(close);
    await vi.waitFor(() => expect(native.toggle).toHaveBeenCalledWith({ enabled: true }));
    expect(native.addListener.mock.calls[0]?.[0]).toBe("backButton");
    const onBack = native.addListener.mock.calls[0]![1];
    onBack({ canGoBack: false }); // canGoBackの値に関係なく設定へ戻す。
    expect(close).toHaveBeenCalledTimes(1);
    dispose(); onBack({ canGoBack: true });
    await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(native.toggle).toHaveBeenLastCalledWith({ enabled: false });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("遅れて登録が完了しても解除し、素早い再表示の新リスナーを残す", async () => {
    let resolveFirst!: (handle: { remove: () => Promise<void> }) => void;
    const removeOld = vi.fn(async () => {});
    const removeNew = vi.fn(async () => {});
    native.addListener.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ remove: removeNew });
    const { listenForPrivacyBack } = await import("../privacy/androidBack");
    const disposeOld = listenForPrivacyBack(vi.fn());
    await vi.waitFor(() => expect(native.addListener).toHaveBeenCalledTimes(1));
    disposeOld();
    const disposeNew = listenForPrivacyBack(vi.fn());
    resolveFirst({ remove: removeOld });
    await vi.waitFor(() => expect(native.toggle).toHaveBeenLastCalledWith({ enabled: true }));
    expect(removeOld).toHaveBeenCalledTimes(1);
    expect(removeNew).not.toHaveBeenCalled();
    disposeNew();
    await vi.waitFor(() => expect(removeNew).toHaveBeenCalledTimes(1));
    expect(native.toggle).toHaveBeenLastCalledWith({ enabled: false });
  });
});
