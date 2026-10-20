Let's build the core rendering and interaction loop in Three.js.

1. CAMERA & RENDERER:
- Setup an `OrthographicCamera` at an isometric angle (approx 35 degrees, looking down).
- Setup a WebGLRenderer with `antialias: true` and `powerPreference: "high-performance"`.
- Implement a `ResizeManager` that listens to window resizes. It must adjust the camera frustum (left, right, top, bottom) to maintain the isometric ratio without stretching.

2. SCENE SETUP:
- Load the GLB models generated in Phase 3 using `GLTFLoader`.
- Implement an `EntityManager` that spawns NPCs (Girls) and Interactive Objects (Gym, Store).
- Implement click interaction using Three.js `Raycaster` from mouse/touch coordinates.

3. UI OVERLAY (HTML/CSS):
- Create a DOM-based UI overlay (`#ui-layer`) absolutely positioned over the canvas.
- Build components for: Cash Display, Energy Bar, Stats (Looks/Rizz), and an Upgrade Shop Panel.
- Ensure all UI elements use CSS `rem` or `clamp()` for font sizes to guarantee they look perfect on both mobile phones and desktop monitors (Crucial for CrazyGames mobile traffic).

4. GAME LOOP:
- Implement the `requestAnimationFrame` loop.
- Update the EconomyManager (passive income).
- Update NPC pathfinding or simple sine-wave wandering for the Girls.

Write the code for the `SceneManager`, `InputManager`, and `UIManager`. Ensure you query the Graphify graph before writing to ensure consistency with the interfaces defined in Phase 2.