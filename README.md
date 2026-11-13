# SPACE — 3D 个人展厅（静态版）

一个可以漫游的全屏 3D 个人项目展厅，基于 Three.js 与 esbuild 构建，可部署到 GitHub Pages。这是原 WordPress 展厅的纯静态化版本，去掉了 PHP 与 MySQL 依赖。

## 目录结构

```text
site/
├── build.mjs          # 构建脚本：渲染 index.html + esbuild 打包
├── projects.json      # 项目数据（在这里增删改项目）
├── package.json       # 依赖 three、esbuild
├── src/
│   ├── template.html          # 首页模板（品牌、关于我、项目循环占位）
│   ├── portfolio.js           # 前端入口：滚动联动、弹窗、视角切换
│   ├── gallery.js             # Three.js 场景：建筑、展位、相机
│   ├── day-night.js           # 展位 1 日蚀光雕
│   ├── impossible-triangle.js # 展位 3 不可能三角
│   ├── portfolio.css          # 前景蒙版、排版、响应式
│   └── fonts/                 # Inter 字体
└── dist/              # 构建产物（npm run build 生成，勿手动编辑）
```

## 编辑项目

所有内容在 `projects.json` 中维护。每个项目字段：

| 字段 | 说明 |
|------|------|
| `title` | 项目标题（首页大标题） |
| `category` | 分类，如 `WEB DEVELOPMENT` |
| `subtitle` | 副标题 |
| `excerpt` | 摘要，显示在首页 |
| `tags` | 标签数组 |
| `color` | 弹窗封面强调色（十六进制） |
| `content` | 详情弹窗正文，支持 HTML（`<p>` `<ul>` `<h3>` `<a>` `<table>` 等） |
| `image` | 封面图片 URL 或相对路径，留空则用纯色几何占位 |
| `url` | 项目访问地址，留空则不显示外链按钮 |

三个展位视角按项目顺序循环使用，最多展示 12 个。修改后运行 `npm run build` 生效。

## 修改站点信息

品牌名与「关于我」文案写在 `build.mjs` 顶部的 `BRAND` 和 `ABOUT` 常量中，改完后重新构建。

## 本地开发

```bash
cd site
npm install        # 首次
npm run build      # 生成 dist/
```

预览构建产物（任选其一）：

```bash
npx serve dist
# 或
cd dist && python -m http.server 8080
```

然后访问 http://localhost:8080 。

## 部署到 GitHub Pages

`site/` 目录本身就是仓库根，已内置 `.github/workflows/deploy.yml`。把 `site/` 目录初始化成 git 仓库并推送即可：

```bash
cd site
git init
git add .
git commit -m "init: 3D portfolio"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

首次使用需在仓库 **Settings → Pages** 中把 Source 设为 **GitHub Actions**。之后每次推送 `main` 分支即自动构建并发布，也可在 Actions 页手动触发 `workflow_dispatch`。`node_modules/` 与 `dist/` 已被 `.gitignore` 忽略，无需提交。

## 说明

- 项目详情目前使用纯色几何作为封面占位，如需真实封面，在 `projects.json` 对应项目的 `image` 字段填入图片路径，并把图片放到 `site/` 下可访问的位置。
- 3D 几何、材质与光照全部在本地生成，无外部模型、图片或 CDN 依赖；Inter 字体随构建打包。
