#!/usr/bin/env node
/**
 * 精确视口截图（CDP，不受 macOS Chrome 最小窗口宽限制）。
 * 用法: node scripts/viewshot.mjs <url> <out.png> [width=1440] [height=1000] [waitMs=3500]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, outArg, widthArg = '1440', heightArg = '1000', waitArg = '3500', scrollArg = '0'] = process.argv.slice(2);
if (!url || !outArg) {
  console.error('usage: node scripts/viewshot.mjs <url> <out.png> [width] [height] [waitMs]');
  process.exit(1);
}
const width = Number(widthArg);
const height = Number(heightArg);
const wait = Number(waitArg);
const out = resolve(outArg);
mkdirSync(dirname(out), { recursive: true });

const port = 9600 + Math.floor(Math.random() * 300);
const profile = `${tmpdir()}/dsh-viewshot-${process.pid}-${Date.now()}`;
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
    `--user-data-dir=${profile}`,
    `--crash-dumps-dir=${profile}/crashes`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
const pending = new Map();
let ws;

async function pageWsUrl() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      if (res.ok) {
        const page = await res.json();
        if (page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {
      /* retry */
    }
    await sleep(125);
  }
  throw new Error('Chrome DevTools endpoint not available');
}

function send(method, params = {}) {
  return new Promise((resolvePromise, reject) => {
    const id = nextId++;
    pending.set(id, { resolvePromise, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  ws = new WebSocket(await pageWsUrl());
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
  await sleep(wait);

  await send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelectorAll('astro-dev-toolbar').forEach((el) => el.remove());
      document.documentElement.style.scrollBehavior = 'auto';
      if ('${scrollArg}' !== 'keep') window.scrollTo(0, ${Number(scrollArg) || 0});
    })()`,
  });
  await sleep(900);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`saved ${out} (${width}x${height})`);
} catch (error) {
  console.error('viewshot failed:', error.message ?? error);
  process.exitCode = 1;
} finally {
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  chrome.kill('SIGKILL');
  await sleep(120);
  process.exit(process.exitCode ?? 0);
}
