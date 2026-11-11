/** Capture the actual production build through UI operations; never alter app CSS/content. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';

const { values } = parseArgs({ options: {
  dist: { type: 'string' }, out: { type: 'string' },
} });
assert(values.dist && values.out, 'Usage: node capture.mjs --dist app/dist --out /tmp/captures');
const dist = path.resolve(values.dist);
const out = path.resolve(values.out);
await mkdir(out, { recursive: true });
const hash = (data) => createHash('sha256').update(data).digest('hex');
const git = (...args) => execFileSync('git', ['-C', dist, ...args], { encoding: 'utf8' }).trim();
const files = [
  '1_タイトル.png', '2_校門で生徒を観察.png', '3_観察して見抜く.png', '4_教室と机の中.png',
  '5_2周目_私立聖蘭学院.png', '6_3周目_白鷺台学園.png', '7_放課後.png', '8_ストーリー.png',
];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const viewport = { width: 430, height: 932 };
const manifest = {
  sourceCommit: git('rev-parse', 'HEAD'),
  sourceTrackedChanges: git('diff', '--name-only', 'HEAD', '--', 'app/src', 'app/public', 'app/index.html'),
  capturedAt: new Date().toISOString(), captureKind: 'browser-reproduction',
  physicalDevice: false, iosSimulator: false, nativeWKWebViewVerified: false,
  os: `${os.platform()} ${os.release()} ${os.arch()}`, node: process.version,
  playwright: '1.56.1', browser: await browser.version(), viewport, deviceScaleFactor: 3,
  locale: 'ja-JP', textSize: 'standard', colorSpace: 'srgb',
  clock: 'Frozen between UI actions; advance 4 seconds after entering stage (3 seconds for observation).',
  fixture: 'Fresh localStorage per image. Only loop 2/3 images seed unlockedLoop=3. No debug hooks or DOM/CSS overrides.',
  screenshot: 'Viewport only, animations disabled, no resizing/cropping/compositing. Remove unused alpha; encode RGB PNG.',
  buildFiles: {}, images: [],
};
assert.equal(manifest.sourceTrackedChanges, '', 'Build source must have no tracked changes');
for (const f of ['index.html', ...(await readdir(path.join(dist, 'assets'))).filter(f => /\.(js|css)$/.test(f)).map(f => `assets/${f}`)]) {
  manifest.buildFiles[f] = hash(await readFile(path.join(dist, f)));
}

async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(im => im.decode()));
  });
}
async function nextStage(page) {
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  await page.getByRole('button', { name: 'このステージを終了する', exact: true }).click();
  await page.getByRole('button', { name: '次のパートへ', exact: true }).click();
  await page.getByRole('button', { name: 'スキップ ▶▶', exact: true }).click();
  await page.locator('.stage').waitFor();
}
try {
  for (let index = 0; index < files.length; index++) {
    const number = index + 1;
    const loop = number === 5 ? 2 : number === 6 ? 3 : 1;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 3,
      isMobile: true, hasTouch: true, locale: 'ja-JP', colorScheme: 'dark' });
    await context.addInitScript(({ loop }) => {
      localStorage.setItem('valentine-annihilation-save-v1', JSON.stringify({ version: 0, state: {
        unlockedLoop: loop === 1 ? 1 : 3, bestScores: {}, endings: [],
        settings: { bgmVolume: 0, seVolume: 0, textSize: 'standard' },
      } }));
    }, { loop });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
    await page.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-27T03:00:01Z'));
    await page.goto(url);
    await page.locator('.title-screen').waitFor();
    if (number !== 1) {
      if (loop === 1) await page.getByRole('button', { name: 'はじめから（1周目）', exact: true }).click();
      else {
        await page.getByRole('button', { name: /学校をえらぶ/ }).click();
        await page.locator('.loop-card').nth(loop - 1).click();
      }
      await page.locator('.story-screen').waitFor();
      if (number === 8) {
        for (let n = 0; n < 3; n++) await page.locator('.story-screen__text').click();
        assert.equal(await page.locator('.story-screen__progress').innerText(), '4 / 14');
        assert.equal(await page.locator('.story-screen__text').innerText(), 'だが毎年、2月14日だけはこの条文が死ぬ。');
      } else {
        await page.getByRole('button', { name: 'スキップ ▶▶', exact: true }).click();
        await page.locator('.stage').waitFor();
        if ([4, 6, 7].includes(number)) await nextStage(page);
        if (number === 7) await nextStage(page);
        if (number === 6) await page.locator('.areabar__chip').filter({ hasText: /^階段/ }).click();
        await page.clock.runFor(number === 3 ? 3000 : 4000);
        if (number === 3) {
          await page.getByRole('button', { name: '水嶋 ひなたを観察する', exact: true }).click();
          // Let the observation panel and resized background settle. Its game timer is paused.
          await page.clock.runFor(300);
        }
      }
    }
    await ready(page);
    // Finish finite entry transitions before layout measurement.
    const screenshot = await page.screenshot({ animations: 'disabled', fullPage: false, omitBackground: false });
    const layout = await page.evaluate(() => {
      const selectors = ['.app-frame', '.gamearea', '.speech', '.speech__name', '.speech__text',
        '.modal', '.story-screen__box', '.story-screen__speaker', '.story-screen__text',
        '.story-screen__progress', '.story-screen__next'];
      return Object.fromEntries(selectors.map(s => {
        const el = document.querySelector(s);
        if (!el) return [s, null];
        const c = getComputedStyle(el);
        return [s, { rect: el.getBoundingClientRect().toJSON(), fontSize: c.fontSize, lineHeight: c.lineHeight,
          fontFamily: c.fontFamily, text: ['.speech__text', '.story-screen__text'].includes(s) ? el.textContent : undefined }];
      }));
    });
    if (number === 8) {
      const text = layout['.story-screen__text'].rect;
      assert(text.bottom <= layout['.story-screen__progress'].rect.top, 'Story text overlaps page count');
      assert(text.bottom <= layout['.story-screen__next'].rect.top, 'Story text overlaps NEXT');
    }
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const selector = number === 1 ? '.title-screen__main' : number === 8 ? '.story-screen__text' : '.speech__text';
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    const iconFonts = [];
    for (const icon of await page.locator('.bottomnav .icon').all()) {
      const index = iconFonts.length + 1;
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId, selector: `.bottomnav button:nth-child(${index}) .icon`,
      });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      assert(fonts.some(f => /Emoji|Symbol/i.test(f.familyName)), 'Missing emoji font: install an OS emoji font before capture');
      iconFonts.push({ text: await icon.innerText(), fonts });
    }
    const png = await sharp(screenshot).removeAlpha().toColourspace('srgb').png().toBuffer();
    const meta = await sharp(png).metadata();
    assert.deepEqual([meta.width, meta.height, meta.channels, meta.hasAlpha, meta.format], [1290, 2796, 3, false, 'png']);
    assert.deepEqual(errors, [], 'Browser or asset load error');
    await writeFile(path.join(out, files[index]), png);
    manifest.images.push({ file: files[index], sha256: hash(png), width: meta.width, height: meta.height,
      channels: meta.channels, hasAlpha: meta.hasAlpha, loop, layout, fonts: fonts.fonts, iconFonts, errors });
    console.log(`Captured ${files[index]}`);
    await context.close();
  }
  await writeFile(path.join(out, 'capture-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
} finally {
  await browser.close();
  server.close();
}
