import { GameEventListener, GameEventType, IPlayerState } from '../types/game';
import { EconomyManager } from './EconomyManager';
import { AttractionSystem } from './AttractionSystem';
import { SaveSystem } from './SaveSystem';
import { CrazyGamesManager } from '../sdk/CrazyGamesManager';

export class GameManager {
  private static instance: GameManager;

  public state: IPlayerState;
  public economy: EconomyManager;
  public attraction: AttractionSystem;
  public sdk: CrazyGamesManager;

  private listeners: Map<GameEventType, Set<GameEventListener>> = new Map();
  private autoSaveTimerId: number | null = null;
  private passiveTimerId: number | null = null;

  private constructor() {
    this.economy = new EconomyManager();
    this.attraction = new AttractionSystem();
    this.sdk = CrazyGamesManager.getInstance();

    // Load saved game or start fresh
    this.state = SaveSystem.load();
    this.economy.syncFromState(this.state);
    this.attraction.syncFromState(this.state);

    this.startTimers();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  private startTimers(): void {
    // 1-second heartbeat loop (passive income, energy regen, attraction check)
    this.passiveTimerId = window.setInterval(() => {
      this.tick(1.0);
    }, 1000);

    // 30-second auto-save loop strictly as mandated by PRD
    this.autoSaveTimerId = window.setInterval(() => {
      this.save();
    }, 30000);
  }

  private tick(deltaSeconds: number): void {
    // 1. Passive income
    const basePassive = this.economy.calculatePassiveIncome(this.state);
    const attractionMult = this.attraction.getTotalAttractionMultiplier(this.state);
    const totalPassive = Math.floor(basePassive * attractionMult);

    if (totalPassive > 0) {
      this.state.cash += totalPassive;
      this.emit('cash_changed', { amount: totalPassive, reason: 'passive' });
    }

    // 2. Energy regeneration
    this.economy.updateEnergyRegen(this.state, deltaSeconds);
    this.emit('energy_changed', this.state.energy);

    // 3. Attraction threshold check
    const newlyAttracted = this.attraction.checkAttraction(this.state);
    if (newlyAttracted.length > 0) {
      for (const girl of newlyAttracted) {
        this.emit('girl_attracted', girl);
        this.sdk.happyHour();
      }
    }
  }

  public workout(): { earnedCash: number; earnedLooks: number; success: boolean } {
    const res = this.economy.performActiveWorkout(this.state);
    if (res.success) {
      this.emit('cash_changed', { amount: res.earnedCash, reason: 'workout' });
      this.emit('energy_changed', this.state.energy);
      if (res.earnedLooks > 0) {
        this.emit('stats_changed', { looks: this.state.looks, rizz: this.state.rizz });
      }
      // Check if newly reached threshold for girls
      const newlyAttracted = this.attraction.checkAttraction(this.state);
      for (const girl of newlyAttracted) {
        this.emit('girl_attracted', girl);
        this.sdk.happyHour();
      }
    }
    return res;
  }

  public buyUpgrade(upgradeId: string): boolean {
    const success = this.economy.purchaseUpgrade(this.state, upgradeId);
    if (success) {
      this.emit('upgrade_purchased', upgradeId);
      this.emit('cash_changed', { reason: 'upgrade' });
      this.emit('stats_changed', { looks: this.state.looks, rizz: this.state.rizz });

      // Check girl attraction immediately on upgrade
      const newlyAttracted = this.attraction.checkAttraction(this.state);
      for (const girl of newlyAttracted) {
        this.emit('girl_attracted', girl);
        this.sdk.happyHour();
      }
    }
    return success;
  }

  public async watchRewardedAd(rewardType: 'double_cash' | 'instant_rizz' | 'full_energy'): Promise<boolean> {
    const success = await this.sdk.requestAd('rewarded');
    if (!success) return false;

    if (rewardType === 'double_cash') {
      const bonus = Math.max(50, Math.floor(this.state.cash * 0.5));
      this.state.cash += bonus;
      this.emit('cash_changed', { amount: bonus, reason: 'ad_double' });
    } else if (rewardType === 'instant_rizz') {
      this.state.rizz = Math.min(100, this.state.rizz + 10);
      this.emit('stats_changed', { looks: this.state.looks, rizz: this.state.rizz });
    } else if (rewardType === 'full_energy') {
      this.state.energy = this.state.maxEnergy;
      this.emit('energy_changed', this.state.energy);
    }

    this.emit('ad_reward_granted', rewardType);
    this.sdk.happyHour();
    return true;
  }

  public flirtWithGirl(girlId: string): { dialogue: string; affectionReward: number; success: boolean } {
    const girl = this.attraction.getGirl(girlId);
    if (!girl || !girl.unlocked) {
      return { dialogue: 'She looks too out of your league right now... Grind your Looks and Rizz!', affectionReward: 0, success: false };
    }

    const dialogue = this.attraction.getRandomDialogue(girlId);
    const affectionReward = Math.floor(10 * girl.bonusMultiplier);
    this.state.cash += affectionReward;
    this.emit('cash_changed', { amount: affectionReward, reason: 'flirt' });

    return { dialogue, affectionReward, success: true };
  }

  public save(): void {
    SaveSystem.save(this.state);
    this.emit('game_saved', this.state.lastSavedTimestamp);
  }

  public reset(): void {
    this.state = SaveSystem.reset();
    this.economy.syncFromState(this.state);
    this.attraction.syncFromState(this.state);
    this.emit('stats_changed', { looks: this.state.looks, rizz: this.state.rizz });
    this.emit('cash_changed', { reason: 'reset' });
    this.emit('energy_changed', this.state.energy);
  }

  public on(event: GameEventType, listener: GameEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: GameEventType, listener: GameEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: GameEventType, data?: unknown): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const fn of set) {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in game event listener for [${event}]:`, e);
        }
      }
    }
  }

  public cleanup(): void {
    if (this.autoSaveTimerId !== null) clearInterval(this.autoSaveTimerId);
    if (this.passiveTimerId !== null) clearInterval(this.passiveTimerId);
    this.save();
    this.listeners.clear();
  }
}
