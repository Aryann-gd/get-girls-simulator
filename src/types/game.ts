/**
 * Get Girls Simulator - Core Type Definitions & Interfaces
 * Engineered for CrazyGames Strict Compliance & Extensibility
 */

export interface IPlayerState {
  cash: number;
  looks: number;    // 0 - 100
  rizz: number;     // 0 - 100
  energy: number;   // 0 - 100
  maxEnergy: number;
  level: number;
  lastSavedTimestamp: number;
  upgrades: Record<string, number>; // upgradeId -> level
  unlockedGirls: string[];          // list of attracted girl IDs
  unlockedZones: string[];          // list of unlocked zone IDs
}

export type UpgradeCategory = 'fitness' | 'fashion' | 'lifestyle' | 'charisma';

export interface IUpgrade {
  id: string;
  name: string;
  category: UpgradeCategory;
  description: string;
  baseCost: number;
  costMultiplier: number;
  level: number;
  maxLevel: number;
  looksBonus: number;
  rizzBonus: number;
  incomeBonus: number; // passive cash per second
  icon: string;
}

export interface IZonePad {
  id: string;
  name: string;
  type: 'workout' | 'upgrade' | 'girl_attract' | 'cash_collect';
  position: [number, number, number];
  radius: number;
  cost: number;
  currentPaid: number;
  unlocked: boolean;
  color: number;
  label: string;
  targetUpgradeId?: string;
}

export interface IEconomyConfig {
  baseClickIncome: number;
  basePassiveIncomeInterval: number; // in seconds
  energyRegenRate: number;           // energy per second
  energyCostPerWorkout: number;
}

export interface IGirlConfig {
  id: string;
  name: string;
  title: string;
  tier: number;
  minLooks: number;
  minRizz: number;
  bonusMultiplier: number;
  dialogues: string[];
  avatarColor: string;
  unlocked: boolean;
  position: [number, number, number];
}

export interface ICrazyGamesSDK {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyHour(): void;
  requestAd(type: 'midroll' | 'rewarded'): Promise<boolean>;
  hasAdblock(): boolean;
}

export type GameEventType =
  | 'stats_changed'
  | 'cash_changed'
  | 'energy_changed'
  | 'upgrade_purchased'
  | 'girl_attracted'
  | 'zone_unlocked'
  | 'game_saved'
  | 'ad_reward_granted';

export type GameEventListener = (data?: unknown) => void;
