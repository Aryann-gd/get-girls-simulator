import { IPlayerState } from '../types/game';

const SAVE_KEY = 'GET_GIRLS_SIMULATOR_SAVE_V2';

export class SaveSystem {
  public static getInitialState(): IPlayerState {
    return {
      cash: 0,          // Balanced start: $0, player earns first dollars through gym workout
      looks: 2,
      rizz: 2,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      lastSavedTimestamp: Date.now(),
      upgrades: {},
      unlockedGirls: [],
      unlockedZones: ['zone_gym'], // Gym is unlocked by default
    };
  }

  public static save(state: IPlayerState): boolean {
    try {
      state.lastSavedTimestamp = Date.now();
      const serialized = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (err) {
      console.warn('[SaveSystem] Unable to write to localStorage:', err);
      return false;
    }
  }

  public static load(): IPlayerState {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return this.getInitialState();
      }
      const parsed = JSON.parse(raw) as Partial<IPlayerState>;
      const initial = this.getInitialState();

      return {
        cash: typeof parsed.cash === 'number' ? parsed.cash : initial.cash,
        looks: typeof parsed.looks === 'number' ? parsed.looks : initial.looks,
        rizz: typeof parsed.rizz === 'number' ? parsed.rizz : initial.rizz,
        energy: typeof parsed.energy === 'number' ? parsed.energy : initial.energy,
        maxEnergy: typeof parsed.maxEnergy === 'number' ? parsed.maxEnergy : initial.maxEnergy,
        level: typeof parsed.level === 'number' ? parsed.level : initial.level,
        lastSavedTimestamp: parsed.lastSavedTimestamp || Date.now(),
        upgrades: parsed.upgrades || {},
        unlockedGirls: Array.isArray(parsed.unlockedGirls) ? parsed.unlockedGirls : [],
        unlockedZones: Array.isArray(parsed.unlockedZones) ? parsed.unlockedZones : initial.unlockedZones,
      };
    } catch (err) {
      console.warn('[SaveSystem] Failed to parse save data. Resetting to defaults:', err);
      return this.getInitialState();
    }
  }

  public static reset(): IPlayerState {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.warn('[SaveSystem] Error clearing save:', err);
    }
    return this.getInitialState();
  }
}
