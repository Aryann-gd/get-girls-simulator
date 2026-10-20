# Graph Report - TycoonDev  (2026-10-20)

## Corpus Check
- 13 files · ~60,590 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .blend 1, .css 1)

## Summary
- 95 nodes · 123 edges · 12 communities (5 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `24228b4b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .init
- compilerOptions
- CrazyGamesSDKManager
- package.json
- generate_all_assets.py
- Immutable Rules & Architectural Guidelines

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `main()` - 10 edges
3. `TycoonGameEngine` - 8 edges
4. `ICrazyGamesSDK` - 7 edges
5. `CrazyGamesSDKManager` - 7 edges
6. `FloatingTextPool` - 6 edges
7. `create_color_material()` - 5 edges
8. `build_player_character()` - 5 edges
9. `build_gym_bench()` - 4 edges
10. `build_clothing_rack()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 7 thin omitted)

### Community 0 - ".init"
Cohesion: 0.24
Nodes (3): dispose(), FloatingTextPool, TycoonGameEngine

### Community 1 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 3 - "package.json"
Cohesion: 0.10
Nodes (18): dependencies, three, devDependencies, @types/three, typescript, vite, name, private (+10 more)

### Community 4 - "generate_all_assets.py"
Cohesion: 0.30
Nodes (12): assign_uvs(), build_clothing_rack(), build_coin(), build_girl_npc(), build_gym_bench(), build_player_character(), clear_scene(), create_color_material() (+4 more)

### Community 6 - "Immutable Rules & Architectural Guidelines"
Cohesion: 0.50
Nodes (3): 1. CrazyGames Strict Compliance Rules, 2. Technical Stack, Immutable Rules & Architectural Guidelines

## Knowledge Gaps
- **2 isolated node(s):** `@types/three`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 48 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `package.json` to `.init`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `@types/three`, `typescript` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `ICrazyGamesSDK` connect `CrazyGamesSDKManager` to `.init`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._