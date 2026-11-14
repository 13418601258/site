import * as THREE from "three";
import { createGallery } from "./gallery.js";
import "./portfolio.css";

const $ = (selector) => document.querySelector(selector);
const sections = [...document.querySelectorAll(".space-section")];
const rail = [...document.querySelectorAll(".space-rail a")];
const projects = JSON.parse($("#space-project-data").textContent);
const dialog = $("#space-dialog");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let motion = !reduced.matches;
let manualMotion = false;
let stops = [];
let progress = 0;
let active = -1;
let dirty = true;
let gallery;

// All content remains server-rendered by WordPress; JavaScript only adds interactions.
document.querySelectorAll("[data-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.project);
    const project = projects[index];
    $("#space-dialog-index").textContent = String(index + 1).padStart(2, "0");
    $("#space-dialog-title").textContent = project.title;
    $("#space-dialog-description").textContent = project.excerpt;
    $("#space-dialog-sample").hidden = !project.sample;
    $("#space-dialog-body").innerHTML = project.content;
    $("#space-dialog-art").style.setProperty("--project-color", project.color);
    $("#space-dialog-art span").textContent = project.title.toLowerCase() + ".";
    $("#space-dialog-art").hidden = Boolean(project.image);
    const image = $("#space-dialog-image");
    image.hidden = !project.image;
    if (project.image) {
      image.src = project.image;
      image.alt = project.title + " 项目预览";
    } else image.removeAttribute("src");
    const link = $("#space-dialog-link");
    link.hidden = !/^https?:\/\//i.test(project.url);
    if (!link.hidden) link.href = project.url;
    else link.removeAttribute("href");
    dialog.showModal();
    dialog.scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
  });
});
$("#space-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => {
  document.documentElement.style.overflow = "";
});
dialog.addEventListener("click", (event) => {
  const r = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom)
  )
    dialog.close();
});

function scroll() {
  const y = scrollY;
  let index = stops.findIndex(
    (stop, i) => i < stops.length - 1 && y < stops[i + 1],
  );
  if (index < 0) index = stops.length - 1;
  progress =
    index +
    (index < stops.length - 1
      ? THREE.MathUtils.clamp(
          (y - stops[index]) / (stops[index + 1] - stops[index]),
          0,
          1,
        )
      : 0);
  const next = Math.min(sections.length - 1, Math.round(progress));
  $(".space-progress").style.transform =
    `scaleX(${THREE.MathUtils.clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1)})`;
  if (next !== active) {
    active = next;
    rail.forEach((link, i) => {
      if (i === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    const nav =
      active === 0
        ? "intro"
        : active === sections.length - 1
          ? "about"
          : "work";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === nav) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    $("#space-index").textContent = String(active + 1).padStart(2, "0");
    $("#space-label").textContent = sections[active].dataset.label;
    $("#space-next").href = "#" + sections[(active + 1) % sections.length].id;
    $("#space-scroll-label").textContent =
      active === sections.length - 1
        ? "回到起点，重新探索"
        : "滚动，探索下一个视角";
    $(".space-scroll-icon").textContent =
      active === sections.length - 1 ? "↑" : "↓";
  }
  dirty = true;
}
function measure() {
  stops = sections.map(
    (section) => section.getBoundingClientRect().top + scrollY,
  );
  scroll();
}
addEventListener("scroll", scroll, { passive: true });
addEventListener("resize", measure);
new ResizeObserver(measure).observe($("#space-content"));
measure();
function motionUI() {
  document.documentElement.classList.toggle("space-static", !motion);
  $("#space-motion").setAttribute("aria-pressed", String(!motion));
  $("#space-motion").setAttribute(
    "aria-label",
    motion ? "切换为静态视角" : "开启动态视角",
  );
  $("#space-motion span").textContent = motion ? "动态视角" : "静态视角";
  dirty = true;
}
$("#space-motion").addEventListener("click", () => {
  manualMotion = true;
  motion = !motion;
  motionUI();
});
reduced.addEventListener("change", () => {
  if (!manualMotion) {
    motion = !reduced.matches;
    motionUI();
  }
});
motionUI();

try {
  gallery = createGallery($("#space-canvas"));
  const views = [
    gallery.intro,
    ...projects.map((_, i) => gallery.exhibits[i % 3]),
    gallery.outro,
  ];
  let smoothed = progress;
  let last = performance.now();
  let time = 0;
  let lost = false;
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (lost || (!motion && !dirty)) return;
    if (motion && !dialog.open) time += dt;
    smoothed = motion ? THREE.MathUtils.damp(smoothed, progress, 6, dt) : 0;
    const index = Math.min(views.length - 2, Math.floor(smoothed));
    const mix = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp(smoothed - index, 0, 1),
      0.1,
      0.9,
    );
    gallery.draw(views[index], views[index + 1], mix, time, motion, dt);
    dirty = false;
  };
  // 同步渲染 intro 视角第一帧，让 canvas 在标记就绪前就有画面，
  // 配合 CSS 的 blur 过渡实现「模糊到清晰」的加载体验。
  gallery.draw(gallery.intro, gallery.exhibits[0], 0, 0, motion, 0);
  document.body.classList.add("space-ready");
  gallery.renderer.setAnimationLoop(frame);
  addEventListener("resize", () => {
    gallery.resize();
    dirty = true;
  });
  addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "mouse" && !dialog.open)
        gallery.pointer.set(
          event.clientX / innerWidth - 0.5,
          event.clientY / innerHeight - 0.5,
        );
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => gallery.pointer.set(0, 0));
  addEventListener("blur", () => gallery.pointer.set(0, 0));
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
    dirty = true;
    gallery.renderer.setAnimationLoop(document.hidden || lost ? null : frame);
  });
  $("#space-canvas").addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    gallery.renderer.setAnimationLoop(null);
    document.body.classList.remove("space-ready");
  });
  $("#space-canvas").addEventListener("webglcontextrestored", () => {
    lost = false;
    dirty = true;
    document.body.classList.add("space-ready");
    gallery.renderer.setAnimationLoop(frame);
  });
} catch (error) {
  console.warn(
    "3D gallery unavailable; project content remains available.",
    error,
  );
  $("#space-motion").hidden = true;
}

if (location.hash) {
  const destination = document.getElementById(location.hash.slice(1));
  if (destination)
    requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(0, destination.getBoundingClientRect().top + scrollY - 24),
        behavior: "instant",
      });
      measure();
    });
}
