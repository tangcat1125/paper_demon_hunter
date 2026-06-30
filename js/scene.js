// Three.js Scene Setup, Lighting, Camera, 3D Obstacles generation, and Collision checking (Global Namespace)

window.Game = window.Game || {};

window.Game.scene = null;
window.Game.camera = null;
window.Game.renderer = null;
window.Game.hemiLight = null;
window.Game.dirLight = null;

window.Game.getRendererPixelRatio = function() {
    const baseRatio = window.devicePixelRatio || 1;
    return Math.min(baseRatio, window.Game.isMobileGraphicsDevice && window.Game.isMobileGraphicsDevice() ? 1.5 : 2);
};

window.Game.getViewportTuning = function() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
        return {
            isPortrait: true,
            cameraDistance: 25,
            cameraHeight: 16,
            lookAhead: 7,
            fov: 72
        };
    }
    return {
        isPortrait: false,
        cameraDistance: 18,
        cameraHeight: 12,
        lookAhead: 5,
        fov: 60
    };
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

    // Scale obstacles to be 3x character size (characters are scale 4)
    for (let i = 0; i < window.Game.OBSTACLE_COUNT; i++) {
        const width = Math.random() * 6 + 12; // Width 12 to 18 (3x to 4.5x character scale)
        const depth = Math.random() * 6 + 12; // Depth 12 to 18
        const height = Math.random() * 15 + 25; // Height 25 to 40 (towering buildings/walls)
        
        let x, z;
        let valid = false;
        while (!valid) {
            x = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            z = (Math.random() - 0.5) * (window.Game.MAP_SIZE - 30);
            // Ensure they don't spawn right on top of player's center spawn point (0,0)
            if (Math.hypot(x, z) > 25) {
                valid = true;
            }
        }
        
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
                emissive: 0x020202
            });
        } else {
            mat = new THREE.MeshLambertMaterial({ 
                color: 0x2c2c36, 
                emissive: 0x0a0a0f
            });
        }
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, height / 2, z);
        
        scene.add(mesh);
        
        state.obstacles.push({
            mesh: mesh,
            x: x,
            z: z,
            width: width,
            depth: depth,
            xMin: x - width / 2,
            xMax: x + width / 2,
            zMin: z - depth / 2,
            zMax: z + depth / 2
        });
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
            const dx = pos.x - b.pos.x;
            const dz = pos.z - b.pos.z;
            const dist = Math.hypot(dx, dz);
            // 6.0 is half of the building scale 12
            if (dist < 6.0 + radius) {
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
