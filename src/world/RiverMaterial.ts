import * as THREE from 'three';

export interface RiverMaterialOptions {
  sunDirection?: THREE.Vector3;
}

export class RiverMaterial {
  public readonly material: THREE.ShaderMaterial;

  constructor(options: RiverMaterialOptions = {}) {
    const sunDir = options.sunDirection || new THREE.Vector3(36, 48, -36).normalize();

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: sunDir },
        uSunColor: { value: new THREE.Color(0xfff7e8) },
        // Stylized Anime Water Palette (Studio Ghibli / Makoto Shinkai aesthetic)
        uDeepColor: { value: new THREE.Color(0x0a3b5a) },     // Deep sapphire/cerulean pool
        uMidColor: { value: new THREE.Color(0x189eb2) },      // Luminous anime turquoise
        uShallowColor: { value: new THREE.Color(0x42dfc4) },  // Glowing sunlit jade/aquamarine shallows
        uFoamColor: { value: new THREE.Color(0xf6fffe) },     // Creamy white painterly foam
        uSunGlintColor: { value: new THREE.Color(0xfff6d4) }, // Golden sunlight glint & wash
        // Atmospheric Fog
        uFogColor: { value: new THREE.Color(0xb2cad4) },
        uFogNear: { value: 50.0 },
        uFogFar: { value: 180.0 },
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

          // Subtle micro-undulation for silky anime water surface
          vec3 displacedPos = position;
          float wave = sin(uv.y * 1.5 - uTime * 1.2 + uv.x * 2.0) * 0.02;
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
          // 1. Water Depth Gradient (Center = deep sapphire, Banks = crystal jade)
          float depthFactor = smoothstep(0.0, 0.85, vBankDist);
          vec3 waterBase = mix(uShallowColor, uMidColor, smoothstep(0.0, 0.42, depthFactor));
          waterBase = mix(waterBase, uDeepColor, smoothstep(0.38, 0.90, depthFactor));

          // 2. Gentle Longitudinal Streamlines (Flowing parallel to banks downriver)
          float flowSpeed = 0.40;
          float vFlow = vUv.y * 0.14 - uTime * flowSpeed;

          vec2 flowNoiseUv = vec2(vUv.x * 4.0, vFlow * 4.0);
          float n1 = noise(flowNoiseUv);
          float n2 = noise(flowNoiseUv * 2.0 + vec2(0.0, -uTime * 0.25));

          // Broad, graceful anime flow ribbons
          float ribbon = sin((vUv.x * 6.5 + n1 * 1.5) * 3.14159);
          float streamlines = smoothstep(0.66, 0.92, ribbon * 0.6 + n2 * 0.4);

          // Subtle soft caustics
          float fineRibbon = sin((vUv.x * 12.0 + n2 * 1.2 + vFlow * 2.5) * 3.14159);
          float fineCaustics = smoothstep(0.74, 0.94, fineRibbon) * 0.35;

          // 3. Bank & Shoreline Foam Fringe
          float shoreFringe = smoothstep(0.18, 0.02, vBankDist);
          shoreFringe *= (0.75 + 0.25 * sin(vUv.y * 2.0 - uTime * 1.5));

          // 4. Rapids White-Water Foam Trails
          float rapidsNoise = noise(vec2(vUv.x * 5.0, vFlow * 6.0));
          float rapidsFoam = smoothstep(0.66, 0.85, rapidsNoise) * smoothstep(0.15, 0.75, vBankDist);

          // Combined Anime Foam Mask
          float totalFoam = clamp(shoreFringe * 0.95 + rapidsFoam * 0.45 + streamlines * 0.20, 0.0, 1.0);

          // 5. Sun Specular Glints & Golden Surface Sheen
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 lightDir = normalize(uSunDirection);
          vec3 halfDir = normalize(lightDir + viewDir);

          vec3 waveNormal = normalize(vNormal + vec3(
            (n1 - 0.5) * 0.05,
            0.0,
            (n2 - 0.5) * 0.06
          ));

          float NdotH = max(dot(waveNormal, halfDir), 0.0);
          float softSheen = pow(NdotH, 14.0) * 0.65;
          float crispGlint = smoothstep(0.955, 0.995, pow(NdotH, 44.0)) * 2.2;
          float sunGlintTotal = (softSheen + crispGlint);

          // 6. Radiant Golden Sunlight Wash in Upper Reach (matching Reference.png)
          float upperReachFactor = smoothstep(7.0, 0.0, vUv.y);
          vec3 sunWash = uSunGlintColor * (upperReachFactor * 0.45 + sunGlintTotal * 0.85);

          // Compose Final Anime Palette
          vec3 finalColor = waterBase;
          // Add painterly longitudinal streamlines & caustics
          finalColor += uShallowColor * (streamlines * 0.22 + fineCaustics * 0.18);
          // Blend in creamy white water foam
          finalColor = mix(finalColor, uFoamColor, totalFoam * 0.85);
          // Apply golden sunlight wash & specular glints
          finalColor += sunWash;

          // 7. Soft Atmospheric Fog Blend
          float camDist = length(vWorldPosition - cameraPosition);
          float fogFactor = clamp((camDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
          finalColor = mix(finalColor, uFogColor, fogFactor * 0.60);

          // Transparency: crystal jade at shores, rich saturated sapphire in pool
          float alpha = mix(0.92, 0.99, depthFactor);

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
