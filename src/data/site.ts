import type { Era } from '../types';

export const site = {
  title: '流金岁月 · 时光机',
  shortTitle: '流金岁月',
  tagline: '把 1980–2009 装进一台机器，按下播放键',
  description:
    '一台属于 80 后、90 后的时光机：华语金曲、青春书单、港台与内地影视、每一年的大事记，还有打陀螺、溜溜球、万能充电器这些带着体温的老物件。',
  keywords: ['80后', '90后', '怀旧', '流金岁月', '时光机', '老物件', '华语金曲', '童年回忆'],
  author: '流金岁月 · 时光机',
  startYear: 1980,
  endYear: 2009,
  /** 时光机的「黄金年代」区间，用于首屏与统计 */
  goldenRange: [1985, 2005] as [number, number],
  /**
   * Twikoo 评论（预留）。部署 Twikoo 后填写环境 ID 即可启用；
   * 也可以在构建时通过环境变量 PUBLIC_TWIKOO_ENV_ID 注入。
   */
  twikoo: {
    envId: '',
    /** 可选：自建 Twikoo 后端地址（如 https://twikoo.example.com） */
    cdn: 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js',
    placeholder: '说点什么吧，就当是写给当年自己的明信片……',
  },
  nav: [
    { label: '首页', href: '/' },
    { label: '时光轴', href: '/timeline/' },
    { label: '音乐', href: '/music/' },
    { label: '书籍', href: '/books/' },
    { label: '影视', href: '/movies/' },
    { label: '老物件', href: '/toys/' },
    { label: '时光机', href: '/time-machine/' },
    { label: '关于', href: '/about/' },
  ],
};

export const eras: Era[] = [
  {
    id: '1980s',
    label: '1980s',
    years: '1980–1989',
    name: '磁带与露天电影',
    mood: '录音机里翻来覆去的一首歌，是那一代人最早的「单曲循环」。',
    color: 'vermilion',
  },
  {
    id: '1990s',
    label: '1990s',
    years: '1990–1999',
    name: '录像厅与四大天王',
    mood: '港片、粤语歌、小霸王，还有放学后不肯回家的小孩。',
    color: 'jade',
  },
  {
    id: '2000s',
    label: '2000s',
    years: '2000–2009',
    name: '网吧与 MP3',
    mood: 'QQ 头像亮起来的那一刻，整个青春都上线了。',
    color: 'mustard',
  },
];

export const sections = [
  {
    href: '/timeline/',
    index: '01',
    title: '时光轴',
    en: 'Timeline',
    description: '从 1980 到 2009，每一年中国与世界发生了什么。',
    accent: 'vermilion',
  },
  {
    href: '/music/',
    index: '02',
    title: '音乐',
    en: 'Music',
    description: '卡带、CD 与 MP3 里，那些循环过一百遍的歌。',
    accent: 'jade',
  },
  {
    href: '/books/',
    index: '03',
    title: '书籍',
    en: 'Books',
    description: '课桌下偷偷翻过的书，和第一次被文字击中的瞬间。',
    accent: 'mustard',
  },
  {
    href: '/movies/',
    index: '04',
    title: '影视',
    en: 'Movies',
    description: '录像厅、电视机、暑期档，和全家围坐的夜晚。',
    accent: 'sky',
  },
  {
    href: '/toys/',
    index: '05',
    title: '老物件',
    en: 'Objects',
    description: '打陀螺、溜溜球、万能充电器……手上还留着温度。',
    accent: 'vermilion',
  },
  {
    href: '/time-machine/',
    index: '06',
    title: '时光机',
    en: 'Time Machine',
    description: '输入你的出生年份，生成一张属于你的年代记忆卡。',
    accent: 'jade',
  },
];
