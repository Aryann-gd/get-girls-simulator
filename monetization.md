The core game is functional. Now, we integrate the CrazyGames SDK for monetization and finalize for submission.

1. SDK INJECTION:
- Add the SDK script to `index.html`: `<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>`
- Create a `CrazyGamesManager.ts` class.
- Initialize the SDK: `window.sdk = new window.CrazyGames.SDK(); await sdk.init();`
- Implement a graceful fallback if `window.CrazyGames` is undefined (e.g., during local testing).

2. AD TRIGGERS (Strict Compliance):
- MID-ROLL ADS: Implement `sdk.ad.requestAd("midgame", callback)`. Trigger this ONLY after 3 minutes of gameplay, or when the player unlocks a new major area/map. DO NOT spam mid-rolls or the game will be rejected.
- REWARDED ADS: Implement `sdk.ad.requestAd("rewarded", callback)`. Add UI buttons for "Watch Ad to Double Cash" or "Watch Ad for Instant +10 Rizz". 

3. GAMEPLAY RECORDING & TRACKING:
- Call `sdk.game.gameplayStart()` when the user starts playing.
- Call `sdk.game.gameplayStop()` when opening menus or shops.
- Handle `sdk.happytime()` when the player successfully attracts a high-tier girl or buys a massive upgrade.

4. PRE-SUBMISSION CHECKLIST:
- Run a final memory leak check (simulate clicking "Restart Game" 10 times and ensure Three.js memory doesn't balloon).
- Ensure the game has a "Mute Audio" button (CrazyGames requires audio controls).
- Ensure the game handles `window.sdk.hascapabilities` to check for adblockers and adjust UI accordingly.

Integrate the SDK, test the ad logic, and update the Graphify graph with the final monetization flow.