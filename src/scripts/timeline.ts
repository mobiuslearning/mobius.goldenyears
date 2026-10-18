/**
 * 时光轴页面交互
 *
 * - 河流：滚动时朱红色线条随阅读进度生长，河面上的光点跟着走
 * - 年份：滚动高亮当前年份 / 年份快速跳转条自动居中 / 顶部刻度条同步
 * - 筛选：监听 collection.ts 的 collection:change，隐藏没有可见事件的年份与年代章节
 * - 入场：单个 IntersectionObserver 让卡片淡入（不用全站 reveal 的 will-change）
 *
 * 性能：只挂一个 passive scroll + rAF；不在每张卡片上绑事件；尊重 prefers-reduced-motion。
 */

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* ---------------------------- 卡片滚动入场 ---------------------------- */

function setupReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-event-reveal]'));
  if (!items.length) return;

  if (reducedQuery.matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }

  items.forEach((item) => item.classList.add('is-pending'));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );

  items.forEach((item) => observer.observe(item));
}

/* ------------------------------ 时光河流 ------------------------------ */

interface YearMark {
  year: number;
  top: number;
}

function setupTimeline(): void {
  const root = document.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return;
  const track = root.querySelector<HTMLElement>('[data-timeline-track]');
  if (!track) return;

  const line = root.querySelector<HTMLElement>('[data-timeline-line]');
  const head = root.querySelector<HTMLElement>('[data-timeline-head]');
  const progressEls = Array.from(root.querySelectorAll<HTMLElement>('[data-timeline-progress]'));
  const yearEls = Array.from(root.querySelectorAll<HTMLElement>('[data-current-year]'));
  const axis = root.querySelector<HTMLElement>('[data-timeline-axis]');
  const jumpBar = root.querySelector<HTMLElement>('[data-year-jump]');
  const jumpLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-year-jump-link]'));
  const yearBlocks = Array.from(root.querySelectorAll<HTMLElement>('[data-year-block]'));
  const eraSections = Array.from(root.querySelectorAll<HTMLElement>('[data-era-section]'));

  let trackTop = 0;
  let trackHeight = 1;
  let viewportHeight = window.innerHeight;
  let marks: YearMark[] = [];
  let activeYear = -2;
  let activeLink: HTMLAnchorElement | null = null;
  let lastProgress = -1;
  let frame = 0;

  const linkByYear = new Map<number, HTMLAnchorElement>();
  jumpLinks.forEach((link) => {
    const year = Number(link.dataset.year);
    if (Number.isFinite(year)) linkByYear.set(year, link);
  });

  const isReduced = (): boolean => reducedQuery.matches;

  /** 读取河床与年份刻度的位置，只在初始化 / 尺寸变化 / 筛选后调用 */
  function measure(): void {
    viewportHeight = window.innerHeight;
    const rect = track!.getBoundingClientRect();
    trackTop = rect.top + window.scrollY;
    trackHeight = Math.max(rect.height, 1);
    marks = yearBlocks
      .filter((block) => block.offsetParent !== null)
      .map((block) => ({
        year: Number(block.dataset.year ?? 0),
        top: block.getBoundingClientRect().top + window.scrollY,
      }))
      .sort((a, b) => a.top - b.top);
    // 位置变了就强制重绘一次（河面光点、进度条）
    lastProgress = -1;
  }

  function currentYearAt(anchorY: number): number {
    if (!marks.length) return 0;
    let year = marks[0].year;
    for (const mark of marks) {
      if (mark.top > anchorY) break;
      year = mark.year;
    }
    return year;
  }

  function setActiveYear(year: number): void {
    if (year === activeYear) return;
    activeYear = year;
    yearEls.forEach((el) => {
      el.textContent = year ? String(year) : '—';
    });

    const link = year ? linkByYear.get(year) ?? null : null;
    if (link === activeLink) return;
    activeLink?.classList.remove('is-active');
    activeLink?.removeAttribute('aria-current');
    activeLink = link;
    if (!link) return;

    link.classList.add('is-active');
    link.setAttribute('aria-current', 'true');

    if (!jumpBar || jumpBar.scrollWidth <= jumpBar.clientWidth + 4) return;
    const target = clamp(
      link.offsetLeft - (jumpBar.clientWidth - link.offsetWidth) / 2,
      0,
      jumpBar.scrollWidth - jumpBar.clientWidth,
    );
    if (Math.abs(jumpBar.scrollLeft - target) < 8) return;
    jumpBar.scrollTo({ left: target, behavior: isReduced() ? 'auto' : 'smooth' });
  }

  function paint(): void {
    const anchorY = window.scrollY + viewportHeight * 0.45;
    const progress = clamp((anchorY - trackTop) / trackHeight, 0, 1);

    if (Math.abs(progress - lastProgress) > 0.0005) {
      lastProgress = progress;
      if (line && !isReduced()) line.style.transform = `scaleY(${progress})`;
      if (head && !isReduced()) head.style.transform = `translateY(${(progress * trackHeight).toFixed(1)}px)`;
      progressEls.forEach((el) => {
        el.style.transform = `scaleX(${progress})`;
      });
    }

    setActiveYear(currentYearAt(anchorY));
  }

  /* 筛选后：隐藏空年份 / 空章节，年份跳转条同步禁用 */
  function syncFilters(): void {
    const visibleByYear = new Map<number, number>();
    let anyVisible = false;

    yearBlocks.forEach((block) => {
      const year = Number(block.dataset.year ?? 0);
      let visible = 0;
      block.querySelectorAll<HTMLElement>('[data-item]').forEach((item) => {
        if (!item.hidden) visible += 1;
      });
      visibleByYear.set(year, visible);
      block.hidden = visible === 0;
      if (visible > 0) anyVisible = true;
    });

    eraSections.forEach((section) => {
      const era = section.dataset.era ?? '';
      // 年份块是章节的兄弟节点（同属河床），所以按 data-era 关联判断
      const visible = yearBlocks.some((block) => block.dataset.era === era && !block.hidden);
      section.hidden = !visible;
    });

    jumpLinks.forEach((link) => {
      const year = Number(link.dataset.year);
      const hasEvents = (visibleByYear.get(year) ?? 0) > 0;
      link.classList.toggle('is-disabled', !hasEvents);
      link.setAttribute('aria-disabled', hasEvents ? 'false' : 'true');
      link.tabIndex = hasEvents ? 0 : -1;
    });

    if (axis) axis.hidden = !anyVisible;

    measure();
    activeYear = -2;
    paint();

    if (!anyVisible) {
      activeLink?.classList.remove('is-active');
      activeLink?.removeAttribute('aria-current');
      activeLink = null;
    }
  }

  const onScroll = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };

  const onResize = (): void => {
    measure();
    paint();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      measure();
      paint();
    });
    observer.observe(track);
  }

  root.addEventListener('collection:change', syncFilters);

  measure();

  if (isReduced()) {
    if (line) line.style.transform = 'scaleY(1)';
    if (head) head.style.display = 'none';
    progressEls.forEach((el) => {
      el.style.transform = 'scaleX(1)';
    });
  }

  paint();
  syncFilters();
}

function boot(): void {
  setupReveal();
  setupTimeline();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
