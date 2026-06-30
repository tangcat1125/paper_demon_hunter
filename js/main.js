// Main Application Orchestrator: Input handlers, timers, loop runner, and Holy Angel summon (Global Namespace)

window.Game = window.Game || {};

let clock = new THREE.Clock();
let minionSpawnTimer = 0;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDraggingCamera = false;
let previousMouseX = 0;
let primaryPointerId = null;
let primaryPointerDown = null;
let primaryPointerDragging = false;
const primaryDragThreshold = 10;

function updateCameraModeButton() {
    const btn = document.getElementById('camera-mode-toggle');
    if (!btn) return;
    const isTop = window.Game.state.cameraViewMode === 'top';
    btn.innerText = isTop ? '🧭 視角：上視' : '🧭 視角：斜視';
}

function toggleCameraMode() {
    const state = window.Game.state;
    state.cameraViewMode = state.cameraViewMode === 'top' ? 'angled' : 'top';
    state.cameraManualTimer = 0;
    if (window.Game.handleResize) {
        window.Game.handleResize();
    }
    updateCameraModeButton();
}

// Setup HTML5 Audio objects
let bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.src = 'music/relic_of_the_undead.mp3';

let bossAudio = new Audio();
bossAudio.loop = true;

const bossThemes = [
    'music/boss/boss1/blood_moon_breaker.mp3',
    'music/boss/boss2/crimson_castle.mp3',
    'music/boss/boss3/undead_throne.mp3'
];

window.Game.playBossBgm = function() {
    bgmAudio.pause();
    const state = window.Game.state;
    if (!state.audioEnabled) return;
    // Play the stage-specific boss BGM
    const stageBossBgms = [
        'music/boss/boss1/blood_moon_breaker.mp3',
        'music/boss/boss2/crimson_castle.mp3',
        'music/boss/boss3/undead_throne.mp3'
    ];
    bossAudio.src = stageBossBgms[state.stage - 1] || stageBossBgms[0];
    bossAudio.play().catch(e => console.log("Audio play blocked:", e));
};

window.Game.stopAllMusic = function() {
    bgmAudio.pause();
    bossAudio.pause();
};

window.Game.init = function() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const state = window.Game.state;

    state.cycleTier = window.Game.getCycleTier();
    const difficulty = window.Game.getDifficultyProfile();

    // Reset initial timer from config
    state.timeToMidBoss = difficulty.midBossTimer;
    state.timeToBoss = difficulty.bossTimer;

    // Setup scene, renderer, lights, and obstacles
    window.Game.initScene(container);

    // Attach event listeners
    window.addEventListener('resize', window.Game.handleResize);
    
    // Drag camera rotation listeners (middle click / button 1, and right click / button 2)
    window.Game.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
    
    window.addEventListener('pointerdown', (e) => {
        if (e.button === 1 || e.button === 2) {
            isDraggingCamera = true;
            previousMouseX = e.clientX;
            e.preventDefault();
            return;
        }

        if (e.button === 0 && e.target === window.Game.renderer.domElement) {
            primaryPointerId = e.pointerId;
            primaryPointerDown = { x: e.clientX, y: e.clientY };
            previousMouseX = e.clientX;
            primaryPointerDragging = false;
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (isDraggingCamera) {
            const deltaX = e.clientX - previousMouseX;
            state.cameraAngle = (state.cameraAngle || 0) - deltaX * 0.008;
            state.cameraManualTimer = 6.0;
            previousMouseX = e.clientX;
            return;
        }

        if (primaryPointerId === e.pointerId && primaryPointerDown) {
            const movedX = e.clientX - primaryPointerDown.x;
            const movedY = e.clientY - primaryPointerDown.y;
            if (primaryPointerDragging || Math.hypot(movedX, movedY) >= primaryDragThreshold) {
                primaryPointerDragging = true;
                const deltaX = e.clientX - previousMouseX;
                state.cameraAngle = (state.cameraAngle || 0) - deltaX * 0.008;
                state.cameraManualTimer = 6.0;
                previousMouseX = e.clientX;
            }
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (e.button === 1 || e.button === 2) {
            isDraggingCamera = false;
            return;
        }

        if (primaryPointerId === e.pointerId) {
            if (!primaryPointerDragging && e.target === window.Game.renderer.domElement) {
                onPointerTap(e);
            }
            primaryPointerId = null;
            primaryPointerDown = null;
            primaryPointerDragging = false;
        }
    });

    // Attach Holy Angel Summon click handler
    const summonBtn = document.getElementById('summon-btn');
    if (summonBtn) {
        summonBtn.addEventListener('click', summonHolyAngel);
    }

    // Attach BGM mute toggle handler
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            state.audioEnabled = !state.audioEnabled;
            musicToggle.innerText = state.audioEnabled ? "🔊 背景音樂：開啟" : "🔇 背景音樂：關閉";
            if (!state.audioEnabled) {
                window.Game.stopAllMusic();
            } else {
                if (state.gameActive) {
                    if (state.bossSpawned) {
                        bossAudio.play().catch(e => console.log("Audio play blocked:", e));
                    } else {
                        bgmAudio.play().catch(e => console.log("Audio play blocked:", e));
                    }
                }
            }
        });
    }

    const cameraModeToggle = document.getElementById('camera-mode-toggle');
    if (cameraModeToggle) {
        cameraModeToggle.addEventListener('click', toggleCameraMode);
        updateCameraModeButton();
    }

    window.addEventListener('keydown', (e) => {
        if ((e.key === 'v' || e.key === 'V') && state.gameActive) {
            toggleCameraMode();
        }
    });

    // Setup starting overlay selection options
    const priestCard = document.getElementById('char-priest');
    const nunCard = document.getElementById('char-nun');
    if (priestCard && nunCard) {
        priestCard.addEventListener('click', () => {
            state.selectedCharacter = 'priest';
            priestCard.classList.add('active');
            nunCard.classList.remove('active');
        });
        nunCard.addEventListener('click', () => {
            state.selectedCharacter = 'nun';
            nunCard.classList.add('active');
            priestCard.classList.remove('active');
        });
    }



    // Update HUD initially
    window.Game.updateHud();

    // Check URL parameters for seamless selection screen auto-start
    const urlParams = new URLSearchParams(window.location.search);
    const urlChar = urlParams.get('character');
    const urlMode = urlParams.get('mode');

    // Attach Start Game button listener (trigger assets loading & BGM)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.innerText = "Loading Mission...";
            startBtn.disabled = true;
            
            // Load high-fi textures if selected, then start game
            window.Game.loadGameTextures(() => {
                const startOverlay = document.getElementById('start-overlay');
                if (startOverlay) {
                    startOverlay.style.display = 'none';
                }

                // Instantiate map assets, player & houses after textures are loaded
                window.Game.createGround();
                window.Game.createObstacles();
                const safeSpawn = window.Game.findSafePlayerSpawn ? window.Game.findSafePlayerSpawn() : new THREE.Vector3(0, 1.5, 0);
                state.player.pos.copy(safeSpawn);
                state.player.targetPos.copy(safeSpawn);
                window.Game.createPlayer();
                window.Game.createBuildings();
                window.Game.ensurePlayerFree && window.Game.ensurePlayerFree();

                // Spawn initial minions
                for (let i = 0; i < 3; i++) {
                    window.Game.spawnMinion(true);
                }

                // Start BGM
                if (state.audioEnabled) {
                    bgmAudio.play().catch(e => console.log("BGM autoplay blocked:", e));
                }

                state.gameActive = true;
                clock.getDelta(); // Reset clock
            });
        });
    }

    // Auto-start check from index.html selection page
    if (urlChar) {
        state.selectedCharacter = (urlChar === 'nun') ? 'nun' : 'priest';
        state.useGraphicsMode = true;
        
        // Hide start overlay directly
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';

        // Auto-load textures and start
        window.Game.loadGameTextures(() => {
            window.Game.createGround();
            window.Game.createObstacles();
            const safeSpawn = window.Game.findSafePlayerSpawn ? window.Game.findSafePlayerSpawn() : new THREE.Vector3(0, 1.5, 0);
            state.player.pos.copy(safeSpawn);
            state.player.targetPos.copy(safeSpawn);
            window.Game.createPlayer();
            window.Game.createBuildings();
            window.Game.ensurePlayerFree && window.Game.ensurePlayerFree();

            for (let i = 0; i < 3; i++) {
                window.Game.spawnMinion(true);
            }

            if (state.audioEnabled) {
                bgmAudio.play().catch(e => console.log("BGM autoplay blocked:", e));
            }

            state.gameActive = true;
            clock.getDelta(); // Reset clock
        });
    }

    // Start loop
    animate();
};

function summonHolyAngel() {
    const state = window.Game.state;
    const scene = window.Game.scene;
    if (state.holyEnergy < 100) return;

    // 1. Consume all energy
    state.holyEnergy = 0;
    window.Game.updateHud();

    // 2. Show the Holy Cross first so the summon feels like a relic breakthrough.
    const crossOverlay = document.createElement('div');
    crossOverlay.style.position = 'absolute';
    crossOverlay.style.left = '50%';
    crossOverlay.style.top = '50%';
    crossOverlay.style.transform = 'translate(-50%, -50%) scale(0.4)';
    crossOverlay.style.width = '42vw';
    crossOverlay.style.maxWidth = '480px';
    crossOverlay.style.zIndex = '97';
    crossOverlay.style.pointerEvents = 'none';
    crossOverlay.style.opacity = '0';
    crossOverlay.style.transition = 'transform 0.9s ease-out, opacity 0.6s ease-out';
    const crossImg = document.createElement('img');
    crossImg.src = (window.Game.embeddedAssets && window.Game.embeddedAssets.cross) ? window.Game.embeddedAssets.cross : 'assets/holy_cross/cross.png';
    crossImg.style.width = '100%';
    crossImg.style.display = 'block';
    crossOverlay.appendChild(crossImg);
    document.body.appendChild(crossOverlay);

    window.Game.showFloatingText(state.player.pos, "蒐集到完整聖物", "#ffd700");

    setTimeout(() => {
        crossOverlay.style.opacity = '1';
        crossOverlay.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 30);

    // 3. Create flying Angel Sprite container starting off-screen at the top of the viewport
    const angelDiv = document.createElement('div');
    angelDiv.style.position = 'absolute';
    angelDiv.style.left = '50%';
    angelDiv.style.top = '-50vh'; 
    angelDiv.style.transform = 'translate(-50%, -50%)';
    angelDiv.style.width = '80vw';
    angelDiv.style.height = '70vh';
    angelDiv.style.zIndex = '98';
    angelDiv.style.pointerEvents = 'none';
    angelDiv.style.transition = 'top 1.0s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease-out';
    
    if (state.useGraphicsMode) {
        const getAsset = (key) => (window.Game.embeddedAssets && window.Game.embeddedAssets[key]) ? window.Game.embeddedAssets[key] : `assets/ultimate/${key}.png`;
        
        // Center Angel (Angel 1)
        const img1 = document.createElement('img');
        img1.src = getAsset('angel_1');
        img1.style.position = 'absolute';
        img1.style.left = '50%';
        img1.style.top = '40%';
        img1.style.transform = 'translate(-50%, -50%)';
        img1.style.maxHeight = '50vh';
        img1.style.maxWidth = '30vw';
        img1.style.zIndex = '10';
        angelDiv.appendChild(img1);

        // Left Angel (Angel 2)
        const img2 = document.createElement('img');
        img2.src = getAsset('angel_2');
        img2.style.position = 'absolute';
        img2.style.left = '25%';
        img2.style.top = '55%';
        img2.style.transform = 'translate(-50%, -50%)';
        img2.style.maxHeight = '42vh';
        img2.style.maxWidth = '25vw';
        img2.style.zIndex = '9';
        img2.style.opacity = '0.9';
        angelDiv.appendChild(img2);

        // Right Angel (Angel 3)
        const img3 = document.createElement('img');
        img3.src = getAsset('angel_3');
        img3.style.position = 'absolute';
        img3.style.left = '75%';
        img3.style.top = '55%';
        img3.style.transform = 'translate(-50%, -50%)';
        img3.style.maxHeight = '42vh';
        img3.style.maxWidth = '25vw';
        img3.style.zIndex = '9';
        img3.style.opacity = '0.9';
        angelDiv.appendChild(img3);
    } else {
        angelDiv.innerHTML = "<h1 style='position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 70px; color: #ffd700; text-shadow: 0 0 20px gold; font-family: sans-serif; white-space: nowrap;'>👼👼👼 三聖天使降臨</h1>";
    }
    
    document.body.appendChild(angelDiv);

    // Trigger smooth descent to the center of the viewport
    setTimeout(() => {
        crossOverlay.style.opacity = '0';
        crossOverlay.style.transform = 'translate(-50%, -50%) scale(0.85)';
        angelDiv.style.top = '50%';
    }, 50);

    // After 1.0s (Angel reaches center): Emit light, shake camera, and vaporize the army!
    setTimeout(() => {
        // 3. Play golden divine screen flash
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = '#ffd700';
        flash.style.opacity = '1';
        flash.style.transition = 'opacity 1.0s ease-out';
        flash.style.zIndex = '99';
        flash.style.pointerEvents = 'none';
        document.body.appendChild(flash);
        
        setTimeout(() => { flash.style.opacity = '0'; }, 50);
        setTimeout(() => { flash.remove(); }, 1050);

        // Shake camera to emphasize the impact
        window.Game.shakeCamera();

        // 4. Float summon warning
        window.Game.showFloatingText(state.player.pos, "👼 聖天使已降臨！", "#ffd700");

        // 5. Wide-area damage logic
        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const e = state.enemies[i];
            if (e.isBoss) {
                // Boss takes heavy damage
                e.hp -= 250;
                window.Game.showFloatingText(e.pos, "-250 (神聖衝擊!)", "#ffd700");
                window.Game.updateEntityHealthBar(e);

                if (e.hp <= 0) {
                    scene.remove(e.sprite);
                    if (e.hpBarSprite) scene.remove(e.hpBarSprite);
                    const entIdx = state.entities.indexOf(e.sprite);
                    if (entIdx > -1) state.entities.splice(entIdx, 1);
                    state.enemies.splice(i, 1);
                    state.enemiesDefeated = (state.enemiesDefeated || 0) + 1;
                    if (window.Game.addHolyDemonEnergy) {
                        window.Game.addHolyDemonEnergy(5);
                    }
                    if (state.enemiesDefeated % 3 === 0) {
                        window.Game.showFloatingText(state.player.pos, "速度提升！⚡", "#00ff00");
                    }

                    if (state.player.relicFound) {
                        if (window.Game.stageCleared) {
                            window.Game.stageCleared();
                        } else {
                            window.Game.gameOver("🎉 勝利！關卡通關！");
                        }
                    } else {
                        const bossNames = ["大魔王", "不死騎士", "深淵魔皇"];
                        const currentBoss = bossNames[state.stage - 1] || '大魔王';
                        window.Game.gameOver(`❌ 你擊敗了 ${currentBoss}，但沒有獲得聖物，他在黑暗中復活了... (請再試一次)`);
                    }
                }
            } else {
                // Minions are vaporized instantly
                scene.remove(e.sprite);
                if (e.hpBarSprite) scene.remove(e.hpBarSprite);
                const entIdx = state.entities.indexOf(e.sprite);
                if (entIdx > -1) state.entities.splice(entIdx, 1);
                state.enemies.splice(i, 1);
                    state.enemiesDefeated = (state.enemiesDefeated || 0) + 1;
                    if (window.Game.addHolyDemonEnergy) {
                        window.Game.addHolyDemonEnergy(5);
                    }
                    if (state.enemiesDefeated % 3 === 0) {
                        window.Game.showFloatingText(state.player.pos, "速度提升！⚡", "#00ff00");
                    }
                window.Game.showFloatingText(e.pos, "已蒸發！", "#ffd700");
            }
        }
    }, 1000);

    // After 2.2s, fade out the angel sprite
    setTimeout(() => {
        angelDiv.style.opacity = '0';
        crossOverlay.style.opacity = '0';
    }, 2200);
    setTimeout(() => {
        angelDiv.remove();
        crossOverlay.remove();
    }, 3000);
}

window.Game.updatePlayerEnergyBar = function() {
    const state = window.Game.state;
    const p = state.player;
    if (!p || !p.energyBarSprite || !p.energyBarSprite.material) return;

    const pct = Math.max(0, Math.min(1, (p.holyDemonEnergy || 0) / 100));
    let fillColor = '#ffd700';
    if (p.holyDemonUltimateActive) {
        fillColor = '#ff4d4d';
    } else if (p.holyDemonSupportActive) {
        fillColor = '#b84dff';
    } else if (pct >= 0.75) {
        fillColor = '#ff7b5c';
    } else if (pct >= 0.5) {
        fillColor = '#ffd700';
    } else {
        fillColor = '#6ee7ff';
    }

    const map = p.energyBarSprite.material.map;
    if (map) {
        map.dispose();
    }
    p.energyBarSprite.material.map = window.Game.createHealthBarTexture(pct, fillColor);
    p.energyBarSprite.material.needsUpdate = true;
};

window.Game.removeSupportAlly = function() {
    const state = window.Game.state;
    const p = state.player;
    if (!p) return;

    if (p.holyDemonSupportSprite) {
        if (p.holyDemonSupportSprite.parent) {
            p.holyDemonSupportSprite.parent.remove(p.holyDemonSupportSprite);
        } else if (window.Game.scene) {
            window.Game.scene.remove(p.holyDemonSupportSprite);
        }
        if (p.holyDemonSupportSprite.material) {
            p.holyDemonSupportSprite.material.dispose();
        }
        p.holyDemonSupportSprite = null;
    }

    p.holyDemonSupportActive = false;
    p.holyDemonSupportDuration = 0;
    p.holyDemonSupportShotTimer = 0;
};

window.Game.removeUltimateSprite = function() {
    const state = window.Game.state;
    const p = state.player;
    if (!p) return;

    if (p.holyDemonUltimateSprite) {
        if (p.holyDemonUltimateSprite.parent) {
            p.holyDemonUltimateSprite.parent.remove(p.holyDemonUltimateSprite);
        } else if (window.Game.scene) {
            window.Game.scene.remove(p.holyDemonUltimateSprite);
        }
        if (p.holyDemonUltimateSprite.material) {
            p.holyDemonUltimateSprite.material.dispose();
        }
        p.holyDemonUltimateSprite = null;
    }
    p.holyDemonUltimateActive = false;
    p.holyDemonUltimateDuration = 0;
    p.holyDemonUltimatePulseTimer = 0;
};

window.Game.spawnSupportAlly = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const p = state.player;
    const difficulty = window.Game.getDifficultyProfile();
    if (!state.gameActive || !p || p.holyDemonSupportActive) return;

    const supportCharacter = state.selectedCharacter === 'nun' ? 'priest' : 'nun';
    const texKey = window.Game.getCharacterTextureKey(supportCharacter, 'run', 0);
    const texture = state.useGraphicsMode ? window.Game.getDirectionalTexture(texKey, p.facingDir || 1) : window.Game.createCardTexture(supportCharacter === 'nun' ? '修女' : '神父', '#4444aa', -1);
    const mat = new THREE.SpriteMaterial({ map: texture, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.6, 3.6, 1);
    sprite.position.set(p.pos.x + 2.5, p.pos.y + 0.5, p.pos.z + 1.2);
    sprite.userData = {
        ally: true,
        character: supportCharacter,
        animTimer: 0,
        animFrame: 0,
        facingDir: p.facingDir || 1
    };
    scene.add(sprite);

    p.holyDemonSupportSprite = sprite;
    p.holyDemonSupportActive = true;
    p.holyDemonSupportDuration = 20.0;
    p.holyDemonSupportShotTimer = 0;
    p.holyDemonSupportCooldown = difficulty.supportCooldown;

    window.Game.showFloatingText(p.pos, supportCharacter === 'nun' ? '修女支援降臨！' : '神父支援降臨！', '#ffdd55');
};

window.Game.activateUltimate = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const p = state.player;
    const difficulty = window.Game.getDifficultyProfile();
    if (!state.gameActive || !p || p.holyDemonUltimateActive || p.holyDemonUltimateCooldown > 0) return;

    p.holyDemonUltimateActive = true;
    p.holyDemonUltimateDuration = 10.0;
    p.holyDemonUltimatePulseTimer = 0;
    p.holyDemonUltimateCooldown = difficulty.ultimateCooldown;

    if (state.selectedCharacter === 'nun') {
        const texture = state.useGraphicsMode ? window.Game.getProjectileTexture('nun') : null;
        const mat = new THREE.SpriteMaterial({
            map: texture,
            depthWrite: false,
            color: 0xffffff,
            transparent: true
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(6.5, 6.5, 1);
        sprite.position.set(p.pos.x, p.pos.y + 0.4, p.pos.z);
        scene.add(sprite);
        p.holyDemonUltimateSprite = sprite;
    } else {
        const texture = state.useGraphicsMode ? window.Game.getProjectileTexture('priest') : null;
        const mat = new THREE.SpriteMaterial({
            map: texture,
            depthWrite: false,
            color: 0xffffff,
            transparent: true
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(4.5, 4.5, 1);
        sprite.position.set(p.pos.x, p.pos.y + 0.4, p.pos.z);
        scene.add(sprite);
        p.holyDemonUltimateSprite = sprite;
    }

    window.Game.showFloatingText(p.pos, state.selectedCharacter === 'nun' ? '大迴旋斧！' : '全方位射擊！', '#ffdd55');
};

window.Game.addHolyDemonEnergy = function(amount) {
    const state = window.Game.state;
    const p = state.player;
    if (!p || !state.gameActive) return;

    p.holyDemonEnergy = Math.min(100, (p.holyDemonEnergy || 0) + amount);

    if (p.holyDemonUltimateActive) {
        window.Game.updatePlayerEnergyBar();
        window.Game.updateHud();
        return;
    }

    if (p.holyDemonEnergy >= 100) {
        if (!p.holyDemonUltimateActive && p.holyDemonUltimateCooldown <= 0) {
            window.Game.activateUltimate();
            p.holyDemonEnergy = 0;
            p.holyDemonSupportTriggeredThisCharge = false;
        }
    } else if (p.holyDemonEnergy >= 50) {
        if (!p.holyDemonSupportTriggeredThisCharge && !p.holyDemonSupportActive && p.holyDemonSupportCooldown <= 0) {
            window.Game.spawnSupportAlly();
            p.holyDemonSupportTriggeredThisCharge = true;
        }
    }

    window.Game.updatePlayerEnergyBar();
    window.Game.updateHud();
};

window.Game.updateCombatSystems = function(dt) {
    const state = window.Game.state;
    const p = state.player;
    const scene = window.Game.scene;
    if (!p) return;

    if (p.holyDemonSupportCooldown > 0) {
        p.holyDemonSupportCooldown = Math.max(0, p.holyDemonSupportCooldown - dt);
    }
    if (p.holyDemonUltimateCooldown > 0) {
        p.holyDemonUltimateCooldown = Math.max(0, p.holyDemonUltimateCooldown - dt);
    }

    if (p.holyDemonSupportActive && p.holyDemonSupportSprite) {
        p.holyDemonSupportDuration -= dt;

        const side = p.facingDir || 1;
        const supportPos = new THREE.Vector3(
            p.pos.x - side * 3.2,
            p.pos.y + 0.35,
            p.pos.z + 1.8
        );
        p.holyDemonSupportSprite.position.copy(supportPos);

        const supportData = p.holyDemonSupportSprite.userData || {};
        supportData.animTimer = (supportData.animTimer || 0) + dt;
        supportData.facingDir = side;
        if (supportData.animTimer >= 0.1) {
            supportData.animTimer = 0;
            supportData.animFrame = ((supportData.animFrame || 0) + 1) % 3;
            const nextMap = window.Game.getDirectionalTexture(
                window.Game.getCharacterTextureKey(supportData.character, 'run', supportData.animFrame),
                side
            );
            if (nextMap) {
                p.holyDemonSupportSprite.material.map = nextMap;
            }
        }
        p.holyDemonSupportSprite.scale.x = 3.6;
        p.holyDemonSupportSprite.userData = supportData;

        p.holyDemonSupportShotTimer += dt;
        const supportShootInterval = p.holyDemonSupportSprite.userData.character === 'nun' ? 0.8 : 0.5;
        if (p.holyDemonSupportShotTimer >= supportShootInterval) {
            let nearest = null;
            let minDist = Infinity;
            for (let e of state.enemies) {
                const d = supportPos.distanceTo(e.pos);
                if (d < minDist && d < 35) {
                    minDist = d;
                    nearest = e;
                }
            }
            if (nearest) {
                window.Game.shootFrom(
                    p.holyDemonSupportSprite.userData.character,
                    supportPos.clone(),
                    nearest.pos,
                    {
                        damage: p.holyDemonSupportSprite.userData.character === 'nun' ? 34 : 22,
                        speed: 38,
                        life: 1.2,
                        ignoreWeaken: true
                    }
                );
                p.holyDemonSupportShotTimer = 0;
            }
        }

        if (p.holyDemonSupportDuration <= 0) {
            window.Game.removeSupportAlly();
        }
    }

    if (p.holyDemonUltimateActive) {
        p.holyDemonUltimateDuration -= dt;

        if (p.holyDemonUltimateSprite) {
            const orbitRadius = p.holyDemonUltimateSprite.userData.orbitRadius || 2.8;
            const orbitAngle = (p.holyDemonUltimateSprite.userData.orbitAngle || 0) + dt * (state.selectedCharacter === 'nun' ? 7 : 3);
            p.holyDemonUltimateSprite.userData.orbitAngle = orbitAngle;
            p.holyDemonUltimateSprite.userData.orbitRadius = orbitRadius;
            p.holyDemonUltimateSprite.position.set(
                p.pos.x + Math.cos(orbitAngle) * orbitRadius,
                p.pos.y + 0.65,
                p.pos.z + Math.sin(orbitAngle) * orbitRadius
            );
        }

        if (state.selectedCharacter === 'priest') {
            p.holyDemonUltimatePulseTimer += dt;
            if (p.holyDemonUltimatePulseTimer >= 0.22) {
                p.holyDemonUltimatePulseTimer = 0;
                const center = p.pos.clone();
                const radius = 8;
                const directions = 8;
                for (let i = 0; i < directions; i++) {
                    const angle = (Math.PI * 2 * i) / directions;
                    const target = new THREE.Vector3(
                        center.x + Math.cos(angle) * radius,
                        center.y,
                        center.z + Math.sin(angle) * radius
                    );
                    window.Game.shootFrom('priest', center.clone(), target, {
                        damage: 18,
                        speed: 42,
                        life: 0.9,
                        ignoreWeaken: true
                    });
                }
            }
        } else {
            p.holyDemonUltimatePulseTimer += dt;
            if (p.holyDemonUltimatePulseTimer >= 0.35) {
                p.holyDemonUltimatePulseTimer = 0;
                const pulseRadius = 6.0;
                for (let i = state.enemies.length - 1; i >= 0; i--) {
                    const e = state.enemies[i];
                    if (!e.isBoss && p.pos.distanceTo(e.pos) <= pulseRadius) {
                        e.hp -= 28;
                        window.Game.showFloatingText(e.pos, "-28", "#ffffff");
                        window.Game.updateEntityHealthBar(e);
                        if (e.hp <= 0) {
                            scene.remove(e.sprite);
                            if (e.hpBarSprite) scene.remove(e.hpBarSprite);
                            const entIdx = state.entities.indexOf(e.sprite);
                            if (entIdx > -1) state.entities.splice(entIdx, 1);
                            state.enemies.splice(i, 1);
                            state.enemiesDefeated = (state.enemiesDefeated || 0) + 1;
                            if (window.Game.addHolyDemonEnergy) {
                                window.Game.addHolyDemonEnergy(5);
                            }
                            window.Game.showFloatingText(e.pos, "斧刃清除！", "#ffdd55");
                        }
                    }
                }
            }
        }

        if (p.holyDemonUltimateDuration <= 0) {
            window.Game.removeUltimateSprite();
        }
    }

    window.Game.updatePlayerEnergyBar();
};

function measureClearDistance(origin, dir, maxDistance = 28, stepSize = 2) {
    const probe = new THREE.Vector3();
    for (let dist = stepSize; dist <= maxDistance; dist += stepSize) {
        probe.copy(origin).addScaledVector(dir, dist);
        probe.y = 1.5;
        if (window.Game.checkCollision(probe, 1.6)) {
            return dist - stepSize;
        }
    }
    return maxDistance;
}

function scoreCameraAngle(angle, playerPos) {
    const cameraDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const forwardDir = cameraDir.clone().multiplyScalar(-1);
    const cameraSideClear = measureClearDistance(playerPos, cameraDir, 24, 2);
    const forwardClear = measureClearDistance(playerPos, forwardDir, 30, 2);
    return forwardClear * 1.4 + cameraSideClear * 0.8;
}

function normalizeAngleDelta(delta) {
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
}

function updateAutoCameraAngle(dt) {
    const state = window.Game.state;
    const p = state.player;
    if (!p || !p.sprite) return;
    if (state.cameraViewMode === 'top') return;

    if (state.cameraManualTimer > 0) {
        state.cameraManualTimer = Math.max(0, state.cameraManualTimer - dt);
        return;
    }

    const playerPos = p.pos || p.sprite.position;
    const currentAngle = state.cameraAngle || 0;
    let bestAngle = currentAngle;
    let bestScore = scoreCameraAngle(currentAngle, playerPos);

    const sampleCount = 16;
    for (let i = 0; i < sampleCount; i++) {
        const angle = (Math.PI * 2 * i) / sampleCount;
        const score = scoreCameraAngle(angle, playerPos);
        if (score > bestScore + 0.5) {
            bestScore = score;
            bestAngle = angle;
        }
    }

    const delta = normalizeAngleDelta(bestAngle - currentAngle);
    state.cameraAngle = currentAngle + delta * Math.min(1, dt * 1.8);
}

function onPointerTap(event) {
    const state = window.Game.state;
    if (!state.gameActive) return;

    const now = performance.now();
    const elapsedSinceTap = now - (state.player.lastTapAt || 0);
    if (elapsedSinceTap <= 380) {
        state.player.tapComboCount = Math.min(12, (state.player.tapComboCount || 0) + 1);
    } else {
        state.player.tapComboCount = 1;
    }
    state.player.lastTapAt = now;
    state.player.tapComboTimer = 1.2;
    state.player.tapAttackMultiplier = Math.min(2.6, 1 + state.player.tapComboCount * 0.14);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, window.Game.camera);

    const intersects = raycaster.intersectObjects(state.entities);
    if (intersects.length > 0) {
        const target = intersects[0].object.userData.entity;
        if (target) {
            if (target.isBuilding && !target.isRepaired) {
                window.Game.repairBuilding(target);
            }
        }
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetPos = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, targetPos);
    
    if (targetPos) {
        const safeTarget = window.Game.findNearestFreePoint(
            new THREE.Vector3(targetPos.x, 1.5, targetPos.z),
            window.Game.PLAYER_RADIUS || 1.2,
            20
        );
        if (safeTarget) {
            state.player.targetPos.copy(safeTarget);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const state = window.Game.state;
    if (!state.gameActive) return;

    const delta = clock.getDelta();
    
    updateTime(delta);
    updateAutoCameraAngle(delta);
    window.Game.updatePlayer(delta);
    window.Game.updateEnemies(delta);
    window.Game.updateProjectiles(delta);
    window.Game.updateCombatSystems(delta);
    window.Game.updateRadar();
    window.Game.updateHud(); // Keep HUD updated
    
    // Minions spawn rate scales with player upgrade level (enemiesDefeated)
    const difficulty = window.Game.getDifficultyProfile();
    const upgradeLevel = Math.floor((state.enemiesDefeated || 0) / 3);
    const spawnInterval = Math.max(
        difficulty.minionSpawnIntervalMin,
        difficulty.minionSpawnIntervalBase - upgradeLevel * difficulty.minionSpawnIntervalDecay
    );
    const maxMinions = (state.bossSpawned ? difficulty.maxMinionsBossBase : difficulty.maxMinionsBase) +
        upgradeLevel * difficulty.maxMinionsUpgradeStep;

    minionSpawnTimer += delta;
    if (minionSpawnTimer > spawnInterval) {
        if (state.enemies.length < maxMinions) { 
            window.Game.spawnMinion();
        }
        minionSpawnTimer = 0;
    }
    
    const camera = window.Game.camera;
    if (state.player && state.player.sprite && camera) {
        const viewport = window.Game.getViewportTuning ? window.Game.getViewportTuning() : {
            cameraDistance: 18,
            cameraHeight: 12,
            lookAhead: 5
        };
        const angle = state.cameraAngle || 0;
        if (viewport.isTopView) {
            const targetCamPos = new THREE.Vector3(
                state.player.sprite.position.x,
                viewport.cameraHeight,
                state.player.sprite.position.z + viewport.cameraDistance
            );
            camera.position.lerp(targetCamPos, 0.12);
            camera.lookAt(state.player.sprite.position.x, 0, state.player.sprite.position.z);
        } else {
            const offsetX = Math.sin(angle) * viewport.cameraDistance;
            const offsetZ = Math.cos(angle) * viewport.cameraDistance;
            
            const targetCamPos = new THREE.Vector3(
                state.player.sprite.position.x + offsetX,
                viewport.cameraHeight,
                state.player.sprite.position.z + offsetZ
            );
            
            camera.position.lerp(targetCamPos, 0.08); // slightly faster lerp for responsive camera drag rotation
            
            const lookX = state.player.sprite.position.x - Math.sin(angle) * viewport.lookAhead;
            const lookZ = state.player.sprite.position.z - Math.cos(angle) * viewport.lookAhead;
            camera.lookAt(lookX, 0, lookZ);
        }
    }

    if (camera && state.player && state.player.sprite && window.Game.updateObstacleOcclusion) {
        window.Game.updateObstacleOcclusion(camera, state.player.sprite, delta);
    }

    // Bob and rotate the Holy Relic Sprite if active
    if (window.Game.relicSprite) {
        const time = Date.now() * 0.003;
        window.Game.relicSprite.position.y = window.Game.relicBaseY + Math.sin(time * 2.0) * 0.4;
        window.Game.relicSprite.material.rotation = Math.sin(time) * 0.2; // slight holy sway
    }

    if (window.Game.renderer && window.Game.scene && camera) {
        window.Game.renderer.render(window.Game.scene, camera);
    }
}

function updateTime(dt) {
    const state = window.Game.state;
    state.gameTime += (dt / window.Game.DAY_DURATION);
    if (state.gameTime > 1) state.gameTime = 0;

    // Tick mid-boss spawn countdown timer
    if (!state.midBossSpawned) {
        state.timeToMidBoss -= dt;
        if (state.timeToMidBoss <= 0) {
            state.timeToMidBoss = 0;
            window.Game.spawnMidBoss();
        }
    }

    // Tick boss spawn countdown timer
    if (!state.bossSpawned) {
        state.timeToBoss -= dt;
        if (state.timeToBoss <= 0) {
            state.timeToBoss = 0;
            window.Game.triggerBossSpawn();
        }
    }

    let bgColor, lightIntensity;
    let timeStr = "";

    if (state.gameTime < 0.3) {
        const lerpTime = state.gameTime / 0.3;
        bgColor = new THREE.Color(0xd27d2d).lerp(new THREE.Color(0x1a1a3a), lerpTime);
        lightIntensity = 0.8 - (lerpTime * 0.5);
        timeStr = "黃昏";
    } else if (state.gameTime < 0.7) {
        const lerpTime = (state.gameTime - 0.3) / 0.4;
        bgColor = new THREE.Color(0x1a1a3a).lerp(new THREE.Color(0x050510), lerpTime);
        lightIntensity = 0.3;
        timeStr = "深夜";
    } else {
        const lerpTime = (state.gameTime - 0.7) / 0.3;
        bgColor = new THREE.Color(0x050510).lerp(new THREE.Color(0xd27d2d), lerpTime);
        lightIntensity = 0.3 + (lerpTime * 0.5);
        timeStr = "黎明前";
    }

    if (window.Game.scene) {
        window.Game.scene.background = bgColor;
        window.Game.scene.fog.color = bgColor;
    }
    if (window.Game.dirLight) window.Game.dirLight.intensity = lightIntensity;
    if (window.Game.hemiLight) window.Game.hemiLight.intensity = lightIntensity * 0.8;
    
    const hour = Math.floor((state.gameTime * 24 + 18) % 24);
    const timeDisplayEl = document.getElementById('time-display');
    if (timeDisplayEl) {
        timeDisplayEl.innerText = `${hour.toString().padStart(2, '0')}:00 (${timeStr})`;
    }
}

window.Game.stageCleared = function() {
    const state = window.Game.state;
    state.gameActive = false;
    
    // Stop all BGM
    window.Game.stopAllMusic();

    const victoryOverlay = document.getElementById('victory-overlay');
    const victoryDesc = document.getElementById('victory-desc');
    const advanceBtn = document.getElementById('advance-btn');

    if (victoryOverlay && victoryDesc) {
        victoryOverlay.style.display = 'flex';
        
        const stageNames = ["黃昏獵魔鎮", "深紅城堡", "亡靈王座"];
        const currentStageName = stageNames[state.stage - 1] || `第 ${state.stage} 關`;
        
        if (state.stage < 3) {
            victoryDesc.innerHTML = `恭喜！您成功通關了 <strong>第 ${state.stage} 關：${currentStageName}</strong>！您成功取回了聖十字架，並擊退了該關卡魔王！<br><br>準備進入第 ${state.stage + 1} 關！`;
            if (advanceBtn) {
                advanceBtn.innerText = `前進第 ${state.stage + 1} 關`;
                advanceBtn.onclick = function() {
                    victoryOverlay.style.display = 'none';
                    window.Game.advanceToNextStage();
                };
            }
        } else {
            // Final victory!
            window.Game.markFirstCycleCleared && window.Game.markFirstCycleCleared();
            state.cycleTier = Math.max(state.cycleTier || 1, 2);
            victoryDesc.innerHTML = `🎉 <strong>終極勝利！</strong> 🎉<br>您已成功淨化所有三個關卡，拯救世界免於亡靈入侵的厄運！<br>願神聖之光永遠指引著您的前路。`;
            if (advanceBtn) {
                advanceBtn.innerText = "重新開始遊戲";
                advanceBtn.onclick = function() {
                    location.reload();
                };
            }
        }
    }
};

window.Game.advanceToNextStage = function() {
    const state = window.Game.state;
    const scene = window.Game.scene;

    // Increment stage
    state.stage++;
    
    // 1. Clear old objects (obstacles, buildings, enemies, projectiles)
    window.Game.clearSceneObjects();

    // 2. Re-create scaled obstacles and buildings for the new stage
    window.Game.createObstacles();
    window.Game.createGround(); // Update stage-specific ground texture
    window.Game.createBuildings();

    // 3. Reset player stats
    state.player.hp = state.player.maxHp;
    state.player.relicFound = false;
    const safeSpawn = window.Game.findSafePlayerSpawn ? window.Game.findSafePlayerSpawn() : new THREE.Vector3(0, 1.5, 0);
    state.player.pos.copy(safeSpawn);
    state.player.targetPos.copy(safeSpawn);
    if (state.player.sprite) {
        state.player.sprite.position.copy(state.player.pos);
        state.player.sprite.position.y = 2.2;
    }
    window.Game.ensurePlayerFree && window.Game.ensurePlayerFree();
    
    // Reset player debuffs
    state.player.slowTimer = 0;
    state.player.weakenTimer = 0;
    state.player.curseTimer = 0;
    state.player.holyDemonEnergy = 0;
    state.player.holyDemonSupportCooldown = 0;
    state.player.holyDemonUltimateCooldown = 0;
    state.player.holyDemonSupportDuration = 0;
    state.player.holyDemonUltimateDuration = 0;
    state.player.holyDemonSupportTriggeredThisCharge = false;
    state.player.holyDemonSupportActive = false;
    state.player.holyDemonUltimateActive = false;
    state.player.holyDemonSupportShotTimer = 0;
    state.player.holyDemonUltimatePulseTimer = 0;
    window.Game.removeSupportAlly && window.Game.removeSupportAlly();
    window.Game.removeUltimateSprite && window.Game.removeUltimateSprite();

    // 4. Reset timers
    const difficulty = window.Game.getDifficultyProfile();
    state.timeToMidBoss = difficulty.midBossTimer;
    state.timeToBoss = difficulty.bossTimer;
    state.midBossSpawned = false;
    state.bossSpawned = false;
    state.holyEnergy = 0;
    state.enemiesDefeated = 0;

    // Hide HUD notifications
    const relicStatusEl = document.getElementById('relic-status');
    if (relicStatusEl) relicStatusEl.style.display = 'none';
    
    const statusTextEl = document.getElementById('status-text');
    if (statusTextEl) {
        statusTextEl.innerText = "任務目標：修復房屋以尋找聖十字架！";
        statusTextEl.style.color = "#ffffff";
    }

    // 5. Restart BGM (exploration theme)
    bgmAudio.src = 'music/relic_of_the_undead.mp3';
    if (state.audioEnabled) {
        bgmAudio.play().catch(e => console.log("Audio play blocked:", e));
    }

    // 6. Resume game updates
    state.gameActive = true;
    clock.getDelta(); // flush clock delta to avoid giant step jump
    window.Game.updateHud();
};

// Automatically start game
window.Game.init();
