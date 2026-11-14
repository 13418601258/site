import { createEditorialBackground } from "./editorial-background.js";

const projects = JSON.parse(document.querySelector("#space-project-data")?.textContent ?? "[]");
const list = document.querySelector("#space-project-list");
if (list) {
  const template = document.querySelector("#space-project-card-template");
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

const canvas = document.querySelector("#space-canvas");
if (!canvas) throw new Error("3D gallery canvas is missing.");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let motion = !reduced.matches;
let dirty = true;
let lost = false;
let last = performance.now();
let time = 0;

try {
  const about = document.body.classList.contains("space-about-page");
  const background = createEditorialBackground(canvas, about ? "about" : "projects", projects);
  const updateProgress = () => {
    dirty = true;
  };
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (lost || (!motion && !dirty)) return;
    if (motion) time += dt;
    dirty = background.render(time, motion, dt) || false;
  };
  document.body.classList.add("space-ready");
  background.render(0, motion, 0);
  background.renderer.setAnimationLoop(frame);
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", () => {
    background.resize();
    updateProgress();
  });
  addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") {
      background.setPointer(event.clientX / innerWidth - 0.5, event.clientY / innerHeight - 0.5);
      dirty = true;
    }
  }, { passive: true });
  addEventListener("pointerleave", () => {
    background.clearPointer();
    dirty = true;
  });
  addEventListener("blur", () => {
    background.clearPointer();
    dirty = true;
  });
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
    dirty = true;
    background.renderer.setAnimationLoop(document.hidden || lost ? null : frame);
  });
  reduced.addEventListener("change", () => {
    motion = !reduced.matches;
    dirty = true;
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    background.renderer.setAnimationLoop(null);
    document.body.classList.remove("space-ready");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    dirty = true;
    document.body.classList.add("space-ready");
    background.renderer.setAnimationLoop(frame);
  });
  updateProgress();
} catch (error) {
  console.warn("3D gallery unavailable; static page content remains available.", error);
}
