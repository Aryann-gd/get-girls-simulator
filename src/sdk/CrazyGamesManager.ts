import { ICrazyGamesSDK } from '../types/game';

declare global {
  interface Window {
    CrazyGames?: {
      SDK: new () => {
        init(): Promise<void>;
        game?: {
          gameplayStart(): void;
          gameplayStop(): void;
          happytime(): void;
        };
        ad?: {
          requestAd(type: 'midgame' | 'rewarded', callbacks?: {
            adStarted?: () => void;
            adFinished?: () => void;
            adError?: (error: unknown) => void;
          }): void;
        };
        hasCapabilities?: boolean;
      };
    };
  }
}

export class CrazyGamesManager implements ICrazyGamesSDK {
  private static instance: CrazyGamesManager;
  private isAvailable: boolean = false;
  private sdkInstance: unknown = null;
  private lastMidrollTimestamp: number = 0;
  private readonly MIN_MIDROLL_INTERVAL_MS = 180000; // 3 minutes strictly per monetization.md

  private constructor() {}

  public static getInstance(): CrazyGamesManager {
    if (!CrazyGamesManager.instance) {
      CrazyGamesManager.instance = new CrazyGamesManager();
    }
    return CrazyGamesManager.instance;
  }

  public async init(): Promise<void> {
    try {
      if (typeof window.CrazyGames !== 'undefined') {
        const sdk = new window.CrazyGames.SDK();
        await sdk.init();
        this.sdkInstance = sdk;
        this.isAvailable = true;
        console.log('[CrazyGamesManager] SDK initialized in portal environment.');
      } else {
        console.log('[CrazyGamesManager] Running in offline / local development mode.');
        this.isAvailable = false;
      }
    } catch (err) {
      console.warn('[CrazyGamesManager] Failed to initialize official SDK, falling back:', err);
      this.isAvailable = false;
    }
  }

  public gameplayStart(): void {
    if (this.isAvailable && this.sdkInstance) {
      const sdk = this.sdkInstance as { game?: { gameplayStart(): void } };
      sdk.game?.gameplayStart();
    }
  }

  public gameplayStop(): void {
    if (this.isAvailable && this.sdkInstance) {
      const sdk = this.sdkInstance as { game?: { gameplayStop(): void } };
      sdk.game?.gameplayStop();
    }
  }

  public happyHour(): void {
    if (this.isAvailable && this.sdkInstance) {
      const sdk = this.sdkInstance as { game?: { happytime(): void } };
      sdk.game?.happytime();
    }
  }

  public async requestAd(type: 'midroll' | 'rewarded'): Promise<boolean> {
    if (type === 'midroll') {
      const now = Date.now();
      if (now - this.lastMidrollTimestamp < this.MIN_MIDROLL_INTERVAL_MS) {
        console.log('[CrazyGamesManager] Midroll skipped: minimum 3-minute interval not reached.');
        return false;
      }
      this.lastMidrollTimestamp = now;
    }

    if (!this.isAvailable || !this.sdkInstance) {
      console.log(`[CrazyGamesManager Sandbox] Simulating completed ${type} ad.`);
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const sdk = this.sdkInstance as {
        ad?: {
          requestAd(
            t: string,
            cb: { adStarted?: () => void; adFinished?: () => void; adError?: (e: unknown) => void }
          ): void;
        };
      };

      this.gameplayStop();

      sdk.ad?.requestAd(type === 'midroll' ? 'midgame' : 'rewarded', {
        adStarted: () => {
          console.log(`[CrazyGamesManager] ${type} ad started`);
        },
        adFinished: () => {
          this.gameplayStart();
          resolve(true);
        },
        adError: (err) => {
          console.warn(`[CrazyGamesManager] ${type} ad error:`, err);
          this.gameplayStart();
          // Fall back gracefully so players aren't soft-locked
          resolve(type === 'rewarded');
        },
      });
    });
  }

  public hasAdblock(): boolean {
    if (!this.isAvailable || !this.sdkInstance) return false;
    const sdk = this.sdkInstance as { hasCapabilities?: boolean };
    return sdk.hasCapabilities === false;
  }
}
