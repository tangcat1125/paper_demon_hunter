// DOM-based UI Updates, Floating Battle Text, Damage indicators, Countdown updates, and Energy system (Global Namespace)

window.Game = window.Game || {};

window.Game.showFloatingText = function(pos, text, color) {
    const camera = window.Game.camera;
    if (!camera) return;
    
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.innerText = text;
    div.style.color = color;
    document.body.appendChild(div);

    const screenPos = pos.clone();
    screenPos.y += 3;
    screenPos.project(camera);
    
    const x = (screenPos.x * .5 + .5) * window.innerWidth;
    const y = (screenPos.y * -.5 + .5) * window.innerHeight;
    
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    setTimeout(() => div.remove(), 1000);
};

window.Game.takeDamage = function(amount) {
    const state = window.Game.state;
    state.player.hp -= amount;
    if (state.player.hp < 0) state.player.hp = 0;
    
    // Update player's 3D viewport-facing health bar instead of HUD bar
    window.Game.updateEntityHealthBar(state.player);
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        // Red flash filter for damage
        gameContainer.style.filter = "sepia(100%) hue-rotate(300deg) saturate(300%)";
        setTimeout(() => {
            if (gameContainer) gameContainer.style.filter = "none";
        }, 100);
    }

    if (state.player.hp <= 0) {
        window.Game.gameOver("獵魔人已倒下... 黑暗吞噬了小鎮。");
    }
};

window.Game.gameOver = function(msg) {
    window.Game.state.gameActive = false;
    
    // Stop playing background tracks
    if (window.Game.stopAllMusic) {
        window.Game.stopAllMusic();
    }

    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'flex';
    
    const endDesc = document.getElementById('end-desc');
    if (endDesc) endDesc.innerText = msg;
};

// Update HUD elements (Energy bar, active Summon button, and Boss countdown timer)
window.Game.updateHud = function() {
    const state = window.Game.state;

    // 1. Update Boss Countdown Timer (Double milestones: Mid-Boss then Final Boss)
    const countdownTimerEl = document.getElementById('countdown-timer');
    const countdownContainerEl = document.getElementById('boss-countdown-container');
    if (countdownTimerEl && countdownContainerEl) {
        if (!state.midBossSpawned) {
            countdownContainerEl.style.color = "#ffaa00";
            countdownContainerEl.innerHTML = `中魔王降臨倒數: <span id="countdown-timer">${Math.ceil(state.timeToMidBoss)}s</span>`;
        } else if (state.midBossSpawned && !state.bossSpawned) {
            countdownContainerEl.style.color = "#ff3333";
            countdownContainerEl.innerHTML = `大魔王降臨倒數: <span id="countdown-timer">${Math.ceil(state.timeToBoss)}s</span>`;
        } else {
            countdownContainerEl.style.color = "#ff0000";
            countdownContainerEl.innerHTML = `<span id="countdown-timer" style="animation: blink 0.5s infinite;">⚠️ 雙魔王已降臨！ ⚠️</span>`;
        }
    }

    // 2. Update Holy Energy Bar
    const energyBarEl = document.getElementById('energy-bar');
    if (energyBarEl) {
        energyBarEl.style.width = `${state.holyEnergy}%`;
    }

    // 3. Update Summon Button state
    const summonBtnEl = document.getElementById('summon-btn');
    if (summonBtnEl) {
        if (state.holyEnergy >= 100) {
            summonBtnEl.style.display = 'block';
            summonBtnEl.classList.add('ready-glowing');
        } else {
            summonBtnEl.style.display = 'none';
            summonBtnEl.classList.remove('ready-glowing');
        }
    }

    // 4. Update Saint/Demon energy bar and status
    const saintDemonBarEl = document.getElementById('saint-demon-bar');
    if (saintDemonBarEl) {
        const energyPct = Math.max(0, Math.min(100, state.player.holyDemonEnergy || 0));
        saintDemonBarEl.style.width = `${energyPct}%`;
    }

    const saintDemonStateEl = document.getElementById('saint-demon-state');
    if (saintDemonStateEl) {
        if (state.player.holyDemonUltimateActive) {
            saintDemonStateEl.innerText = state.selectedCharacter === 'nun' ? '大迴旋斧發動中' : '全方位射擊發動中';
            saintDemonStateEl.style.color = '#ffb3b3';
        } else if ((state.player.holyDemonEnergy || 0) >= 100 && state.player.holyDemonUltimateCooldown > 0) {
            saintDemonStateEl.innerText = '大絕冷卻中';
            saintDemonStateEl.style.color = '#ffaaaa';
        } else if (state.player.holyDemonSupportActive) {
            saintDemonStateEl.innerText = state.selectedCharacter === 'nun' ? '神父支援中' : '修女支援中';
            saintDemonStateEl.style.color = '#e7c0ff';
        } else if ((state.player.holyDemonEnergy || 0) >= 50 && state.player.holyDemonSupportCooldown > 0) {
            saintDemonStateEl.innerText = '支援冷卻中';
            saintDemonStateEl.style.color = '#ffdd88';
        } else if ((state.player.holyDemonEnergy || 0) >= 100) {
            saintDemonStateEl.innerText = '大絕可發動';
            saintDemonStateEl.style.color = '#ff6666';
        } else if ((state.player.holyDemonEnergy || 0) >= 50) {
            saintDemonStateEl.innerText = '支援可發動';
            saintDemonStateEl.style.color = '#ffd700';
        } else {
            saintDemonStateEl.innerText = '累積中';
            saintDemonStateEl.style.color = '#ffe6ff';
        }
    }

    // 4. Debug check for texture failures (likely browser caching old files)
    if (window.Game.failedTextures && window.Game.failedTextures.length > 0) {
        const statusTextEl = document.getElementById('status-text');
        if (statusTextEl) {
            statusTextEl.innerText = `⚠️ 貼圖載入失敗 (${window.Game.failedTextures.length} 個)。請按 Ctrl + F5 強制重新整理清除瀏覽器快取！`;
            statusTextEl.style.color = "#ff3333";
        }
    }
};

// Helper: updates the texture map of the floating 3D health bar sprite above an entity
window.Game.updateEntityHealthBar = function(entity) {
    if (entity.hpBarSprite) {
        const hpPercent = Math.max(0, entity.hp / entity.maxHp);
        const map = entity.hpBarSprite.material.map;
        if (map) {
            map.dispose();
        }
        entity.hpBarSprite.material.map = window.Game.createHealthBarTexture(hpPercent);
    }
};
