/**
 * 音乐页交互：
 * 1. 首屏黑胶旋转的暂停 / 继续（尊重 prefers-reduced-motion）
 * 2. 试听按钮（只有歌曲存在 audio 字段时才会渲染）——全页同时只播一首
 * 3. 筛选器的「重置筛选」按钮与状态同步
 * 通用筛选 / 搜索逻辑在 scripts/collection.ts，这里只做增强。
 */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------ 黑胶旋转 ------------------------------ */
function initVinylToggle() {
  const button = document.querySelector<HTMLButtonElement>('[data-vinyl-toggle]');
  const disc = document.querySelector<HTMLElement>('[data-vinyl-disc]');
  if (!button || !disc) return;

  // 减少动态效果时，黑胶本来就是静止的，不提供会「无效」的按钮
  if (prefersReduced) {
    button.hidden = true;
    return;
  }

  const label = button.querySelector<HTMLElement>('[data-vinyl-label]');
  const dot = button.querySelector<HTMLElement>('[data-vinyl-dot]');
  let paused = false;

  const paint = () => {
    disc.classList.toggle('is-paused', paused);
    button.setAttribute('aria-pressed', String(!paused));
    button.setAttribute('aria-label', paused ? '继续黑胶旋转' : '暂停黑胶旋转');
    if (label) label.textContent = paused ? '已暂停' : '旋转中';
    if (dot) {
      dot.classList.toggle('bg-vermilion', !paused);
      dot.classList.toggle('bg-ink-faint', paused);
    }
  };

  button.addEventListener('click', () => {
    paused = !paused;
    paint();
  });
  paint();
}

/* ------------------------------- 试听 ------------------------------- */
function initAudio() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle]'));
  if (!buttons.length) return;

  const cache = new Map<string, HTMLAudioElement>();
  let current: HTMLAudioElement | null = null;
  let currentSrc: string | null = null;

  const paint = (button: HTMLButtonElement, state: 'idle' | 'playing' | 'error') => {
    button.setAttribute('aria-pressed', String(state === 'playing'));
    const text = button.querySelector<HTMLElement>('[data-audio-text]');
    if (text) text.textContent = state === 'error' ? '无法播放' : state === 'playing' ? '暂停' : '试听';
    button.classList.toggle('bg-mustard/30', state === 'playing');
    button.classList.toggle('border-ink', state === 'playing');
  };

  const paintAllIdle = () => {
    buttons.forEach((button) => paint(button, 'idle'));
  };

  const stop = () => {
    if (current) current.pause();
    current = null;
    currentSrc = null;
    paintAllIdle();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const src = button.dataset.audioSrc;
      if (!src) return;

      if (button.getAttribute('aria-pressed') === 'true') {
        stop();
        return;
      }

      let audio = cache.get(src);
      if (!audio) {
        audio = new Audio(src);
        audio.preload = 'none';
        cache.set(src, audio);
        audio.addEventListener('ended', () => {
          current = null;
          currentSrc = null;
          paintAllIdle();
        });
        audio.addEventListener('error', () => {
          paint(button, 'error');
          current = null;
          currentSrc = null;
        });
      }

      if (current && current !== audio) current.pause();

      current = audio;
      currentSrc = src;
      paintAllIdle();
      paint(button, 'playing');

      const started = audio.play();
      if (started && typeof started.catch === 'function') {
        started.catch(() => {
          if (currentSrc !== src) return;
          paint(button, 'error');
          current = null;
          currentSrc = null;
        });
      }
    });
  });
}

/* --------------------------- 筛选器增强 --------------------------- */
function initFilterMeta() {
  const root = document.querySelector<HTMLElement>('[data-collection]');
  if (!root) return;

  const reset = root.querySelector<HTMLButtonElement>('[data-filter-reset]');
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');

  const hasActiveFilter = () =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter][aria-pressed="true"]')).some(
      (button) => (button.dataset.filterValue ?? 'all') !== 'all',
    );

  const sync = () => {
    if (!reset) return;
    reset.disabled = !(hasActiveFilter() || Boolean(input?.value.trim()));
  };

  root.addEventListener('collection:change', sync);
  input?.addEventListener('input', sync);

  reset?.addEventListener('click', () => {
    root.querySelectorAll<HTMLButtonElement>('[data-filter-value="all"]').forEach((button) => {
      if (button.getAttribute('aria-pressed') !== 'true') button.click();
    });
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    }
    sync();
  });

  sync();
}

function boot() {
  initVinylToggle();
  initAudio();
  initFilterMeta();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
