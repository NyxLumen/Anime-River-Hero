import * as THREE from 'three';

export interface RiverMaterialOptions {
  sunDirection?: THREE.Vector3;
}

export class RiverMaterial {
  public readonly material: THREE.ShaderMaterial;

  constructor(options: RiverMaterialOptions = {}) {
    const sunDir = options.sunDirection || new THREE.Vector3(38, 50, -38).normalize();

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: sunDir },
        uSunColor: { value: new THREE.Color(0xfff6e2) },
        // Natural Anime Water Palette (Studio Ghibli / CoMix Wave style)
        // Natural teal, muted turquoise, clear jade shallows, warm sun highlights (NO neon cyan!)
        uDeepColor: { value: new THREE.Color(0x0c424d) },     // Deep natural slate-teal
        uMidColor: { value: new THREE.Color(0x186b78) },      // Rich natural anime turquoise
        uShallowColor: { value: new THREE.Color(0x2da496) },  // Clear sunlit jade shallows
        uFoamColor: { value: new THREE.Color(0xf2f7f5) },     // Creamy white painterly foam
        uSunGlintColor: { value: new THREE.Color(0xfff4d2) }, // Warm pale gold sunlight reflection
        // Mid-stream Boulder Positions for procedural foam eddies
        uBoulder1: { value: new THREE.Vector2(3.5, -4.0) },
        uBoulder2: { value: new THREE.Vector2(-4.0, 6.0) },
        uBoulder3: { value: new THREE.Vector2(-18.0, 0.5) },
        // Atmospheric Fog
        uFogColor: { value: new THREE.Color(0xb6cbd2) },
        uFogNear: { value: 45.0 },
        uFogFar: { value: 175.0 },
      },
      vertexShader: `
        attribute float aBankDist;
        attribute vec2 aFlow;

        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vBankDist;
        varying vec2 vFlow;

        uniform float uTime;

        void main() {
          vUv = uv;
          vBankDist = aBankDist;
          vFlow = aFlow;

          // Organic watercolor micro-undulation along stream flow
          vec3 displacedPos = position;
          float wave = sin(uv.y * 1.2 - uTime * 1.0 + uv.x * 2.2) * 0.02;
          displacedPos.y += wave * smoothstep(0.0, 0.4, aBankDist);

          vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normalize(mat3(modelMatrix) * normal);

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        uniform vec3 uDeepColor;
        uniform vec3 uMidColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform vec3 uSunGlintColor;
        uniform vec2 uBoulder1;
        uniform vec2 uBoulder2;
        uniform vec2 uBoulder3;
        uniform vec3 uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;

        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vBankDist;
        varying vec2 vFlow;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          // 1. Natural Water Depth Gradient (deep slate-teal -> rich turquoise -> sunlit jade)
          float depthFactor = smoothstep(0.0, 0.85, vBankDist);
          vec3 waterBase = mix(uShallowColor, uMidColor, smoothstep(0.0, 0.45, depthFactor));
          waterBase = mix(waterBase, uDeepColor, smoothstep(0.38, 0.90, depthFactor));

          // 2. Longitudinal Anime Streamlines (flowing parallel to banks)
          float flowSpeed = 0.38;
          float vFlow = vUv.y * 0.12 - uTime * flowSpeed;

          vec2 flowNoiseUv = vec2(vUv.x * 4.0, vFlow * 3.5);
          float n1 = noise(flowNoiseUv);
          float n2 = noise(flowNoiseUv * 2.0 + vec2(0.0, -uTime * 0.22));

          // Flow ribbons & caustics
          float ribbon = sin((vUv.x * 6.5 + n1 * 1.5) * 3.14159);
          float streamlines = smoothstep(0.65, 0.92, ribbon * 0.6 + n2 * 0.4);

          float fineRibbon = sin((vUv.x * 12.0 + n2 * 1.2 + vFlow * 2.2) * 3.14159);
          float fineCaustics = smoothstep(0.72, 0.94, fineRibbon) * 0.35;

          // 3. Bank & Shoreline Foam Fringe
          float shoreFringe = smoothstep(0.12, 0.015, vBankDist);
          shoreFringe *= (0.75 + 0.25 * sin(vUv.y * 2.5 - uTime * 1.2));

          // 4. Procedural Boulder Foam Eddies & Downstream Wakes
          // Distance to mid-stream boulders in world X-Z
          float d1 = length(vWorldPosition.xz - uBoulder1);
          float d2 = length(vWorldPosition.xz - uBoulder2);
          float d3 = length(vWorldPosition.xz - uBoulder3);

          // Contact foam collar around boulders
          float boulderCollar = smoothstep(3.2, 1.4, d1) * 0.85 +
                                smoothstep(2.8, 1.2, d2) * 0.85 +
                                smoothstep(4.2, 2.0, d3) * 0.70;

          // Downstream eddy wake streaming towards bottom-left (-X, +Z)
          vec2 wakeDir = normalize(vec2(-1.0, 1.0));
          vec2 perpDir = vec2(wakeDir.y, -wakeDir.x);

          float wake1Dist = dot(vWorldPosition.xz - uBoulder1, wakeDir);
          float wake1Perp = abs(dot(vWorldPosition.xz - uBoulder1, perpDir));
          float wake1 = smoothstep(7.0, 0.0, wake1Dist) * smoothstep(1.8, 0.2, wake1Perp) * step(0.0, wake1Dist);

          float wake2Dist = dot(vWorldPosition.xz - uBoulder2, wakeDir);
          float wake2Perp = abs(dot(vWorldPosition.xz - uBoulder2, perpDir));
          float wake2 = smoothstep(6.0, 0.0, wake2Dist) * smoothstep(1.6, 0.2, wake2Perp) * step(0.0, wake2Dist);

          float eddyNoise = noise(vec2(vUv.x * 8.0 + uTime * 0.5, vFlow * 6.0));
          float totalBoulderFoam = (boulderCollar + (wake1 + wake2) * 0.7) * (0.7 + 0.3 * eddyNoise);

          // 5. Rapids White-Water Foam Trails in Active Upstream Chute
          float rapidsNoise = noise(vec2(vUv.x * 5.0, vFlow * 5.5));
          float rapidsFoam = smoothstep(0.66, 0.84, rapidsNoise) * smoothstep(0.15, 0.75, vBankDist);

          // Combined Painterly Foam Mask
          float totalFoam = clamp(shoreFringe * 0.9 + totalBoulderFoam * 0.85 + rapidsFoam * 0.45 + streamlines * 0.15, 0.0, 1.0);

          // 6. Sun Specular Glints & Golden Surface Sheen (Late afternoon sun from top-right)
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 lightDir = normalize(uSunDirection);
          vec3 halfDir = normalize(lightDir + viewDir);

          vec3 waveNormal = normalize(vNormal + vec3(
            (n1 - 0.5) * 0.05,
            0.0,
            (n2 - 0.5) * 0.06
          ));

          float NdotH = max(dot(waveNormal, halfDir), 0.0);
          float softSheen = pow(NdotH, 16.0) * 0.60;
          float crispGlint = smoothstep(0.96, 0.995, pow(NdotH, 44.0)) * 2.2;
          float sunGlintTotal = (softSheen + crispGlint);

          // 7. Radiant Golden Sunlight Wash in Upper Reach (matching Reference.png)
          float upperReachFactor = smoothstep(7.5, 0.0, vUv.y);
          vec3 sunWash = uSunGlintColor * (upperReachFactor * 0.38 + sunGlintTotal * 0.85);

          // Compose Final Natural Watercolor Palette (Softly tinted, NOT neon emissive)
          vec3 finalColor = waterBase;
          // Add painterly longitudinal streamlines & caustics
          finalColor = mix(finalColor, uShallowColor * 1.2, (streamlines * 0.28 + fineCaustics * 0.20));
          // Blend in creamy painterly foam
          finalColor = mix(finalColor, uFoamColor, totalFoam * 0.82);
          // Apply warm pale gold sun reflection
          finalColor += sunWash;

          // 8. Soft Atmospheric Fog Blend
          float camDist = length(vWorldPosition - cameraPosition);
          float fogFactor = clamp((camDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
          finalColor = mix(finalColor, uFogColor, fogFactor * 0.62);

          // Translucent jade shallows, deep natural teal saturation in pool
          float alpha = mix(0.90, 0.98, depthFactor);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });
  }

  public update(time: number, sunDir?: THREE.Vector3): void {
    this.material.uniforms.uTime.value = time;
    if (sunDir) {
      this.material.uniforms.uSunDirection.value.copy(sunDir).normalize();
    }
  }
}
