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
      { point: new THREE.Vector3(46, 7.2, -46), width: 20.0 },   // Distant sunlit headwaters
      { point: new THREE.Vector3(32, 5.2, -30), width: 25.0 },   // Sunlit upper rapids
      { point: new THREE.Vector3(18, 3.4, -16), width: 30.0 },   // Upper bend entering valley
      { point: new THREE.Vector3(3, 1.8, -3), width: 37.0 },     // Opening into wide basin
      { point: new THREE.Vector3(-9, 0.6, 9), width: 43.0 },     // Majestic central pool (hero expanse)
      { point: new THREE.Vector3(-22, -0.4, 22), width: 34.0 },  // Lower neck curving past promontory
      { point: new THREE.Vector3(-35, -1.4, 35), width: 36.0 },  // Foreground rapids
      { point: new THREE.Vector3(-50, -2.5, 50), width: 42.0 },  // Exiting canvas bottom-left
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
      color: 0x3d5c4c, // Natural warm olive-teal & gravel bed
      map: bedTexture,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: false,
    });
    this.bedMesh = new THREE.Mesh(bedRibbon.geometry, bedMaterial);
    this.bedMesh.position.y -= 0.18; // Close to surface so shallows reveal riverbed
    this.bedMesh.renderOrder = 1;
    this.bedMesh.receiveShadow = true;
    this.group.add(this.bedMesh);
  }

  private createRiverbedTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base warm olive-gray sand & gravel wash
    ctx.fillStyle = '#2c4a3e';
    ctx.fillRect(0, 0, size, size);

    // Fine silt & sand ripple bands
    for (let y = 0; y < size; y += 40) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 40);
      grad.addColorStop(0, 'rgba(64, 88, 70, 0.4)');
      grad.addColorStop(0.5, 'rgba(44, 68, 55, 0.2)');
      grad.addColorStop(1, 'rgba(35, 55, 45, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, size, 40);
    }

    // Varied water-worn river stones (buff, slate, warm grey, limestone, mossy)
    const stoneColors = [
      '#627a6c', '#7e9080', '#55685a', '#8a9c86', '#4e6256',
      '#748274', '#989e8a', '#5f7062', '#869480', '#3e5246'
    ];

    for (let i = 0; i < 900; i++) {
      const rx = (Math.sin(i * 13.7) * 0.5 + 0.5) * size;
      const ry = (Math.cos(i * 19.1) * 0.5 + 0.5) * size;
      const r = 5 + (i % 12) * 2.8;
      const colIdx = i % stoneColors.length;

      ctx.beginPath();
      ctx.ellipse(rx, ry, r, r * 0.72, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = stoneColors[colIdx];
      ctx.fill();

      // Soft sunlit pebble highlight
      ctx.beginPath();
      ctx.ellipse(rx - r * 0.22, ry - r * 0.22, r * 0.42, r * 0.32, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(215, 230, 210, 0.32)';
      ctx.fill();

      // Shadow underside of stone
      ctx.beginPath();
      ctx.ellipse(rx + r * 0.15, ry + r * 0.2, r * 0.45, r * 0.22, (i % 8) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 35, 28, 0.45)';
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
