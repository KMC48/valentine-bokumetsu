// npm run build 後に実行。Playwrightは別途インストールし、必要ならモジュール/実行ファイルを環境変数で指定。
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const root = resolve("dist");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".ogg": "audio/ogg", ".mp3": "audio/mpeg" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/valentine-bokumetsu/, "");
  const file = resolve(root, `.${path.endsWith("/") ? `${path}index.html` : path}`);
  if (!file.startsWith(`${root}/`)) { res.writeHead(403).end(); return; }
  try { res.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream"); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}/valentine-bokumetsu/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const KEY = "valentine-annihilation-save-v1";
const seed = JSON.stringify({ state: {
  unlockedLoop: 3, bestScores: { loop1: 420, loop2: 720, loop3: -10 }, endings: ["ending-a", "ending-b"],
  settings: { bgmVolume: 0.2, seVolume: 0.4, textSize: "xlarge" },
}, version: 0 });
const screenshots = process.env.QA_SCREENSHOTS_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (req) => requests.push(req.url()));
    await page.addInitScript(({ KEY, seed }) => {
      if (window.top !== window) return;
      if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, seed);
      window.__storageWrites = [];
      for (const method of ["setItem", "removeItem", "clear"]) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.__storageWrites.push([method, ...args]);
          return original.apply(this, args);
        };
      }
    }, { KEY, seed });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "設定", exact: true }).click();
    const open = page.getByRole("button", { name: "プライバシーポリシー", exact: true });
    await open.waitFor();
    if (screenshots) await page.screenshot({ path: `${screenshots}/settings-${viewport.width}.png`, animations: "disabled" });
    const initialHistory = await page.evaluate(() => history.length);
    // 読み込み済みWebアプリの通信を全面停止。ポリシーは初回表示から利用できること。
    await context.setOffline(true);
    const requestCount = requests.length;
    for (const mode of ["button", "browser", "double-button", "button"]) {
      await open.click();
      const doc = page.frameLocator('iframe[title="プライバシーポリシー本文"]');
      await doc.getByRole("heading", { name: "プライバシーポリシー", exact: true }).waitFor();
      assert.equal(await doc.locator("h2").count(), 10);
      if (screenshots) await page.screenshot({ path: `${screenshots}/privacy-top-${viewport.width}.png`, animations: "disabled" });
      assert.match(await doc.locator("main").innerText(), /最終更新日：2026年11月2日/);
      assert.match(await doc.locator("main").innerText(), /文字サイズ設定だけは保持/);
      await doc.getByText("運営者：KMC Creative Lab（ロベルトKMC）", { exact: true }).scrollIntoViewIfNeeded();
      assert(await doc.locator("body").evaluate(() => window.scrollY > 0));
      const back = page.getByRole("button", { name: "設定へ戻る", exact: true });
      await page.locator(".privacy-screen").evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
      const box = await back.boundingBox();
      assert(box && box.y >= 0 && box.y + box.height <= viewport.height && box.height >= 43.9, JSON.stringify({viewport, box}));
      assert(await doc.locator("body").evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (screenshots && mode === "button") {
        await page.screenshot({ path: `${screenshots}/privacy-${viewport.width}.png`, animations: "disabled" });
      }
      if (mode === "browser") {
        await page.goBack();
        await open.waitFor();
        await page.goForward();
        await back.waitFor();
        await page.goBack();
      } else if (mode === "double-button") {
        await back.evaluate((button) => { button.click(); button.click(); });
      } else await back.click();
      await open.waitFor();
      assert(await open.evaluate((el) => document.activeElement === el));
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), seed);
    }
    assert.equal(await page.evaluate(() => history.length), initialHistory + 1);
    assert.equal(requests.length, requestCount, "ポリシーの表示・スクロール・戻るで通信しない");
    assert.deepEqual(await page.evaluate(() => window.__storageWrites), []);
    assert.deepEqual(errors, []);
    // 再起動相当の再読込でも保存JSONと設定を維持。
    await context.setOffline(false);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "設定", exact: true }).click();
    assert.equal(await page.locator("#bgm").inputValue(), "20");
    assert.equal(await page.getByRole("button", { name: "特大", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), KEY), seed);
    console.log(`PASS ${viewport.width}x${viewport.height}: offline, full text, scroll, back/forward, repeated open, focus, save preservation`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
