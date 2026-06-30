// Three.js Scene Setup, Lighting, Camera, 3D Obstacles generation, and Collision checking (Global Namespace)

window.Game = window.Game || {};

window.Game.scene = null;
window.Game.camera = null;
window.Game.renderer = null;
window.Game.hemiLight = null;
window.Game.dirLight = null;
window.Game.PLAYER_RADIUS = 1.2;
window.Game.PLAYER_SAFE_ZONE_RADIUS = 16;
window.Game.PLAYER_SAFE_CLEARANCE = 3.5;

window.Game.getRendererPixelRatio = function() {
    const baseRatio = window.devicePixelRatio || 1;
    return Math.min(baseRatio, window.Game.isMobileGraphicsDevice && window.Game.isMobileGraphicsDevice() ? 1.5 : 2);
};

window.Game.getViewportTuning = function() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const state = window.Game.state || {};
    const isTopView = state.cameraViewMode === 'top';
    if (isTopView) {
        return isPortrait ? {
            isPortrait: true,
            isTopView: true,
            cameraDistance: 0.35,
            cameraHeight: 34,
            lookAhead: 0,
            fov: 52
        } : {
            isPortrait: false,
            isTopView: true,
            cameraDistance: 0.35,
            cameraHeight: 30,
            lookAhead: 0,
            fov: 48
        };
    }
    if (isPortrait) {
        return {
            isPortrait: true,
            isTopView: false,
            cameraDistance: 25,
            cameraHeight: 16,
            lookAhead: 7,
            fov: 72
        };
    }
    return {
        isPortrait: false,
        isTopView: false,
        cameraDistance: 18,
        cameraHeight: 12,
        lookAhead: 5,
        fov: 60
    };
};

window.Game.isFootprintBlocked = function(x, z, halfWidth, halfDepth, clearance = 0, ignoreBuilding = null) {
    const state = window.Game.state;
    const minX = x - halfWidth - clearance;
    const maxX = x + halfWidth + clearance;
    const minZ = z - halfDepth - clearance;
    const maxZ = z + halfDepth + clearance;

    for (const obs of state.obstacles || []) {
        if (maxX >= obs.xMin && minX <= obs.xMax && maxZ >= obs.zMin && minZ <= obs.zMax) {
            return true;
        }
    }

    for (const building of state.buildings || []) {
        if (building === ignoreBuilding) continue;
        const buildingHalfW = building.halfWidth || 6;
        const buildingHalfD = building.halfDepth || 6;
        const bMinX = building.pos.x - buildingHalfW - clearance;
        const bMaxX = building.pos.x + buildingHalfW + clearance;
        const bMinZ = building.pos.z - buildingHalfD - clearance;
        const bMaxZ = building.pos.z + buildingHalfD + clearance;
        if (maxX >= bMinX && minX <= bMaxX && maxZ >= bMinZ && minZ <= bMaxZ) {
            return true;
        }
    }

    const halfMap = window.Game.MAP_SIZE / 2;
    if (minX < -halfMap || maxX > halfMap || minZ < -halfMap || maxZ > halfMap) {
        return true;
    }

    return false;
};

window.Game.findNearestFreePoint = function(desiredPos, radius = window.Game.PLAYER_RADIUS, maxSearchRadius = 18) {
    const safeY = desiredPos.y != null ? desiredPos.y : 1.5;
    const origin = new THREE.Vector3(desiredPos.x, safeY, desiredPos.z);
    if (!window.Game.checkCollision(origin, radius)) {
        return origin;
    }

    const radialSteps = 24;
    for (let ring = 1; ring <= 12; ring++) {
        const searchRadius = Math.min(maxSearchRadius, ring * 1.5);
        for (let i = 0; i < radialSteps; i++) {
            const angle = (i / radialSteps) * Math.PI * 2;
            const probe = new THREE.Vector3(
                origin.x + Math.cos(angle) * searchRadius,
                safeY,
                origin.z + Math.sin(angle) * searchRadius
            );
            if (!window.Game.checkCollision(probe, radius)) {
                return probe;
            }
        }
    }

    return new THREE.Vector3(0, safeY, 0);
};

window.Game.findSafePlayerSpawn = function() {
    const safeRadius = window.Game.PLAYER_SAFE_ZONE_RADIUS;
    const candidates = [
        new THREE.Vector3(0, 1.5, 0),
        new THREE.Vector3(0, 1.5, -8),
        new THREE.Vector3(0, 1.5, 8),
        new THREE.Vector3(-8, 1.5, 0),
        new THREE.Vector3(8, 1.5, 0),
        new THREE.Vector3(-10, 1.5, -10),
        new THREE.Vector3(10, 1.5, -10),
        new THREE.Vector3(-10, 1.5, 10),
        new THREE.Vector3(10, 1.5, 10)
    ];

    for (const candidate of candidates) {
        if (!window.Game.checkCollision(candidate, window.Game.PLAYER_RADIUS)) {
            return candidate;
        }
    }

    for (let r = 10; r <= safeRadius + 10; r += 3) {
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const probe = new THREE.Vector3(Math.cos(angle) * r, 1.5, Math.sin(angle) * r);
            if (!window.Game.checkCollision(probe, window.Game.PLAYER_RADIUS)) {
                return probe;
            }
        }
    }

    return window.Game.findNearestFreePoint(new THREE.Vector3(0, 1.5, 0), window.Game.PLAYER_RADIUS, 24);
};

window.Game.ensurePlayerFree = function() {
    const state = window.Game.state;
    const p = state.player;
    if (!p) return;

    const safePos = window.Game.findNearestFreePoint(p.pos.clone(), window.Game.PLAYER_RADIUS, 24);
    p.pos.copy(safePos);
    p.targetPos.copy(safePos);
    if (p.sprite) {
        p.sprite.position.copy(safePos);
        p.sprite.position.y = 2.2;
    }
    if (p.hpBarSprite) {
        p.hpBarSprite.position.set(safePos.x, safePos.y + 2.5, safePos.z);
    }
    if (p.energyBarSprite) {
        p.energyBarSprite.position.set(safePos.x, safePos.y + 3.05, safePos.z);
    }
    if (p.light) {
        p.light.position.copy(safePos);
    }
};

window.Game.initScene = function(container) {
    window.Game.scene = new THREE.Scene();
    window.Game.scene.background = new THREE.Color(0xd27d2d);
    window.Game.scene.fog = new THREE.FogExp2(0xd27d2d, 0.02);

    const viewport = window.Game.getViewportTuning();
    window.Game.camera = new THREE.PerspectiveCamera(viewport.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.Game.camera.position.set(0, viewport.cameraHeight, viewport.cameraDistance);
    window.Game.camera.lookAt(0, 0, 0);

    window.Game.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    window.Game.renderer.setPixelRatio(window.Game.getRendererPixelRatio());
    window.Game.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(window.Game.renderer.domElement);

    window.Game.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    window.Game.hemiLight.position.set(0, 20, 0);
    window.Game.scene.add(window.Game.hemiLight);

    window.Game.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    window.Game.dirLight.position.set(-10, 20, -10);
    window.Game.scene.add(window.Game.dirLight);

    // NOTE: Ground and Obstacles are now created inside the texture load callbacks in main.js to ensure textures map correctly.
};

window.Game.createGround = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;

    if (window.Game.groundMesh) {
        scene.remove(window.Game.groundMesh);
        window.Game.groundMesh.geometry.dispose();
        window.Game.groundMesh.material.dispose();
    }

    const groundTexKey = 'ground_' + state.stage;
    if (state.useGraphicsMode && state.textures[groundTexKey]) {
        const tex = state.textures[groundTexKey].clone();
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16); // Repeating tiled pattern
        tex.needsUpdate = true; // Force WebGL texture refresh
        
        const geom = new THREE.PlaneGeometry(window.Game.MAP_SIZE, window.Game.MAP_SIZE);
        const mat = new THREE.MeshLambertMaterial({ map: tex });
        window.Game.groundMesh = new THREE.Mesh(geom, mat);
    } else {
        // Solid color fallback based on stage (dark desert, dark crimson soil, dark necromancy stone)
        const stageColors = [0x3c2d1e, 0x421212, 0x0d1c0d];
        const geom = new THREE.PlaneGeometry(window.Game.MAP_SIZE, window.Game.MAP_SIZE);
        const mat = new THREE.MeshLambertMaterial({ color: stageColors[state.stage - 1] || 0x3c2d1e });
        window.Game.groundMesh = new THREE.Mesh(geom, mat);
    }

    window.Game.groundMesh.rotation.x = -Math.PI / 2;
    window.Game.groundMesh.position.y = 0;
    scene.add(window.Game.groundMesh);
};

window.Game.createObstacles = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;
    
    // Clear old obstacles array
    state.obstacles = [];

    // Generate clearer wall segments with strong rectangular ratios.
    for (let i = 0; i < window.Game.OBSTACLE_COUNT; i++) {
        const horizontal = Math.random() < 0.5;
        const longSide = Math.random() * 14 + 20;
        const shortSide = Math.random() * 3 + 6;
        const width = horizontal ? longSide : shortSide;
        const depth = horizontal ? shortSide : longSide;
        const height = Math.random() * 10 + 24;

        let x, z;
        let valid = false;
        let attempts = 0;
        while (!valid && attempts < 120) {
            attempts++;
            x = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            z = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            const nearSpawn = Math.abs(x) < 18 && Math.abs(z) < 18;
            if (!nearSpawn && !window.Game.isFootprintBlocked(x, z, width / 2, depth / 2, 4.5)) {
                valid = true;
            }
        }
        if (!valid) continue;
        
        const geom = new THREE.BoxGeometry(width, height, depth);
        let mat;
        if (state.useGraphicsMode && state.textures.wall) {
            const wallTex = state.textures.wall.clone();
            wallTex.wrapS = THREE.RepeatWrapping;
            wallTex.wrapT = THREE.RepeatWrapping;
            wallTex.repeat.set(width / 8, height / 8);
            wallTex.needsUpdate = true; // Force WebGL texture refresh
            mat = new THREE.MeshLambertMaterial({ 
                map: wallTex,
                emissive: 0x020202,
                transparent: true,
                opacity: 1
            });
        } else {
            mat = new THREE.MeshLambertMaterial({ 
                color: 0x2c2c36, 
                emissive: 0x0a0a0f,
                transparent: true,
                opacity: 1
            });
        }
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, height / 2, z);
        mesh.userData.baseOpacity = 1;
        mesh.userData.targetOpacity = 1;
        
        scene.add(mesh);
        
        state.obstacles.push({
            mesh: mesh,
            x: x,
            z: z,
            width: width,
            depth: depth,
            orientation: horizontal ? 'horizontal' : 'vertical',
            xMin: x - width / 2,
            xMax: x + width / 2,
            zMin: z - depth / 2,
            zMax: z + depth / 2
        });
    }
};

window.Game.updateObstacleOcclusion = function(camera, playerSprite, delta) {
    const state = window.Game.state;
    const fadeDelta = Math.min(1, (delta || 0.016) * 8);

    for (const obs of state.obstacles || []) {
        if (!obs.mesh || !obs.mesh.material) continue;
        obs.mesh.userData.targetOpacity = 1;
    }

    if (!camera || !playerSprite || !state.obstacles || state.obstacles.length === 0) {
        return;
    }

    window.Game.occlusionRaycaster = window.Game.occlusionRaycaster || new THREE.Raycaster();

    const playerFocus = playerSprite.position.clone();
    playerFocus.y += 0.6;

    const rayDirection = new THREE.Vector3().subVectors(playerFocus, camera.position);
    const rayLength = rayDirection.length();
    if (rayLength <= 0.001) {
        return;
    }

    rayDirection.normalize();
    window.Game.occlusionRaycaster.set(camera.position, rayDirection);
    window.Game.occlusionRaycaster.near = 0.1;
    window.Game.occlusionRaycaster.far = rayLength - 0.35;

    const obstacleMeshes = state.obstacles
        .map(obs => obs.mesh)
        .filter(Boolean);
    const hits = window.Game.occlusionRaycaster.intersectObjects(obstacleMeshes, false);
    for (const hit of hits) {
        if (!hit.object || !hit.object.userData) continue;
        hit.object.userData.targetOpacity = 0.18;
    }

    for (const obs of state.obstacles || []) {
        if (!obs.mesh || !obs.mesh.material) continue;
        const currentOpacity = typeof obs.mesh.material.opacity === 'number' ? obs.mesh.material.opacity : 1;
        const targetOpacity = typeof obs.mesh.userData.targetOpacity === 'number' ? obs.mesh.userData.targetOpacity : 1;
        obs.mesh.material.opacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, fadeDelta);
        obs.mesh.material.depthWrite = obs.mesh.material.opacity > 0.95;
    }
};

// Returns true if a position overlaps any obstacle bounding box, building, or goes out-of-bounds
window.Game.checkCollision = function(pos, radius = 1.0) {
    const state = window.Game.state;

    // 1. Check obstacle boxes (walls)
    for (let obs of state.obstacles) {
        if (pos.x >= obs.xMin - radius && pos.x <= obs.xMax + radius &&
            pos.z >= obs.zMin - radius && pos.z <= obs.zMax + radius) {
            return true;
        }
    }

    // 2. Check buildings (scaled to 12, treating each as 12x12 boundary sphere/box)
    if (state.buildings) {
        for (let b of state.buildings) {
            const halfWidth = b.halfWidth || 6.0;
            const halfDepth = b.halfDepth || 6.0;
            if (pos.x >= b.pos.x - halfWidth - radius && pos.x <= b.pos.x + halfWidth + radius &&
                pos.z >= b.pos.z - halfDepth - radius && pos.z <= b.pos.z + halfDepth + radius) {
                return true;
            }
        }
    }
    
    // Grid boundary check (prevent player from walking off map)
    const halfMap = window.Game.MAP_SIZE / 2;
    if (Math.abs(pos.x) > halfMap || Math.abs(pos.z) > halfMap) {
        return true;
    }
    
    return false;
};

window.Game.clearSceneObjects = function() {
    const scene = window.Game.scene;
    const state = window.Game.state;

    // 1. Remove obstacles
    if (state.obstacles) {
        state.obstacles.forEach(obs => {
            scene.remove(obs.mesh);
            obs.mesh.geometry.dispose();
            obs.mesh.material.dispose();
        });
        state.obstacles = [];
    }

    // 2. Remove buildings
    if (state.buildings) {
        state.buildings.forEach(b => {
            scene.remove(b.sprite);
            b.sprite.material.dispose();
        });
        state.buildings = [];
    }

    // 3. Remove enemies
    if (state.enemies) {
        state.enemies.forEach(e => {
            scene.remove(e.sprite);
            if (e.hpBarSprite) {
                scene.remove(e.hpBarSprite);
                e.hpBarSprite.material.dispose();
            }
            e.sprite.material.dispose();
        });
        state.enemies = [];
    }

    // 4. Remove projectiles
    if (state.projectiles) {
        state.projectiles.forEach(p => {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        state.projectiles = [];
    }

    // 5. Remove Holy Relic Sprite if active
    if (window.Game.relicSprite) {
        scene.remove(window.Game.relicSprite);
        if (window.Game.relicSprite.material) {
            window.Game.relicSprite.material.dispose();
        }
        window.Game.relicSprite = null;
    }

    // 6. Remove player energy/support/ultimate sprites if active
    if (state.player) {
        if (state.player.holyDemonSupportSprite) {
            scene.remove(state.player.holyDemonSupportSprite);
            if (state.player.holyDemonSupportSprite.material) state.player.holyDemonSupportSprite.material.dispose();
            state.player.holyDemonSupportSprite = null;
        }
        if (state.player.holyDemonUltimateSprite) {
            scene.remove(state.player.holyDemonUltimateSprite);
            if (state.player.holyDemonUltimateSprite.material) state.player.holyDemonUltimateSprite.material.dispose();
            state.player.holyDemonUltimateSprite = null;
        }
    }

    // Keep only the player sprite inside entities array
    state.entities = [];
    if (state.player && state.player.sprite) {
        state.entities.push(state.player.sprite);
    }
};

window.Game.handleResize = function() {
    const camera = window.Game.camera;
    const renderer = window.Game.renderer;
    if (camera && renderer) {
        const viewport = window.Game.getViewportTuning();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.fov = viewport.fov;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(window.Game.getRendererPixelRatio());
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

window.Game.shakeCamera = function() {
    let shakeTime = 20;
    const camera = window.Game.camera;
    if (!camera) return;
    const originalY = camera.position.y;
    const originalZ = camera.position.z;
    
    const interval = setInterval(() => {
        if (shakeTime <= 0) {
            clearInterval(interval);
            camera.position.y = originalY;
            camera.position.z = originalZ;
            return;
        }
        camera.position.y = originalY + (Math.random() - 0.5) * 1.5;
        camera.position.z = originalZ + (Math.random() - 0.5) * 1.5;
        shakeTime--;
    }, 50);
};
