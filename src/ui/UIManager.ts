import { GameManager } from '../systems/GameManager';

interface IFloatingTextItem {
  element: HTMLElement;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class UIManager {
  private gameManager: GameManager;

  // DOM Elements
  private cashValEl!: HTMLElement;
  private energyFillEl!: HTMLElement;
  private energyValEl!: HTMLElement;
  private looksValEl!: HTMLElement;
  private rizzValEl!: HTMLElement;
  private rankValEl!: HTMLElement;

  private shopModalEl!: HTMLElement;
  private shopListEl!: HTMLElement;
  private saveToastEl!: HTMLElement;

  // Floating Text Pool (Zero runtime DOM allocations)
  private textPool: HTMLElement[] = [];
  private activeTexts: IFloatingTextItem[] = [];
  private textPoolRoot!: HTMLElement;
  private animationFrameId: number = 0;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;

    this.bindDOM();
    this.initTextPool(30);
    this.setupListeners();
    this.updateHUD();

    this.startAnimationLoop();
  }

  private bindDOM(): void {
    this.cashValEl = document.getElementById('cash-val')!;
    this.energyFillEl = document.getElementById('energy-bar-fill')!;
    this.energyValEl = document.getElementById('energy-val')!;
    this.looksValEl = document.getElementById('looks-val')!;
    this.rizzValEl = document.getElementById('rizz-val')!;
    this.rankValEl = document.getElementById('rank-val')!;

    this.shopModalEl = document.getElementById('shop-modal')!;
    this.shopListEl = document.getElementById('shop-items-container')!;
    this.saveToastEl = document.getElementById('save-toast')!;
    this.textPoolRoot = document.getElementById('floating-text-pool-root')!;
  }

  private initTextPool(size: number): void {
    for (let i = 0; i < size; i++) {
      const span = document.createElement('span');
      span.className = 'floating-text-item';
      this.textPoolRoot.appendChild(span);
      this.textPool.push(span);
    }
  }

  public spawnFloatingText(text: string, screenX: number, screenY: number, color: string = '#ffb703'): void {
    let el = this.textPool.pop();
    if (!el) {
      const oldest = this.activeTexts.shift();
      if (oldest) {
        el = oldest.element;
      } else {
        return;
      }
    }

    el.innerText = text;
    el.style.color = color;
    el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
    el.style.opacity = '1';

    this.activeTexts.push({
      element: el,
      x: screenX,
      y: screenY,
      life: 0,
      maxLife: 1.2,
    });
  }

  private setupListeners(): void {
    // 1. Game Manager Events
    this.gameManager.on('cash_changed', () => this.updateHUD());
    this.gameManager.on('energy_changed', () => this.updateEnergy());
    this.gameManager.on('stats_changed', () => this.updateHUD());
    this.gameManager.on('upgrade_purchased', () => {
      this.updateHUD();
      this.renderShopItems();
    });
    this.gameManager.on('girl_attracted', (data) => {
      const girl = data as { name: string; title: string };
      this.spawnFloatingText(`🎉 Unlocked ${girl.name} (${girl.title})!`, window.innerWidth / 2, window.innerHeight / 3, '#ff2a85');
      this.updateHUD();
    });
    this.gameManager.on('game_saved', () => {
      this.showSaveToast();
    });

    // 2. Window Custom Events
    window.addEventListener('spawn_floating_text', ((e: CustomEvent) => {
      const { text, x, y, color } = e.detail;
      this.spawnFloatingText(text, x, y, color);
    }) as EventListener);

    window.addEventListener('open_shop_modal', () => {
      this.openShopModal();
    });

    // 3. UI Buttons
    document.getElementById('btn-open-shop')?.addEventListener('click', () => {
      this.openShopModal();
    });

    document.getElementById('btn-close-shop')?.addEventListener('click', () => {
      this.closeShopModal();
    });

    document.getElementById('btn-grind-workout')?.addEventListener('click', (e) => {
      const res = this.gameManager.workout();
      if (res.success) {
        this.spawnFloatingText(`+$${res.earnedCash}`, e.clientX, e.clientY - 20, '#ffb703');
        if (res.earnedLooks > 0) {
          this.spawnFloatingText(`+${res.earnedLooks} Looks! 💪`, e.clientX, e.clientY - 45, '#00f0ff');
        }
      } else {
        this.spawnFloatingText('Low Energy! ⚡', e.clientX, e.clientY - 20, '#ff4d4d');
      }
    });

    // 4. Rewarded Ad Buttons
    document.getElementById('btn-ad-double-cash')?.addEventListener('click', () => {
      this.gameManager.watchRewardedAd('double_cash');
    });

    document.getElementById('btn-ad-rizz')?.addEventListener('click', () => {
      this.gameManager.watchRewardedAd('instant_rizz');
    });

    document.getElementById('btn-ad-energy')?.addEventListener('click', () => {
      this.gameManager.watchRewardedAd('full_energy');
    });

    // 5. CrazyGames Compliance: Audio Mute Button
    let isMuted = false;
    const btnMute = document.getElementById('btn-mute-audio');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        btnMute.innerText = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
      });
    }
  }

  public updateHUD(): void {
    const s = this.gameManager.state;
    this.cashValEl.innerText = `$${s.cash.toLocaleString()}`;
    this.looksValEl.innerText = `${s.looks}/100`;
    this.rizzValEl.innerText = `${s.rizz}/100`;
    this.rankValEl.innerText = `Lvl ${s.level} Tycoon`;

    this.updateEnergy();
  }

  private updateEnergy(): void {
    const s = this.gameManager.state;
    const pct = Math.floor((s.energy / s.maxEnergy) * 100);
    this.energyFillEl.style.width = `${pct}%`;
    this.energyValEl.innerText = `${Math.floor(s.energy)}/${s.maxEnergy}`;
  }

  public openShopModal(): void {
    this.gameManager.sdk.gameplayStop();
    this.renderShopItems();
    this.shopModalEl.classList.add('visible');
  }

  public closeShopModal(): void {
    this.shopModalEl.classList.remove('visible');
    this.gameManager.sdk.gameplayStart();
  }

  private renderShopItems(): void {
    const upgrades = this.gameManager.economy.getAllUpgrades();
    const s = this.gameManager.state;

    this.shopListEl.innerHTML = '';

    for (const u of upgrades) {
      const cost = this.gameManager.economy.getUpgradeCost(u.id);
      const canAfford = s.cash >= cost && u.level < u.maxLevel;
      const isMax = u.level >= u.maxLevel;

      const card = document.createElement('div');
      card.className = `shop-item-card ${canAfford ? 'affordable' : 'unaffordable'} ${isMax ? 'maxed' : ''}`;

      card.innerHTML = `
        <div class="shop-item-icon">${u.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-header">
            <h4>${u.name}</h4>
            <span class="shop-item-level">Lvl ${u.level}/${u.maxLevel}</span>
          </div>
          <p class="shop-item-desc">${u.description}</p>
          <div class="shop-item-stats">
            ${u.looksBonus > 0 ? `<span class="stat-tag looks">+${u.looksBonus} Looks</span>` : ''}
            ${u.rizzBonus > 0 ? `<span class="stat-tag rizz">+${u.rizzBonus} Rizz</span>` : ''}
            <span class="stat-tag income">+$${u.incomeBonus}/s</span>
          </div>
        </div>
        <button class="btn-buy ${canAfford ? 'active' : 'disabled'}" ${!canAfford ? 'disabled' : ''}>
          ${isMax ? 'MAX' : `$${cost.toLocaleString()}`}
        </button>
      `;

      const buyBtn = card.querySelector('.btn-buy');
      if (buyBtn && !isMax) {
        buyBtn.addEventListener('click', () => {
          this.gameManager.buyUpgrade(u.id);
        });
      }

      this.shopListEl.appendChild(card);
    }
  }

  private showSaveToast(): void {
    this.saveToastEl.classList.add('show');
    setTimeout(() => {
      this.saveToastEl.classList.remove('show');
    }, 2000);
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();

    const loop = (now: number) => {
      this.animationFrameId = requestAnimationFrame(loop);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update Floating Texts
      for (let i = this.activeTexts.length - 1; i >= 0; i--) {
        const item = this.activeTexts[i];
        item.life += delta;
        const progress = item.life / item.maxLife;

        if (progress >= 1.0) {
          item.element.style.opacity = '0';
          this.textPool.push(item.element);
          this.activeTexts.splice(i, 1);
        } else {
          const offsetY = item.y - progress * 50;
          const opacity = 1.0 - Math.pow(progress, 2);
          item.element.style.transform = `translate3d(${item.x}px, ${offsetY}px, 0) scale(${1 + progress * 0.15})`;
          item.element.style.opacity = opacity.toString();
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.textPool.forEach((el) => el.remove());
    this.activeTexts.forEach((item) => item.element.remove());
    this.textPool = [];
    this.activeTexts = [];
  }
}
