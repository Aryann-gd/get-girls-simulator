import { IEconomyConfig, IPlayerState, IUpgrade } from '../types/game';

export class EconomyManager {
  private config: IEconomyConfig = {
    baseExponentialMultiplier: 1.15,
    baseClickIncome: 5,
    basePassiveIncomeInterval: 1.0,
    energyRegenRate: 2.0,
    energyCostPerClick: 3.0,
  };

  private upgrades: Map<string, IUpgrade> = new Map();

  constructor() {
    this.initDefaultUpgrades();
  }

  private initDefaultUpgrades(): void {
    const defaultList: IUpgrade[] = [
      {
        id: 'gym_pass',
        name: 'Gym Membership',
        category: 'fitness',
        description: 'Pumps your biceps and boosts physical looks.',
        baseCost: 25,
        costMultiplier: 1.15,
        level: 0,
        maxLevel: 50,
        looksBonus: 2,
        rizzBonus: 0,
        incomeBonus: 1,
        icon: '🏋️',
      },
      {
        id: 'protein_shake',
        name: 'Whey Protein',
        category: 'fitness',
        description: 'Maximizes workout gains and raises energy capacity.',
        baseCost: 60,
        costMultiplier: 1.16,
        level: 0,
        maxLevel: 30,
        looksBonus: 3,
        rizzBonus: 1,
        incomeBonus: 2,
        icon: '🥤',
      },
      {
        id: 'designer_blazer',
        name: 'Tailored Blazer',
        category: 'fashion',
        description: 'Look sharp and stylish like an elite tycoon.',
        baseCost: 150,
        costMultiplier: 1.18,
        level: 0,
        maxLevel: 25,
        looksBonus: 5,
        rizzBonus: 4,
        incomeBonus: 5,
        icon: '🧥',
      },
      {
        id: 'luxury_watch',
        name: 'Gold Chronograph',
        category: 'fashion',
        description: 'Exudes immense wealth and effortless charisma.',
        baseCost: 400,
        costMultiplier: 1.20,
        level: 0,
        maxLevel: 20,
        looksBonus: 4,
        rizzBonus: 8,
        incomeBonus: 12,
        icon: '⌚',
      },
      {
        id: 'seductive_cologne',
        name: 'Oud Wood Cologne',
        category: 'charisma',
        description: 'An irresistible scent that doubles your natural Rizz.',
        baseCost: 200,
        costMultiplier: 1.17,
        level: 0,
        maxLevel: 30,
        looksBonus: 2,
        rizzBonus: 7,
        incomeBonus: 8,
        icon: '✨',
      },
      {
        id: 'sports_car',
        name: 'Convertible Supercar',
        category: 'lifestyle',
        description: 'Turn heads everywhere you drive. Instant top-tier status.',
        baseCost: 1200,
        costMultiplier: 1.22,
        level: 0,
        maxLevel: 15,
        looksBonus: 10,
        rizzBonus: 15,
        incomeBonus: 45,
        icon: '🏎️',
      },
    ];

    for (const u of defaultList) {
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

    // Apply stat boosts
    state.looks = Math.min(100, state.looks + upgrade.looksBonus);
    state.rizz = Math.min(100, state.rizz + upgrade.rizzBonus);

    return true;
  }

  public calculatePassiveIncome(state: IPlayerState): number {
    let totalPerSecond = 0;
    for (const upgrade of this.upgrades.values()) {
      totalPerSecond += upgrade.incomeBonus * upgrade.level;
    }
    // Tycoon rank multiplier
    const rankBonus = 1 + (state.level - 1) * 0.15;
    return Math.floor(totalPerSecond * rankBonus);
  }

  public performActiveWorkout(state: IPlayerState): { earnedCash: number; earnedLooks: number; success: boolean } {
    if (state.energy < this.config.energyCostPerClick) {
      return { earnedCash: 0, earnedLooks: 0, success: false };
    }

    state.energy = Math.max(0, state.energy - this.config.energyCostPerClick);

    // Cash earned scales with Looks and Rizz
    const statMultiplier = 1 + (state.looks * 0.02) + (state.rizz * 0.03);
    const earnedCash = Math.floor(this.config.baseClickIncome * statMultiplier);
    state.cash += earnedCash;

    // Small chance to increase looks directly from workout
    let earnedLooks = 0;
    if (Math.random() < 0.25 && state.looks < 100) {
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
