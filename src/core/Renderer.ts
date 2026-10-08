import * as THREE from 'three';

export class Renderer {
  public readonly instance: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.init();
  }

  private init(): void {
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Color management & tone mapping for anime painterly warmth
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.08;

    // Shadow mapping
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  public resize(width: number, height: number): void {
    this.instance.setSize(width, height);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.instance.render(scene, camera);
  }

  public destroy(): void {
    this.instance.dispose();
  }
}
