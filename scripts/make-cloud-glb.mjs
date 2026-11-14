// Generates public/models/cloud.glb — a puffy cloud made of merged spheres with a flattened bottom.
// Stand-in for a model you'd normally sculpt in Blender and export via File › Export › glTF 2.0 (.glb).
//   run:  npm run make:cloud

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// GLTFExporter uses the browser's FileReader to pack the binary; Node has Blob but not FileReader.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

// [x, y, z, radius] — roughly 20 wide, 8 tall, 9 deep, bottom near y = 0
const PUFFS = [
  [-7, 1.2, 0, 3],
  [-3, 2.5, 0.3, 4.2],
  [2, 3.2, -0.2, 4.8],
  [6.5, 1.8, 0.2, 3.4],
  [0, 0.8, 1.6, 3.2],
  [-1, 1, -1.6, 3],
  [4, 1, 1.4, 2.8],
];

const parts = PUFFS.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 4).translate(x, y, z));
let geo = mergeGeometries(parts);
geo.deleteAttribute('uv');
geo.deleteAttribute('normal');
geo = mergeVertices(geo, 1e-4);

// squash everything below y = 0 so the cloud sits on a flat-ish base
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const y = pos.getY(i);
  if (y < 0) pos.setY(i, y * 0.3);
}
geo.computeVertexNormals();

const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xfbf8f3, roughness: 0.9 }));
mesh.name = 'cloud';
const scene = new THREE.Scene();
scene.add(mesh);

const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/models/cloud.glb');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(glb));
console.log(`wrote ${out} (${(glb.byteLength / 1024).toFixed(1)} KB, ${pos.count} vertices)`);
