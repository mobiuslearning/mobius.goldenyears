/**
 * 影视页交互：
 * - 通用筛选 / 搜索（collection.ts 约定）
 * - 「今夜放映」精选大卡：在 featured 影片之间切换（上一部 / 下一部 / 圆点）
 */

import './collection';

function initFeaturedReel() {
  const reel = document.querySelector<HTMLElement>('[data-featured-reel]');
  if (!reel) return;

  const slides = Array.from(reel.querySelectorAll<HTMLElement>('[data-featured-slide]'));
  if (slides.length <= 1) return;

  const prev = reel.querySelector<HTMLButtonElement>('[data-featured-prev]');
  const next = reel.querySelector<HTMLButtonElement>('[data-featured-next]');
  const dots = Array.from(reel.querySelectorAll<HTMLButtonElement>('[data-featured-dot]'));
  const position = reel.querySelector<HTMLElement>('[data-featured-pos]');
  const pad = (value: number) => String(value).padStart(2, '0');
  let current = 0;

  const show = (index: number) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== current;
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.setAttribute('aria-pressed', String(active));
      dot.classList.toggle('bg-mustard', active);
      dot.classList.toggle('bg-cream/25', !active);
    });
    if (position) position.textContent = pad(current + 1);
  };

  prev?.addEventListener('click', () => show(current - 1));
  next?.addEventListener('click', () => show(current + 1));
  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => show(dotIndex));
  });

  // 键盘左右切换（焦点在「今夜放映」区域内时）
  reel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!reel.contains(document.activeElement)) return;
    event.preventDefault();
    show(event.key === 'ArrowLeft' ? current - 1 : current + 1);
  });

  show(0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeaturedReel, { once: true });
} else {
  initFeaturedReel();
}

export {};
