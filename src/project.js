const projects = JSON.parse(document.querySelector("#space-project-data").textContent);
const root = document.querySelector("#space-detail-content");
const params = new URLSearchParams(location.search);
const rawIndex = params.get("id");
const index = rawIndex !== null && /^\d+$/.test(rawIndex) ? Number(rawIndex) : -1;
const project = projects[index];

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

if (!project) {
  root.innerHTML = '<section class="space-detail-error"><p class="space-eyebrow"><span>404 /</span> PROJECT NOT FOUND</p><h1>没有找到这个<span>项目。</span></h1><p>请返回精选项目列表，选择一个项目继续浏览。</p><a class="space-button" href="projects.html">返回精选项目 <span>↗</span></a></section>';
} else {
  document.title = `${project.title} · Project Detail`;
  const tags = (project.tags ?? []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const image = project.image
    ? `<img class="space-detail-image" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} 项目预览">`
    : `<div class="space-detail-art" style="--project-color:${escapeHtml(project.color || "#b98260")}" aria-hidden="true"><span>${escapeHtml(project.title.toLowerCase())}.</span><i></i><i></i></div>`;
  const external = /^https?:\/\//i.test(project.url ?? "")
    ? `<a class="space-button" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">访问项目 <span>↗</span></a>`
    : "";
  root.innerHTML = `<article class="space-detail-article">
      <p class="space-eyebrow"><span>${String(index + 1).padStart(2, "0")} /</span> ${escapeHtml(project.category)}</p>
      ${project.sample ? '<p class="space-sample">概念项目 / CONCEPT STUDY</p>' : ""}
      <h1>${escapeHtml(project.title)}<span>.</span></h1>
      <h2>${escapeHtml(project.subtitle)}</h2>
      <p class="space-detail-lede">${escapeHtml(project.excerpt)}</p>
      <div class="space-tags">${tags}</div>
      ${image}
      <div class="space-detail-body">${project.content ?? ""}</div>
      ${external}
      <nav class="space-detail-pager" aria-label="项目导航">
        ${index > 0 ? `<a href="project.html?id=${index - 1}">← ${escapeHtml(projects[index - 1].title)}</a>` : "<span></span>"}
        ${index < projects.length - 1 ? `<a href="project.html?id=${index + 1}">${escapeHtml(projects[index + 1].title)} →</a>` : "<span></span>"}
      </nav>
    </article>`;
}
