// Building Generation, Repair mechanics, and Holy Energy collection (Global Namespace)

window.Game = window.Game || {};

window.Game.createBuildings = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const buildingCount = window.Game.TOTAL_BUILDINGS;
    const relicIndex = Math.floor(Math.random() * buildingCount);

    for (let i = 0; i < buildingCount; i++) {
        const b = {
            isBuilding: true,
            hp: Math.random() * 30 + 10,
            maxHp: 100,
            hasRelic: (i === relicIndex),
            isRepaired: false,
            pos: new THREE.Vector3()
        };
        
        let validPos = false;
        while (!validPos) {
            const x = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            const z = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            const tempPos = new THREE.Vector3(x, 6.0, z); // Height 6.0 center for scale 12 sprite
            
            // Check that it doesn't overlap the player spawn center, obstacles, or other buildings
            // Spaced out with clearance 8.0
            if (tempPos.length() >= 25 && !window.Game.checkCollision(tempPos, 8.0)) {
                validPos = true;
                b.pos.copy(tempPos);
            }
        }

        const mat = new THREE.SpriteMaterial({ map: window.Game.getBuildingTexture(b) });
        b.sprite = new THREE.Sprite(mat);
        b.sprite.scale.set(12, 12, 1); // Scaled up 3x character size
        b.sprite.position.copy(b.pos);
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
