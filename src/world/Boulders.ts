import * as THREE from 'three';

export interface BoulderConfig {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

export class Boulders {
  public readonly group: THREE.Group;
  private rockMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'BouldersGroup';

    // Stylized Anime Weathered Granite Material
    // Smooth painterly shading with vertex colors for sunlit facets, moss caps, and wet waterline
    this.rockMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.03,
      flatShading: false, // Completely smooth weathered contours, zero low-poly facets!
    });

    this.createBoulders();
  }

  private createWeatheredRockGeometry(seed: number): THREE.BufferGeometry {
    // Indexed SphereGeometry provides smooth continuous normals without flat facets
    const geo = new THREE.SphereGeometry(1.0, 18, 14);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const vertex = new THREE.Vector3();
    const colors = new Float32Array(vertexCount * 3);

    const colSunBuff = new THREE.Color(0xb6aba0);     // Warm sunlit granite / buff
    const colMossTop = new THREE.Color(0x6b824b);     // Soft moss cap on top
    const colSlateShadow = new THREE.Color(0x525c58); // Cool shaded slate
    const colWaterline = new THREE.Color(0x383e3a);   // Dark wet stone near waterline

    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Flatten in Y to produce weathered river boulder profile
      vertex.y *= 0.80;

      // Smooth organic asymmetrical weathering
      const angle = Math.atan2(vertex.z, vertex.x);
      const horizontalNoise =
        Math.sin(angle * 2.0 + seed) * 0.15 +
        Math.cos(angle * 3.0 + seed * 1.5) * 0.10;

      vertex.x *= 1.0 + horizontalNoise;
      vertex.z *= 1.0 + horizontalNoise;

      // Subtle vertical organic distortion
      vertex.y += Math.sin(vertex.x * 2.5 + vertex.z * 2.5 + seed) * 0.08;

      // Flatten base so it embeds solidly into terrain/riverbed
      if (vertex.y < -0.15) {
        vertex.y *= 0.55;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;
    const norm = new THREE.Vector3();

    // Compute painterly vertex colors (moss, sunlit face, shadow, waterline)
    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(pos, i);
      norm.fromBufferAttribute(normAttr, i);

      const sunFactor = norm.dot(sunDir);
      const isTop = norm.y > 0.50;

      tempColor.copy(colSlateShadow).lerp(colSunBuff, THREE.MathUtils.clamp((sunFactor + 0.2) * 0.8, 0, 1));

      // Moss cap on top surfaces
      if (isTop) {
        const mossBlend = THREE.MathUtils.clamp((norm.y - 0.50) / 0.40, 0, 1);
        tempColor.lerp(colMossTop, mossBlend * 0.65);
      }

      // Dark wet stone near bottom / waterline
      if (vertex.y < 0.10) {
        const wetBlend = THREE.MathUtils.clamp((0.10 - vertex.y) / 0.45, 0, 1);
        tempColor.lerp(colWaterline, wetBlend * 0.80);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  private createBoulders(): void {
    // Restrained, natural placements matching Reference.png:
    // Firmly submerged into riverbed and banks so rocks belong to the landscape.
    const boulderConfigs: BoulderConfig[] = [
      // 1. Iconic Left Shore Guardian Monolith (nestled firmly into meadow cut-bank shelf)
      {
        position: new THREE.Vector3(-18.0, 1.4, 0.5),
        scale: new THREE.Vector3(8.5, 7.2, 7.5),
        rotation: new THREE.Euler(0.06, 0.52, 0.04),
      },

      // 2. Mid-stream Rapids Island Boulders (partially submerged, splitting current)
      {
        position: new THREE.Vector3(3.5, 0.8, -4.0),
        scale: new THREE.Vector3(5.0, 3.8, 4.4),
        rotation: new THREE.Euler(0.10, 0.75, -0.05),
      },
      {
        position: new THREE.Vector3(-4.0, 0.3, 6.0),
        scale: new THREE.Vector3(4.2, 3.2, 3.8),
        rotation: new THREE.Euler(-0.06, 1.25, 0.08),
      },

      // 3. Right Bank Stepped Outcrops (granite ledges meeting water)
      {
        position: new THREE.Vector3(18.0, 2.6, 4.0),
        scale: new THREE.Vector3(7.5, 5.8, 6.0),
        rotation: new THREE.Euler(-0.12, 0.40, 0.10),
      },
      {
        position: new THREE.Vector3(11.0, 1.2, 14.0),
        scale: new THREE.Vector3(5.6, 4.2, 4.5),
        rotation: new THREE.Euler(0.04, 1.10, -0.06),
      },

      // 4. Foreground Left Shallows Boulder (anchoring lower-left rapids, partially submerged)
      {
        position: new THREE.Vector3(-27.0, -0.5, 28.0),
        scale: new THREE.Vector3(6.5, 5.0, 5.8),
        rotation: new THREE.Euler(0.08, 0.85, -0.08),
      },

      // 5. Upper Sunlit Rapids Boulders (distant cascade in top-right)
      {
        position: new THREE.Vector3(26.0, 3.8, -24.0),
        scale: new THREE.Vector3(5.4, 4.2, 4.8),
        rotation: new THREE.Euler(0.08, 0.65, 0.0),
      },
      {
        position: new THREE.Vector3(38.0, 5.2, -34.0),
        scale: new THREE.Vector3(6.0, 4.6, 5.2),
        rotation: new THREE.Euler(-0.08, 0.35, 0.08),
      },
    ];

    boulderConfigs.forEach((cfg, idx) => {
      const geo = this.createWeatheredRockGeometry(idx * 2.3 + 0.5);
      const mesh = new THREE.Mesh(geo, this.rockMaterial);
      mesh.position.copy(cfg.position);
      mesh.scale.copy(cfg.scale);
      mesh.rotation.copy(cfg.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });
  }
}
