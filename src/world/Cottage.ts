import * as THREE from 'three';
import { Terrain } from './Terrain';

export class Cottage {
  public readonly group: THREE.Group;
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'Cottage';
    this.terrain = terrain;

    const posX = -20.0;
    const posZ = -16.0;
    const groundY = this.terrain.getHeightAt(posX, posZ).y;

    this.group.position.set(posX, groundY, posZ);
    this.group.rotation.y = 0.82;

    this.buildCottage();
  }

  private buildCottage(): void {
    // 1. Materials
    const woodTimberMat = new THREE.MeshStandardMaterial({
      color: 0x5a4432, // Weathered dark timber beams
      roughness: 0.92,
      metalness: 0.02,
    });

    const wallPlasterMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb4, // Warm Japanese earthen plaster
      roughness: 0.95,
      metalness: 0.01,
    });

    const porchWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8a7258, // Warm cedar/cypress engawa boards
      roughness: 0.88,
      metalness: 0.02,
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x483a30, // Weathered thatch & charcoal tile
      roughness: 0.94,
      metalness: 0.02,
      flatShading: false,
    });

    const roofMossMat = new THREE.MeshStandardMaterial({
      color: 0x4a5a36, // Mossy north-facing thatch
      roughness: 0.92,
      metalness: 0.02,
    });

    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0xf5e1a2, // Warm paper shoji glow
      emissive: 0xb58032,
      emissiveIntensity: 0.45,
      roughness: 0.60,
      metalness: 0.05,
    });

    const stoneBaseMat = new THREE.MeshStandardMaterial({
      color: 0x6e685f,
      roughness: 0.90,
      metalness: 0.02,
    });

    // 2. Foundation Fieldstones
    const foundationGeo = new THREE.BoxGeometry(5.2, 0.45, 4.0);
    const foundation = new THREE.Mesh(foundationGeo, stoneBaseMat);
    foundation.position.y = 0.22;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    this.group.add(foundation);

    // 3. Main Wall Body (Plaster wall)
    const wallGeo = new THREE.BoxGeometry(4.4, 2.4, 3.4);
    const walls = new THREE.Mesh(wallGeo, wallPlasterMat);
    walls.position.y = 1.65;
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.group.add(walls);

    // 4. Exposed Wooden Timber Post Framing
    const cornerPostGeo = new THREE.BoxGeometry(0.24, 2.45, 0.24);
    const cornerOffsets = [
      [-2.15, 1.65, -1.65],
      [2.15, 1.65, -1.65],
      [-2.15, 1.65, 1.65],
      [2.15, 1.65, 1.65],
    ];

    cornerOffsets.forEach(([cx, cy, cz]) => {
      const post = new THREE.Mesh(cornerPostGeo, woodTimberMat);
      post.position.set(cx, cy, cz);
      post.castShadow = true;
      this.group.add(post);
    });

    // Horizontal sill and lintel beams
    const beamGeo = new THREE.BoxGeometry(4.5, 0.18, 0.18);
    const lintel = new THREE.Mesh(beamGeo, woodTimberMat);
    lintel.position.set(0, 2.75, 1.68);
    this.group.add(lintel);

    const sill = new THREE.Mesh(beamGeo, woodTimberMat);
    sill.position.set(0, 0.55, 1.68);
    this.group.add(sill);

    // 5. Windows with Warm Glow
    const windowGeo = new THREE.PlaneGeometry(0.75, 0.85);
    const win1 = new THREE.Mesh(windowGeo, windowGlassMat);
    win1.position.set(-1.1, 1.65, 1.72);
    this.group.add(win1);

    const win2 = new THREE.Mesh(windowGeo, windowGlassMat);
    win2.position.set(1.1, 1.65, 1.72);
    this.group.add(win2);

    // Window lattice frames
    const frameGeo = new THREE.BoxGeometry(0.85, 0.95, 0.06);
    const frame1 = new THREE.Mesh(frameGeo, woodTimberMat);
    frame1.position.set(-1.1, 1.65, 1.73);
    this.group.add(frame1);

    const frame2 = new THREE.Mesh(frameGeo, woodTimberMat);
    frame2.position.set(1.1, 1.65, 1.73);
    this.group.add(frame2);

    // 6. Sliding Wooden Door
    const doorGeo = new THREE.BoxGeometry(0.85, 1.65, 0.08);
    const door = new THREE.Mesh(doorGeo, woodTimberMat);
    door.position.set(0.0, 1.30, 1.72);
    door.castShadow = true;
    this.group.add(door);

    // 7. Traditional Gabled Thatched Roof
    // Main roof pyramid / hip
    const roofGeo = new THREE.ConeGeometry(3.8, 2.1, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.28, 1.0, 1.05);

    // Flare out eaves slightly
    const pos = roofGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < -0.2) {
        pos.setX(i, pos.getX(i) * 1.12);
        pos.setZ(i, pos.getZ(i) * 1.12);
      }
    }
    roofGeo.computeVertexNormals();

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.85;
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.group.add(roof);

    // Moss accent strip along roof ridge
    const ridgeGeo = new THREE.BoxGeometry(3.6, 0.25, 0.45);
    const ridge = new THREE.Mesh(ridgeGeo, roofMossMat);
    ridge.position.y = 4.80;
    ridge.castShadow = true;
    this.group.add(ridge);

    // 8. Engawa (Raised Porch Deck)
    const porchGeo = new THREE.BoxGeometry(4.8, 0.16, 1.0);
    const porch = new THREE.Mesh(porchGeo, porchWoodMat);
    porch.position.set(0, 0.50, 2.20);
    porch.castShadow = true;
    porch.receiveShadow = true;
    this.group.add(porch);

    // Porch support posts
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.50, 6);
    const postPositions = [
      [-2.1, 0.25, 2.6],
      [0.0, 0.25, 2.6],
      [2.1, 0.25, 2.6],
    ];

    postPositions.forEach(([px, py, pz]) => {
      const post = new THREE.Mesh(postGeo, woodTimberMat);
      post.position.set(px, py, pz);
      post.castShadow = true;
      this.group.add(post);
    });

    // 9. Flower Box under Window
    const flowerBoxGeo = new THREE.BoxGeometry(0.85, 0.22, 0.25);
    const flowerBox = new THREE.Mesh(flowerBoxGeo, woodTimberMat);
    flowerBox.position.set(-1.1, 1.05, 1.82);
    flowerBox.castShadow = true;
    this.group.add(flowerBox);

    // Small pink/white flowers in box
    const flowerPetalMat = new THREE.MeshStandardMaterial({
      color: 0xebb4c2,
      roughness: 0.8,
    });
    for (let f = 0; f < 3; f++) {
      const flGeo = new THREE.SphereGeometry(0.08, 6, 5);
      const fl = new THREE.Mesh(flGeo, flowerPetalMat);
      fl.position.set(-1.35 + f * 0.25, 1.20, 1.82);
      this.group.add(fl);
    }

    // 10. Subtle Garden Fence
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x5a4838,
      roughness: 0.92,
    });
    const fPostGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.65, 6);
    const fRailGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6);
    fRailGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < 4; i++) {
      const fp = new THREE.Mesh(fPostGeo, fenceMat);
      fp.position.set(-2.6 + i * 0.65, 0.32, 3.2);
      fp.castShadow = true;
      this.group.add(fp);
    }
    const fRail = new THREE.Mesh(fRailGeo, fenceMat);
    fRail.position.set(-1.62, 0.48, 3.2);
    fRail.castShadow = true;
    this.group.add(fRail);
  }
}
