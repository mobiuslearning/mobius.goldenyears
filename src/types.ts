/**
 * 全站数据类型定义。
 * 数据文件（src/data/**）必须遵循这些类型；页面组件只依赖这里。
 */

/* ============================== 图片 ============================== */

/**
 * 实拍图/插图（用于详情页画廊）。
 * 仅收录授权清晰的图片（CC0 / CC BY / CC BY-SA / 公有领域），必须保留署名与来源。
 */
export interface ImageCredit {
  /** 本地路径，如 /images/objects/tuoluo.webp */
  src: string;
  alt: string;
  /** 图片标题 */
  title?: string;
  /** 作者/摄影者 */
  author?: string;
  /** 协议简称，如 CC BY-SA 4.0 / Public domain */
  license?: string;
  licenseUrl?: string;
  /** 原始页面地址（Wikimedia Commons 等） */
  sourceUrl?: string;
}

/* ============================== 时光轴 ============================== */

export type EventScope = 'global' | 'china';

export type EventCategory =
  | '科技'
  | '文化'
  | '娱乐'
  | '体育'
  | '社会'
  | '生活'
  | '政治'
  | '灾难';

export interface TimeEvent {
  /** 全站唯一，建议 `${year}-${scope}-${slug}` */
  id: string;
  year: number;
  /** 可选的具体日期，如 "1984-01-24" */
  date?: string;
  scope: EventScope;
  category: EventCategory;
  title: string;
  /** 2–3 句话，80–140 字，有画面感和时代细节 */
  description: string;
  /** 3–5 个关键词，用于检索与展示 */
  tags?: string[];
  /** 可选：影响/意义的一句话补充 */
  impact?: string;
  /** 是否为该年度的「年度大事件」（每年恰好一条为 true） */
  highlight?: boolean;
}

/* =============================== 音乐 =============================== */

export type MusicRegion = '华语' | '港台' | '欧美' | '日韩' | '其他';

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  region: MusicRegion;
  /** 专辑名，可选 */
  album?: string;
  /** 曲风，如 流行 / 摇滚 / 民谣 / 粤语 / 影视金曲 */
  genre?: string;
  /** 一句最难忘的歌词 */
  lyric?: string;
  /** 100 字以内的时代注解 */
  description: string;
  /** 可选封面图（/images/... 或外链）；缺省时使用程序化复古封面 */
  cover?: string;
  /** 可选试听音频（放到 public/audio/ 下再填写，如 /audio/xxx.mp3） */
  audio?: string;
  /** 是否首页/精选推荐 */
  featured?: boolean;
  /** 可选主图（详情页）；缺省时使用程序化封面 */
  image?: string;
  /** 可选详情页画廊（授权明确的图片） */
  gallery?: ImageCredit[];
  /** 可选长文：创作背景 / 私人记忆（详情页展示，200–400 字） */
  story?: string;
}

/* =============================== 书籍 =============================== */

export type BookCountry = '中国' | '港台' | '欧美' | '日韩' | '其他';

export type BookCategory =
  | '文学'
  | '小说'
  | '科幻'
  | '武侠'
  | '青春'
  | '漫画'
  | '科普'
  | '历史'
  | '绘本'
  | '其他';

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  country: BookCountry;
  category: BookCategory;
  /** 100 字以内推荐语 */
  description: string;
  /** 书中最难忘的一句话 */
  quote?: string;
  /** 可选封面；缺省时使用程序化复古封面 */
  cover?: string;
  featured?: boolean;
  /** 可选主图（详情页）；缺省时使用程序化封面 */
  image?: string;
  /** 可选详情页画廊（授权明确的图片） */
  gallery?: ImageCredit[];
  /** 可选长文：阅读记忆 / 书籍背景（详情页展示，200–400 字） */
  story?: string;
}

/* =============================== 影视 =============================== */

export type MovieType = '电影' | '电视剧' | '动画片';

export interface Movie {
  id: string;
  title: string;
  year: number;
  type: MovieType;
  region: MusicRegion;
  director?: string;
  cast?: string;
  genre: string;
  /** 120 字以内的剧情/回忆 */
  description: string;
  /** 经典台词 */
  quote?: string;
  /** 主题曲 */
  themeSong?: {
    title: string;
    artist: string;
  };
  /** 可选海报；缺省时使用程序化复古海报 */
  cover?: string;
  featured?: boolean;
  /** 可选主图（详情页）；缺省时使用程序化海报 */
  image?: string;
  /** 可选详情页画廊（授权明确的图片） */
  gallery?: ImageCredit[];
  /** 可选长文：观看记忆 / 幕后故事（详情页展示，200–400 字） */
  story?: string;
}

/* ============================= 老物件 ============================= */

export type NostalgiaCategory =
  | '玩具'
  | '游戏'
  | '物件'
  | '零食'
  | '影音'
  | '数码'
  | '校园';

export interface NostalgiaItem {
  id: string;
  name: string;
  /** 别名/叫法，如「打陀螺」别名「抽嘎嘎」 */
  aliases?: string[];
  /** 流行起始年份 */
  yearStart: number;
  yearEnd?: number;
  category: NostalgiaCategory;
  /** 100 字以内，写出怎么玩/怎么用 */
  description: string;
  /** 玩法/使用步骤，1–3 条 */
  howTo?: string[];
  /** 一段私人化共同记忆，80 字以内 */
  memory?: string;
  featured?: boolean;
  /** 可选实拍主图（详情页） */
  image?: string;
  /** 可选详情页画廊（CC 授权实拍图，含署名） */
  gallery?: ImageCredit[];
  /** 可选长文：物件的身世 / 玩法回忆（详情页展示，200–400 字） */
  story?: string;
}

/** 老物件博物馆中的扩展分组（零食、动画片、广告语、游戏机……） */
export interface ExtraGroup {
  id: string;
  title: string;
  /** 一句话说明这个分组 */
  subtitle: string;
  /** 2–12 条 */
  items: ExtraItem[];
}

export interface ExtraItem {
  name: string;
  year?: number;
  description: string;
  tag?: string;
}

/* =============================== 其他 =============================== */

export interface Era {
  id: '1980s' | '1990s' | '2000s';
  label: string;
  years: string;
  name: string;
  /** 一句话概括这个年代的气质 */
  mood: string;
  color: 'vermilion' | 'jade' | 'mustard';
}
