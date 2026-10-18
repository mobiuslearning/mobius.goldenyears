/**
 * 全站交互：滚动入场、移动菜单、阅读进度、回到顶部、CRT 复古滤镜。
 * 所有动效尊重 prefers-reduced-motion。
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------ 滚动入场 ------------------------------ */
function initReveal() {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!items.length) return;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((item) => observer.observe(item));
}

/* ------------------------------ 移动端菜单 ------------------------------ */
function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  if (!toggle || !panel) return;

  const icon = toggle.querySelector<HTMLElement>('[data-menu-icon]');
  const setOpen = (open: boolean) => {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (icon) {
      const bars = icon.children;
      bars[0]?.classList.toggle('translate-y-[5px]', open);
      bars[0]?.classList.toggle('rotate-45', open);
      bars[1]?.classList.toggle('opacity-0', open);
      bars[2]?.classList.toggle('-translate-y-[5px]', open);
      bars[2]?.classList.toggle('-rotate-45', open);
    }
  };

  toggle.addEventListener('click', () => setOpen(panel.classList.contains('hidden')));
  panel.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

/* ------------------------------ 阅读进度 ------------------------------ */
function initScrollProgress() {
  const bar = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const top = document.querySelector<HTMLButtonElement>('[data-back-to-top]');
  let ticking = false;

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const progress = max > 0 ? Math.min(Math.max(doc.scrollTop / max, 0), 1) : 0;
    if (bar) bar.style.width = `${progress * 100}%`;
    if (top) {
      const show = doc.scrollTop > 700;
      top.classList.toggle('opacity-0', !show);
      top.classList.toggle('translate-y-3', !show);
      top.classList.toggle('pointer-events-none', !show);
      top.tabIndex = show ? 0 : -1;
    }
    ticking = false;
  };

  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();

  top?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
}

/* ------------------------------ CRT 复古滤镜 ------------------------------ */
function initCrtMode() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-crt-toggle]'));
  if (!buttons.length) return;

  const stored = (() => {
    try {
      return localStorage.getItem('gy-theme') === 'crt';
    } catch {
      return false;
    }
  })();

  const apply = (enabled: boolean) => {
    document.documentElement.classList.toggle('crt-mode', enabled);
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(enabled));
      const dot = button.querySelector<HTMLElement>('[data-crt-dot]');
      dot?.classList.toggle('bg-vermilion', enabled);
      dot?.classList.toggle('bg-jade', !enabled);
    });
    try {
      localStorage.setItem('gy-theme', enabled ? 'crt' : 'light');
    } catch {
      /* ignore */
    }
  };

  buttons.forEach((button) => button.addEventListener('click', () => apply(!document.documentElement.classList.contains('crt-mode'))));
  apply(stored);
}

/* ------------------------------ 年份锚点高亮 ------------------------------ */
function initTocSpy() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
  const targets = links
    .map((link) => document.querySelector<HTMLElement>(link.getAttribute('href') ?? ''))
    .filter((el): el is HTMLElement => Boolean(el));
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          link.setAttribute('aria-current', active ? 'true' : 'false');
        });
      });
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  targets.forEach((target) => observer.observe(target));
}

function boot() {
  initReveal();
  initMobileMenu();
  initScrollProgress();
  initCrtMode();
  initTocSpy();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
