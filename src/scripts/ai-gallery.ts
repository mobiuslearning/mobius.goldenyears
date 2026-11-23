/**
 * AI 影像馆筛选：分类 + 搜索。
 */
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-filter]'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-ip-section]'));
const searchInput = document.querySelector<HTMLInputElement>('[data-gallery-search]');
const countEl = document.querySelector<HTMLElement>('[data-gallery-count]');
const emptyEl = document.querySelector<HTMLElement>('[data-gallery-empty]');

if (buttons.length && sections.length) {
  const ACTIVE = ['bg-ink', 'text-cream', 'border-ink'];
  const IDLE = ['bg-cream', 'text-ink-soft', 'border-ink/25'];
  let active = '全部';

  const paint = () => {
    buttons.forEach((button) => {
      const isActive = button.dataset.value === active;
      button.setAttribute('aria-pressed', String(isActive));
      ACTIVE.forEach((name) => button.classList.toggle(name, isActive));
      IDLE.forEach((name) => button.classList.toggle(name, !isActive));
    });
  };

  const apply = () => {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    let visible = 0;
    sections.forEach((section) => {
      const category = section.dataset.category ?? '';
      const haystack = (section.dataset.search ?? '').toLowerCase();
      const matchCategory = active === '全部' || category === active;
      const matchQuery = !query || haystack.includes(query);
      const show = matchCategory && matchQuery;
      section.hidden = !show;
      if (show) visible += 1;
    });
    if (countEl) countEl.textContent = String(visible);
    if (emptyEl) emptyEl.hidden = visible !== 0;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      active = button.dataset.value ?? '全部';
      paint();
      apply();
    });
  });

  let timer: number | undefined;
  searchInput?.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(apply, 120);
  });

  paint();
  apply();
}

export {};
