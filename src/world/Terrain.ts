import * as THREE from 'three';
import { SplinePointConfig } from '../utils/SplineUtils';

export class Terrain {
  public readonly group: THREE.Group;
  public readonly mesh: THREE.Mesh;
  public readonly geometry: THREE.BufferGeometry;
  public readonly material: THREE.MeshStandardMaterial;

  constructor(riverCurve: THREE.CatmullRomCurve3, splineConfigs: SplinePointConfig[]) {
    this.group = new THREE.Group();
    this.group.name = 'TerrainGroup';

    const width = 250;
    const depth = 250;
    const segmentsX = 200;
    const segmentsZ = 200;

    const planeGeo = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
    planeGeo.rotateX(-Math.PI / 2); // Orient horizontally in X-Z

    const posAttr = planeGeo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    // Pre-sample river spline for fast nearest-point lookup
    const sampleCount = 350;
    const riverSamples: { pos: THREE.Vector3; tangent: THREE.Vector3; width: number; t: number }[] = [];
    const widths = splineConfigs.map((c) => c.width);

    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const pos = riverCurve.getPointAt(t);
      const tangent = riverCurve.getTangentAt(t).normalize();

      const n = splineConfigs.length - 1;
      const scaledT = t * n;
      const idx = Math.min(Math.floor(scaledT), n - 1);
      const frac = scaledT - idx;
      const w = THREE.MathUtils.lerp(widths[idx], widths[idx + 1], frac);

      riverSamples.push({ pos, tangent, width: w, t });
    }

    // Curated Painterly Anime Palette (Natural greens, warm olive, muted stone)
    const colMeadowSun = new THREE.Color(0xb5ce67);     // Warm sunlit golden-olive grass
    const colMeadowLush = new THREE.Color(0x759e44);    // Muted rich anime meadow green
    const colMeadowShade = new THREE.Color(0x476336);   // Cool shaded grass hollows & under-foliage
    const colForestDeep = new THREE.Color(0x32503a);    // Shaded pine / deep hillside foliage
    const colBankCliff = new THREE.Color(0x7c7566);     // Exposed earthen cut-bank / silt strata
    const colRockSun = new THREE.Color(0xbeb39f);       // Sunlit warm granite / sandstone ledges
    const colRockShadow = new THREE.Color(0x545e57);    // Shaded slate / mossy cliff
    const colShoreSilt = new THREE.Color(0x62665a);     // Wet riverbank gravel & silt
    const colPathDirt = new THREE.Color(0xc0a782);      // Natural weathered anime countryside dirt trail
    const colDistanceHaze = new THREE.Color(0x9cb4ab);  // Distant mountain silhouette

    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempColor = new THREE.Color();

    // Pass 1: Shape Terrain Elevations
    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      let minDistSq = Infinity;
      let closestIdx = 0;

      for (let s = 0; s <= sampleCount; s++) {
        const dx = vx - riverSamples[s].pos.x;
        const dz = vz - riverSamples[s].pos.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestIdx = s;
        }
      }

      const closestSample = riverSamples[closestIdx];
      const distToRiver = Math.sqrt(minDistSq);
      const halfWidth = closestSample.width * 0.5;

      const toVertX = vx - closestSample.pos.x;
      const toVertZ = vz - closestSample.pos.z;
      const side = closestSample.tangent.x * toVertZ - closestSample.tangent.z * toVertX;
      const isLeftSide = side > 0;

      let vy = closestSample.pos.y;

      if (distToRiver < halfWidth) {
        // Inside wide river channel: carve smooth concave basin below water surface
        const channelDepth = 1.8 * (1.0 - distToRiver / halfWidth);
        vy -= channelDepth;
      } else {
        const bankDist = distToRiver - halfWidth;

        if (isLeftSide) {
          // Left Bank: Steep carved riverbank slope -> rolling terraced meadow
          // 1. Carved cut-bank slope: sharp rise of 2.2 units right at the water's edge
          const cutBankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 3.8);
          const cutBankHeight = 2.2;

          // 2. Terraced meadow shelves with natural micro-relief
          const meadowRamp = THREE.MathUtils.smoothstep(bankDist, 2.5, 12.0);
          const rawHeight = (vx * 0.04 + vz * 0.03);
          const terrace = Math.floor(rawHeight * 2.0) * 0.5 + Math.sin(rawHeight * 5.0) * 0.15;
          const rollingKnolls = Math.sin(vx * 0.07) * 1.1 + Math.cos(vz * 0.06) * 1.0 + Math.sin(vx * 0.14 + vz * 0.12) * 0.45;
          const plateauHeight = cutBankHeight + 1.8 + terrace + rollingKnolls;

          vy += cutBankRamp * cutBankHeight + meadowRamp * (plateauHeight - cutBankHeight);

          // Far left background rises into protective rolling hills
          const farLeftDist = Math.max(0, -vx - 16);
          vy += Math.min(18, farLeftDist * 0.32 + Math.sin(vx * 0.08 + vz * 0.07) * 1.8);
        } else {
          // Right Bank: Steep rocky bluff rising from the water with crags & ledges
          const bankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 9.0);
          const bluffHeight = 6.8 + bankDist * 0.38 + Math.sin(vx * 0.08) * 2.2 + Math.cos(vz * 0.07) * 1.5;
          vy += bankRamp * bluffHeight;

          // Foreground right rises into framing knoll
          if (vx > 16 && vz > 18) {
            const knollDist = Math.sqrt((vx - 32) ** 2 + (vz - 32) ** 2);
            vy += Math.max(0, (28 - knollDist) * 0.46);
          }
        }
      }

      // Distant background mountain range
      if (vz < -36) {
        const bgDist = (-36 - vz);
        vy += Math.min(38, bgDist * 0.54 + Math.sin(vx * 0.04 + vz * 0.03) * 6.0);
      }

      posAttr.setY(i, vy);
    }

    // Compute smooth normals across the terrain
    planeGeo.computeVertexNormals();
    const normalAttr = planeGeo.attributes.normal;
    const normVec = new THREE.Vector3();

    // Pass 2: Painterly Vertex Coloring based on slope, sun exposure, and geography
    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      normVec.fromBufferAttribute(normalAttr, i);

      let minDistSq = Infinity;
      let closestIdx = 0;

      for (let s = 0; s <= sampleCount; s++) {
        const dx = vx - riverSamples[s].pos.x;
        const dz = vz - riverSamples[s].pos.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestIdx = s;
        }
      }

      const closestSample = riverSamples[closestIdx];
      const distToRiver = Math.sqrt(minDistSq);
      const halfWidth = closestSample.width * 0.5;
      const bankDist = Math.max(0, distToRiver - halfWidth);

      const toVertX = vx - closestSample.pos.x;
      const toVertZ = vz - closestSample.pos.z;
      const side = closestSample.tangent.x * toVertZ - closestSample.tangent.z * toVertX;
      const isLeftSide = side > 0;

      // Sun exposure: faces pointing toward sun (+X, -Z) receive warm golden tint
      const sunFacing = THREE.MathUtils.clamp(normVec.dot(sunDir), 0, 1);
      const isSteep = normVec.y < 0.78;

      if (distToRiver < halfWidth + 1.2) {
        // Wet shoreline silt & gravel
        tempColor.copy(colShoreSilt);
      } else if (distToRiver < halfWidth + 4.2 && isLeftSide) {
        // Carved cut-bank: exposed earthen strata, silt, and rock ledge
        const strataBlend = THREE.MathUtils.clamp((vy - closestSample.pos.y) / 2.2, 0, 1);
        tempColor.copy(colBankCliff).lerp(colMeadowLush, strataBlend * 0.6);
        if (sunFacing > 0.4) {
          tempColor.lerp(colRockSun, 0.35);
        }
      } else if (isLeftSide) {
        // Left side rolling meadow & path
        const pathLine = Math.abs((vz + vx * 0.48) - 1.5 + Math.sin(vx * 0.12) * 2.0);
        const isPath = pathLine < 1.9 && bankDist > 4.5 && bankDist < 26.0;

        if (isPath) {
          tempColor.copy(colPathDirt);
        } else {
          // Slope & sun-based grass modulation
          tempColor.copy(colMeadowLush);
          tempColor.lerp(colMeadowSun, sunFacing * 0.65);

          if (normVec.y < 0.88 && sunFacing < 0.3) {
            tempColor.lerp(colMeadowShade, 0.45);
          }

          // Subtle natural organic hue variation
          const patchNoise = (Math.sin(vx * 0.28) + Math.cos(vz * 0.32)) * 0.05;
          tempColor.offsetHSL(patchNoise * 0.02, patchNoise * 0.03, patchNoise * 0.02);
        }
      } else {
        // Right side: steep rocky bluff & forested terraces
        if (isSteep) {
          tempColor.copy(colRockShadow).lerp(colRockSun, sunFacing * 0.75);
        } else {
          tempColor.copy(colForestDeep).lerp(colMeadowLush, sunFacing * 0.5);
        }
      }

      // Distant atmospheric haze fade
      if (vz < -38) {
        const fade = THREE.MathUtils.clamp((-38 - vz) / 45.0, 0, 0.72);
        tempColor.lerp(colDistanceHaze, fade);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.geometry = planeGeo;
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.03,
      flatShading: false, // Smooth painterly shading, no hard polygons!
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }
}
