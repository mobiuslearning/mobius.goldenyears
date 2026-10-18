import type { MusicRegion } from '../types';

/** 稳定字符串哈希，保证同一作品每次构建得到同样的「复古封面」 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function pick<T>(list: readonly T[], seed: number): T {
  return list[seed % list.length];
}

export type CoverKind = 'music' | 'book' | 'movie' | 'toy';

export interface Palette {
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  paper: string;
  pattern: 'rays' | 'waves' | 'grid' | 'dots' | 'arc';
}

const palettes: Palette[] = [
  { bg: '#c23b2a', bg2: '#8f2418', ink: '#fbf7ec', accent: '#e8b04b', paper: '#f4ecdc', pattern: 'rays' },
  { bg: '#2f6a5c', bg2: '#1d4a41', ink: '#fbf7ec', accent: '#d9b96a', paper: '#f4ecdc', pattern: 'waves' },
  { bg: '#d19c37', bg2: '#a9781f', ink: '#221c16', accent: '#fbf7ec', paper: '#f4ecdc', pattern: 'grid' },
  { bg: '#243b53', bg2: '#16263a', ink: '#f4ecdc', accent: '#d9755a', paper: '#f4ecdc', pattern: 'dots' },
  { bg: '#7a4a5e', bg2: '#573240', ink: '#fbf7ec', accent: '#e0b66a', paper: '#f4ecdc', pattern: 'arc' },
  { bg: '#3d5a44', bg2: '#263a2b', ink: '#f7efdc', accent: '#d6a03c', paper: '#f4ecdc', pattern: 'rays' },
  { bg: '#b85c38', bg2: '#8a3b21', ink: '#fbf7ec', accent: '#f0d18a', paper: '#f4ecdc', pattern: 'waves' },
  { bg: '#5a6b7a', bg2: '#394754', ink: '#fbf7ec', accent: '#e0b66a', paper: '#f4ecdc', pattern: 'grid' },
];

export function paletteFor(seed: string, kind: CoverKind): Palette {
  const kindOffset = { music: 0, book: 3, movie: 5, toy: 1 }[kind] ?? 0;
  return palettes[(hashString(seed) + kindOffset) % palettes.length];
}

export function coverSeed(...parts: Array<string | number | undefined>): string {
  return parts.filter(Boolean).join('|');
}

/** 1980s / 1990s / 2000s，超范围返回 'classic' */
export function eraOfYear(year: number): '1980s' | '1990s' | '2000s' | 'classic' {
  if (year >= 1980 && year <= 1989) return '1980s';
  if (year >= 1990 && year <= 1999) return '1990s';
  if (year >= 2000 && year <= 2009) return '2000s';
  return 'classic';
}

export function decadeLabel(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/** 华语地区细分，用于筛选 */
export function regionGroup(region: MusicRegion): '华语' | '海外' {
  return region === '华语' || region === '港台' ? '华语' : '海外';
}

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function groupByYear<T extends { year: number }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of [...items].sort((a, b) => a.year - b.year)) {
    const list = map.get(item.year) ?? [];
    list.push(item);
    map.set(item.year, list);
  }
  return map;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** 生成 1–3 个「那年你几岁」文案用的年龄 */
export function ageInYear(birthYear: number, year: number): number {
  return year - birthYear;
}

export const accentMap = {
  vermilion: {
    text: 'text-vermilion',
    bg: 'bg-vermilion',
    soft: 'bg-vermilion/10',
    border: 'border-vermilion',
  },
  jade: {
    text: 'text-jade',
    bg: 'bg-jade',
    soft: 'bg-jade/10',
    border: 'border-jade',
  },
  mustard: {
    text: 'text-mustard',
    bg: 'bg-mustard',
    soft: 'bg-mustard/15',
    border: 'border-mustard',
  },
  sky: {
    text: 'text-sky',
    bg: 'bg-sky',
    soft: 'bg-sky/10',
    border: 'border-sky',
  },
} as const;

export type AccentKey = keyof typeof accentMap;
