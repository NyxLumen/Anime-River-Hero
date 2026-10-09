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
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: sunDir },
        uSunColor: { value: new THREE.Color(0xfff6e2) },
        // Natural Anime Water Palette (Studio Ghibli / Makoto Shinkai master reference)
        // Rich vibrant teal, sparkling turquoise, clear sunlit jade shallows, creamy white foam
        uDeepColor: { value: new THREE.Color(0x0e4756) },     // Deep rich oceanic slate-teal
        uMidColor: { value: new THREE.Color(0x1a7886) },      // Sparkling vibrant anime turquoise
        uShallowColor: { value: new THREE.Color(0x34a896) },  // Clear sunlit translucent jade shallows
        uFoamColor: { value: new THREE.Color(0xf6fbf8) },     // Creamy crisp white painterly foam
        uSunGlintColor: { value: new THREE.Color(0xfff3d2) }, // Warm pale gold sunlight reflection
        // River boulder coordinates for procedural waterline collars and wakes
        uBoulder1: { value: new THREE.Vector2(3.5, -4.0) },
        uBoulder2: { value: new THREE.Vector2(-4.0, 6.0) },
        uBoulder3: { value: new THREE.Vector2(-27.0, 28.0) },
        uBoulder4: { value: new THREE.Vector2(-18.0, 0.5) },
        uBoulder5: { value: new THREE.Vector2(11.0, 14.0) },
        uBoulder6: { value: new THREE.Vector2(18.0, 4.0) },
        uBoulder7: { value: new THREE.Vector2(26.0, -24.0) },
        uBoulder8: { value: new THREE.Vector2(38.0, -34.0) },
        // Atmospheric Fog
        uFogColor: { value: new THREE.Color(0xb2cad0) },
        uFogNear: { value: 65.0 },
        uFogFar: { value: 215.0 },
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
          float wave = sin(uv.y * 1.4 - uTime * 1.1 + uv.x * 2.5) * 0.025;
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
        uniform vec2 uBoulder4;
        uniform vec2 uBoulder5;
        uniform vec2 uBoulder6;
        uniform vec2 uBoulder7;
        uniform vec2 uBoulder8;
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
          // 1. Natural Water Depth Gradient (deep oceanic teal -> rich turquoise -> sunlit jade shallows)
          float depthFactor = smoothstep(0.02, 0.72, vBankDist);
          vec3 waterBase = mix(uShallowColor, uMidColor, smoothstep(0.0, 0.42, depthFactor));
          waterBase = mix(waterBase, uDeepColor, smoothstep(0.35, 0.88, depthFactor));

          // 2. Longitudinal Anime Streamlines (flowing downstream with current)
          // 2. Longitudinal Anime Streamlines (flowing downstream with current)
          float flowSpeed = 0.36;
          float vFlowCoord = vUv.y * 0.14 - uTime * flowSpeed;

          vec2 flowNoiseUv = vec2(vUv.x * 4.2, vFlowCoord * 3.2);
          float n1 = noise(flowNoiseUv);
          float n2 = noise(flowNoiseUv * 2.4 + vec2(0.5, -uTime * 0.20));

          // Slender, graceful calligraphic anime foam wisps
          float streamPhase = vUv.x * 7.6 + n1 * 1.6 + sin(vFlowCoord * 3.2) * 0.32;
          float streamRibbon = sin(streamPhase * 3.14159);
          // Modulate with longitudinal noise so ribbons break and weave naturally
          float streamBreak = noise(vec2(vUv.x * 3.2, vFlowCoord * 1.5));
          float streamlines = smoothstep(0.90, 0.985, streamRibbon) * smoothstep(0.34, 0.64, streamBreak) * 0.45;
          streamlines *= smoothstep(0.08, 0.35, vBankDist); // taper softly near banks

          // 3. Whitewater Rapids Cascade in Upper Chute (vUv.y < 7.5, matching Reference.png)
          float rapidsZone = smoothstep(7.8, 1.5, vUv.y);
          // Directional surging whitewater turbulence aligned with flow
          vec2 rapidsUv = vec2(vUv.x * 5.2, vFlowCoord * 6.5);
          float rNoise1 = noise(rapidsUv);
          float rNoise2 = noise(rapidsUv * 2.2 + vec2(1.2, -uTime * 0.4));
          float rSurge = sin(vFlowCoord * 12.0 + rNoise1 * 3.8);
          float rapidsFoam = smoothstep(0.42, 0.80, rNoise1 * 0.55 + rNoise2 * 0.35 + rSurge * 0.25) * rapidsZone;
          rapidsFoam *= smoothstep(0.06, 0.35, vBankDist); // naturally taper at bank margins

          // 4. Shoreline Contact Foam Fringe
          float shoreFringe = smoothstep(0.075, 0.005, vBankDist + (n1 - 0.5) * 0.022);
          shoreFringe *= (0.75 + 0.25 * sin(vUv.y * 3.4 - uTime * 1.3));

          // 5. Procedural Boulder Waterline Foam Collars & Downstream Wake Tails
          float d1 = length(vWorldPosition.xz - uBoulder1);
          float d2 = length(vWorldPosition.xz - uBoulder2);
          float d3 = length(vWorldPosition.xz - uBoulder3);
          float d4 = length(vWorldPosition.xz - uBoulder4);
          float d5 = length(vWorldPosition.xz - uBoulder5);
          float d6 = length(vWorldPosition.xz - uBoulder6);
          float d7 = length(vWorldPosition.xz - uBoulder7);
          float d8 = length(vWorldPosition.xz - uBoulder8);

          // Visible annular waterline collars hugging boulder contours
          float collarNoise = noise(vWorldPosition.xz * 1.8 + vec2(uTime * 0.6, -uTime * 0.8));
          float bCollar = (
            smoothstep(4.0, 2.7, d1) * smoothstep(2.0, 2.7, d1) * 0.95 +
            smoothstep(3.5, 2.3, d2) * smoothstep(1.7, 2.3, d2) * 0.95 +
            smoothstep(4.2, 2.9, d3) * smoothstep(2.2, 2.9, d3) * 0.90 +
            smoothstep(5.4, 4.0, d4) * smoothstep(3.0, 4.0, d4) * 0.92 +
            smoothstep(3.7, 2.4, d5) * smoothstep(1.8, 2.4, d5) * 0.85 +
            smoothstep(4.5, 3.1, d6) * smoothstep(2.3, 3.1, d6) * 0.85 +
            smoothstep(3.9, 2.5, d7) * smoothstep(1.8, 2.5, d7) * 0.85 +
            smoothstep(4.1, 2.7, d8) * smoothstep(2.0, 2.7, d8) * 0.85
          ) * (0.65 + 0.35 * collarNoise);

          // Downstream wake trailing in flow direction (-X, +Z)
          vec2 wakeDir = normalize(vec2(-1.0, 1.0));
          vec2 perpDir = vec2(wakeDir.y, -wakeDir.x);

          // Slender diverging wakes trailing immediately behind boulders
          float w1Dist = dot(vWorldPosition.xz - uBoulder1, wakeDir);
          float w1Perp = abs(dot(vWorldPosition.xz - uBoulder1, perpDir));
          float wake1 = smoothstep(4.0, 0.4, w1Dist) * smoothstep(1.8, 0.15, w1Perp) * step(0.1, w1Dist) * (0.35 + 0.65 * collarNoise);

          float w2Dist = dot(vWorldPosition.xz - uBoulder2, wakeDir);
          float w2Perp = abs(dot(vWorldPosition.xz - uBoulder2, perpDir));
          float wake2 = smoothstep(3.5, 0.4, w2Dist) * smoothstep(1.6, 0.15, w2Perp) * step(0.1, w2Dist) * (0.35 + 0.65 * collarNoise);

          // Upstream bow cushions
          float bow1 = smoothstep(3.4, 2.4, d1) * max(0.0, dot(normalize(vWorldPosition.xz - uBoulder1), -wakeDir)) * 0.70;
          float bow2 = smoothstep(3.0, 2.0, d2) * max(0.0, dot(normalize(vWorldPosition.xz - uBoulder2), -wakeDir)) * 0.70;

          float eddyNoise = noise(vec2(vUv.x * 8.5 + uTime * 0.6, vFlowCoord * 6.5));
          float totalBoulderFoam = (bCollar * 0.95 + (wake1 + wake2 + bow1 + bow2) * 0.70) * (0.55 + 0.45 * eddyNoise);

          // Combined Painterly Foam Mask (natural organic foam clustering, no white lane lines)
          float totalFoam = clamp(
            shoreFringe * 0.85 +
            totalBoulderFoam * 0.90 +
            rapidsFoam * 0.90,
            0.0, 1.0
          );

          // 6. Sunlight Specular Glints & Caustic Highlights (Late afternoon sun)
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 lightDir = normalize(uSunDirection);
          vec3 halfDir = normalize(lightDir + viewDir);

          vec3 waveNormal = normalize(vNormal + vec3(
            (n1 - 0.5) * 0.08,
            0.0,
            (n2 - 0.5) * 0.09
          ));

          float NdotH = max(dot(waveNormal, halfDir), 0.0);
          float softSheen = pow(NdotH, 18.0) * 0.45;
          float crispGlint = smoothstep(0.94, 0.99, pow(NdotH, 36.0)) * 2.2;
          float sunGlintTotal = (softSheen + crispGlint);

          // Radiant golden sun accent in upper chute
          float upperChuteSun = rapidsZone * 0.28;

          // Compose Final Natural Watercolor Palette
          vec3 finalColor = waterBase;

          // Subtle organic current streamlines as soft jade ripples
          finalColor = mix(finalColor, uShallowColor * 1.25, streamlines * 0.45);

          // Blend in creamy painterly foam with natural translucent falloff
          float foamAlpha = clamp(totalFoam * 0.82, 0.0, 0.88);
          finalColor = mix(finalColor, uFoamColor, foamAlpha);

          // Apply warm sunlight sheen & sparkling highlights (proportional to sun exposure and foam)
          vec3 sunSheen = uSunGlintColor * (sunGlintTotal * (0.45 + totalFoam * 0.35) + upperChuteSun);
          finalColor += sunSheen;

          // 7. Soft Atmospheric Fog Blend
          float camDist = length(vWorldPosition - cameraPosition);
          float fogFactor = clamp((camDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
          finalColor = mix(finalColor, uFogColor, fogFactor * 0.60);

          // Translucent jade shallows revealing riverbed stones, deep saturation in pool center
          float alpha = mix(0.55, 0.96, smoothstep(0.03, 0.55, vBankDist));
          if (totalFoam > 0.3) {
            alpha = mix(alpha, 0.98, smoothstep(0.3, 0.8, totalFoam));
          }

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
