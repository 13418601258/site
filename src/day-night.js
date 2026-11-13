import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Closed, inflated surfaces: both faces swell away from a rounded perimeter.
// Subdivision provides real curved highlights from the front AND the side.
function cushionGeometry(shape, depth) {
  const outline = shape.getPoints(28);
  if (outline[0].distanceTo(outline[outline.length - 1]) < 1e-6) outline.pop();
  const faces = THREE.ShapeUtils.triangulateShape(outline, []);
  const positions = [];
  const surface = (p, side) => {
    let distanceSquared = Infinity;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const t = THREE.MathUtils.clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / Math.max(dx * dx + dy * dy, 1e-12), 0, 1);
      distanceSquared = Math.min(distanceSquared, (p.x - a.x - dx * t) ** 2 + (p.y - a.y - dy * t) ** 2);
    }
    const d = Math.sqrt(distanceSquared);
    const bulge = depth * Math.sqrt(1 - Math.exp(-d / 0.14));
    return [p.x, p.y, side * (0.035 + bulge)];
  };
  function subdivide(a, b, c, levels) {
    if (levels) {
      const ab = a.clone().add(b).multiplyScalar(0.5);
      const bc = b.clone().add(c).multiplyScalar(0.5);
      const ca = c.clone().add(a).multiplyScalar(0.5);
      subdivide(a, ab, ca, levels - 1);
      subdivide(ab, b, bc, levels - 1);
      subdivide(ca, bc, c, levels - 1);
      subdivide(ab, bc, ca, levels - 1);
      return;
    }
    const ccw = (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x) > 0;
    const ordered = ccw ? [a,b,c] : [a,c,b];
    for (const p of ordered) positions.push(...surface(p, 1));
    for (const p of [...ordered].reverse()) positions.push(...surface(p, -1));
  }
  for (const face of faces) subdivide(...face.map(i => outline[i]), 4);
  const clockwise = THREE.ShapeUtils.isClockWise(outline);
  for (let i = 0; i < outline.length; i++) {
    const a=outline[i], b=outline[(i+1)%outline.length];
    const af=surface(a,1), ab=surface(a,-1), bf=surface(b,1), bb=surface(b,-1);
    const triangles = clockwise ? [af,bf,ab,bf,bb,ab] : [af,ab,bf,bf,ab,bb];
    for (const p of triangles) positions.push(...p);
  }
  const raw = new THREE.BufferGeometry();
  raw.setAttribute("position", new THREE.Float32BufferAttribute(positions,3));
  const result = mergeVertices(raw, 1e-5);
  raw.dispose();
  // Analytic normals keep the inflated face smooth across the long, thin
  // triangles produced by triangulating the concave silhouette.
  const vertices = result.getAttribute("position");
  const normals = new Float32Array(vertices.count * 3);
  for (let index = 0; index < vertices.count; index++) {
    const x=vertices.getX(index), y=vertices.getY(index), z=vertices.getZ(index);
    let minDistance=Infinity, gx=0, gy=0;
    for(let i=0;i<outline.length;i++) {
      const a=outline[i], b=outline[(i+1)%outline.length];
      const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy);
      const t=THREE.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/Math.max(len*len,1e-12),0,1);
      const vx=x-a.x-dx*t, vy=y-a.y-dy*t, d=Math.hypot(vx,vy);
      if(d<minDistance) {
        minDistance=d;
        gx=d>1e-6?vx/d:(clockwise?dy:-dy)/len;
        gy=d>1e-6?vy/d:(clockwise?-dx:dx)/len;
      }
    }
    const e=Math.exp(-minDistance/0.14);
    const slope=depth*e/(0.28*Math.sqrt(Math.max(1-e,0.00001)));
    const normal=new THREE.Vector3(-gx*slope,-gy*slope,z>=0?1:-1).normalize();
    normal.toArray(normals,index*3);
  }
  result.setAttribute("normal",new THREE.BufferAttribute(normals,3));
  return result;
}

export function createDayNight() {
  const group = new THREE.Group();
  group.name = "Soft day and night sculpture";
  const porcelain = new THREE.MeshPhysicalMaterial({
    color: "#fff7e8", roughness: 0.32, metalness: 0,
    clearcoat: 0.32, clearcoatRoughness: 0.28,
    emissive: "#fff1d8", emissiveIntensity: 0.075,
    envMapIntensity: 0.48, fog: false,
  });
  const sunlight = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.3, metalness: 0,
    clearcoat: 0.38, clearcoatRoughness: 0.22,
    emissive: "#ffad22", emissiveIntensity: 0.15,
    envMapIntensity: 0.38, fog: false,
  });
  const rayMaterial = new THREE.MeshPhysicalMaterial({
    color: "#ffd03c", roughness: 0.28, metalness: 0,
    clearcoat: 0.35, clearcoatRoughness: 0.24,
    emissive: "#ffb928", emissiveIntensity: 0.12, fog: false,
  });
  const add = (geometry, material, name) => {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    group.add(object);
    return object;
  };

  // The softly waved inside edge echoes the reference rather than a circular cut-out.
  const moonShape = new THREE.Shape();
  moonShape.moveTo(-0.42, 1.36);
  moonShape.bezierCurveTo(-1.2, 1.1, -1.57, 0.39, -1.47, -0.35);
  moonShape.bezierCurveTo(-1.4, -1.17, -0.65, -1.58, 0.12, -1.41);
  moonShape.bezierCurveTo(0.51, -1.34, 0.8, -1.2, 1.0, -0.99);
  moonShape.bezierCurveTo(1.05, -0.91, 0.99, -0.86, 0.9, -0.91);
  moonShape.bezierCurveTo(0.36, -1.12, -0.31, -0.83, -0.43, -0.46);
  moonShape.bezierCurveTo(-0.51, -0.22, -0.21, -0.09, -0.29, 0.03);
  moonShape.bezierCurveTo(-0.36, 0.17, -0.67, 0.12, -0.73, 0.45);
  moonShape.bezierCurveTo(-0.82, 0.8, -0.59, 1.13, -0.35, 1.3);
  moonShape.bezierCurveTo(-0.3, 1.35, -0.35, 1.39, -0.42, 1.36);
  moonShape.closePath();
  const moon = add(cushionGeometry(moonShape, 0.22), porcelain, "Ivory cushion crescent");

  const sunShape = new THREE.Shape();
  sunShape.moveTo(-0.49, 0.76);
  sunShape.bezierCurveTo(-0.04, 1.11, 0.58, 0.91, 0.82, 0.51);
  sunShape.bezierCurveTo(1.15, -0.01, 0.87, -0.63, 0.37, -0.77);
  sunShape.bezierCurveTo(0.11, -0.8, -0.13, -0.63, -0.19, -0.47);
  sunShape.bezierCurveTo(-0.27, -0.33, 0.01, -0.2, -0.06, 0.02);
  sunShape.bezierCurveTo(-0.11, 0.25, -0.47, 0.21, -0.52, 0.44);
  sunShape.bezierCurveTo(-0.55, 0.55, -0.52, 0.7, -0.49, 0.76);
  sunShape.closePath();
  const geometry = cushionGeometry(sunShape, 0.29);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const orange = new THREE.Color("#ff7925");
  const yellow = new THREE.Color("#ffda39");
  const color = new THREE.Color();
  for(let i=0;i<positions.count;i++) {
    const t=THREE.MathUtils.clamp((positions.getY(i)+0.78)/1.75,0,1);
    color.copy(orange).lerp(yellow,t).toArray(colors,i*3);
  }
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  const sun = add(geometry, sunlight, "Golden cushion sun");
  sun.position.z = 0.11;
  for(const degrees of [90,60,30,0,-30]) {
    const angle=THREE.MathUtils.degToRad(degrees);
    const ray=add(new THREE.CapsuleGeometry(0.072,0.23,8,16),rayMaterial,"Rounded sun ray");
    ray.position.set(0.2+Math.cos(angle)*1.19,0.07+Math.sin(angle)*1.19,0.1);
    ray.rotation.z=angle-Math.PI/2;
  }
  group.userData.animate=(time,motion)=>{
    // Tiny depth motion preserves the distinctive gap in the front silhouette.
    moon.position.z=motion?Math.sin(time*0.3)*0.012:0;
    sun.position.z=0.11+(motion?Math.sin(time*0.3+0.7)*0.014:0);
  };
  return group;
}
