We need to generate our 2.5D cartoonish assets using the Blender MCP tools. 

VISUAL STYLE: Low-poly, stylized cartoonish (think "Two Point Hospital" or "Sims 4" but low-poly). Flat colors, no complex PBR textures (use MeshToonMaterial or MeshBasicMaterial in Three.js for performance).

Use the Blender MCP (`execute_blender_code`, `create_material`, etc.) to generate the following GLB/GLTF assets and export them to `/public/assets/models/`:
1. `player_idle.glb`: A stylized low-poly male character in a casual t-shirt.
2. `gym_bench.glb`: A simple, colorful gym bench.
3. `clothing_rack.glb`: A store rack with clothes.
4. `girl_npc_1.glb`: A basic female NPC model.
5. `coin.glb`: A simple 3D coin.

INSTRUCTIONS FOR BLENDER MCP:
- Keep polycount strictly under 1,500 triangles per model.
- Apply all transforms and rotations before exporting.
- Use simple procedural materials or solid colors (no high-res image textures) to keep the game loading instantaneously on CrazyGames.
- Once generated, confirm the file paths and update the Graphify graph with a list of "Available_Assets".