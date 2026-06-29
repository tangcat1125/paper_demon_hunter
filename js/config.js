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
            minionHpScale: 0.72,
            minionSpeedScale: 0.72,
            minionDamageScale: 0.62,
            minionSpecialScale: 1.25,
            minionSpawnIntervalBase: 4.8,
            minionSpawnIntervalDecay: 0.16,
            minionSpawnIntervalMin: 1.9,
            maxMinionsBase: 4,
            maxMinionsBossBase: 6,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.72,
            midBossSpeedScale: 0.78,
            midBossDamageScale: 0.65,
            bossHpScale: 0.6,
            bossSpeedScale: 0.8,
            bossDamageScale: 0.6,
            playerBaseSpeed: 6.1,
            playerSpeedUpgradeEvery: 10,
            playerSpeedUpgradeStep: 0.03,
            playerSpeedCap: 1.12,
            midBossTimer: 100,
            bossTimer: 155
        },
        2: {
            minionHpScale: 0.82,
            minionSpeedScale: 0.82,
            minionDamageScale: 0.74,
            minionSpecialScale: 1.15,
            minionSpawnIntervalBase: 4.1,
            minionSpawnIntervalDecay: 0.2,
            minionSpawnIntervalMin: 1.55,
            maxMinionsBase: 5,
            maxMinionsBossBase: 8,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.84,
            midBossSpeedScale: 0.86,
            midBossDamageScale: 0.76,
            bossHpScale: 0.77,
            bossSpeedScale: 0.88,
            bossDamageScale: 0.74,
            playerBaseSpeed: 6.05,
            playerSpeedUpgradeEvery: 10,
            playerSpeedUpgradeStep: 0.04,
            playerSpeedCap: 1.16,
            midBossTimer: 92,
            bossTimer: 145
        },
        3: {
            minionHpScale: 0.9,
            minionSpeedScale: 0.9,
            minionDamageScale: 0.84,
            minionSpecialScale: 1.08,
            minionSpawnIntervalBase: 3.6,
            minionSpawnIntervalDecay: 0.24,
            minionSpawnIntervalMin: 1.35,
            maxMinionsBase: 6,
            maxMinionsBossBase: 10,
            maxMinionsUpgradeStep: 1,
            midBossHpScale: 0.92,
            midBossSpeedScale: 0.92,
            midBossDamageScale: 0.86,
            bossHpScale: 0.87,
            bossSpeedScale: 0.94,
            bossDamageScale: 0.84,
            playerBaseSpeed: 6.0,
            playerSpeedUpgradeEvery: 9,
            playerSpeedUpgradeStep: 0.045,
            playerSpeedCap: 1.2,
            midBossTimer: 86,
            bossTimer: 135
        }
    };

    return Object.assign({}, defaultProfile, firstCycleProfiles[stage] || {});
};
