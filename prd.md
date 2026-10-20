Now, we will define the Game Design Document (GDD) and Core Loop. Save all of this into the Graphify graph under the node "PRD_GetGirlsSimulator".

THEME: "Get Girls Simulator" (Cartoonish 2.5D Management Tycoon)
CORE LOOP: Grind for Cash -> Buy Upgrades (Clothes, Gym, Cars) -> Increase Stats (Looks, Rizz) -> Attract Higher Tier Girls -> Unlock New Areas.

SYSTEMS TO ARCHITECT (Create Types/Interfaces for these in TypeScript):
1. PlayerStats: Cash (number), Looks (0-100), Rizz (0-100), Energy (0-100).
2. Economy Manager: Handles income generation, click rewards, and upgrade costs. Costs must scale exponentially (BaseCost * Math.pow(1.15, Level)).
3. Attraction System: A girl entity requires a minimum "Looks" and "Rizz" threshold to approach the player. 
4. SaveSystem: Uses LocalStorage to save a compressed JSON string of the player's state. Must auto-save every 30 seconds.

Create the TypeScript interfaces for `IPlayerState`, `IUpgrade`, and `IEconomyConfig`. Write a `GameManager.ts` class that orchestrates these systems using a Singleton or Dependency Injection pattern. 
Use Graphify to map the relationships between `GameManager`, `EconomyManager`, and `PlayerStats` so you remember how they interact in future sessions.