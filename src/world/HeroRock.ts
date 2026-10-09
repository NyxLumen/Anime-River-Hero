import * as THREE from 'three';
import { RockInstanceConfig } from './Rocks';

/**
 * HeroRock — Handcrafted anime-style hero rock asset.
 * Serves as the Phase 3B.1 proof-of-concept for the new environmental asset pipeline.
 *
 * Replaces the procedural low-poly dodecahedron with a sculpted, chiseled monolith
 * featuring deliberate planar breaks, a hand-painted anime texture atlas (vibrant moss mantle,
 * vertical watercolor striations, sunlit buff face, and wet waterline), and smooth normals.
 */
export class HeroRock {
  private static sharedTexture: THREE.CanvasTexture | null = null;
  private static sharedMaterial: THREE.MeshStandardMaterial | null = null;

  /**
   * Generates a 1024x1024 hand-painted anime texture atlas for the hero monolith.
   */
  public static createTextureAtlas(): THREE.CanvasTexture {
    if (this.sharedTexture) {
      return this.sharedTexture;
    }

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Granite Wash
    // Aligned with world orientation:
    // U ~ 0.35 - 0.65 faces +X, -Z (sunlit side facing upper river and afternoon sun)
    // U ~ 0.85 - 1.0 and 0.0 - 0.20 faces -X, +Z (cool shaded side)
    const baseGrad = ctx.createLinearGradient(0, 0, size, 0);
    baseGrad.addColorStop(0.0, '#5e6864');  // Cool slate shadow
    baseGrad.addColorStop(0.20, '#78827c'); // Soft shadow transition
    baseGrad.addColorStop(0.38, '#e0d4be'); // Warm radiant granite
    baseGrad.addColorStop(0.52, '#eee4d0'); // Peak sunlit buff
    baseGrad.addColorStop(0.68, '#dcd0bc'); // Warm granite flank
    baseGrad.addColorStop(0.85, '#78807a'); // Cool shade transition
    baseGrad.addColorStop(1.0, '#5e6864');  // Slate shadow wrap
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Vertical Painterly Anime Striations & Weathering Bands
    for (let i = 0; i < 110; i++) {
      const x = ((Math.sin(i * 17.3 + 1.2) * 0.5 + 0.5) * size);
      const w = 3 + (i % 6) * 4;
      const alpha = 0.05 + (i % 5) * 0.035;
      const isSunlit = x > size * 0.30 && x < size * 0.72;

      ctx.fillStyle = isSunlit
        ? `rgba(255, 248, 235, ${alpha})`
        : `rgba(45, 52, 48, ${alpha * 1.6})`;

      ctx.beginPath();
      ctx.rect(x, 80, w, size - 180);
      ctx.fill();
    }

    // 3. Chiseled Anime Rock Fractures & Crevices
    const crackLines = [
      { startX: 480, startY: 260, points: [[505, 410], [490, 560], [515, 720]] },
      { startX: 380, startY: 320, points: [[365, 450], [385, 610], [375, 760]] },
      { startX: 590, startY: 300, points: [[610, 460], [595, 640]] },
      { startX: 820, startY: 350, points: [[835, 500], [815, 680]] },
      { startX: 180, startY: 340, points: [[195, 490], [175, 660]] },
    ];

    crackLines.forEach((c) => {
      // Dark crevice shadow core
      ctx.beginPath();
      ctx.moveTo(c.startX, c.startY);
      c.points.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.strokeStyle = 'rgba(35, 30, 26, 0.78)';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Sharp warm highlight lip along the sunlit facet edge
      ctx.beginPath();
      ctx.moveTo(c.startX + 2.5, c.startY);
      c.points.forEach(([px, py]) => ctx.lineTo(px + 2.5, py));
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    });

    // 4. Vibrant Anime Moss Mantle (top region: canvas Y: 0 to 420)
    // Rich saturated moss base wash
    const mossGrad = ctx.createLinearGradient(0, 0, 0, 420);
    mossGrad.addColorStop(0.0, '#7eb63c');  // Vibrant anime meadow green
    mossGrad.addColorStop(0.55, '#689e30'); // Deep moss body
    mossGrad.addColorStop(0.85, 'rgba(84, 126, 38, 0.70)');
    mossGrad.addColorStop(1.0, 'rgba(70, 105, 32, 0.0)');
    ctx.fillStyle = mossGrad;
    ctx.fillRect(0, 0, size, 420);

    // Organic moss clump lobes, frills, and sunlit lichen dabs
    for (let i = 0; i < 600; i++) {
      const mx = ((Math.sin(i * 13.9 + 2.1) * 0.5 + 0.5) * size);
      const my = (Math.cos(i * 19.3 + 1.4) * 0.5 + 0.5) * 380;
      const mr = 7 + (i % 10) * 3.8;

      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);

      const isSunlit = mx > size * 0.28 && mx < size * 0.75;
      if (isSunlit && (i % 3 === 0)) {
        ctx.fillStyle = 'rgba(172, 218, 68, 0.85)'; // Radiant sunlit lime frill
      } else if (i % 4 === 0) {
        ctx.fillStyle = 'rgba(142, 192, 54, 0.80)'; // Warm golden-moss dab
      } else if (i % 5 === 0) {
        ctx.fillStyle = 'rgba(48, 76, 24, 0.75)';   // Deep velvet shadow
      } else {
        ctx.fillStyle = 'rgba(110, 162, 46, 0.82)';  // Saturated anime moss
      }
      ctx.fill();
    }

    // 5. Dark Wet Waterline Zone (lower region: canvas Y: 720 to 1024)
    const wetGrad = ctx.createLinearGradient(0, 720, 0, size);
    wetGrad.addColorStop(0.0, 'rgba(45, 42, 38, 0.0)');
    wetGrad.addColorStop(0.35, 'rgba(34, 32, 28, 0.72)');
    wetGrad.addColorStop(0.70, 'rgba(24, 26, 25, 0.90)');
    wetGrad.addColorStop(1.0, 'rgba(18, 20, 19, 0.96)');
    ctx.fillStyle = wetGrad;
    ctx.fillRect(0, 720, size, size - 720);

    // Fine wet tideline deposit fringe along waterline mark (Y ~ 790)
    ctx.beginPath();
    ctx.moveTo(0, 790);
    for (let x = 0; x <= size; x += 25) {
      const waveY = 790 + Math.sin(x * 0.04) * 6 + Math.cos(x * 0.09) * 4;
      ctx.lineTo(x, waveY);
    }
    ctx.strokeStyle = 'rgba(25, 32, 28, 0.85)';
    ctx.lineWidth = 6;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    this.sharedTexture = texture;
    return texture;
  }

  /**
   * Creates the shared stylized material for the hero rock.
   */
  public static getMaterial(): THREE.MeshStandardMaterial {
    if (!this.sharedMaterial) {
      const texture = this.createTextureAtlas();
      this.sharedMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.80,
        metalness: 0.02,
        flatShading: false, // Smooth continuous normals across broad anime facets
      });
    }
    return this.sharedMaterial;
  }

  /**
   * Generates a chiseled anime hero boulder geometry with deliberate planar cuts,
   * smooth normal interpolation, and proper UV mapping.
   */
  public static createGeometry(): THREE.BufferGeometry {
    const radius = 1.0;
    const widthSegments = 28;
    const heightSegments = 20;

    const baseGeo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const pos = baseGeo.attributes.position;
    const count = pos.count;
    const v = new THREE.Vector3();

    // Shaping & Planar Chisel Phase
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i);

      // 1. Proportions: Upright, towering guardian monolith
      v.y *= 1.30;
      v.x *= 0.98;
      v.z *= 0.94;

      // 2. Organic silhouette asymmetry (slight lean toward river channel)
      const angle = Math.atan2(v.z, v.x);
      const bulge = Math.sin(angle * 2.0 + 1.2) * 0.14 + Math.cos(angle * 3.0 + 0.8) * 0.09;
      v.x *= 1.0 + bulge;
      v.z *= 1.0 + bulge;

      // Vertical harmonic undulation
      v.y += Math.sin(v.x * 2.2 + v.z * 2.2 + 1.2) * 0.08 * radius;

      // 3. Deliberate Broad Anime Planar Facets:
      // Facet A: Sun-Facing River Cliff (+X, +Y, -Z)
      const n1 = new THREE.Vector3(0.68, 0.30, -0.44).normalize();
      const d1 = 0.46 * radius;
      const dot1 = v.dot(n1);
      if (dot1 > d1) {
        v.addScaledVector(n1, -(dot1 - d1) * 0.65);
      }

      // Facet B: Steep Vertical Shadow Fracture (-X, +Y, +Z)
      const n2 = new THREE.Vector3(-0.64, 0.38, 0.56).normalize();
      const d2 = 0.50 * radius;
      const dot2 = v.dot(n2);
      if (dot2 > d2) {
        v.addScaledVector(n2, -(dot2 - d2) * 0.62);
      }

      // Facet C: Weathered Horizontal Top Shelf (+Y, sloping slightly toward meadow)
      const n3 = new THREE.Vector3(0.12, 0.96, -0.10).normalize();
      const d3 = 0.60 * radius * 1.30;
      const dot3 = v.dot(n3);
      if (dot3 > d3) {
        v.addScaledVector(n3, -(dot3 - d3) * 0.60);
      }

      // Facet D: Downstream Water-Worn Shoulder (+X, -Y, +Z)
      const n4 = new THREE.Vector3(0.52, -0.32, 0.68).normalize();
      const d4 = 0.52 * radius;
      const dot4 = v.dot(n4);
      if (dot4 > d4) {
        v.addScaledVector(n4, -(dot4 - d4) * 0.58);
      }

      // 4. Ground Embedding Base:
      // Flatten bottom vertices so the monolith embeds firmly into the terrain/riverbed
      if (v.y < -0.16 * radius * 1.30) {
        v.y *= 0.40;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    baseGeo.computeVertexNormals();

    // 5. Generate Clean Cylindrical UVs for Texture Atlas Mapping
    baseGeo.computeBoundingBox();
    const bbox = baseGeo.boundingBox!;
    const minY = bbox.min.y;
    const maxY = bbox.max.y;
    const height = Math.max(0.001, maxY - minY);

    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i);

      // U: Angular wrap around Y axis [0, 1]
      let u = Math.atan2(v.z, v.x) / (Math.PI * 2) + 0.5;
      // V: Normalized height from submerged base (0) to moss top (1)
      // With Three.js flipY=true (default on CanvasTexture), V=1 maps to canvas Y=0 (moss mantle)
      // and V=0 maps to canvas Y=size (wet waterline base).
      let vCoord = (v.y - minY) / height;

      uvs[i * 2] = u;
      uvs[i * 2 + 1] = vCoord;
    }

    baseGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Fix texture seam wrapping along the U seam
    const index = baseGeo.getIndex();
    if (index) {
      const uvAttr = baseGeo.attributes.uv;
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        const b = index.getX(i + 1);
        const c = index.getX(i + 2);

        const uA = uvAttr.getX(a);
        const uB = uvAttr.getX(b);
        const uC = uvAttr.getX(c);

        if (Math.abs(uA - uB) > 0.5 || Math.abs(uB - uC) > 0.5 || Math.abs(uA - uC) > 0.5) {
          if (uA < 0.5) uvAttr.setX(a, uA + 1.0);
          if (uB < 0.5) uvAttr.setX(b, uB + 1.0);
          if (uC < 0.5) uvAttr.setX(c, uC + 1.0);
        }
      }
    }

    return baseGeo;
  }

  /**
   * Factory method to create and configure the hero rock mesh.
   */
  public static createMesh(cfg: RockInstanceConfig, groundY: number): THREE.Mesh {
    const geo = this.createGeometry();
    const mat = this.getMaterial();
    const mesh = new THREE.Mesh(geo, mat);

    mesh.name = 'AuthoredHeroRock_GuardianMonolith';
    mesh.position.set(cfg.x, groundY, cfg.z);
    mesh.scale.set(...cfg.scale);
    mesh.rotation.set(...cfg.rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }
}
