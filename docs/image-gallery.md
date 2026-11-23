# 影像馆（七牛云）

## 数据来源

- 索引：`images_by_ip3.zip` 中的 `图片索引.json`（226 个作品 / 57 个 IP / 5025 张）
- 图片：已上传七牛云空间 `mobius-blog`，域名 `https://img.mobius.cool`
- 映射表：`七牛上传映射表.json`（`flat` 数组，含每张图的 `url / key / ip / work`）

> 这些图片由抖音创作者「克鲁鲁大王」整理，属于影视角色影像，**不是电影/电视剧原版剧照或海报**。
> 站内统一标注「角色影像 · 非原剧照」，版权与肖像相关权利归创作者及原权利人。

## 生成的数据（已提交）

- `src/data/galleries.ts`：与本站影视匹配的 **11 部** 图集（每部 12 张），影视详情页自动展示，点击可放大。
- `src/data/imageGallery.ts`：全部 **57 个 IP**、**5025 张**图片统计，每个 IP 选 8 张预览，供 `/gallery/` 使用。
- 页面：`/gallery/`（导航「影像馆」），支持分类筛选和 IP/角色搜索，图片点击为站内放大预览。
- 所有图片 `src` 直接使用七牛云 URL（带 `?imageView2/2/w/600` 或 `/w/900` 缩略图参数）；
  放大时加载七牛原图，不复制任何图片到本地仓库。
- 加载失败时 `image-fallback` 脚本自动回退到原图 URL。

## 重新生成

把用户提供的原始文件放在项目根目录（已加入 `.gitignore`，不会提交）：

```
七牛上传映射表.json
.import/图片索引.json
```

然后执行：

```bash
python3 scripts/build-image-gallery.py
```

脚本会重新生成 `src/data/galleries.ts` 与 `src/data/imageGallery.ts`。

## 调整数量

- 影视详情页每部图片数：`--movie-limit 12`
- 影像馆每个 IP 预览数：`--ip-limit 8`

```bash
python3 scripts/build-image-gallery.py --movie-limit 16 --ip-limit 12
```

## 版权

- 图片 CDN：`https://img.mobius.cool/影视剧/<IP>/<作品编号>/<序号>.webp`
- 创作者：克鲁鲁大王（抖音）
- 图片性质：影视角色影像 / 非原剧照
- 如创作者或原权利人要求，可在 `src/data/galleries.ts`、`src/data/imageGallery.ts` 删除对应条目，
  页面会自动隐藏相关图集。
