/**
 * 老物件馆（/toys/）与关于页共用的展示逻辑。
 * 只做「数据 → 展示参数」的映射，不涉及任何 DOM。
 */
import type { ExtraGroup, NostalgiaItem } from '../../types';

/** 类别 → 展签强调色（取设计 token 的深色版本，保证小字对比度） */
const CATEGORY_TONES: Record<string, string> = {
  玩具: '#c23b2a',
  游戏: '#2f6a5c',
  物件: '#9a6b16',
  零食: '#b3552f',
  影音: '#4d7285',
  数码: '#243b53',
  校园: '#8a5a2b',
};

export function categoryTone(category: string): string {
  return CATEGORY_TONES[category] ?? '#6b5a4a';
}

/** 由起始年份得到年代筛选值；超出 80/90/00 的按十年取整，保持可用 */
export function eraOfYear(year: number): string {
  if (year >= 1980 && year <= 1989) return '1980s';
  if (year >= 1990 && year <= 1999) return '1990s';
  if (year >= 2000 && year <= 2009) return '2000s';
  return `${Math.floor(year / 10) * 10}s`;
}

export function yearsLabel(item: NostalgiaItem): string {
  return item.yearEnd ? `${item.yearStart}—${item.yearEnd}` : `${item.yearStart} 年起`;
}

/** 展品搜索索引：名字、别名、类别、描述、玩法、记忆、年份 */
export function exhibitSearchText(item: NostalgiaItem): string {
  return [
    item.name,
    item.category,
    item.description,
    item.memory ?? '',
    ...(item.aliases ?? []),
    ...(item.howTo ?? []),
    String(item.yearStart),
    item.yearEnd ? String(item.yearEnd) : '',
  ]
    .join(' ')
    .toLowerCase();
}

export type ExtraLayout = 'shelf' | 'tv' | 'ad';

/**
 * 为扩展分组选择陈列排版：
 * 已知分组按语义匹配（小卖部 → 货架，动画片 → 节目单，广告金句 → 广告墙），
 * 其余分组按标题关键词匹配，最后按序号轮换，保证任意数量都有节奏变化。
 */
export function layoutForGroup(group: ExtraGroup, index: number): ExtraLayout {
  const byId: Record<string, ExtraLayout> = {
    snacks: 'shelf',
    cartoons: 'tv',
    slogans: 'ad',
  };
  if (byId[group.id]) return byId[group.id];

  const keyword = `${group.title} ${group.subtitle}`;
  if (/零食|小卖部|货架|糖果|饮料|食品|零食铺/.test(keyword)) return 'shelf';
  if (/动画|电视|节目|影音|播出|频道|录像/.test(keyword)) return 'tv';
  if (/广告|金句|口号|文案|slogan/i.test(keyword)) return 'ad';

  return (['shelf', 'tv', 'ad'] as const)[index % 3];
}

/** 陈列排版的展示名 */
export const layoutLabels: Record<ExtraLayout, { en: string; cn: string }> = {
  shelf: { en: 'Shelf A', cn: '小卖部货架' },
  tv: { en: 'Channel 05', cn: '电视节目单' },
  ad: { en: 'Wall B', cn: '广告墙' },
};
