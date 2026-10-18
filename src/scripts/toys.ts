/**
 * 老物件馆（/toys/）页面交互：
 * 1. 一键展开 / 收起所有展签；
 * 2. 随机看一件展品（滚动定位 + 高亮 + 打开玩法说明）；
 * 3. 把筛选结果通过 aria-live 播报给读屏软件。
 *
 * 所有滚动行为尊重 prefers-reduced-motion；筛选与搜索本身由
 * 共享的 src/scripts/collection.ts 负责。
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------- 展开 / 收起所有展签 --------------------------- */
function initExpandAll() {
  const button = document.querySelector<HTMLButtonElement>('[data-expand-all]');
  if (!button) return;

  const label = button.querySelector<HTMLElement>('[data-expand-label]');
  const getDetails = () =>
    Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-collection] details.exhibit-details'));

  const update = () => {
    const details = getDetails();
    const allOpen = details.length > 0 && details.every((detail) => detail.open);
    button.setAttribute('aria-pressed', String(allOpen));
    if (label) label.textContent = allOpen ? '收起全部展签' : '展开全部展签';
  };

  button.addEventListener('click', () => {
    const details = getDetails();
    if (!details.length) return;
    const allOpen = details.every((detail) => detail.open);
    details.forEach((detail) => {
      detail.open = !allOpen;
    });
    update();
  });

  // details 的 toggle 事件不冒泡，用捕获阶段监听，保证按钮文案始终准确
  document.addEventListener('toggle', update, true);
  update();
}

/* ------------------------------ 随机看一件 ------------------------------ */
function initRandomExhibit() {
  const button = document.querySelector<HTMLButtonElement>('[data-random-exhibit]');
  const root = document.querySelector<HTMLElement>('[data-collection]');
  if (!button || !root) return;

  const status = root.querySelector<HTMLElement>('[data-result-status]');

  button.addEventListener('click', () => {
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
    if (!items.length) return;

    // 优先在当前筛选结果里抽，避免抽到被隐藏的展品
    const visible = items.filter((item) => !item.hidden);
    const pool = visible.length > 0 ? visible : items;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    const details = picked.querySelector<HTMLDetailsElement>('details.exhibit-details');
    if (details) details.open = true;

    const card = picked.querySelector<HTMLElement>('article') ?? picked;
    picked.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });

    card.style.outline = '3px solid #c23b2a';
    card.style.outlineOffset = '4px';
    window.setTimeout(() => {
      card.style.outline = '';
      card.style.outlineOffset = '';
    }, 1600);

    const name = picked.querySelector('h3')?.textContent?.trim() ?? '一件展品';
    if (status) status.textContent = `随机打开展品：${name}`;
  });
}

/* ------------------------------ 结果播报 ------------------------------ */
function initResultAnnounce() {
  const root = document.querySelector<HTMLElement>('[data-collection]');
  const status = root?.querySelector<HTMLElement>('[data-result-status]');
  if (!root || !status) return;

  root.addEventListener('collection:change', (event) => {
    const detail = (event as CustomEvent<{ visible?: number }>).detail;
    const visible = detail?.visible ?? 0;
    status.textContent =
      visible > 0 ? `展柜中现有 ${visible} 件展品` : '没有符合条件的展品，请调整筛选或搜索';
  });
}

function boot() {
  initExpandAll();
  initRandomExhibit();
  initResultAnnounce();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
