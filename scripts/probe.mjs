#!/usr/bin/env node
/**
 * 在无头 Chrome 中执行一段 JS 并打印返回值，便于排查样式/脚本问题。
 * 用法: node scripts/probe.mjs <url> "<js expression>"
 */
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, expression = 'document.title', widthArg = '1440', heightArg = '1000'] = process.argv.slice(2);
const port = 9900 + Math.floor(Math.random() * 90);
const profile = `${tmpdir()}/dsh-probe-${process.pid}-${Date.now()}`;
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
    '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=${profile}`,
    `--crash-dumps-dir=${profile}/crashes`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
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
  throw new Error('no devtools');
}

let nextId = 1;
const pending = new Map();

try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((resolvePromise, reject) => {
    ws.onopen = resolvePromise;
    ws.onerror = reject;
  });
  const consoleErrors = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(`EXCEPTION: ${message.params?.exceptionDetails?.text ?? 'unknown'}`);
    }
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params?.type)) {
      consoleErrors.push(`${message.params.type.toUpperCase()}: ${(message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' ')}`);
    }
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolvePromise, reject) => {
      const id = nextId++;
      pending.set(id, { resolve: resolvePromise, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: Number(widthArg), height: Number(heightArg), deviceScaleFactor: 1, mobile: Number(widthArg) < 600 });
  await send('Page.navigate', { url });
  await sleep(1600);
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  const value = result.result.value ?? result.result.description ?? result.result;
  console.log(JSON.stringify({ value, consoleErrors }, null, 2));
  ws.close();
} catch (error) {
  console.error(error.message ?? error);
  process.exitCode = 1;
} finally {
  chrome.kill('SIGKILL');
  await sleep(120);
  process.exit(process.exitCode ?? 0);
}
