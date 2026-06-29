// Game runtime state and object tracking (Global Namespace)

window.Game = window.Game || {};

window.Game.state = {
    gameActive: false,
    gameTime: 0,
    bossSpawned: false,
    midBossSpawned: false,
    timeToMidBoss: 80, // Initialized to 80 seconds
    timeToBoss: 120, // Initialized to 120 seconds
    
    useGraphicsMode: true,       // Set via Start Screen
    selectedCharacter: 'priest', // 'priest' or 'nun'
    audioEnabled: true,          // BGM status
    stage: 1,                    // Current level (1, 2, or 3)
    cycleTier: 1,                // 1 = first cycle, 2+ = higher cycle difficulty
    enemiesDefeated: 0,          // Track number of enemies defeated
    cameraAngle: 0,              // Track camera rotation angle
    textures: {},                // Loaded sprites container

    entities: [],     // WebGL entities list for raycaster intersection checks
    buildings: [],    // Ruined & repaired buildings list
    enemies: [],      // Active minions & bosses list
    projectiles: [],  // Floating bullets list
    obstacles: [],    // Non-passable 3D city obstacles list

    holyEnergy: 0,    // Holy energy bar progress (0 - 100)

    player: {
        sprite: null,
        hpBarSprite: null, // Floating viewport-facing health bar
        energyBarSprite: null, // Floating saint/demon energy bar
        pos: new THREE.Vector3(0, 1.5, 0),
        targetPos: new THREE.Vector3(0, 1.5, 0),
        speed: 6,
        hp: 150,
        maxHp: 150,
        autoShootTimer: 0,
        autoShootInterval: 0.8,
        facingDir: 1,
        holyDemonEnergy: 0,
        holyDemonSupportCooldown: 0,
        holyDemonUltimateCooldown: 0,
        holyDemonSupportDuration: 0,
        holyDemonUltimateDuration: 0,
        holyDemonSupportTriggeredThisCharge: false,
        holyDemonSupportActive: false,
        holyDemonUltimateActive: false,
        holyDemonSupportSprite: null,
        holyDemonUltimateSprite: null,
        holyDemonSupportShotTimer: 0,
        holyDemonUltimatePulseTimer: 0,
        relicFound: false,
        
        // Debuff timers in seconds
        slowTimer: 0,
        weakenTimer: 0,
        curseTimer: 0
    },

    boss: null
};
