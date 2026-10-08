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
    const segmentsX = 180;
    const segmentsZ = 180;

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

    // Curated Anime Landscape Palette (Studio Ghibli / Makoto Shinkai style)
    const colMeadowSun = new THREE.Color(0xbddc6e);     // Warm golden-green sunny pasture
    const colMeadowLush = new THREE.Color(0x7ba846);    // Rich vibrant anime grass
    const colMeadowShade = new THREE.Color(0x527740);   // Cool shaded grass hollows
    const colForestDeep = new THREE.Color(0x3c6148);    // Lush pine / forest green (vibrant)
    const colRockSun = new THREE.Color(0xcbc2b2);       // Sunlit warm granite / sandstone
    const colRockShadow = new THREE.Color(0x606c66);    // Shaded slate / mossy stone
    const colShoreSilt = new THREE.Color(0x747e70);     // Moist riverbank silt / pebbles
    const colPathDirt = new THREE.Color(0xcbb28c);      // Warm anime countryside dirt trail
    const colDistanceHaze = new THREE.Color(0x92aba0);  // Distant mountain silhouette

    const tempColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Find closest point on river spline in 2D (X-Z)
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

      // Determine which side of river (cross product with tangent in 2D)
      const toVertX = vx - closestSample.pos.x;
      const toVertZ = vz - closestSample.pos.z;
      const side = closestSample.tangent.x * toVertZ - closestSample.tangent.z * toVertX;
      const isLeftSide = side > 0; // Left bank (meadow), Right bank (rocky bluff)

      let vy = closestSample.pos.y;

      if (distToRiver < halfWidth) {
        // Inside wide river channel: carve smooth riverbed depression
        const channelDepth = 1.6 * (1.0 - distToRiver / halfWidth);
        vy -= channelDepth;
      } else {
        const bankDist = distToRiver - halfWidth;

        if (isLeftSide) {
          // Left Bank: Expansive rolling meadow plateau
          const bankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 7.5);
          const plateauHeight = 3.6 + Math.sin(vx * 0.06) * 1.0 + Math.cos(vz * 0.05) * 0.9;
          vy += bankRamp * plateauHeight;

          // Rolling hills further back on the meadow
          const farLeftDist = Math.max(0, -vx - 16);
          vy += Math.min(16, farLeftDist * 0.30 + Math.sin(vx * 0.08 + vz * 0.08) * 1.5);
        } else {
          // Right Bank: Rocky bluff & forested ridge
          const bankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 8.5);
          const bluffHeight = 6.5 + bankDist * 0.32 + Math.sin(vx * 0.08) * 1.8;
          vy += bankRamp * bluffHeight;

          // Foreground right rises into framing knoll
          if (vx > 16 && vz > 18) {
            const knollDist = Math.sqrt((vx - 30) ** 2 + (vz - 30) ** 2);
            vy += Math.max(0, (26 - knollDist) * 0.42);
          }
        }
      }

      // Distant background mountain range (along north/horizon edge)
      if (vz < -36) {
        const bgDist = (-36 - vz);
        vy += Math.min(36, bgDist * 0.52 + Math.sin(vx * 0.04 + vz * 0.03) * 5.5);
      }

      posAttr.setY(i, vy);

      // --- Anime Vertex Coloring ---
      const bankDist = Math.max(0, distToRiver - halfWidth);

      if (distToRiver < halfWidth + 2.0) {
        // Shoreline silt, pebbles, wet stone
        tempColor.copy(colShoreSilt);
      } else if (isLeftSide) {
        // Left side meadow & dirt path
        // Curving countryside trail in the meadow passing in front of cottage
        const pathLine = Math.abs((vz + vx * 0.5) - 2.0 + Math.sin(vx * 0.12) * 2.2);
        const isPath = pathLine < 2.0 && bankDist > 5.0 && bankDist < 26.0;

        if (isPath) {
          tempColor.copy(colPathDirt);
        } else {
          // Gradient between lush hollows and sunlit golden knolls
          const elevationFactor = THREE.MathUtils.clamp((vy - closestSample.pos.y - 1.8) / 4.2, 0, 1);
          tempColor.copy(colMeadowLush).lerp(colMeadowSun, elevationFactor);

          const patchNoise = (Math.sin(vx * 0.3) + Math.cos(vz * 0.35)) * 0.07;
          tempColor.offsetHSL(patchNoise * 0.02, patchNoise * 0.04, patchNoise * 0.03);

          if (vy < closestSample.pos.y + 2.8) {
            tempColor.lerp(colMeadowShade, 0.30);
          }
        }
      } else {
        // Right side: rocky bluff & forested terraces
        const slopeFactor = THREE.MathUtils.clamp((vy - closestSample.pos.y) / 12.0, 0, 1);
        tempColor.copy(colRockShadow).lerp(colForestDeep, slopeFactor);

        // Warm sunlit granite facets on exposed ledges
        if (Math.sin(vx * 0.18 + vz * 0.18) > 0.30 && slopeFactor > 0.22) {
          tempColor.lerp(colRockSun, 0.55);
        }
      }

      // Atmospheric haze blend in far background
      if (vz < -40) {
        const fade = THREE.MathUtils.clamp((-40 - vz) / 45.0, 0, 0.72);
        tempColor.lerp(colDistanceHaze, fade);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    planeGeo.computeVertexNormals();

    this.geometry = planeGeo;
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.03,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }
}
