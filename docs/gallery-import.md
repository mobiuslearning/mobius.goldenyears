# AI 影视复原图集（七牛云）

## 数据来源

- 索引：`images_by_ip3.zip` 中的 `图片索引.json`（226 个作品 / 57 个 IP / 5025 张）
- 图片：`images.zip` 原始图，已上传七牛云空间 `mobius-blog`，域名 `https://img.mobius.cool`
- 映射表：`七牛上传映射表.json`（`flat` 数组，含每张图的 `url / key / ip / work`）

> 这些图是抖音创作者「克鲁鲁大王」的 **AI 复原作品**（原视频标注“虚构演绎，仅供娱乐”），
> **不是电影/电视剧原版剧照或海报**。站点中所有相关图片均标注「AI 复原 · 非原剧照」，
> 版权与肖像相关权利归创作者及原权利人。

## 生成的数据（已提交）

- `src/data/galleries.ts`：与本站影视匹配的 **11 部** AI 图集（每部 12 张），影视详情页自动展示。
- `src/data/aiGallery.ts`：全部 **57 个 IP**、**5025 张**图片统计，每个 IP 选 8 张预览，供 `/ai-gallery/` 使用。
- 页面：`/ai-gallery/`（导航「影像馆」），支持分类筛选和 IP/角色搜索。
- 所有图片 `src` 直接使用七牛云 URL（带 `?imageView2/2/w/600` 或 `/w/900` 缩略图参数），
  点击图片打开七牛原图；不复制任何图片到本地仓库。
- 加载失败时 `<img onerror>` 自动回退到原图 URL。

## 重新生成

把用户提供的原始文件放在项目根目录（已加入 `.gitignore`，不会提交）：

```
七牛上传映射表.json
.import/图片索引.json
```

然后执行：

```bash
python3 scripts/build-ai-gallery.py
```

脚本会重新生成 `src/data/galleries.ts` 与 `src/data/aiGallery.ts`。

## 调整数量

- 影视详情页每部图片数：`--movie-limit 12`
- 影像馆每个 IP 预览数：`--ip-limit 8`

```bash
python3 scripts/build-ai-gallery.py --movie-limit 16 --ip-limit 12
```

## 图片来源与版权

- 图片 CDN：`https://img.mobius.cool/影视剧/<IP>/<作品编号>/<序号>.webp`
- 创作者：克鲁鲁大王（抖音）
- 图片性质：AI 生成 / 非原剧照
- 如创作者或原权利人要求，可在 `src/data/galleries.ts`、`src/data/aiGallery.ts` 删除对应条目，
  页面会自动隐藏相关图集。
