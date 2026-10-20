import { GameManager } from './systems/GameManager';
import { SceneManager } from './engine/SceneManager';
import { UIManager } from './ui/UIManager';
import { CrazyGamesManager } from './sdk/CrazyGamesManager';

class GameApplication {
  public gameManager: GameManager;
  public sceneManager: SceneManager;
  public uiManager: UIManager;
  public sdk: CrazyGamesManager;

  constructor() {
    console.log('[GameApplication] Initializing Get Girls Simulator engine...');

    // 1. Core Systems & State Orchestrator
    this.gameManager = GameManager.getInstance();

    // 2. CrazyGames Compliant SDK Wrapper
    this.sdk = CrazyGamesManager.getInstance();
    this.sdk.init().then(() => {
      this.sdk.gameplayStart();
    });

    // 3. Three.js 2.5D Isometric Scene Manager
    this.sceneManager = new SceneManager('game-canvas', this.gameManager);

    // 4. Responsive UI Overlay Manager
    this.uiManager = new UIManager(this.gameManager);

    // 5. Lifecycle Management & Cleanup
    window.addEventListener('beforeunload', () => this.cleanup());

    console.log('[GameApplication] Game successfully launched and ready!');
  }

  public cleanup(): void {
    console.log('[GameApplication] Cleaning up all game resources...');
    this.sdk.gameplayStop();
    this.uiManager.dispose();
    this.sceneManager.cleanup();
    this.gameManager.cleanup();
  }
}

// Global bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApplication();

  // Expose global handles for automated testing & CrazyGames portal compliance checks
  (window as unknown as { __gameApp?: GameApplication; __gameManager?: GameManager }).__gameApp = app;
  (window as unknown as { __gameManager?: GameManager }).__gameManager = app.gameManager;
});
