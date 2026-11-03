import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// StrictModeの再マウントや素早い再表示でも、前の解除が次の登録を消さないよう直列化。
let operations: Promise<unknown> = Promise.resolve();
function enqueue(operation: () => Promise<unknown>) {
  operations = operations.then(operation).catch((error) => {
    console.warn("プライバシーポリシーの戻る操作を登録・解除できませんでした", error);
  });
}

export function listenForPrivacyBack(onBack: () => void): () => void {
  if (Capacitor.getPlatform() !== "android") return () => {};
  let active = true;
  let handle: Awaited<ReturnType<typeof App.addListener>> | undefined;
  enqueue(async () => {
    if (!active) return;
    handle = await App.addListener("backButton", () => { if (active) onBack(); });
    if (active) await App.toggleBackButtonHandler({ enabled: true });
  });
  return () => {
    active = false;
    enqueue(async () => {
      try {
        await App.toggleBackButtonHandler({ enabled: false });
      } finally {
        await handle?.remove();
      }
    });
  };
}
