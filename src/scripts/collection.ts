/**
 * 通用「筛选 + 搜索」行为（音乐 / 书籍 / 影视 / 老物件页面共用）
 *
 * 用法（页面 markup 约定）：
 *   <div data-collection>
 *     <button data-filter data-filter-key="scope" data-filter-value="china">中国</button>
 *     <input data-search-input />
 *     <span data-result-count></span>
 *     <article data-item data-scope="china" data-era="1990s"
 *              data-search="霸王别姬 陈凯歌 电影">…</article>
 *     <p data-empty hidden>没有找到符合条件的记忆。</p>
 *   </div>
 *
 * - 单选型筛选：同一 data-filter-key 下只有一个 active；value="all" 表示不过滤。
 * - 多选型筛选：按钮加 data-filter-multi，可同时激活多个值（OR）。
 * - data-search 文本需小写并包含标题/作者/年份等关键词。
 */

type State = Record<string, Set<string>>;

const ACTIVE_CHIP = ['bg-ink', 'text-cream', 'border-ink'];
const IDLE_CHIP = ['bg-cream', 'text-ink-soft', 'border-ink/25'];

function initCollection(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const searchInput = root.querySelector<HTMLInputElement>('[data-search-input]');
  const countEl = root.querySelector<HTMLElement>('[data-result-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const state: State = {};

  const paint = (button: HTMLButtonElement, active: boolean) => {
    button.setAttribute('aria-pressed', String(active));
    ACTIVE_CHIP.forEach((c) => button.classList.toggle(c, active));
    IDLE_CHIP.forEach((c) => button.classList.toggle(c, !active));
  };

  buttons.forEach((button) => {
    const key = button.dataset.filterKey ?? 'all';
    const value = button.dataset.filterValue ?? 'all';
    const multi = button.hasAttribute('data-filter-multi');
    const group = button.parentElement;
    const siblings = group ? Array.from(group.querySelectorAll<HTMLButtonElement>(`[data-filter][data-filter-key="${key}"]`)) : [];
    const active =
      (value === 'all' && !state[key]?.size) ||
      (state[key]?.has(value) ?? false);
    paint(button, active);

    button.addEventListener('click', () => {
      if (value === 'all') {
        state[key] = new Set();
      } else if (multi) {
        const set = state[key] ?? new Set<string>();
        if (set.has(value)) set.delete(value);
        else set.add(value);
        state[key] = set;
      } else {
        state[key] = state[key]?.has(value) ? new Set() : new Set([value]);
      }

      siblings.forEach((sibling) => {
        const siblingValue = sibling.dataset.filterValue ?? 'all';
        const isActive =
          siblingValue === 'all'
            ? !state[key]?.size
            : (state[key]?.has(siblingValue) ?? false);
        paint(sibling, isActive);
      });
      apply();
    });
  });

  function apply() {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    let visible = 0;

    items.forEach((item) => {
      const matchesFilters = Object.entries(state).every(([key, values]) => {
        if (!values.size) return true;
        const tokens = (item.dataset[key] ?? '').split(/\s+/).filter(Boolean);
        return [...values].some((value) => tokens.includes(value));
      });
      const haystack = item.dataset.search ?? item.textContent?.toLowerCase() ?? '';
      const matchesQuery = !query || haystack.toLowerCase().includes(query);
      const show = matchesFilters && matchesQuery;
      item.hidden = !show;
      if (show) {
        visible += 1;
        item.classList.remove('is-filtered-in');
        void item.offsetWidth;
        item.classList.add('is-filtered-in');
      }
    });

    if (countEl) countEl.textContent = String(visible);
    if (emptyEl) emptyEl.hidden = visible !== 0;
    root.dispatchEvent(
      new CustomEvent('collection:change', { detail: { visible, state, query } }),
    );
  }

  let debounce: number | undefined;
  searchInput?.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(apply, 140);
  });

  // 键盘 "/" 聚焦搜索
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || !searchInput) return;
    const target = event.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    event.preventDefault();
    searchInput.focus();
  });

  apply();
}

function boot() {
  document.querySelectorAll<HTMLElement>('[data-collection]').forEach(initCollection);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
