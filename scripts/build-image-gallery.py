#!/usr/bin/env python3
"""
根据七牛上传映射表生成：
1) src/data/galleries.ts —— 与本站影视匹配的角色影像图集（详情页使用）
2) src/data/imageGallery.ts —— 全部 57 个 IP 的影像馆数据（/gallery/ 使用）

图片全部引用七牛云 URL，不复制本地文件。
用法：python3 scripts/build-image-gallery.py
"""
import argparse
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_MAPPING = '七牛上传映射表.json'
DEFAULT_INDEX = '.import/图片索引.json'
AUTHOR = '克鲁鲁大王'
LICENSE = '角色影像 · 非原剧照'


def norm(value: str) -> str:
    value = unicodedata.normalize('NFKC', value or '')
    value = re.sub(r'[《》「」\s·:：\-—_()（）第季部集之]', '', value)
    return value.lower()


def parse_movies():
    text = open(os.path.join(ROOT, 'src/data/culture/movies.ts')).read()
    result = []
    for block in re.split(r'\n  \{\n', text)[1:]:
        block = block.split('\n  },')[0]

        def field(name):
            m = re.search(rf"{name}: '((?:\\\\.|[^'\\\\])*)'", block)
            return m.group(1).replace("\\'", "'") if m else ''

        def num(name):
            m = re.search(rf'{name}: (\d+)', block)
            return int(m.group(1)) if m else None

        if field('id'):
            result.append({'id': field('id'), 'title': field('title'), 'year': num('year'), 'type': field('type')})
    return result


def match_movie(movie, works_by_ip):
    title = norm(movie['title'])
    if len(title) < 2:
        return []
    for ip, works in works_by_ip.items():
        n_ip = norm(ip)
        if not n_ip:
            continue
        if n_ip == title or (len(title) >= 3 and (n_ip.startswith(title) or title.startswith(n_ip))):
            return works
    return []


def ts(value: str) -> str:
    return (value or '').replace('\\', '\\\\').replace("'", "\\'")


def thumb(url: str, width: int) -> str:
    sep = '&' if '?' in url else '?'
    return f'{url}{sep}imageView2/2/w/{width}'


def select_images(images, limit):
    """按作品分散取样：每部作品先取 1 张，不够再取第 2 张。"""
    by_work = defaultdict(list)
    for image in images:
        by_work[image['work']].append(image)
    works = sorted(by_work.keys())
    for images_for_work in by_work.values():
        images_for_work.sort(key=lambda x: x['name'])
    picked = []
    index = 0
    while len(picked) < limit:
        added = False
        for work in works:
            if index < len(by_work[work]):
                picked.append(by_work[work][index])
                added = True
                if len(picked) >= limit:
                    break
        if not added:
            break
        index += 1
    return picked


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mapping', default=DEFAULT_MAPPING)
    parser.add_argument('--index', default=DEFAULT_INDEX)
    parser.add_argument('--movie-limit', type=int, default=12)
    parser.add_argument('--ip-limit', type=int, default=8)
    args = parser.parse_args()

    mapping_path = args.mapping if os.path.isabs(args.mapping) else os.path.join(ROOT, args.mapping)
    index_path = args.index if os.path.isabs(args.index) else os.path.join(ROOT, args.index)
    mapping = json.load(open(mapping_path))
    flat = mapping.get('flat') or []
    works_meta = {}
    index = {}
    if os.path.exists(index_path):
        index = json.load(open(index_path)).get('meta') or {}
        works_meta = {v.get('dir'): v for v in index.values()}

    by_ip = defaultdict(list)
    for image in flat:
        ip = image.get('ip') or '未识别'
        by_ip[ip].append(image)

    def characters_for(work):
        meta = works_meta.get(work) or {}
        names = []
        for character in meta.get('characters') or []:
            name = character.get('name', '')
            if not name:
                continue
            name = re.sub(r'\s*AI\s*复原', '', name)
            name = re.sub(r'[（(]\s*[）)]', '', name).strip()
            names.append(name)
        return '、'.join(names[:3])

    def credit(image, ip, category, width=900):
        work = image.get('work') or ''
        chars = characters_for(work)
        alt = f'{ip} 角色影像：{chars}' if chars else f'{ip} 角色影像'
        return {
            'src': thumb(image['url'], width),
            'alt': alt,
            'title': f'{ip} · 角色影像',
            'author': AUTHOR,
            'license': LICENSE,
            'sourceUrl': image['url'],
        }

    # 1) 匹配本站影视的详情页图集
    movies = parse_movies()
    galleries = {}
    for movie in movies:
        works = match_movie(movie, by_ip)
        if not works:
            continue
        selected = select_images(works, args.movie_limit)
        galleries[movie['id']] = [credit(image, movie['title'], movie['type'], 900) for image in selected]
    print(f'影视详情页图集：{len(galleries)} 部，共 {sum(len(v) for v in galleries.values())} 张')

    galleries_lines = [
        "import type { ImageCredit } from '../types';",
        '',
        '/**',
        ' * 影像馆图集（引用七牛云图片 URL）。',
        ' * 详情页会标注「角色影像 · 非原剧照」。',
        ' * 由 scripts/build-image-gallery.py 生成。',
        ' */',
        'export const galleries: Record<string, ImageCredit[]> = {',
    ]
    for movie_id, images in galleries.items():
        galleries_lines.append(f"  '{ts(movie_id)}': [")
        for image in images:
            galleries_lines += [
                '    {',
                f"      src: '{ts(image['src'])}',",
                f"      alt: '{ts(image['alt'])}',",
                f"      title: '{ts(image['title'])}',",
                f"      author: '{ts(image['author'])}',",
                f"      license: '{ts(image['license'])}',",
                f"      sourceUrl: '{ts(image['sourceUrl'])}',",
                '    },',
            ]
        galleries_lines.append('  ],')
    galleries_lines += ['};', '', 'export function galleryFor(id: string): ImageCredit[] {', '  return galleries[id] ?? [];', '}', '']
    open(os.path.join(ROOT, 'src/data/galleries.ts'), 'w').write('\n'.join(galleries_lines))

    # 2) 全部 IP 的影像馆
    category_rank = {'电影': 0, '电视剧': 1, '动画': 2, '游戏': 3, '未分类': 4}
    ips = []
    for ip, images in by_ip.items():
        metas = [works_meta.get(image.get('work')) for image in images]
        cats = Counter((m or {}).get('category') for m in metas if m)
        cat = next((c for c, _ in cats.most_common() if c and c != '未知'), '未分类')
        years = sorted({str((m or {}).get('year')) for m in metas if (m or {}).get('year')})
        works = sorted({image.get('work') for image in images if image.get('work')})
        selected = select_images(images, args.ip_limit)
        ips.append({
            'ip': ip,
            'category': cat,
            'years': years,
            'count': len(images),
            'works': len(works),
            'images': [credit(image, ip, cat, 600) for image in selected],
        })
    ips.sort(key=lambda x: (category_rank.get(x['category'], 5), -x['count'], x['ip']))
    for i, item in enumerate(ips):
        item['id'] = f'ip-{i + 1:02d}'
    total_images = len(flat)
    print(f'影像馆：{len(ips)} 个 IP，展示 {sum(len(x["images"]) for x in ips)} 张（总 {total_images} 张）')

    lines = [
        "import type { ImageCredit } from '../types';",
        '',
        'export interface ImageGalleryIp {',
        '  id: string;',
        '  ip: string;',
        '  category: string;',
        '  years: string[];',
        '  count: number;',
        '  works: number;',
        '  images: ImageCredit[];',
        '}',
        '',
        '/** 由 scripts/build-image-gallery.py 生成，图片全部引用七牛云 URL。 */',
        f'export const imageGalleryStats = {{ ips: {len(ips)}, images: {total_images}, works: {len(works_meta) or 226} }};',
        '',
        'export const imageGalleryIps: ImageGalleryIp[] = [',
    ]
    for item in ips:
        years = ', '.join(f"'{ts(y)}'" for y in item['years'])
        lines.append('  {')
        lines.append(f"    id: '{item['id']}',")
        lines.append(f"    ip: '{ts(item['ip'])}',")
        lines.append(f"    category: '{ts(item['category'])}',")
        lines.append(f"    years: [{years}],")
        lines.append(f"    count: {item['count']},")
        lines.append(f"    works: {item['works']},")
        lines.append('    images: [')
        for image in item['images']:
            lines += [
                '      {',
                f"        src: '{ts(image['src'])}',",
                f"        alt: '{ts(image['alt'])}',",
                f"        title: '{ts(image['title'])}',",
                f"        author: '{ts(image['author'])}',",
                f"        license: '{ts(image['license'])}',",
                f"        sourceUrl: '{ts(image['sourceUrl'])}',",
                '      },',
            ]
        lines.append('    ],')
        lines.append('  },')
    lines += ['];', '']
    open(os.path.join(ROOT, 'src/data/imageGallery.ts'), 'w').write('\n'.join(lines))

    categories = Counter(item['category'] for item in ips)
    print('分类分布：', dict(categories))
    for item in ips[:15]:
        print(f"  {item['category']} {item['ip']} · {item['count']} 张 / {item['works']} 作品")


if __name__ == '__main__':
    main()
