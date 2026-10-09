import * as THREE from 'three';

export class AppScene {
  public readonly instance: THREE.Scene;
  private skyMesh!: THREE.Mesh;

  constructor() {
    this.instance = new THREE.Scene();

    // Atmospheric aerial perspective fog:
    // Soft anime blue-gray fog that preserves saturated hero foreground while softly fading distant peaks
    const fogColor = new THREE.Color(0xb8cdd4);
    this.instance.fog = new THREE.Fog(fogColor, 90, 255);

    // Build painterly anime sky dome
    this.createAnimeSkyDome();
  }

  private createAnimeSkyDome(): void {
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();

    const skyGeo = new THREE.SphereGeometry(450, 32, 24);

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunDir: { value: sunDir },
        uZenithColor: { value: new THREE.Color(0x5a8da3) },   // Serene anime zenith blue
        uMidSkyColor: { value: new THREE.Color(0x8cb6c6) },   // Soft pale cerulean
        uHorizonColor: { value: new THREE.Color(0xdce7dd) },  // Soft warm horizon haze
        uSunGlowColor: { value: new THREE.Color(0xffeed6) },  // Golden late-afternoon solar glow
        uCloudSunColor: { value: new THREE.Color(0xfffdf7) }, // Luminous warm cloud highlight
        uCloudShadeColor: { value: new THREE.Color(0xb6c1cb) }, // Soft lavender-gray cloud shadow
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDir;
        uniform vec3 uZenithColor;
        uniform vec3 uMidSkyColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunGlowColor;
        uniform vec3 uCloudSunColor;
        uniform vec3 uCloudShadeColor;

        varying vec3 vWorldPosition;

        float hash2(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), f.x),
            mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec3 dir = normalize(vWorldPosition - vec3(0.0, 10.0, 0.0));
          float height = clamp(dir.y, 0.0, 1.0);

          // 1. Soft vertical atmospheric gradient
          vec3 sky = mix(uHorizonColor, uMidSkyColor, smoothstep(0.02, 0.40, height));
          sky = mix(sky, uZenithColor, smoothstep(0.35, 0.90, height));

          // 2. Subtle afternoon sunlight wash emanating from sun azimuth
          float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
          float sunHaze = pow(sunDot, 3.2) * 0.42 * smoothstep(0.0, 0.7, height);
          float sunCore = pow(sunDot, 28.0) * 0.65;
          sky = mix(sky, uSunGlowColor, clamp(sunHaze + sunCore, 0.0, 1.0));

          // 3. Large soft anime cloud masses in mid-sky
          // Low-frequency billowing cloud field
          vec2 cloudUv = vec2(atan(dir.z, dir.x) * 1.8, dir.y * 3.5);
          float n1 = noise2(cloudUv * 1.5 + vec2(0.3, 0.1));
          float n2 = noise2(cloudUv * 3.2 - vec2(0.4, 0.2));
          float cloudDensity = n1 * 0.65 + n2 * 0.35;

          // Band clouds between horizon and 45 degrees elevation
          float cloudBand = smoothstep(0.08, 0.22, height) * smoothstep(0.55, 0.28, height);
          float cloudMask = smoothstep(0.48, 0.72, cloudDensity) * cloudBand * 0.75;

          // Cloud shading: tops catch golden sun, bases reflect cool sky
          vec3 cloudCol = mix(uCloudShadeColor, uCloudSunColor, smoothstep(0.12, 0.38, height + (sunDot * 0.15)));
          sky = mix(sky, cloudCol, cloudMask);

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.name = 'AnimeSkyDome';
    this.skyMesh.renderOrder = -1000;
    this.instance.add(this.skyMesh);
  }
}
