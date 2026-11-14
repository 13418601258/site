import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BRAND = "";
const ABOUT =
  "喜欢设计的秩序，也喜欢代码的可能性。在这里，我记录从灵感到实现的过程，探索产品、数据与数字空间之间的联系。";
const ABOUT_PAGE = {
  intro:
    "我是一名在设计与开发之间工作的创作者，关注清晰的结构、细腻的交互和能够真正解决问题的产品。",
  details:
    "我喜欢从一个模糊的想法开始，把它整理成可理解的界面、可靠的代码和可以被使用的体验。这里的内容会随着新的项目和新的问题持续更新。",
};

const projects = JSON.parse(
  await readFile(new URL("./projects.json", import.meta.url), "utf8"),
);
const readTemplate = (name) =>
  readFile(new URL(`./src/${name}`, import.meta.url), "utf8");
const template = await readTemplate("template.html");
const projectsTemplate = await readTemplate("projects.html");
const aboutTemplate = await readTemplate("about.html");
const projectTemplate = await readTemplate("project.html");

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pad2 = (n) => String(n).padStart(2, "0");
const projectData = JSON.stringify(projects).replace(/</g, "\\u003c");

const projectSections = projects
  .map((project, i) => {
    const tags = (project.tags ?? [])
      .map((tag) => `<span>${esc(tag)}</span>`)
      .join("");
    const sample = project.sample
      ? '<p class="space-sample">概念项目 / CONCEPT STUDY</p>'
      : "";
    return `    <section class="space-section space-project" id="work-${i + 1}" data-label="${esc(
      project.title.toUpperCase(),
    )}" data-exhibit="${i % 3}" aria-labelledby="project-title-${i}">
        <div class="space-copy">
            <p class="space-eyebrow"><span>${pad2(i + 2)} /</span> ${esc(project.category)}</p>
            <h2 id="project-title-${i}">${esc(project.title)}<span>.</span></h2>
            <h3>${esc(project.subtitle)}</h3>
            <p class="space-description">${esc(project.excerpt)}</p>
            <div class="space-tags">${tags}</div>
            <a class="space-button" href="project.html?id=${i}">探索这个项目 <span>↗</span></a>
            ${sample}
        </div>
        <div class="space-work-number" aria-hidden="true">${pad2(i + 1)}<small>SELECTED WORK</small></div>
    </section>`;
  })
  .join("\n");

const railItems = projects
  .map(
    (project, i) =>
      `    <a href="#work-${i + 1}" aria-label="${esc(project.title)}"><span>${pad2(i + 2)}</span><i></i></a>`,
  )
  .join("\n");

const common = {
  brand: esc(BRAND),
  count: pad2(projects.length),
  year: new Date().getFullYear(),
  data: projectData,
};

const homeHtml = template
  .replaceAll("__BRAND__", common.brand)
  .replaceAll("__ABOUT__", esc(ABOUT))
  .replaceAll("__PROJECT_SECTIONS__", projectSections)
  .replaceAll("__RAIL_ITEMS__", railItems)
  .replaceAll("__PROJECT_DATA__", common.data)
  .replaceAll("__COUNT_02__", common.count)
  .replaceAll("__ABOUT_INDEX_02__", pad2(projects.length + 2))
  .replaceAll("__YEAR__", String(common.year));

const pageHtml = (source, replacements) =>
  Object.entries({ ...common, ...replacements }).reduce(
    (html, [key, value]) =>
      html.replaceAll(`__${key.toUpperCase()}__`, String(value)),
    source,
  );

const output = new URL("./dist/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL("./index.html", output), homeHtml);
await writeFile(
  new URL("./projects.html", output),
  pageHtml(projectsTemplate, { PROJECT_DATA: common.data }),
);
await writeFile(
  new URL("./about.html", output),
  pageHtml(aboutTemplate, {
    ABOUT_INTRO: esc(ABOUT_PAGE.intro),
    ABOUT_DETAILS: esc(ABOUT_PAGE.details),
  }),
);
await writeFile(
  new URL("./project.html", output),
  pageHtml(projectTemplate, { PROJECT_DATA: common.data }),
);

await build({
  entryPoints: ["src/portfolio.js", "src/page-gallery.js", "src/project.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outdir: "dist/assets",
  loader: { ".woff2": "file" },
  legalComments: "eof",
});

console.log(
  `Portfolio built: index.html, projects.html, about.html, project.html + assets (${projects.length} projects)`,
);
