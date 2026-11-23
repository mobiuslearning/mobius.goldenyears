import type { ImageCredit } from '../types';

/**
 * AI 复原图集：由 scripts/import-gallery.py 根据「克鲁鲁大王」索引生成。
 * 图片为 AI 生成、非原剧剧照，展示时标注「AI 复原 · 非原剧照」。
 *
 * 当前为空：images_by_ip3.zip 只包含索引和指针，没有图片本体。
 * 把真正的 images_full/ 放到 .import/ 后运行脚本即可填充。
 */
export const galleries: Record<string, ImageCredit[]> = {};

export function galleryFor(id: string): ImageCredit[] {
  return galleries[id] ?? [];
}
