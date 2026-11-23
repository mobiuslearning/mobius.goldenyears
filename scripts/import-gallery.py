#!/usr/bin/env python3
"""
导入「克鲁鲁大王」AI 影视复原图集（索引 + images_full 文件夹）。

背景：images_by_ip3.zip 只有索引和指针文本，没有图片本体。
本脚本等待你提供 images_full/（每个作品一个子文件夹，内含图片），
按索引匹配本站影视条目，复制图片到 public/images/gallery/<movie-id>/，
并生成 src/data/galleries.ts，影视详情页会自动出现「AI 复原图集」。

用法：
  python3 scripts/import-gallery.py \
    --index .import/图片索引.json \
    --images .import/images_full \
    --write

不加 --write 时只做匹配预览，不复制文件、不写 galleries.ts。
"""

import argparse
import json
import os
import re
import sys
import unicodedata

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


def norm(value: str) -> str:
    value = unicodedata.normalize('NFKC', value or '')
    value = re.sub(r'[《》「」\s·:：\-—_()（）第季部集之]', '', value)
    return value.lower()


def parse_movies() -> list[dict]:
    text = open(os.path.join(ROOT, 'src/data/culture/movies.ts')).read()
    blocks = re.split(r'\n  \{\n', text)[1:]
    result = []
    for block in blocks:
        block = block.split('\n  },')[0]

        def field(name: str) -> str:
            match = re.search(rf"{name}: '((?:\\\\.|[^'\\\\])*)'", block)
            return match.group(1).replace("\\'", "'") if match else ''

        def number(name: str) -> int | None:
            match = re.search(rf'{name}: (\d+)', block)
            return int(match.group(1)) if match else None

        if field('id'):
            result.append(
                {
                    'id': field('id'),
                    'title': field('title'),
                    'year': number('year'),
                    'type': field('type'),
                }
            )
    return result


def match_title(movie: dict, works_by_ip: dict[str, list[dict]]) -> list[dict]:
    title = norm(movie['title'])
    if len(title) < 2:
        return []
    best = []
    for ip, works in works_by_ip.items():
        n_ip = norm(ip)
        if not n_ip:
            continue
        if n_ip == title or (len(title) >= 3 and (n_ip.startswith(title) or title.startswith(n_ip))):
            # 年度尽量对齐：优先同年的作品，其次不限制
            same_year = [w for w in works if str(w.get('year')) == str(movie['year'])]
            best = same_year or works
            break
    return best


def work_images(images_root: str, work: dict) -> list[str]:
    """在一个作品目录里找图片；兼容 images_full/<dir>/ 与 images_full/<sheet>。"""
    candidates = []
    directory = work.get('dir') or ''
    if directory:
        base = os.path.join(images_root, directory)
        if os.path.isdir(base):
            for root, _dirs, files in os.walk(base):
                for name in files:
                    if os.path.splitext(name)[1].lower() in IMAGE_EXTS:
                        candidates.append(os.path.join(root, name))
    sheet = work.get('sheet') or ''
    if sheet:
        direct = os.path.join(images_root, sheet)
        if os.path.isfile(direct):
            candidates.append(direct)
        for root, _dirs, files in os.walk(images_root):
            if sheet in files:
                candidates.append(os.path.join(root, sheet))
                break
    return sorted(set(candidates))


def to_webp(src: str, dst: str) -> bool:
    try:
        image = Image.open(src).convert('RGB')
        image.thumbnail((1600, 1600), Image.LANCZOS)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        quality = 82
        image.save(dst, 'WEBP', quality=quality, method=6)
        while os.path.getsize(dst) > 300 * 1024 and quality > 60:
            quality -= 6
            image.save(dst, 'WEBP', quality=quality, method=6)
        return True
    except Exception:
        return False


def write_galleries(galleries: dict[str, list[dict]]) -> None:
    lines = [
        "import type { ImageCredit } from '../types';",
        '',
        '/**',
        ' * AI 复原图集：由 scripts/import-gallery.py 根据「克鲁鲁大王」索引生成。',
        ' * 图片为 AI 生成、非原剧剧照，展示时标注「AI 复原 · 非原剧照」。',
        ' */',
        'export const galleries: Record<string, ImageCredit[]> = {',
    ]
    for movie_id, images in galleries.items():
        lines.append(f"  '{movie_id}': [")
        for image in images:
            lines.append('    {')
            lines.append(f"      src: '{image['src']}',")
            lines.append(f"      alt: '{image['alt']}',")
            lines.append(f"      title: '{image['title']}',")
            lines.append(f"      author: '{image['author']}',")
            lines.append(f"      license: '{image['license']}',")
            lines.append('    },')
        lines.append('  ],')
    lines += [
        '};',
        '',
        'export function galleryFor(id: string): ImageCredit[] {',
        '  return galleries[id] ?? [];',
        '}',
        '',
    ]
    open(os.path.join(ROOT, 'src/data/galleries.ts'), 'w').write('\n'.join(lines))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--index', default='.import/图片索引.json')
    parser.add_argument('--images', default='.import/images_full')
    parser.add_argument('--max', type=int, default=6, help='每个影视条目最多导入几张')
    parser.add_argument('--write', action='store_true', help='真正复制图片并生成 galleries.ts')
    args = parser.parse_args()

    index_path = args.index if os.path.isabs(args.index) else os.path.join(ROOT, args.index)
    images_root = args.images if os.path.isabs(args.images) else os.path.join(ROOT, args.images)

    if not os.path.exists(index_path):
        print(f'找不到索引：{index_path}')
        print('请把 图片索引.json 放到 .import/ 下（或通过 --index 指定）。')
        return 1
    if not os.path.isdir(images_root):
        print(f'找不到图片目录：{images_root}')
        print('images_by_ip3.zip 里没有图片本体；请把真正的 images_full/ 文件夹放到 .import/ 下。')
        print('预期结构：.import/images_full/<作品目录>/<图片文件>')
        return 1

    index = json.load(open(index_path))
    meta = index.get('meta') or {}
    works = list(meta.values())
    works_by_ip: dict[str, list[dict]] = {}
    for work in works:
        ip = (work.get('final_ip') or work.get('ip') or '').strip()
        if ip:
            works_by_ip.setdefault(ip, []).append(work)

    movies = parse_movies()
    matched: list[tuple[dict, list[dict]]] = []
    for movie in movies:
        works_for_movie = match_title(movie, works_by_ip)
        if works_for_movie:
            matched.append((movie, works_for_movie))

    print(f'索引作品：{len(works)} 个 / IP：{len(works_by_ip)} 个；本站影视：{len(movies)} 部')
    print(f'可匹配的影视条目：{len(matched)} 部')
    for movie, works_for_movie in matched:
        print(f"  {movie['year']} {movie['title']} ← {len(works_for_movie)} 个作品")

    galleries: dict[str, list[dict]] = {}
    for movie, works_for_movie in matched:
        picked: list[dict] = []
        for work in works_for_movie:
            for src in work_images(images_root, work):
                if len(picked) >= args.max:
                    break
                picked.append({'work': work, 'src': src})
            if len(picked) >= args.max:
                break
        if not picked:
            print(f"  跳过 {movie['title']}：匹配到作品但目录里没有图片")
            continue
        images = []
        for i, item in enumerate(picked, start=1):
            work = item['work']
            chars = '、'.join(c.get('name', '') for c in (work.get('characters') or [])[:3])
            alt = chars or work.get('title_guess') or movie['title']
            rel = f"/images/gallery/{movie['id']}/{movie['id']}-{i}.webp"
            dst = os.path.join(ROOT, 'public', rel.lstrip('/'))
            if args.write:
                if not to_webp(item['src'], dst):
                    continue
            images.append(
                {
                    'src': rel,
                    'alt': f"{movie['title']} AI 复原图：{alt}",
                    'title': f"AI 复原 · {work.get('title_guess') or movie['title']}",
                    'author': '克鲁鲁大王（抖音 AI 复原）',
                    'license': 'AI 生成 · 非原剧照',
                }
            )
        if images:
            galleries[movie['id']] = images
            print(f"  {movie['title']}：{len(images)} 张")

    print(f'共 {len(galleries)} 部影视可获得 AI 图集，合计 {sum(len(v) for v in galleries.values())} 张。')
    if args.write:
        write_galleries(galleries)
        print('已生成 src/data/galleries.ts；运行 pnpm dev 查看详情页图集。')
    else:
        print('当前为预览模式；确认无误后加 --write 执行导入。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
