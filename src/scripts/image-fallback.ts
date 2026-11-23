/**
 * 图片加载兜底：七牛缩略图失败时回退到原图 URL。
 * 用法：<img data-fallback="原图地址" />，BaseLayout 统一加载。
 */
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    const fallback = target.dataset.fallback;
    if (!fallback || target.src === fallback) return;
    delete target.dataset.fallback;
    target.src = fallback;
  },
  true,
);
