/**
 * 书籍页交互：
 * - 通用筛选 / 搜索（collection.ts 约定）
 * - 「抽一本」：在当前可见的书里随机挑一本，滚动到它并盖上朱红借阅章
 */

import './collection';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initRandomBook() {
  const button = document.querySelector<HTMLButtonElement>('[data-book-random]');
  if (!button) return;

  const hint = document.querySelector<HTMLElement>('[data-random-hint]');
  const root = button.closest<HTMLElement>('[data-collection]');
  let hintTimer: number | undefined;

  const say = (text: string) => {
    if (!hint) return;
    hint.textContent = text;
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      hint.textContent = '';
    }, 3600);
  };

  button.addEventListener('click', () => {
    const items = root
      ? Array.from(root.querySelectorAll<HTMLElement>('[data-item]')).filter((item) => !item.hidden)
      : [];
    if (!items.length) {
      say('当前筛选下没有可抽的书，先放宽条件。');
      return;
    }

    const item = items[Math.floor(Math.random() * items.length)];
    if (!item) return;

    items.forEach((other) => other.classList.remove('is-picked'));
    item.classList.add('is-picked');
    item.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });

    const title = item.querySelector('h3')?.textContent?.trim() ?? '一本旧书';
    say(`就借《${title}》吧。`);

    window.setTimeout(() => item.classList.remove('is-picked'), 2200);
  });
}

/**
 * 结果为空时把整面书架收起来，只留下空状态提示
 */
function initShelfFrame() {
  const root = document.querySelector<HTMLElement>('[data-collection]');
  const frame = document.querySelector<HTMLElement>('[data-shelf-frame]');
  if (!root || !frame) return;

  const countEl = root.querySelector<HTMLElement>('[data-result-count]');
  const sync = () => {
    frame.hidden = Number(countEl?.textContent ?? '0') === 0;
  };

  root.addEventListener('collection:change', sync);
  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      initRandomBook();
      initShelfFrame();
    },
    { once: true },
  );
} else {
  initRandomBook();
  initShelfFrame();
}

export {};
