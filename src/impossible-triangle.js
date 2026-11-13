import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Three real beams follow an open XYZ staircase. Its two free ends are far
 * apart in depth, but project onto the same corner from one calibrated eye.
 * A fixed projective deformation corrects perspective; no per-frame geometry,
 * billboard rotation, painted faces or camera-dependent visibility is used.
 */
export function createImpossibleTriangle({ eye, center }) {
  const sculpture = new THREE.Group();
  sculpture.name = "Penrose impossible triangle";
  sculpture.position.copy(center);
  sculpture.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().lookAt(eye, center, new THREE.Vector3(0, 1, 0)),
  );

  const length = 8.4;
  const width = 1.15;
  const distance = eye.distanceTo(center);
  // Isometric projection: X runs right, Y up-left, Z down-left.
  const right = new THREE.Vector3(2, -1, -1).normalize();
  const up = new THREE.Vector3(0, 1, -1).normalize();
  const forward = new THREE.Vector3(1, 1, 1).normalize();
  const offsetX = length / Math.sqrt(6);
  const offsetY = length / (3 * Math.sqrt(2));
  const offsetZ = length * Math.sqrt(3) / 2;
  const material = new THREE.MeshStandardMaterial({
    color: "#a8b4c5", metalness: 0.72, roughness: 0.25,
  });
  const point = new THREE.Vector3();

  function projectIntoSculpture(x, y, z) {
    point.set(x, y, z);
    const px = point.dot(right) - offsetX;
    const py = point.dot(up) - offsetY;
    const pz = point.dot(forward) - offsetZ;
    const perspectiveScale = (distance - pz) / distance;
    return new THREE.Vector3(px * perspectiveScale, py * perspectiveScale, pz);
  }

  const beams = [
    { size: [length + width, width, width], center: [length / 2, 0, 0], name: "Lower beam — far open end" },
    { size: [width, length, width], center: [length, (length + width) / 2, 0], name: "Ascending beam" },
    { size: [width, width, length], center: [length, length, (length + width) / 2], name: "Descending beam — near open end" },
  ];
  for (const beam of beams) {
    const geometry = new RoundedBoxGeometry(...beam.size, 3, 0.07);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const projected = projectIntoSculpture(
        vertices.getX(i) + beam.center[0],
        vertices.getY(i) + beam.center[1],
        vertices.getZ(i) + beam.center[2],
      );
      vertices.setXYZ(i, projected.x, projected.y, projected.z);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = beam.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sculpture.add(mesh);
  }

  // Used by the geometric verification: these are different world points on
  // the same eye ray, rather than two corners touching in space.
  sculpture.userData.openEnds = [
    projectIntoSculpture(0, 0, 0),
    projectIntoSculpture(length, length, length),
  ];
  sculpture.userData.alignmentEye = eye.clone();
  return sculpture;
}
