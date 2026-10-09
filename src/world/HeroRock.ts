import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RockInstanceConfig } from './Rocks';

/**
 * HeroRock — Handcrafted anime-style hero rock asset library (Studio Ghibli / Makoto Shinkai).
 * Uses IcosahedronGeometry (eliminating polar singularities and horizontal creases),
 * procedural harmonic displacement, planar chisel cleavage cuts, creased normals,
 * and authentic anime cel-shaded vertex colors.
 */
export class HeroRock {
  private static sharedMaterials: Map<number, THREE.MeshStandardMaterial> = new Map();

  public static getMaterial(variant: number = 0): THREE.MeshStandardMaterial {
    if (!this.sharedMaterials.has(variant)) {
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: variant === 1 ? 0.60 : 0.80,
        metalness: variant === 1 ? 0.05 : 0.02,
        flatShading: false,
      });
      this.sharedMaterials.set(variant, mat);
    }
    return this.sharedMaterials.get(variant)!;
  }

  public static createGeometry(
    variant: number = 0,
    seed: number = 1.0,
    mossAmount: number = 0.65,
    groundY: number = 0,
    scaleY: number = 1,
    sampleY?: number,
    rotation: [number, number, number] = [0, 0, 0]
  ): THREE.BufferGeometry {
    const baseRadius = 1.0;
    // Detail 2 icosahedron provides 320 uniform triangular facets with NO poles
    const baseGeo = new THREE.IcosahedronGeometry(baseRadius, 2);
    const pos = baseGeo.attributes.position;
    const count = pos.count;
    const vertex = new THREE.Vector3();

    const aspectY = variant === 0 ? 1.40 : variant === 1 ? 0.88 : 0.48;
    const aspectXZ = variant === 0 ? 1.05 : variant === 1 ? 1.25 : 1.25;
    const angularity = 0.14;

    for (let i = 0; i < count; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Proportional shaping
      vertex.y *= aspectY;
      vertex.x *= aspectXZ;
      vertex.z *= aspectXZ;

      // Natural organic harmonic displacement
      const angle = Math.atan2(vertex.z, vertex.x);
      const horizontalNoise =
        Math.sin(angle * 2.0 + seed) * angularity +
        Math.cos(angle * 3.0 + seed * 1.5) * (angularity * 0.70);

      vertex.x *= 1.0 + horizontalNoise;
      vertex.z *= 1.0 + horizontalNoise;

      // Vertical organic harmonic undulation
      vertex.y += Math.sin(vertex.x * 2.0 + vertex.z * 2.0 + seed) * 0.06 * baseRadius;

      // Authentic planar chisel cuts matching archetypes
      if (variant === 0) {
        // ==========================================
        // HERO 1: GUARDIAN MONOLITH
        // Upright weathered granite monolith
        // ==========================================
        // Sun-facing sloping facet (+X, +Y, -Z)
        const n1 = new THREE.Vector3(0.55, 0.60, -0.58).normalize();
        const d1 = 0.85 * baseRadius * Math.min(aspectY, aspectXZ);
        const dot1 = vertex.dot(n1);
        if (dot1 > d1) vertex.addScaledVector(n1, -(dot1 - d1) * 0.45);

        // Steep shaded fracture wall (-X, +Y, +Z)
        const n2 = new THREE.Vector3(-0.68, 0.22, 0.70).normalize();
        const d2 = 0.82 * baseRadius * Math.min(aspectY, aspectXZ);
        const dot2 = vertex.dot(n2);
        if (dot2 > d2) vertex.addScaledVector(n2, -(dot2 - d2) * 0.45);

        // Natural sloped crest apex
        const n3 = new THREE.Vector3(0.18, 0.94, -0.28).normalize();
        const d3 = 0.92 * baseRadius * aspectY;
        const dot3 = vertex.dot(n3);
        if (dot3 > d3) vertex.addScaledVector(n3, -(dot3 - d3) * 0.45);

        // Lateral river-facing facet (+X, +Z)
        const n4 = new THREE.Vector3(0.70, 0.20, 0.65).normalize();
        const d4 = 0.85 * baseRadius * aspectXZ;
        const dot4 = vertex.dot(n4);
        if (dot4 > d4) vertex.addScaledVector(n4, -(dot4 - d4) * 0.45);

      } else if (variant === 1) {
        // ==========================================
        // HERO 2: RAPIDS ISLAND SPLITTER
        // Substantial river boulder parting current
        // ==========================================
        // Upstream wedge prow parting current (+X, -Z)
        const n1 = new THREE.Vector3(0.75, 0.22, -0.62).normalize();
        const d1 = 0.82 * baseRadius * aspectXZ;
        const dot1 = vertex.dot(n1);
        if (dot1 > d1) vertex.addScaledVector(n1, -(dot1 - d1) * 0.45);

        // Downstream wake flank (-X, +Z)
        const n2 = new THREE.Vector3(-0.68, 0.22, 0.70).normalize();
        const d2 = 0.82 * baseRadius * aspectXZ;
        const dot2 = vertex.dot(n2);
        if (dot2 > d2) vertex.addScaledVector(n2, -(dot2 - d2) * 0.45);

        // Rounded upper table shelf for velvet moss cushion (+Y)
        const n3 = new THREE.Vector3(0.04, 0.98, -0.06).normalize();
        const d3 = 0.88 * baseRadius * aspectY;
        const dot3 = vertex.dot(n3);
        if (dot3 > d3) vertex.addScaledVector(n3, -(dot3 - d3) * 0.45);

      } else {
        // ==========================================
        // HERO 3: SHALLOWS STEPPING SLAB
        // Flat riverbank stone jutting into shallows
        // ==========================================
        const nTop = new THREE.Vector3(0.02, 0.99, -0.02).normalize();
        const dTop = 0.45 * baseRadius * aspectY;
        const dotTop = vertex.dot(nTop);
        if (dotTop > dTop) vertex.addScaledVector(nTop, -(dotTop - dTop) * 0.55);
      }

      // Smooth grounded base extending downward into riverbed or terrain
      if (vertex.y < 0) {
        vertex.y *= 1.30;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Creased normals create clean anime facet boundaries without jagged spikes
    const creaseAngle = variant === 0 ? 44 : variant === 1 ? 40 : 36;
    const creasedGeo = BufferGeometryUtils.toCreasedNormals(baseGeo, THREE.MathUtils.degToRad(creaseAngle));

    // Calculate painterly anime vertex colors
    const creasedPos = creasedGeo.attributes.position;
    const creasedNorm = creasedGeo.attributes.normal;
    const vCount = creasedPos.count;
    const colors = new Float32Array(vCount * 3);

    const sunDir = new THREE.Vector3(0.68, 0.60, -0.42).normalize();
    const vert = new THREE.Vector3();
    const norm = new THREE.Vector3();
    const tempCol = new THREE.Color();

    const pal = variant === 0
      ? {
          sunlit: new THREE.Color(0xf5e8d2),    // Warm radiant buff cream granite
          halfTone: new THREE.Color(0xdad0be),  // Soft transition halftone
          shadow: new THREE.Color(0x8a9296),    // Cool slate anime shadow
          underside: new THREE.Color(0x4a463e), // Warm earthy underside
          moss: new THREE.Color(0x5ca032),      // Lush velvet emerald moss
          mossHighlight: new THREE.Color(0x8ece48),
          waterline: new THREE.Color(0x7e766a), // Warm damp river stone
        }
      : variant === 1
      ? {
          sunlit: new THREE.Color(0xcce0dc),    // Sunlit cool river granite
          halfTone: new THREE.Color(0x9cb0ae),
          shadow: new THREE.Color(0x52666a),    // Wet river shadow
          underside: new THREE.Color(0x283438),
          moss: new THREE.Color(0x56942c),      // Rapids emerald moss shelf
          mossHighlight: new THREE.Color(0x7ecc3e),
          waterline: new THREE.Color(0x384a4e),
        }
      : {
          sunlit: new THREE.Color(0xede4d4),    // Pale limestone slab
          halfTone: new THREE.Color(0xc4baa0),
          shadow: new THREE.Color(0x888072),
          underside: new THREE.Color(0x484238),
          moss: new THREE.Color(0x6e943c),
          mossHighlight: new THREE.Color(0x88b248),
          waterline: new THREE.Color(0x48443c),
        };

    const rotEuler = new THREE.Euler(...rotation);
    const worldNorm = new THREE.Vector3();

    for (let i = 0; i < vCount; i++) {
      vert.fromBufferAttribute(creasedPos, i);
      norm.fromBufferAttribute(creasedNorm, i);
      worldNorm.copy(norm).applyEuler(rotEuler).normalize();

      const sunFactor = worldNorm.dot(sunDir);

      // Smooth painterly anime gradient across stone
      const tSun = THREE.MathUtils.clamp((sunFactor + 0.35) / 1.15, 0, 1);
      const halfToneWeight = THREE.MathUtils.smoothstep(tSun, 0.08, 0.55);
      const sunlitWeight = THREE.MathUtils.smoothstep(tSun, 0.45, 0.95);
      tempCol.copy(pal.shadow).lerp(pal.halfTone, halfToneWeight).lerp(pal.sunlit, sunlitWeight);

      if (worldNorm.y < -0.15) {
        const underFactor = THREE.MathUtils.clamp(-worldNorm.y * 1.3, 0, 1);
        tempCol.lerp(pal.underside, underFactor * 0.60);
      }

      // Rich velvet moss cap strictly on upward-facing facets & shelves in world space
      const mossThreshold = variant === 1 ? 0.32 : 0.44;
      if (worldNorm.y > mossThreshold && mossAmount > 0) {
        const mossNoise = Math.sin(vert.x * 4.0 + seed) * 0.06 + Math.cos(vert.z * 4.0) * 0.06;
        const mossBlend = THREE.MathUtils.clamp((worldNorm.y - mossThreshold + mossNoise) / 0.32, 0, 1) * mossAmount;
        const mossCol = pal.moss.clone();
        if (sunFactor > 0.10) {
          mossCol.lerp(pal.mossHighlight, 0.45);
        }
        tempCol.lerp(mossCol, mossBlend * 0.90);
      }

      // Subtle natural waterline dampening near water surface
      if (sampleY !== undefined) {
        const worldY = groundY + vert.y * scaleY;
        const waterDelta = worldY - sampleY;
        if (waterDelta < 0.25) {
          const wetFactor = 1.0 - THREE.MathUtils.clamp(waterDelta / 0.25, 0, 1);
          tempCol.lerp(pal.waterline, wetFactor * 0.35);
        }
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    creasedGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return creasedGeo;
  }

  public static createMesh(cfg: RockInstanceConfig, groundY: number, sampleY?: number): THREE.Mesh {
    const geo = this.createGeometry(cfg.variant, cfg.seed, cfg.mossAmount, groundY, cfg.scale[1], sampleY, cfg.rotation);
    const mat = this.getMaterial(cfg.variant);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.name = `AuthoredHeroRock_Variant${cfg.variant}`;
    mesh.position.set(cfg.x, groundY, cfg.z);
    mesh.scale.set(...cfg.scale);
    mesh.rotation.set(...cfg.rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }
}
