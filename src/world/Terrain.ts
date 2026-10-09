import * as THREE from 'three';
import { SplinePointConfig } from '../utils/SplineUtils';

export interface RiverSampleData {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  width: number;
  t: number;
}

export class Terrain {
  public readonly group: THREE.Group;
  public readonly mesh: THREE.Mesh;
  public readonly geometry: THREE.BufferGeometry;
  public readonly material: THREE.MeshStandardMaterial;
  public readonly riverSamples: RiverSampleData[] = [];

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

      this.riverSamples.push({ pos, tangent, width: w, t });
    }

    // Curated Painterly Anime Palette (Studio Ghibli / Makoto Shinkai master reference)
    const colMeadowGolden = new THREE.Color(0xb2be56);  // Warm sunlit golden pasture
    const colMeadowLush = new THREE.Color(0x6e9638);    // Rich anime meadow green
    const colMeadowWarm = new THREE.Color(0x8eac44);    // Sunny clover patch / warm terrace
    const colMeadowOlive = new THREE.Color(0x5c7e30);   // Muted olive swales & sheltered dips
    const colMeadowDarkVeg = new THREE.Color(0x324e20); // Dark rich vegetation hollows
    const colTreeShadow = new THREE.Color(0x28421e);    // Soft cool-olive tree shadow pools
    const colBankCliff = new THREE.Color(0x8a7e66);     // Gentle earthen bank slope
    const colBankLedge = new THREE.Color(0xbab092);     // Sunlit earthen strata
    const colRockSun = new THREE.Color(0xded2ba);       // Sunlit warm buff granite ledges
    const colRockShadow = new THREE.Color(0x5a6c56);    // Shaded moss-dusted cliff ledge
    const colShoreDamp = new THREE.Color(0x5c5444);     // Wet warm earth
    const colShoreSilt = new THREE.Color(0x9c9480);     // Warm riverbank gravel & golden silt
    const colPathDirt = new THREE.Color(0xd2b88e);      // Weathered anime countryside dirt trail
    const colPathEdge = new THREE.Color(0xaa9e78);      // Grassy soil blend along path verge
    const colDistanceHaze = new THREE.Color(0xaecad4);  // Atmospheric sky-mist distance fade
    const colForegroundRich = new THREE.Color(0x22402a); // Rich dark foreground bluff base

    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempColor = new THREE.Color();

    // Hand-curated tree shadow casters for left meadow (soft ambient occlusions)
    const treeShadowCenters = [
      { x: -26 - 3.2, z: -22 + 3.4, radius: 5.4, strength: 0.32 }, // Sakura over cottage
      { x: -34 - 3.2, z: -16 + 3.4, radius: 5.2, strength: 0.32 }, // Sakura grove slope
      { x: -16 - 3.0, z: -25 + 3.2, radius: 4.8, strength: 0.34 }, // Broadleaf behind cottage
      { x: -21 - 3.2, z: -4 + 3.4, radius: 5.2, strength: 0.35 },  // Lower meadow oak
      { x: -25 - 3.2, z: 8 + 3.4, radius: 5.0, strength: 0.32 },   // Terrace oak
      { x: -20 - 2.8, z: -16 + 2.8, radius: 5.8, strength: 0.30 }, // Cottage structure shadow
    ];

    // Pass 1: Shape Terrain Elevations
    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const info = this.getHeightAt(vx, vz);
      posAttr.setY(i, info.y);
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
      const info = this.getHeightAt(vx, vz);
      const distToRiver = info.distToRiver;
      const halfWidth = info.halfWidth;
      const bankDist = info.bankDist;
      const isLeftSide = info.isLeftSide;

      // Sun exposure: faces pointing toward sun (+X, -Z) receive warm golden tint
      const sunFacing = THREE.MathUtils.clamp(normVec.dot(sunDir), 0, 1);
      const isSteep = normVec.y < 0.78;

      if (distToRiver < halfWidth + 0.9) {
        // Wet shoreline margin / submerged gravel shelf
        tempColor.copy(colShoreDamp).lerp(colShoreSilt, 0.5);
      } else if (distToRiver < halfWidth + 4.5 && isLeftSide) {
        // Naturally sloping bank: gentle transition from shoreline to meadow
        const strataBlend = THREE.MathUtils.clamp((vy - info.sampleY) / 1.5, 0, 1);
        tempColor.copy(colBankCliff).lerp(colMeadowOlive, strataBlend * 0.65).lerp(colMeadowLush, strataBlend * strataBlend);
        if (sunFacing > 0.35) {
          tempColor.lerp(colBankLedge, 0.40);
        }
      } else if (isLeftSide) {
        // Left side: Countryside dirt trail & painterly meadow variation
        // Distance to country path connecting cottage (-21.5, -16.5) to stepping stones (-9.5, 5.5)
        const pStartX = -21.5;
        const pStartZ = -16.5;
        const abX = -9.5 - pStartX;
        const abZ = 5.5 - pStartZ;
        const abLenSq = abX * abX + abZ * abZ;
        const tPath = THREE.MathUtils.clamp(((vx - pStartX) * abX + (vz - pStartZ) * abZ) / abLenSq, 0, 1);
        const nearPathX = pStartX + tPath * abX + Math.sin(tPath * Math.PI) * 1.2;
        const nearPathZ = pStartZ + tPath * abZ;
        const distToPath = Math.hypot(vx - nearPathX, vz - nearPathZ);

        const inPathCore = distToPath < 1.45 && bankDist > 3.0 && bankDist < 28.0;
        const inPathVerge = distToPath >= 1.45 && distToPath < 2.85 && bankDist > 2.5 && bankDist < 29.0;

        if (inPathCore) {
          tempColor.copy(colPathDirt);
          if (sunFacing > 0.35) {
            tempColor.lerp(colPathEdge, 0.25);
          }
        } else if (inPathVerge) {
          const vergeFactor = (distToPath - 1.45) / 1.40;
          tempColor.copy(colPathEdge).lerp(colMeadowLush, vergeFactor);
        } else {
          // Macro regional zoning:
          // 1. Broad sunlit golden terraces
          const goldenRegion = Math.sin(vx * 0.08 + 0.8) * Math.cos(vz * 0.07);
          // 2. Muted olive swales in contours
          const oliveSwale = Math.cos(vx * 0.11 - 1.0) * Math.sin(vz * 0.09);

          tempColor.copy(colMeadowLush);

          if (goldenRegion > 0.1) {
            tempColor.lerp(colMeadowGolden, (goldenRegion - 0.1) * 0.85);
          }

          if (oliveSwale > 0.25) {
            tempColor.lerp(colMeadowOlive, (oliveSwale - 0.25) * 0.70);
          }

          // Warm clover / sunny meadow modulation
          tempColor.lerp(colMeadowWarm, sunFacing * 0.55);

          // Deep vegetation hollows in low shaded areas
          if (normVec.y < 0.90 && sunFacing < 0.25) {
            tempColor.lerp(colMeadowDarkVeg, 0.55);
          }

          // Subtle natural organic hue variation (very smooth)
          const patchNoise = (Math.sin(vx * 0.16) + Math.cos(vz * 0.18)) * 0.04;
          tempColor.offsetHSL(patchNoise * 0.015, patchNoise * 0.02, patchNoise * 0.015);
        }

        // Cottage clearing trodden soil patch
        const cottageDist = Math.sqrt((vx - -20) ** 2 + (vz - -16) ** 2);
        if (cottageDist < 4.8) {
          const clearingFactor = THREE.MathUtils.smoothstep(cottageDist, 1.2, 4.8);
          tempColor.lerp(colPathEdge, (1.0 - clearingFactor) * 0.60);
        }

        // Bake cool tree shadows into the meadow
        for (let s = 0; s < treeShadowCenters.length; s++) {
          const tc = treeShadowCenters[s];
          const dx = vx - tc.x;
          const dz = vz - tc.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < tc.radius * 1.1) {
            const shadowWeight = (1.0 - THREE.MathUtils.smoothstep(dist, tc.radius * 0.1, tc.radius * 1.1)) * tc.strength;
            tempColor.lerp(colTreeShadow, shadowWeight);
          }
        }
      } else {
        // Right side: rich forested hillside with mossy understory and warm granite outcrops
        if (isSteep && vx > 36) {
          tempColor.copy(colRockShadow).lerp(colRockSun, sunFacing * 0.85);
        } else {
          // Lush forest understory beneath maples and pines
          tempColor.copy(colMeadowDarkVeg).lerp(colMeadowOlive, sunFacing * 0.55 + 0.30);
          if (vz > 15 && vx > 18) {
            tempColor.lerp(colForegroundRich, 0.55);
          }
        }
      }

      // Distant atmospheric haze fade: dissolves progressively into pale sky mist
      if (vz < -34) {
        const fade = THREE.MathUtils.clamp((-34 - vz) / 52.0, 0, 0.82);
        tempColor.lerp(colDistanceHaze, fade);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Generate high-resolution painterly ground texture
    const groundMap = this.createPainterlyGroundTexture();

    this.geometry = planeGeo;
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: groundMap,
      roughness: 0.86,
      metalness: 0.02,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }

  /**
   * Generates a 2048x2048 painterly canvas texture adding rich Studio Ghibli-grade watercolor
   * washes, golden clover pastures, trodden country trail with stepping stones, soft tree shadows,
   * and naturally eroded riverbank strata.
   */
  private createPainterlyGroundTexture(): THREE.CanvasTexture {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base warm natural paper wash with subtle golden-green undertone
    const baseGrad = ctx.createLinearGradient(0, 0, size, 0);
    baseGrad.addColorStop(0.0, '#c8dcb0'); // Left meadow: luminous golden-green wash
    baseGrad.addColorStop(0.48, '#bed2a5');
    baseGrad.addColorStop(0.52, '#b2c49c'); // River channel bed
    baseGrad.addColorStop(0.70, '#a4b88e'); // Right bluff
    baseGrad.addColorStop(1.0, '#96aa80');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    const toCanvasX = (wx: number) => ((wx + 125) / 250) * size;
    const toCanvasZ = (wz: number) => ((wz + 125) / 250) * size;

    // 1. Broad Sunlit Golden Pasture Washes on Left Meadow
    const goldenWashes = [
      { x: -24, z: 0, r1: 30, r2: 380, col: 'rgba(242, 232, 160, 0.36)' },
      { x: -22, z: -16, r1: 20, r2: 260, col: 'rgba(245, 235, 170, 0.32)' },
      { x: -26, z: 14, r1: 20, r2: 290, col: 'rgba(240, 230, 162, 0.35)' },
      { x: -34, z: -6, r1: 25, r2: 320, col: 'rgba(238, 228, 155, 0.30)' },
    ];

    goldenWashes.forEach((w) => {
      const cx = toCanvasX(w.x);
      const cz = toCanvasZ(w.z);
      const grad = ctx.createRadialGradient(cx, cz, w.r1, cx, cz, w.r2);
      grad.addColorStop(0, w.col);
      grad.addColorStop(0.65, 'rgba(242, 246, 205, 0.28)');
      grad.addColorStop(1, 'rgba(240, 245, 230, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cz, w.r2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fresh clover & lush green washes
    const cloverWashes = [
      { x: -18, z: -4, r: 210, col: 'rgba(210, 238, 155, 0.42)' },
      { x: -20, z: 8, r: 240, col: 'rgba(215, 240, 165, 0.38)' },
      { x: -28, z: -20, r: 190, col: 'rgba(205, 232, 150, 0.36)' },
    ];

    cloverWashes.forEach((w) => {
      const cx = toCanvasX(w.x);
      const cz = toCanvasZ(w.z);
      const grad = ctx.createRadialGradient(cx, cz, 10, cx, cz, w.r);
      grad.addColorStop(0, w.col);
      grad.addColorStop(1, 'rgba(235, 245, 220, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cz, w.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Muted olive swales in slope contours
    const oliveSwales = [
      { x: -14, z: -14, r: 180, col: 'rgba(168, 195, 125, 0.35)' },
      { x: -15, z: 2, r: 200, col: 'rgba(162, 190, 120, 0.32)' },
      { x: -18, z: 20, r: 220, col: 'rgba(155, 185, 115, 0.35)' },
    ];

    oliveSwales.forEach((w) => {
      const cx = toCanvasX(w.x);
      const cz = toCanvasZ(w.z);
      const grad = ctx.createRadialGradient(cx, cz, 10, cx, cz, w.r);
      grad.addColorStop(0, w.col);
      grad.addColorStop(1, 'rgba(230, 240, 220, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cz, w.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Japanese Countryside Dirt Trail with stepping stones & grassy verges
    // Smoothly connects cottage (-20, -16) to stepping stone approach (-9.5, 5)
    const waypoints = [
      { x: -22.0, z: -17.5 },
      { x: -19.5, z: -14.0 },
      { x: -17.2, z: -10.5 },
      { x: -15.4, z: -6.5 },
      { x: -13.5, z: -2.0 },
      { x: -11.2, z: 2.0 },
      { x: -9.5,  z: 5.5 },
    ];

    const pathPoints: { x: number; z: number }[] = [];
    for (let w = 0; w < waypoints.length - 1; w++) {
      const p0 = waypoints[w];
      const p1 = waypoints[w + 1];
      for (let step = 0; step < 8; step++) {
        const t = step / 8;
        const smoothT = t * t * (3 - 2 * t);
        const px = THREE.MathUtils.lerp(p0.x, p1.x, smoothT) + Math.sin(step * 0.8 + w) * 0.15;
        const pz = THREE.MathUtils.lerp(p0.z, p1.z, smoothT) + Math.cos(step * 0.8 + w) * 0.15;
        pathPoints.push({ x: px, z: pz });
      }
    }
    pathPoints.push(waypoints[waypoints.length - 1]);

    // Outer grassy verge blend (soft weathered loam)
    ctx.beginPath();
    ctx.lineWidth = 54;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(182, 165, 122, 0.72)';
    pathPoints.forEach((p, idx) => {
      const px = toCanvasX(p.x);
      const pz = toCanvasZ(p.z);
      if (idx === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    });
    ctx.stroke();

    // Dirt trail core (warm weathered ochre-tan)
    ctx.beginPath();
    ctx.lineWidth = 32;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(215, 186, 138, 0.95)';
    pathPoints.forEach((p, idx) => {
      const px = toCanvasX(p.x);
      const pz = toCanvasZ(p.z);
      if (idx === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    });
    ctx.stroke();

    // Weathered wheel ruts / trodden core
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(165, 135, 95, 0.65)';
    pathPoints.forEach((p, idx) => {
      const px = toCanvasX(p.x + Math.sin(idx * 0.5) * 0.25);
      const pz = toCanvasZ(p.z + Math.cos(idx * 0.5) * 0.25);
      if (idx === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    });
    ctx.stroke();

    // 3. Naturally Eroded Riverbank Cut-Bank Strata & Wet Shoreline
    // Trace the left riverbank contour
    ctx.beginPath();
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(152, 140, 118, 0.48)';
    for (let t = 0; t <= 1; t += 0.02) {
      const p = this.riverSamples[Math.floor(t * (this.riverSamples.length - 1))];
      const norm = new THREE.Vector3(-p.tangent.z, 0, p.tangent.x).normalize();
      const edge = p.pos.clone().addScaledVector(norm, p.width * 0.5 + 1.2);
      const px = toCanvasX(edge.x);
      const pz = toCanvasZ(edge.z);
      if (t === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    }
    ctx.stroke();

    // Dark damp soil right at waterline
    ctx.beginPath();
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(68, 58, 46, 0.58)';
    for (let t = 0; t <= 1; t += 0.02) {
      const p = this.riverSamples[Math.floor(t * (this.riverSamples.length - 1))];
      const norm = new THREE.Vector3(-p.tangent.z, 0, p.tangent.x).normalize();
      const edge = p.pos.clone().addScaledVector(norm, p.width * 0.5 + 0.3);
      const px = toCanvasX(edge.x);
      const pz = toCanvasZ(edge.z);
      if (t === 0) ctx.moveTo(px, pz);
      else ctx.lineTo(px, pz);
    }
    ctx.stroke();

    // 4. Soft Dappled Tree Shadow Pools (watercolor falloff with sunlit light holes)
    const treeShadowPools = [
      { x: -26 - 3.2, z: -22 + 3.4, r: 160 }, // Sakura over cottage
      { x: -34 - 3.2, z: -16 + 3.4, r: 150 }, // Sakura grove slope
      { x: -16 - 3.0, z: -25 + 3.2, r: 140 }, // Broadleaf behind cottage
      { x: -21 - 3.2, z: -4 + 3.4,  r: 155 }, // Lower meadow oak
      { x: -25 - 3.2, z: 8 + 3.4,   r: 145 }, // Terrace oak
      { x: -20 - 2.8, z: -16 + 2.8, r: 165 }, // Cottage structure
    ];

    treeShadowPools.forEach((ts) => {
      const cx = toCanvasX(ts.x);
      const cz = toCanvasZ(ts.z);
      const grad = ctx.createRadialGradient(cx, cz, 15, cx, cz, ts.r);
      grad.addColorStop(0, 'rgba(65, 92, 48, 0.42)');
      grad.addColorStop(0.65, 'rgba(78, 105, 58, 0.22)');
      grad.addColorStop(1, 'rgba(100, 125, 75, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cz, ts.r, 0, Math.PI * 2);
      ctx.fill();

      // Dappled sunlight holes inside shadow
      for (let d = 0; d < 6; d++) {
        const hx = cx + Math.sin(d * 2.1) * (ts.r * 0.45);
        const hz = cz + Math.cos(d * 2.7) * (ts.r * 0.45);
        const hGrad = ctx.createRadialGradient(hx, hz, 2, hx, hz, 16);
        hGrad.addColorStop(0, 'rgba(255, 248, 205, 0.35)');
        hGrad.addColorStop(1, 'rgba(255, 248, 205, 0.0)');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(hx, hz, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Painterly Wildflower Dabs in Drifting Meadow Colonies
    const flowerDabs = [
      { col: '#fffdf5', count: 400 }, // Daisy white
      { col: '#ffe478', count: 350 }, // Buttercup yellow
      { col: '#f8c8d6', count: 350 }, // Cosmos pink
      { col: '#c8bfe2', count: 250 }, // Lavender
    ];

    flowerDabs.forEach((fd) => {
      ctx.fillStyle = fd.col;
      for (let i = 0; i < fd.count; i++) {
        const wx = -45 + (Math.sin(i * 19.3 + 1.2) * 0.5 + 0.5) * 36;
        const wz = -35 + (Math.cos(i * 23.7 + 2.4) * 0.5 + 0.5) * 65;
        const px = toCanvasX(wx);
        const pz = toCanvasZ(wz);
        const r = 2.2 + (i % 4) * 0.8;
        ctx.beginPath();
        ctx.arc(px, pz, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 6. Right Bluff Forest Floor (rich dark pine needle bed - soft organic watercolor washes)
    const bluffCenters = [
      { x: 30, z: -35, r: 180 },
      { x: 26, z: -15, r: 220 },
      { x: 32, z: 10, r: 240 },
      { x: 22, z: 28, r: 200 },
      { x: 38, z: 40, r: 220 },
    ];
    bluffCenters.forEach((b) => {
      const cx = toCanvasX(b.x);
      const cz = toCanvasZ(b.z);
      const grad = ctx.createRadialGradient(cx, cz, b.r * 0.1, cx, cz, b.r);
      grad.addColorStop(0, 'rgba(48, 68, 38, 0.36)');
      grad.addColorStop(0.55, 'rgba(56, 76, 44, 0.20)');
      grad.addColorStop(1, 'rgba(56, 76, 44, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cz, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Subtle Watercolor Paper Stippling (tactile illustration board texture)
    for (let i = 0; i < 1600; i++) {
      const rx = (Math.sin(i * 12.3) * 0.5 + 0.5) * size;
      const rz = (Math.cos(i * 17.7) * 0.5 + 0.5) * size;
      const radius = 2 + (i % 5) * 1.2;
      const alpha = 0.025 + (i % 4) * 0.015;
      ctx.beginPath();
      ctx.arc(rx, rz, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 255, 245, ${alpha})` : `rgba(180, 210, 160, ${alpha})`;
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Deterministic elevation & river query for any (vx, vz) world coordinate.
   */
  public getHeightAt(vx: number, vz: number): {
    y: number;
    sampleY: number;
    isLeftSide: boolean;
    distToRiver: number;
    bankDist: number;
    halfWidth: number;
  } {
    let minDistSq = Infinity;
    let closestIdx = 0;

    for (let s = 0; s < this.riverSamples.length; s++) {
      const dx = vx - this.riverSamples[s].pos.x;
      const dz = vz - this.riverSamples[s].pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestIdx = s;
      }
    }

    const closestSample = this.riverSamples[closestIdx];
    const distToRiver = Math.sqrt(minDistSq);
    const halfWidth = closestSample.width * 0.5;

    const toVertX = vx - closestSample.pos.x;
    const toVertZ = vz - closestSample.pos.z;
    const side = closestSample.tangent.x * toVertZ - closestSample.tangent.z * toVertX;
    const isLeftSide = side > 0;

    // Organic shoreline undulation on right and left banks
    let effectiveHalfWidth = halfWidth;
    if (!isLeftSide) {
      // Rocky shoreline promontories and cove inlets to break straight shoreline
      const rightShoreCove = Math.sin(vz * 0.16 + 1.2) * 1.8 + Math.cos(vz * 0.35 + 0.4) * 1.1;
      effectiveHalfWidth += rightShoreCove;
    } else {
      // Left Shore Guardian Monolith Promontory:
      // The grassy meadow bank juts outward to firmly anchor the Guardian Monolith (Reference.png)
      const monolithPromontory = Math.exp(-Math.pow((vz - -3.5) / 4.8, 2.0)) * 4.5;
      effectiveHalfWidth -= monolithPromontory;
    }

    let vy = closestSample.pos.y;

    if (distToRiver < effectiveHalfWidth) {
      // Inside wide river channel: concave basin below water surface
      const channelDepth = 1.8 * (1.0 - distToRiver / effectiveHalfWidth);
      vy -= channelDepth;
    } else {
      const bankDist = distToRiver - effectiveHalfWidth;

      if (isLeftSide) {
        // Left Bank: Gentle grassy slope rolling naturally down to the water and gravel beach
        const cutBankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 6.0);
        const cutBankHeight = 1.1;

        const meadowRamp = THREE.MathUtils.smoothstep(bankDist, 3.0, 16.0);
        const rawHeight = (vx * 0.04 + vz * 0.03);
        const terrace = Math.floor(rawHeight * 2.0) * 0.4 + Math.sin(rawHeight * 4.0) * 0.12;
        const rollingKnolls = Math.sin(vx * 0.07) * 0.9 + Math.cos(vz * 0.06) * 0.8 + Math.sin(vx * 0.14 + vz * 0.12) * 0.35;
        const plateauHeight = cutBankHeight + 1.6 + terrace + rollingKnolls;

        vy += cutBankRamp * cutBankHeight + meadowRamp * (plateauHeight - cutBankHeight);

        // Monolith promontory knoll (natural grassy shoulder supporting the Guardian Monolith)
        const monolithKnoll = Math.exp(-Math.pow((vx - -17.5) / 4.5, 2.0) - Math.pow((vz - -3.5) / 4.5, 2.0)) * 1.45;
        vy += monolithKnoll;

        // Far left background hills (gated strictly to far-left territory vx < -16)
        const farLeftDist = Math.max(0, -vx - 16);
        if (farLeftDist > 0) {
          const hillRamp = THREE.MathUtils.smoothstep(farLeftDist, 0, 6.0);
          vy += hillRamp * Math.min(18, farLeftDist * 0.32 + Math.max(0, Math.sin(vx * 0.08 + vz * 0.07) * 1.8));
        }
      } else {
        // Right Bank: Steep rocky bluff rising from the water with crags & ledges
        const bankRamp = THREE.MathUtils.smoothstep(bankDist, 0, 9.0);
        const bluffHeight = 6.8 + bankDist * 0.38 + Math.sin(vx * 0.08) * 2.2 + Math.cos(vz * 0.07) * 1.5;
        vy += bankRamp * bluffHeight;

        // Towering canyon walls enclosing the upper gorge
        if (vx > 36 && vz < -25) {
          const gorgeElevation = Math.max(0, (vx - 36) * 0.45 + (-25 - vz) * 0.35);
          vy += Math.min(22, gorgeElevation);
        }

        // Foreground right framing knoll
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

    return {
      y: vy,
      sampleY: closestSample.pos.y,
      isLeftSide,
      distToRiver,
      bankDist: Math.max(0, distToRiver - effectiveHalfWidth),
      halfWidth: effectiveHalfWidth,
    };
  }
}
