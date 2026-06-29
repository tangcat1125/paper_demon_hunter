// Player Initialization, Movement, Bounding Box Collision checks, and Debuff updates (Global Namespace)

window.Game = window.Game || {};

window.Game.createPlayer = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const p = state.player;

    p.animTimer = 0;
    p.animFrame = 0;
    p.shootAnimTimer = 0;
    p.weaponDamage = state.selectedCharacter === 'nun' ? 36 : 24;
    p.autoShootInterval = state.selectedCharacter === 'nun' ? 0.95 : 0.55;

    // 1. Create main sprite based on graphics mode selection
    let texture;
    if (state.useGraphicsMode) {
        texture = window.Game.getDirectionalTexture(state.selectedCharacter + '_idle', p.facingDir || 1);
    } else {
        const displayName = state.selectedCharacter === 'nun' ? '聖經修女' : '驅魔神父';
        texture = window.Game.createCardTexture(displayName, '#3366cc', -1);
    }

    const mat = new THREE.SpriteMaterial({ map: texture, depthWrite: false });
    p.sprite = new THREE.Sprite(mat);
    p.sprite.scale.set(4, 4, 1);
    p.sprite.position.copy(p.pos);
    scene.add(p.sprite);

    // 2. Create floating 3D health bar sprite above player head
    const hpTexture = window.Game.createHealthBarTexture(1.0);
    const hpMat = new THREE.SpriteMaterial({ map: hpTexture, depthWrite: false });
    p.hpBarSprite = new THREE.Sprite(hpMat);
    p.hpBarSprite.scale.set(3.5, 0.4, 1);
    p.hpBarSprite.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);
    scene.add(p.hpBarSprite);

    // 2.5 Create floating Saint/Demon energy bar above the health bar
    const energyTexture = window.Game.createHealthBarTexture(0.0, '#ffd700');
    const energyMat = new THREE.SpriteMaterial({ map: energyTexture, depthWrite: false });
    p.energyBarSprite = new THREE.Sprite(energyMat);
    p.energyBarSprite.scale.set(3.5, 0.35, 1);
    p.energyBarSprite.position.set(p.pos.x, p.pos.y + 3.05, p.pos.z);
    scene.add(p.energyBarSprite);

    // 3. Create a warm holy PointLight source centered on the player
    p.light = new THREE.PointLight(0xfff5d7, 2.5, 18, 1.2);
    p.light.position.copy(p.pos);
    scene.add(p.light);
};

window.Game.updatePlayer = function(dt) {
    const state = window.Game.state;
    const p = state.player;
    const isNun = state.selectedCharacter === 'nun';
    const runPrefix = isNun ? 'nun_run_' : 'priest_run_';
    const shootPrefix = isNun ? 'nun_shoot_' : 'priest_shoot_';

    // 1. Tick Debuff Timers
    if (p.slowTimer > 0) {
        p.slowTimer -= dt;
    }
    if (p.weakenTimer > 0) {
        p.weakenTimer -= dt;
    }
    if (p.curseTimer > 0) {
        p.curseTimer -= dt;
        // Deal 8 HP continuous damage per second
        window.Game.takeDamage(8 * dt);
    }

    // Calculate player speed based on enemies defeated with a slower, more controlled progression
    const difficulty = window.Game.getDifficultyProfile();
    const baseSpeed = difficulty.playerBaseSpeed;
    const speedStages = Math.floor((state.enemiesDefeated || 0) / difficulty.playerSpeedUpgradeEvery);
    const speedMult = Math.min(difficulty.playerSpeedCap, 1 + speedStages * difficulty.playerSpeedUpgradeStep);
    p.speed = baseSpeed * speedMult;

    // Set speed based on slow debuff
    const currentSpeed = p.slowTimer > 0 ? 2.5 : p.speed;

    // 2. Handle Movement with Collision Checks & Sliding Mechanics
    const moveDist = p.pos.distanceTo(p.targetPos);
    if (moveDist > 0.1) {
        // Animate walk frames if graphics mode is enabled
        if (state.useGraphicsMode) {
            p.animTimer += dt;
            if (p.animTimer >= 0.1) {
                p.animFrame = (p.animFrame + 1) % 3;
                p.animTimer = 0;
                p.sprite.material.map = window.Game.getDirectionalTexture(runPrefix + (p.animFrame + 1), p.facingDir || 1);
            }
        }

        const dir = new THREE.Vector3().subVectors(p.targetPos, p.pos).normalize();

        // Flip based on on-screen horizontal movement, not world X.
        const camera = window.Game.camera;
        if (camera) {
            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            cameraRight.y = 0;
            if (cameraRight.lengthSq() > 0.0001) {
                cameraRight.normalize();
                const screenHorizontal = dir.dot(cameraRight);
                if (screenHorizontal < -0.05) {
                    p.facingDir = -1;
                } else if (screenHorizontal > 0.05) {
                    p.facingDir = 1;
                }
            }
        } else if (dir.x < -0.05) {
            p.facingDir = -1;
        } else if (dir.x > 0.05) {
            p.facingDir = 1;
        }
        if (state.useGraphicsMode) {
            p.sprite.material.map = window.Game.getDirectionalTexture(runPrefix + (p.animFrame + 1), p.facingDir || 1);
        }
        p.sprite.scale.x = 4;

        const stepDist = Math.min(currentSpeed * dt, moveDist);
        const nextPos = p.pos.clone().add(dir.clone().multiplyScalar(stepDist));

        // Bounding check (Radius 1.2 around player center)
        if (!window.Game.checkCollision(nextPos, 1.2)) {
            p.pos.copy(nextPos);
        } else {
            // Sliding helper: try sliding along X axis only
            const stepX = new THREE.Vector3(nextPos.x, p.pos.y, p.pos.z);
            // Try sliding along Z axis only
            const stepZ = new THREE.Vector3(p.pos.x, p.pos.y, nextPos.z);

            if (!window.Game.checkCollision(stepX, 1.2)) {
                p.pos.copy(stepX);
            } else if (!window.Game.checkCollision(stepZ, 1.2)) {
                p.pos.copy(stepZ);
            } else {
                // Completely blocked, cancel target movement
                p.targetPos.copy(p.pos);
            }
        }
        p.sprite.position.copy(p.pos);
    } else {
        // Play action animation if stationary shooting, otherwise reset to idle
        if (state.useGraphicsMode) {
            if (p.shootAnimTimer > 0) {
                p.shootAnimTimer -= dt;
                p.animTimer += dt;
                if (p.animTimer >= 0.08) {
                    p.animFrame = (p.animFrame + 1) % 6;
                    p.animTimer = 0;
                }
                p.sprite.material.map = window.Game.getDirectionalTexture(shootPrefix + (p.animFrame + 1), p.facingDir || 1);
            } else {
                p.animFrame = 0;
                p.animTimer = 0;
                p.sprite.material.map = window.Game.getDirectionalTexture(state.selectedCharacter + '_idle', p.facingDir || 1);
            }
        }
        p.sprite.scale.x = 4;
    }

    // Update floating health bar and holy light position to follow player
    if (p.hpBarSprite) {
        p.hpBarSprite.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z);
    }
    if (p.energyBarSprite) {
        p.energyBarSprite.position.set(p.pos.x, p.pos.y + 3.05, p.pos.z);
        if (window.Game.updatePlayerEnergyBar) {
            window.Game.updatePlayerEnergyBar();
        }
    }
    if (p.light) {
        p.light.position.copy(p.pos);
        const hour = Math.floor((state.gameTime * 24 + 18) % 24);
        const isNight = (hour >= 20 || hour < 5);
        p.light.intensity = isNight ? 3.5 : 1.5; // Brighter holy light source at night
    }

    // 3. Auto Shoot Timer and Attack Trigger
    p.autoShootTimer += dt;
    if (p.autoShootTimer >= p.autoShootInterval && state.enemies.length > 0) {
        let nearest = null;
        let minDist = Infinity;
        for (let e of state.enemies) {
            const d = p.pos.distanceTo(e.pos);
            if (d < minDist && d < 40) { 
                minDist = d;
                nearest = e;
            }
        }
        if (nearest) {
            window.Game.shoot(nearest.pos);
            p.autoShootTimer = 0;
            p.shootAnimTimer = 0.35; // Trigger shooting action animation
            p.animFrame = 0;
            p.animTimer = 0;
        }
    }
};
