# Immutable Rules & Architectural Guidelines

## 1. CrazyGames Strict Compliance Rules
These rules are immutable to guarantee 100% acceptance on CrazyGames without rejection:

- **MEMORY LEAK PREVENTION**:
  - Every Three.js Geometry, Material, and Texture MUST have a strict `dispose()` method call.
  - Implement and maintain a robust `cleanup()` / `dispose()` lifecycle function across all scenes, managers, and entities.
  - When the game resets, scenes transition, or models unmount, all assets, event listeners, and timers must be explicitly destroyed and released.

- **OBJECT POOLING**:
  - Zero allocation/destruction in the hot path.
  - Do NOT instantiate or destroy DOM elements or complex 3D entities (such as floating UI text, particle effects, character models, coins) dynamically at runtime.
  - All dynamic entities and particles must use strict Object Pooling patterns with pre-allocated memory buffers.

- **RESPONSIVE UI (NO CANVAS STRETCHING)**:
  - Game UI MUST be built using HTML5 / CSS overlay layers on top of the Three.js WebGL canvas.
  - The WebGL canvas must resize gracefully using internal canvas resolution adjusting (`renderer.setSize(w, h, false)`) or CSS `object-fit` maintaining aspect ratio.
  - **NEVER** stretch the WebGL canvas via CSS `width: 100%; height: 100%` directly on a fixed buffer, as it distorts 3D models and orthographic projections.
  - Maintain a crisp fixed orthographic projection or responsive aspect-corrected frustum.

- **GRACEFUL SDK FALLBACK**:
  - The game MUST be 100% playable offline or in sandbox mode if the CrazyGames SDK fails to load, adblocker is active, or network drops.
  - Wrap all SDK calls (ads, gameplay start/stop, happy hour, data storage) behind an abstraction layer with silent offline mocks.

## 2. Technical Stack
- **Engine**: Three.js (r160+)
- **Build System**: Vite + TypeScript
- **Style**: 2.5D Isometric Tycoon / Management Simulation
- **Architecture**: Entity-Component-System (ECS) / Service-oriented Managers with Object Pooling & strict Memory Lifecycles.
