// Enemy Spawner, Movement pathing, Damage ticks, Boss summons, and Special attacks (Global Namespace)

window.Game = window.Game || {};

window.Game.spawnMinion = function(isInitial = false, bossSpawnPos = null) {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const difficulty = window.Game.getDifficultyProfile();
    if (!state.gameActive) return;

    let spawnX, spawnZ;
    if (bossSpawnPos) {
        spawnX = bossSpawnPos.x + (Math.random() - 0.5) * 10;
        spawnZ = bossSpawnPos.z + (Math.random() - 0.5) * 10;
    } else {
        let validPos = false;
        while (!validPos) {
            spawnX = (Math.random() - 0.5) * window.Game.MAP_SIZE;
            spawnZ = (Math.random() - 0.5) * window.Game.MAP_SIZE;
            const distToPlayer = Math.hypot(spawnX - state.player.pos.x, spawnZ - state.player.pos.z);
            if (distToPlayer > 30 && !window.Game.checkCollision(new THREE.Vector3(spawnX, 1.5, spawnZ), 2.0)) {
                validPos = true;
            }
        }
    }

    const minionType = Math.floor(Math.random() * 3) + 1;
    const stats = {
        1: { hp: 32, speed: 2.4, attackCooldown: 0, specialAttackCooldown: 0 },
        2: { hp: 46, speed: 6.8, attackCooldown: 0, specialAttackCooldown: 0 },
        3: { hp: 58, speed: 3.2, attackCooldown: 0, specialAttackCooldown: 5.0 }
    }[minionType];

    const minion = {
        isEnemy: true,
        isBoss: false,
        hp: Math.round(stats.hp * difficulty.minionHpScale),
        maxHp: Math.round(stats.hp * difficulty.minionHpScale),
        speed: stats.speed * difficulty.minionSpeedScale,
        pos: new THREE.Vector3(spawnX, 1.5, spawnZ),
        attackCooldown: stats.attackCooldown,
        specialAttackCooldown: stats.specialAttackCooldown * difficulty.minionSpecialScale,
        hpBarSprite: null,
        minionType: minionType,
        strafeDir: Math.random() > 0.5 ? 1 : -1
    };

    let texture;
    if (state.useGraphicsMode) {
        texture = state.textures['minion_' + minionType];
    } else {
        texture = window.Game.createCardTexture(minionType === 1 ? '骷髏' : (minionType === 2 ? '狼人' : '吸血鬼'), '#880000', -1);
    }

    const mat = new THREE.SpriteMaterial({ map: texture });
    minion.sprite = new THREE.Sprite(mat);
    minion.sprite.scale.set(3, 3, 1);
    minion.sprite.position.copy(minion.pos);
    minion.sprite.userData = { entity: minion };
    scene.add(minion.sprite);

    const hpTexture = window.Game.createHealthBarTexture(1.0);
    const hpMat = new THREE.SpriteMaterial({ map: hpTexture, depthWrite: false });
    minion.hpBarSprite = new THREE.Sprite(hpMat);
    minion.hpBarSprite.scale.set(2.5, 0.3, 1);
    minion.hpBarSprite.position.set(minion.pos.x, minion.pos.y + 2.2, minion.pos.z);
    scene.add(minion.hpBarSprite);

    state.enemies.push(minion);
    state.entities.push(minion.sprite);
};

window.Game.spawnMidBoss = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const difficulty = window.Game.getDifficultyProfile();
    state.midBossSpawned = true;

    window.Game.shakeCamera();
    window.Game.showFloatingText(state.player.pos, '中魔王降臨！', '#ff6600');

    const statusTextEl = document.getElementById('status-text');
    if (statusTextEl) {
        statusTextEl.innerText = `第 ${state.stage} 關中魔王出現！`;
        statusTextEl.style.color = '#ff6600';
    }

    if (state.audioEnabled && window.Game.playBossBgm) {
        window.Game.playBossBgm();
    }

    const spawnZ = state.player.pos.z > 0 ? -35 : 35;
    const midBoss = {
        isEnemy: true,
        isBoss: true,
        isMidBoss: true,
        hp: Math.round(250 * difficulty.midBossHpScale),
        maxHp: Math.round(250 * difficulty.midBossHpScale),
        speed: 3.2 * difficulty.midBossSpeedScale,
        pos: new THREE.Vector3(state.player.pos.x + 5, 2.5, spawnZ),
        attackCooldown: 0,
        specialAttackCooldown: 4.0 * difficulty.minionSpecialScale,
        hpBarSprite: null
    };

    let texture;
    if (state.useGraphicsMode) {
        texture = state.textures['mid_boss_' + state.stage];
    } else {
        texture = window.Game.createCardTexture('中魔王', '#cc4400', -1, true);
    }

    const mat = new THREE.SpriteMaterial({ map: texture });
    midBoss.sprite = new THREE.Sprite(mat);
    midBoss.sprite.scale.set(5, 5, 1);
    midBoss.sprite.position.copy(midBoss.pos);
    midBoss.sprite.userData = { entity: midBoss };
    scene.add(midBoss.sprite);

    const hpTexture = window.Game.createHealthBarTexture(1.0);
    const hpMat = new THREE.SpriteMaterial({ map: hpTexture, depthWrite: false });
    midBoss.hpBarSprite = new THREE.Sprite(hpMat);
    midBoss.hpBarSprite.scale.set(3.5, 0.45, 1);
    midBoss.hpBarSprite.position.set(midBoss.pos.x, midBoss.pos.y + 3.2, midBoss.pos.z);
    scene.add(midBoss.hpBarSprite);

    state.enemies.push(midBoss);
    state.entities.push(midBoss.sprite);
};

window.Game.triggerBossSpawn = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    const difficulty = window.Game.getDifficultyProfile();
    state.bossSpawned = true;

    const warningEl = document.getElementById('boss-warning');
    if (warningEl) warningEl.style.display = 'block';

    window.Game.shakeCamera();
    setTimeout(() => {
        const warningElSub = document.getElementById('boss-warning');
        if (warningElSub) warningElSub.style.display = 'none';
    }, 4000);

    const statusTextEl = document.getElementById('status-text');
    if (statusTextEl) {
        const bossNames = ['大魔王', '不死騎士', '深淵魔皇'];
        const currentBoss = bossNames[state.stage - 1] || '大魔王';
        if (state.player.relicFound) {
            statusTextEl.innerText = `${currentBoss}已現身，守住聖物！`;
            statusTextEl.style.color = '#ffffff';
        } else {
            statusTextEl.innerText = `${currentBoss}正在逼近，先找到聖物！`;
            statusTextEl.style.color = '#ff0000';
        }
    }

    if (state.audioEnabled && window.Game.playBossBgm) {
        window.Game.playBossBgm();
    }

    const spawnZ = state.player.pos.z > 0 ? -40 : 40;
    state.boss = {
        isEnemy: true,
        isBoss: true,
        isMidBoss: false,
        hp: Math.round(600 * difficulty.bossHpScale),
        maxHp: Math.round(600 * difficulty.bossHpScale),
        speed: 2 * difficulty.bossSpeedScale,
        pos: new THREE.Vector3(state.player.pos.x, 3.5, spawnZ),
        attackCooldown: 0,
        summonCooldown: 4.5 * difficulty.minionSpecialScale,
        specialAttackCooldown: 6.0 * difficulty.minionSpecialScale,
        hpBarSprite: null
    };

    let texture;
    if (state.useGraphicsMode) {
        texture = state.textures['boss_final_' + state.stage];
    } else {
        const bossNames = ['大魔王', '不死騎士', '深淵魔皇'];
        texture = window.Game.createCardTexture(bossNames[state.stage - 1] || '大魔王', '#440000', -1, true);
    }

    const mat = new THREE.SpriteMaterial({ map: texture });
    state.boss.sprite = new THREE.Sprite(mat);
    state.boss.sprite.scale.set(7, 7, 1);
    state.boss.sprite.position.copy(state.boss.pos);
    state.boss.sprite.userData = { entity: state.boss };
    scene.add(state.boss.sprite);

    const hpTexture = window.Game.createHealthBarTexture(1.0);
    const hpMat = new THREE.SpriteMaterial({ map: hpTexture, depthWrite: false });
    state.boss.hpBarSprite = new THREE.Sprite(hpMat);
    state.boss.hpBarSprite.scale.set(5.5, 0.5, 1);
    state.boss.hpBarSprite.position.set(state.boss.pos.x, state.boss.pos.y + 4.5, state.boss.pos.z);
    scene.add(state.boss.hpBarSprite);

    state.enemies.push(state.boss);
    state.entities.push(state.boss.sprite);
};

function findNearestPlayerProjectile(state, pos) {
    let nearest = null;
    let minDist = Infinity;
    for (const p of state.projectiles) {
        if (!p.friendly) continue;
        const d = pos.distanceTo(p.mesh.position);
        if (d < minDist) {
            minDist = d;
            nearest = p;
        }
    }
    return nearest;
}

window.Game.updateEnemies = function(dt) {
    const state = window.Game.state;
    const difficulty = window.Game.getDifficultyProfile();
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];

        if (e.isBoss) {
            if (e.isMidBoss) {
                e.specialAttackCooldown -= dt;
                if (e.specialAttackCooldown <= 0) {
                    state.player.slowTimer = 5.0;
                    window.Game.showFloatingText(state.player.pos, '緩速!', '#00ffff');
                    e.specialAttackCooldown = 8.0 * difficulty.minionSpecialScale;
                }
            } else {
                e.summonCooldown -= dt;
                if (e.summonCooldown <= 0) {
                    window.Game.showFloatingText(e.pos, '魔王召喚小怪！', '#ff0000');
                    window.Game.spawnMinion(false, e.pos);
                    window.Game.spawnMinion(false, e.pos);
                    e.summonCooldown = 7 * difficulty.minionSpecialScale;
                }

                e.specialAttackCooldown -= dt;
                if (e.specialAttackCooldown <= 0) {
                    if (Math.random() > 0.5) {
                        state.player.weakenTimer = 6.0;
                        window.Game.showFloatingText(state.player.pos, '弱化!', '#ff00ff');
                    } else {
                        state.player.curseTimer = 5.0;
                        window.Game.showFloatingText(state.player.pos, '詛咒!', '#ff3333');
                    }
                    e.specialAttackCooldown = 9.0 * difficulty.minionSpecialScale;
                }
            }
        } else {
            const distToPlayer = e.pos.distanceTo(state.player.pos);
            const dirToPlayer = new THREE.Vector3().subVectors(state.player.pos, e.pos).normalize();

            if (e.minionType === 1) {
                if (distToPlayer > 13) {
                    e.pos.add(dirToPlayer.multiplyScalar(e.speed * dt));
                } else {
                    e.attackCooldown -= dt;
                    if (e.attackCooldown <= 0) {
                        window.Game.shootFrom('priest', e.pos.clone(), state.player.pos.clone(), {
                            friendly: false,
                            projectileType: 'bone',
                            damage: Math.max(4, Math.round(7 * difficulty.minionDamageScale)),
                            speed: 11,
                            life: 4.0,
                            scale: 1.1
                        });
                        e.attackCooldown = 2.8 * difficulty.minionSpecialScale;
                    }
                }
            } else if (e.minionType === 2) {
                let moveDir = dirToPlayer.clone();
                const threat = findNearestPlayerProjectile(state, e.pos);
                if (threat && threat.mesh.position.distanceTo(e.pos) < 7) {
                    const away = new THREE.Vector3().subVectors(e.pos, threat.mesh.position).normalize();
                    const dodge = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(e.strafeDir * 1.8);
                    moveDir = moveDir.add(dodge).normalize();
                    e.strafeDir *= -1;
                }
                e.pos.add(moveDir.multiplyScalar(e.speed * dt));
                e.attackCooldown -= dt;
                if (distToPlayer <= 2.1 && e.attackCooldown <= 0) {
                    const damage = Math.max(5, Math.round(9 * difficulty.minionDamageScale));
                    window.Game.takeDamage(damage);
                    window.Game.showFloatingText(state.player.pos, `-${damage}`, '#ff0000');
                    e.attackCooldown = 1.35 * difficulty.minionSpecialScale;
                }
            } else if (e.minionType === 3) {
                e.specialAttackCooldown -= dt;
                if (e.specialAttackCooldown <= 0) {
                    window.Game.showFloatingText(e.pos, '吸血鬼召喚骷髏!', '#ff66aa');
                    const summonCount = difficulty.cycleTier === 1 && state.stage <= 2 ? 2 : 3;
                    for (let s = 0; s < summonCount; s++) {
                        window.Game.spawnMinion(false, e.pos);
                    }
                    e.specialAttackCooldown = 6.5 * difficulty.minionSpecialScale;
                }
                if (distToPlayer > 3.2) {
                    e.pos.add(dirToPlayer.multiplyScalar(e.speed * dt));
                }
                e.attackCooldown -= dt;
                if (distToPlayer <= 2.4 && e.attackCooldown <= 0) {
                    const damage = Math.max(5, Math.round(8 * difficulty.minionDamageScale));
                    window.Game.takeDamage(damage);
                    window.Game.showFloatingText(state.player.pos, `-${damage}`, '#ff4444');
                    e.attackCooldown = 1.8 * difficulty.minionSpecialScale;
                }
            }

            e.sprite.position.copy(e.pos);
        }

        const distToPlayer = e.pos.distanceTo(state.player.pos);
        if (e.isBoss) {
            if (distToPlayer > (e.isMidBoss ? 2.5 : 3)) {
                const dir = new THREE.Vector3().subVectors(state.player.pos, e.pos).normalize();
                e.pos.add(dir.multiplyScalar(e.speed * dt));
                e.sprite.position.copy(e.pos);
            } else {
                e.attackCooldown -= dt;
                if (e.attackCooldown <= 0) {
                    const damageBase = e.isMidBoss ? 15 : 30;
                    const damageScale = e.isMidBoss ? difficulty.midBossDamageScale : difficulty.bossDamageScale;
                    const damage = Math.max(e.isMidBoss ? 8 : 14, Math.round(damageBase * damageScale));
                    window.Game.takeDamage(damage);
                    e.attackCooldown = e.isMidBoss ? (1.8 * difficulty.minionSpecialScale) : (2.3 * difficulty.minionSpecialScale);
                    window.Game.showFloatingText(state.player.pos, `-${damage}`, '#ff0000');
                }
            }
        } else {
            if (e.hpBarSprite) {
                e.hpBarSprite.position.set(e.pos.x, e.pos.y + 2.2, e.pos.z);
            }
            continue;
        }

        if (e.hpBarSprite) {
            e.hpBarSprite.position.set(e.pos.x, e.pos.y + (e.isBoss ? (e.isMidBoss ? 3.2 : 4.5) : 2.2), e.pos.z);
        }
    }
};
