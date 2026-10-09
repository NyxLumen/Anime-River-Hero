import * as THREE from 'three';
import { Terrain } from './Terrain';

export interface TreePlacementConfig {
  archetype:
    | 'sakura'
    | 'greenBroadleaf'
    | 'autumnBroadleaf'
    | 'pine'
    | 'smallBackground'
    | 'bush'
    | 'foregroundFraming';
  x: number;
  z: number;
  scale: number;
  yOffset?: number;
  rotationY?: number;
}

export class Trees {
  public readonly group: THREE.Group;
  private terrain: Terrain;

  private sharedFoliageMaterial: THREE.MeshStandardMaterial;
  private sharedTrunkMaterial: THREE.MeshStandardMaterial;
  private sharedForegroundFoliageMaterial: THREE.MeshStandardMaterial;

  private sakuraCardMaterial: THREE.MeshStandardMaterial;
  private broadleafCardMaterial: THREE.MeshStandardMaterial;
  private autumnCardMaterial: THREE.MeshStandardMaterial;
  private foregroundCardMaterial: THREE.MeshStandardMaterial;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'TreesGroup';
    this.terrain = terrain;

    // 1. Core Materials
    this.sharedFoliageMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.02,
      flatShading: false,
    });

    this.sharedTrunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3024, // Weathered dark cedar/oak timber
      roughness: 0.90,
      metalness: 0.02,
    });

    this.sharedForegroundFoliageMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.02,
      flatShading: false,
    });

    // 2. High-Quality Alpha-Tested Foliage Card Materials with Outward Translucency
    this.sakuraCardMaterial = new THREE.MeshStandardMaterial({
      map: this.createSakuraClusterTexture(),
      alphaTest: 0.22,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.85,
      emissive: new THREE.Color(0xf0b0c4),
      emissiveIntensity: 0.06,
    });

    this.broadleafCardMaterial = new THREE.MeshStandardMaterial({
      map: this.createBroadleafClusterTexture(),
      alphaTest: 0.22,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.84,
      emissive: new THREE.Color(0x6aa038),
      emissiveIntensity: 0.06,
    });

    this.autumnCardMaterial = new THREE.MeshStandardMaterial({
      map: this.createAutumnClusterTexture(),
      alphaTest: 0.22,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.84,
      emissive: new THREE.Color(0x944018),
      emissiveIntensity: 0.03,
    });

    this.foregroundCardMaterial = new THREE.MeshStandardMaterial({
      map: this.createForegroundFramingTexture(),
      alphaTest: 0.22,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.88,
      emissive: new THREE.Color(0x1a2e22),
      emissiveIntensity: 0.12,
    });

    this.placeTrees();
  }

  // ==========================================
  // TEXTURE ATLAS GENERATION (512x512 Canvas)
  // ==========================================

  /**
   * Procedural canvas texture for painterly cherry blossom petal cloud clusters.
   */
  private createSakuraClusterTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Multiple layered blossom rosettes and floating petal clusters
    const clusters = [
      { cx: 256, cy: 190, r: 85, rot: 0.1 },
      { cx: 340, cy: 260, r: 75, rot: 1.2 },
      { cx: 300, cy: 360, r: 80, rot: 2.3 },
      { cx: 180, cy: 350, r: 78, rot: 3.6 },
      { cx: 150, cy: 240, r: 72, rot: 4.8 },
      { cx: 256, cy: 275, r: 65, rot: 0.6 },
      // Satellite blossom tufts breaking outer silhouette
      { cx: 380, cy: 180, r: 48, rot: 1.8 },
      { cx: 120, cy: 170, r: 45, rot: 3.2 },
      { cx: 240, cy: 420, r: 52, rot: 0.9 },
    ];

    clusters.forEach((c) => {
      ctx.save();
      ctx.translate(c.cx, c.cy);
      ctx.rotate(c.rot);

      // 5-petal sakura rosette
      for (let p = 0; p < 5; p++) {
        const pAngle = (p / 5) * Math.PI * 2;
        const px = Math.cos(pAngle) * (c.r * 0.52);
        const py = Math.sin(pAngle) * (c.r * 0.52);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(pAngle + Math.PI / 2);

        // Heart-shaped notched sakura petal
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.44, c.r * 0.58, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fceaf0';
        ctx.fill();

        // Soft sunlit petal highlight dab
        ctx.beginPath();
        ctx.ellipse(0, -c.r * 0.15, c.r * 0.28, c.r * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        // Inner soft rosy blush
        ctx.beginPath();
        ctx.ellipse(0, c.r * 0.12, c.r * 0.28, c.r * 0.34, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(238, 155, 182, 0.65)';
        ctx.fill();

        ctx.restore();
      }

      // Deep plum blossom center pistil
      ctx.beginPath();
      ctx.arc(0, 0, c.r * 0.20, 0, Math.PI * 2);
      ctx.fillStyle = '#b84e72';
      ctx.fill();

      // Golden pollen fleck
      ctx.beginPath();
      ctx.arc(0, 0, c.r * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4a8';
      ctx.fill();

      ctx.restore();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Procedural canvas texture for painterly broadleaf foliage clusters.
   * Studio Ghibli / Makoto Shinkai watercolor anime style: smooth continuous lighting
   * gradient across an organic scalloped cloud mass with crisp silhouette leaf tips.
   * Zero concentric bullseye rings or dark holes!
   */
  private createBroadleafClusterTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Unified painterly anime foliage cloud mass (Studio Ghibli style)
    // Continuous organic scalloped outline — zero concentric circular rings
    ctx.beginPath();
    const cx = 256, cy = 256, baseR = 175;
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
      const r = baseR + Math.sin(a * 7.0) * 22 + Math.cos(a * 11.0) * 14 + Math.sin(a * 3.0) * 18;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Smooth sun-to-shadow watercolor wash spanning entire cluster
    const clusterGrad = ctx.createLinearGradient(160, 100, 320, 420);
    clusterGrad.addColorStop(0.0, '#b8ea58'); // Sunlit luminous lime
    clusterGrad.addColorStop(0.35, '#7cb43c'); // Saturated fresh leafy green
    clusterGrad.addColorStop(0.70, '#528626'); // Rich midtone green
    clusterGrad.addColorStop(1.0, '#305416');  // Deep shadow green
    ctx.fillStyle = clusterGrad;
    ctx.fill();

    // Crisp anime leaf-tip silhouettes breaking the perimeter
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2 + (Math.sin(i * 3.1) - 0.5) * 0.22;
      const r = baseR + 10 + Math.sin(i * 4.3) * 18;
      const lx = cx + Math.cos(angle) * r;
      const ly = cy + Math.sin(angle) * r;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 26, 0, 0, Math.PI * 2);
      const sunT = Math.max(0, -Math.sin(angle) * 0.5 + 0.5);
      ctx.fillStyle = sunT > 0.45 ? '#a8de4e' : '#4e8224';
      ctx.fill();
      ctx.restore();
    }

    // Soft dappled watercolor highlights on sunlit crest
    for (let h = 0; h < 6; h++) {
      const hx = 220 + Math.sin(h * 2.3) * 55;
      const hy = 175 + Math.cos(h * 2.7) * 45;
      const hGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, 48);
      hGrad.addColorStop(0.0, 'rgba(235, 255, 185, 0.45)');
      hGrad.addColorStop(1.0, 'rgba(235, 255, 180, 0.0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Procedural canvas texture for painterly autumn maple leaf clusters.
   * Warm vibrant gradient from glowing golden amber to deep vermilion and russet.
   */
  private createAutumnClusterTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Continuous organic scalloped outline — zero concentric rings
    ctx.beginPath();
    const cx = 256, cy = 256, baseR = 175;
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
      const r = baseR + Math.sin(a * 7.0) * 22 + Math.cos(a * 11.0) * 14 + Math.sin(a * 3.0) * 18;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Warm radiant autumn maple gradient
    const clusterGrad = ctx.createLinearGradient(160, 100, 320, 420);
    clusterGrad.addColorStop(0.0, '#fcd85c'); // Sunlit golden amber
    clusterGrad.addColorStop(0.32, '#f48a24'); // Vibrant fiery orange
    clusterGrad.addColorStop(0.68, '#d44414'); // Rich vermilion maple
    clusterGrad.addColorStop(1.0, '#6e1a0a');  // Deep autumn russet shadow
    ctx.fillStyle = clusterGrad;
    ctx.fill();

    // Silhouette leaf tips
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2 + (Math.sin(i * 3.1) - 0.5) * 0.22;
      const r = baseR + 10 + Math.sin(i * 4.3) * 18;
      const lx = cx + Math.cos(angle) * r;
      const ly = cy + Math.sin(angle) * r;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 26, 0, 0, Math.PI * 2);
      const sunT = Math.max(0, -Math.sin(angle) * 0.5 + 0.5);
      ctx.fillStyle = sunT > 0.45 ? '#fca434' : '#ba3010';
      ctx.fill();
      ctx.restore();
    }

    // Golden sunlit glazes
    for (let h = 0; h < 6; h++) {
      const hx = 220 + Math.sin(h * 2.3) * 55;
      const hy = 175 + Math.cos(h * 2.7) * 45;
      const hGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, 48);
      hGrad.addColorStop(0.0, 'rgba(255, 240, 165, 0.45)');
      hGrad.addColorStop(1.0, 'rgba(255, 235, 150, 0.0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }



  /**
   * Procedural canvas texture for foreground framing tree branches & silhouette leaves.
   */
  private createForegroundFramingTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Dark, rich silhouette foliage sprays with delicate pink blossom highlights
    const framingTufts = [
      { cx: 256, cy: 180, rx: 75, ry: 100, rot: 0.1, col: '#162e20', rim: '#2a543a' },
      { cx: 360, cy: 260, rx: 70, ry: 95, rot: 1.2, col: '#183424', rim: '#326044' },
      { cx: 310, cy: 370, rx: 72, ry: 95, rot: 2.2, col: '#12261a', rim: '#244832' },
      { cx: 170, cy: 360, rx: 72, ry: 95, rot: 3.8, col: '#142a1c', rim: '#284e36' },
      { cx: 140, cy: 240, rx: 65, ry: 90, rot: 5.0, col: '#1a3626', rim: '#346648' },
      { cx: 256, cy: 280, rx: 80, ry: 85, rot: 0.0, col: '#163022', rim: '#2e5a3e' },
    ];

    framingTufts.forEach((t) => {
      ctx.save();
      ctx.translate(t.cx, t.cy);
      ctx.rotate(t.rot);

      // Dark rich silhouette foliage spray
      ctx.beginPath();
      ctx.ellipse(0, 0, t.rx, t.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = t.col;
      ctx.fill();

      // Soft rim highlight dab
      ctx.beginPath();
      ctx.ellipse(-t.rx * 0.15, -t.ry * 0.20, t.rx * 0.35, t.ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 110, 78, 0.35)';
      ctx.fill();

      ctx.restore();
    });

    // Pink blossom accents nestled on framing branches
    const blossomDabs = [
      { x: 230, y: 150, r: 24 },
      { x: 380, y: 220, r: 22 },
      { x: 140, y: 290, r: 25 },
      { x: 290, y: 390, r: 20 },
    ];
    blossomDabs.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#f8c2d4';
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  // ==========================================
  // FOLIAGE CLUSTER & SILHOUETTE CARD SYSTEM
  // ==========================================

  /**
   * Generates sculpted anime foliage cloud mass geometry with outward spherical normal biasing.
   * Normals point smoothly outward from the clump center, giving the signature Studio Ghibli
   * unified volumetric lighting gradient across the whole foliage cloud.
   */
  private createOrganicFoliageLobe(
    radius: number,
    baseColorHex: number,
    sunlitColorHex: number,
    shadowColorHex: number,
    seed: number,
    treeType: 'sakura' | 'broadleaf' | 'autumn' | 'pine' = 'broadleaf'
  ): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, 22, 18);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const v = new THREE.Vector3();
    const colors = new Float32Array(vertexCount * 3);

    const baseCol = new THREE.Color(baseColorHex);
    const sunlitCol = new THREE.Color(sunlitColorHex);
    const shadowCol = new THREE.Color(shadowColorHex);
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempCol = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      v.fromBufferAttribute(pos, i);

      // Flatten in Y to produce layered anime cloud-like canopy cushions
      v.y *= 0.58;

      const angle = Math.atan2(v.z, v.x);

      if (treeType === 'sakura') {
        // Delicate scalloped petal cloud swells
        const scallop =
          Math.abs(Math.sin(angle * 3.0 + seed)) * 0.24 +
          Math.cos(angle * 5.0 + seed * 1.5) * 0.16;
        v.x *= 1.0 + scallop;
        v.z *= 1.0 + scallop;
        v.y += Math.sin(v.x * 2.8 + v.z * 2.8 + seed) * 0.14 * radius;
      } else {
        // Multi-frequency organic leafy clump bulges
        const clumpNoise =
          Math.sin(angle * 3.0 + seed) * 0.24 +
          Math.cos(angle * 5.0 + seed * 1.7) * 0.16 +
          Math.sin(angle * 7.0 + seed * 2.3) * 0.09;
        v.x *= 1.0 + clumpNoise;
        v.z *= 1.0 + clumpNoise;
        v.y +=
          (Math.sin(v.x * 2.5 + v.z * 2.5 + seed) * 0.14 +
            Math.cos(v.y * 3.2 + seed) * 0.09) *
          radius;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    // SPHERICAL NORMAL TRANSFER (Outward Normal Biasing):
    // Normals point radially outward from cluster center (0,0,0) blended with sky-up
    const normals = new Float32Array(vertexCount * 3);
    const norm = new THREE.Vector3();

    for (let i = 0; i < vertexCount; i++) {
      v.fromBufferAttribute(pos, i);
      // Outward spherical normal from cluster center
      norm.copy(v).normalize();
      // Upward bias for natural sky illumination
      norm.y = Math.max(norm.y, 0.20);
      norm.normalize();

      normals[i * 3] = norm.x;
      normals[i * 3 + 1] = norm.y;
      normals[i * 3 + 2] = norm.z;

      const sunFactor = norm.dot(sunDir);
      const isUnderside = norm.y < -0.10;
      const underFactor = isUnderside ? Math.abs(norm.y) * 0.60 : 0.0;

      tempCol.copy(baseCol);
      // Soft interior shadow
      tempCol.lerp(
        shadowCol,
        THREE.MathUtils.clamp((-sunFactor + 0.35 + underFactor) * 0.88, 0, 1)
      );
      // Luminous sunlit highlight on crest
      tempCol.lerp(
        sunlitCol,
        THREE.MathUtils.clamp((sunFactor - 0.02) * 0.95, 0, 1)
      );

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  /**
   * Generates dense, overlapping foliage cluster cards around each canopy lobe
   * to break smooth geometry into intricate, painterly anime leaf clusters.
   * Utilizes outward-biased spherical normals so cards shade seamlessly with the volume!
   */
  private createFoliageRimCardsMesh(
    lobes: { x: number; y: number; z: number; r: number; s: number }[],
    pal: { base: number; sunlit: number; shadow: number },
    material: THREE.MeshStandardMaterial
  ): THREE.Mesh {
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const baseCol = new THREE.Color(pal.base);
    const sunlitCol = new THREE.Color(pal.sunlit);
    const shadowCol = new THREE.Color(pal.shadow);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertOffset = 0;

    lobes.forEach((l) => {
      // Subtle perimeter cards only (delicate outer leaf tufts, zero intersecting internal plates)
      const cardCount = Math.floor(14 + l.r * 2.4);
      const cardSize = l.r * 0.48; // Natural, subtle card scale

      for (let c = 0; c < cardCount; c++) {
        const theta =
          (c / cardCount) * Math.PI * 2 + Math.sin(c * 2.3 + l.s) * 0.35;
        const phi = Math.cos(c * 3.7 + l.s) * 0.42;

        const rOut = l.r * 1.04;

        const px = l.x + Math.cos(theta) * Math.cos(phi) * rOut;
        const py = l.y + Math.sin(phi) * rOut * 0.58;
        const pz = l.z + Math.sin(theta) * Math.cos(phi) * rOut;

        // Vector pointing outward from lobe center
        const outDir = new THREE.Vector3(
          px - l.x,
          (py - l.y) * 1.3,
          pz - l.z
        ).normalize();

        // Spherical outward normal blended with upward sky light
        const cardNormal = outDir.clone();
        cardNormal.y = Math.max(cardNormal.y, 0.35);
        cardNormal.normalize();

        const sunFactor = outDir.dot(sunDir);

        const cardColor = baseCol.clone();
        cardColor.lerp(
          shadowCol,
          THREE.MathUtils.clamp((-sunFactor + 0.12) * 0.45, 0, 0.45)
        );
        cardColor.lerp(
          sunlitCol,
          THREE.MathUtils.clamp((sunFactor + 0.10) * 0.75, 0, 1)
        );

        // Quad orientation: primarily follow lobe curvature (outDir) with soft camera bias
        const camNormal = new THREE.Vector3(0.06, 0.55, 0.45).normalize();
        const quadNormal = new THREE.Vector3().lerpVectors(outDir, camNormal, 0.28).normalize();

        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(quadNormal, up).normalize();
        if (right.lengthSq() < 0.01) right.set(1, 0, 0);
        const cardUp = new THREE.Vector3().crossVectors(right, quadNormal).normalize();

        const half = cardSize * 0.5;

        const v0 = new THREE.Vector3(px, py, pz)
          .addScaledVector(right, -half)
          .addScaledVector(cardUp, -half);
        const v1 = new THREE.Vector3(px, py, pz)
          .addScaledVector(right, half)
          .addScaledVector(cardUp, -half);
        const v2 = new THREE.Vector3(px, py, pz)
          .addScaledVector(right, half)
          .addScaledVector(cardUp, half);
        const v3 = new THREE.Vector3(px, py, pz)
          .addScaledVector(right, -half)
          .addScaledVector(cardUp, half);

        [v0, v1, v2, v3].forEach((v) => {
          positions.push(v.x, v.y, v.z);
          normals.push(cardNormal.x, cardNormal.y, cardNormal.z);
          colors.push(cardColor.r, cardColor.g, cardColor.b);
        });

        uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

        indices.push(
          vertOffset,
          vertOffset + 1,
          vertOffset + 2,
          vertOffset,
          vertOffset + 2,
          vertOffset + 3
        );

        vertOffset += 4;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = false; // Alpha-tested cards must not cast opaque rectangular shadow maps
    mesh.receiveShadow = true;
    return mesh;
  }

  // ==========================================
  // TRUNK & BRANCH AUTHORING
  // ==========================================

  private createTrunk(
    height: number,
    bottomRadius: number,
    topRadius: number
  ): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 12, 6);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;

    for (let i = 0; i < vertexCount; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Flaring root buttress at base
      if (y < -height * 0.25) {
        const flare = 1.0 + ((-height * 0.25 - y) / (height * 0.25)) * 0.70;
        x *= flare;
        z *= flare;
      }

      // Organic curved trunk lean
      x += Math.sin((y / height) * Math.PI) * 0.12 * height;

      pos.setXYZ(i, x, y, z);
    }

    geo.computeVertexNormals();
    geo.translate(0, height * 0.5, 0);
    const trunk = new THREE.Mesh(geo, this.sharedTrunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    return trunk;
  }

  private createBranch(
    length: number,
    startRadius: number,
    endRadius: number,
    curveBend: number = 0.12
  ): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(endRadius, startRadius, length, 10, 5);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      x += Math.sin((y / length) * Math.PI) * curveBend * length;
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    geo.translate(0, length * 0.5, 0);
    const branch = new THREE.Mesh(geo, this.sharedTrunkMaterial);
    branch.castShadow = true;
    return branch;
  }

  // ==========================================
  // TREE ARCHETYPES
  // ==========================================

  /**
   * 1. Sakura Tree (Studio Ghibli Cherry Blossom)
   * Spreading gnarled Japanese cherry trunk, reaching branch forks,
   * and 16 billowy pink blossom cloud cushions with delicate petal fringe.
   */
  private createSakuraTree(seed: number = 1.0): THREE.Group {
    const tree = new THREE.Group();

    // Tall graceful gnarled Japanese cherry trunk arching over cottage
    const trunk = this.createTrunk(4.8, 0.52, 0.28);
    tree.add(trunk);

    const branches = [
      { len: 3.4, rx: 0.35, rz: 0.55, ry: 0.4, y: 3.2 },
      { len: 3.2, rx: -0.28, rz: -0.50, ry: 2.1, y: 3.4 },
      { len: 3.0, rx: 0.22, rz: -0.45, ry: 4.2, y: 3.8 },
      { len: 2.8, rx: -0.32, rz: 0.40, ry: 3.2, y: 4.1 },
    ];

    branches.forEach((b) => {
      const branchMesh = this.createBranch(b.len, 0.24, 0.12, 0.16);
      branchMesh.position.y = b.y;
      branchMesh.rotation.set(b.rx, b.ry, b.rz);
      tree.add(branchMesh);
    });

    const pal = {
      base: 0xf5b5c8,   // Rich blossoming cherry petal pink
      sunlit: 0xffe6f0, // Luminous warm petal-pink highlight (warm sunny glow, not chalk white!)
      shadow: 0xa85270, // Soft plum/mauve underside shadow
    };

    // Elevated canopy lobes arching cleanly above the cottage roof
    const lobes = [
      { x: 0.0, y: 5.6, z: 0.0, r: 2.3, s: seed + 0.1 },
      { x: -1.8, y: 5.2, z: 0.9, r: 1.9, s: seed + 0.5 },
      { x: 1.7, y: 5.4, z: -0.7, r: 1.8, s: seed + 0.9 },
      { x: 0.2, y: 6.4, z: 0.5, r: 1.7, s: seed + 1.3 },
      { x: -0.9, y: 6.0, z: -1.2, r: 1.6, s: seed + 1.7 },
      { x: 1.8, y: 5.0, z: 1.2, r: 1.6, s: seed + 2.1 },
      { x: -2.2, y: 4.8, z: -0.9, r: 1.6, s: seed + 2.5 },
      { x: 0.0, y: 4.6, z: 1.6, r: 1.5, s: seed + 2.9 },
      { x: -1.2, y: 5.5, z: 1.4, r: 1.5, s: seed + 3.3 },
      { x: 1.3, y: 5.6, z: 0.8, r: 1.5, s: seed + 3.7 },
      { x: 1.0, y: 4.8, z: -1.4, r: 1.4, s: seed + 4.1 },
      { x: -0.7, y: 4.5, z: -1.6, r: 1.3, s: seed + 4.5 },
      // Satellite blossom tufts
      { x: -2.5, y: 5.4, z: 0.1, r: 1.20, s: seed + 5.1 },
      { x: 2.1, y: 5.6, z: -0.3, r: 1.15, s: seed + 5.5 },
      { x: 0.1, y: 6.6, z: -0.9, r: 1.20, s: seed + 5.9 },
      { x: -0.4, y: 4.8, z: 2.0, r: 1.10, s: seed + 6.3 },
    ];

    lobes.forEach((l) => {
      // Core opaque lobe provides dark interior shadow volume
      const geo = this.createOrganicFoliageLobe(
        l.r * 0.65,
        pal.base,
        pal.sunlit,
        pal.shadow,
        l.s,
        'sakura'
      );
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    const rimCards = this.createFoliageRimCardsMesh(
      lobes,
      pal,
      this.sakuraCardMaterial
    );
    tree.add(rimCards);

    return tree;
  }

  /**
   * 2. Mature Green Broadleaf
   */
  private createGreenBroadleaf(seed: number = 2.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(4.6, 0.54, 0.32);
    tree.add(trunk);

    const branch1 = this.createBranch(3.2, 0.26, 0.14, 0.15);
    branch1.position.y = 3.2;
    branch1.rotation.set(0.32, 0.45, 0.42);
    tree.add(branch1);

    const branch2 = this.createBranch(3.0, 0.24, 0.13, -0.14);
    branch2.position.y = 3.4;
    branch2.rotation.set(-0.28, 2.5, -0.38);
    tree.add(branch2);

    const pal = {
      base: 0x82b83c,   // Radiant anime golden-olive green
      sunlit: 0xc4ee5c, // Golden sunlight crest
      shadow: 0x3a6020, // Cool forest shade
    };

    const lobes = [
      { x: 0.0, y: 5.4, z: 0.0, r: 2.5, s: seed + 0.1 },
      { x: -1.5, y: 4.7, z: 0.7, r: 2.0, s: seed + 0.6 },
      { x: 1.4, y: 4.9, z: -0.6, r: 1.9, s: seed + 1.1 },
      { x: 0.2, y: 6.2, z: 0.5, r: 1.8, s: seed + 1.6 },
      { x: -0.7, y: 5.6, z: -1.0, r: 1.7, s: seed + 2.1 },
      { x: 1.5, y: 4.2, z: 1.0, r: 1.6, s: seed + 2.6 },
      { x: -1.8, y: 4.3, z: -0.7, r: 1.7, s: seed + 3.1 },
      { x: 0.0, y: 3.9, z: 1.3, r: 1.5, s: seed + 3.6 },
      // Satellite clumps
      { x: -2.0, y: 5.0, z: 0.2, r: 1.25, s: seed + 4.1 },
      { x: 1.8, y: 5.3, z: -0.4, r: 1.20, s: seed + 4.6 },
      { x: 0.1, y: 6.5, z: -0.6, r: 1.25, s: seed + 5.1 },
      { x: -0.9, y: 3.8, z: 1.5, r: 1.15, s: seed + 5.6 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(
        l.r * 0.65,
        pal.base,
        pal.sunlit,
        pal.shadow,
        l.s,
        'broadleaf'
      );
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    const rimCards = this.createFoliageRimCardsMesh(
      lobes,
      pal,
      this.broadleafCardMaterial
    );
    tree.add(rimCards);

    return tree;
  }

  /**
   * 3. Autumn Broadleaf (Fiery Orange/Russet Maple)
   */
  private createAutumnBroadleaf(seed: number = 3.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(4.4, 0.48, 0.28);
    tree.add(trunk);

    const palAmber = {
      base: 0xd88828,   // Warm rich anime amber
      sunlit: 0xf2b84a, // Luminous golden highlight
      shadow: 0x7a3a14, // Deep burnt sienna shadow
    };

    const palRusset = {
      base: 0xb84c20,   // Warm burnt orange-russet
      sunlit: 0xda6830, // Warm sunset crest
      shadow: 0x5a200a, // Deep umber shadow
    };

    const lobes = [
      { x: 0.0, y: 5.1, z: 0.0, r: 2.3, pal: palAmber, s: seed + 0.1 },
      { x: -1.2, y: 4.4, z: 0.6, r: 1.9, pal: palRusset, s: seed + 0.7 },
      { x: 1.2, y: 4.6, z: -0.5, r: 1.8, pal: palAmber, s: seed + 1.3 },
      { x: 0.2, y: 5.8, z: 0.4, r: 1.7, pal: palAmber, s: seed + 1.9 },
      { x: -0.6, y: 5.3, z: -0.8, r: 1.6, pal: palRusset, s: seed + 2.5 },
      { x: 1.4, y: 4.0, z: 0.8, r: 1.6, pal: palAmber, s: seed + 3.1 },
      { x: -1.3, y: 3.9, z: -0.6, r: 1.5, pal: palRusset, s: seed + 3.7 },
      // Satellite clumps
      { x: -1.6, y: 4.7, z: 0.3, r: 1.20, pal: palRusset, s: seed + 4.3 },
      { x: 1.5, y: 4.9, z: -0.3, r: 1.15, pal: palAmber, s: seed + 4.9 },
      { x: 0.1, y: 6.2, z: -0.5, r: 1.20, pal: palAmber, s: seed + 5.5 },
      { x: -0.8, y: 3.7, z: 1.2, r: 1.10, pal: palRusset, s: seed + 6.1 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(
        l.r * 0.65,
        l.pal.base,
        l.pal.sunlit,
        l.pal.shadow,
        l.s,
        'autumn'
      );
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    const rimCards = this.createFoliageRimCardsMesh(
      lobes.map((l) => ({ x: l.x, y: l.y, z: l.z, r: l.r, s: l.s })),
      palAmber,
      this.autumnCardMaterial
    );
    tree.add(rimCards);

    return tree;
  }

  /**
   * 4. Pine / Conifer (Tiered drooping conifer needle skirts with alpha needle cards)
   */
  private createPineTree(seed: number = 4.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(7.0, 0.42, 0.20);
    tree.add(trunk);

    const pal = {
      base: 0x224836,   // Rich forest conifer green
      sunlit: 0x3e7452, // Sunlit needle tips with warm tone
      shadow: 0x142e22, // Luminous cool shaded underside
    };

    const tierConfigs = [
      { r: 2.8, h: 2.0, y: 3.6 },
      { r: 2.4, h: 1.8, y: 4.9 },
      { r: 1.9, h: 1.7, y: 6.1 },
      { r: 1.4, h: 1.5, y: 7.2 },
      { r: 0.9, h: 1.3, y: 8.2 },
    ];

    const tierLobes: { x: number; y: number; z: number; r: number; s: number }[] = [];

    tierConfigs.forEach((cfg, t) => {
      tierLobes.push({
        x: 0,
        y: cfg.y,
        z: 0,
        r: cfg.r,
        s: seed + t * 1.8,
      });

      const geo = this.createPineBoughTier(
        cfg.r,
        cfg.h,
        pal,
        seed + t * 1.8
      );

      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.y = cfg.y;
      mesh.rotation.y = t * 0.85;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    // Stylized scalloped pine boughs provide clean painterly anime silhouette without card noise
    return tree;
  }

  private createPineBoughTier(
    radius: number,
    height: number,
    pal: { base: number; sunlit: number; shadow: number },
    seed: number
  ): THREE.BufferGeometry {
    const segments = 18;
    const geo = new THREE.ConeGeometry(radius, height, segments, 4, false);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const v = new THREE.Vector3();
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const baseCol = new THREE.Color(pal.base);
    const sunlitCol = new THREE.Color(pal.sunlit);
    const shadowCol = new THREE.Color(pal.shadow);
    const tempCol = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      v.fromBufferAttribute(pos, i);
      const angle = Math.atan2(v.z, v.x);
      const heightT = THREE.MathUtils.clamp((v.y + height * 0.5) / height, 0, 1);

      const needleScallop =
        (Math.sin(angle * 8.0 + seed) * 0.18 + Math.cos(angle * 4.0 + seed * 1.3) * 0.12) *
        (1.0 - heightT);
      v.x *= 1.0 + needleScallop;
      v.z *= 1.0 + needleScallop;

      if (heightT < 0.35) {
        v.y -= Math.abs(needleScallop) * 0.38 * height;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;
    const norm = new THREE.Vector3();
    const colors = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      norm.fromBufferAttribute(normAttr, i);
      const sunFactor = norm.dot(sunDir);
      const isUnderside = norm.y < 0.1;

      tempCol.copy(baseCol);
      if (isUnderside) {
        tempCol.lerp(shadowCol, 0.75);
      } else if (sunFactor > 0.05) {
        tempCol.lerp(sunlitCol, 0.35 + sunFactor * 0.65);
      } else {
        tempCol.lerp(shadowCol, 0.45);
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  /**
   * 5. Small Background Tree
   */
  private createSmallBackgroundTree(seed: number = 5.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(3.0, 0.30, 0.18);
    tree.add(trunk);

    const pal = {
      base: 0x648858,
      sunlit: 0x8cb078,
      shadow: 0x3e563a,
    };

    const lobes = [
      { x: 0.0, y: 3.4, z: 0.0, r: 1.8, s: seed + 0.2 },
      { x: -0.7, y: 2.9, z: 0.5, r: 1.4, s: seed + 0.8 },
      { x: 0.7, y: 3.0, z: -0.4, r: 1.3, s: seed + 1.4 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(
        l.r,
        pal.base,
        pal.sunlit,
        pal.shadow,
        l.s,
        'broadleaf'
      );
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      tree.add(mesh);
    });

    const rimCards = this.createFoliageRimCardsMesh(
      lobes,
      pal,
      this.broadleafCardMaterial
    );
    tree.add(rimCards);

    return tree;
  }

  /**
   * 6. Bush / Shrub
   */
  private createBush(seed: number = 6.0): THREE.Group {
    const bush = new THREE.Group();

    const pal = {
      base: 0x5e8238,
      sunlit: 0x8eb858,
      shadow: 0x364e22,
    };

    const lobes = [
      { x: 0.0, y: 0.8, z: 0.0, r: 1.3, s: seed + 0.1 },
      { x: 0.7, y: 0.6, z: 0.5, r: 1.0, s: seed + 0.6 },
      { x: -0.6, y: 0.6, z: -0.4, r: 1.1, s: seed + 1.2 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(
        l.r,
        pal.base,
        pal.sunlit,
        pal.shadow,
        l.s,
        'broadleaf'
      );
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bush.add(mesh);
    });

    const rimCards = this.createFoliageRimCardsMesh(
      lobes,
      pal,
      this.broadleafCardMaterial
    );
    bush.add(rimCards);

    return bush;
  }

  /**
   * 7. Foreground Framing Tree (Bottom-Right Corner)
   * Expressive Japanese evergreen framing boughs with crisp leaf silhouettes
   * and pink blossom highlights, creating an authentic cinematic sense of depth (Reference.png).
   */
  private createForegroundFramingTree(seed: number = 7.0): THREE.Group {
    const tree = new THREE.Group();

    // Curved trunk leaning inward
    const trunk = this.createTrunk(6.8, 0.52, 0.26);
    trunk.rotation.z = -0.32;
    trunk.rotation.x = 0.15;
    tree.add(trunk);

    const pal = {
      base: 0x163222,   // Deep forest silhouette evergreen
      sunlit: 0x366444, // Luminous needle & leaf tips
      shadow: 0x081810, // Deep velvety silhouette underside
    };

    // Organic foliage cloud lobes arranged along the sweeping bough
    const lobes = [
      { x: -0.8, y: 4.8, z: 0.3, r: 2.0, s: seed + 0.3 },
      { x: -1.6, y: 5.6, z: 0.6, r: 1.8, s: seed + 0.9 },
      { x: 0.2,  y: 6.0, z: 0.0, r: 1.9, s: seed + 1.5 },
      { x: -2.2, y: 6.5, z: 0.9, r: 1.5, s: seed + 2.1 },
      { x: -0.5, y: 7.2, z: 0.4, r: 1.6, s: seed + 2.7 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(
        l.r,
        pal.base,
        pal.sunlit,
        pal.shadow,
        l.s,
        'broadleaf'
      );
      const mesh = new THREE.Mesh(geo, this.sharedForegroundFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    // Silhouette-breaking framing leaf cards with blossom flecks
    const framingCards = this.createFoliageRimCardsMesh(
      lobes,
      pal,
      this.foregroundCardMaterial
    );
    tree.add(framingCards);

    return tree;
  }

  // ==========================================
  // COMPOSITIONAL PLACEMENT (MATCHING REFERENCE.PNG)
  // ==========================================
  private placeTrees(): void {
    const treePlacements: TreePlacementConfig[] = [
      // ----------------------------------------
      // Left Meadow: Cottage & Foothill Groves
      // ----------------------------------------
      // Sprawling Sakura sheltering over countryside cottage (elevated canopy framing roof)
      { archetype: 'sakura', x: -26, z: -22, scale: 2.2, rotationY: 0.35 },
      // Sakura grove slightly further back on meadow slope
      { archetype: 'sakura', x: -34, z: -16, scale: 2.1, rotationY: 1.2 },
      // Meadow Broadleaf behind cottage clearing
      { archetype: 'greenBroadleaf', x: -16, z: -25, scale: 2.0, rotationY: 0.7 },
      // Lower meadow oak (shifted up the meadow slope to keep Monolith unobstructed)
      { archetype: 'greenBroadleaf', x: -33, z: -2, scale: 1.7, rotationY: 2.0 },
      // Meadow terrace tree (shifted up terrace slope)
      { archetype: 'greenBroadleaf', x: -35, z: 14, scale: 1.7, rotationY: 1.4 },
      // Shrubs around cottage and meadow clearing
      { archetype: 'bush', x: -24, z: -14, scale: 1.2 },
      { archetype: 'bush', x: -17, z: -19, scale: 1.2 },
      { archetype: 'bush', x: -28, z: -10, scale: 1.2 },
      { archetype: 'bush', x: -28, z: 14, scale: 1.3 },

      // ----------------------------------------
      // Right Bluff: Dense Forested Hillside (Matching Reference.png)
      // Rich continuous forest tapestry: autumn maples, green broadleafs, mountain pines
      // ----------------------------------------
      // Sunlit Forest Canopy catching afternoon light on mid-slope (Matching Reference.png)
      { archetype: 'autumnBroadleaf', x: 26, z: -8, scale: 2.3, rotationY: 0.5 },
      { archetype: 'greenBroadleaf', x: 27, z: 6, scale: 2.3, rotationY: 1.7 },
      { archetype: 'greenBroadleaf', x: 22, z: -2, scale: 2.2, rotationY: 2.8 },
      { archetype: 'pine', x: 30, z: -12, scale: 2.4, rotationY: 0.9 },
      { archetype: 'greenBroadleaf', x: 20, z: 12, scale: 2.2, rotationY: 1.4 },
      { archetype: 'autumnBroadleaf', x: 23, z: 22, scale: 2.3, rotationY: 2.1 },
      { archetype: 'greenBroadleaf', x: 17, z: 28, scale: 2.1, rotationY: 0.8 },
      // Hillside oaks cascading towards the water
      { archetype: 'greenBroadleaf', x: 34, z: -18, scale: 2.5, rotationY: 0.4 },
      { archetype: 'greenBroadleaf', x: 21, z: 16, scale: 2.3, rotationY: 1.2 },
      { archetype: 'greenBroadleaf', x: 19, z: -16, scale: 2.0, rotationY: 2.4 },
      { archetype: 'greenBroadleaf', x: 16, z: 24, scale: 2.2, rotationY: 1.8 },
      { archetype: 'greenBroadleaf', x: 14, z: 32, scale: 2.0, rotationY: 2.7 },
      // Mountain pines along upper ridge
      { archetype: 'pine', x: 32, z: -26, scale: 2.5, rotationY: 0.9 },
      { archetype: 'pine', x: 38, z: -20, scale: 2.7, rotationY: 2.3 },
      { archetype: 'pine', x: 42, z: -10, scale: 2.6, rotationY: 1.4 },
      { archetype: 'pine', x: 36, z: 12, scale: 2.4, rotationY: 0.6 },
      { archetype: 'greenBroadleaf', x: 28, z: 26, scale: 2.2, rotationY: 1.3 },
      { archetype: 'autumnBroadleaf', x: 25, z: 34, scale: 2.1, rotationY: 0.5 },
      // Upper canyon gorge trees enclosing headwaters
      { archetype: 'autumnBroadleaf', x: 46, z: -40, scale: 2.6, rotationY: 0.6 },
      { archetype: 'pine', x: 52, z: -48, scale: 2.8, rotationY: 1.2 },
      { archetype: 'autumnBroadleaf', x: 56, z: -36, scale: 2.4, rotationY: 2.1 },
      // Lower bluff bushes & shrubs
      { archetype: 'bush', x: 16, z: -6, scale: 1.5 },
      { archetype: 'bush', x: 14, z: 8, scale: 1.6 },
      { archetype: 'bush', x: 18, z: 20, scale: 1.4 },
      { archetype: 'bush', x: 12, z: 36, scale: 1.5 },

      // ----------------------------------------
      // Distant Background Fillers
      // ----------------------------------------
      { archetype: 'smallBackground', x: -44, z: -38, scale: 2.0 },
      { archetype: 'smallBackground', x: -36, z: -44, scale: 2.1 },
      { archetype: 'smallBackground', x: 44, z: -14, scale: 2.2 },
      { archetype: 'smallBackground', x: 38, z: 16, scale: 2.0 },
      { archetype: 'smallBackground', x: 42, z: 24, scale: 1.9 },

      // ----------------------------------------
      // Bottom-Left Foreground Sakura Accent
      // ----------------------------------------
      { archetype: 'sakura', x: -44, z: 34, scale: 2.1, rotationY: 0.5 },

      // ----------------------------------------
      // Bottom-Right Foreground Cinematic Framing
      // Refined silhouette branches and cherry blossom spray emerging over mist (Reference.png)
      // ----------------------------------------
      {
        archetype: 'foregroundFraming',
        x: 34,
        z: 44,
        scale: 2.2,
        yOffset: -1.2,
        rotationY: 0.40,
      },
      {
        archetype: 'sakura',
        x: 28,
        z: 47,
        scale: 1.9,
        yOffset: -1.4,
        rotationY: 2.1,
      },
    ];

    treePlacements.forEach((p, idx) => {
      let treeGroup: THREE.Group;

      switch (p.archetype) {
        case 'sakura':
          treeGroup = this.createSakuraTree(idx * 2.3 + 1.1);
          break;
        case 'greenBroadleaf':
          treeGroup = this.createGreenBroadleaf(idx * 2.3 + 1.1);
          break;
        case 'autumnBroadleaf':
          treeGroup = this.createAutumnBroadleaf(idx * 2.3 + 1.1);
          break;
        case 'pine':
          treeGroup = this.createPineTree(idx * 2.3 + 1.1);
          break;
        case 'smallBackground':
          treeGroup = this.createSmallBackgroundTree(idx * 2.3 + 1.1);
          break;
        case 'bush':
          treeGroup = this.createBush(idx * 2.3 + 1.1);
          break;
        case 'foregroundFraming':
          treeGroup = this.createForegroundFramingTree(idx * 2.3 + 1.1);
          break;
      }

      const tInfo = this.terrain.getHeightAt(p.x, p.z);
      const groundY = tInfo.y + (p.yOffset ?? 0);

      treeGroup.position.set(p.x, groundY, p.z);
      treeGroup.scale.setScalar(p.scale);
      if (p.rotationY !== undefined) {
        treeGroup.rotation.y = p.rotationY;
      }

      this.group.add(treeGroup);
    });
  }
}
