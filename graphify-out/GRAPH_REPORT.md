# Graph Report - TycoonDev  (2026-10-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 65 nodes · 76 edges · 8 communities (5 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `TycoonGameEngine` - 8 edges
3. `CrazyGamesSDKManager` - 7 edges
4. `ICrazyGamesSDK` - 7 edges
5. `FloatingTextPool` - 6 edges
6. `scripts` - 4 edges
7. `dispose()` - 2 edges
8. `three` - 2 edges
9. `vite` - 2 edges
10. `allowImportingTsExtensions` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (4): three, dispose(), FloatingTextPool, TycoonGameEngine

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (9): dependencies, three, name, private, type, version, @types/three, typescript (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.50
Nodes (4): devDependencies, @types/three, typescript, vite

### Community 5 - "Community 5"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **2 isolated node(s):** `@types/three`, `typescript`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 39 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **What connects `@types/three`, `typescript` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `ICrazyGamesSDK` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `CrazyGamesSDKManager` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._