import { IGirlConfig, IPlayerState } from '../types/game';

export class AttractionSystem {
  private girls: Map<string, IGirlConfig> = new Map();

  constructor() {
    this.initDefaultGirls();
  }

  private initDefaultGirls(): void {
    const list: IGirlConfig[] = [
      {
        id: 'girl_emily',
        name: 'Emily',
        title: 'College Gym Girl',
        tier: 1,
        minLooks: 10,
        minRizz: 10,
        bonusMultiplier: 1.25,
        dialogues: [
          'Hey! Nice form on the bench press! 🔥',
          'You look like you take your training seriously.',
          'Want to grab a protein smoothie together? 🥰',
        ],
        avatarColor: '#ff70a6',
        unlocked: false,
        position: [2.5, 0, 0],
      },
      {
        id: 'girl_chloe',
        name: 'Chloe',
        title: 'Fashion Influencer',
        tier: 2,
        minLooks: 35,
        minRizz: 30,
        bonusMultiplier: 1.6,
        dialogues: [
          'Obsessed with your tailored blazer! 📸',
          'You should definitely feature on my story today.',
          'Your aesthetic is pure tycoon vibes! ✨',
        ],
        avatarColor: '#ff9770',
        unlocked: false,
        position: [-2.5, 0, 0],
      },
      {
        id: 'girl_sophia',
        name: 'Sophia',
        title: 'High-Society Heiress',
        tier: 3,
        minLooks: 65,
        minRizz: 60,
        bonusMultiplier: 2.2,
        dialogues: [
          'That gold chronograph... you have exquisite taste.',
          'Finally, someone in this lounge on my level.',
          'Let me invite you to my private rooftop gala tonight. 🥂',
        ],
        avatarColor: '#ffd670',
        unlocked: false,
        position: [0, 0, 2.5],
      },
      {
        id: 'girl_valentina',
        name: 'Valentina',
        title: 'Supermodel VIP',
        tier: 4,
        minLooks: 90,
        minRizz: 85,
        bonusMultiplier: 3.5,
        dialogues: [
          'Unbelievable aura... You completely own this room.',
          'Never seen anyone with both max looks and effortless rizz.',
          'The whole club is watching us right now, darling. 👑',
        ],
        avatarColor: '#e9ff70',
        unlocked: false,
        position: [0, 0, -2.5],
      },
    ];

    for (const g of list) {
      this.girls.set(g.id, g);
    }
  }

  public checkAttraction(state: IPlayerState): IGirlConfig[] {
    const newlyAttracted: IGirlConfig[] = [];

    for (const girl of this.girls.values()) {
      if (!girl.unlocked && state.looks >= girl.minLooks && state.rizz >= girl.minRizz) {
        girl.unlocked = true;
        if (!state.unlockedGirls.includes(girl.id)) {
          state.unlockedGirls.push(girl.id);
        }
        newlyAttracted.push(girl);
      }
    }

    return newlyAttracted;
  }

  public getGirl(id: string): IGirlConfig | undefined {
    return this.girls.get(id);
  }

  public getAllGirls(): IGirlConfig[] {
    return Array.from(this.girls.values());
  }

  public getRandomDialogue(girlId: string): string {
    const girl = this.girls.get(girlId);
    if (!girl || girl.dialogues.length === 0) return 'Hey there!';
    const idx = Math.floor(Math.random() * girl.dialogues.length);
    return girl.dialogues[idx];
  }

  public getTotalAttractionMultiplier(state: IPlayerState): number {
    let multiplier = 1.0;
    for (const girlId of state.unlockedGirls) {
      const girl = this.girls.get(girlId);
      if (girl) {
        multiplier += (girl.bonusMultiplier - 1.0);
      }
    }
    return multiplier;
  }

  public syncFromState(state: IPlayerState): void {
    for (const girlId of state.unlockedGirls) {
      const girl = this.girls.get(girlId);
      if (girl) {
        girl.unlocked = true;
      }
    }
  }
}
