import * as THREE from "three";

const projectPalette = ["#73b8c4", "#b2d4d0", "#6e91a8"];

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

function addProjectsScene(scene) {
  scene.background = new THREE.Color("#10232c");
  scene.fog = new THREE.FogExp2("#10232c", 0.035);
  scene.add(new THREE.HemisphereLight("#b9e1e6", "#17212a", 1.7));
  const key = new THREE.DirectionalLight("#8dd6db", 3.3);
  key.position.set(-8, 12, 10);
  scene.add(key);
  const fill = new THREE.PointLight("#6295bb", 65, 45);
  fill.position.set(8, 1, -5);
  scene.add(fill);

  const archive = new THREE.Group();
  archive.position.set(2.5, 0, -4.5);
  scene.add(archive);
  const frameMaterial = new THREE.MeshBasicMaterial({
    color: "#75c6cd",
    transparent: true,
    opacity: 0.55,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: "#264754",
    metalness: 0.62,
    roughness: 0.28,
    transparent: true,
    opacity: 0.86,
  });
  const structures = [
    { x: -5.5, y: -0.5, height: 5.4, shape: new THREE.OctahedronGeometry(1.45, 0), color: projectPalette[0] },
    { x: 0, y: 0.2, height: 7.1, shape: new THREE.IcosahedronGeometry(1.55, 1), color: projectPalette[1] },
    { x: 5.4, y: -0.2, height: 4.8, shape: new THREE.DodecahedronGeometry(1.55, 0), color: projectPalette[2] },
  ];
  structures.forEach((item, index) => {
    const y = item.y;
    const z = -index * 0.35;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, item.height, 0.14),
      darkMaterial,
    );
    panel.position.set(item.x, y, z);
    archive.add(panel);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(panel.geometry),
      frameMaterial,
    );
    edges.position.copy(panel.position);
    archive.add(edges);

    const gemMaterial = new THREE.MeshPhysicalMaterial({
      color: item.color,
      metalness: 0.38,
      roughness: 0.18,
      transmission: 0.18,
      thickness: 1.2,
      emissive: item.color,
      emissiveIntensity: 0.12,
    });
    const gem = new THREE.Mesh(item.shape, gemMaterial);
    gem.position.set(item.x, y + 0.1, z + 1.25);
    gem.scale.setScalar(0.82 + index * 0.08);
    gem.rotation.set(0.25 * index, 0.7 * index, 0.18);
    archive.add(gem);
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.95 + index * 0.2, 0.012, 6, 120),
      new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.65 }),
    );
    orbit.position.copy(gem.position);
    orbit.rotation.set(0.8, index * 0.4, 0.25);
    archive.add(orbit);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.18, 2.3),
      new THREE.MeshStandardMaterial({ color: "#203b46", metalness: 0.5, roughness: 0.35 }),
    );
    plinth.position.set(item.x, y - item.height / 2 - 0.14, z);
    archive.add(plinth);
  });

  const gridPositions = [];
  for (let x = -13; x <= 13; x += 2.2) {
    gridPositions.push(x, -5.6, -14, x, -5.6, 7);
  }
  for (let z = -14; z <= 7; z += 2.2) {
    gridPositions.push(-13, -5.6, z, 13, -5.6, z);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
  scene.add(new THREE.LineSegments(
    gridGeometry,
    new THREE.LineBasicMaterial({ color: "#76aeb4", transparent: true, opacity: 0.18 }),
  ));

  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(180 * 3);
  for (let i = 0; i < dust.length; i += 3) {
    dust[i] = (Math.random() - 0.5) * 30;
    dust[i + 1] = (Math.random() - 0.5) * 15;
    dust[i + 2] = -18 + Math.random() * 28;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: "#b1e2df", size: 0.035, transparent: true, opacity: 0.58 }),
  ));
  return { moving: archive };
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

export function createEditorialBackground(canvas, variant) {
  const { renderer, mobile } = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 66 : 54, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(mobile ? 0 : -0.4, 0.4, mobile ? 18 : 15);
  camera.lookAt(0, 0, -3);

  const details = variant === "about" ? addAboutScene(scene) : addProjectsScene(scene);
  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();
  return {
    renderer,
    pointer,
    resize() {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.fov = innerWidth < 760 ? 66 : 54;
      camera.updateProjectionMatrix();
    },
    render(time, animate, dt) {
      smoothedPointer.lerp(pointer, 1 - Math.exp(-dt * 3));
      camera.position.x = (mobile ? 0 : -0.4) + smoothedPointer.x * 0.75;
      camera.position.y = 0.4 - smoothedPointer.y * 0.42;
      camera.lookAt(0, 0, -3);
      if (animate) {
        if (variant === "about") {
          details.moving.rotation.y = time * 0.045;
          details.moving.rotation.x = Math.sin(time * 0.13) * 0.045;
          details.rings.forEach((ring, index) => {
            ring.rotation.z += dt * (index % 2 ? -0.022 : 0.018);
          });
        } else {
          details.moving.rotation.y = Math.sin(time * 0.11) * 0.06;
          details.moving.position.y = Math.sin(time * 0.18) * 0.14;
        }
      }
      renderer.render(scene, camera);
    },
  };
}
