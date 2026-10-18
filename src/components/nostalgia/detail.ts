/**
 * 老物件详情页（/toys/<id>/）的展示逻辑：
 * 图片合并、正文分段、那一年事件、同类推荐、上一件 / 下一件。
 * 只做数据映射，不涉及 DOM；图片库为空时全部返回空数组 / undefined，页面自行降级。
 */
import type { ImageCredit, NostalgiaItem, TimeEvent } from '../../types';
import { imagesFor } from '../../data/images';
import { allEvents } from '../../data/events';
import { toys } from '../../data/nostalgia/toys';

/**
 * 合并一个物件的所有实拍图，顺序即优先级：
 * 1. imagesFor(id)（image-curator 维护的图片库，详情页 Hero 首选）
 * 2. data 里的 gallery（数据成员填写的授权图）
 * 3. data 里的 image（单图，无署名信息）
 * 按 src 去重，第一张即详情页 Hero 主图。
 */
export function collectImages(item: NostalgiaItem): ImageCredit[] {
  const list: ImageCredit[] = [];
  const push = (credit: ImageCredit | undefined) => {
    if (!credit?.src) return;
    if (list.some((existing) => existing.src === credit.src)) return;
    list.push(credit);
  };

  imagesFor(item.id).forEach(push);
  (item.gallery ?? []).forEach(push);
  if (item.image) {
    push({ src: item.image, alt: `${item.name} 实拍图` });
  }

  return list;
}

/** story 是 200–400 字长文，允许用空行分段 */
export function storyParagraphs(story?: string): string[] {
  return (story ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** 按流行起始年份排序，同一年按名称；用于上一件 / 下一件 */
export function sortedToys(): NostalgiaItem[] {
  return [...toys].sort(
    (a, b) => a.yearStart - b.yearStart || a.name.localeCompare(b.name, 'zh-Hans-CN'),
  );
}

export function neighborsOf(id: string): {
  prev?: NostalgiaItem;
  next?: NostalgiaItem;
  position: number;
} {
  const sorted = sortedToys();
  const position = sorted.findIndex((entry) => entry.id === id);
  return {
    prev: position > 0 ? sorted[position - 1] : undefined,
    next: position >= 0 && position < sorted.length - 1 ? sorted[position + 1] : undefined,
    position,
  };
}

/**
 * 同类推荐：优先同类别，最多 4 件；
 * 同类别不足 3 件时，用年份最接近的其他展品补足 3 件（标题会改成「同类与同期」）。
 */
export function relatedFor(
  item: NostalgiaItem,
  limit = 4,
): { items: NostalgiaItem[]; allSameCategory: boolean } {
  const sameCategory = toys.filter(
    (entry) => entry.id !== item.id && entry.category === item.category,
  );
  const picked = sameCategory.slice(0, limit);

  if (picked.length < 3) {
    const pool = toys
      .filter((entry) => entry.id !== item.id && !picked.some((chosen) => chosen.id === entry.id))
      .sort(
        (a, b) =>
          Math.abs(a.yearStart - item.yearStart) - Math.abs(b.yearStart - item.yearStart) ||
          a.name.localeCompare(b.name, 'zh-Hans-CN'),
      );
    const fill = Math.min(3 - picked.length, limit - picked.length);
    picked.push(...pool.slice(0, Math.max(fill, 0)));
  }

  return {
    items: picked.slice(0, limit),
    allSameCategory: picked.length > 0 && picked.every((entry) => entry.category === item.category),
  };
}

/** 那一年：优先取年度大事件（highlight），再按原顺序补足 */
export function eventsForYear(year: number, limit = 3): TimeEvent[] {
  const list = allEvents.filter((event) => event.year === year);
  return list
    .slice()
    .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
    .slice(0, limit);
}

/** 年代标签，如 1980s；用于 Hero 小标签 */
export function decadeLabelOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/** 那一年 / 年度页链接（timeline-page 负责生成 /timeline/<year>/） */
export function yearHref(year: number): string {
  return `/timeline/${year}/`;
}
