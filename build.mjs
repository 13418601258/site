import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const BRAND = "text.cn";
const ABOUT =
  "喜欢设计的秩序，也喜欢代码的可能性。在这里，我记录从灵感到实现的过程，探索产品、数据与数字空间之间的联系。";

const projects = JSON.parse(
  await readFile(new URL("./projects.json", import.meta.url), "utf8"),
);
const template = await readFile(
  new URL("./src/template.html", import.meta.url),
  "utf8",
);

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pad2 = (n) => String(n).padStart(2, "0");

// 项目 section 循环（对齐原 home.php 的 foreach）
const projectSections = projects
  .map((project, i) => {
    const tags = project.tags
      .map((tag) => `<span>${esc(tag)}</span>`)
      .join("");
    const sample = project.sample
      ? '<p class="space-sample">概念项目 / CONCEPT STUDY</p>'
      : "";
    return `    <section class="space-section space-project" id="work-${i + 1}" data-label="${esc(
      project.title.toUpperCase(),
    )}" data-exhibit="${i % 3}" aria-labelledby="project-title-${i}">
        <div class="space-copy">
            <p class="space-eyebrow"><span>${pad2(i + 2)} /</span> ${esc(
      project.category,
    )}</p>
            <h2 id="project-title-${i}">${esc(project.title)}<span>.</span></h2>
            <h3>${esc(project.subtitle)}</h3>
            <p class="space-description">${esc(project.excerpt)}</p>
            <div class="space-tags">${tags}</div>
            <button class="space-button" type="button" data-project="${i}" aria-haspopup="dialog">探索这个项目 <span>↗</span></button>
            ${sample}
        </div>
        <div class="space-work-number" aria-hidden="true">${pad2(
          i + 1,
        )}<small>SELECTED WORK</small></div>
    </section>`;
  })
  .join("\n");

// 侧边 rail 循环
const railItems = projects
  .map(
    (project, i) =>
      `    <a href="#work-${i + 1}" aria-label="${esc(
        project.title,
      )}"><span>${pad2(i + 2)}</span><i></i></a>`,
  )
  .join("\n");

// 内联 JSON：转义 < 防止提前闭合 script 标签
const projectData = JSON.stringify(projects).replace(/</g, "\\u003c");

const count = projects.length;
const html = template
  .replaceAll("__BRAND__", esc(BRAND))
  .replaceAll("__ABOUT__", esc(ABOUT))
  .replaceAll("__PROJECT_SECTIONS__", projectSections)
  .replaceAll("__RAIL_ITEMS__", railItems)
  .replaceAll("__PROJECT_DATA__", projectData)
  .replaceAll("__COUNT_02__", pad2(count))
  .replaceAll("__ABOUT_INDEX_02__", pad2(count + 2))
  .replaceAll("__YEAR__", new Date().getFullYear());

await mkdir(new URL("./dist", import.meta.url), { recursive: true });
await writeFile(new URL("./dist/index.html", import.meta.url), html);

await build({
  entryPoints: ["src/portfolio.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outdir: "dist/assets",
  loader: { ".woff2": "file" },
  legalComments: "eof",
});

console.log(
  `WordPress portfolio built: index.html + assets/portfolio.js + assets/portfolio.css (${count} projects)`,
);
