# Paper Demon Hunter: Sunset Relic War (3-Stage Edition)
（紙片獵魔：日落聖物戰 - 三關卡完整版）

A card-styled 3D Action-Survival game built on **Three.js** and HTML5 Canvas.

---

## 🎮 Game Rules & Objective

1. **⛪ Mission**: 
   - Locate the **Holy Relic** by repairing the **10 ruined buildings** spread around the map before the level boss arrives.
   - Defeating the level boss *without* the relic will cause them to resurrect in the darkness, failing the level.
   - Vanquishing a boss *with* the relic purifies the stage, allowing you to advance to the next level!
2. **🎮 Controls**:
   - **Move**: Click or tap the ground. The hunter will automatically navigate and smoothly slide around building obstacles.
   - **Shoot**: Click or tap enemies to shoot. An auto-shooting helper will fire at the closest enemy within range periodically.
   - **Repair**: Click or tap ruined buildings (`🏚️Ruined`) to repair them.

---

## 👼 Key Systems & Mechanics

### 1. 3-Stage Progression & Ground Textures (三關卡與地面底圖)
- Features three distinct levels with custom-designed repeating ground background textures:
  - **Stage 1 (Hunter's Town at Dusk)**: Orange sunset ruins cobblestones (`assets/ground/stage_1.png`).
  - **Stage 2 (Crimson Castle)**: Dark crimson courtyard stone pavers (`assets/ground/stage_2.png`).
  - **Stage 3 (Undead Throne)**: Mystical glowing green rune obsidian (`assets/ground/stage_3.png`).
- Cleared stages trigger a victory transition dialog prompting player to advance. Resets health, randomize buildings and obstacles, and loads new stage assets.

### 2. 3D City Maze & sliding Collision (城市迷宮與大體積障礙)
- Pre-set building obstacles and houses are scaled **3x larger than characters** (width/depth 12 to 18, height 25 to 40) creating a giant "living maze" city layout.
- Obstacles and houses block movements. Walking into wall edges smoothly redirects the hunter.
- Obstacles and larger houses are projected as scale-matched rectangles on the 2D parchment radar overlay.

### 3. Holy Angel System (聖天使大招)
- Every repaired building rewards **+20% Holy Energy**.
- Once the bar hits 100%, the **👼 SUMMON ANGEL** button lights up with a gold pulsing effect.
- Triggering the skill plays a **3-frame sequential flying Angel animation** in high-fidelity mode, vaporizing all standard minions instantly and dealing **250 damage** to the Vampire Lord.

### 4. Mid-Boss & Stage Boss Combat (雙魔王特殊攻擊)
- **Mid-Boss (中魔王)**: Spawns at **80 seconds**. Casts the **Slow (SLOWED!)** curse dropping speed to 2.5. Uses `middle boss.png` (or `middle boss2.png` for Stage 1). Defeating it awards **+40% Holy Energy**.
- **Stage Boss (大魔王)**: Arrives at **120 seconds** (Vampire Lord for Stage 1, Undead Knight for Stage 2, Demon Overlord for Stage 3). Casts **Weaken** and **Curse** spells.
- **Soundtrack transition**: Plays exploration BGM, then switches to the stage-specific combat theme upon Mid-Boss spawn:
  - Stage 1 Boss BGM: `music/boss/boss1/blood_moon_breaker.mp3`.
  - Stage 2 Boss BGM: `music/boss/boss2/crimson_castle.mp3`.
  - Stage 3 Boss BGM: `music/boss/boss3/undead_throne.mp3`.

### 5. Character Selection & Visual Graphics Modes (角色選擇與視覺切換)
- **Hunter Selection**: Pick between the **Demon Priest (👨‍⚖️)** or the **Demon Nun (👩‍⚕️)** on the start screen.
- **Classic Card Mode**: Uses canvas card textures. 100% CORS-proof and safe for direct USB double-clicking.
- **High-Fidelity Sprite Mode**: Loads PNG files from the assets directory to animate characters, enemies, the Holy Cross relic, and ultimate angel skills. (Requires a local web server or Firefox due to browser CORS policies).

### 6. Interactive Sound System (BGM 音樂系統)
- Plays **relic_of_the_undead.mp3** during exploration.
- Switch to the stage-specific boss battle soundtrack when the Mid-Boss/Boss spawns.
- Includes a **🔊 Music: On/Off** toggle button in the HUD to mute or play music at any time.

---

## 🛡️ Portability & Multi-Device Execution

- **CORS-Free Architecture**: Refactored from ES6 modules to standard script files tied to the `window.Game` namespace. This allows the game to run perfectly by simply double-clicking `index.html` locally (`file://` protocol), including from **USB flash drives**.
- **Android Touch Screen Optimized**: Uses `pointerdown` to capture inputs instantly. Incorporates viewport locks (`user-scalable=no`) and CSS `touch-action: none` to prevent default browser pinch-zoom gestures from interrupting action clicks.

---

## 📂 File Structure

```
paper_demon_hunter/
├── index.html           # Main game markup and script loaders
├── README.md            # Game manual (This file)
├── commands_log.md      # Command history and build progression
├── css/
│   └── style.css        # Layouts, radar sizes, starting instructions overlay, and animations
├── assets/              # Renamed from "圖資"
│   ├── holy_cross/      # Holy cross texture image (cross.png)
│   ├── ultimate/        # Angel ultimate frames (angel_1-3.png)
│   ├── enemies/         # Minions and Vampire Lord frame assets
│   ├── nun/             # Sister idle and action frames
│   └── priest/          # Priest idle and walking frames
├── music/               # Renamed from "音樂"
│   ├── relic_of_the_undead.mp3    # Main stage music
│   └── boss/            # Boss combat battle soundtracks (1-3)
└── js/
    ├── config.js        # Global constants (TOTAL_BUILDINGS, timers)
    ├── state.js         # Central runtime tracking states
    ├── textures.js      # Card cards, floating health bars, and asset preloader
    ├── scene.js         # Three.js viewport, lighting, and obstacles bounding boxes
    ├── ui.js            # Damage flashes, countdown timers, and floating text projectings
    ├── player.js        # Player movement controllers, animations, and debuff tickers
    ├── projectile.js    # Projectiles damage modifiers and collision loops
    ├── enemy.js         # Minion spawns, walking frames, and Boss special attack timers
    ├── building.js      # House repair thresholds and relic triggers
    ├── radar.js         # 2D Canvas parchment map overlay drawer
    └── main.js          # Clock cycles, BGM players, and orchestrator loop
```
