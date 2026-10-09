import * as THREE from 'three';
import { SplinePointConfig } from '../utils/SplineUtils';
import { Terrain } from './Terrain';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class Vegetation {
  public readonly group: THREE.Group;
  private terrain: Terrain;
  private sunDir = new THREE.Vector3(38, 50, -38).normalize();

  constructor(
    _riverCurve: THREE.CatmullRomCurve3,
    _splineConfigs: SplinePointConfig[],
    terrain: Terrain
  ) {
    this.group = new THREE.Group();
    this.group.name = 'VegetationGroup';
    this.terrain = terrain;

    // 1. Meadow Grass Clumps (Warm anime meadow pasture)
    this.createMeadowGrass();

    // 2. Riverbank Reeds & Water Edge Grass
    this.createRiverReeds();

    // 3. Wildflowers (Pink cosmos, yellow buttercups, white daisies, lavender)
    this.createWildflowers();

    // 4. Forested Understory Bushes & Shrub Cushions (both on meadow & bluff)
    this.createUnderstoryBushes();

    // 5. Forest Floor Fern / Shrub Clusters (Right Bluff)
    this.createForestFloorFoliage();
  }

  private hash2d(x: number, z: number): number {
    return (Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1;
  }

  /**
   * Helper to bake warm anime lighting gradients into vegetation geometry vertices.
   */
  private applyVegetationColors(
    geometry: THREE.BufferGeometry,
    sunColorHex: number,
    baseColorHex: number,
    shadowColorHex: number
  ): void {
    const posAttr = geometry.attributes.position;
    const normAttr = geometry.attributes.normal;
    const colors = new Float32Array(posAttr.count * 3);

    const cSun = new THREE.Color(sunColorHex);
    const cBase = new THREE.Color(baseColorHex);
    const cShadow = new THREE.Color(shadowColorHex);

    geometry.computeBoundingBox();
    const minY = geometry.boundingBox!.min.y;
    const maxY = geometry.boundingBox!.max.y;
    const height = Math.max(0.001, maxY - minY);

    const normal = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const heightT = Math.max(0, Math.min(1, (y - minY) / height));

      if (normAttr) {
        normal.set(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      } else {
        normal.set(0, 1, 0);
      }

      const NdotL = Math.max(0, normal.dot(this.sunDir));
      const finalColor = new THREE.Color();

      if (heightT < 0.20) {
        finalColor.copy(cShadow);
      } else {
        finalColor.lerpColors(cBase, cSun, NdotL * 0.65 + heightT * 0.35);
      }

      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  /**
   * 1. Meadow Grass Clumps:
   * Layered painterly tufts of grass clustered along path verges, rock bases, and cut-banks,
   * preserving open sunlit watercolor meadow washes (matching Reference.png).
   */
  private createMeadowGrass(): void {
    const count = 1200;

    // Soft, low-profile painterly grass clump with 3 wide curved blades
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    for (let b = 0; b < 3; b++) {
      const angle = (b / 3) * Math.PI * 2 + (seededRandom(b * 3.7) - 0.5) * 0.40;
      const r = 0.22;
      const h = 0.16 + seededRandom(b * 7.1) * 0.10;

      const bx = Math.cos(angle) * r;
      const bz = Math.sin(angle) * r;

      // Soft wide base
      vertices.push(-bx * 1.2, 0, -bz * 1.2);
      vertices.push(bx * 1.2, 0, bz * 1.2);
      // Low curved blade tip
      const tipX = bx * 1.8 + (seededRandom(b * 11.3) - 0.5) * 0.15;
      const tipZ = bz * 1.8 + (seededRandom(b * 13.7) - 0.5) * 0.15;
      vertices.push(tipX, h, tipZ);

      const nx = Math.cos(angle);
      const nz = Math.sin(angle);
      normals.push(nx, 0.85, nz);
      normals.push(nx, 0.85, nz);
      normals.push(nx * 0.4, 0.95, nz * 0.4);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    this.applyVegetationColors(geometry, 0xffffff, 0xe8eed8, 0xb8c4a4);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.0,
      flatShading: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    // Left meadow clustering centers
    const treeCenters = [
      { x: -26, z: -22, r: 7.2 }, // Sakura over cottage
      { x: -34, z: -16, r: 6.5 }, // Sakura grove slope
      { x: -16, z: -25, r: 5.8 }, // Broadleaf behind cottage
      { x: -21, z: -4,  r: 6.4 }, // Lower meadow oak
      { x: -26, z: 8,   r: 6.0 }, // Terrace oak
      { x: -18, z: 0.5, r: 5.2 }, // Hero rock guardian monolith
    ];

    for (let i = 0; i < count * 8 && placed < count; i++) {
      const x = -54 + seededRandom(i * 1.7) * 58;
      const z = -46 + seededRandom(i * 2.9) * 94;

      const info = this.terrain.getHeightAt(x, z);

      if (info.isLeftSide && info.bankDist > 0.8 && z > -40) {
        // Country trail clearance
        const pathLine = Math.abs(z - (2.05 * x + 25.0));
        const inPathCore = pathLine < 1.10 && x >= -21.5 && x <= -9.0;
        if (inPathCore) continue;

        // Intentional Density Zones:
        let inCluster = false;
        for (let t = 0; t < treeCenters.length; t++) {
          const tc = treeCenters[t];
          const dist = Math.sqrt((x - tc.x) ** 2 + (z - tc.z) ** 2);
          if (dist > 0.8 && dist < tc.r) {
            inCluster = true;
            break;
          }
        }

        const isRiparianBank = info.bankDist >= 0.9 && info.bankDist <= 3.8;
        const isPathVerge = pathLine >= 1.10 && pathLine <= 2.6 && x >= -22.0 && x <= -8.0;
        const isNearFence = x > -19 && x < -12 && z > -15 && z < 10 && Math.abs(x + 15) < 2.5;

        // Strictly cluster along landscape features to preserve open painterly washes
        const accept = inCluster || isRiparianBank || isPathVerge || isNearFence;

        if (accept) {
          dummy.position.set(x, info.y - 0.01, z);
          dummy.rotation.y = seededRandom(i * 5.3) * Math.PI * 2;
          const scale = 0.85 + seededRandom(i * 7.1) * 0.45;
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          mesh.setMatrixAt(placed, dummy.matrix);

          const grassColor = new THREE.Color();
          if (inCluster) {
            grassColor.setHex(0x426828); // Leafy understory shadow green
          } else if (isRiparianBank) {
            grassColor.setHex(0x5c7c32); // Riparian olive-amber fringe
          } else {
            // Warm golden-green clover pasture
            grassColor.setHex(0x769e38).lerp(new THREE.Color(0x98b846), seededRandom(i * 8.3) * 0.45);
          }
          mesh.setColorAt(placed, grassColor);

          placed++;
        }
      }
    }

    for (let i = placed; i < count; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 2. Riverbank Reeds:
   * Slender golden-olive water reeds emerging along both river edges.
   */
  private createRiverReeds(): void {
    const count = 300;

    const geometry = new THREE.CylinderGeometry(0.02, 0.05, 1.3, 4);
    geometry.translate(0, 0.65, 0);

    this.applyVegetationColors(geometry, 0xd4c272, 0x8ea24a, 0x3d4e24);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      flatShading: false,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < count * 3 && placed < count; i++) {
      const x = -48 + seededRandom(i * 2.1) * 88;
      const z = -44 + seededRandom(i * 3.3) * 90;

      const info = this.terrain.getHeightAt(x, z);

      if (info.bankDist > 0.25 && info.bankDist < 4.2 && z > -36) {
        dummy.position.set(x, info.y - 0.03, z);
        dummy.rotation.y = seededRandom(i * 4.7) * Math.PI * 2;
        dummy.rotation.x = (seededRandom(i * 6.1) - 0.5) * 0.25;
        dummy.rotation.z = (seededRandom(i * 7.3) - 0.5) * 0.25;
        const scale = 0.8 + seededRandom(i * 8.9) * 0.70;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    for (let i = placed; i < count; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 3. Wildflowers:
   * Clustered into natural organic drifting meadow flower patches (matching Reference.png).
   */
  private createWildflowers(): void {
    const count = 1600;

    const size = 0.16;
    const mergedGeom = new THREE.BufferGeometry();
    const v = [
      -size / 2, size, 0, size / 2, size, 0, -size / 2, 0, 0,
      size / 2, size, 0, size / 2, 0, 0, -size / 2, 0, 0,
      0, size, -size / 2, 0, size, size / 2, 0, 0, -size / 2,
      0, size, size / 2, 0, 0, size / 2, 0, 0, -size / 2,
    ];

    const n = [
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    ];

    mergedGeom.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    mergedGeom.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(mergedGeom, material, count);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Soft pastel anime palette matching Reference.png:
    // Soft sakura pink, sunny buttercup yellow, crisp warm ivory, subtle lavender
    const flowerColors = [0xebb4c2, 0xf6d878, 0xf5f0e6, 0xa69ec6];

    // Intentional flower sanctuaries / drifting meadow swaths
    const flowerSanctuaries = [
      { x: -21, z: -13, r: 7.5 }, // Cottage garden verge
      { x: -24, z: 2,   r: 8.5 }, // Sunny mid-meadow clover swale
      { x: -14, z: -3,  r: 6.5 }, // Stepping stone approach
      { x: -28, z: -10, r: 7.5 }, // Sakura slope terrace
      { x: -26, z: 12,  r: 8.0 }, // Lower terrace
      { x: -34, z: -4,  r: 7.0 }, // Upper meadow knoll
    ];

    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let placed = 0;

    for (let i = 0; i < count * 5 && placed < count; i++) {
      const x = -52 + seededRandom(i * 1.9) * 56;
      const z = -44 + seededRandom(i * 3.1) * 88;

      const info = this.terrain.getHeightAt(x, z);

      if (info.isLeftSide && info.bankDist > 1.2 && z > -38) {
        // Must be within one of the intentional flower sanctuaries
        let inSanctuary = false;
        for (let s = 0; s < flowerSanctuaries.length; s++) {
          const fs = flowerSanctuaries[s];
          const dist = Math.sqrt((x - fs.x) ** 2 + (z - fs.z) ** 2);
          if (dist < fs.r) {
            inSanctuary = true;
            break;
          }
        }

        if (inSanctuary) {
          dummy.position.set(x, info.y + 0.01, z);
          dummy.rotation.y = seededRandom(i * 4.9) * Math.PI * 2;
          const scale = 0.82 + seededRandom(i * 6.7) * 0.65;
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          mesh.setMatrixAt(placed, dummy.matrix);

          const colorIdx = Math.floor(seededRandom(i * 8.3) * flowerColors.length);
          c.setHex(flowerColors[colorIdx]);
          mesh.setColorAt(placed, c);

          placed++;
        }
      }
    }

    for (let i = placed; i < count; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 4. Understory Bushes & Shrub Cushions:
   * Smooth, organic flattened foliage lobes creating natural understory layers.
   */
  private createUnderstoryBushes(): void {
    const count = 120;

    // Smooth organic cushion geometry (12 x 10 segments for smooth painterly look)
    const geometry = new THREE.SphereGeometry(0.75, 12, 10);
    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i) * 0.58;
      let x = posAttr.getX(i);
      let z = posAttr.getZ(i);
      const angle = Math.atan2(z, x);
      const swell = 1.0 + Math.sin(angle * 3.0) * 0.14;
      x *= swell;
      z *= swell;
      posAttr.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();
    geometry.translate(0, 0.40, 0);

    this.applyVegetationColors(geometry, 0x98c660, 0x568638, 0x28461b);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: false,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < count * 3 && placed < count; i++) {
      const x = -50 + seededRandom(i * 3.1) * 98;
      const z = -44 + seededRandom(i * 4.3) * 92;

      const info = this.terrain.getHeightAt(x, z);

      if (info.bankDist > 1.2 && z > -36) {
        // Natural distribution: clusters around trees, forest edges, and along bluff
        const clusterChance = info.isLeftSide
          ? this.hash2d(x * 0.25, z * 0.25) > 0.62
          : true;

        if (clusterChance) {
          dummy.position.set(x, info.y - 0.08, z);
          dummy.rotation.y = seededRandom(i * 5.9) * Math.PI * 2;
          const scale = 0.70 + seededRandom(i * 7.7) * 0.85;
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();

          // Subtle natural anime green hue tint
          const c = new THREE.Color();
          c.setHSL(0.24 + seededRandom(i * 8.1) * 0.06, 0.50, 0.42 + seededRandom(i * 9.3) * 0.16);
          mesh.setColorAt(placed, c);

          mesh.setMatrixAt(placed, dummy.matrix);
          placed++;
        }
      }
    }

    for (let i = placed; i < count; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 5. Forest Floor Foliage (Right Bluff):
   * Soft, organic foliage clusters nestled into the hillside terraces.
   * NO flat square cards or black polygons!
   */
  private createForestFloorFoliage(): void {
    const count = 160;

    // Small flattened organic foliage cushion
    const geometry = new THREE.SphereGeometry(0.85, 10, 8);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) * 0.45;
      let x = pos.getX(i);
      let z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      x *= 1.0 + Math.sin(angle * 2.0) * 0.15;
      z *= 1.0 + Math.cos(angle * 2.0) * 0.15;
      pos.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();
    geometry.translate(0, 0.35, 0);

    this.applyVegetationColors(geometry, 0x486b36, 0x2c4620, 0x162610);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.90,
      metalness: 0.02,
      flatShading: false,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < count * 3 && placed < count; i++) {
      // Placed intentionally along the right bluff hillside terraces
      const x = 12 + seededRandom(i * 2.3) * 38;
      const z = -38 + seededRandom(i * 3.7) * 82;

      const info = this.terrain.getHeightAt(x, z);

      if (!info.isLeftSide && info.bankDist > 1.2) {
        dummy.position.set(x, info.y - 0.05, z);
        dummy.rotation.y = seededRandom(i * 5.1) * Math.PI * 2;
        const scale = 0.80 + seededRandom(i * 7.3) * 1.0;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        mesh.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    for (let i = placed; i < count; i++) {
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }
}
