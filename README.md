# 涂凯莉 · 个人主页

这个网站用于记录我的作品、学习过程和个人思考。构建并部署后，可以从精选项目页查看作品，从关于我页面查看简历。

## 目录说明

```text
site/
├── build.mjs          # 生成页面、复制简历并打包前端资源
├── projects.json      # 作品摘要与详情数据
├── src/
│   ├── template.html  # 首页模板
│   ├── about.html     # 关于我页面模板
│   ├── portfolio.js   # 首页交互与 3D 展厅
│   ├── gallery.js     # 首页 Three.js 场景
│   ├── page-gallery.js   # 精选项目和关于我页面背景
│   ├── project.js     # 项目详情渲染
│   ├── portfolio.css  # 页面样式与响应式布局
│   └── source/
│       └── 涂凯莉_简历.pdf
└── dist/              # npm run build 生成的静态文件
```

简历源文件放在 `src/source/涂凯莉_简历.pdf`，构建时会复制为 `dist/assets/resume.pdf`，关于我页面的查看和下载入口都指向这个稳定地址。
