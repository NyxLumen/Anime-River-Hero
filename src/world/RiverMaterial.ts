import * as THREE from 'three';

export interface RiverMaterialOptions {
  sunDirection?: THREE.Vector3;
}

export class RiverMaterial {
  public readonly material: THREE.ShaderMaterial;

  constructor(options: RiverMaterialOptions = {}) {
    const sunDir = options.sunDirection || new THREE.Vector3(75, 95, -70).normalize();

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: sunDir },
        uSunColor: { value: new THREE.Color(0xfff4dc) },
        // Luminous Anime Water Palette (Studio Ghibli / Makoto Shinkai master reference)
        uDeepColor: { value: new THREE.Color(0x166c84) },     // Deep vibrant jewel-tone oceanic teal
        uMidColor: { value: new THREE.Color(0x28bad0) },      // Sparkling turquoise pool
        uShallowColor: { value: new THREE.Color(0x52ebd2) },  // Crystalline sunlit translucent jade shallows
        uFoamColor: { value: new THREE.Color(0xfcfffe) },     // Crisp creamy white painterly foam
        uSunGlintColor: { value: new THREE.Color(0xfff8e4) }, // Warm radiant gold sunlight reflection
        // River boulder coordinates for procedural waterline collars and wakes
        uBoulder1: { value: new THREE.Vector2(3.5, -5.5) },   // Rapids Island Splitter (rad ~3.4)
        uBoulder2: { value: new THREE.Vector2(15.0, -1.0) },  // Right bank granite promontory (rad ~2.8)
        uBoulder3: { value: new THREE.Vector2(19.0, -11.0) }, // Right bank upper ledge (rad ~2.6)
        uBoulder4: { value: new THREE.Vector2(-14.5, -3.8) }, // Hero 1: Guardian Monolith shore (rad ~2.8)
        uBoulder5: { value: new THREE.Vector2(12.0, 9.0) },   // Right bank pool ledge (rad ~2.2)
        uBoulder6: { value: new THREE.Vector2(-11.0, 6.5) },  // Left bank shallows slab (rad ~2.0)
        uBoulder7: { value: new THREE.Vector2(25.0, -22.0) }, // Upper gorge bluff (rad ~2.8)
        uBoulder8: { value: new THREE.Vector2(-27.0, 28.0) }, // Lower rapids boulder (rad ~2.4)
        // Atmospheric Fog
        uFogColor: { value: new THREE.Color(0xabc6d0) },
        uFogNear: { value: 85.0 },
        uFogFar: { value: 240.0 },
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

          // Gentle watercolor surface undulation
          vec3 displacedPos = position;
          float wave = sin(uv.y * 1.8 - uTime * 1.3 + uv.x * 3.2) * 0.032;
          wave += sin(uv.y * 3.6 - uTime * 2.2 + uv.x * 5.4) * 0.016;
          displacedPos.y += wave * smoothstep(0.02, 0.45, aBankDist);

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

        vec2 hash2(vec2 p) {
          return vec2(
            fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123),
            fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123)
          );
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

        // Voronoi cellular distance for organic anime lace foam
        float voronoiLace(vec2 p) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          float m_dist = 8.0;
          float m_dist2 = 8.0;

          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.4 * sin(uTime * 0.8 + 6.2831 * o);
              vec2 r = g + o - f;
              float d = dot(r, r);

              if (d < m_dist) {
                m_dist2 = m_dist;
                m_dist = d;
              } else if (d < m_dist2) {
                m_dist2 = d;
              }
            }
          }
          return sqrt(m_dist2) - sqrt(m_dist);
        }

        // Helper for natural directional boulder wake & bow cushion with organic lace filigree
        float calcBoulderWake(vec2 worldPos, vec2 bPos, float radius, vec2 flowDir, vec2 wakePerp, float wakeLen, float laceNoise) {
          vec2 toPos = worldPos - bPos;
          float d = length(toPos);

          // Upstream bow spray cushion facing against oncoming flow
          vec2 upstreamDir = -flowDir;
          float bowDot = dot(normalize(toPos + vec2(0.001)), upstreamDir);
          float bow = smoothstep(radius + 1.4, radius - 0.4, d) * smoothstep(-0.15, 0.85, bowDot) * 1.3;
          bow *= (0.80 + 0.40 * laceNoise);

          // Downstream diverging V-shaped wake trailing with current (-X, +Z)
          float wDist = dot(toPos, flowDir);
          float wPerp = abs(dot(toPos, wakePerp));
          float spread = radius * 0.60 + wDist * 0.38;
          
          // Two peeling flank whitewater crests
          float flankOffset = abs(wPerp - (radius * 0.65 + wDist * 0.32));
          float flankFoam = smoothstep(1.3, 0.1, flankOffset) * smoothstep(wakeLen, 0.0, wDist) * step(0.0, wDist);

          // Churning turbulent wake interior with streaming foam filigree
          float wakeTurb = noise(vec2(wPerp * 1.8, wDist * 0.75 - uTime * 2.8)) * 0.65 +
                           noise(vec2(wPerp * 3.6, wDist * 1.5 - uTime * 4.2)) * 0.35;
          float wakeBelly = smoothstep(spread, 0.0, wPerp) * smoothstep(wakeLen, 0.0, wDist) * step(0.0, wDist);
          float bellyFoam = wakeBelly * smoothstep(0.32, 0.68, wakeTurb + laceNoise * 0.45);

          return bow + (flankFoam * 0.90 + bellyFoam * 1.10) * 1.25;
        }

        void main() {
          // 1. Natural Water Depth Gradient (deep oceanic teal -> rich turquoise -> sunlit jade shallows)
          float depthFactor = smoothstep(0.01, 0.95, vBankDist);
          vec3 waterBase = mix(uShallowColor, uMidColor, smoothstep(0.03, 0.38, depthFactor));
          waterBase = mix(waterBase, uDeepColor, smoothstep(0.38, 0.92, depthFactor));

          // 2. Flow coordinate aligned downstream
          float flowSpeed = 0.38;
          float vFlowCoord = vUv.y * 0.18 - uTime * flowSpeed;

          vec2 flowUv = vec2(vUv.x * 5.0, vFlowCoord * 4.0);
          float n1 = noise(flowUv);
          float n2 = noise(flowUv * 2.2 + vec2(0.7, -uTime * 0.25));

          // 3. Fine Organic Cellular Seafoam Lace (Studio Ghibli / Makoto Shinkai style)
          // Delicate high-frequency filigree lace ribbons curling along current flowlines
          vec2 laceUv = vec2(vUv.x * 42.0 + sin(vFlowCoord * 4.5 + n1 * 2.0) * 0.6, vFlowCoord * 32.0);
          float lace = voronoiLace(laceUv + vec2(n2 * 0.35, 0.0));
          float laceFiligree = smoothstep(0.38, 0.65, lace);

          // 4. Whitewater Rapids & Chute Turbulence (Matching Reference.png)
          // Upper gorge sunlit cascade
          float upperChute = smoothstep(4.5, 0.8, vUv.y);

          // Dynamic rapids streaming through the central river channel
          float rapidsZone = smoothstep(0.16, 0.42, vBankDist) * (1.0 - smoothstep(0.72, 0.94, vBankDist));

          vec2 rapidsUv = vec2(vUv.x * 12.0 + n1 * 1.8, vFlowCoord * 18.0);
          float rFbm = noise(rapidsUv) * 0.52 + noise(rapidsUv * 2.2 + vec2(1.1, -uTime * 0.45)) * 0.32 + noise(rapidsUv * 4.2) * 0.16;
          float rSurge = sin(vFlowCoord * 20.0 + rFbm * 4.5);

          float gorgeFoam = smoothstep(0.46, 0.80, rFbm + rSurge * 0.22) * upperChute * 0.95;
          float mainRapids = smoothstep(0.48, 0.82, rFbm + rSurge * 0.20) * rapidsZone * 0.85;

          // Smooth continuous organic foam ribbons and whitewater tendrils
          vec2 streamUv = vec2(vUv.x * 9.0 + n1 * 2.2, vFlowCoord * 10.0);
          float sNoise = noise(streamUv) * 0.58 + noise(streamUv * 2.4 + vec2(1.2, -uTime * 0.3)) * 0.42;
          float streamRibbons = smoothstep(0.48, 0.76, sNoise + sin(vFlowCoord * 12.0 + sNoise * 2.5) * 0.18);
          float streamlineFoam = streamRibbons * rapidsZone * 0.75;

          // Delicate drifting lace tendrils across active flow
          float surfaceLaceFoam = laceFiligree * rapidsZone * 0.40;

          // 5. Shoreline Contact Foam Fringe strictly at land-water boundary
          float shoreFringe = smoothstep(0.06, 0.008, vBankDist) * (0.65 + 0.35 * laceFiligree);

          // 6. Natural Directional Boulder Wakes & Bow Waves (Mid-stream rapids boulders)
          vec2 flowDir = normalize(vec2(-1.0, 1.0)); // Flow direction (-X, +Z)
          vec2 wakePerp = vec2(flowDir.y, -flowDir.x);

          float collarNoise = noise(vWorldPosition.xz * 1.8 + vec2(uTime * 0.6, -uTime * 0.8));

          // Calculate wakes for all prominent boulders in river current
          float b1 = calcBoulderWake(vWorldPosition.xz, uBoulder1, 3.4, flowDir, wakePerp, 18.0, laceFiligree); // Mid-Stream Splitter
          float b2 = calcBoulderWake(vWorldPosition.xz, uBoulder2, 3.6, flowDir, wakePerp, 8.5, laceFiligree);  // Right promontory
          float b3 = calcBoulderWake(vWorldPosition.xz, uBoulder3, 3.0, flowDir, wakePerp, 7.5, laceFiligree);  // Upper ledge
          float b4 = calcBoulderWake(vWorldPosition.xz, uBoulder4, 2.8, flowDir, wakePerp, 6.5, laceFiligree);  // Guardian Monolith shore
          float b5 = calcBoulderWake(vWorldPosition.xz, uBoulder5, 2.4, flowDir, wakePerp, 6.0, laceFiligree);  // Right bank ledge
          float b6 = calcBoulderWake(vWorldPosition.xz, uBoulder6, 2.5, flowDir, wakePerp, 7.5, laceFiligree);  // Left shallows slab
          float b8 = calcBoulderWake(vWorldPosition.xz, uBoulder8, 2.8, flowDir, wakePerp, 7.0, laceFiligree);  // Lower rapids

          float totalBoulderFoam = (b1 + b2 + b3 + b4 * 0.75 + b5 + b6 + b8) * (0.82 + 0.18 * collarNoise);

          // Combined Painterly Foam Mask
          float totalFoam = clamp(
            shoreFringe * 0.55 +
            totalBoulderFoam * 0.95 +
            gorgeFoam * 1.05 +
            mainRapids * 0.90 +
            streamlineFoam * 0.80 +
            surfaceLaceFoam,
            0.0, 1.0
          );

          // 7. Floating Sakura Petals Drifting in the Stream
          vec2 petalGrid = vec2(vUv.x * 28.0, vFlowCoord * 32.0);
          vec2 pCell = floor(petalGrid);
          vec2 pFract = fract(petalGrid) - 0.5;
          float petalHash = hash(pCell);
          float hasPetal = step(0.965, petalHash); // Subtle, delicate petal dusting

          float pRot = petalHash * 6.28 + sin(uTime + petalHash * 10.0) * 0.5;
          float cR = cos(pRot);
          float sR = sin(pRot);
          vec2 rUv = vec2(pFract.x * cR - pFract.y * sR, pFract.x * sR + pFract.y * cR);
          float pDist = length(rUv * vec2(1.2, 2.4));
          float petalMask = smoothstep(0.22, 0.12, pDist) * hasPetal * smoothstep(0.08, 0.30, vBankDist);
          vec3 petalColor = mix(vec3(0.98, 0.78, 0.86), vec3(1.0, 0.94, 0.96), smoothstep(0.0, 0.2, pDist));

          // 8. Sunlight Specular Glints & Caustic Highlights
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 lightDir = normalize(uSunDirection);
          vec3 halfDir = normalize(lightDir + viewDir);

          vec3 waveNormal = normalize(vNormal + vec3(
            (n1 - 0.5) * 0.08,
            0.0,
            (n2 - 0.5) * 0.10
          ));

          float NdotH = max(dot(waveNormal, halfDir), 0.0);
          float softSheen = pow(NdotH, 16.0) * 0.55;
          float crispGlint = smoothstep(0.91, 0.99, pow(NdotH, 36.0)) * 3.2;
          float sunGlintTotal = (softSheen + crispGlint);

          // Radiant golden sun cascade in upper gorge (matching Reference.png)
          vec3 goldenCascade = mix(uMidColor, vec3(1.0, 0.96, 0.86), 0.70);
          waterBase = mix(waterBase, goldenCascade, upperChute * 0.60);

          // 9. Compose Final Natural Watercolor Palette
          vec3 finalColor = waterBase;

          // Blend in creamy painterly foam with natural translucent falloff
          float foamAlpha = clamp(totalFoam * 0.95, 0.0, 0.98);
          finalColor = mix(finalColor, uFoamColor, foamAlpha);

          // Apply warm sunlight sheen & sparkling highlights
          vec3 sunSheen = uSunGlintColor * (sunGlintTotal * (0.35 + totalFoam * 0.50) + upperChute * 0.45);
          finalColor += sunSheen;

          // Blend floating sakura petals on top of water
          finalColor = mix(finalColor, petalColor, petalMask * 0.92);

          // 10. Soft Atmospheric Fog Blend
          float camDist = length(vWorldPosition - cameraPosition);
          float fogFactor = clamp((camDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
          finalColor = mix(finalColor, uFogColor, fogFactor * 0.16);

          // 11. Controlled Depth & Shoreline Transparency Gradient
          // Translucent jade shallows reveal submerged bedMesh; deep center channel retains rich oceanic opacity
          float shoreRamp = smoothstep(0.0, 0.07, vBankDist);
          float channelDepth = smoothstep(0.04, 0.55, vBankDist);
          float alpha = mix(0.40, 0.96, channelDepth) * mix(0.68, 1.0, shoreRamp);
          if (totalFoam > 0.05) {
            alpha = mix(alpha, 0.98, smoothstep(0.05, 0.40, totalFoam));
          }
          if (petalMask > 0.1) {
            alpha = mix(alpha, 1.0, petalMask);
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
