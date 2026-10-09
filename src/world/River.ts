import * as THREE from 'three';
import { createRiverRibbonGeometry, SplinePointConfig } from '../utils/SplineUtils';
import { RiverMaterial } from './RiverMaterial';

export class River {
  public readonly group: THREE.Group;
  public readonly waterMesh: THREE.Mesh;
  public readonly bedMesh: THREE.Mesh;
  public readonly riverMaterial: RiverMaterial;
  public readonly curve: THREE.CatmullRomCurve3;
  public readonly splineConfigs: SplinePointConfig[];

  constructor(sunDirection?: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.name = 'RiverSystem';

    // 1. Centerline Spline Points & Wide Hero Proportions
    // Flows diagonally TOP-RIGHT (+X, -Z) -> BOTTOM-LEFT (-X, +Z)
    // S-curve swells into a grand turquoise pool occupying 38-44% of the visual composition,
    // establishing the river as the undisputed centerpiece of the painting.
    this.splineConfigs = [
      { point: new THREE.Vector3(72, 11.5, -68), width: 17.0 },  // Canyon headwaters
      { point: new THREE.Vector3(54, 8.8, -50), width: 22.0 },   // Distant sunlit gorge
      { point: new THREE.Vector3(39, 6.8, -34), width: 26.0 },   // Sunlit canyon cascades
      { point: new THREE.Vector3(26, 4.8, -21), width: 29.0 },   // Upper rapids entering valley
      { point: new THREE.Vector3(13, 3.0, -10), width: 28.0 },   // Upper bend entering valley
      { point: new THREE.Vector3(1, 1.6, -1), width: 30.0 },     // Opening into wide basin
      { point: new THREE.Vector3(-10, 0.5, 10), width: 34.0 },   // Majestic central pool (hero expanse)
      { point: new THREE.Vector3(-23, -0.5, 23), width: 32.0 },  // Lower neck curving past promontory
      { point: new THREE.Vector3(-36, -1.5, 36), width: 38.0 },  // Foreground rapids
      { point: new THREE.Vector3(-55, -2.8, 55), width: 44.0 },  // Exiting canvas bottom-left
    ];

    // 2. Generate Water Surface Mesh
    const waterRibbon = createRiverRibbonGeometry(this.splineConfigs, 260, 42, false);
    this.curve = waterRibbon.curve;

    this.riverMaterial = new RiverMaterial({ sunDirection });
    this.waterMesh = new THREE.Mesh(waterRibbon.geometry, this.riverMaterial.material);
    this.waterMesh.renderOrder = 10;
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // 3. Generate Submerged Riverbed Mesh with Painterly Stones & Silt
    const bedRibbon = createRiverRibbonGeometry(this.splineConfigs, 180, 28, true);
    const bedTexture = this.createRiverbedTexture();
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: 0x486b59, // Natural warm olive-teal & gravel bed
      map: bedTexture,
      roughness: 0.82,
      metalness: 0.02,
      flatShading: false,
    });
    this.bedMesh = new THREE.Mesh(bedRibbon.geometry, bedMaterial);
    this.bedMesh.position.y -= 0.12; // Elevated so translucent shallows reveal riverbed
    this.bedMesh.renderOrder = 1;
    this.bedMesh.receiveShadow = true;
    this.group.add(this.bedMesh);

    // 4. Submerged Water-Worn Shallows Stones (matching Reference.png)
    this.createSubmergedShallowsStones();
  }

  private createSubmergedShallowsStones(): void {
    const stoneGroup = new THREE.Group();
    stoneGroup.name = 'SubmergedShallowsStones';

    const stoneMat = new THREE.MeshStandardMaterial({
      roughness: 0.70,
      metalness: 0.04,
      flatShading: false,
    });

    const shallowsStones = [
      // Left shore submerged water-worn pebbles (clear turquoise pool reveal)
      { x: -9.5,  z: 6.8, y: -0.15, r: 0.95, rx: -0.1, rz: 0.3, col: 0x7c8e82 },
      { x: -7.5,  z: 9.0, y: -0.25, r: 0.85, rx: 0.1, rz: -0.2, col: 0x6e8076 },
      { x: -18.5, z: 16.0, y: -0.35, r: 1.2, rx: 0.15, rz: 0.1, col: 0x829486 },
      { x: -21.0, z: 21.0, y: -0.65, r: 1.3, rx: -0.1, rz: 0.2, col: 0x788a7c },

      // Right shore shallows stones
      { x: 9.5,   z: 11.5, y: -0.15, r: 1.15, rx: -0.1, rz: 0.15, col: 0x8fa094 },
      { x: 13.0,  z: 8.5,  y: 0.15, r: 1.25, rx: 0.2, rz: -0.1, col: 0xa4b4a6 },
      { x: 7.0,   z: 15.0, y: -0.45, r: 0.90, rx: 0.15, rz: 0.25, col: 0x708278 },
      { x: 16.0,  z: -2.0, y: 0.55, r: 1.15, rx: -0.15, rz: 0.1, col: 0x92a296 },
      { x: 20.0,  z: -10.0, y: 1.25, r: 1.3, rx: 0.1, rz: -0.2, col: 0x86988c },
    ];

    shallowsStones.forEach((s) => {
      const geo = new THREE.IcosahedronGeometry(s.r, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i) * 0.40; // Flatten vertically like a natural water-worn river stone
        let z = pos.getZ(i);
        const noise = 1.0 + Math.sin(x * 3.0 + z * 3.0) * 0.12;
        pos.setXYZ(i, x * noise, y, z * noise);
      }
      geo.computeVertexNormals();

      const mat = stoneMat.clone();
      mat.color.setHex(s.col);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.set(s.rx, Math.random() * Math.PI, s.rz);
      mesh.receiveShadow = true;
      mesh.renderOrder = 2; // Renders right beneath transparent water
      stoneGroup.add(mesh);
    });

    this.group.add(stoneGroup);
  }

  private createRiverbedTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base warm olive-gray sand & gravel wash
    ctx.fillStyle = '#345244';
    ctx.fillRect(0, 0, size, size);

    // Fine silt & sand ripple bands
    for (let y = 0; y < size; y += 32) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 32);
      grad.addColorStop(0, 'rgba(74, 98, 80, 0.45)');
      grad.addColorStop(0.5, 'rgba(54, 78, 65, 0.25)');
      grad.addColorStop(1, 'rgba(42, 65, 52, 0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, size, 32);
    }

    // Varied water-worn river stones (buff, slate, warm grey, limestone, mossy)
    const stoneColors = [
      '#7a9484', '#96a898', '#6b8272', '#a2b49e', '#62786a',
      '#8c9a8c', '#b0b6a2', '#758878', '#9eb098', '#546a5c'
    ];

    for (let i = 0; i < 1100; i++) {
      const rx = (Math.sin(i * 13.7) * 0.5 + 0.5) * size;
      const ry = (Math.cos(i * 19.1) * 0.5 + 0.5) * size;
      const r = 6 + (i % 14) * 3.2;
      const colIdx = i % stoneColors.length;

      ctx.beginPath();
      ctx.ellipse(rx, ry, r, r * 0.70, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = stoneColors[colIdx];
      ctx.fill();

      // Soft sunlit pebble highlight
      ctx.beginPath();
      ctx.ellipse(rx - r * 0.22, ry - r * 0.22, r * 0.42, r * 0.32, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(235, 245, 230, 0.38)';
      ctx.fill();

      // Shadow underside of stone
      ctx.beginPath();
      ctx.ellipse(rx + r * 0.15, ry + r * 0.2, r * 0.45, r * 0.22, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(22, 38, 30, 0.50)';
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 8);
    texture.needsUpdate = true;
    return texture;
  }

  public update(time: number, sunDir?: THREE.Vector3): void {
    this.riverMaterial.update(time, sunDir);
  }
}

