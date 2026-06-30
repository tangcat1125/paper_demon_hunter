// Building Generation, Repair mechanics, and Holy Energy collection (Global Namespace)

window.Game = window.Game || {};

window.Game.createBuildings = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const buildingCount = window.Game.TOTAL_BUILDINGS;
    const relicIndex = Math.floor(Math.random() * buildingCount);
    const safeZoneRadius = window.Game.PLAYER_SAFE_ZONE_RADIUS || 16;
    const candidateSlots = [
        [-28, -30], [0, -32], [28, -30],
        [-34, -8], [34, -8],
        [-34, 12], [34, 12],
        [-28, 32], [0, 34], [28, 32],
        [-18, -34], [18, -34], [-18, 36], [18, 36]
    ];
    const shuffledSlots = candidateSlots
        .map((slot) => ({ slot, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((entry) => entry.slot);

    for (let i = 0; i < buildingCount; i++) {
        const b = {
            isBuilding: true,
            hp: Math.random() * 30 + 10,
            maxHp: 100,
            hasRelic: (i === relicIndex),
            isRepaired: false,
            pos: new THREE.Vector3(),
            halfWidth: 5.8,
            halfDepth: 5.8
        };
        
        let validPos = false;
        for (let slotIndex = 0; slotIndex < shuffledSlots.length && !validPos; slotIndex++) {
            const [x, z] = shuffledSlots[slotIndex];
            const inPlayerSafeZone = Math.hypot(x, z) < safeZoneRadius + 8;
            if (inPlayerSafeZone) continue;
            if (!window.Game.isFootprintBlocked(x, z, b.halfWidth, b.halfDepth, 4.5)) {
                validPos = true;
                b.pos.set(x, 6.0, z);
                shuffledSlots.splice(slotIndex, 1);
            }
        }

        let attempts = 0;
        while (!validPos && attempts < 240) {
            attempts++;
            const x = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 44);
            const z = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 44);
            const awayFromSpawn = Math.hypot(x, z) >= safeZoneRadius + 8;
            const insideCentralLane = Math.abs(x) < 12 && Math.abs(z) < 18;

            if (awayFromSpawn &&
                !insideCentralLane &&
                !window.Game.isFootprintBlocked(x, z, b.halfWidth, b.halfDepth, 4.5)) {
                validPos = true;
                b.pos.set(x, 6.0, z);
            }
        }

        if (!validPos) {
            const fallback = window.Game.findNearestFreePoint(
                new THREE.Vector3(((i % 2 === 0) ? -1 : 1) * (safeZoneRadius + 14 + (i % 3) * 6), 1.5, -28 + i * 6),
                b.halfWidth,
                28
            );
            b.pos.set(fallback.x, 6.0, fallback.z);
        }

        const mat = new THREE.SpriteMaterial({ map: window.Game.getBuildingTexture(b), depthWrite: false });
        b.sprite = new THREE.Sprite(mat);
        b.sprite.scale.set(12, 12, 1); // Scaled up 3x character size
        b.sprite.position.copy(b.pos);
        b.sprite.renderOrder = 10;
        b.sprite.userData = { entity: b };
        
        scene.add(b.sprite);
        state.buildings.push(b);
        state.entities.push(b.sprite);
    }
};

window.Game.getBuildingTexture = function(b) {
    const state = window.Game.state;
    if (b.isRepaired) {
        if (b.hasRelic) {
            if (state.useGraphicsMode && state.textures.cross) {
                return state.textures.cross;
            }
            return window.Game.createCardTexture('⛪聖物', '#ffd700', 1.0, false, true);
        }
        if (state.useGraphicsMode && state.textures.building_intact) {
            return state.textures.building_intact;
        }
        return window.Game.createCardTexture('🏠完好', '#55aa55', 1.0, false, true);
    } else {
        if (state.useGraphicsMode && state.textures.building_ruined) {
            return state.textures.building_ruined;
        }
        return window.Game.createCardTexture('🏚️廢墟', '#8b4513', b.hp / b.maxHp, false, true);
    }
};

window.Game.repairBuilding = function(b) {
    const state = window.Game.state;
    if (b.isRepaired) return;
    
    b.hp += 20;
    window.Game.showFloatingText(b.pos, "🔧修復中!", "#00aaff");

    if (b.hp >= b.maxHp) {
        b.hp = b.maxHp;
        b.isRepaired = true;
        
        // Award 20% Holy Energy for each completed repair
        state.holyEnergy = Math.min(100, state.holyEnergy + 20);
        window.Game.updateHud();

        if (b.hasRelic) {
            state.player.relicFound = true;
            
            // Spawn the physical Holy Cross sprite above the repaired building
            if (state.textures.cross) {
                const mat = new THREE.SpriteMaterial({ map: state.textures.cross, depthWrite: false });
                const relicSprite = new THREE.Sprite(mat);
                relicSprite.scale.set(3, 3, 1);
                relicSprite.position.set(b.pos.x, b.pos.y + 3.5, b.pos.z);
                scene.add(relicSprite);
                
                window.Game.relicSprite = relicSprite;
                window.Game.relicBaseY = b.pos.y + 3.5;
            }

            const relicStatusEl = document.getElementById('relic-status');
            if (relicStatusEl) relicStatusEl.style.display = 'block';
            
            const statusTextEl = document.getElementById('status-text');
            if (statusTextEl) {
                if (state.bossSpawned) {
                    statusTextEl.innerText = "任務目標：消滅大魔王！";
                    statusTextEl.style.color = "#ffffff";
                } else {
                    statusTextEl.innerText = "聖物已尋獲！準備迎戰大魔王！";
                }
            }
            window.Game.showFloatingText(b.pos, "✨找到聖物！", "#ffd700");
        } else {
            window.Game.showFloatingText(b.pos, "🏠修復完成 (無聖物)", "#55aa55");
        }
    }
    b.sprite.material.map = window.Game.getBuildingTexture(b);
};
