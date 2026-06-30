// Card Texture Generator & Floating Health Bar Canvas engine (Global Namespace)

window.Game = window.Game || {};

window.Game.createCardTexture = function(text, bgColor, hpPercent = 1.0, isBoss = false, isBuilding = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw background card surface
    ctx.fillStyle = bgColor;
    ctx.fillRect(28, 28, 200, 200);
    
    // Draw borders
    ctx.lineWidth = 10;
    ctx.strokeStyle = isBoss ? '#ff0000' : (isBuilding ? '#8b4513' : '#ffffff');
    ctx.strokeRect(28, 28, 200, 200);

    // Draw center label
    ctx.fillStyle = '#ffffff';
    if (text.length > 8) {
        ctx.font = isBoss ? 'bold 28px Arial' : 'bold 26px Arial';
    } else {
        ctx.font = isBoss ? 'bold 40px Arial' : 'bold 36px Arial';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    // Draw progress bar overlay (Only for buildings, enemies/players use 3D floating bars)
    if (isBuilding && hpPercent >= 0) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(40, 40, 176, 20);
        ctx.fillStyle = '#00aaff'; 
        ctx.fillRect(42, 42, 172 * hpPercent, 16);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
};

// Generates canvas texture for the 3D floating health bar above entities
window.Game.createHealthBarTexture = function(hpPercent, fillColor = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    // Background (Black outline)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 16);

    // Foreground health fill
    if (hpPercent > 0) {
        if (fillColor) {
            ctx.fillStyle = fillColor;
        } else {
            // Color transition: green -> yellow -> red
            ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : (hpPercent > 0.25 ? '#ffff00' : '#ff0000');
        }
        ctx.fillRect(2, 2, Math.floor(124 * hpPercent), 12);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
};

window.Game.createMirroredTexture = function(texture) {
    if (!texture || !texture.image) return texture;

    const image = texture.image;
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const mirrored = new THREE.CanvasTexture(canvas);
    mirrored.magFilter = THREE.NearestFilter;
    mirrored.minFilter = texture.minFilter || THREE.LinearMipmapLinearFilter;
    mirrored.generateMipmaps = texture.generateMipmaps;
    mirrored.needsUpdate = true;
    return mirrored;
};

window.Game.isMobileGraphicsDevice = function() {
    return window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
};

window.Game.shouldChromaKeyTexture = function(key) {
    return /^(priest_|nun_|minion_|mid_boss_|boss_final_|angel_)/.test(key);
};

window.Game.prepareLoadedTexture = function(key, texture) {
    if (!texture || !texture.image) return texture;

    const shouldChromaKey = window.Game.shouldChromaKeyTexture(key);
    const isMobile = window.Game.isMobileGraphicsDevice();
    const shouldDownscale = isMobile && /^(priest_|nun_)/.test(key);
    const sourceImage = texture.image;
    const maxSize = (isMobile && window.innerHeight > window.innerWidth) ? 960 : 1024;
    const longestEdge = Math.max(sourceImage.width || 0, sourceImage.height || 0);
    const scale = shouldDownscale && longestEdge > maxSize ? (maxSize / longestEdge) : 1;

    if (!shouldChromaKey && scale === 1) {
        texture.magFilter = THREE.NearestFilter;
        return texture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((sourceImage.width || 1) * scale));
    canvas.height = Math.max(1, Math.round((sourceImage.height || 1) * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: shouldChromaKey });
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    if (shouldChromaKey) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            const greenDominance = g - Math.max(r, b);

            if (g > 110 && greenDominance > 35 && g > r * 1.18 && g > b * 1.18) {
                data[i + 3] = 0;
            } else if (a > 0 && g > 90 && greenDominance > 18 && g > r * 1.08 && g > b * 1.08) {
                data[i + 1] = Math.min(g, Math.max(r, b) + 18);
                data[i + 3] = Math.min(a, 220);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    const prepared = new THREE.CanvasTexture(canvas);
    prepared.magFilter = THREE.NearestFilter;
    prepared.minFilter = THREE.LinearMipmapLinearFilter;
    prepared.needsUpdate = true;
    return prepared;
};

window.Game.getDirectionalTexture = function(baseKey, facingDir = 1) {
    const textures = window.Game.state && window.Game.state.textures;
    if (!textures) return null;

    if (facingDir < 0 && textures[baseKey + '_left']) {
        return textures[baseKey + '_left'];
    }
    return textures[baseKey] || null;
};

window.Game.loadGameTextures = function(onComplete) {
    const state = window.Game.state;
    if (!state.useGraphicsMode) {
        if (onComplete) onComplete();
        return;
    }

    const loader = new THREE.TextureLoader();
    
    const assetsToLoad = {
        priest_idle: 'assets/priest/priest_idle.png',
        priest_run_1: 'assets/priest/run/priest_run_1.png',
        priest_run_2: 'assets/priest/run/priest_run_2.png',
        priest_run_3: 'assets/priest/run/priest_run_3.png',
        priest_shoot_1: 'assets/priest/shoot/priest_walk_1.png',
        priest_shoot_2: 'assets/priest/shoot/priest_walk_2.png',
        priest_shoot_3: 'assets/priest/shoot/priest_walk_3.png',
        priest_shoot_4: 'assets/priest/shoot/priest_walk_4.png',
        priest_shoot_5: 'assets/priest/shoot/priest_walk_5.png',
        priest_shoot_6: 'assets/priest/shoot/priest_walk_6.png',
        
        nun_idle: 'assets/nun/nun_idle.png',
        nun_run_1: 'assets/nun/run/nun_run_1.png',
        nun_run_2: 'assets/nun/run/nun_run_2.png',
        nun_run_3: 'assets/nun/run/nun_run_3.png',
        nun_shoot_1: 'assets/nun/shoot/nun_action_1.png',
        nun_shoot_2: 'assets/nun/shoot/nun_action_2.png',
        nun_shoot_3: 'assets/nun/shoot/nun_action_3.png',
        nun_shoot_4: 'assets/nun/shoot/nun_action_4.png',
        nun_shoot_5: 'assets/nun/shoot/nun_action_5.png',
        nun_shoot_6: 'assets/nun/shoot/nun_action_6.png',
        
        minion_1: 'assets/enemies/minion_a1.png',
        minion_2: 'assets/enemies/minion_a2.png',
        minion_3: 'assets/enemies/minion_a3.png',
        
        mid_boss_1: 'assets/enemies/boss1/middle boss1.png',
        boss_final_1: 'assets/enemies/boss1/boss_1.png',
        mid_boss_2: 'assets/enemies/boss2/middle boss.png',
        boss_final_2: 'assets/enemies/boss2/minion_1_2.png',
        mid_boss_3: 'assets/enemies/boss3/middle boss.png',
        boss_final_3: 'assets/enemies/boss3/minion_2_2.png',
        
        ground_1: 'assets/ground/stage_1.png',
        ground_2: 'assets/ground/stage_2.png',
        ground_3: 'assets/ground/stage_3.png',
        
        cross: 'assets/holy_cross/cross.png',
        wall: 'assets/wall/wall.png',
        building_ruined: 'assets/buildings/ruined.png',
        building_intact: 'assets/buildings/intact.png',
        
        angel_1: 'assets/ultimate/angel_1.png',
        angel_2: 'assets/ultimate/angel_2.png',
        angel_3: 'assets/ultimate/angel_3.png'
    };

    const legacyFallbacks = {
        priest_run_1: 'priest_walk_1',
        priest_run_2: 'priest_walk_2',
        priest_run_3: 'priest_walk_3',
        priest_shoot_1: 'priest_walk_1',
        priest_shoot_2: 'priest_walk_2',
        priest_shoot_3: 'priest_walk_3',
        priest_shoot_4: 'priest_walk_4',
        priest_shoot_5: 'priest_walk_5',
        priest_shoot_6: 'priest_walk_6',
        nun_run_1: 'nun_action_1',
        nun_run_2: 'nun_action_2',
        nun_run_3: 'nun_action_3',
        nun_shoot_1: 'nun_action_1',
        nun_shoot_2: 'nun_action_2',
        nun_shoot_3: 'nun_action_3',
        nun_shoot_4: 'nun_action_4',
        nun_shoot_5: 'nun_action_5',
        nun_shoot_6: 'nun_action_6'
    };

    let loadedCount = 0;
    const totalCount = Object.keys(assetsToLoad).length;
    
    window.Game.failedTextures = [];

    const finish = () => {
        loadedCount++;
        if (loadedCount === totalCount) {
            const aliases = [
                ['priest_walk_1', 'priest_run_1'],
                ['priest_walk_2', 'priest_run_2'],
                ['priest_walk_3', 'priest_run_3'],
                ['priest_walk_4', 'priest_shoot_4'],
                ['priest_walk_5', 'priest_shoot_5'],
                ['priest_walk_6', 'priest_shoot_6'],
                ['nun_action_1', 'nun_shoot_1'],
                ['nun_action_2', 'nun_shoot_2'],
                ['nun_action_3', 'nun_shoot_3'],
                ['nun_action_4', 'nun_shoot_4'],
                ['nun_action_5', 'nun_shoot_5'],
                ['nun_action_6', 'nun_shoot_6']
            ];
            aliases.forEach(([aliasKey, sourceKey]) => {
                if (!state.textures[aliasKey] && state.textures[sourceKey]) {
                    state.textures[aliasKey] = state.textures[sourceKey];
                }
            });

            Object.keys(state.textures).forEach((key) => {
                if (!/_left$/.test(key) && !state.textures[key + '_left']) {
                    state.textures[key + '_left'] = window.Game.createMirroredTexture(state.textures[key]);
                }
            });
            if (onComplete) onComplete();
        }
    };

    for (let key in assetsToLoad) {
        const url = (window.Game.embeddedAssets && window.Game.embeddedAssets[key]) ? window.Game.embeddedAssets[key] : encodeURI(assetsToLoad[key]);
        
        loader.load(
            url,
            (tex) => {
                state.textures[key] = window.Game.prepareLoadedTexture(key, tex);
                finish();
            },
            undefined,
            () => {
                const fallbackKey = legacyFallbacks[key];
                const fallbackUrl = fallbackKey && window.Game.embeddedAssets ? window.Game.embeddedAssets[fallbackKey] : null;
                if (fallbackUrl) {
                    loader.load(
                        fallbackUrl,
                        (tex) => {
                            state.textures[key] = window.Game.prepareLoadedTexture(key, tex);
                            finish();
                        },
                        undefined,
                        (fallbackErr) => {
                            console.error("Failed to load texture key:", key, fallbackErr);
                            window.Game.failedTextures.push(key);
                            finish();
                        }
                    );
                    return;
                }
                console.error("Failed to load texture key:", key);
                window.Game.failedTextures.push(key);
                finish();
            }
        );
    }
};
