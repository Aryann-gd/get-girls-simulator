# Graph Report - TycoonDev  (2026-10-20)

## Corpus Check
- 28 files · ~72,823 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .blend 1, .css 1)

## Summary
- 256 nodes · 505 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f5b8d4c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GameManager
- compilerOptions
- mcp_server.py
- package.json
- generate_all_assets.py
- UIManager
- Immutable Rules & Architectural Guidelines
- EntityManager
- CrazyGamesManager.ts
- IPlayerState
- Get Girls Simulator 🚀
- Blender MCP
- Blender 3.1 MCP Project Instructions

## God Nodes (most connected - your core abstractions)
1. `GameManager` - 33 edges
2. `IPlayerState` - 20 edges
3. `EntityManager` - 19 edges
4. `UIManager` - 19 edges
5. `EconomyManager` - 17 edges
6. `compilerOptions` - 15 edges
7. `InputManager` - 14 edges
8. `CrazyGamesManager` - 14 edges
9. `SceneManager` - 13 edges
10. `AttractionSystem` - 13 edges

## Surprising Connections (you probably didn't know these)
- `EntityManager` --references--> `GameManager`  [EXTRACTED]
  src/engine/EntityManager.ts → src/systems/GameManager.ts
- `SceneManager` --references--> `GameManager`  [EXTRACTED]
  src/engine/SceneManager.ts → src/systems/GameManager.ts
- `GameApplication` --references--> `SceneManager`  [EXTRACTED]
  src/main.ts → src/engine/SceneManager.ts
- `GameApplication` --references--> `UIManager`  [EXTRACTED]
  src/main.ts → src/ui/UIManager.ts
- `CrazyGamesManager` --implements--> `ICrazyGamesSDK`  [EXTRACTED]
  src/sdk/CrazyGamesManager.ts → src/types/game.ts

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "GameManager"
Cohesion: 0.15
Nodes (6): GameApplication, CrazyGamesManager, GameManager, GameEventListener, GameEventType, IFloatingTextItem

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 2 - "mcp_server.py"
Cohesion: 0.10
Nodes (25): _bpy_api_lookup(), _build_house(), _clear_undo_history(), _execute_blender_code(), _execute_blender_command(), _get_scene_info(), _handle_blender_client(), _handle_mcp_message() (+17 more)

### Community 3 - "package.json"
Cohesion: 0.11
Nodes (17): dependencies, three, devDependencies, @types/three, typescript, vite, name, private (+9 more)

### Community 4 - "generate_all_assets.py"
Cohesion: 0.27
Nodes (12): assign_uvs(), build_clothing_rack(), build_coin(), build_girl_npc(), build_gym_bench(), build_player_character(), clear_scene(), create_color_material() (+4 more)

### Community 6 - "Immutable Rules & Architectural Guidelines"
Cohesion: 0.50
Nodes (3): 1. CrazyGames Strict Compliance Rules, 2. Technical Stack, Immutable Rules & Architectural Guidelines

### Community 9 - "EntityManager"
Cohesion: 0.12
Nodes (7): three, dispose(), EntityManager, IInteractableEntity, InputManager, ResizeManager, SceneManager

### Community 10 - "CrazyGamesManager.ts"
Cohesion: 0.13
Nodes (3): happytime(), Window, ICrazyGamesSDK

### Community 11 - "IPlayerState"
Cohesion: 0.11
Nodes (8): AttractionSystem, EconomyManager, SaveSystem, IEconomyConfig, IGirlConfig, IPlayerState, IUpgrade, UpgradeCategory

### Community 12 - "Get Girls Simulator 🚀"
Cohesion: 0.18
Nodes (10): 🏗️ Architecture & CrazyGames Compliance, Asset Lineup, Blender Asset Pipeline, 🛠️ Development Setup, Get Girls Simulator 🚀, 📜 License, 📁 Project Structure, Rigged & Textured Player Character (+2 more)

### Community 13 - "Blender MCP"
Cohesion: 0.22
Nodes (8): Blender MCP, License, Project goal, Repository layout, Requirements, Safety notes, Setup, Typical usage

### Community 14 - "Blender 3.1 MCP Project Instructions"
Cohesion: 0.40
Nodes (4): Blender 3.1 MCP Project Instructions, Compatibility and safety, MCP capabilities, Single-source architecture

## Knowledge Gaps
- **2 isolated node(s):** `@types/three`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 83 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameManager` connect `GameManager` to `EntityManager`, `IPlayerState`, `UIManager`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `@types/three`, `typescript` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `three` connect `EntityManager` to `package.json`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `mcp_server.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `EntityManager` connect `EntityManager` to `GameManager`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._