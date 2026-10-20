import * as THREE from 'three';

export class ResizeManager {
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private frustumSize: number;
  private resizeListener: () => void;

  constructor(camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, frustumSize: number = 14) {
    this.camera = camera;
    this.renderer = renderer;
    this.frustumSize = frustumSize;

    this.resizeListener = () => this.handleResize();
    window.addEventListener('resize', this.resizeListener);
    this.handleResize();
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();

    // Critical: false prevents Three.js from setting inline style width/height that stretches canvas
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public dispose(): void {
    window.removeEventListener('resize', this.resizeListener);
  }
}
