import * as THREE from "three";

function createRenderer(canvas) {
  const mobile = matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.15 : 1.4));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  return { renderer, mobile };
}

function createDuskTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#171d31");
  sky.addColorStop(0.34, "#302b4a");
  sky.addColorStop(0.62, "#9b5d53");
  sky.addColorStop(0.76, "#e79760");
  sky.addColorStop(0.88, "#553a4b");
  sky.addColorStop(1, "#252438");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const haze = context.createRadialGradient(650, 520, 10, 650, 520, 420);
  haze.addColorStop(0, "rgba(255,211,143,.55)");
  haze.addColorStop(0.28, "rgba(244,145,101,.22)");
  haze.addColorStop(1, "rgba(55,34,47,0)");
  context.fillStyle = haze;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 7; index++) {
    const y = 370 + index * 42;
    context.fillStyle = `rgba(255,193,135,${0.035 - index * 0.003})`;
    context.fillRect(0, y, canvas.width, 24);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  const cloud = context.createRadialGradient(240, 82, 8, 240, 82, 190);
  cloud.addColorStop(0, "rgba(255,208,171,.2)");
  cloud.addColorStop(0.58, "rgba(113,75,91,.14)");
  cloud.addColorStop(1, "rgba(50,39,61,0)");
  context.fillStyle = cloud;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addProjectsScene(scene, projects) {
  scene.background = new THREE.Color("#10232c");
  scene.fog = new THREE.FogExp2("#10232c", 0.026);
  scene.add(new THREE.HemisphereLight("#c9e7e6", "#18232b", 1.9));
  const key = new THREE.DirectionalLight("#ffe3bd", 3.8);
  key.position.set(-5, 8, 9);
  scene.add(key);
  const fill = new THREE.PointLight("#62bdc9", 100, 42);
  fill.position.set(3, 3, 1);
  scene.add(fill);

  const shelf = new THREE.Group();
  shelf.position.set(3.25, -0.15, 0);
  if (matchMedia("(max-width: 760px)").matches) {
    shelf.position.set(0, -0.2, 0);
    shelf.scale.setScalar(0.56);
  }
  scene.add(shelf);
  const wood = new THREE.MeshStandardMaterial({
    color: "#3d3532",
    metalness: 0.28,
    roughness: 0.42,
  });
  const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.22, 1.35), wood);
  shelfBoard.position.set(0, -1.67, -4.45);
  shelf.add(shelfBoard);
  const shelfLip = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 0.1, 0.12),
    new THREE.MeshStandardMaterial({ color: "#9f7755", metalness: 0.35, roughness: 0.32 }),
  );
  shelfLip.position.set(0, -1.51, -3.82);
  shelf.add(shelfLip);
  const glowLine = new THREE.Mesh(
    new THREE.BoxGeometry(7.85, 0.018, 0.025),
    new THREE.MeshBasicMaterial({ color: "#d7a97d", transparent: true, opacity: 0.8 }),
  );
  glowLine.position.set(0, -1.5, -3.74);
  shelf.add(glowLine);

  const books = [];
  const hitTargets = [];
  const paperMaterial = new THREE.MeshStandardMaterial({ color: "#e8ddc7", roughness: 0.92 });
  const spineHighlights = ["#f2c27c", "#b4d9d3", "#df9a70", "#c0a6d9", "#83b7c7"];
  projects.forEach((project, index) => {
    const count = projects.length;
    const spacing = Math.min(2.28, 6.6 / Math.max(1, count - 1));
    const x = (index - (count - 1) / 2) * spacing;
    const coverColor = project.color || spineHighlights[index % spineHighlights.length];
    const book = new THREE.Group();
    book.position.set(x, 0.05, -4.28 - Math.abs(index - (count - 1) / 2) * 0.16);
    book.userData.baseZ = book.position.z;
    book.userData.baseY = book.position.y;
    book.userData.baseRotationY = 0.78 + (index - (count - 1) / 2) * 0.035;
    book.userData.hover = 0;
    shelf.add(book);

    const pages = new THREE.Mesh(new THREE.BoxGeometry(2.08, 3.15, 0.54), paperMaterial);
    pages.position.z = 0.02;
    book.add(pages);
    const coverMaterial = new THREE.MeshStandardMaterial({
      color: coverColor,
      metalness: 0.18,
      roughness: 0.36,
      emissive: coverColor,
      emissiveIntensity: 0.025,
    });
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.34, 0.09), coverMaterial);
    front.position.set(0, 0, 0.32);
    book.add(front);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.34, 0.09), coverMaterial);
    back.position.set(0, 0, -0.31);
    book.add(back);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.13, 3.34, 0.64), coverMaterial);
    spine.position.x = -1.13;
    book.add(spine);

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 768;
    const context = labelCanvas.getContext("2d");
    const baseColor = new THREE.Color(coverColor);
    const gradient = context.createLinearGradient(0, 0, 512, 768);
    gradient.addColorStop(0, `#${baseColor.getHexString()}`);
    gradient.addColorStop(1, "#17272d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 768);
    context.strokeStyle = "rgba(255,245,225,.78)";
    context.lineWidth = 3;
    context.strokeRect(30, 30, 452, 708);
    context.fillStyle = "rgba(255,245,225,.82)";
    context.font = "22px sans-serif";
    context.fillText(`PORTFOLIO     /     ${String(index + 1).padStart(2, "0")}`, 58, 92);
    context.fillStyle = "#fff5e6";
    context.fillRect(58, 122, 76, 4);
    context.globalAlpha = 0.24;
    context.beginPath();
    context.arc(372, 286, 145, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(372, 286, 112, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = "rgba(255,245,225,.76)";
    context.font = "20px sans-serif";
    context.fillText(String(project.category ?? "PORTFOLIO"), 58, 190);
    context.fillStyle = "#fff5e6";
    context.font = "600 47px sans-serif";
    const title = String(project.title ?? "PROJECT");
    const titleLines = [];
    let line = "";
    for (const character of title) {
      const candidate = line + character;
      if (context.measureText(candidate).width > 395 && line) {
        titleLines.push(line);
        line = character;
      } else line = candidate;
    }
    if (line) titleLines.push(line);
    const lineHeight = 58;
    const titleY = 412 - ((titleLines.length - 1) * lineHeight) / 2;
    titleLines.slice(0, 2).forEach((titleLine, titleIndex) => {
      context.fillText(titleLine, 58, titleY + titleIndex * lineHeight);
    });
    context.fillStyle = "rgba(255,245,230,.82)";
    context.font = "25px sans-serif";
    const excerpt = String(project.subtitle || project.excerpt || "");
    let excerptLine = "";
    const excerptLines = [];
    for (const character of excerpt) {
      if (context.measureText(excerptLine + character).width > 390 && excerptLine) {
        excerptLines.push(excerptLine);
        excerptLine = character;
      } else excerptLine += character;
    }
    if (excerptLine) excerptLines.push(excerptLine);
    excerptLines.slice(0, 3).forEach((excerptText, excerptIndex) => {
      context.fillText(excerptText, 58, 548 + excerptIndex * 36);
    });
    context.fillStyle = "rgba(255,245,230,.52)";
    context.font = "19px sans-serif";
    context.fillText("DESIGN   ·   CODE   ·   PROCESS", 58, 682);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const coverArt = new THREE.Mesh(
      new THREE.PlaneGeometry(2.12, 3.26),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.44, metalness: 0.12 }),
    );
    coverArt.position.set(0, 0, 0.368);
    book.add(coverArt);

    const spineCanvas = document.createElement("canvas");
    spineCanvas.width = 256;
    spineCanvas.height = 768;
    const spineContext = spineCanvas.getContext("2d");
    const spineGradient = spineContext.createLinearGradient(0, 0, 256, 768);
    spineGradient.addColorStop(0, `#${baseColor.clone().multiplyScalar(0.82).getHexString()}`);
    spineGradient.addColorStop(1, "#17242a");
    spineContext.fillStyle = spineGradient;
    spineContext.fillRect(0, 0, 256, 768);
    spineContext.fillStyle = "rgba(255,245,230,.72)";
    spineContext.font = "20px sans-serif";
    spineContext.textAlign = "center";
    spineContext.fillText(String(index + 1).padStart(2, "0"), 128, 55);
    spineContext.save();
    spineContext.translate(128, 400);
    spineContext.rotate(-Math.PI / 2);
    spineContext.fillStyle = "#fff5e6";
    spineContext.font = "600 33px sans-serif";
    spineContext.fillText(title, 0, 0, 590);
    spineContext.restore();
    spineContext.fillStyle = "rgba(255,245,230,.62)";
    spineContext.fillRect(74, 706, 108, 3);
    const spineTexture = new THREE.CanvasTexture(spineCanvas);
    spineTexture.colorSpace = THREE.SRGBColorSpace;
    spineTexture.anisotropy = 4;
    const spineArt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 3.24),
      new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.5 }),
    );
    spineArt.position.set(-1.198, 0, 0);
    spineArt.rotation.y = -Math.PI / 2;
    book.add(spineArt);

    const hitTarget = new THREE.Mesh(
      new THREE.BoxGeometry(2.58, 3.7, 0.85),
      new THREE.MeshBasicMaterial({ color: "#ffffff", colorWrite: false, depthWrite: false }),
    );
    hitTarget.userData.book = book;
    book.add(hitTarget);
    hitTargets.push(hitTarget);
    books.push(book);
  });

  const gridPositions = [];
  for (let x = -9; x <= 9; x += 4.5) {
    gridPositions.push(x, -5.6, -14, x, -5.6, 7);
  }
  for (let z = -14; z <= 7; z += 4.5) {
    gridPositions.push(-9, -5.6, z, 9, -5.6, z);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
  scene.add(new THREE.LineSegments(
    gridGeometry,
    new THREE.LineBasicMaterial({ color: "#76aeb4", transparent: true, opacity: 0.075 }),
  ));

  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(90 * 3);
  for (let i = 0; i < dust.length; i += 3) {
    dust[i] = (Math.random() - 0.5) * 30;
    dust[i + 1] = (Math.random() - 0.5) * 15;
    dust[i + 2] = -18 + Math.random() * 28;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: "#b1e2df", size: 0.028, transparent: true, opacity: 0.4 }),
  ));
  return { moving: shelf, books, hitTargets };
}

function addProjectWallScene(scene, projects) {
  scene.background = new THREE.Color("#171d31");
  scene.fog = new THREE.FogExp2("#302b3f", 0.018);
  scene.add(new THREE.HemisphereLight("#ffd7b0", "#202039", 1.45));
  const warm = new THREE.DirectionalLight("#ffbf89", 5.1);
  warm.position.set(-7, 5, 7);
  scene.add(warm);
  const sunFill = new THREE.PointLight("#f49068", 190, 36);
  sunFill.position.set(-4.5, 2.2, -3);
  scene.add(sunFill);
  const cool = new THREE.PointLight("#7689bd", 42, 28);
  cool.position.set(7, 4, -5);
  scene.add(cool);

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 66),
    new THREE.MeshBasicMaterial({ map: createDuskTexture(), depthWrite: false }),
  );
  sky.position.set(0, 8.2, -12.5);
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(1.28, 64),
    new THREE.MeshBasicMaterial({ color: "#ffd59a", transparent: true, opacity: 0.95, depthWrite: false }),
  );
  sun.position.set(5.5, 2.7, -11.8);
  scene.add(sun);
  const sunHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 2.35, 64),
    new THREE.MeshBasicMaterial({ color: "#f6a16f", transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
  );
  sunHalo.position.copy(sun.position);
  scene.add(sunHalo);

  const cloudTexture = createCloudTexture();
  const clouds = [];
  [
    [-2.5, 4.25, 0.9, 0.28],
    [4.2, 3.25, 1.4, 0.22],
    [7.4, 5.0, 1.1, 0.18],
  ].forEach(([x, y, scale, opacity]) => {
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 1.5),
      new THREE.MeshBasicMaterial({ map: cloudTexture, transparent: true, opacity, depthWrite: false }),
    );
    cloud.position.set(x, y, -10.8);
    cloud.scale.setScalar(scale);
    scene.add(cloud);
    clouds.push(cloud);
  });

  const ridgeShape = new THREE.Shape();
  ridgeShape.moveTo(-18, -5);
  ridgeShape.lineTo(-18, -1.3);
  ridgeShape.lineTo(-13, -0.5);
  ridgeShape.lineTo(-9, -1.0);
  ridgeShape.lineTo(-5, 0.15);
  ridgeShape.lineTo(-1, -0.65);
  ridgeShape.lineTo(4, 0.25);
  ridgeShape.lineTo(8, -0.5);
  ridgeShape.lineTo(13, 0.1);
  ridgeShape.lineTo(18, -0.9);
  ridgeShape.lineTo(18, -5);
  ridgeShape.closePath();
  const ridge = new THREE.Mesh(
    new THREE.ShapeGeometry(ridgeShape),
    new THREE.MeshBasicMaterial({ color: "#302b3d", transparent: true, opacity: 0.7, depthWrite: false }),
  );
  ridge.position.set(0, -2.4, -8.8);
  scene.add(ridge);

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 0.045),
    new THREE.MeshBasicMaterial({ color: "#ffd09a", transparent: true, opacity: 0.36, depthWrite: false }),
  );
  reflection.position.set(5.5, -2.2, -8.55);
  scene.add(reflection);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(110 * 3);
  for (let index = 0; index < dustPositions.length; index += 3) {
    dustPositions[index] = (Math.random() - 0.5) * 25;
    dustPositions[index + 1] = (Math.random() - 0.5) * 12;
    dustPositions[index + 2] = -7 + Math.random() * 10;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: "#ffd6a6", size: 0.035, transparent: true, opacity: 0.48 }),
  );
  scene.add(dust);

  const archive = new THREE.Group();
  archive.position.set(2.25, 0.15, -1.8);
  if (matchMedia("(max-width: 760px)").matches) {
    archive.position.set(0, -0.15, -1.5);
    archive.scale.setScalar(0.72);
  }
  scene.add(archive);

  const railMaterial = new THREE.MeshStandardMaterial({
    color: "#8a684d",
    metalness: 0.75,
    roughness: 0.28,
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.1, 0.16), railMaterial);
  rail.position.set(0, -2.7, -4.6);
  archive.add(rail);
  const railLight = new THREE.Mesh(
    new THREE.BoxGeometry(12.6, 0.018, 0.025),
    new THREE.MeshBasicMaterial({ color: "#f0b47f", transparent: true, opacity: 0.9 }),
  );
  railLight.position.set(0, -2.63, -4.48);
  archive.add(railLight);

  const panels = [];
  const hitTargets = [];
  const colors = ["#ee8556", "#8ec6c4", "#a99be0"];
  projects.forEach((project, index) => {
    const accent = project.color || colors[index % colors.length];
    const panel = new THREE.Group();
    const baseX = (index - (projects.length - 1) / 2) * 3.18;
    const baseY = [0.3, 0.05, -0.2][index % 3];
    const baseZ = -4.18 - index * 0.22;
    panel.position.set(baseX, baseY, baseZ);
    panel.rotation.y = [-0.22, 0.03, 0.2][index % 3];
    panel.userData.base = { x: baseX, y: baseY, z: baseZ, rotationY: panel.rotation.y };
    archive.add(panel);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: "#172932",
      metalness: 0.45,
      roughness: 0.34,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.7, 0.26), bodyMaterial);
    panel.add(body);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.8 }),
    );
    frame.scale.setScalar(1.015);
    panel.add(frame);

    const posterCanvas = document.createElement("canvas");
    posterCanvas.width = 600;
    posterCanvas.height = 940;
    const context = posterCanvas.getContext("2d");
    const color = new THREE.Color(accent);
    const gradient = context.createLinearGradient(0, 0, 600, 940);
    gradient.addColorStop(0, `#${color.getHexString()}`);
    gradient.addColorStop(0.42, "#243945");
    gradient.addColorStop(1, "#101b23");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 600, 940);
    context.strokeStyle = "rgba(255,245,225,.42)";
    context.lineWidth = 3;
    context.strokeRect(32, 32, 536, 876);
    context.fillStyle = "rgba(255,248,232,.78)";
    context.font = "20px sans-serif";
    context.fillText(`${String(index + 1).padStart(2, "0")}   /   ${String(project.category || "SELECTED WORK")}`, 64, 88);
    context.strokeStyle = "rgba(255,248,232,.26)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(430, 320, 138 - index * 16, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(430, 320, 94 - index * 9, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#fff8ea";
    context.font = "600 54px sans-serif";
    const title = String(project.title || "PROJECT");
    const titleLines = [];
    let line = "";
    for (const word of title.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > 465 && line) {
        titleLines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) titleLines.push(line);
    titleLines.slice(0, 2).forEach((titleLine, titleIndex) => {
      context.fillText(titleLine, 64, 530 + titleIndex * 66);
    });
    context.fillStyle = "rgba(255,248,234,.75)";
    context.font = "22px sans-serif";
    const subtitle = String(project.subtitle || "");
    let subtitleLine = "";
    const subtitleLines = [];
    for (const character of subtitle) {
      if (context.measureText(subtitleLine + character).width > 465 && subtitleLine) {
        subtitleLines.push(subtitleLine);
        subtitleLine = character;
      } else subtitleLine += character;
    }
    if (subtitleLine) subtitleLines.push(subtitleLine);
    subtitleLines.slice(0, 2).forEach((subtitleText, subtitleIndex) => {
      context.fillText(subtitleText, 64, 700 + subtitleIndex * 34);
    });
    context.fillStyle = "rgba(255,248,234,.55)";
    context.font = "18px sans-serif";
    context.fillText("VIEW CASE STUDY   ↗", 64, 850);
    const texture = new THREE.CanvasTexture(posterCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(2.78, 4.48),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.42, metalness: 0.1 }),
    );
    poster.position.z = 0.16;
    panel.add(poster);

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshBasicMaterial({ color: accent }),
    );
    marker.position.set(0, -2.47, 0);
    panel.add(marker);

    const hitTarget = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 5.0, 0.8),
      new THREE.MeshBasicMaterial({ color: "#ffffff", colorWrite: false, depthWrite: false }),
    );
    hitTarget.userData.panel = panel;
    panel.add(hitTarget);
    hitTargets.push(hitTarget);
    panels.push(panel);
  });

  const linePositions = [];
  for (let index = 0; index < 10; index++) {
    const y = 3.8 - index * 0.72;
    linePositions.push(-8, y, -6.2, 8, y, -6.2);
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  archive.add(new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: "#8aa6a8", transparent: true, opacity: 0.09 }),
  ));
  const sideBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 10, 0.06),
    new THREE.MeshBasicMaterial({ color: "#d6a57f", transparent: true, opacity: 0.45 }),
  );
  sideBeam.position.set(-6.9, 0.3, -6.1);
  archive.add(sideBeam);
  return { moving: archive, panels, hitTargets, clouds, sunHalo, sunFill, dust };
}

function addAboutScene(scene) {
  scene.background = new THREE.Color("#211c24");
  scene.fog = new THREE.FogExp2("#211c24", 0.028);
  scene.add(new THREE.HemisphereLight("#f2d8b6", "#291d2a", 1.6));
  const light = new THREE.PointLight("#efa66f", 110, 55);
  light.position.set(5, 4, 3);
  scene.add(light);
  const rim = new THREE.PointLight("#8d83bd", 90, 48);
  rim.position.set(-7, -1, -4);
  scene.add(rim);

  const sculpture = new THREE.Group();
  sculpture.position.set(3.1, 0.1, -3.4);
  scene.add(sculpture);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.0, 4),
    new THREE.MeshPhysicalMaterial({
      color: "#bd8062",
      metalness: 0.24,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: "#3d1f24",
      emissiveIntensity: 0.55,
    }),
  );
  sculpture.add(core);

  const ringSpecs = [
    { radius: 3.2, tube: 0.035, color: "#f1c78e", rotation: [0.72, 0.1, 0.2] },
    { radius: 4.0, tube: 0.018, color: "#c59ac0", rotation: [1.16, 0.45, -0.55] },
    { radius: 4.65, tube: 0.012, color: "#e49b72", rotation: [0.24, 0.82, 0.15] },
  ];
  const rings = ringSpecs.map((spec, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 8, 180),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.82 - index * 0.12 }),
    );
    ring.rotation.set(...spec.rotation);
    sculpture.add(ring);
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(index === 0 ? 0.13 : 0.085, 18, 14),
      new THREE.MeshBasicMaterial({ color: spec.color }),
    );
    node.position.set(spec.radius, 0, 0);
    ring.add(node);
    return ring;
  });

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(5.5, 0.006, 4, 220),
    new THREE.MeshBasicMaterial({ color: "#d1ae9a", transparent: true, opacity: 0.28 }),
  );
  halo.rotation.set(1.42, 0.3, 0.15);
  sculpture.add(halo);

  const stars = new THREE.BufferGeometry();
  const positions = new Float32Array(240 * 3);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * 35;
    positions[i + 1] = (Math.random() - 0.5) * 22;
    positions[i + 2] = -20 + Math.random() * 30;
  }
  stars.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(
    stars,
    new THREE.PointsMaterial({ color: "#f0d7bd", size: 0.045, transparent: true, opacity: 0.62 }),
  ));
  return { moving: sculpture, rings };
}

export function createEditorialBackground(canvas, variant, projects = []) {
  const { renderer, mobile } = createRenderer(canvas);
  const scene = new THREE.Scene();
  const projectScene = variant === "projects";
  const camera = new THREE.PerspectiveCamera(mobile ? 62 : 54, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(mobile || projectScene ? 0 : -0.4, 0.2, projectScene ? (mobile ? 16.5 : 12.5) : mobile ? 18 : 15);
  camera.lookAt(0, 0, -3);

  const details = variant === "about" ? addAboutScene(scene) : addProjectWallScene(scene, projects);
  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let activePointer = false;
  let hoveredPanel = null;
  return {
    renderer,
    pointer,
    setPointer(x, y) {
      pointer.set(x * 2, -y * 2);
      activePointer = true;
    },
    clearPointer() {
      pointer.set(0, 0);
      activePointer = false;
      hoveredPanel = null;
      document.body.classList.remove("space-project-hover");
    },
    resize() {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.fov = innerWidth < 760 ? 66 : 54;
      camera.updateProjectionMatrix();
    },
    render(time, animate, dt) {
      smoothedPointer.lerp(pointer, 1 - Math.exp(-dt * 3));
      let bookAnimating = false;
      if (variant === "projects") {
        raycaster.setFromCamera(pointer, camera);
        const intersection = activePointer
          ? raycaster.intersectObjects(details.hitTargets, false)[0]
          : null;
        hoveredPanel = intersection?.object.userData.panel ?? null;
        document.body.classList.toggle("space-project-hover", Boolean(hoveredPanel));
        details.panels.forEach((panel) => {
          const selected = panel === hoveredPanel;
          const base = panel.userData.base;
          const targetZ = base.z + (selected ? 1.45 : 0);
          const targetY = base.y + (selected ? 0.12 : 0);
          const targetRotation = base.rotationY + (selected ? (pointer.x < 0 ? -0.06 : 0.06) : 0);
          panel.position.z = THREE.MathUtils.damp(panel.position.z, targetZ, selected ? 8 : 5, dt);
          panel.position.y = THREE.MathUtils.damp(panel.position.y, targetY, 7, dt);
          panel.rotation.y = THREE.MathUtils.damp(panel.rotation.y, targetRotation, 7, dt);
          bookAnimating = bookAnimating ||
            Math.abs(panel.position.z - targetZ) > 0.002 ||
            Math.abs(panel.position.y - targetY) > 0.002 ||
            Math.abs(panel.rotation.y - targetRotation) > 0.002;
          const poster = panel.children[2];
          poster.material.emissive.set(panel === hoveredPanel ? "#fff4db" : "#000000");
          poster.material.emissiveIntensity = panel === hoveredPanel ? 0.12 : 0;
        });
      }
      camera.position.x = (mobile || projectScene ? 0 : -0.4) + smoothedPointer.x * (projectScene ? 0.35 : 0.75);
      camera.position.y = 0.2 - smoothedPointer.y * 0.35;
      camera.lookAt(projectScene ? 0 : 0, 0, -3);
      if (animate) {
        if (variant === "about") {
          details.moving.rotation.y = time * 0.045;
          details.moving.rotation.x = Math.sin(time * 0.13) * 0.045;
          details.rings.forEach((ring, index) => {
            ring.rotation.z += dt * (index % 2 ? -0.022 : 0.018);
          });
        } else {
          details.moving.rotation.y = Math.sin(time * 0.07) * 0.018;
          details.clouds.forEach((cloud, index) => {
            cloud.position.x += dt * (index % 2 ? -0.012 : 0.009);
            if (cloud.position.x > 10) cloud.position.x = -10;
            if (cloud.position.x < -10) cloud.position.x = 10;
          });
          const sunBreath = 1 + Math.sin(time * 0.22) * 0.018;
          details.sunHalo.scale.setScalar(sunBreath);
          details.sunFill.intensity = 190 + Math.sin(time * 0.22) * 5;
          details.dust.rotation.y = time * 0.006;
        }
      }
      renderer.render(scene, camera);
      return bookAnimating;
    },
  };
}
