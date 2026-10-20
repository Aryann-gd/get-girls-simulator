import * as THREE from 'three';
import { ResizeManager } from './ResizeManager';
import { InputManager } from './InputManager';
import { EntityManager } from './EntityManager';
import { GameManager } from '../systems/GameManager';

export class SceneManager {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private canvas!: HTMLCanvasElement;

  private resizeManager!: ResizeManager;
  private inputManager!: InputManager;
  public entityManager!: EntityManager;

  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number = 0;
  private gameManager: GameManager;

  constructor(canvasId: string, gameManager: GameManager) {
    this.gameManager = gameManager;

    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = el;

    this.init();
  }

  private init(): void {
    // 1. WebGL Renderer with High-Performance & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene with Moody Club / Tycoon Gradient Hue
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e091b);

    // 3. True 2.5D Isometric Orthographic Camera
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 14;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );

    // Isometric coordinates
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // 4. Lighting: Ambient + Directional Sun + Rim
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(15, 25, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.5);
    rimLight.position.set(-15, 10, -15);
    this.scene.add(rimLight);

    // 5. Managers
    this.resizeManager = new ResizeManager(this.camera, this.renderer, frustumSize);
    this.inputManager = new InputManager(this.camera, this.canvas);
    this.entityManager = new EntityManager(this.scene, this.gameManager);

    // 6. Listen to Girl Attraction event to spawn new 3D entities
    this.gameManager.on('girl_attracted', () => {
      this.entityManager.syncGirlEntities();
    });

    // 7. Start Render Loop
    this.render();
  }

  private render = (): void => {
    this.animationFrameId = requestAnimationFrame(this.render);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.entityManager.update(delta, elapsed);

    // Smooth camera tracking player in isometric space
    const targetCamX = this.entityManager.playerPosition.x + 20;
    const targetCamZ = this.entityManager.playerPosition.z + 20;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(this.entityManager.playerPosition.x, 0, this.entityManager.playerPosition.z);

    this.renderer.render(this.scene, this.camera);
  };

  public cleanup(): void {
    cancelAnimationFrame(this.animationFrameId);

    this.resizeManager.dispose();
    this.inputManager.dispose();
    this.entityManager.dispose();

    this.renderer.dispose();
    console.log('[SceneManager] Three.js WebGL resources fully disposed.');
  }
}
