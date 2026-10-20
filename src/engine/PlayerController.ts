import * as THREE from 'three';

export class PlayerController {
  public moveVector: THREE.Vector2 = new THREE.Vector2(); // x, y (representing world x, z)
  public speed: number = 5.0; // units per second
  private keysPressed: Set<string> = new Set();

  // Virtual touch joystick state
  private isPointerDown: boolean = false;
  private pointerOrigin: THREE.Vector2 = new THREE.Vector2();
  private pointerCurrent: THREE.Vector2 = new THREE.Vector2();
  private joystickRoot: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;

  constructor() {
    this.setupKeyboard();
    this.setupTouchJoystick();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });
  }

  private setupTouchJoystick(): void {
    this.joystickRoot = document.getElementById('virtual-joystick');
    this.joystickKnob = document.getElementById('joystick-knob');

    window.addEventListener('pointerdown', (e) => {
      // Don't trigger joystick if clicking UI modal or buttons
      const target = e.target as HTMLElement;
      if (target.closest('#ui-overlay button, #shop-modal, #stats-bar, #top-bar')) {
        return;
      }

      this.isPointerDown = true;
      this.pointerOrigin.set(e.clientX, e.clientY);
      this.pointerCurrent.set(e.clientX, e.clientY);

      if (this.joystickRoot && this.joystickKnob) {
        this.joystickRoot.style.left = `${e.clientX}px`;
        this.joystickRoot.style.top = `${e.clientY}px`;
        this.joystickRoot.style.display = 'block';
        this.joystickKnob.style.transform = `translate(-50%, -50%)`;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;

      this.pointerCurrent.set(e.clientX, e.clientY);
      const delta = this.pointerCurrent.clone().sub(this.pointerOrigin);
      const maxRadius = 50;
      const distance = delta.length();

      if (distance > maxRadius) {
        delta.normalize().multiplyScalar(maxRadius);
      }

      if (this.joystickKnob) {
        this.joystickKnob.style.transform = `translate(calc(-50% + ${delta.x}px), calc(-50% + ${delta.y}px))`;
      }
    });

    const endPointer = () => {
      this.isPointerDown = false;
      if (this.joystickRoot) {
        this.joystickRoot.style.display = 'none';
      }
    };

    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }

  public update(): THREE.Vector2 {
    this.moveVector.set(0, 0);

    // 1. Keyboard Input
    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      this.moveVector.y -= 1;
    }
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      this.moveVector.y += 1;
    }
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      this.moveVector.x -= 1;
    }
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      this.moveVector.x += 1;
    }

    // 2. Touch / Mouse Joystick Input
    if (this.isPointerDown) {
      const delta = this.pointerCurrent.clone().sub(this.pointerOrigin);
      const len = delta.length();
      if (len > 8) {
        const factor = Math.min(len / 40, 1.0);
        delta.normalize().multiplyScalar(factor);
        // Map screen X/Y to isometric view (projected at 45 degrees)
        this.moveVector.x = delta.x;
        this.moveVector.y = delta.y;
      }
    }

    if (this.moveVector.lengthSq() > 0) {
      this.moveVector.normalize();
    }

    return this.moveVector;
  }
}
