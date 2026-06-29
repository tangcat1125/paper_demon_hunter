// Game configuration and constants (Global Namespace)

window.Game = window.Game || {};

window.Game.MAP_SIZE = 120; // Grid total size 120x120
window.Game.DAY_DURATION = 60; // One full cycle duration in seconds

window.Game.TOTAL_BUILDINGS = 10; // Increased to 10 buildings for energy harvesting
window.Game.INITIAL_MID_BOSS_TIMER = 80; // 80 seconds countdown for Mid-Boss
window.Game.INITIAL_BOSS_TIMER = 120; // 120 seconds countdown for Vampire Lord
window.Game.OBSTACLE_COUNT = 10; // Total number of 3D non-passable obstacles

window.Game.CLEAR_FLAG_KEY = 'paper_demon_hunter_cycle_1_cleared';

window.Game.getCycleTier = function() {
    try {
        return localStorage.getItem(window.Game.CLEAR_FLAG_KEY) === '1' ? 2 : 1;
    } catch (err) {
        return 1;
    }
};

window.Game.markFirstCycleCleared = function() {
    try {
        localStorage.setItem(window.Game.CLEAR_FLAG_KEY, '1');
    } catch (err) {
        // Ignore storage failures and fall back to first-cycle tuning next load.
    }
};

window.Game.getDifficultyProfile = function() {
    const state = window.Game.state || {};
    const stage = state.stage || 1;
    const cycleTier = state.cycleTier || window.Game.getCycleTier();

    const defaultProfile = {
        cycleTier,
        stage,
        minionHpScale: 1,
        minionSpeedScale: 1,
        minionDamageScale: 1,
        minionSpecialScale: 1,
        minionSpawnIntervalBase: 3.0,
        minionSpawnIntervalDecay: 0.45,
        minionSpawnIntervalMin: 0.8,
        maxMinionsBase: 8,
        maxMinionsBossBase: 15,
        maxMinionsUpgradeStep: 2,
        midBossHpScale: 1,
        midBossSpeedScale: 1,
        midBossDamageScale: 1,
        bossHpScale: 1,
        bossSpeedScale: 1,
        bossDamageScale: 1,
        supportTriggerEnergy: 50,
        ultimateTriggerEnergy: 100,
        supportCooldown: 75,
        ultimateCooldown: 110,
        playerBaseSpeed: 6,
        playerSpeedUpgradeEvery: 8,
        playerSpeedUpgradeStep: 0.08,
        playerSpeedCap: 1.35,
        midBossTimer: 80,
        bossTimer: 120
    };

    if (cycleTier > 1) {
        return defaultProfile;
    }

    const firstCycleProfiles = {
        1: {
            minionHpScale: 0.5,
            minionSpeedScale: 0.5,
            minionDamageScale: 0.5,
            minionSpecialScale: 1.55,
            minionSpawnIntervalBase: 6.2,
            minionSpawnIntervalDecay: 0.1,
            minionSpawnIntervalMin: 2.8,
            maxMinionsBase: 3,
            maxMinionsBossBase: 4,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.5,
            midBossSpeedScale: 0.55,
            midBossDamageScale: 0.5,
            bossHpScale: 0.5,
            bossSpeedScale: 0.55,
            bossDamageScale: 0.5,
            supportCooldown: 55,
            ultimateCooldown: 85,
            playerBaseSpeed: 6.25,
            playerSpeedUpgradeEvery: 12,
            playerSpeedUpgradeStep: 0.02,
            playerSpeedCap: 1.08,
            midBossTimer: 110,
            bossTimer: 175
        },
        2: {
            minionHpScale: 0.5,
            minionSpeedScale: 0.55,
            minionDamageScale: 0.5,
            minionSpecialScale: 1.45,
            minionSpawnIntervalBase: 5.5,
            minionSpawnIntervalDecay: 0.12,
            minionSpawnIntervalMin: 2.4,
            maxMinionsBase: 3,
            maxMinionsBossBase: 5,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.5,
            midBossSpeedScale: 0.6,
            midBossDamageScale: 0.5,
            bossHpScale: 0.5,
            bossSpeedScale: 0.6,
            bossDamageScale: 0.5,
            supportCooldown: 58,
            ultimateCooldown: 90,
            playerBaseSpeed: 6.2,
            playerSpeedUpgradeEvery: 12,
            playerSpeedUpgradeStep: 0.025,
            playerSpeedCap: 1.1,
            midBossTimer: 102,
            bossTimer: 165
        },
        3: {
            minionHpScale: 0.5,
            minionSpeedScale: 0.6,
            minionDamageScale: 0.5,
            minionSpecialScale: 1.35,
            minionSpawnIntervalBase: 4.9,
            minionSpawnIntervalDecay: 0.14,
            minionSpawnIntervalMin: 2.1,
            maxMinionsBase: 4,
            maxMinionsBossBase: 6,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.5,
            midBossSpeedScale: 0.65,
            midBossDamageScale: 0.5,
            bossHpScale: 0.5,
            bossSpeedScale: 0.65,
            bossDamageScale: 0.5,
            supportCooldown: 62,
            ultimateCooldown: 95,
            playerBaseSpeed: 6.15,
            playerSpeedUpgradeEvery: 11,
            playerSpeedUpgradeStep: 0.03,
            playerSpeedCap: 1.12,
            midBossTimer: 96,
            bossTimer: 155
        }
    };

    return Object.assign({}, defaultProfile, firstCycleProfiles[stage] || {});
};
