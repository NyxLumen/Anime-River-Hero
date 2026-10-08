import * as THREE from 'three';

export interface RiverRibbonData {
  geometry: THREE.BufferGeometry;
  curve: THREE.CatmullRomCurve3;
  curveLength: number;
}

export interface SplinePointConfig {
  point: THREE.Vector3;
  width: number;
}

/**
 * Creates a river mesh geometry along a 3D spline with variable width.
 */
export function createRiverRibbonGeometry(
  pointsConfig: SplinePointConfig[],
  lengthSegments: number = 240,
  widthSegments: number = 36,
  isBed: boolean = false
): RiverRibbonData {
  const points = pointsConfig.map((p) => p.point);
  const widths = pointsConfig.map((p) => p.width);

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const curveLength = curve.getLength();

  // Helper to interpolate width along spline parameter t [0, 1]
  function getWidthAtT(t: number): number {
    const n = pointsConfig.length - 1;
    const scaledT = Math.max(0, Math.min(1, t)) * n;
    const idx = Math.min(Math.floor(scaledT), n - 1);
    const frac = scaledT - idx;
    // Smooth cubic hermite interpolation between keypoints
    const smoothFrac = frac * frac * (3 - 2 * frac);
    return THREE.MathUtils.lerp(widths[idx], widths[idx + 1], smoothFrac);
  }

  const vertexCount = (lengthSegments + 1) * (widthSegments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const bankDists = new Float32Array(vertexCount);
  const flowDirs = new Float32Array(vertexCount * 2);

  const indices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);

  let vertIdx = 0;

  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // Normal in horizontal plane perpendicular to flow direction
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    if (binormal.lengthSq() < 0.001) {
      binormal.set(1, 0, 0);
    }

    const currentWidth = getWidthAtT(t);

    for (let j = 0; j <= widthSegments; j++) {
      const u = j / widthSegments; // 0 (left bank) to 1 (right bank)
      const offset = (u - 0.5) * currentWidth;

      const pos = center.clone().addScaledVector(binormal, offset);

      // If generating riverbed, carve downward concave basin
      if (isBed) {
        const centerDepth = 1.6;
        const depthFactor = Math.sin(u * Math.PI); // 0 at banks, 1 in center
        pos.y -= depthFactor * centerDepth;
      }

      positions[vertIdx * 3] = pos.x;
      positions[vertIdx * 3 + 1] = pos.y;
      positions[vertIdx * 3 + 2] = pos.z;

      normals[vertIdx * 3] = 0;
      normals[vertIdx * 3 + 1] = 1;
      normals[vertIdx * 3 + 2] = 0;

      // UV coordinates: U across width [0, 1], V along length [0, length/tile]
      uvs[vertIdx * 2] = u;
      uvs[vertIdx * 2 + 1] = t * (curveLength / 8.0);

      // Distance to nearest bank: 0 at edges, 1 in center
      bankDists[vertIdx] = 1.0 - Math.abs(u - 0.5) * 2.0;

      // Flow direction (normalized tangent in X-Z)
      flowDirs[vertIdx * 2] = tangent.x;
      flowDirs[vertIdx * 2 + 1] = tangent.z;

      vertIdx++;
    }
  }

  // Create grid indices
  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = (i + 1) * (widthSegments + 1) + j;
      const c = (i + 1) * (widthSegments + 1) + (j + 1);
      const d = i * (widthSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aBankDist', new THREE.BufferAttribute(bankDists, 1));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(flowDirs, 2));
  geometry.setIndex(indices);

  geometry.computeVertexNormals();

  return {
    geometry,
    curve,
    curveLength,
  };
}
