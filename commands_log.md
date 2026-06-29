# Work Log & Commands Backup

This document tracks all execution steps, commands run, and progress of the "Paper Demon Hunter: Sunset Relic War" project development.

---

## Log #1: Initial English Setup & Backups (2026-06-29)

### Actions Taken
1. **Initial Code Port**:
   - Copied original Chinese version to `D:\codex\paper_demon_hunter\backups\index_zh.html`.
   - Translated the game to English and created `D:\codex\paper_demon_hunter\index.html`.
2. **Translation Fix**:
   - Corrected translation text for ruined buildings from `' ruins'` to `'🏚️Ruined'` in `index.html` to keep emoji design.
3. **Backup Copy Command**:
   - Command: `Copy-Item -Path "D:\codex\paper_demon_hunter\index.html" -Destination "D:\codex\paper_demon_hunter\backups\index_en.html" -Force`
   - Purpose: Kept a copy of the single-file English game version.

---

## Log #2: Folder Structure Modularization (2026-06-29)

### Actions Taken
1. **Created Directories**:
   - Created `css/` for styles.
   - Created `js/` for Javascript modules.
2. **Extracted Style Sheet**:
   - Wrote styling configuration to `css/style.css`.
3. **Wrote Javascript Modules**:
   - `js/config.js`: Grid size and day duration configurations.
   - `js/state.js`: Global lists (entities, buildings, enemies, projectiles) and player/boss structures.
   - `js/textures.js`: 2D canvas card drawing engine with font resizing controls.
   - `js/scene.js`: Three.js rendering, lighting, camera shake, and resize binding.
   - `js/player.js`: Player initialization, pathing logic, and auto-shooting targeting.
   - `js/projectile.js`: Bullet meshes, linear path math, and collision checks.
   - `js/enemy.js`: Minions/Boss instantiation and combat behavior scripts.
   - `js/building.js`: Houses generation, repair progression, and relic triggers.
   - `js/radar.js`: Parchment map overlay updates.
   - `js/ui.js`: Screen floaters, damage filters, and end overlays.
   - `js/main.js`: Main clock updates, input triggers, and orchestrator loop.
4. **Refactored Entry Point**:
   - Overwrote `index.html` to clear inline scripts/styles, link to `css/style.css`, load Three.js global CDN, and run `js/main.js` as an ES6 module.

---

## Log #3: Responsive UI & Multi-Device Optimization (2026-06-29)

### Actions Taken
1. **Added Flex Container (`#right-panel`)**:
   - In `index.html`, wrapped the radar container and the time display into a single `#right-panel` box. This ensures layout items stack cleanly without manual top coordinates.
2. **Upgraded CSS Stylesheet (`css/style.css`)**:
   - Replaced absolute coordinate values on the radar container and the time display with flow-based CSS properties.
   - Constrained the radar aspect-ratio to `1 / 1` to prevent image stretching during rescales.
   - Introduced comprehensive `@media (max-width: 600px)` rules to shrink fonts, scale HUD controls, and downsize the radar to `100px` for mobile viewports.

---

## Log #4: Global Namespace Setup for CORS-Free Local Execution (2026-06-29)

### Actions Taken
1. **Removed ES6 Modules**:
   - Converted all JavaScript files in `js/` from ES6 modules (`import`/`export`) to standard script declarations.
   - Tied all game constants, states, and functions to the `window.Game` namespace to guarantee execution on any local browser protocol (like `file://` or USB drives).
2. **Updated Sequential Loading**:
   - Overwrote `index.html` to load all JS modules in dependency order, finishing with `js/main.js` which triggers `Game.init()`.
3. **Android & Touchscreen Compatibility**:
   - Verified that `pointerdown` controls remain fully operational under touch interfaces.
   - Retained the `user-scalable=no` meta viewport and `touch-action: none` rules to prevent zoom locks and gestures from interfering with touch controls.

---

## Log #5: Advanced Combat, 3D Obstacles, and Skill Upgrades (2026-06-29)

### Actions Taken
1. **Reworked UI & HUD**:
   - Removed the top-left player HP bar and the bottom controls hint text in `index.html`.
   - Added a `120s` countdown timer for the boss's arrival in the HUD.
   - Added a Holy Energy bar and a Purple/Gold glowing Summon Angel button.
2. **Added 3D City Obstacles (Non-Passable)**:
   - Generated 10 grey building structures in `js/scene.js` using `THREE.BoxGeometry`.
   - Integrated bounding box check (`checkCollision`) in `js/player.js` to block player movement, featuring a sliding algorithm that allows smooth navigation around block corners.
   - Displayed obstacles as solid grey rectangles on the 2D parchment radar overlay.
3. **Implemented 3D Floating Health Bars**:
   - Created a canvas-based health bar generator `createHealthBarTexture` in `js/textures.js`.
   - Attached a floating 3D `THREE.Sprite` above the Player, Minions, and the Boss which dynamically scales and updates health upon taking damage.
4. **Holy Angel Skill**:
   - Increased houses count to 10. Repairing a house awards 20% Holy Energy.
   - At 100%, clicking the Summon button triggers a full-screen gold flash, vaporizing all standard minions and dealing 250 damage to the Vampire Lord.
5. **Vampire Lord Combat Attacks**:
   - Boss casts 3 special spells every 9 seconds:
     - **Slow**: Drops player speed to 2.5 for 5 seconds (cyan text `❄️SLOWED!`).
     - **Weaken**: Drops player bullet damage to 8 and turns bullets dark purple (magenta text `❌WEAKENED!`).
     - **Curse**: Inflicts 8 HP continuous damage per second for 5 seconds (red text `🩸CURSED!`).

---

## Log #6: Interactive Start Overlay & Project Documentation (2026-06-29)

### Actions Taken
1. **Added `#start-overlay`**:
   - In `index.html`, added a beautiful starting instruction overlay detailing game objectives, controls, Holy Energy SUMMON button, and boss curses.
   - Styled the overlay in `css/style.css` with a dark parchment background (`rgba(0,0,0,0.95)`), a scrollable `#instructions-box`, and a golden glowing `"Start Hunter Mission"` button.
2. **Linked Start Trigger**:
   - In `js/state.js`, set initial `gameActive` state to `false` to pause game ticks.
   - In `js/main.js`, bound click listener to the start button to hide the overlay, activate `state.gameActive = true`, and align the animation loop clock.
3. **Created Project documentation**:
   - Created [README.md](file:///D:/codex/paper_demon_hunter/README.md) containing the game manual, controls list, features list, and file structure breakdown.

---

## Log #7: Asset Renaming, High-Fi Sprites, and BGM Audio Systems (2026-06-29)

### Actions Taken
1. **Renamed Asset Folders to English**:
   - Renamed `圖資` -> `assets/` and all internal folders and files to lowercase English names.
   - Corrected files inside `assets/enemies/boss/` to map `boss_1.png` and `boss_2.png` cleanly.
   - Renamed `音樂` -> `music/` and all internal subfolders to `music/relic_of_the_undead.mp3` and `music/boss/theme_1-3`.
   - Cleared original Chinese asset folders to maintain codebase cleanliness.
2. **Added Character Choice & Visual Modes to HUD**:
   - Appended a choice grid in `#start-overlay` to choose characters (**Priest** or **Nun**) and visual modes (**Classic Cards** or **High-Fi Sprites**).
   - Styled cards, outlines, and select highlights in `css/style.css`.
3. **Implemented Texture Loader & Sprite Animations**:
   - Added `loadGameTextures()` in `js/textures.js` to preload PNG files. Included automatic `alert` and console warning fallbacks if CORS blocks local images (classic retro card fallback).
   - Animated the Priest (6 walk frames) and Nun (6 action frames) in `js/player.js` during movement.
   - Animated minions (A/B) and the Vampire Lord walking cycles in `js/enemy.js`.
   - Mapped `cross.png` to completed relic buildings in `js/building.js`.
   - Mapped `angel_1-3.png` sequence for the screen-clearing Holy Angel ultimate in `js/main.js`.
4. **Integrated Soundtrack System**:
   - Play BGM tracks dynamically: `relic_of_the_undead.mp3` during exploration, and a random boss theme (`blood_moon_breaker.mp3`, `crimson_castle.mp3`, or `undead_throne.mp3`) during boss battles.
   - Created a Music Mute button in the HUD.

---

## Log #8: Stage-specific Mid-Boss & Boss 1 Soundtrack & Asset Paths (2026-06-29)

### Actions Taken
1. **Organized Audio Folders**:
   - Moved the boss soundtracks into `boss1`, `boss2`, and `boss3` folders inside `music/boss/`.
   - Exploration BGM is `music/relic_of_the_undead.mp3`, and Stage 1 Boss BGM is mapped to `music/boss/boss1/blood_moon_breaker.mp3`.
2. **Added 80-Second Mid-Boss Spawning**:
   - Implemented `spawnMidBoss()` in `js/enemy.js` triggered at 80s countdown.
   - Spawns the Mid-Boss with 250 HP using `assets/enemies/boss1/middle boss2.png` as its graphic sprite.
   - Triggers the Stage 1 Boss BGM (`music/boss/boss1/blood_moon_breaker.mp3`).
   - The Mid-Boss is bound to periodically cast the **Slow** curse on the player.
3. **Updated Final Boss & Minion Assets**:
   - The Stage 1 Final Boss spawns at 120s using `assets/enemies/boss1/boss_2.png`.
   - The Final Boss is bound to cast **Weaken** and **Curse** spells.
   - Minions randomly load one of the three single-frame graphic cards: `minion_a1.png`, `minion_a2.png`, or `minion_a3.png`.
4. **Updated Double HUD Timers**:
   - Modified HUD update loop to show `Mid-Boss Arrival: XXs` followed by `Vampire Lord Arrival: XXs`.

---

## Log #9: 3-Stage Progression, Ground Textures, and Giant City Maze (2026-06-29)

### Actions Taken
1. **Designed & Added Ground Textures**:
   - Generated seamless ground images for Stage 1-3 using image generation.
   - Saved assets in `assets/ground/stage_1.png` (cobblestones), `stage_2.png` (crimson stone), and `stage_3.png` (rune obsidian).
   - Rendered repeating ground meshes in `js/scene.js` using `createGround()`.
2. **Built 3-Stage Progression Loop**:
   - Defeating the stage final boss with the relic displays a `#victory-overlay` prompting the player to advance.
   - Advancing calls `advanceToNextStage()` in `js/main.js` which increments `state.stage`, wipes old meshes using `clearSceneObjects()`, randomizes obstacles and buildings, resets stats, and updates textures and BGM dynamically.
   - Map stage-specific boss/mid-boss assets from `boss1`, `boss2`, and `boss3` folders.
3. **Scaled up Obstacles & Buildings (Living City Maze)**:
   - Obstacles scaled up to width/depth `12 to 18`, height `25 to 40` (3x character scale).
   - Buildings scaled up to scale `12` (position `y = 6.0`).
   - Added collision boundary checking for buildings in `checkCollision()` to block characters, transforming the play area into a true living maze.
   - Enlarged obstacle and building markers on the 2D canvas radar overlay.

---

## Log #10: Landing Selection Page, play.html, background Renaming, and Python Chroma Keying (2026-06-29)

### Actions Taken
1. **Renamed Files & Background Folders**:
   - Renamed `index.html` to `play.html`.
   - Renamed folder `baclgtound` -> `background` and its internal image to `background/background.png`.
2. **Created New Selection Landing index.html**:
   - Created `index.html` as the landing page showing a layout with the chapel sunset background.
   - Left side features a Nun card showing `assets/nun/actions/nun_action_1.png`.
   - Right side features a Priest card showing `assets/priest/walk/priest_walk_1.png`.
   - Bottom panel allows choosing Classic Cards vs High-Fi Sprites, and the "START MISSION" button redirects to `play.html?character=...&mode=...`.
3. **Chroma Key Green Screen Removal (Python)**:
   - Created `chroma_key.py` in the project root to key out green pixels (`(0, 255, 0)`) in all sprite assets.
   - Ran `chroma_key.py` successfully, replacing the green screens in characters (Priest, Nun, weapons), enemies (minions, bosses), and angel ultimate frames with transparent backgrounds.
4. **Auto-Start & Asset Mapping Updates**:
   - Updated `js/main.js` to detect query parameters `character` and `mode`. Auto-starts the game immediately on load if parameters are present.
   - Updated `js/textures.js` to map updated Stage 1 boss assets (`middle boss1.png`, `boss_1.png`).

---

## Log #11: Full UI & HUD Chinese Localization (2026-06-29)

### Actions Taken
1. **Translated Entry & Instruction Overlays**:
   - Translated headers, descriptions, card selectors, and buttons in `index.html` and `play.html` to Traditional Chinese.
   - Customized instruction details (objectives, controls, ultimate angel mechanics, and boss curses description) to Chinese.
2. **Translated Game HUD & Controls**:
   - HUD text updated: `魔王降臨倒數`, `任務目標：在魔王降臨前修復房屋以尋找聖物！`, `聖光能量`, and `🔊 背景音樂：開啟` / `🔇 背景音樂：關閉`.
   - Victory stage advance overlay and ultimate victory text translated.
3. **Translated Sprite Card Titles & Floating Pop-ups**:
   - Floating notifications: `🔧修復中!`, `🏠修復完成 (無聖物)`, `❄️被減速！`, `❌被弱化！`, `🩸流血中！`, `🦇召喚小怪！`, and `👼 聖天使已降臨！`.
   - Card fallback title labels: `聖經修女`, `驅魔神父`, `惡魔小兵`, `中魔王`, `大魔王`, `不死騎士`, and `深淵魔皇`.

---

## Log #12: Camera Drag Rotation, Speed Upgrades, and High-Fi Building/Wall Textures (2026-06-29)

### Actions Taken
1. **Generated & Applied High-Fi Ground/Building/Wall Textures**:
   - Generated new graphic textures: `ruined_house.png`, `intact_house.png`, and a seamless `wall_texture.png`.
   - Wrote and ran `process_assets.py` to strip white backgrounds and save processed PNG textures: `assets/buildings/ruined.png`, `assets/buildings/intact.png`, and `assets/wall/wall.png`.
   - Preloaded new assets in `js/textures.js`.
   - Updated `js/building.js` to return PNG textures (`building_ruined` and `building_intact`) instead of flat-colored cards in High-Fi mode.
   - Updated `js/scene.js` to apply repeating stone-wall textures to 3D obstacle columns instead of flat grey colors.
2. **Implemented Camera Drag Rotation (Middle / Right Mouse Button)**:
   - Added window-level event listeners to `js/main.js` supporting middle-mouse (`button 1`) and right-click (`button 2`) dragging. Disabled default autoscroll and context menu triggers.
   - Updated camera loop calculations in `js/main.js` to dynamically follow the player based on `state.cameraAngle` and offset lookAt target rotation coordinates.
   - Filtered out middle and right clicks in `onPointerDown` to prevent accidental player movements during rotation drag.
3. **Implemented Dynamic Speed Scaling**:
   - Added `enemiesDefeated` tracking.
   - Updated `js/projectile.js` and `js/main.js` to increment `state.enemiesDefeated` when enemies are vanquished by bullets or holy summons.
   - Triggers `速度提升！⚡` floating alert whenever a multiple of 3 enemies is defeated.
   - Updated player speed formula in `js/player.js` to: `baseSpeed * (1 + floor(enemiesDefeated / 3))`. Resets counter to `0` at stage transition.
4. **Created local web server runner**:
   - Created `run_game.bat` inside the project root to run Python HTTP server locally and bypass local file CORS constraints.

---

## Log #13: Setting Default Mode to High-Fi Sprites & CORS User Guidance (2026-06-29)

### Actions Taken
1. **Adjusted Defaults to High-Fi Mode**:
   - Updated `js/state.js` to set `useGraphicsMode: true` by default.
   - Updated `play.html` start overlay configuration to make the "精美圖資" (High-Fi) card active by default.
2. **Refined CORS Restriction Alert Instructions**:
   - Updated the fallback alert in `js/textures.js` to explicitly guide the user to run `run_game.bat` to enjoy the high-fidelity mode with textures, rather than silently falling back to cards.

---

## Log #14: Pure Sprite Graphics Mode - Classic Cards Removed (2026-06-29)

### Actions Taken
1. **Removed Classic Cards Mode Completely**:
   - Hardcoded `useGraphicsMode` to `true` globally in `js/state.js` and `js/main.js`. The game now exclusively loads and renders 3D sprites and textures.
2. **Simplified User Interfaces**:
   - Removed "經典紙牌" / "精美圖資" toggle selectors from `index.html` and `play.html` start screens.
   - Cleaned up control descriptions by removing card-related instructions.
3. **Removed CORS Warnings & Fallbacks**:
   - Completely deleted CORS warning popups and fallback variables in `js/textures.js`. Texture load errors will only log silently to console.

---

## Log #15: Zero-Configuration Local Play via Base64 Texture Embedding (2026-06-29)

### Actions Taken
1. **Compressed Asset Files**:
   - Resized character sprites to 256x256 and ground assets to 512x512 using PIL script, lowering total image assets size from 43MB to 4MB.
2. **Created JavaScript Asset Embedder**:
   - Wrote and executed `embed_assets.py` to compile all 33 PNG files into base64 data URIs inside `js/embedded_assets.js`.
3. **Integrated Asset Bundle in Textures Loader**:
   - Imported `js/embedded_assets.js` script tag in `play.html`.
   - Updated `js/textures.js` to load textures from `window.Game.embeddedAssets[key]` data URIs, completely bypassing browser file:// CORS filesystem restrictions.
   - The game now loads and displays 3D characters, wall textures, ground layers, and buildings successfully upon direct local file double click.

---

## Log #16: Texture Loader Race-Condition Fix & HUD Cache Alert (2026-06-29)

### Actions Taken
1. **Fixed Texture Loading Race Condition**:
   - Refactored `window.Game.loadGameTextures` in `js/textures.js` to ensure the `onComplete` callback is *only* called after all textures have completed their loading attempts (success or failure). This prevents the game loop from starting prematurely with partial/undefined textures.
2. **Added HUD Diagnostics Warning**:
   - Updated `updateHud` in `js/ui.js` to check for texture loading failures.
   - If any assets fail, the HUD status text dynamically warning: `⚠️ 貼圖載入失敗 (X 個)。請按 Ctrl + F5 強制重新整理清除瀏覽器快取！`. This helps diagnose and solve browser cache issues instantly during local testing.

---

## Log #17: Cinematic Angel Summon & Scaling Minion Spawn Rates (2026-06-29)

### Actions Taken
1. **Created Cinematic Descending Angel Summon**:
   - Modified `summonHolyAngel()` in `js/main.js` to start the Angel div off-screen at `-30vh` and animate its top coordinate to `50%` center.
   - Looped frames `angel_1`, `angel_2`, and `angel_3` sequentially during descent to show wing flapping animation.
   - Delayed the golden flash, camera shake, and wide-area damage until the Angel fully arrives at the center (1.0s delay).
2. **Dynamic Minion Spawn Rates**:
   - Updated the spawning condition inside the game loop `animate()` in `js/main.js`.
   - Decreased the minion spawn interval dynamically from 3.0s down to a minimum of 0.8s, and increased the maximum active minions cap, scaling proportionally with `enemiesDefeated` (player speed upgrade level).

---

## Log #18: Dynamic Character Orientation & Facing Direction (2026-06-29)

### Actions Taken
1. **Walk Facing Orientation**:
   - Updated the player movement controller in `js/player.js` to inspect the movement direction vector X-value (`dir.x`).
   - If walking left (`dir.x < -0.05`), the sprite scales horizontally to `-4`. If walking right (`dir.x > 0.05`), it scales back to `4`.
2. **Combat Facing Orientation**:
   - Updated `window.Game.shoot` in `js/projectile.js` to determine the difference between target X and player X coordinates.
   - The player sprite automatically flips left or right to face their combat targets when shooting projectiles while stationary.

---

## Log #19: Player Holy PointLight Aura & Cloned Texture Rendering Fixes (2026-06-29)

### Actions Taken
1. **Implemented Player PointLight Holy Aura**:
   - Added `THREE.PointLight` initialization inside `createPlayer` in `js/player.js` with a warm white-golden light (`0xfff5d7`).
   - Programmed the light to follow player coordinates during update ticks.
   - Dynamically scaled light intensity based on time: brighter during night stages (`intensity = 3.5`) and dimmed during daytime (`intensity = 1.5`), illuminating the environment dynamically.
2. **Fixed Cloned Wall and Ground Textures Rendering**:
   - Added `needsUpdate = true` on the cloned texture mapping instances for both walls and ground in `js/scene.js`. This forces the GPU to upload wrapping updates, successfully rendering stone brick wall textures and stage floor maps.

---

## Log #20: Map Textures Deferred Instantiation & Sprite Flip Jerkiness Fix (2026-06-29)

### Actions Taken
1. **Deferred Ground & Obstacles Instantiation**:
   - Moved `createGround()` and `createObstacles()` out of `initScene` in `js/scene.js` (which runs before assets load) and placed them inside the `loadGameTextures` callbacks in `js/main.js`.
   - Obstacles and ground planes are now created *after* the textures exist in memory, successfully displaying tiled stone brick walls and stage ground textures.
2. **Resolved Sprite Flip Conflicted Jerking**:
   - Updated the shooting logic in `js/projectile.js` to only flip the character's facing scale if the player is stationary (`moveDist <= 0.1`).
   - While moving, walking direction takes complete priority, resolving the conflict where the sprite would rapidly flicker/jerk back and forth when running and auto-shooting in opposite directions.

---

## Log #21: Physical Holy Cross Relic Spawn on Repair (2026-06-29)

### Actions Taken
1. **Physical Holy Cross Spawning**:
   - Modified `repairBuilding()` in `js/building.js`. When the building containing the relic is fully repaired, a physical 3D Sprite showing `cross.png` is instantiated directly above the roof (`b.pos.y + 3.5`).
2. **Relic Animation**:
   - Added bobbing and swaying update calculations inside the game loop in `js/main.js` for `window.Game.relicSprite`. The cross now bobs up and down using a fast sine wave and rotates slightly to indicate a holy aura.
   - Disposed of the relic sprite and materials properly in `clearSceneObjects()` in `js/scene.js`.

---

## Log #22: Thrown Spinning Weapon Projectiles (2026-06-29)

### Actions Taken
1. **Preloaded Weapon Graphics**:
   - Added `priest_weapon` (`assets/priest/weapon/priest_weapon.png`) and `nun_weapon` (`assets/nun/weapon/nun_weapon.png`) to `assetsToLoad` inside `js/textures.js`.
2. **Replaced Projectile Spheres with Weapons**:
   - Updated `window.Game.shoot()` in `js/projectile.js` to create a `THREE.Sprite` using the player character's weapon texture (`priest_weapon` or `nun_weapon`) instead of the default grey `SphereGeometry` mesh.
3. **Animated Projectiles**:
   - Added a rotation step (`material.rotation += 12 * dt`) in `updateProjectiles()` in `js/projectile.js` to animate the weapons spinning dynamically in 3D space as they fly.
   - Tints the weapon sprite purple (`0xaa66aa`) if the player is currently weakened.

---

## Log #23: Simultaneous Three-Angel Trinity Summon (2026-06-29)

### Actions Taken
1. **Trinity Summon Layout**:
   - Modified `summonHolyAngel()` in `js/main.js` to build a wide container `angelDiv` of `80vw` width and `70vh` height.
   - Positioned three separate image elements corresponding to `angel_1`, `angel_2`, and `angel_3` side-by-side in a triangle formation:
     - **Center** (`angel_1`): front and center, scaled to `50vh` height.
     - **Left & Right Flanks** (`angel_2`, `angel_3`): positioned lower and wider, scaled to `42vh` height with a lower z-index and `0.9` opacity.
2. **Synchronized Descent**:
   - The three angels descend from the heavens together as a unit from `-50vh` off-screen to `50%` center.
   - Screen flash, camera shake, and holy vaporization damage trigger simultaneously once the trio arrives in the center (1.0s delay).

















