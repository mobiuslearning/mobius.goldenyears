/**
 * 通用图片灯箱：点击 [data-lightbox-item] 在原页放大预览。
 * 同一 data-group 的图片为一组，支持左右切换、键盘操作、背景关闭。
 */
const overlay = document.querySelector<HTMLElement>('[data-lightbox]');

if (overlay) {
  const image = overlay.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const caption = overlay.querySelector<HTMLElement>('[data-lightbox-caption]');
  const counter = overlay.querySelector<HTMLElement>('[data-lightbox-counter]');
  const loading = overlay.querySelector<HTMLElement>('[data-lightbox-loading]');
  const closeButton = overlay.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  const prevButton = overlay.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
  const nextButton = overlay.querySelector<HTMLButtonElement>('[data-lightbox-next]');

  let items: HTMLElement[] = [];
  let index = 0;
  let lastFocus: HTMLElement | null = null;
  let previousOverflow = '';

  const render = () => {
    const item = items[index];
    if (!item || !image) return;
    const full = item.dataset.full ?? '';
    const text = item.dataset.caption ?? '';
    image.alt = text;
    image.src = full;
    if (caption) caption.textContent = text;
    if (counter) counter.textContent = `${index + 1} / ${items.length}`;
    if (loading) {
      loading.textContent = 'LOADING';
      loading.classList.remove('hidden');
    }
    if (prevButton) prevButton.classList.toggle('hidden', items.length < 2);
    if (nextButton) nextButton.classList.toggle('hidden', items.length < 2);
  };

  const open = (trigger: HTMLElement) => {
    const group = trigger.dataset.group ?? 'default';
    items = Array.from(document.querySelectorAll<HTMLElement>(`[data-lightbox-item][data-group="${group}"]`));
    index = Math.max(0, items.indexOf(trigger));
    lastFocus = trigger;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    overlay.setAttribute('aria-hidden', 'false');
    render();
    closeButton?.focus();
  };

  const close = () => {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow;
    lastFocus?.focus();
  };

  const go = (direction: number) => {
    if (items.length < 2) return;
    index = (index + direction + items.length) % items.length;
    render();
  };

  document.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-lightbox-item]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger);
  });

  closeButton?.addEventListener('click', close);
  prevButton?.addEventListener('click', () => go(-1));
  nextButton?.addEventListener('click', () => go(1));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  image?.addEventListener('load', () => loading?.classList.add('hidden'));
  image?.addEventListener('error', () => {
    if (loading) {
      loading.textContent = '图片加载失败';
      loading.classList.remove('hidden');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  });
}

export {};
