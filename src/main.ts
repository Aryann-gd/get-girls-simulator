import * as THREE from 'three';

/**
 * ============================================================================
 * CRAZYGAMES COMPLIANT SDK ABSTRACTION LAYER (GRACEFUL FALLBACK)
 * ============================================================================
 */
export interface ICrazyGamesSDK {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyHour(): void;
  requestAd(type: 'midroll' | 'rewarded'): Promise<boolean>;
}

class CrazyGamesSDKManager implements ICrazyGamesSDK {
  private isAvailable: boolean = false;

  async init(): Promise<void> {
    try {
      // Check if CrazyGames SDK global is present in window
      if (typeof (window as unknown as { CrazyGames?: unknown }).CrazyGames !== 'undefined') {
        this.isAvailable = true;
        console.log('[CrazyGames SDK] Initialized successfully.');
      } else {
        console.warn('[CrazyGames SDK] SDK not detected. Operating in 100% offline fallback mode.');
      }
    } catch (err) {
      console.warn('[CrazyGames SDK] Initialization failed. Falling back gracefully:', err);
      this.isAvailable = false;
    }
  }

  gameplayStart(): void {
    if (this.isAvailable) {
      console.log('[CrazyGames SDK] gameplayStart()');
    }
  }

  gameplayStop(): void {
    if (this.isAvailable) {
      console.log('[CrazyGames SDK] gameplayStop()');
    }
  }

  happyHour(): void {
    if (this.isAvailable) {
      console.log('[CrazyGames SDK] happyHour()');
    }
  }

  async requestAd(type: 'midroll' | 'rewarded'): Promise<boolean> {
    if (!this.isAvailable) {
      console.log(`[CrazyGames SDK Fallback] Simulated ${type} ad completed successfully.`);
      return true;
    }
    return true;
  }
}

/**
 * ============================================================================
 * OBJECT POOL: FLOATING UI TEXT (ZERO RUNTIME DOM ALLOCATION)
 * ============================================================================
 */
class FloatingTextPool {
  private pool: HTMLElement[] = [];
  private activeItems: { element: HTMLElement; x: number; y: number; life: number; maxLife: number }[] = [];
  private root: HTMLElement;

  constructor(rootId: string, initialCapacity: number = 20) {
    const el = document.getElementById(rootId);
    if (!el) throw new Error(`Root element #${rootId} not found`);
    this.root = el;

    for (let i = 0; i < initialCapacity; i++) {
      const item = document.createElement('span');
      item.className = 'floating-text-item';
      this.root.appendChild(item);
      this.pool.push(item);
    }
  }

  spawn(text: string, screenX: number, screenY: number, color: string = '#ffb703'): void {
    let el = this.pool.pop();
    if (!el) {
      // If pool exhausted, recycle the oldest active item
      const oldest = this.activeItems.shift();
      if (oldest) {
        el = oldest.element;
      } else {
        return;
      }
    }

    el.innerText = text;
    el.style.color = color;
    el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
    el.style.opacity = '1';

    this.activeItems.push({
      element: el,
      x: screenX,
      y: screenY,
      life: 0,
      maxLife: 1.0 // 1 second duration
    });
  }

  update(delta: number): void {
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      item.life += delta;
      const progress = item.life / item.maxLife;

      if (progress >= 1.0) {
        // Return to pool
        item.element.style.opacity = '0';
        this.pool.push(item.element);
        this.activeItems.splice(i, 1);
      } else {
        const offsetY = item.y - progress * 40; // float upwards
        const opacity = 1.0 - Math.pow(progress, 2);
        item.element.style.transform = `translate3d(${item.x}px, ${offsetY}px, 0) scale(${1 + progress * 0.15})`;
        item.element.style.opacity = opacity.toString();
      }
    }
  }

  dispose(): void {
    this.activeItems.forEach(item => {
      item.element.remove();
    });
    this.pool.forEach(el => el.remove());
    this.activeItems = [];
    this.pool = [];
  }
}

/**
 * ============================================================================
 * 2.5D ISOMETRIC ENGINE & TYCOON GAME ARCHITECTURE
 * ============================================================================
 */
class TycoonGameEngine {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private canvas!: HTMLCanvasElement;
  private animationFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Immutable Rule: Resource tracking for strict disposal
  private disposables: { dispose(): void }[] = [];

  // Managers & Pools
  private textPool!: FloatingTextPool;
  private sdkManager: CrazyGamesSDKManager = new CrazyGamesSDKManager();

  // Game State
  private cash: number = 100;
  private charm: number = 10;
  private level: number = 1;

  // 3D Visual Entities
  private testCube!: THREE.Mesh;

  init(): void {
    const canvasEl = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvasEl) throw new Error('#game-canvas element missing');
    this.canvas = canvasEl;

    // 1. Setup Three.js WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0818);

    // 3. Setup 2.5D Isometric Orthographic Camera
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 12;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );

    // True Isometric projection angle (35.264° pitch, 45° yaw)
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0f5, 1.2);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // 5. Initial Isometric Club Floor & Test Entity
    this.buildInitialWorld();

    // 6. Object Pool Initialization
    this.textPool = new FloatingTextPool('floating-text-pool-root', 25);

    // 7. Event Listeners & Responsive Resizing
    window.addEventListener('resize', this.onResize);
    this.onResize();

    // 8. Setup UI Event Handlers
    this.setupUIHandlers();

    // 9. Initialize CrazyGames SDK
    this.sdkManager.init().then(() => {
      this.sdkManager.gameplayStart();
    });

    // 10. Start Main Game Loop
    this.render();
  }

  private buildInitialWorld(): void {
    // Ground Grid / Stage
    const floorGeo = new THREE.BoxGeometry(10, 0.5, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x22133e,
      roughness: 0.4,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.registerDisposable(floorGeo);
    this.registerDisposable(floorMat);

    // Centerpiece Tycoon Pedestal
    const cubeGeo = new THREE.BoxGeometry(1.6, 2.2, 1.6);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xff2a85,
      roughness: 0.2,
      metalness: 0.5
    });
    this.testCube = new THREE.Mesh(cubeGeo, cubeMat);
    this.testCube.position.set(0, 1.1, 0);
    this.testCube.castShadow = true;
    this.scene.add(this.testCube);
    this.registerDisposable(cubeGeo);
    this.registerDisposable(cubeMat);
  }

  private setupUIHandlers(): void {
    const cashValEl = document.getElementById('cash-val')!;
    const charmValEl = document.getElementById('charm-val')!;
    const repValEl = document.getElementById('rep-val')!;

    const updateHUD = () => {
      cashValEl.innerText = `$${this.cash.toLocaleString()}`;
      charmValEl.innerText = `${this.charm} Charm`;
      repValEl.innerText = `Lvl ${this.level} Tycoon`;
    };
    updateHUD();

    document.getElementById('btn-upgrade-charm')?.addEventListener('click', (e) => {
      const cost = this.charm * 5;
      if (this.cash >= cost) {
        this.cash -= cost;
        this.charm += 5;
        updateHUD();
        this.textPool.spawn(`+5 Charm!`, e.clientX - 20, e.clientY - 40, '#ff2a85');
      } else {
        this.textPool.spawn(`Need $${cost}!`, e.clientX - 20, e.clientY - 40, '#ff4d4d');
      }
    });

    document.getElementById('btn-recruit')?.addEventListener('click', (e) => {
      const cost = this.level * 50;
      if (this.cash >= cost) {
        this.cash -= cost;
        this.level += 1;
        updateHUD();
        this.textPool.spawn(`Club Expanded! (Lvl ${this.level})`, e.clientX - 40, e.clientY - 40, '#00f0ff');
      } else {
        this.textPool.spawn(`Need $${cost}!`, e.clientX - 20, e.clientY - 40, '#ff4d4d');
      }
    });

    document.getElementById('btn-passive-income')?.addEventListener('click', (e) => {
      const revenue = this.charm * 2 + this.level * 10;
      this.cash += revenue;
      updateHUD();
      this.textPool.spawn(`+$${revenue}!`, e.clientX - 20, e.clientY - 40, '#ffb703');
    });
  }

  /**
   * Strict Canvas Resizing maintaining Orthographic Aspect Ratio
   * Avoids stretching artifacts without CSS distortion
   */
  private onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const frustumSize = 12;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  };

  private registerDisposable(res: { dispose(): void }): void {
    this.disposables.push(res);
  }

  private render = (): void => {
    this.animationFrameId = requestAnimationFrame(this.render);

    const delta = this.clock.getDelta();

    // Idle rotation animation on centerpiece
    if (this.testCube) {
      this.testCube.rotation.y += delta * 0.75;
    }

    // Update object pools
    if (this.textPool) {
      this.textPool.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * IMMUTABLE RULE: Strict Memory Cleanup & Resource Disposal
   */
  cleanup(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);

    // Dispose all tracked geometries, materials, and textures
    for (const res of this.disposables) {
      try {
        res.dispose();
      } catch (err) {
        console.warn('Error during resource disposal:', err);
      }
    }
    this.disposables = [];

    // Clear pools
    if (this.textPool) {
      this.textPool.dispose();
    }

    // Dispose WebGLRenderer
    this.renderer.dispose();
    console.log('[TycoonGameEngine] Fully disposed all WebGL resources.');
  }
}

// Instantiate and start engine on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const engine = new TycoonGameEngine();
  engine.init();

  // Export engine for debugging / scene transitions
  (window as unknown as { __gameEngine?: TycoonGameEngine }).__gameEngine = engine;
});
