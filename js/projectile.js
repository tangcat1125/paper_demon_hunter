// Projectile Creation, Movement, Collision Detection, and Combat Resolvers (Global Namespace)

window.Game = window.Game || {};

window.Game.getProjectileTexture = function(character) {
    window.Game.projectileTextures = window.Game.projectileTextures || {};
    const cacheKey = character || 'priest';
    if (window.Game.projectileTextures[cacheKey]) {
        return window.Game.projectileTextures[cacheKey];
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(64, 64);

    if (character === 'nun') {
        // Giant axe silhouette
        ctx.save();
        ctx.rotate(-0.75);
        ctx.fillStyle = '#7b5a35';
        ctx.fillRect(-8, -42, 16, 84);

        ctx.beginPath();
        ctx.moveTo(-8, -28);
        ctx.lineTo(-42, -38);
        ctx.lineTo(-54, -16);
        ctx.lineTo(-18, -4);
        ctx.closePath();
        ctx.fillStyle = '#c9ccd2';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-42, -38);
        ctx.lineTo(-54, -16);
        ctx.lineTo(-49, -10);
        ctx.lineTo(-34, -31);
        ctx.closePath();
        ctx.fillStyle = '#f4f6f9';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, 34);
        ctx.lineTo(18, 48);
        ctx.lineTo(0, 52);
        ctx.closePath();
        ctx.fillStyle = '#5e4228';
        ctx.fill();
        ctx.restore();
    } else {
        // Silver bullet with shine
        ctx.save();
        ctx.rotate(-0.15);
        const grad = ctx.createLinearGradient(-30, 0, 30, 0);
        grad.addColorStop(0, '#fdfdfd');
        grad.addColorStop(0.25, '#bfc5cc');
        grad.addColorStop(0.55, '#e8ebef');
        grad.addColorStop(1, '#7a828c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-10, -5, 10, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#555d66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    window.Game.projectileTextures[cacheKey] = texture;
    return texture;
};

window.Game.getEnemyProjectileTexture = function(kind) {
    window.Game.enemyProjectileTextures = window.Game.enemyProjectileTextures || {};
    const cacheKey = kind || 'bone';
    if (window.Game.enemyProjectileTextures[cacheKey]) {
        return window.Game.enemyProjectileTextures[cacheKey];
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(64, 64);

    if (kind === 'bone') {
        ctx.fillStyle = '#efe7db';
        ctx.beginPath();
        ctx.moveTo(-42, -8);
        ctx.quadraticCurveTo(-56, -24, -36, -34);
        ctx.quadraticCurveTo(-18, -42, -8, -28);
        ctx.lineTo(14, -6);
        ctx.lineTo(40, -6);
        ctx.quadraticCurveTo(54, -6, 54, 8);
        ctx.quadraticCurveTo(54, 22, 40, 22);
        ctx.lineTo(14, 22);
        ctx.lineTo(-8, 44);
        ctx.quadraticCurveTo(-18, 56, -34, 48);
        ctx.quadraticCurveTo(-54, 40, -42, 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#9a8f7b';
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    window.Game.enemyProjectileTextures[cacheKey] = texture;
    return texture;
};

window.Game.shootFrom = function(character, originPos, targetVec, options = {}) {
    const scene = window.Game.scene;
    const state = window.Game.state;

    const isWeakened = !options.ignoreWeaken && state.player.weakenTimer > 0;
    const baseDamage = options.damage || (character === 'nun' ? 36 : 24);
    const clickBoost = options.clickBoostMultiplier || 1;
    const effectiveBaseDamage = options.damage ? baseDamage : Math.round(baseDamage * clickBoost);
    const dmg = options.damage ? effectiveBaseDamage : (isWeakened ? Math.max(8, Math.round(effectiveBaseDamage * 0.35)) : effectiveBaseDamage);
    const speed = options.speed || 35;
    const life = options.life || 1.5;
    const scale = options.scale || (character === 'nun' ? 2.4 : 1.8);
    const friendly = options.friendly !== false;
    const projectileType = options.projectileType || (friendly ? 'holy' : 'bone');

    let bullet;
    if (state.useGraphicsMode && !options.forceFallback) {
        const projectileTexture = friendly ? window.Game.getProjectileTexture(character) : window.Game.getEnemyProjectileTexture(projectileType);
        const mat = new THREE.SpriteMaterial({
            map: projectileTexture,
            depthWrite: false,
            color: isWeakened ? 0xaa66aa : 0xffffff
        });
        bullet = new THREE.Sprite(mat);
        bullet.scale.set(scale, scale, 1);
        bullet.userData = { isProjectileSprite: true, projectileCharacter: character, friendly, projectileType };
    } else {
        const bulletColor = isWeakened ? 0x664466 : 0xc0c0c0;
        bullet = new THREE.Mesh(
            new THREE.SphereGeometry(character === 'nun' ? 0.55 : 0.28, 10, 10),
            new THREE.MeshBasicMaterial({ color: bulletColor })
        );
    }

    bullet.position.copy(originPos);
    const direction = new THREE.Vector3().subVectors(targetVec, bullet.position).normalize();

    scene.add(bullet);
    state.projectiles.push({
        mesh: bullet,
        dir: direction,
        speed: speed,
        life: life,
        damage: dmg,
        character: character,
        friendly: friendly,
        projectileType: projectileType,
        ignoreWalls: !!options.ignoreWalls
    });
};

window.Game.shoot = function(targetVec) {
    const state = window.Game.state;
    const originPos = state.player.sprite ? state.player.sprite.position.clone() : state.player.pos.clone();
    window.Game.shootFrom(state.selectedCharacter, originPos, targetVec, {
        clickBoostMultiplier: state.player.tapAttackMultiplier || 1
    });
};

window.Game.updateProjectiles = function(dt) {
    const scene = window.Game.scene;
    const state = window.Game.state;

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        const stepDistance = p.speed * dt;
        const subSteps = Math.max(1, Math.ceil(stepDistance / 1.25));
        const step = p.dir.clone().multiplyScalar(stepDistance / subSteps);
        let collidedWall = false;

        for (let s = 0; s < subSteps; s++) {
            const nextPos = p.mesh.position.clone().add(step);
            if (!p.ignoreWalls && window.Game.checkCollision(nextPos, p.friendly ? 0.35 : 0.45)) {
                collidedWall = true;
                break;
            }
            p.mesh.position.copy(nextPos);
        }

        if (collidedWall) {
            p.life = 0;
        }

        if (p.mesh.userData && p.mesh.userData.isProjectileSprite) {
            const projectileCharacter = p.mesh.userData.projectileCharacter || 'priest';
            p.mesh.material.rotation += 12 * dt;
            if (projectileCharacter === 'nun') {
                p.mesh.material.rotation += 4 * dt;
            }
        }

        p.life -= dt;
        let hit = false;

        if (p.friendly) {
            for (let j = state.enemies.length - 1; j >= 0; j--) {
                const e = state.enemies[j];
                const hitRadius = e.isBoss ? 4 : 2;

                if (p.mesh.position.distanceTo(e.pos) < hitRadius) {
                    hit = true;
                    e.hp -= p.damage;
                    window.Game.showFloatingText(e.pos, `-${p.damage}`, '#ffffff');
                    window.Game.updateEntityHealthBar(e);

                    if (e.hp <= 0) {
                        scene.remove(e.sprite);
                        if (e.hpBarSprite) {
                            scene.remove(e.hpBarSprite);
                        }
                        const entIdx = state.entities.indexOf(e.sprite);
                        if (entIdx > -1) state.entities.splice(entIdx, 1);

                        state.enemies.splice(j, 1);
                        state.enemiesDefeated = (state.enemiesDefeated || 0) + 1;
                        if (window.Game.addHolyDemonEnergy && !e.isBoss) {
                            window.Game.addHolyDemonEnergy(5);
                        }
                        if (state.enemiesDefeated % 3 === 0) {
                            window.Game.showFloatingText(state.player.pos, '速度提升！⚡', '#00ff00');
                        }

                        if (e.isBoss) {
                            if (e.isMidBoss) {
                                window.Game.showFloatingText(e.pos, '💀 Mid-Boss Defeated!', '#ff6600');
                                state.holyEnergy = Math.min(100, state.holyEnergy + 40);
                                if (window.Game.addHolyDemonEnergy) {
                                    window.Game.addHolyDemonEnergy(20);
                                }
                                window.Game.updateHud();
                            } else {
                                if (state.player.relicFound) {
                                    if (window.Game.stageCleared) {
                                        window.Game.stageCleared();
                                    } else {
                                        window.Game.gameOver('🎉 Victory! Stage Cleared!');
                                    }
                                } else {
                                    const bossNames = ['Vampire Lord', 'Undead Knight', 'Demon Overlord'];
                                    const currentBoss = bossNames[state.stage - 1] || 'Vampire Lord';
                                    window.Game.gameOver(`❌ You defeated the ${currentBoss} but without the relic, he has resurrected in the darkness... (Retry required)`);
                                }
                            }
                        }
                    }
                    break;
                }
            }
        } else {
            if (p.mesh.position.distanceTo(state.player.pos) < 1.3) {
                hit = true;
                const damage = p.damage || 6;
                window.Game.takeDamage(damage);
                window.Game.showFloatingText(state.player.pos, `-${damage}`, '#ffcccc');
                if (p.projectileType === 'bone') {
                    state.player.slowTimer = Math.max(state.player.slowTimer || 0, 2.5);
                    window.Game.showFloatingText(state.player.pos, '緩速！', '#ccccff');
                }
            }
        }

        if (hit || p.life <= 0) {
            scene.remove(p.mesh);
            state.projectiles.splice(i, 1);
        }
    }
};
