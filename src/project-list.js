const projects = JSON.parse(document.querySelector("#space-project-data")?.textContent ?? "[]");
const list = document.querySelector("#space-project-list");
const template = document.querySelector("#space-project-card-template");

if (list && template) {
  projects.forEach((project, index) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".space-list-index").textContent = String(index + 1).padStart(2, "0");
    fragment.querySelector(".space-list-category").textContent = project.category;
    fragment.querySelector(".space-list-title").textContent = project.title;
    fragment.querySelector(".space-list-excerpt").textContent = project.excerpt;
    fragment.querySelector(".space-list-tags").replaceChildren(
      ...(project.tags ?? []).map((tag) => {
        const element = document.createElement("span");
        element.textContent = tag;
        return element;
      }),
    );
    fragment.querySelector(".space-list-link").href = `project.html?id=${index}`;
    list.append(fragment);
  });
}
