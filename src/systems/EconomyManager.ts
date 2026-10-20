import { IEconomyConfig, IPlayerState, IUpgrade } from '../types/game';

export class EconomyManager {
  private config: IEconomyConfig = {
    baseClickIncome: 1, // Balanced starting income: $1 per workout rep
    basePassiveIncomeInterval: 1.0,
    energyRegenRate: 1.2, // 1.2 energy per second
    energyCostPerWorkout: 5.0, // 5 energy per rep
  };

  private upgrades: Map<string, IUpgrade> = new Map();

  constructor() {
    this.initBalancedUpgrades();
  }

  private initBalancedUpgrades(): void {
    const list: IUpgrade[] = [
      {
        id: 'gym_dumbbells',
        name: 'Dumbbell Rack',
        category: 'fitness',
        description: 'Quality dumbbells for steady muscle definition.',
        baseCost: 15,
        costMultiplier: 1.25,
        level: 0,
        maxLevel: 25,
        looksBonus: 2,
        rizzBonus: 0,
        incomeBonus: 1, // +$1/s passive
        icon: '🏋️',
      },
      {
        id: 'whey_protein',
        name: 'Whey Protein Shake',
        category: 'fitness',
        description: 'Improves muscle recovery and physical aura.',
        baseCost: 35,
        costMultiplier: 1.28,
        level: 0,
        maxLevel: 20,
        looksBonus: 3,
        rizzBonus: 1,
        incomeBonus: 1,
        icon: '🥤',
      },
      {
        id: 'designer_shirt',
        name: 'Fitted Designer Shirt',
        category: 'fashion',
        description: 'Tailored fit that accentuates your gains.',
        baseCost: 75,
        costMultiplier: 1.30,
        level: 0,
        maxLevel: 15,
        looksBonus: 4,
        rizzBonus: 3,
        incomeBonus: 2,
        icon: '👔',
      },
      {
        id: 'luxury_watch',
        name: 'Steel Chronograph',
        category: 'fashion',
        description: 'A touch of class and confidence on your wrist.',
        baseCost: 160,
        costMultiplier: 1.32,
        level: 0,
        maxLevel: 10,
        looksBonus: 3,
        rizzBonus: 6,
        incomeBonus: 4,
        icon: '⌚',
      },
      {
        id: 'cologne',
        name: 'Magnetic Cologne',
        category: 'charisma',
        description: 'A warm, sophisticated fragrance that girls notice immediately.',
        baseCost: 280,
        costMultiplier: 1.35,
        level: 0,
        maxLevel: 10,
        looksBonus: 2,
        rizzBonus: 8,
        incomeBonus: 6,
        icon: '✨',
      },
      {
        id: 'sports_car',
        name: 'Convertible Cruiser',
        category: 'lifestyle',
        description: 'The ultimate tycoon status symbol.',
        baseCost: 650,
        costMultiplier: 1.40,
        level: 0,
        maxLevel: 5,
        looksBonus: 10,
        rizzBonus: 12,
        incomeBonus: 15,
        icon: '🏎️',
      },
    ];

    for (const u of list) {
      this.upgrades.set(u.id, u);
    }
  }

  public getUpgradeCost(upgradeId: string): number {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }

  public canAfford(state: IPlayerState, upgradeId: string): boolean {
    const cost = this.getUpgradeCost(upgradeId);
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;
    return state.cash >= cost && upgrade.level < upgrade.maxLevel;
  }

  public purchaseUpgrade(state: IPlayerState, upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;

    const cost = this.getUpgradeCost(upgradeId);
    if (state.cash < cost || upgrade.level >= upgrade.maxLevel) {
      return false;
    }

    state.cash -= cost;
    upgrade.level += 1;
    state.upgrades[upgradeId] = upgrade.level;

    state.looks = Math.min(100, state.looks + upgrade.looksBonus);
    state.rizz = Math.min(100, state.rizz + upgrade.rizzBonus);

    return true;
  }

  public calculatePassiveIncome(state: IPlayerState): number {
    let totalPerSecond = 0;
    for (const upgrade of this.upgrades.values()) {
      totalPerSecond += upgrade.incomeBonus * upgrade.level;
    }
    const rankBonus = 1 + (state.level - 1) * 0.1;
    return Math.floor(totalPerSecond * rankBonus);
  }

  public performActiveWorkout(state: IPlayerState): { earnedCash: number; earnedLooks: number; success: boolean } {
    if (state.energy < this.config.energyCostPerWorkout) {
      return { earnedCash: 0, earnedLooks: 0, success: false };
    }

    state.energy = Math.max(0, state.energy - this.config.energyCostPerWorkout);

    // Workout cash income: starts at $1, gently increases by +$1 every 15 Looks
    const statBonus = Math.floor(state.looks / 15);
    const earnedCash = this.config.baseClickIncome + statBonus;
    state.cash += earnedCash;

    // Small chance to directly gain +1 Looks from workout
    let earnedLooks = 0;
    if (Math.random() < 0.20 && state.looks < 100) {
      earnedLooks = 1;
      state.looks = Math.min(100, state.looks + earnedLooks);
    }

    return { earnedCash, earnedLooks, success: true };
  }

  public updateEnergyRegen(state: IPlayerState, delta: number): void {
    if (state.energy < state.maxEnergy) {
      state.energy = Math.min(state.maxEnergy, state.energy + this.config.energyRegenRate * delta);
    }
  }

  public getAllUpgrades(): IUpgrade[] {
    return Array.from(this.upgrades.values());
  }

  public syncFromState(state: IPlayerState): void {
    for (const [id, lvl] of Object.entries(state.upgrades)) {
      const upgrade = this.upgrades.get(id);
      if (upgrade) {
        upgrade.level = lvl;
      }
    }
  }
}
