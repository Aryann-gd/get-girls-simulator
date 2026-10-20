import * as THREE from 'three';

export interface IInteractableEntity {
  object: THREE.Object3D;
  id: string;
  name: string;
  type: 'workout' | 'shop' | 'girl' | 'coin';
  onClick: (screenX: number, screenY: number) => void;
}

export class InputManager {
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;
  private interactables: Map<THREE.Object3D, IInteractableEntity> = new Map();

  private onPointerDownHandler: (e: PointerEvent) => void;

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;

    this.onPointerDownHandler = (e: PointerEvent) => this.onPointerDown(e);
    this.canvas.addEventListener('pointerdown', this.onPointerDownHandler);
  }

  public registerInteractable(entity: IInteractableEntity): void {
    this.interactables.set(entity.object, entity);
  }

  public unregisterInteractable(object: THREE.Object3D): void {
    this.interactables.delete(object);
  }

  private onPointerDown(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const candidates = Array.from(this.interactables.keys());
    const intersects = this.raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
      // Find highest parent in candidates map
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !this.interactables.has(hitObj)) {
        hitObj = hitObj.parent;
      }

      if (hitObj && this.interactables.has(hitObj)) {
        const entity = this.interactables.get(hitObj)!;
        entity.onClick(event.clientX, event.clientY);
      }
    }
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDownHandler);
    this.interactables.clear();
  }
}
