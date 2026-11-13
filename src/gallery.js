import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createImpossibleTriangle } from "./impossible-triangle.js";
import { createDayNight } from "./day-night.js";

export function createGallery(canvas) {
  const mobile = matchMedia("(max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.4 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#273740");
  const camera = new THREE.PerspectiveCamera(57, 1, 0.1, 230);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  const ambient = new THREE.HemisphereLight("#d5e8ef", "#333a40", 1.2);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#ffe1bc", 4.7);
  sun.position.set(-14, 25, 17);
  sun.target.position.set(2, 0, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {
    left: -30,
    right: 30,
    top: 40,
    bottom: -40,
    near: 1,
    far: 120,
  });
  sun.shadow.normalBias = 0.055;
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);
  const cool = new THREE.DirectionalLight("#8dcbdf", 2.0);
  cool.position.set(10, 12, -35);
  scene.add(cool);
  const stone = new THREE.MeshStandardMaterial({
    color: "#b0ac9f",
    roughness: 0.85,
  });
  const darkStone = new THREE.MeshStandardMaterial({
    color: "#53605e",
    roughness: 0.65,
    metalness: 0.15,
  });
  const bronze = new THREE.MeshStandardMaterial({
    color: "#eaa174",
    roughness: 0.25,
    metalness: 0.72,
  });
  const pale = new THREE.MeshStandardMaterial({
    color: "#c5d9cf",
    roughness: 0.4,
    metalness: 0.22,
  });
  const mesh = (geometry, material, x, y, z, parent = scene) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (w, h, d, material, x, y, z, parent) =>
    mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  const cylinder = (radius, height, material, x, y, z, parent) =>
    mesh(
      new THREE.CylinderGeometry(radius, radius, height, 80),
      material,
      x,
      y,
      z,
      parent,
    );

  // Architecture surrounds the camera; this is an inhabitable gallery, not a model on a plinth.
  box(2, 23, 132, darkStone, -17, 10, -30);
  box(2, 23, 132, stone, 17, 10, -30);
  box(34, 23, 1, darkStone, 0, 10, -86);
  const archShape = new THREE.Shape();
  archShape.moveTo(-15, 0);
  archShape.lineTo(-15, 5.5);
  archShape.absarc(0, 5.5, 15, Math.PI, 0, true);
  archShape.lineTo(15, 0);
  archShape.lineTo(12.9, 0);
  archShape.lineTo(12.9, 5.5);
  archShape.absarc(0, 5.5, 12.9, 0, Math.PI, false);
  archShape.lineTo(-12.9, 0);
  archShape.closePath();
  const archGeometry = new THREE.ExtrudeGeometry(archShape, {
    depth: 1.35,
    bevelEnabled: true,
    bevelSize: 0.07,
    bevelThickness: 0.07,
    bevelSegments: 2,
    curveSegments: 64,
    steps: 1,
  });
  for (const z of [10, -10, -30, -50, -70]) {
    mesh(archGeometry, stone, 0, 0, z);
    for (const x of [-14.9, 14.9]) {
      box(0.1, 12, 0.09, bronze, x, 6, z + 1.47);
    }
  }
  // Side fins and ceiling beams produce long architectural shadows across the floor.
  for (let z = 18; z > -82; z -= 4) {
    box(0.5, 18, 0.35, stone, 15.6, 9, z);
    box(0.5, 18, 0.35, darkStone, -15.6, 9, z);
    box(32, 0.32, 0.65, darkStone, 0, 20.9, z);
  }
  const floor = new Reflector(new THREE.PlaneGeometry(160, 220), {
    color: "#566269",
    textureWidth: mobile ? 512 : 1024,
    textureHeight: mobile ? 512 : 1024,
    clipBias: 0.003,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.035, -25);
  scene.add(floor);
  // A satin surface over the reflector softens the mirror without extra render passes.
  const satinFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 220),
    new THREE.MeshStandardMaterial({
      color: "#172730",
      roughness: 0.86,
      metalness: 0.08,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  satinFloor.rotation.x = -Math.PI / 2;
  satinFloor.position.set(0, -0.022, -25);
  satinFloor.receiveShadow = true;
  scene.add(satinFloor);
  const seams = [];
  for (let z = -85; z < 65; z += 5) seams.push(-17, 0.001, z, 17, 0.001, z);
  for (let x = -15; x <= 15; x += 5) seams.push(x, 0.001, -85, x, 0.001, 65);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(seams, 3));
  scene.add(
    new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: "#bac9c5",
        transparent: true,
        opacity: 0.12,
      }),
    ),
  );
  const stripMaterial = new THREE.MeshBasicMaterial({ color: "#d6ba88" });
  for (const x of [-12.7, 12.7])
    box(0.035, 0.015, 108, stripMaterial, x, 0.012, -30);

  // Exhibit 01: graphite crescent in front of an amber sphere, lit from opposing sides.
  const orbit = createDayNight();
  orbit.position.set(4.3, 6.1, -8);
  orbit.scale.setScalar(2.5);
  orbit.rotation.y = -0.12;
  scene.add(orbit);
  const basalt = new THREE.MeshStandardMaterial({
    color: "#1e292e",
    roughness: 0.8,
    metalness: 0.12,
  });
  cylinder(3.65, 0.2, basalt, 4.3, 0.1, -8);
  cylinder(3.48, 0.018, bronze, 4.3, 0.205, -8);
  cylinder(3.44, 0.025, basalt, 4.3, 0.224, -8);
  const ringLight = new THREE.PointLight("#edac68", 18, 12);
  ringLight.position.set(7.2, 8.3, -5);
  scene.add(ringLight);
  const lunarLight = new THREE.PointLight("#9ac9ed", 22, 13);
  lunarLight.position.set(-1, 8.4, -4);
  scene.add(lunarLight);

  // Exhibit 02: translucent-looking mineral columns and a fine data orbit.
  const data = new THREE.Group();
  data.position.set(-5.0, 0, -29);
  scene.add(data);
  cylinder(5.2, 0.35, darkStone, 0, 0.175, 0, data);
  const dataColors = ["#385f68", "#50818a", "#629a9d", "#84b0af", "#accdc0"];
  [2.8, 4.8, 7.5, 6, 3.8].forEach((h, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: dataColors[i],
      metalness: 0.42,
      roughness: 0.22,
    });
    box(1.25, h, 1.6, mat, -3.4 + i * 1.7, h / 2 + 0.36, 0, data);
    box(
      1.12,
      0.018,
      1.46,
      new THREE.MeshBasicMaterial({ color: dataColors[i] }),
      -3.4 + i * 1.7,
      h + 0.38,
      0,
      data,
    );
  });
  const trace = mesh(
    new THREE.TorusGeometry(5.1, 0.025, 8, 128),
    pale,
    0,
    4.5,
    0,
    data,
  );
  trace.rotation.set(1.0, 0.1, 0.15);
  mesh(new THREE.SphereGeometry(0.25, 20, 16), bronze, 5.1, 0, 0, trace);

  // Exhibit 03 is a fixed open sculpture, calibrated to this one camera eye.
  const penroseEye = new THREE.Vector3(9.2, 5.9, -34);
  const impossibleTriangle = createImpossibleTriangle({
    eye: penroseEye,
    center: new THREE.Vector3(5.2, 5.1, -51),
  });
  scene.add(impossibleTriangle);
  cylinder(5.7, 0.3, darkStone, 5.2, 0.15, -51);
  for (let i = 0; i < 3; i++) {
    const line = mesh(
      new THREE.TorusGeometry(4.8 + i * 0.38, 0.015, 6, 100),
      pale,
      5.2,
      0.32,
      -51,
    );
    line.rotation.x = -Math.PI / 2;
  }
  // A warm horizon continues beyond the final room.
  const horizon = mesh(
    new THREE.PlaneGeometry(13, 17),
    new THREE.MeshBasicMaterial({ color: "#d5b995" }),
    0,
    8.5,
    -85.3,
  );
  horizon.castShadow = false;
  const backLight = new THREE.PointLight("#e5bd90", 400, 35);
  backLight.position.set(0, 8, -75);
  scene.add(backLight);

  const view = (p, t) => ({
    position: new THREE.Vector3(...p),
    target: new THREE.Vector3(...t),
  });
  const intro = view([8.2, 6.2, 23], [-2.2, 5.0, -14]);
  const exhibits = [
    view([7.4, 6.7, 9], [-0.5, 5.8, -8]),
    view([-0.2, 5.5, -12], [-8.3, 4.7, -29]),
    view([9.2, 5.9, -34], [1.6, 4.8, -51]),
  ];
  const outro = view([-4.8, 8.1, -65], [5, 6.4, -40]);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  const orbitAxis = new THREE.Vector3(0, 1, 0);
  // A 16-degree sweep is large enough to reveal depth while staying inside the arcade.
  const pointerSweep = THREE.MathUtils.degToRad(16);
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = innerWidth < 760 ? 67 : 57;
    camera.updateProjectionMatrix();
  }
  resize();
  return {
    renderer,
    scene,
    camera,
    intro,
    exhibits,
    outro,
    resize,
    pointer,
    draw(from, to, mix, time, motion, dt) {
      position.lerpVectors(from.position, to.position, mix);
      target.lerpVectors(from.target, to.target, mix);
      // Keep the gallery lighting stable while the camera travels between
      // exhibits. Local lights remain part of the same shared environment.
      ambient.intensity = 1.2;
      sun.intensity = 4.7;
      cool.intensity = 2.0;
      scene.environmentIntensity = 0.65;
      ringLight.intensity = 18;
      lunarLight.intensity = 22;
      const alignment =
        (from === exhibits[2] ? 1 - mix : 0) + (to === exhibits[2] ? mix : 0);
      if (innerWidth < 760) {
        const dayNightFocus =
          (from === exhibits[0] ? 1 - mix : 0) + (to === exhibits[0] ? mix : 0);
        target.x += 3.1 + 1.8 * dayNightFocus;
        target.y += 0.5;
        position.y += 1.2 * (1 - alignment);
        // Fit both separated silhouettes into the narrow portrait viewport.
        position
          .sub(target)
          .multiplyScalar(1 + 0.2 * dayNightFocus)
          .add(target);
      }
      smoothPointer.lerp(pointer, 1 - Math.exp(-dt * 4));
      if (motion && innerWidth >= 760) {
        position
          .sub(target)
          .applyAxisAngle(
            orbitAxis,
            smoothPointer.x * pointerSweep * (1 - alignment),
          )
          .add(target);
        position.y -= smoothPointer.y * 0.7 * (1 - alignment);
      }
      camera.position.copy(position);
      camera.lookAt(target);
      orbit.rotation.y = -0.12 + (motion ? Math.sin(time * 0.35) * 0.055 : 0);
      orbit.position.y = 6.1 + (motion ? Math.sin(time * 0.32) * 0.04 : 0);
      orbit.userData.animate(time, motion);
      trace.rotation.z = 0.15 + (motion ? time * 0.065 : 0);
      renderer.render(scene, camera);
    },
  };
}
