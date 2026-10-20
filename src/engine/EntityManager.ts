import * as THREE from 'three';
import { GameManager } from '../systems/GameManager';
import { IGirlConfig, IZonePad } from '../types/game';
import { PlayerController } from './PlayerController';

interface ICashPickup {
  mesh: THREE.Mesh;
  value: number;
  position: THREE.Vector3;
  spawnTime: number;
}

export class EntityManager {
  private scene: THREE.Scene;
  private gameManager: GameManager;
  public playerController: PlayerController;
  private disposables: { dispose(): void }[] = [];

  // Player Entity
  public playerGroup!: THREE.Group;
  public playerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private walkCycleTime: number = 0;

  // Stations & Zones
  public gymStation!: THREE.Group;
  public shopStation!: THREE.Group;
  public vipBarStation!: THREE.Group;
  public girlEntities: Map<string, THREE.Group> = new Map();

  // Interactive Zone Pads on the floor (Travel Center Tycoon Style)
  public zonePads: Map<string, { pad: IZonePad; mesh: THREE.Group; progressMesh: THREE.Mesh }> = new Map();
  private workoutTimer: number = 0;
  private padPurchaseTimer: number = 0;

  // Floor Cash Pickups
  private cashPickups: ICashPickup[] = [];
  private cashPool: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, gameManager: GameManager) {
    this.scene = scene;
    this.gameManager = gameManager;
    this.playerController = new PlayerController();

    this.buildWorld();
    this.initCashPool(40);
  }

  private registerDisposable(res: { dispose(): void }): void {
    this.disposables.push(res);
  }

  private buildWorld(): void {
    // 1. Stylized Isometric Dance Floor & Club Stage
    const floorGeo = new THREE.CylinderGeometry(8.5, 9.0, 0.6, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x161124,
      roughness: 0.35,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.3;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.registerDisposable(floorGeo);
    this.registerDisposable(floorMat);

    // Glowing Neon Stage Rim
    const ringGeo = new THREE.TorusGeometry(8.7, 0.12, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
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

    // 2. Player Character
    this.playerGroup = this.createPlayerEntity();
    this.playerGroup.position.copy(this.playerPosition);
    this.scene.add(this.playerGroup);

    // 3. Build Stations
    this.gymStation = this.createGymStation();
    this.gymStation.position.set(-3.5, 0, -1.5);
    this.gymStation.rotation.y = Math.PI / 4;
    this.scene.add(this.gymStation);

    this.shopStation = this.createShopStation();
    this.shopStation.position.set(3.5, 0, -1.5);
    this.shopStation.rotation.y = -Math.PI / 4;
    this.scene.add(this.shopStation);

    this.vipBarStation = this.createVIPBarStation();
    this.vipBarStation.position.set(0, 0, -4.5);
    this.scene.add(this.vipBarStation);

    // 4. Build Floor Zone Pads (Travel Center Tycoon Style)
    this.initZonePads();

    // 5. Initial Girls Check
    this.syncGirlEntities();
  }

  private initZonePads(): void {
    const padsConfig: IZonePad[] = [
      {
        id: 'pad_workout',
        name: 'Workout Zone',
        type: 'workout',
        position: [-3.5, 0.02, -0.2],
        radius: 1.2,
        cost: 0,
        currentPaid: 0,
        unlocked: true,
        color: 0xffb703, // Amber Gold
        label: '🏋️ STAND TO WORKOUT',
      },
      {
        id: 'pad_wardrobe',
        name: 'Designer Boutique',
        type: 'upgrade',
        position: [3.5, 0.02, -0.2],
        radius: 1.2,
        cost: 0,
        currentPaid: 0,
        unlocked: true,
        color: 0x00f0ff, // Cyan
        label: '👔 BOUTIQUE SHOP',
      },
      {
        id: 'pad_vip_bar',
        name: 'VIP Drink Bar',
        type: 'upgrade',
        position: [0, 0.02, -3.2],
        radius: 1.3,
        cost: 50,
        currentPaid: 0,
        unlocked: this.gameManager.state.unlockedZones.includes('zone_vip_bar'),
        color: 0x9b5de5, // Purple
        label: '$50 VIP BAR',
        targetUpgradeId: 'designer_shirt',
      },
    ];

    for (const pad of padsConfig) {
      const padGroup = new THREE.Group();
      padGroup.position.set(...pad.position);

      // Outer Ring
      const ringGeo = new THREE.RingGeometry(pad.radius * 0.85, pad.radius, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pad.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      padGroup.add(ringMesh);
      this.registerDisposable(ringGeo);
      this.registerDisposable(ringMat);

      // Inner Fill Disc
      const discGeo = new THREE.CircleGeometry(pad.radius * 0.82, 32);
      const discMat = new THREE.MeshBasicMaterial({
        color: pad.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.rotation.x = -Math.PI / 2;
      padGroup.add(discMesh);
      this.registerDisposable(discGeo);
      this.registerDisposable(discMat);

      // Progress Arc / Indicator
      const progressGeo = new THREE.RingGeometry(pad.radius * 0.75, pad.radius * 0.84, 32, 1, 0, 0);
      const progressMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      const progressMesh = new THREE.Mesh(progressGeo, progressMat);
      progressMesh.rotation.x = -Math.PI / 2;
      padGroup.add(progressMesh);
      this.registerDisposable(progressGeo);
      this.registerDisposable(progressMat);

      this.scene.add(padGroup);
      this.zonePads.set(pad.id, { pad, mesh: padGroup, progressMesh });
    }
  }

  private createPlayerEntity(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.7, 16, 20);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x12613d, roughness: 0.35, metalness: 0.2 });
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

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 24, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.45 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);
    this.registerDisposable(headGeo);
    this.registerDisposable(skinMat);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.32, 24, 20);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.4 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.82, -0.02);
    hair.scale.set(1.0, 0.85, 1.05);
    group.add(hair);
    this.registerDisposable(hairGeo);
    this.registerDisposable(hairMat);

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

    // Frame
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

    // Barbell
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

    return group;
  }

  private createShopStation(): THREE.Group {
    const group = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(1.6, 0.15, 0.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.08, 0);
    group.add(base);
    this.registerDisposable(baseGeo);
    this.registerDisposable(baseMat);

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

  private createVIPBarStation(): THREE.Group {
    const group = new THREE.Group();

    // Bar Counter
    const counterGeo = new THREE.BoxGeometry(3.0, 1.1, 0.8);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x22133e, roughness: 0.3, metalness: 0.4 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.55, 0);
    counter.castShadow = true;
    group.add(counter);
    this.registerDisposable(counterGeo);
    this.registerDisposable(counterMat);

    // Glowing Bar Top
    const topGeo = new THREE.BoxGeometry(3.2, 0.08, 0.9);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x9b5de5, emissive: 0x4a148c, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.14, 0);
    group.add(top);
    this.registerDisposable(topGeo);
    this.registerDisposable(topMat);

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
      }
    }
  }

  private createGirlEntity(config: IGirlConfig): THREE.Group {
    const group = new THREE.Group();

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

    const headGeo = new THREE.SphereGeometry(0.26, 24, 20);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.45 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);
    this.registerDisposable(headGeo);
    this.registerDisposable(skinMat);

    const hairGeo = new THREE.SphereGeometry(0.28, 20, 18);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.4 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.65, -0.05);
    group.add(hair);
    this.registerDisposable(hairGeo);
    this.registerDisposable(hairMat);

    // Floating Love Heart
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

  private initCashPool(size: number): void {
    const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x664400,
    });
    this.registerDisposable(coinGeo);
    this.registerDisposable(coinMat);

    for (let i = 0; i < size; i++) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.visible = false;
      this.scene.add(coin);
      this.cashPool.push(coin);
    }
  }

  public dropCashOnFloor(origin: THREE.Vector3, value: number = 1): void {
    const coin = this.cashPool.pop();
    if (!coin) return;

    const offset = new THREE.Vector3((Math.random() - 0.5) * 1.0, 0.05, (Math.random() - 0.5) * 1.0);
    const pos = origin.clone().add(offset);
    pos.y = 0.05;

    coin.position.copy(pos);
    coin.visible = true;
    this.cashPickups.push({
      mesh: coin,
      value,
      position: pos,
      spawnTime: performance.now(),
    });
  }

  public update(delta: number, elapsed: number): void {
    // 1. Update Player Movement (Keyboard or Virtual Touch Joystick)
    const moveInput = this.playerController.update();

    if (moveInput.lengthSq() > 0) {
      // Map 2D isometric camera angle (45-degree rotation)
      const cos45 = 0.7071;
      const sin45 = 0.7071;
      const worldDx = (moveInput.x * cos45 + moveInput.y * sin45) * this.playerController.speed * delta;
      const worldDz = (-moveInput.x * sin45 + moveInput.y * cos45) * this.playerController.speed * delta;

      this.playerPosition.x += worldDx;
      this.playerPosition.z += worldDz;

      // Clamp player within the dance floor radius (7.5 units)
      const distFromCenter = Math.sqrt(this.playerPosition.x * this.playerPosition.x + this.playerPosition.z * this.playerPosition.z);
      if (distFromCenter > 7.5) {
        this.playerPosition.normalize().multiplyScalar(7.5);
      }

      this.playerGroup.position.x = this.playerPosition.x;
      this.playerGroup.position.z = this.playerPosition.z;

      // Face direction of movement
      const angle = Math.atan2(worldDx, worldDz);
      this.playerGroup.rotation.y = angle;

      // Procedural walking bounce
      this.walkCycleTime += delta * 12.0;
      this.playerGroup.position.y = Math.abs(Math.sin(this.walkCycleTime)) * 0.12;
    } else {
      // Idle breathing
      this.playerGroup.position.y = Math.sin(elapsed * 2.5) * 0.03;
    }

    // 2. Zone Pads Interaction (Walking onto pads like Travel Center Tycoon)
    this.updateZoneInteractions(delta);

    // 3. Cash Pickups Suction & Collection
    this.updateCashPickups(delta);

    // 4. Girls Idle & Proximity Hearts
    this.updateGirls(delta, elapsed);
  }

  private updateZoneInteractions(delta: number): void {
    for (const [id, item] of this.zonePads) {
      const padPos = item.mesh.position;
      const dist = this.playerPosition.distanceTo(padPos);

      // Pulsing pad ring animation
      item.mesh.children[0].scale.setScalar(1.0 + Math.sin(performance.now() * 0.005) * 0.04);

      if (dist < item.pad.radius) {
        // Player is inside the pad!
        if (id === 'pad_workout') {
          this.workoutTimer += delta;
          if (this.workoutTimer >= 0.75) {
            this.workoutTimer = 0;
            const res = this.gameManager.workout();
            if (res.success) {
              this.dropCashOnFloor(this.gymStation.position, res.earnedCash);
              window.dispatchEvent(
                new CustomEvent('spawn_floating_text', {
                  detail: { text: `+$${res.earnedCash}`, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#ffb703' },
                })
              );
            }
          }
        } else if (id === 'pad_wardrobe') {
          // Open shop modal automatically when standing on wardrobe pad
          this.padPurchaseTimer += delta;
          if (this.padPurchaseTimer >= 0.6) {
            this.padPurchaseTimer = -2.0; // Cooldown before reopening
            window.dispatchEvent(new CustomEvent('open_shop_modal'));
          }
        } else if (id === 'pad_vip_bar') {
          // Continuous money draining into pad until built!
          if (!item.pad.unlocked && this.gameManager.state.cash > 0) {
            this.padPurchaseTimer += delta;
            if (this.padPurchaseTimer >= 0.12) {
              this.padPurchaseTimer = 0;
              const spend = Math.min(2, this.gameManager.state.cash);
              this.gameManager.state.cash -= spend;
              item.pad.currentPaid += spend;

              // Check if completed
              if (item.pad.currentPaid >= item.pad.cost) {
                item.pad.unlocked = true;
                this.gameManager.state.unlockedZones.push('zone_vip_bar');
                this.gameManager.state.looks += 5;
                this.gameManager.state.rizz += 5;
                window.dispatchEvent(
                  new CustomEvent('spawn_floating_text', {
                    detail: { text: '🎉 VIP Bar Unlocked! (+5 Looks, +5 Rizz)', x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, color: '#00f0ff' },
                  })
                );
              }
            }
          }
        }
      }
    }
  }

  private updateCashPickups(delta: number): void {
    const pickupRadius = 1.6;
    for (let i = this.cashPickups.length - 1; i >= 0; i--) {
      const item = this.cashPickups[i];
      const dist = this.playerPosition.distanceTo(item.position);

      item.mesh.rotation.y += delta * 4.0;

      if (dist < pickupRadius) {
        // Suction towards player
        item.mesh.position.lerp(this.playerGroup.position, delta * 12.0);

        if (dist < 0.4) {
          // Collected!
          item.mesh.visible = false;
          this.cashPool.push(item.mesh);
          this.cashPickups.splice(i, 1);

          this.gameManager.state.cash += item.value;
          window.dispatchEvent(
            new CustomEvent('spawn_floating_text', {
              detail: { text: `+$${item.value}`, x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#ffb703' },
            })
          );
        }
      }
    }
  }

  private updateGirls(delta: number, elapsed: number): void {
    for (const [girlId, girlGroup] of this.girlEntities) {
      girlGroup.rotation.y += delta * 0.3;
      const heart = girlGroup.children[3];
      if (heart) {
        heart.rotation.y += delta * 2.0;
        heart.position.y = 2.1 + Math.sin(elapsed * 4.0) * 0.08;
      }

      // Check proximity for auto-flirt / affection
      const dist = this.playerPosition.distanceTo(girlGroup.position);
      if (dist < 1.8) {
        if (Math.random() < 0.02) {
          const flirt = this.gameManager.flirtWithGirl(girlId);
          this.dropCashOnFloor(girlGroup.position, flirt.affectionReward);
          window.dispatchEvent(
            new CustomEvent('spawn_floating_text', {
              detail: { text: `❤️ ${flirt.dialogue}`, x: window.innerWidth / 2, y: window.innerHeight / 3, color: '#ff2a85' },
            })
          );
        }
      }
    }
  }

  public dispose(): void {
    this.zonePads.clear();
    this.girlEntities.clear();
    this.cashPickups = [];

    for (const res of this.disposables) {
      try {
        res.dispose();
      } catch (err) {
        console.warn('Error disposing resource:', err);
      }
    }
    this.disposables = [];
  }
}
