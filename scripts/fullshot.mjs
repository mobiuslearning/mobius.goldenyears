#!/usr/bin/env node
/**
 * 整页截图（CDP，无需 puppeteer）：
 *   node scripts/fullshot.mjs <url> <out.png> [width=1440] [height=1000] [waitMs=1200]
 *
 * 会滚动整页触发 IntersectionObserver 入场，再回到顶部，最后 captureBeyondViewport。
 * 截图时隐藏固定定位元素（导航、进度条、浮动按钮），避免整页图中重复出现。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, outArg, widthArg = '1440', heightArg = '1000', waitArg = '1200'] = process.argv.slice(2);
if (!url || !outArg) {
  console.error('usage: node scripts/fullshot.mjs <url> <out.png> [width] [height] [waitMs]');
  process.exit(1);
}
const width = Number(widthArg);
const height = Number(heightArg);
const settle = Number(waitArg);
const out = resolve(outArg);
mkdirSync(dirname(out), { recursive: true });

const port = 9500 + Math.floor(Math.random() * 400);
const profile = `${tmpdir()}/dsh-fullshot-${process.pid}-${Date.now()}`;
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-crashpad',
    '--disable-breakpad',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`,
    `--crash-dumps-dir=${profile}/crashes`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        // 用独立 page target，避免连到 browser target（不支持 Page.*）
        const pageRes = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
        if (pageRes.ok) {
          const page = await pageRes.json();
          if (page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
        }
      }
    } catch {
      /* retry */
    }
    await sleep(125);
  }
  throw new Error('Chrome DevTools endpoint not available');
}

let nextId = 1;
const pending = new Map();
let ws;

function send(method, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const id = nextId++;
    pending.set(id, { resolvePromise, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((resolvePromise, reject) => {
    ws.onopen = resolvePromise;
    ws.onerror = reject;
  });
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolvePromise, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolvePromise(message.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });

  await send('Page.navigate', { url });
  await sleep(settle + 600);

  // 滚动整页，触发 reveal / lazy 内容
  const metrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const h = document.documentElement.scrollHeight;
      return { h, vh: window.innerHeight };
    })()`,
    returnByValue: true,
  });
  const pageHeight = metrics.result.value.h;
  const step = Math.max(400, height * 0.8);
  for (let y = 0; y < pageHeight; y += step) {
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await sleep(90);
  }
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await sleep(500);

  // 截图前隐藏固定元素、暂停动画，避免重复与闪烁
  await send('Runtime.evaluate', {
    expression: `(() => {
      const style = document.createElement('style');
      style.id = 'shot-freeze';
      style.textContent = \`
        header.sticky, [data-back-to-top], [data-scroll-progress], .crt-overlay, astro-dev-toolbar, #astro-dev-toolbar { display: none !important; }
        *, *::before, *::after { animation-play-state: paused !important; transition: none !important; }
        .reveal, [data-event-reveal], [data-reveal] { opacity: 1 !important; transform: none !important; }
        .is-pending { opacity: 1 !important; transform: none !important; }
      \`;
      document.head.appendChild(style);
      document.querySelectorAll('astro-dev-toolbar').forEach((el) => el.remove());
      const h = document.documentElement.scrollHeight;
      return h;
    })()`,
    returnByValue: true,
  });
  await sleep(450);

  const finalMetrics = await send('Runtime.evaluate', {
    expression: '({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight })',
    returnByValue: true,
  });
  const fullWidth = Math.max(width, finalMetrics.result.value.w);
  const fullHeight = finalMetrics.result.value.h;

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: fullWidth, height: fullHeight, scale: 1 },
  });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`saved ${out} (${fullWidth}x${fullHeight}, ${Buffer.from(shot.data, 'base64').length} bytes)`);
}

main()
  .catch((error) => {
    console.error('fullshot failed:', error.message ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    chrome.kill('SIGKILL');
    await sleep(150);
    process.exit(process.exitCode ?? 0);
  });
