import * as THREE from 'three';
import { InputManager } from './InputManager';
import { GameManager } from '../systems/GameManager';
import { IGirlConfig } from '../types/game';

export class EntityManager {
  private scene: THREE.Scene;
  private inputManager: InputManager;
  private gameManager: GameManager;
  private disposables: { dispose(): void }[] = [];

  // Visual Entities
  public playerMesh!: THREE.Group;
  public gymStation!: THREE.Group;
  public shopStation!: THREE.Group;
  public girlEntities: Map<string, THREE.Group> = new Map();

  // 3D Coin Object Pool (Pre-allocated, Zero runtime allocation!)
  private coinPool: THREE.Mesh[] = [];
  private activeCoins: { mesh: THREE.Mesh; life: number; velocity: THREE.Vector3 }[] = [];

  constructor(scene: THREE.Scene, inputManager: InputManager, gameManager: GameManager) {
    this.scene = scene;
    this.inputManager = inputManager;
    this.gameManager = gameManager;

    this.buildWorld();
    this.initCoinPool(25);
  }

  private registerDisposable(res: { dispose(): void }): void {
    this.disposables.push(res);
  }

  private buildWorld(): void {
    // 1. Stylized Isometric Tycoon Stage / Dance Floor
    const floorGeo = new THREE.CylinderGeometry(8, 8.5, 0.6, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1528,
      roughness: 0.3,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.3;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.registerDisposable(floorGeo);
    this.registerDisposable(floorMat);

    // Stage Trim Ring
    const ringGeo = new THREE.TorusGeometry(8.2, 0.12, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff007f, // Neon magenta rim
      emissive: 0xaa0055,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);
    this.registerDisposable(ringGeo);
    this.registerDisposable(ringMat);

    // 2. Central Player Character
    this.playerMesh = this.createPlayerEntity();
    this.playerMesh.position.set(0, 0, 0);
    this.scene.add(this.playerMesh);

    // 3. Gym Bench Station (Workout Click Target)
    this.gymStation = this.createGymStation();
    this.gymStation.position.set(-3.2, 0, -1.0);
    this.gymStation.rotation.y = Math.PI / 4;
    this.scene.add(this.gymStation);
    this.inputManager.registerInteractable({
      object: this.gymStation,
      id: 'gym_bench',
      name: 'Gym Bench',
      type: 'workout',
      onClick: (screenX, screenY) => {
        const res = this.gameManager.workout();
        if (res.success) {
          this.spawnCoin(this.gymStation.position);
          window.dispatchEvent(
            new CustomEvent('spawn_floating_text', {
              detail: { text: `+$${res.earnedCash}`, x: screenX, y: screenY, color: '#ffb703' },
            })
          );
          if (res.earnedLooks > 0) {
            window.dispatchEvent(
              new CustomEvent('spawn_floating_text', {
                detail: { text: `+${res.earnedLooks} Looks! 💪`, x: screenX, y: screenY - 25, color: '#00f0ff' },
              })
            );
          }
        } else {
          window.dispatchEvent(
            new CustomEvent('spawn_floating_text', {
              detail: { text: 'Low Energy! ⚡', x: screenX, y: screenY, color: '#ff4d4d' },
            })
          );
        }
      },
    });

    // 4. Wardrobe & Clothing Rack Station (Shop Click Target)
    this.shopStation = this.createShopStation();
    this.shopStation.position.set(3.2, 0, -1.0);
    this.shopStation.rotation.y = -Math.PI / 4;
    this.scene.add(this.shopStation);
    this.inputManager.registerInteractable({
      object: this.shopStation,
      id: 'wardrobe_shop',
      name: 'Designer Boutique',
      type: 'shop',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('open_shop_modal'));
      },
    });

    // 5. Initial Girl NPCs Check
    this.syncGirlEntities();
  }

  private createPlayerEntity(): THREE.Group {
    const group = new THREE.Group();

    // Body Capsule (Stylized Tycoon Suit)
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.7, 16, 24);
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x12613d, // Tycoon Green Suit
      roughness: 0.35,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);
    this.registerDisposable(bodyGeo);
    this.registerDisposable(suitMat);

    // Inner White Shirt
    const shirtGeo = new THREE.BoxGeometry(0.24, 0.5, 0.15);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.3 });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 1.1, 0.25);
    group.add(shirt);
    this.registerDisposable(shirtGeo);
    this.registerDisposable(shirtMat);

    // Stylized Head
    const headGeo = new THREE.SphereGeometry(0.3, 24, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.45 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);
    this.registerDisposable(headGeo);
    this.registerDisposable(skinMat);

    // Stylized Hair
    const hairGeo = new THREE.SphereGeometry(0.32, 24, 20);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.4 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.82, -0.02);
    hair.scale.set(1.0, 0.85, 1.05);
    group.add(hair);
    this.registerDisposable(hairGeo);
    this.registerDisposable(hairMat);

    // Pedestal Base
    const pedGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.3, 24);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x2d1f4d, roughness: 0.3, metalness: 0.5 });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 0.15;
    pedestal.receiveShadow = true;
    group.add(pedestal);
    this.registerDisposable(pedGeo);
    this.registerDisposable(pedMat);

    return group;
  }

  private createGymStation(): THREE.Group {
    const group = new THREE.Group();

    // Bench Cushion
    const benchGeo = new THREE.BoxGeometry(1.6, 0.2, 0.6);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x9d0208, roughness: 0.3 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.5, 0);
    bench.castShadow = true;
    group.add(bench);
    this.registerDisposable(benchGeo);
    this.registerDisposable(benchMat);

    // Metal Frame
    const frameGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    for (const x of [-0.6, 0.6]) {
      for (const z of [-0.2, 0.2]) {
        const leg = new THREE.Mesh(frameGeo, metalMat);
        leg.position.set(x, 0.25, z);
        leg.castShadow = true;
        group.add(leg);
      }
    }
    this.registerDisposable(frameGeo);
    this.registerDisposable(metalMat);

    // Barbell & Weights
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 12);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.9, 0);
    group.add(bar);
    this.registerDisposable(barGeo);

    const plateGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    for (const x of [-0.75, 0.75]) {
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(x, 0.9, 0);
      plate.castShadow = true;
      group.add(plate);
    }
    this.registerDisposable(plateGeo);
    this.registerDisposable(plateMat);

    // Floating Icon indicator
    const iconGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const iconMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      emissive: 0xff9900,
      roughness: 0.2,
      metalness: 0.5,
    });
    const icon = new THREE.Mesh(iconGeo, iconMat);
    icon.position.set(0, 1.6, 0);
    group.add(icon);
    this.registerDisposable(iconGeo);
    this.registerDisposable(iconMat);

    return group;
  }

  private createShopStation(): THREE.Group {
    const group = new THREE.Group();

    // Wooden Base
    const baseGeo = new THREE.BoxGeometry(1.6, 0.15, 0.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.08, 0);
    group.add(base);
    this.registerDisposable(baseGeo);
    this.registerDisposable(baseMat);

    // Gold Metal Rack
    const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.6, 12);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    for (const x of [-0.65, 0.65]) {
      const post = new THREE.Mesh(postGeo, goldMat);
      post.position.set(x, 0.85, 0);
      group.add(post);
    }
    this.registerDisposable(postGeo);
    this.registerDisposable(goldMat);

    const topBarGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.4, 12);
    const topBar = new THREE.Mesh(topBarGeo, goldMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 1.6, 0);
    group.add(topBar);
    this.registerDisposable(topBarGeo);

    // Hanging Colorful Clothes
    const colors = [0xff2a85, 0x00f0ff, 0x9b5de5];
    const clothGeo = new THREE.BoxGeometry(0.3, 0.65, 0.15);
    colors.forEach((col, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 });
      const cloth = new THREE.Mesh(clothGeo, mat);
      cloth.position.set(-0.35 + i * 0.35, 1.1, 0);
      cloth.castShadow = true;
      group.add(cloth);
      this.registerDisposable(mat);
    });
    this.registerDisposable(clothGeo);

    return group;
  }

  public syncGirlEntities(): void {
    const allGirls = this.gameManager.attraction.getAllGirls();
    for (const girl of allGirls) {
      if (girl.unlocked && !this.girlEntities.has(girl.id)) {
        const entity = this.createGirlEntity(girl);
        entity.position.set(...girl.position);
        this.scene.add(entity);
        this.girlEntities.set(girl.id, entity);

        // Register interaction
        this.inputManager.registerInteractable({
          object: entity,
          id: girl.id,
          name: girl.name,
          type: 'girl',
          onClick: (screenX, screenY) => {
            const flirt = this.gameManager.flirtWithGirl(girl.id);
            this.spawnCoin(entity.position);
            window.dispatchEvent(
              new CustomEvent('spawn_floating_text', {
                detail: {
                  text: `${girl.name}: "${flirt.dialogue}"`,
                  x: screenX,
                  y: screenY - 30,
                  color: girl.avatarColor,
                },
              })
            );
            if (flirt.affectionReward > 0) {
              window.dispatchEvent(
                new CustomEvent('spawn_floating_text', {
                  detail: { text: `+${flirt.affectionReward} Affection Cash! ❤️`, x: screenX, y: screenY, color: '#ff2a85' },
                })
              );
            }
          },
        });
      }
    }
  }

  private createGirlEntity(config: IGirlConfig): THREE.Group {
    const group = new THREE.Group();

    // Stylized Dress / Body
    const bodyGeo = new THREE.CapsuleGeometry(0.28, 0.6, 16, 20);
    const dressMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.avatarColor),
      roughness: 0.3,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, dressMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);
    this.registerDisposable(bodyGeo);
    this.registerDisposable(dressMat);

    // Head
    const headGeo = new THREE.SphereGeometry(0.26, 24, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.45 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);
    this.registerDisposable(headGeo);
    this.registerDisposable(skinMat);

    // Hair Ponytail / Bob
    const hairGeo = new THREE.SphereGeometry(0.28, 20, 18);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.4 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.65, -0.05);
    group.add(hair);
    this.registerDisposable(hairGeo);
    this.registerDisposable(hairMat);

    // Floating Love Heart indicator
    const heartGeo = new THREE.OctahedronGeometry(0.2, 0);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xdd0033,
      roughness: 0.1,
      metalness: 0.8,
    });
    const heart = new THREE.Mesh(heartGeo, heartMat);
    heart.position.set(0, 2.1, 0);
    heart.rotation.z = Math.PI / 4;
    group.add(heart);
    this.registerDisposable(heartGeo);
    this.registerDisposable(heartMat);

    return group;
  }

  private initCoinPool(size: number): void {
    const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x997700,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.registerDisposable(coinGeo);
    this.registerDisposable(coinMat);

    for (let i = 0; i < size; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.visible = false;
      this.scene.add(coin);
      this.coinPool.push(coin);
    }
  }

  public spawnCoin(origin: THREE.Vector3): void {
    const coin = this.coinPool.pop();
    if (!coin) return;

    coin.position.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, (Math.random() - 0.5) * 0.4));
    coin.visible = true;
    this.activeCoins.push({
      mesh: coin,
      life: 0,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 3.0 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5),
    });
  }

  public update(delta: number, elapsed: number): void {
    // 1. Idle Bobbing on Player
    if (this.playerMesh) {
      this.playerMesh.position.y = Math.sin(elapsed * 2.5) * 0.04;
    }

    // 2. Idle Sway on Girls
    for (const [_, girlGroup] of this.girlEntities) {
      girlGroup.rotation.y += delta * 0.5;
      const heart = girlGroup.children[3];
      if (heart) {
        heart.rotation.y += delta * 2.0;
        heart.position.y = 2.1 + Math.sin(elapsed * 4.0) * 0.08;
      }
    }

    // 3. Update 3D Coin Pool Particles
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const item = this.activeCoins[i];
      item.life += delta;
      item.velocity.y -= 9.8 * delta; // Gravity
      item.mesh.position.addScaledVector(item.velocity, delta);
      item.mesh.rotation.y += delta * 10.0;
      item.mesh.rotation.x += delta * 5.0;

      if (item.life > 0.8 || item.mesh.position.y < 0) {
        item.mesh.visible = false;
        this.coinPool.push(item.mesh);
        this.activeCoins.splice(i, 1);
      }
    }
  }

  public dispose(): void {
    // Clean all registered interactables
    this.inputManager.unregisterInteractable(this.gymStation);
    this.inputManager.unregisterInteractable(this.shopStation);
    for (const entity of this.girlEntities.values()) {
      this.inputManager.unregisterInteractable(entity);
    }
    this.girlEntities.clear();

    // Dispose all tracked geometries and materials
    for (const res of this.disposables) {
      try {
        res.dispose();
      } catch (err) {
        console.warn('Error disposing 3D resource:', err);
      }
    }
    this.disposables = [];
  }
}
