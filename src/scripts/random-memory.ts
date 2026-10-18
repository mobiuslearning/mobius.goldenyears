/**
 * 首页「随机翻一页」：从全站数据里随机抽一条记忆。
 * 池子由页面以 <script type="application/json" data-memory-pool> 注入。
 */

interface Memory {
  kind: string;
  title: string;
  meta: string;
  text: string;
}

function init() {
  const poolEl = document.querySelector<HTMLScriptElement>('[data-memory-pool]');
  const card = document.querySelector<HTMLElement>('[data-memory-card]');
  if (!poolEl || !card) return;

  let pool: Memory[] = [];
  try {
    pool = JSON.parse(poolEl.textContent ?? '[]') as Memory[];
  } catch {
    return;
  }
  if (!pool.length) return;

  const kindEl = card.querySelector<HTMLElement>('[data-memory-kind]');
  const titleEl = card.querySelector<HTMLElement>('[data-memory-title]');
  const metaEl = card.querySelector<HTMLElement>('[data-memory-meta]');
  const textEl = card.querySelector<HTMLElement>('[data-memory-text]');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-memory-shuffle]');
  let lastIndex = -1;

  const render = () => {
    if (pool.length > 1) {
      let index = lastIndex;
      while (index === lastIndex) index = Math.floor(Math.random() * pool.length);
      lastIndex = index;
    } else {
      lastIndex = 0;
    }
    const item = pool[lastIndex];
    if (kindEl) kindEl.textContent = item.kind;
    if (titleEl) titleEl.textContent = item.title;
    if (metaEl) metaEl.textContent = item.meta;
    if (textEl) textEl.textContent = item.text;

    card.classList.remove('is-shuffling');
    void card.offsetWidth;
    card.classList.add('is-shuffling');
  };

  buttons.forEach((button) => button.addEventListener('click', render));
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

export {};
